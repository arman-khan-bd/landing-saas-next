"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { getSubdomain } from "@/lib/subdomain";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ShoppingCart, Loader2, Zap, ArrowRight, ShieldCheck, ChevronLeft, ChevronRight, X, Minus, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTenantPath, getConsoleUrl } from "@/lib/utils";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export default function Storefront() {
  const { subdomain: paramsSubdomain } = useParams();
  const [subdomain, setSubdomain] = useState<string>("");

  useEffect(() => {
    let sub = typeof paramsSubdomain === 'string' ? paramsSubdomain.toLowerCase() : '';
    if (!sub && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ihut.shop";
      const extracted = getSubdomain(hostname, rootDomain);
      if (extracted) sub = extracted.toLowerCase();
    }
    setSubdomain(sub);
  }, [paramsSubdomain]);

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;

  useEffect(() => {
    if (subdomain) {
      fetchStoreData();
      const savedCart = localStorage.getItem(`cart_${subdomain}`);
      if (savedCart) {
        try { setCart(JSON.parse(savedCart)); } catch (e) { console.error(e); }
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

      if (storeData.subscription) {
        const end = storeData.subscription.currentPeriodEnd?.toDate 
          ? storeData.subscription.currentPeriodEnd.toDate() 
          : new Date(storeData.subscription.currentPeriodEnd);
        setIsSubscriptionExpired(end < new Date());
      }

      const prodQuery = query(collection(db, "products"), where("storeId", "==", storeData.id));
      const prodSnap = await getDocs(prodQuery);
      setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
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
      if (item.id === id) return { ...item, quantity: Math.max(1, item.quantity + delta) };
      return item;
    }));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const currentProducts = products.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-white"><Loader2 className="w-10 h-10 animate-spin text-primary mb-2" /><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Loading Store</p></div>;
  if (!store) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center"><h1 className="text-2xl font-black">Store Not Found</h1><Link href="/"><Button className="mt-6">Return Home</Button></Link></div>;

  return (
    <div className="min-h-screen bg-slate-50/30">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={getTenantPath(subdomain, "/")} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-md"><ShoppingBag className="w-4 h-4" /></div>
            <h1 className="text-lg font-headline font-black tracking-tighter text-slate-900 uppercase">{store.name}</h1>
          </Link>

          <div className="flex items-center gap-2">
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl bg-white border border-slate-100 shadow-sm">
                  <ShoppingCart className="w-4 h-4 text-slate-700" />
                  {cart.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[9px] font-black text-white flex items-center justify-center rounded-full border-2 border-white">{cart.reduce((acc, i) => acc + i.quantity, 0)}</span>}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-none rounded-l-3xl shadow-2xl">
                <SheetHeader className="p-6 bg-slate-900 text-white shrink-0">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-xl font-headline font-black text-white flex items-center gap-2 uppercase tracking-tight"><ShoppingCart className="w-5 h-5 text-primary" />Your Cart</SheetTitle>
                    <SheetClose className="text-white/60 hover:text-white"><X className="w-6 h-6" /></SheetClose>
                  </div>
                </SheetHeader>
                <ScrollArea className="flex-1 px-6 py-4">
                  {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-20"><ShoppingBag className="w-16 h-16 mb-4" /><p className="text-sm font-bold uppercase tracking-widest">Empty Cart</p></div> : 
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="w-16 h-16 rounded-xl bg-white overflow-hidden border shrink-0"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="flex justify-between items-start"><h4 className="font-bold text-xs truncate pr-4">{item.name}</h4><button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button></div>
                            <div className="flex items-center justify-between"><p className="text-primary font-black text-sm">${item.price.toFixed(2)}</p><div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5"><button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-50 rounded"><Minus className="w-3 h-3" /></button><span className="w-6 text-center text-[10px] font-bold">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-50 rounded"><Plus className="w-3 h-3" /></button></div></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  }
                </ScrollArea>
                <SheetFooter className="p-6 bg-white border-t shrink-0">
                  <div className="w-full space-y-3">
                    <div className="flex justify-between items-end mb-2"><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subtotal</span><span className="text-2xl font-black text-primary">${cartTotal.toFixed(2)}</span></div>
                    <Link href={getTenantPath(subdomain, "/checkout")} className="w-full"><Button className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20" disabled={cart.length === 0}>Checkout Now</Button></Link>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            <Link href={getTenantPath(subdomain, "/dashboard")}><Button size="sm" variant="ghost" className="hidden sm:flex rounded-xl h-10 px-4 font-bold text-xs">Admin</Button></Link>
          </div>
        </div>
      </nav>

      <section className="relative h-[280px] sm:h-[400px] flex items-center justify-center overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0">
          <img src={store.homeBanner || "https://picsum.photos/seed/storehero/1200/600"} className="w-full h-full object-cover opacity-50" alt="Hero" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
        </div>
        <div className="relative z-10 text-center space-y-4 max-w-3xl px-6">
          <Badge className="bg-primary text-white border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Official Store</Badge>
          <h2 className="text-3xl sm:text-5xl font-headline font-black tracking-tighter leading-none uppercase drop-shadow-lg">{store.homePageTitle || `Welcome to ${store.name}`}</h2>
          <p className="text-xs sm:text-base text-slate-200 opacity-90">{store.description || "Premium curated collection."}</p>
        </div>
      </section>

      {store.offerBanner && (
        <section className="bg-accent py-3 px-6 text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
            <Zap className="w-4 h-4 text-white fill-white" /><p className="text-white font-black text-[10px] sm:text-xs uppercase tracking-widest">{store.offerText}</p>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-16">
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="space-y-1"><h3 className="text-xl sm:text-2xl font-headline font-black tracking-tight text-slate-900 uppercase">New Arrivals</h3><div className="h-1 w-12 bg-primary rounded-full" /></div>
          <Button variant="link" className="text-primary font-bold text-xs uppercase tracking-widest p-0 h-auto" asChild><Link href={getTenantPath(subdomain, "/all-products")}>Explore All <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link></Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
          {currentProducts.map((p) => (
            <Card key={p.id} className="group bg-white rounded-2xl overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-0">
                <Link href={getTenantPath(subdomain, `/product/${p.slug}`)} className="block aspect-square relative overflow-hidden bg-slate-50">
                  <img src={p.featuredImage} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </Link>
                <div className="p-3 sm:p-4 space-y-2">
                  <Link href={getTenantPath(subdomain, `/product/${p.slug}`)} className="block min-h-[32px]"><h4 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{p.name}</h4></Link>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-primary font-black text-sm sm:text-base">${Number(p.currentPrice || 0).toFixed(2)}</p>
                    <Button size="icon" variant="secondary" className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl" onClick={(e) => { e.preventDefault(); addToCart(p); }}><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
