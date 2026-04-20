
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ShoppingCart, ArrowLeft, Loader2, CheckCircle2, ShieldCheck, Truck, RefreshCw, Plus, Minus, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export default function ProductDetailPage() {
  const { subdomain: rawSubdomain, slug } = useParams();
  const subdomain = typeof rawSubdomain === 'string' ? rawSubdomain.toLowerCase() : '';
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
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
    <div className="min-h-screen bg-white">
      {/* Mini Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="rounded-xl font-bold gap-2 text-slate-500" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" className="relative" onClick={() => setIsCartOpen(true)}>
               <ShoppingCart className="w-5 h-5" />
               {cart.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[10px] font-black text-white flex items-center justify-center rounded-full">{cart.reduce((a,b) => a+b.quantity, 0)}</span>}
             </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-64px)]">
        {/* Visual Gallery */}
        <section className="bg-slate-50 p-6 lg:p-20 flex flex-col gap-8">
           <div className="aspect-square rounded-[40px] overflow-hidden bg-white shadow-2xl shadow-slate-200 border border-white">
              <img src={selectedImage} className="w-full h-full object-cover" alt={product.name} />
           </div>
           <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {[product.featuredImage, ...(product.gallery || [])].filter(Boolean).map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${selectedImage === img ? 'border-primary' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
           </div>
        </section>

        {/* Product Info */}
        <section className="p-8 lg:p-20 space-y-10 lg:sticky lg:top-16 lg:h-fit">
           <div className="space-y-4">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
                In Stock & Ready to Ship
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-headline font-black tracking-tighter text-slate-900 leading-[0.95]">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-4">
                 <p className="text-4xl lg:text-5xl font-black text-primary tracking-tight">${Number(product.currentPrice).toFixed(2)}</p>
                 {product.prevPrice && <p className="text-2xl text-slate-300 line-through">${Number(product.prevPrice).toFixed(2)}</p>}
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex items-center gap-6">
                 <div className="flex items-center bg-slate-100 rounded-2xl p-1.5 h-14">
                    <button onClick={() => setItemQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all shadow-none hover:shadow-sm"><Minus className="w-4 h-4" /></button>
                    <span className="w-12 text-center font-black text-lg">{quantity}</span>
                    <button onClick={() => setItemQuantity(q => q + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all shadow-none hover:shadow-sm"><Plus className="w-4 h-4" /></button>
                 </div>
                 <Button size="lg" className="flex-1 h-14 rounded-2xl text-lg font-black shadow-2xl shadow-primary/30" onClick={addToCart}>
                   Add to Cart
                 </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center text-center gap-2">
                    <Truck className="w-5 h-5 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Fast Shipping</span>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center text-center gap-2">
                    <RefreshCw className="w-5 h-5 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">30 Day Returns</span>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center text-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Secure Warranty</span>
                 </div>
              </div>
           </div>

           <Separator className="bg-slate-100" />

           <div className="space-y-4">
              <h3 className="font-headline font-black text-xl uppercase tracking-tight">Description</h3>
              <div 
                className="text-slate-500 leading-relaxed prose prose-slate"
                dangerouslySetInnerHTML={{ __html: product.description || "No detailed description available." }}
              />
           </div>

           <div className="space-y-4 pt-10">
              <div className="flex items-center gap-2 text-slate-400">
                 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                 <span className="text-sm font-medium">Verified by NexusCart Protection</span>
              </div>
           </div>
        </section>
      </main>

      {/* Cart Drawer */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-none rounded-l-[40px] overflow-hidden shadow-2xl">
          <SheetHeader className="p-8 bg-slate-900 text-white shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-headline font-black text-white flex items-center gap-3 uppercase tracking-tight">
                <ShoppingCart className="w-6 h-6 text-primary" />
                Shopping Cart
              </SheetTitle>
              <SheetClose className="text-white/60 hover:text-white transition-colors">
                <X className="w-7 h-7" />
              </SheetClose>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1 px-8 py-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-6 opacity-30">
                <ShoppingBag className="w-24 h-24" />
                <h3 className="text-xl font-bold">Your cart is empty</h3>
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
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-primary font-black text-lg">${(item.price).toFixed(2)}</p>
                      <div className="flex items-center gap-4 pt-1">
                        <div className="flex items-center bg-slate-100 rounded-lg p-1">
                          <button onClick={() => updateCartQuantity(item.id, -1)} className="p-1 hover:bg-white rounded transition-all"><Minus className="w-3 h-3" /></button>
                          <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.id, 1)} className="p-1 hover:bg-white rounded transition-all"><Plus className="w-3 h-3" /></button>
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
                <span className="text-lg font-black uppercase tracking-tighter text-slate-400">Total Amount</span>
                <span className="text-3xl font-black text-primary">${cartTotal.toFixed(2)}</span>
              </div>
              <Button className="w-full h-16 rounded-2xl text-xl font-black shadow-2xl shadow-primary/20" disabled={cart.length === 0}>
                Checkout Now
              </Button>
              <SheetClose asChild>
                <Button variant="ghost" className="w-full h-12 rounded-xl text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50">
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
