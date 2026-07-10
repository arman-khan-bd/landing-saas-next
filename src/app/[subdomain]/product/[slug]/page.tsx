<<<<<<< HEAD
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabaseClient } from "@/supabase";
import { getSubdomain } from "@/lib/subdomain";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ShoppingCart, Loader2, CheckCircle2, Plus, Minus, X, Trash2, ChevronLeft, ShieldCheck, Truck, CreditCard, Smartphone } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, getTenantPath } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export default function ProductDetailPage() {
  const { subdomain: paramsSubdomain, slug } = useParams();
  const supabase = useSupabaseClient();
  const [subdomain, setSubdomain] = useState<string>("");
  const { toast } = useToast();
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quantity, setItemQuantity] = useState(1);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [clientIp, setClientIp] = useState("");
  const [selectedShipping, setSelectedShipping] = useState<any>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    paymentMethod: "cod",
    selectedManualMethodId: "",
    transactionId: ""
  });

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

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => setClientIp(data.ip))
      .catch(err => console.error("IP Capture Error:", err));

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
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("subdomain", subdomain)
        .single();
      if (storeData) {
        setStore(storeData);
        if (storeData.shippingSettings?.enabled && storeData.shippingSettings.methods?.length > 0) {
          setSelectedShipping(storeData.shippingSettings.methods[0]);
        }
      }

      const { data: prodData } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .single();

      if (prodData) {
        setProduct(prodData);
        setSelectedImage(prodData.featuredImage || (prodData.gallery && prodData.gallery[0]) || "");
      } else {
        setProduct(null);
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

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!formData.fullName || !formData.phone || !formData.address) {
      toast({ variant: "destructive", title: "তথ্য অসম্পূর্ণ", description: "অনুগ্রহ করে সব প্রয়োজনীয় তথ্য প্রদান করুন।" });
      return;
    }

    if (formData.paymentMethod === 'manual' && (!formData.transactionId || !formData.selectedManualMethodId)) {
      toast({ variant: "destructive", title: "পেমেন্ট তথ্য প্রয়োজন", description: "অনুগ্রহ করে পেমেন্ট মেথড এবং ট্রানজাকশন আইডি প্রদান করুন।" });
      return;
    }

    setIsPlacingOrder(true);
    try {
      const blockValues = [clientIp, formData.phone].filter(Boolean);
      if (blockValues.length > 0) {
        const { data: fraudData } = await supabase
          .from("fraud_blocks")
          .select("id")
          .eq("store_id", store.id)
          .in("value", blockValues)
          .limit(1);

        if (fraudData && fraudData.length > 0) {
          toast({ variant: "destructive", title: "Transaction Denied", description: "Security restriction applied." });
          setIsPlacingOrder(false);
          return;
        }
      }

      const shippingCost = selectedShipping?.cost || 0;
      const subtotal = Number(product.currentPrice) * quantity;
      const total = subtotal + shippingCost;

      const orderData = {
        store_id: store.id,
        owner_id: store.ownerId || store.owner_id,
        items: [{
          id: product.id,
          name: product.name,
          price: Number(product.currentPrice),
          image: selectedImage,
          quantity: quantity
        }],
        customer: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          ip: clientIp
        },
        shipping: selectedShipping ? {
          name: selectedShipping.name,
          cost: shippingCost
        } : { name: "Direct Order", cost: 0 },
        subtotal: subtotal,
        shipping_cost: shippingCost,
        total: total,
        payment_method: formData.paymentMethod,
        transaction_id: formData.paymentMethod === 'manual' ? formData.transactionId : null,
        selected_manual_method_id: formData.paymentMethod === 'manual' ? formData.selectedManualMethodId : null,
        status: "pending",
        payment_status: formData.paymentMethod === 'cod' ? "unpaid" : "pending_verification",
        is_read: false
      };

      await supabase.from("orders").insert(orderData);
      toast({ title: "অর্ডার সফল হয়েছে!", description: "আপনার অর্ডারটি গ্রহণ করা হয়েছে।" });
      setFormData({ fullName: "", phone: "", address: "", paymentMethod: "cod", selectedManualMethodId: "", transactionId: "" });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Order Failed" });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) return { ...item, quantity: Math.max(1, item.quantity + delta) };
      return item;
    }));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  
  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cart]);

  const selectedManualMethod = store?.paymentSettings?.manualMethods?.find((m: any) => m.id === formData.selectedManualMethodId);

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>;

  if (!product) return (
    <div className="flex flex-col h-screen items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-black">Item Not Found</h1>
      <Link href={getTenantPath(subdomain, "/")}>
        <Button className="rounded-2xl h-12 px-8">Return to Shop</Button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
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

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
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

          <section className="space-y-8">
            <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-sm border border-slate-100">
              <div className="space-y-3">
                <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">অফিসিয়াল প্রোডাক্ট</Badge>
                <h1 className="text-3xl lg:text-5xl font-headline font-black tracking-tighter text-slate-900 leading-[0.95]">{product.name}</h1>
                <div className="flex items-center gap-4">
                  <p className="text-3xl lg:text-4xl font-black text-primary tracking-tight">${Number(product.currentPrice).toFixed(2)}</p>
                  {product.prevPrice && <p className="text-lg text-slate-300 line-through">${Number(product.prevPrice).toFixed(2)}</p>}
                </div>
              </div>

              <div className="space-y-6 mt-8">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="flex items-center bg-slate-50 rounded-2xl p-1 h-12 border border-slate-100">
                    <button onClick={() => setItemQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all"><Minus className="w-4 h-4" /></button>
                    <span className="w-10 text-center font-black text-base">{quantity}</span>
                    <button onClick={() => setItemQuantity(q => q + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all"><Plus className="w-4 h-4" /></button>
                  </div>
                  <Button size="lg" className="flex-1 h-12 rounded-2xl text-base font-black shadow-xl shadow-primary/20" onClick={addToCart}>কার্টে যোগ করুন</Button>
                </div>
              </div>

              <Separator className="my-8 bg-slate-100" />
              <div className="space-y-3">
                <h3 className="font-headline font-black text-sm uppercase tracking-widest text-slate-400">বিবরণ</h3>
                <div className="text-slate-600 text-sm leading-relaxed prose prose-sm prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: product.description || "No detailed description available." }} />
              </div>
            </div>

            <Card className="rounded-[40px] border-none shadow-2xl overflow-hidden bg-white ring-4 ring-primary/5">
              <div className="bg-[#161625] text-white p-6 sm:p-10 text-center">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><Truck className="w-6 h-6 text-primary" /></div>
                <h3 className="text-3xl font-headline font-black tracking-tight uppercase">অর্ডার কনফার্ম করুন</h3>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">নিরাপদ এবং দ্রুত ডেলিভারি</p>
              </div>
              <CardContent className="p-6 sm:p-10 space-y-8">
                <div className="space-y-8">
                  {store?.shippingSettings?.enabled && (
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">ডেলিভারি এরিয়া নির্বাচন করুন</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {store.shippingSettings.methods.map((method: any) => (
                          <div 
                            key={method.id} 
                            className={cn("flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer", selectedShipping?.id === method.id ? 'border-primary bg-primary/5' : 'bg-slate-50 border-transparent')} 
                            onClick={() => setSelectedShipping(method)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", selectedShipping?.id === method.id ? 'border-primary' : 'border-slate-300')}>
                                {selectedShipping?.id === method.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                              </div>
                              <span className="font-bold text-xs">{method.name}</span>
                            </div>
                            <span className="font-black text-[10px]">${method.cost}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">আপনার তথ্য প্রদান করুন</Label>
                    <div className="space-y-4">
                      <Input placeholder="আপনার পুরো নাম" className="h-12 rounded-xl bg-slate-50 border-none px-4" value={formData.fullName} onChange={(e) => setFormData(prev => ({...prev, fullName: e.target.value}))} />
                      <Input placeholder="মোবাইল নাম্বার" className="h-12 rounded-xl bg-slate-50 border-none px-4" value={formData.phone} onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))} />
                      <Textarea placeholder="পুরো ঠিকানা (বাসা/রোড, জেলা)" className="min-h-[100px] rounded-2xl bg-slate-50 border-none p-4" value={formData.address} onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))} />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">পেমেন্ট মেথড</Label>
                    <div className="grid gap-3">
                      {store?.paymentSettings?.cod && (
                        <div 
                          className={cn("flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all", formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'bg-slate-50 border-transparent')} 
                          onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cod', selectedManualMethodId: "", transactionId: "" }))}
                        >
                          <div className="flex items-center gap-3">
                             <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.paymentMethod === 'cod' ? 'border-primary' : 'border-slate-300')}>
                               {formData.paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-primary" />}
                             </div>
                             <span className="font-bold cursor-pointer">ক্যাশ অন ডেলিভারি</span>
                          </div>
                          <Truck className="w-5 h-5 text-slate-300" />
                        </div>
                      )}
                      {store?.paymentSettings?.manualEnabled && store.paymentSettings.manualMethods?.length > 0 && (
                        <div 
                          className={cn("flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all", formData.paymentMethod === 'manual' ? 'border-primary bg-primary/5' : 'bg-slate-50 border-transparent')} 
                          onClick={() => setFormData(prev => ({...prev, paymentMethod: 'manual'}))}
                        >
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.paymentMethod === 'manual' ? 'border-primary' : 'border-slate-300')}>
                                  {formData.paymentMethod === 'manual' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                                <span className="font-bold cursor-pointer">বিকাশ/নগদ/রকেট</span>
                             </div>
                             <Smartphone className="w-5 h-5 text-slate-300" />
                          </div>
                          {formData.paymentMethod === 'manual' && (
                             <div className="mt-4 pt-4 border-t border-primary/10 space-y-4 animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-2 gap-2">
                                   {store.paymentSettings.manualMethods.map((m: any) => (
                                     <Button key={m.id} type="button" variant="outline" className={cn("h-10 rounded-xl text-[10px] font-black uppercase", formData.selectedManualMethodId === m.id ? 'bg-primary text-white' : '')} onClick={(e) => { e.stopPropagation(); setFormData(prev => ({...prev, selectedManualMethodId: m.id})); }}>{m.name}</Button>
                                    ))}
                                </div>
                                {selectedManualMethod && (
                                   <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                                      <div className="p-4 bg-white rounded-2xl border border-primary/10">
                                         <p className="text-[10px] font-black text-primary uppercase">নাম্বার: {selectedManualMethod.number}</p>
                                         <p className="text-[10px] text-slate-500 mt-1 italic whitespace-pre-wrap">{selectedManualMethod.instructions}</p>
                                      </div>
                                      <Input placeholder="ট্রানজাকশন আইডি লিখুন" className="h-12 rounded-xl bg-white border-primary/20" value={formData.transactionId} onChange={(e) => setFormData(prev => ({...prev, transactionId: e.target.value.toUpperCase()}))} />
                                   </div>
                                )}
                             </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 space-y-6">
                    <div className="bg-slate-50 p-6 rounded-[32px] border space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest"><span>পণ্য মূল্য</span><span>${(Number(product.currentPrice) * quantity).toFixed(2)}</span></div>
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest"><span>ডেলিভারি চার্জ</span><span>${(selectedShipping?.cost || 0).toFixed(2)}</span></div>
                      <Separator className="bg-slate-200" />
                      <div className="flex justify-between items-end text-3xl font-black text-primary"><span className="text-[10px] pb-2 text-slate-900 uppercase">মোট</span><span>${(Number(product.currentPrice) * quantity + (selectedShipping?.cost || 0)).toFixed(2)}</span></div>
                    </div>
                    <Button type="button" onClick={handlePlaceOrder} disabled={isPlacingOrder} className="w-full h-16 rounded-[24px] text-xl font-black shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">{isPlacingOrder ? <Loader2 className="w-6 h-6 animate-spin" /> : "অর্ডার সম্পন্ন করুন"}</Button>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-slate-400 mt-6"><ShieldCheck className="w-4 h-4 text-emerald-500" /><span className="text-[9px] font-black uppercase tracking-[0.2em]">নিরাপদ পেমেন্ট ব্যবস্থা</span></div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

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
                      <div className="flex items-center justify-between"><p className="text-primary font-black text-sm">${(item.price).toFixed(2)}</p><div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5"><button onClick={() => updateCartQuantity(item.id, -1)} className="p-1 hover:bg-slate-50 rounded transition-all"><Minus className="w-3 h-3" /></button><span className="w-6 text-center text-[10px] font-bold">{item.quantity}</span><button onClick={() => updateCartQuantity(item.id, 1)} className="p-1 hover:bg-slate-50 rounded transition-all"><Plus className="w-3 h-3" /></button></div></div>
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
=======
import { Metadata, ResolvingMetadata } from "next";
import { getStoreBySubdomain, getProductBySlug } from "@/lib/store-server";
import ProductClient from "./ProductClient";

type Props = {
  params: Promise<{ subdomain: string; slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { subdomain, slug } = await params;
  const store = await getStoreBySubdomain(subdomain);
  
  if (!store) return { title: "Store Not Found" };
  
  const product = await getProductBySlug(store.id, slug);
  
  if (!product) return { title: "Product Not Found" };

  const title = `${product.name} | ${store.name || subdomain}`;
  const description = product.description?.substring(0, 160) || `Buy ${product.name} at ${store.name}. Best prices and quality.`;
  const image = product.featuredImage || product.gallery?.[0] || "";

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: image ? [image] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { subdomain, slug } = await params;
  const store = await getStoreBySubdomain(subdomain);
  const product = store ? await getProductBySlug(store.id, slug) : null;

  const jsonLd = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.featuredImage || product.gallery?.[0],
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": store?.name
    },
    "offers": {
      "@type": "Offer",
      "url": `https://${subdomain}.ihut.shop/product/${slug}`,
      "priceCurrency": "USD",
      "price": product.currentPrice,
      "availability": "https://schema.org/InStock"
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductClient initialProduct={product} initialStore={store} />
    </>
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
  );
}
