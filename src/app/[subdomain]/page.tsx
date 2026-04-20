
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
      // Load cart from localStorage specific to this store
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
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Opening Storefront</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <AlertCircle className="w-16 h-16 text-slate-200 mb-6" />
        <h1 className="text-3xl font-headline font-black text-slate-900">404 - Shop Not Found</h1>
        <p className="text-slate-500 mt-2 max-w-xs">We couldn't find a store at this address. Please check the URL and try again.</p>
        <Link href="/" className="mt-8">
          <Button className="rounded-2xl h-12 px-8">Back to NexusCart</Button>
        </Link>
      </div>
    );
  }

  if (store.isMaintenance) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
        <div className="w-20 h-20 bg-amber-500/20 rounded-[32px] flex items-center justify-center text-amber-500 mb-8">
          <Hammer className="w-10 h-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tighter uppercase">{store.name}</h1>
        <p className="text-xl text-slate-400 mt-4 max-w-md mx-auto leading-relaxed">
          We're currently performing scheduled maintenance to improve your shopping experience. We'll be back online shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href={`/${subdomain}`} className="flex items-center gap-3">
              {store.logo ? (
                <img src={store.logo} className="h-10 w-auto rounded-lg" alt={store.name} />
              ) : (
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              )}
              <h1 className="text-xl md:text-2xl font-headline font-black tracking-tighter text-slate-900 uppercase">
                {store.name}
              </h1>
            </Link>
            <div className="hidden lg:flex items-center gap-8">
              <Link href={`/${subdomain}`} className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Home</Link>
              <Link href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Catalog</Link>
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search catalog..." className="pl-11 bg-slate-100 border-none w-48 lg:w-64 h-11 rounded-2xl focus-visible:ring-primary/20" />
            </div>

            {/* Cart Drawer */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-2xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
                  <ShoppingCart className="w-5 h-5 text-slate-700" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-[10px] font-black text-white flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in">
                      {cart.reduce((acc, i) => acc + i.quantity, 0)}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-none rounded-l-[40px] overflow-hidden">
                <SheetHeader className="p-8 bg-slate-900 text-white shrink-0">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-2xl font-headline font-black text-white flex items-center gap-3 uppercase tracking-tight">
                      <ShoppingCart className="w-6 h-6 text-primary" />
                      Shopping Cart
                    </SheetTitle>
                  </div>
                </SheetHeader>
                
                <ScrollArea className="flex-1 px-8 py-6">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-6 opacity-30">
                      <ShoppingBag className="w-24 h-24" />
                      <div>
                        <h3 className="text-xl font-bold">Your cart is empty</h3>
                        <p className="text-sm">Add some items to start shopping!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {cart.map((item) => (
                        <div key={item.id} className="flex gap-4 group">
                          <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden border shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-sm leading-tight truncate pr-4">{item.name}</h4>
                              <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-primary font-black text-lg">${(item.price).toFixed(2)}</p>
                            <div className="flex items-center gap-4 pt-1">
                              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded transition-colors shadow-none hover:shadow-sm"><Minus className="w-3 h-3" /></button>
                                <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded transition-colors shadow-none hover:shadow-sm"><Plus className="w-3 h-3" /></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <SheetFooter className="p-8 bg-slate-50 border-t shrink-0">
                  <div className="w-full space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-slate-500 text-sm font-medium">
                        <span>Subtotal</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-lg font-black uppercase tracking-tighter">Total Amount</span>
                        <span className="text-3xl font-black text-primary">${cartTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    <Button className="w-full h-16 rounded-2xl text-xl font-black shadow-2xl shadow-primary/20" disabled={cart.length === 0}>
                      Checkout Now
                    </Button>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Link href={`/${subdomain}/overview`}>
               <Button size="sm" variant="outline" className="hidden sm:flex rounded-xl h-11 px-6 font-bold border-2">
                 Admin
               </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0">
           <img 
             src={store.homeBanner || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"} 
             className="w-full h-full object-cover opacity-60 scale-105" 
             alt="Hero" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 text-center space-y-8 max-w-4xl px-4">
          <Badge className="bg-primary/20 backdrop-blur-md text-primary-foreground border-none px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em]">
            New Collection 2024
          </Badge>
          <h2 className="text-5xl md:text-8xl font-headline font-black tracking-tighter leading-[0.9]">
            {store.homePageTitle || `Welcome to ${store.name}`}
          </h2>
          <p className="text-lg md:text-2xl text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed">
            {store.description || "Discover our curated collection of premium products designed for your modern lifestyle."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto rounded-2xl px-12 h-16 text-xl font-black shadow-2xl shadow-primary/40">
              Start Shopping
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-16">
          <div className="text-center sm:text-left">
            <h3 className="text-4xl md:text-5xl font-headline font-black tracking-tight text-slate-900">Featured Items</h3>
            <p className="text-slate-500 mt-2 text-lg">Curated selections from our warehouse.</p>
          </div>
          <Button variant="ghost" className="text-primary font-black text-lg h-auto p-0 hover:bg-transparent">
            View All Catalog <Menu className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
            <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-slate-400">Arriving Soon</h4>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {products.map((p) => (
              <Card key={p.id} className="group bg-white rounded-[32px] overflow-hidden border-none shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-500">
                <CardContent className="p-0">
                  <Link href={`/${subdomain}/product/${p.slug}`} className="block aspect-[4/5] relative overflow-hidden bg-slate-100">
                    {p.featuredImage ? (
                      <img 
                        src={p.featuredImage} 
                        alt={p.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <ShoppingBag className="w-20 h-20" />
                      </div>
                    )}
                  </Link>
                  <div className="p-8 space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{p.category || 'Lifestyle'}</p>
                      <Link href={`/${subdomain}/product/${p.slug}`} className="block">
                        <h4 className="font-bold text-xl text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                          {p.name}
                        </h4>
                      </Link>
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-2">
                      <div className="flex items-baseline gap-2">
                        <p className="text-primary font-black text-2xl">${Number(p.currentPrice || 0).toFixed(2)}</p>
                        {p.prevPrice && (
                          <p className="text-slate-400 text-sm line-through">${Number(p.prevPrice).toFixed(2)}</p>
                        )}
                      </div>
                      <Button size="icon" className="rounded-xl shadow-lg shadow-primary/20" onClick={() => addToCart(p)}>
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <footer className="bg-white border-t border-slate-200 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <Link href={`/${subdomain}`} className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-2xl font-headline font-black tracking-tighter uppercase">{store.name}</span>
            </Link>
            <p className="text-slate-400 text-sm font-medium">
              &copy; {new Date().getFullYear()} {store.name}. Powered by NexusCart.
            </p>
        </div>
      </footer>
    </div>
  );
}
