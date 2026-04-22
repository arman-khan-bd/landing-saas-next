
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { getSubdomain } from "@/lib/subdomain";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ShoppingCart, Loader2, CheckCircle2, Plus, Minus, X, Trash2, ChevronLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export default function ProductDetailPage() {
  const { subdomain: paramsSubdomain, slug } = useParams();
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

  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quantity, setItemQuantity] = useState(1);

  useEffect(() => {
    if (subdomain && slug) {
      fetchProductData();
      const savedCart = localStorage.getItem(`cart_${subdomain}`);
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error("Cart parse error", e);
        }
      }
    }
  }, [subdomain, slug]);

  useEffect(() => {
    if (subdomain && cart.length >= 0) {
      localStorage.setItem(`cart_${subdomain}`, JSON.stringify(cart));
    }
  }, [cart, subdomain]);

  const fetchProductData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Store Data
      const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain), limit(1));
      const storeSnap = await getDocs(storeQ);
      if (!storeSnap.empty) {
        const storeData = { id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() } as any;
        setStore(storeData);

        // Check expiry
        if (storeData.subscription) {
          const end = storeData.subscription.currentPeriodEnd?.toDate ? storeData.subscription.currentPeriodEnd.toDate() : new Date(storeData.subscription.currentPeriodEnd);
          setIsSubscriptionExpired(end < new Date());
        }
      }

      // 2. Fetch Product Data
      const q = query(collection(db, "products"), where("slug", "==", slug), limit(1));
      const snap = await getDocs(q);

      if (snap.empty) {
        setProduct(null);
      } else {
        const data = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setProduct(data);
        setSelectedImage(data.featuredImage || (data.gallery && data.gallery[0]) || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    if (!product) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: Number(product.currentPrice),
        image: product.featuredImage || (product.gallery && product.gallery[0]),
        quantity: quantity
      }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>;

  if (!product) return (
    <div className="flex flex-col h-screen items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-black">Item Not Found</h1>
      <Link href={`/${subdomain}`}>
        <Button className="rounded-2xl h-12 px-8">Return to Shop</Button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Mini Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="rounded-xl font-bold gap-1 text-slate-500 h-9" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart className="w-4 h-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[9px] font-black text-white flex items-center justify-center rounded-full border-2 border-white">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 p-4 sm:p-6 lg:p-10">
        {/* Visual Gallery */}
        <section className="space-y-4">
          <div className="aspect-square rounded-[32px] overflow-hidden bg-white shadow-xl shadow-slate-200 border border-white">
            <img src={selectedImage} className="w-full h-full object-cover" alt={product.name} />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[product.featuredImage, ...(product.gallery || [])].filter(Boolean).map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(img)}
                className={cn(
                  "w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 transition-all",
                  selectedImage === img ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                )}
              >
                <img src={img} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </section>

        {/* Product Info */}
        <section className="space-y-8 mt-6 lg:mt-0 bg-white p-6 sm:p-10 rounded-[32px] shadow-sm border border-slate-100 lg:sticky lg:top-24 h-fit">
          <div className="space-y-3">
            <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">
              Official Product
            </Badge>
            <h1 className="text-3xl lg:text-5xl font-headline font-black tracking-tighter text-slate-900 leading-[0.95]">
              {product.name}
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-3xl lg:text-4xl font-black text-primary tracking-tight">${Number(product.currentPrice).toFixed(2)}</p>
              {product.prevPrice && <p className="text-lg text-slate-300 line-through">${Number(product.prevPrice).toFixed(2)}</p>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex items-center bg-slate-50 rounded-2xl p-1 h-12 border border-slate-100">
                <button onClick={() => setItemQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all"><Minus className="w-4 h-4" /></button>
                <span className="w-10 text-center font-black text-base">{quantity}</span>
                <button onClick={() => setItemQuantity(q => q + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all"><Plus className="w-4 h-4" /></button>
              </div>
              <Button size="lg" className="flex-1 h-12 rounded-2xl text-base font-black shadow-xl shadow-primary/20" onClick={addToCart}>
                Add to Bag
              </Button>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          <div className="space-y-3">
            <h3 className="font-headline font-black text-sm uppercase tracking-widest text-slate-400">Description</h3>
            <div
              className="text-slate-600 text-sm leading-relaxed prose prose-sm prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description || "No detailed description available." }}
            />
          </div>

          <div className="pt-4">
            <div className="flex items-center gap-2 text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">IHut.Shop Verified Seller</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-100 pt-16 pb-12 px-6 mt-12">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
            <div className="space-y-4 md:col-span-2">
              <Link href={`/${subdomain}`} className="flex items-center justify-center md:justify-start gap-2.5">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-xl font-headline font-black tracking-tight uppercase text-slate-900">{store?.name || subdomain}</span>
              </Link>
              <p className="text-slate-500 text-sm max-w-sm mx-auto md:mx-0 font-medium leading-relaxed">
                Discover the best collection curated specifically for you. Quality products, fast delivery, and exceptional service.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Shop</h4>
              <ul className="space-y-2.5 text-sm font-bold text-slate-600">
                <li><Link href={`/${subdomain}`} className="hover:text-primary transition-colors">All Products</Link></li>
                <li><Link href={`/${subdomain}`} className="hover:text-primary transition-colors">Featured Items</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Support</h4>
              <ul className="space-y-2.5 text-sm font-bold text-slate-600">
                <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                &copy; {new Date().getFullYear()} {(store?.name || subdomain).toUpperCase()}
              </div>
              <div className="flex items-center gap-3 opacity-30">
                <div className="w-5 h-5 bg-slate-200 rounded-md" />
                <div className="w-5 h-5 bg-slate-200 rounded-md" />
                <div className="w-5 h-5 bg-slate-200 rounded-md" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-2 text-slate-300">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-widest">Secure Payments</span>
              </div>

              {/* Powered by IHut.Shop - Shown for free/expired plans */}
              {(!store?.subscription || isSubscriptionExpired) && (
                <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Powered by</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-primary rounded-[4px] flex items-center justify-center">
                      <ShoppingCart className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-[10px] font-headline font-black tracking-tight text-primary uppercase">IHut.Shop</span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-none rounded-l-[40px] overflow-hidden shadow-2xl">
          <SheetHeader className="p-8 bg-slate-900 text-white shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-headline font-black text-white flex items-center gap-3 uppercase tracking-tight">
                <ShoppingCart className="w-6 h-6 text-primary" />
                Your Bag
              </SheetTitle>
              <SheetClose className="text-white/60 hover:text-white transition-colors">
                <X className="w-7 h-7" />
              </SheetClose>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1 px-8 py-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-6 opacity-20">
                <ShoppingBag className="w-20 h-20" />
                <h3 className="text-lg font-bold uppercase tracking-widest">Bag is empty</h3>
              </div>
            ) : (
              <div className="space-y-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 group bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                    <div className="w-16 h-16 rounded-xl bg-white overflow-hidden border shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-xs leading-tight truncate pr-4">{item.name}</h4>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-primary font-black text-sm">${(item.price).toFixed(2)}</p>
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                          <button onClick={() => updateCartQuantity(item.id, -1)} className="p-1 hover:bg-slate-50 rounded transition-all"><Minus className="w-3 h-3" /></button>
                          <span className="w-6 text-center text-[10px] font-bold">{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.id, 1)} className="p-1 hover:bg-slate-50 rounded transition-all"><Plus className="w-3 h-3" /></button>
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
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Bag Subtotal</span>
                <span className="text-2xl font-black text-primary">${cartTotal.toFixed(2)}</span>
              </div>
              <Link href={`/${subdomain}/checkout`} className="w-full">
                <Button className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20" disabled={cart.length === 0}>
                  Checkout Now
                </Button>
              </Link>
              <SheetClose asChild>
                <Button variant="ghost" className="w-full h-10 rounded-xl text-slate-400 font-bold uppercase tracking-widest text-[9px] hover:bg-slate-50">
                  Continue Shopping
                </Button>
              </SheetClose>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
