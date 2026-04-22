"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ShoppingCart, Search, Menu, X, Plus, Minus, Trash2, Filter, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { getTenantPath } from "@/lib/utils";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export default function AllProductsPage() {
  const { subdomain: rawSubdomain } = useParams();
  const subdomain = typeof rawSubdomain === 'string' ? rawSubdomain.toLowerCase() : '';
  
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Filters & Sorting
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  const router = useRouter();

  useEffect(() => {
    if (subdomain) {
      fetchStoreData();
      const savedCart = localStorage.getItem(`cart_${subdomain}`);
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error("Cart parse error", e);
        }
      }
    }
  }, [subdomain]);

  useEffect(() => {
    if (subdomain && cart.length >= 0) {
      localStorage.setItem(`cart_${subdomain}`, JSON.stringify(cart));
    }
  }, [cart, subdomain]);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const storeQuery = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQuery);
      
      if (storeSnap.empty) {
        setStore(null);
        setLoading(false);
        return;
      }

      const storeData = { id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() };
      setStore(storeData);

      const [prodSnap, catSnap] = await Promise.all([
        getDocs(query(collection(db, "products"), where("storeId", "==", storeData.id))),
        getDocs(query(collection(db, "categories"), where("storeId", "==", storeData.id)))
      ]);

      setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: Number(product.currentPrice),
        image: product.featuredImage || (product.gallery && product.gallery[0]),
        quantity: 1
      }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      const matchesPrice = p.currentPrice >= priceRange[0] && p.currentPrice <= priceRange[1];
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesPrice && matchesSearch;
    });

    if (sortBy === "price-low") result.sort((a, b) => a.currentPrice - b.currentPrice);
    else if (sortBy === "price-high") result.sort((a, b) => b.currentPrice - a.currentPrice);
    else if (sortBy === "newest") result.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    return result;
  }, [products, selectedCategory, priceRange, sortBy, searchTerm]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/30 pb-20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={getTenantPath(subdomain, "/")} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-md">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-headline font-black tracking-tighter text-slate-900 uppercase">
              {store?.name}
            </h1>
          </Link>
          
          <div className="flex items-center gap-2">
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl bg-white border border-slate-100 shadow-sm">
                  <ShoppingCart className="w-4 h-4 text-slate-700" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[9px] font-black text-white flex items-center justify-center rounded-full border-2 border-white">
                      {cart.reduce((acc, i) => acc + i.quantity, 0)}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-none rounded-l-3xl shadow-2xl">
                <SheetHeader className="p-8 bg-slate-900 text-white shrink-0">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-2xl font-headline font-black text-white flex items-center gap-3 uppercase tracking-tight">
                      <ShoppingCart className="w-6 h-6 text-primary" />
                      Your Cart
                    </SheetTitle>
                    <SheetClose className="text-white/60 hover:text-white"><X className="w-7 h-7" /></SheetClose>
                  </div>
                </SheetHeader>
                <ScrollArea className="flex-1 px-8 py-6">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-20">
                      <ShoppingBag className="w-16 h-16 mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest">Cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {cart.map((item) => (
                        <div key={item.id} className="flex gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="w-16 h-16 rounded-xl bg-white overflow-hidden border shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-xs truncate pr-4">{item.name}</h4>
                              <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-primary font-black text-sm">${(item.price).toFixed(2)}</p>
                              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-50 rounded"><Minus className="w-3 h-3" /></button>
                                <span className="w-6 text-center text-[10px] font-bold">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-50 rounded"><Plus className="w-3 h-3" /></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <SheetFooter className="p-8 bg-white border-t shrink-0">
                  <div className="w-full space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subtotal</span>
                      <span className="text-2xl font-black text-primary">${cartTotal.toFixed(2)}</span>
                    </div>
                    <Link href={getTenantPath(subdomain, "/checkout")} className="w-full">
                      <Button className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20" disabled={cart.length === 0}>
                        Checkout Now
                      </Button>
                    </Link>
                    <SheetClose asChild>
                      <Button variant="ghost" className="w-full h-12 text-slate-400 font-bold uppercase text-[10px]">Continue Shopping</Button>
                    </SheetClose>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Main Catalog View */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-1">
            <h2 className="text-3xl sm:text-5xl font-headline font-black tracking-tighter uppercase">All Products</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Browsing {filteredProducts.length} Results</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Find something..." 
                className="pl-9 rounded-xl h-11 bg-white border-slate-200" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 h-11 rounded-xl bg-white border-slate-200">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl bg-white shadow-sm border-slate-200">
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-sm rounded-l-3xl p-0 border-none shadow-2xl">
                <SheetHeader className="p-8 bg-slate-900 text-white flex flex-row items-center justify-between">
                  <SheetTitle className="text-xl font-headline font-black text-white uppercase tracking-tight">Filter Products</SheetTitle>
                  <SheetClose className="text-white/60 hover:text-white shrink-0">
                    <X className="w-7 h-7" />
                  </SheetClose>
                </SheetHeader>
                <div className="p-8 space-y-10">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categories</Label>
                    <div className="grid gap-2">
                       <button 
                         onClick={() => setSelectedCategory("all")}
                         className={`flex items-center justify-between p-3 rounded-xl transition-all ${selectedCategory === "all" ? 'bg-primary text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                       >
                         <span className="font-bold text-sm">All Categories</span>
                         {selectedCategory === "all" && <Check className="w-4 h-4" />}
                       </button>
                       {categories.map((cat) => (
                         <button 
                           key={cat.id}
                           onClick={() => setSelectedCategory(cat.slug)}
                           className={`flex items-center justify-between p-3 rounded-xl transition-all ${selectedCategory === cat.slug ? 'bg-primary text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                         >
                           <span className="font-bold text-sm">{cat.name}</span>
                           {selectedCategory === cat.slug && <Check className="w-4 h-4" />}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Price Range</Label>
                      <span className="text-sm font-black text-primary">${priceRange[0]} - ${priceRange[1]}</span>
                    </div>
                    <Slider 
                      defaultValue={[0, 10000]} 
                      max={10000} 
                      step={50} 
                      value={priceRange}
                      onValueChange={(val: any) => setPriceRange(val as [number, number])}
                    />
                  </div>
                </div>
                <SheetFooter className="p-8 border-t flex flex-col gap-3">
                  <SheetClose asChild>
                    <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">Apply Filters</Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button variant="ghost" className="w-full h-12 rounded-xl text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cancel & Close</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Product Grid */}
        {paginatedProducts.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 opacity-20">
                <ShoppingBag className="w-10 h-10" />
             </div>
             <h3 className="text-xl font-bold text-slate-900">No products match your criteria</h3>
             <p className="text-slate-400 mt-2">Try adjusting your filters or search term.</p>
             <Button variant="link" className="mt-4 font-black" onClick={() => { setSelectedCategory("all"); setPriceRange([0, 10000]); setSearchTerm(""); }}>Clear All Filters</Button>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {paginatedProducts.map((p) => (
                <Card key={p.id} className="group bg-white rounded-2xl overflow-hidden border-none shadow-sm hover:shadow-md transition-all active:scale-95">
                  <CardContent className="p-0">
                    <Link href={getTenantPath(subdomain, `/product/${p.slug}`)} className="block aspect-square relative overflow-hidden bg-slate-50 border-b">
                      {p.featuredImage && <img src={p.featuredImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={p.name} />}
                      {p.prevPrice && <div className="absolute top-2 left-2 bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Sale</div>}
                    </Link>
                    <div className="p-4 space-y-2">
                      <Link href={getTenantPath(subdomain, `/product/${p.slug}`)} className="block min-h-[40px]">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-2 group-hover:text-primary transition-colors">{p.name}</h4>
                      </Link>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex flex-col">
                          <p className="text-primary font-black text-base">${Number(p.currentPrice).toFixed(2)}</p>
                          {p.prevPrice && <p className="text-slate-300 text-[9px] line-through">${p.prevPrice}</p>}
                        </div>
                        <Button size="icon" variant="secondary" className="h-9 w-9 rounded-xl shadow-sm hover:bg-primary hover:text-white" onClick={(e) => { e.preventDefault(); addToCart(p); }}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-12 border-t border-slate-100">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-xl h-10 w-10" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button 
                    key={i} 
                    variant={currentPage === i + 1 ? "default" : "ghost"}
                    className={`h-10 w-10 rounded-xl font-bold ${currentPage === i + 1 ? 'shadow-lg shadow-primary/20' : ''}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-xl h-10 w-10" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
