"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSupabaseClient } from "@/supabase";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ShoppingCart, X, Plus, Minus, Trash2, SlidersHorizontal, ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { getTenantPath, getCurrencySymbol } from "@/lib/utils";

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
  const supabase = useSupabaseClient();

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Filters & Sorting
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("search") || "";
    if (q) setSearchTerm(q);
    const cat = searchParams.get("category") || "all";
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

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
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("subdomain", subdomain)
        .single();

      if (!storeData) {
        setStore(null);
        setLoading(false);
        return;
      }

      setStore(storeData);

      const [prodRes, catRes, subCatRes] = await Promise.all([
        supabase.from("products").select("*").eq("store_id", storeData.id),
        supabase.from("categories").select("*").eq("store_id", storeData.id),
        supabase.from("sub_categories").select("*").eq("store_id", storeData.id)
      ]);

      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      setSubCategories(subCatRes.data || []);
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
      const matchesCategory = selectedCategory === "all" ||
        p.category === selectedCategory ||
        (categories.find(c => c.slug === selectedCategory)?.id === p.category);

      const matchesSubCategory = selectedSubCategory === "all" ||
        p.sub_category === selectedSubCategory ||
        p.subCategory === selectedSubCategory ||
        (subCategories.find(s => s.slug === selectedSubCategory)?.id === p.sub_category) ||
        (subCategories.find(s => s.slug === selectedSubCategory)?.id === p.subCategory);

      const matchesPrice = p.currentPrice >= priceRange[0] && p.currentPrice <= priceRange[1];
      const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSubCategory && matchesPrice && matchesSearch;
    });

    if (sortBy === "price-low") result.sort((a, b) => a.currentPrice - b.currentPrice);
    else if (sortBy === "price-high") result.sort((a, b) => b.currentPrice - a.currentPrice);
    else if (sortBy === "newest") result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    return result;
  }, [products, selectedCategory, selectedSubCategory, priceRange, sortBy, searchTerm, categories, subCategories]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f7f4] pb-20">
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap');
        
        [data-radix-portal] {
          z-index: 999999 !important;
          position: relative;
        }
        .fixed.z-50, [role="dialog"], [data-state="open"] {
          z-index: 999999 !important;
        }
        .store-body {
          font-family: 'Poppins', 'Hind Siliguri', sans-serif;
          max-width: 1440px;
          margin: 0 auto;
          background: #f4f7f4;
          box-shadow: 0 0 50px rgba(0,0,0,0.05);
          min-height: 100vh;
        }
        :root {
          --green:       #2e7d32;
          --green-dark:  #1b5e20;
          --green-light: #4caf50;
          --green-pale:  #e8f5e9;
          --yellow:      #f9a825;
          --yellow-dark: #e65100;
          --red:         #d32f2f;
          --red-light:   #ffebee;
          --gray-50:     #f9fafb;
          --gray-100:    #f1f5f0;
          --gray-200:    #e2e8df;
          --gray-400:    #9aab97;
          --gray-500:    #6b7d68;
          --gray-600:    #4a5c47;
          --gray-800:    #1e2d1c;
          --gray-900:    #111b10;
          --white:       #ffffff;
          --shadow-sm:   0 1px 4px rgba(0,0,0,.07);
          --shadow-md:   0 4px 16px rgba(0,0,0,.09);
          --shadow-lg:   0 8px 32px rgba(46,125,50,.14);
          --radius-sm:   8px;
          --radius-md:   12px;
          --radius-lg:   18px;
          --radius-xl:   24px;
          --transition:  .2s ease;
        }
        .site-header {
          background: var(--white);
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 16px rgba(0,0,0,.07);
        }
        .header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 0;
        }
        .logo-link { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .logo-icon {
          width: 42px; height: 42px;
          background: var(--green);
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          box-shadow: var(--shadow-sm);
        }
        .logo-icon i { color: var(--white); font-size: 18px; }
        .logo-text-bn {
          display: block;
          font-family: 'Hind Siliguri', sans-serif;
          font-size: 17px; font-weight: 700;
          color: var(--green);
          line-height: 1.2;
        }
        .logo-text-en {
          display: block;
          font-size: 9px; font-weight: 500;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: var(--gray-400);
        }
        .location-btn {
          display: flex; align-items: center; gap: 6px;
          border: 1.5px solid var(--gray-200);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          font-size: 12.5px;
          color: var(--gray-600);
          transition: border-color var(--transition);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .location-btn:hover { border-color: var(--green); }
        .location-btn i.fa-location-dot { color: var(--green); font-size: 13px; }
        .location-btn .city { font-weight: 600; color: var(--green); }
        .location-btn i.fa-chevron-down { font-size: 10px; color: var(--gray-400); }
        .search-wrap {
          flex: 1;
          position: relative;
        }
        @media (max-width: 768px) {
          .site-header .search-wrap {
            display: none !important;
          }
          .mobile-search-dropdown .search-wrap {
            display: block !important;
          }
        }
        .search-wrap input {
          width: 100%;
          border: 1.5px solid var(--gray-200);
          border-radius: var(--radius-md);
          padding: 10px 100px 10px 16px;
          font-size: 13px;
          color: var(--gray-800);
          outline: none;
          transition: border-color var(--transition), box-shadow var(--transition);
          background: var(--white);
        }
        .search-wrap input::placeholder { color: var(--gray-400); }
        .search-wrap input:focus {
          border-color: var(--green);
          box-shadow: 0 0 0 3px rgba(46,125,50,.1);
        }
        .search-btn {
          position: absolute;
          right: 5px; top: 50%;
          transform: translateY(-50%);
          background: var(--green);
          color: var(--white);
          border-radius: var(--radius-sm);
          padding: 7px 14px;
          font-size: 13px;
          transition: background var(--transition);
          display: flex; align-items: center; gap: 6px;
        }
        .search-btn:hover { background: var(--green-dark); }
        .header-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .hdr-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: 2px; padding: 6px 10px;
          color: var(--gray-600);
          border-radius: var(--radius-sm);
          transition: color var(--transition), background var(--transition);
          font-size: 11px; font-weight: 500;
          position: relative;
        }
        .hdr-btn:hover { color: var(--green); background: var(--green-pale); }
        .hdr-btn i { font-size: 18px; }
        .cart-badge {
          position: absolute;
          top: 2px; right: 4px;
          background: var(--red);
          color: var(--white);
          font-size: 9px; font-weight: 700;
          width: 16px; height: 16px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          animation: pulse-badge 1.6s infinite;
        }
        @keyframes pulse-badge { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
        
        .product-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
        }
        .product-card {
          background: var(--white);
          border-radius: var(--radius-lg);
          border: 1.5px solid var(--gray-100);
          overflow: hidden;
          cursor: pointer;
          position: relative;
          transition: box-shadow var(--transition), transform var(--transition);
        }
        .product-card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }
        .product-card:hover .add-btn {
          opacity: 1;
          transform: translateY(0);
        }
        .pc-badge {
          position: absolute;
          top: 10px; left: 10px;
          z-index: 2;
          font-size: 10px; font-weight: 700;
          padding: 3px 9px;
          border-radius: 50px;
          letter-spacing: .03em;
        }
        .pc-badge.red    { background: var(--red);    color: var(--white); }
        .pc-badge.yellow { background: var(--yellow);  color: #5d4000; }
        .pc-badge.green  { background: var(--green);   color: var(--white); }
        .pc-badge.right  { left: auto; right: 10px; }
        
        .pc-img {
          height: 140px;
          display: flex; align-items: center; justify-content: center;
          position: relative;
        }
        .pc-img i { font-size: 62px; }
        
        .bg-green-pale  { background: #e8f5e9; }
        .bg-orange-pale { background: #fff3e0; }
        .bg-red-pale    { background: #ffebee; }
        .bg-yellow-pale { background: #fffde7; }
        .bg-purple-pale { background: #f3e5f5; }
        .bg-blue-pale   { background: #e3f2fd; }
        .bg-amber-pale  { background: #fff8e1; }
        .bg-pink-pale   { background: #fce4ec; }
        .bg-teal-pale   { background: #e0f2f1; }
        .bg-lime-pale   { background: #f9fbe7; }
        
        .pc-body { padding: 12px; }
        .pc-origin { font-size: 10.5px; color: var(--gray-400); margin-bottom: 2px; }
        .pc-name   { font-size: 13px; font-weight: 600; color: var(--gray-800); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pc-qty    { font-size: 11px; color: var(--gray-400); margin-bottom: 8px; }
        .pc-pricing { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .pc-price  { font-size: 14px; font-weight: 700; color: var(--green); }
        .pc-old    { font-size: 11.5px; color: var(--gray-400); text-decoration: line-through; }
        .add-btn {
          width: 100%;
          background: var(--green);
          color: var(--white);
          font-size: 11.5px; font-weight: 600;
          padding: 8px 0;
          border-radius: var(--radius-sm);
          opacity: 0;
          transform: translateY(6px);
          transition: opacity .22s ease, transform .22s ease, background var(--transition);
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .add-btn:hover { background: var(--green-dark); }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 20px;
          width: 100%;
        }

        @media (max-width: 1100px) {
          .product-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 900px) {
          .product-grid { grid-template-columns: repeat(3, 1fr); }
          .location-btn { display: none; }
        }
        @media (max-width: 600px) {
          .product-grid { grid-template-columns: repeat(2, 1fr); }
          .hdr-btn span { display: none; }
        }
      ` }} />

      <div className="store-body">
        {/* Navigation */}
        <header className="site-header">
          <div className="container">
            <div className="header-top">
              <Link href={getTenantPath(subdomain, "/")} className="logo-link">
                <div className="logo-icon">
                  <i className="fa-solid fa-basket-shopping"></i>
                </div>
                <div>
                  <span className="logo-text-bn">{store?.name}</span>
                  <span className="logo-text-en">Catalog Matrix</span>
                </div>
              </Link>
              <div className="search-wrap hidden md:block">
                <input
                  type="text"
                  placeholder="Search for groceries, vegetables, fruits…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="search-btn">
                  <i className="fa-solid fa-magnifying-glass"></i> Search
                </button>
              </div>
              <div className="header-actions">
                <button className="hdr-btn md:hidden" onClick={() => setMobileSearchOpen(!mobileSearchOpen)}>
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <span>Search</span>
                </button>
                <button className="hdr-btn" onClick={() => setIsCartOpen(true)}>
                  <i className="fa-solid fa-basket-shopping"></i>
                  <span>Cart</span>
                  {cart.length > 0 && (
                    <span className="cart-badge">{cart.reduce((acc, i) => acc + i.quantity, 0)}</span>
                  )}
                </button>
              </div>
            </div>
            {mobileSearchOpen && (
              <div className="mobile-search-dropdown md:hidden pb-3 pt-1 flex gap-2">
                <div className="search-wrap flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search for groceries, vegetables, fruits…"
                    className="w-full border rounded-xl px-4 py-2 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1 hover:text-[var(--green)]">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Catalog View */}
        <main className="container py-8 sm:py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div className="space-y-1">
              <h2 className="text-3xl sm:text-5xl font-headline font-black tracking-tighter uppercase text-slate-800">All Products</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Browsing {filteredProducts.length} Results</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
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
                  <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl bg-white shadow-sm border-slate-200 hover:text-[var(--green)] hover:bg-emerald-50/50">
                    <SlidersHorizontal className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-sm rounded-l-3xl p-0 border-none shadow-2xl flex flex-col h-full bg-white font-sans">
                  <SheetHeader className="p-6 bg-[var(--green)] text-white flex flex-row items-center justify-between shrink-0">
                    <SheetTitle className="text-lg font-headline font-bold text-white uppercase tracking-tight">পণ্য ফিল্টার করুন</SheetTitle>
                    <SheetClose className="text-white/80 hover:text-white shrink-0">
                      <i className="fa-solid fa-xmark text-lg"></i>
                    </SheetClose>
                  </SheetHeader>
                  <ScrollArea className="flex-1 p-6 space-y-8 bg-[#f4f7f4]">
                    <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-150 shadow-sm">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">ক্যাটাগরি</Label>
                      <div className="grid gap-2">
                        <button
                          onClick={() => {
                            setSelectedCategory("all");
                            setSelectedSubCategory("all");
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl transition-all ${selectedCategory === "all" ? 'bg-[var(--green)] text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                        >
                          <span className="font-bold text-sm">All Categories</span>
                          {selectedCategory === "all" && <Check className="w-4 h-4" />}
                        </button>
                        {categories.map((cat) => {
                          const isCatSelected = selectedCategory === cat.slug || selectedCategory === cat.id;
                          const subs = subCategories.filter(s => s.category_id === cat.id);
                          return (
                            <div key={cat.id} className="space-y-2">
                              <button
                                onClick={() => {
                                  setSelectedCategory(cat.slug);
                                  setSelectedSubCategory("all");
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isCatSelected ? 'bg-[var(--green)] text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                              >
                                <span className="font-bold text-sm">{cat.name}</span>
                                {isCatSelected && <Check className="w-4 h-4" />}
                              </button>
                              {isCatSelected && subs.length > 0 && (
                                <div className="pl-4 py-1.5 space-y-1 border-l-2 border-emerald-250 ml-4 flex flex-col items-start">
                                  <button
                                    onClick={() => setSelectedSubCategory("all")}
                                    className={`text-left py-1.5 px-3 rounded-lg text-xs font-bold transition-all w-full ${selectedSubCategory === "all" ? 'bg-emerald-50 text-[var(--green)]' : 'text-slate-500 hover:text-slate-800'}`}
                                  >
                                    All Subcategories
                                  </button>
                                  {subs.map((sub) => {
                                    const isSubSelected = selectedSubCategory === sub.slug || selectedSubCategory === sub.id;
                                    return (
                                      <button
                                        key={sub.id}
                                        onClick={() => setSelectedSubCategory(sub.slug)}
                                        className={`text-left py-1.5 px-3 rounded-lg text-xs font-bold transition-all w-full ${isSubSelected ? 'bg-emerald-50 text-[var(--green)]' : 'text-slate-500 hover:text-slate-800'}`}
                                      >
                                        {sub.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-6 bg-white p-5 rounded-2xl border border-slate-150 shadow-sm mt-4">
                      <div className="flex justify-between items-end">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">সর্বোচ্চ মূল্য</Label>
                        <span className="text-sm font-extrabold text-[var(--green)]">{getCurrencySymbol(store?.currency)}{priceRange[0]} - {getCurrencySymbol(store?.currency)}{priceRange[1]}</span>
                      </div>
                      <Slider
                        defaultValue={[0, 10000]}
                        max={10000}
                        step={50}
                        value={priceRange}
                        onValueChange={(val: any) => setPriceRange(val as [number, number])}
                      />
                    </div>
                  </ScrollArea>
                  <SheetFooter className="p-6 bg-white border-t flex flex-col gap-3 shrink-0">
                    <Button variant="outline" className="w-full h-12 rounded-xl text-xs font-bold border-slate-200 text-slate-500" onClick={() => {
                      setSelectedCategory("all");
                      setSelectedSubCategory("all");
                      setPriceRange([0, 10000]);
                      setSearchTerm("");
                    }}>ফিল্টার মুছুন</Button>
                    <SheetClose asChild>
                      <Button className="w-full h-12 rounded-xl text-xs font-bold bg-[var(--green)] hover:bg-[var(--green-dark)] text-white shadow-md">ফিল্টার প্রয়োগ করুন</Button>
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
              <div className="product-grid">
                {paginatedProducts.map((p, idx) => {
                  const bgClasses = ["bg-green-pale", "bg-orange-pale", "bg-red-pale", "bg-yellow-pale", "bg-purple-pale", "bg-blue-pale"];
                  const bgClass = bgClasses[idx % bgClasses.length];
                  return (
                    <div key={p.id} className="product-card">
                      {p.prevPrice && (
                        <span className="pc-badge red">-{Math.round(((Number(p.prevPrice) - Number(p.currentPrice)) / Number(p.prevPrice)) * 100)}%</span>
                      )}
                      <Link href={getTenantPath(subdomain, `/product/${p.slug}`)}>
                        <div className={`pc-img ${bgClass}`}>
                          {p.featuredImage ? (
                            <img src={p.featuredImage} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <i className="fa-solid fa-carrot" style={{ color: "#e65100" }}></i>
                          )}
                        </div>
                      </Link>
                      <div className="pc-body">
                        <div className="pc-origin">Fresh Product</div>
                        <h4 className="pc-name">{p.name}</h4>
                        <div className="pc-qty">{p.totalInStock > 0 ? "In Stock" : "Out of Stock"}</div>
                        <div className="pc-pricing">
                          <span className="pc-price">${Number(p.currentPrice).toFixed(0)}</span>
                          {p.prevPrice && <span className="pc-old">${Number(p.prevPrice).toFixed(0)}</span>}
                        </div>
                        <button className="add-btn" onClick={() => addToCart(p)}>
                          <i className="fa-solid fa-cart-plus"></i> Add to Cart
                        </button>
                      </div>
                    </div>
                  );
                })}
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

      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-none rounded-l-[40px] overflow-hidden shadow-2xl">
          <SheetHeader className="p-8 bg-slate-900 text-white shrink-0">
            <div className="flex items-center justify-between"><SheetTitle className="text-2xl font-headline font-black text-white flex items-center gap-3 uppercase tracking-tight"><ShoppingCart className="w-6 h-6 text-primary" />আপনার ব্যাগ</SheetTitle><SheetClose className="text-white/60 hover:text-white transition-colors"><X className="w-7 h-7" /></SheetClose></div>
          </SheetHeader>
          <ScrollArea className="flex-1 px-8 py-6">
            {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-6 opacity-20"><ShoppingBag className="w-20 h-20" /><h3 className="text-lg font-bold uppercase tracking-widest">Bag is empty</h3></div> :
              <div className="space-y-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 group bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                    <div className="w-16 h-16 rounded-xl bg-white overflow-hidden border shrink-0"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="flex justify-between items-start"><h4 className="font-bold text-xs leading-tight truncate pr-4">{item.name}</h4><button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></div>
                      <div className="flex items-center justify-between"><p className="text-primary font-black text-sm">${(item.price).toFixed(2)}</p><div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5"><button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-50 rounded transition-all"><Minus className="w-3 h-3" /></button><span className="w-6 text-center text-[10px] font-bold">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-50 rounded transition-all"><Plus className="w-3 h-3" /></button></div></div>
                    </div>
                  </div>
                ))}
              </div>
            }
          </ScrollArea>
          <SheetFooter className="p-8 bg-white border-t shrink-0">
            <div className="w-full space-y-4">
              <div className="flex justify-between items-end mb-2"><span className="text-xs font-bold uppercase tracking-widest text-slate-400">মোট মূল্য</span><span className="text-2xl font-black text-primary">${cartTotal.toFixed(2)}</span></div>
              <Link href={getTenantPath(subdomain, "/checkout")} className="w-full"><Button className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20" disabled={cart.length === 0}>Checkout Now</Button></Link>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
