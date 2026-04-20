
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ShoppingCart, Search, Menu, Instagram, Twitter, Facebook, Hammer, AlertCircle, Loader2, X, Plus, Minus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export default function Storefront() {
  const { subdomain: rawSubdomain } = useParams();
  const subdomain = typeof rawSubdomain === 'string' ? rawSubdomain.toLowerCase() : '';
  
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
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

      const prodQuery = query(collection(db, "products"), where("storeId", "==", storeData.id));
      const prodSnap = await getDocs(prodQuery);
      setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error("Storefront Fetch Error:", e);
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Loading Store</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
        <h1 className="text-2xl font-headline font-black text-slate-900">Store Not Found</h1>
        <Link href="/" className="mt-6">
          <Button className="rounded-xl h-11 px-8">Return Home</Button>
        </Link>
      </div>
    );
  }

  if (store.isMaintenance) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-900 p-6 text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6">
          <Hammer className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-headline font-black tracking-tight">{store.name}</h1>
        <p className="text-slate-500 mt-2 max-w-xs mx-auto">We're updating our store. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30">
      {/* Navigation - Compact */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/${subdomain}`} className="flex items-center gap-2">
            {store.logo ? (
              <img src={store.logo} className="h-8 w-auto rounded-md" alt={store.name} />
            ) : (
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-md">
                <ShoppingBag className="w-4 h-4" />
              </div>
            )}
            <h1 className="text-lg font-headline font-black tracking-tighter text-slate-900 uppercase">
              {store.name}
            </h1>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
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
              <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-none rounded-l-3xl">
                <SheetHeader className="p-6 bg-slate-900 text-white shrink-0">
                  <SheetTitle className="text-xl font-headline font-black text-white flex items-center gap-2 uppercase tracking-tight">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    Your Cart
                  </SheetTitle>
                </SheetHeader>
                
                <ScrollArea className="flex-1 px-6 py-4">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-20">
                      <ShoppingBag className="w-16 h-16 mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest">Empty Cart</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="w-16 h-16 rounded-xl bg-white overflow-hidden border shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-xs leading-tight truncate pr-4">{item.name}</h4>
                              <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500">
                                <X className="w-3.5 h-3.5" />
                              </button>
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

                <SheetFooter className="p-6 bg-white border-t shrink-0">
                  <div className="w-full space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subtotal</span>
                      <span className="text-2xl font-black text-primary">${cartTotal.toFixed(2)}</span>
                    </div>
                    <Button className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20" disabled={cart.length === 0}>
                      Checkout
                    </Button>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Link href={`/${subdomain}/overview`}>
               <Button size="sm" variant="ghost" className="hidden sm:flex rounded-xl h-10 px-4 font-bold text-xs">
                 Admin
               </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero - Compact */}
      <section className="relative h-[320px] sm:h-[450px] flex items-center justify-center overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0">
           <img 
             src={store.homeBanner || "https://picsum.photos/seed/storehero/1200/600"} 
             className="w-full h-full object-cover opacity-40" 
             alt="Hero" 
             data-ai-hint="store banner"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 text-center space-y-4 max-w-3xl px-6">
          <Badge className="bg-primary text-white border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            New Arrivals
          </Badge>
          <h2 className="text-3xl sm:text-6xl font-headline font-black tracking-tighter leading-none uppercase">
            {store.homePageTitle || `Welcome to ${store.name}`}
          </h2>
          <p className="text-sm sm:text-lg text-slate-300 max-w-xl mx-auto font-medium line-clamp-2">
            {store.description || "Discover our curated collection of premium products."}
          </p>
        </div>
      </section>

      {/* Featured Products - App Style Grid */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-10 sm:py-20">
        <div className="flex items-center justify-between mb-6 px-1">
          <h3 className="text-xl sm:text-3xl font-headline font-black tracking-tight text-slate-900 uppercase">Shop All</h3>
          <Button variant="link" className="text-primary font-bold text-xs uppercase tracking-widest p-0 h-auto">
            View All
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <ShoppingBag className="w-12 h-12 text-slate-100 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Inventory Empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {products.map((p) => (
              <Card key={p.id} className="group bg-white rounded-2xl overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 active:scale-95">
                <CardContent className="p-0">
                  <Link href={`/${subdomain}/product/${p.slug}`} className="block aspect-square relative overflow-hidden bg-slate-50 border-b border-slate-50">
                    {p.featuredImage ? (
                      <img 
                        src={p.featuredImage} 
                        alt={p.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-100">
                        <ShoppingBag className="w-12 h-12" />
                      </div>
                    )}
                    {p.prevPrice && (
                      <div className="absolute top-2 left-2 bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                        Sale
                      </div>
                    )}
                  </Link>
                  <div className="p-3 sm:p-5 space-y-2">
                    <Link href={`/${subdomain}/product/${p.slug}`} className="block min-h-[32px]">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {p.name}
                      </h4>
                    </Link>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex flex-col">
                        <p className="text-primary font-black text-sm sm:text-base tracking-tight">${Number(p.currentPrice || 0).toFixed(2)}</p>
                        {p.prevPrice && (
                          <p className="text-slate-300 text-[9px] line-through">${Number(p.prevPrice).toFixed(2)}</p>
                        )}
                      </div>
                      <Button size="icon" variant="secondary" className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl shadow-sm bg-slate-50 hover:bg-primary hover:text-white shrink-0 transition-colors" onClick={(e) => { e.preventDefault(); addToCart(p); }}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <footer className="bg-white border-t border-slate-100 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-6">
            <Link href={`/${subdomain}`} className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-lg font-headline font-black tracking-tighter uppercase">{store.name}</span>
            </Link>
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
              &copy; {new Date().getFullYear()} NEXUSCART POWERED
            </div>
        </div>
      </footer>
    </div>
  );
}
