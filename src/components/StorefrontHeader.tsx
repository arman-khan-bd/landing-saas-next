"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingBag, ShoppingCart, X, Menu, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { getTenantPath, cn } from "@/lib/utils";
import * as fpixel from "@/lib/fpixel";
import { useRouter, usePathname } from "next/navigation";

export default function StorefrontHeader({ store, subdomain }: { store: any, subdomain: string }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    
    const updateCart = () => {
      const savedCart = localStorage.getItem(`cart_${subdomain}`);
      if (savedCart) {
        try {
          const cart = JSON.parse(savedCart);
          setCartCount(cart.reduce((acc: number, i: any) => acc + i.quantity, 0));
        } catch (e) {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    updateCart();
    window.addEventListener('storage', updateCart);
    const interval = setInterval(updateCart, 1000); // Poll for changes as well

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener('storage', updateCart);
      clearInterval(interval);
    };
  }, [subdomain]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    fpixel.event('Search', {
      search_string: searchTerm
    });
    
    router.push(`${getTenantPath(subdomain, "/all-products")}?search=${encodeURIComponent(searchTerm)}`);
    setIsSearchOpen(false);
  };

  return (
    <>
      {/* Promo Banner */}
      {store?.offerBanner && (
        <div className="bg-primary py-2 px-4 text-center sticky top-0 z-[40]">
          {store.offerLink ? (
            <Link href={store.offerLink} className="text-white text-[9px] font-black uppercase tracking-[0.2em] hover:opacity-80 transition-opacity flex items-center justify-center gap-2">
              {store.offerText} <ArrowRight className="w-3 h-3" />
            </Link>
          ) : (
            <p className="text-white text-[9px] font-black uppercase tracking-[0.2em]">{store.offerText}</p>
          )}
        </div>
      )}

      <header className={cn(
        "sticky z-[40] w-full transition-all duration-500",
        store?.offerBanner ? "top-[32px]" : "top-0",
        scrolled ? "bg-white/90 backdrop-blur-xl shadow-lg h-12 md:h-14" : "bg-white/20 backdrop-blur-sm h-16 md:h-20"
      )}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-4">
          {/* Logo Area */}
          <Link href={getTenantPath(subdomain, "/")} className="flex items-center gap-2 shrink-0 group">
            {store?.logo ? (
              <img src={store.logo} alt={store.name} className="h-8 md:h-12 w-auto object-contain group-hover:scale-105 transition-transform" />
            ) : (
              <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20 group-hover:bg-primary transition-colors">
                      <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className={cn(
                    "font-headline font-black text-lg tracking-tighter uppercase leading-none transition-colors",
                    scrolled ? "text-slate-900" : "text-slate-900"
                  )}>{store?.name}</span>
              </div>
            )}
          </Link>

          {/* Dynamic Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg relative group">
            <form onSubmit={handleSearch} className="w-full">
              <div className={cn(
                "relative h-10 rounded-xl transition-all duration-300 flex items-center border",
                scrolled 
                  ? "bg-slate-100/50 border-slate-200 group-focus-within:bg-white group-focus-within:border-primary/20" 
                  : "bg-slate-900/5 border-slate-900/10 group-focus-within:bg-white/40"
              )}>
                <Search className={cn(
                  "absolute left-3 w-3.5 h-3.5 transition-colors",
                  scrolled ? "text-slate-400" : "text-slate-500"
                )} />
                <Input 
                  placeholder="Search..." 
                  className={cn(
                    "w-full h-full pl-10 pr-4 bg-transparent border-none focus:ring-0 text-[11px] font-bold tracking-tight placeholder:opacity-60",
                    scrolled ? "text-slate-900 placeholder:text-slate-400" : "text-slate-900 placeholder:text-slate-500"
                  )}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </form>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "md:hidden rounded-xl transition-all h-9 w-9",
                scrolled ? "hover:bg-primary/5 text-slate-700" : "text-slate-900 hover:bg-slate-900/5"
              )}
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="w-5 h-5" />
            </Button>

            <Link href={getTenantPath(subdomain, "/all-products")} className="hidden lg:block group">
              <div className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                scrolled 
                  ? "text-slate-500 hover:text-primary hover:bg-primary/5" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-900/5"
              )}>
                Catalog
              </div>
            </Link>

            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "relative rounded-xl transition-all group overflow-visible h-9 w-9",
                scrolled ? "text-slate-700 hover:bg-primary/5" : "text-slate-900 hover:bg-slate-900/5"
              )}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-cart'));
              }}
            >
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-[9px] font-black text-white flex items-center justify-center rounded-full border-2 border-white shadow-lg">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-[150] bg-white animate-in fade-in slide-in-from-top-4 duration-300 p-4">
            <div className="flex items-center gap-4">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  autoFocus
                  placeholder="Find something..." 
                  className="w-full h-14 pl-14 rounded-[20px] bg-slate-50 border-none text-lg font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </form>
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)} className="rounded-2xl h-14 w-14">
                <X className="w-7 h-7 text-slate-400" />
              </Button>
            </div>
            <div className="mt-8 space-y-6">
                <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Popular Searches</h5>
                    <div className="flex flex-wrap gap-2">
                        {['New Items', 'Top Rated', 'Hot Sales'].map(s => (
                            <button 
                              key={s} 
                              onClick={() => { setSearchTerm(s); }}
                              className="px-5 py-2.5 bg-slate-50 hover:bg-primary hover:text-white rounded-full text-xs font-black uppercase tracking-widest transition-all"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
