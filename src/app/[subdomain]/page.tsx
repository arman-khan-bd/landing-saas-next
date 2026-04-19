"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ShoppingCart, Search, Menu, Instagram, Twitter, Facebook, Hammer, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Storefront() {
  const { subdomain } = useParams();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStoreData();
  }, [subdomain]);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      if (!subdomain) return;

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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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

  // Maintenance Mode Guard
  if (store.isMaintenance) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
        <div className="w-20 h-20 bg-amber-500/20 rounded-[32px] flex items-center justify-center text-amber-500 mb-8">
          <Hammer className="w-10 h-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tighter uppercase">{store.name}</h1>
        <p className="text-xl text-slate-400 mt-4 max-w-md mx-auto leading-relaxed">
          We&apos;re currently performing scheduled maintenance to improve your shopping experience. We&apos;ll be back online shortly.
        </p>
        <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Store Status</p>
          <p className="text-sm font-bold mt-1 text-amber-500">OFFLINE FOR MAINTENANCE</p>
        </div>
      </div>
    );
  }

  // Offline Guard
  if (store.status === 'offline') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 mb-6">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-headline font-bold text-slate-900">{store.name} is Temporarily Offline</h1>
        <p className="text-slate-500 mt-2">The store owner has temporarily suspended services. Please check back later.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="#" className="flex items-center gap-3">
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
              <Link href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Home</Link>
              <Link href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Catalog</Link>
              <Link href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Best Sellers</Link>
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search..." className="pl-11 bg-slate-100 border-none w-48 lg:w-64 h-11 rounded-2xl focus-visible:ring-primary/20" />
            </div>
            <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-2xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
              <ShoppingCart className="w-5 h-5 text-slate-700" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-[10px] font-black text-white flex items-center justify-center rounded-full border-2 border-white">0</span>
            </Button>
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
             alt="Hero Background" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 text-center space-y-8 max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Badge className="bg-primary/20 backdrop-blur-md text-primary-foreground border-none px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em]">
            Premium Quality Guaranteed
          </Badge>
          <h2 className="text-5xl md:text-8xl font-headline font-black tracking-tighter leading-[0.9]">
            {store.homePageTitle || `Welcome to ${store.name}`}
          </h2>
          <p className="text-lg md:text-2xl text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed">
            {store.description || "Discover our curated collection of premium products designed for your modern lifestyle."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto rounded-2xl px-12 h-16 text-xl font-black shadow-2xl shadow-primary/40 hover:scale-[1.02] transition-all">
              Shop Collection
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-2xl px-12 h-16 text-xl font-black bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-white">
              Watch Reel
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-16">
          <div className="text-center sm:text-left">
            <h3 className="text-4xl md:text-5xl font-headline font-black tracking-tight text-slate-900">New Arrivals</h3>
            <p className="text-slate-500 mt-2 text-lg">The latest drops from our global designers.</p>
          </div>
          <Button variant="ghost" className="text-primary font-black text-lg h-auto p-0 hover:bg-transparent hover:translate-x-1 transition-transform group">
            Explore All <Menu className="w-5 h-5 ml-2 group-hover:rotate-90 transition-transform" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {products.map((p) => (
            <Card key={p.id} className="group bg-white rounded-[32px] overflow-hidden border-none shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 active:scale-[0.98]">
              <CardContent className="p-0">
                <div className="aspect-[4/5] relative overflow-hidden bg-slate-100">
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
                  
                  {/* Quick Action Overlay */}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-6 left-0 right-0 px-6 translate-y-12 group-hover:translate-y-0 transition-all duration-500">
                    <Button className="w-full rounded-2xl h-12 shadow-2xl font-bold flex items-center justify-center gap-2">
                      <ShoppingCart className="w-4 h-4" /> Quick Add
                    </Button>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-xl text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                      {p.name}
                    </h4>
                    {p.totalInStock <= 5 && p.totalInStock > 0 && (
                      <span className="text-[8px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap">
                        Low Stock
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-3">
                    <p className="text-primary font-black text-2xl">${Number(p.currentPrice).toFixed(2)}</p>
                    {p.prevPrice && (
                      <p className="text-slate-400 text-sm line-through">${Number(p.prevPrice).toFixed(2)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {products.length === 0 && Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="bg-white rounded-[32px] overflow-hidden shadow-sm p-6 space-y-6">
                <div className="aspect-[4/5] bg-slate-50 rounded-2xl animate-pulse" />
                <div className="space-y-3">
                  <div className="h-6 bg-slate-50 rounded-lg animate-pulse w-3/4" />
                  <div className="h-8 bg-slate-50 rounded-lg animate-pulse w-1/3" />
                </div>
             </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-24">
          <div className="space-y-8 col-span-1 md:col-span-2">
            <Link href="#" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-2xl font-headline font-black tracking-tighter uppercase">{store.name}</span>
            </Link>
            <p className="text-slate-500 text-lg leading-relaxed max-w-sm">
              Crafting experiences through curated product lines. We believe in quality that lasts and design that inspires.
            </p>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
                <Instagram className="w-6 h-6" />
              </Button>
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
                <Twitter className="w-6 h-6" />
              </Button>
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
                <Facebook className="w-6 h-6" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-8">
            <h5 className="font-headline font-black uppercase tracking-[0.2em] text-xs text-slate-400">Discover</h5>
            <ul className="space-y-5 text-slate-600 text-base font-bold">
              <li><Link href="#" className="hover:text-primary transition-colors">Collection 2024</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Global Best Sellers</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Member Exclusive</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Gift Cards</Link></li>
            </ul>
          </div>

          <div className="space-y-8">
            <h5 className="font-headline font-black uppercase tracking-[0.2em] text-xs text-slate-400">Help & Support</h5>
            <ul className="space-y-5 text-slate-600 text-base font-bold">
              <li><Link href="#" className="hover:text-primary transition-colors">Live Support</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Shipping Logistics</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Secure Returns</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 pt-12 border-t border-slate-100">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-slate-400 text-sm font-medium">
                &copy; {new Date().getFullYear()} {store.name}. All global rights reserved.
              </p>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                Powered by <span className="text-primary font-black">NexusCart SaaS Engine</span>
              </p>
           </div>
        </div>
      </footer>
    </div>
  );
}
