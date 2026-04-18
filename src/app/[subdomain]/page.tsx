"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ShoppingCart, Search, Menu, Instagram, Twitter, Facebook } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function Storefront() {
  const { subdomain } = useParams();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreData();
  }, [subdomain]);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const storeQuery = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQuery);
      if (storeSnap.empty) return;
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading storefront...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold tracking-tight text-primary uppercase">{store?.name}</h1>
            <div className="hidden md:flex items-center gap-6">
              <Link href="#" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
              <Link href="#" className="text-sm font-medium hover:text-primary transition-colors">Catalog</Link>
              <Link href="#" className="text-sm font-medium hover:text-primary transition-colors">About</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search products..." className="pl-9 bg-slate-100 border-none w-64 h-9 rounded-full" />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-[10px] text-white flex items-center justify-center rounded-full">0</span>
            </Button>
            <Link href={`/${subdomain}/overview`}>
               <Button size="sm" className="rounded-full px-4">Admin</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 opacity-40">
           <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" alt="Hero" />
        </div>
        <div className="relative z-10 text-center space-y-6 max-w-2xl px-4">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter">Welcome to {store?.name}</h2>
          <p className="text-lg md:text-xl text-slate-200">Discover our curated collection of premium products designed for your lifestyle.</p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="rounded-full px-8 h-14 text-lg shadow-xl shadow-primary/20">Shop Now</Button>
            <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-lg bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20">Learn More</Button>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-12">
          <h3 className="text-3xl font-bold">Featured Products</h3>
          <Button variant="link" className="text-primary font-bold">View all products</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((p) => (
            <div key={p.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
              <div className="aspect-square relative overflow-hidden bg-slate-100">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ShoppingBag className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-20 group-hover:translate-y-0 transition-transform duration-300">
                  <Button className="rounded-full shadow-lg gap-2">
                    <ShoppingCart className="w-4 h-4" /> Add to Cart
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <Link href="#" className="font-bold text-lg hover:text-primary transition-colors block mb-1">{p.name}</Link>
                <p className="text-primary font-bold text-xl">${p.price}</p>
              </div>
            </div>
          ))}

          {products.length === 0 && Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 p-4 space-y-4">
                <div className="aspect-square bg-slate-100 rounded-2xl animate-pulse" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3" />
                <div className="h-6 bg-slate-100 rounded animate-pulse w-1/3" />
             </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6 col-span-1 md:col-span-2">
            <h4 className="text-2xl font-bold tracking-tight text-primary uppercase">{store?.name}</h4>
            <p className="text-slate-500 max-w-sm leading-relaxed">Making premium lifestyles accessible for everyone. Quality, trust, and speed in every delivery.</p>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-full bg-slate-100"><Instagram className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" className="rounded-full bg-slate-100"><Twitter className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" className="rounded-full bg-slate-100"><Facebook className="w-5 h-5" /></Button>
            </div>
          </div>
          <div className="space-y-6">
            <h5 className="font-bold uppercase tracking-widest text-sm">Shop</h5>
            <ul className="space-y-4 text-slate-500 text-sm font-medium">
              <li><Link href="#" className="hover:text-primary transition-colors">New Arrivals</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Best Sellers</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Sales</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h5 className="font-bold uppercase tracking-widest text-sm">Support</h5>
            <ul className="space-y-4 text-slate-500 text-sm font-medium">
              <li><Link href="#" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Shipping Poolicy</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Returns & Refunds</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-20 pt-8 border-t border-slate-100 text-center text-slate-400 text-sm font-medium">
          &copy; {new Date().getFullYear()} {store?.name}. Built with iHut.
        </div>
      </footer>
    </div>
  );
}