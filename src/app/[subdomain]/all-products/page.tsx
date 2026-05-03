"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
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
import { getTenantPath, cn } from "@/lib/utils";
import * as fpixel from "@/lib/fpixel";

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

    const handleOpenCart = () => setIsCartOpen(true);
    window.addEventListener('open-cart', handleOpenCart);
    return () => window.removeEventListener('open-cart', handleOpenCart);
  }, [subdomain]);

  const searchParams = useSearchParams();
  useEffect(() => {
    const query = searchParams.get("search");
    if (query) {
      setSearchTerm(query);
    }
  }, [searchParams]);

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

      // Fetch products with fallback
      let prodSnap;
      try {
        const prodQuery = query(collection(db, "products"), where("storeId", "==", storeData.id), orderBy("createdAt", "desc"));
        prodSnap = await getDocs(prodQuery);
      } catch (error) {
        console.warn("Catalog sort failed, falling back to unsorted:", error);
        const prodQuery = query(collection(db, "products"), where("storeId", "==", storeData.id));
        prodSnap = await getDocs(prodQuery);
      }

      const catSnap = await getDocs(query(collection(db, "categories"), where("storeId", "==", storeData.id)));

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
    
    fpixel.event('AddToCart', {
      content_name: product.name,
      content_ids: [product.id],
      content_type: 'product',
      value: product.currentPrice,
      currency: 'USD'
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        fpixel.event('Search', {
          search_string: searchTerm
        });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
                placeholder="Search catalog..." 
                className="pl-9 rounded-xl h-11 bg-white border-slate-200 shadow-inner" 
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
            <div className="grid grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {paginatedProducts.map((p) => (
                <Card key={p.id} className="group bg-white rounded-[32px] overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col">
                  <Link href={getTenantPath(subdomain, `/product/${p.slug}`)} className="block aspect-square relative overflow-hidden bg-slate-50 border-b border-slate-100">
                    {p.featuredImage && <img src={p.featuredImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={p.name} />}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    {p.prevPrice && <div className="absolute top-4 left-4 bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Sale</div>}
                  </Link>
                  <div className="p-4 md:p-6 space-y-3 md:space-y-4 flex-1 flex flex-col">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-800 line-clamp-2 min-h-[40px] group-hover:text-primary transition-colors">{p.name}</h4>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-black text-slate-900">${Number(p.currentPrice).toFixed(2)}</p>
                        {p.prevPrice && <p className="text-slate-300 text-xs line-through font-bold">${p.prevPrice}</p>}
                      </div>
                    </div>
                    
                    <div className="pt-1 space-y-1.5 mt-auto">
                      <Button 
                        className="w-full h-auto py-3 md:h-12 rounded-lg md:rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest bg-slate-900 hover:bg-primary transition-all"
                        onClick={() => addToCart(p)}
                      >
                        <ShoppingCart className="mr-1.5 w-3.5 h-3.5 md:w-4 md:h-4" /> কার্টে যোগ করুন
                      </Button>
                      <Link href={getTenantPath(subdomain, `/product/${p.slug}`)} className="block">
                        <Button variant="outline" className="w-full h-9 md:h-12 rounded-lg md:rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest border-slate-200 hover:bg-slate-50 transition-all">
                          Buy Now
                        </Button>
                      </Link>
                    </div>
                  </div>
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

      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-none rounded-l-[32px] overflow-hidden shadow-2xl">
          <SheetHeader className="p-3 md:p-4 bg-slate-900 text-white shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-headline font-black text-white flex items-center gap-3 uppercase tracking-tight">
                <ShoppingCart className="w-5 h-5 text-primary" />
                আপনার ব্যাগ
              </SheetTitle>
              <SheetClose className="text-white/60 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </SheetClose>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1 px-6 py-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-20">
                <ShoppingBag className="w-16 h-16" />
                <p className="text-[10px] font-black uppercase tracking-widest">ব্যাগ খালি</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <div className="w-14 h-14 rounded-xl bg-white overflow-hidden border shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-[11px] truncate pr-4">{item.name}</h4>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-primary font-black text-xs">${item.price.toFixed(2)}</p>
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-50 rounded transition-all">
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-5 text-center text-[10px] font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-50 rounded transition-all">
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <SheetFooter className="p-3 md:p-4 bg-white border-t shrink-0">
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">মোট মূল্য</span>
                <span className="text-lg font-black text-primary">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <SheetClose asChild>
                  <Button variant="outline" className="flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-500 hover:bg-slate-50">ফিরুন</Button>
                </SheetClose>
                <Link href={getTenantPath(subdomain, "/checkout")} className="flex-[2]">
                  <Button className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20" disabled={cart.length === 0}>অর্ডার করুন</Button>
                </Link>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
