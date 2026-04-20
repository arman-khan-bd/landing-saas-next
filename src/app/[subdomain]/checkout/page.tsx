
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CreditCard, Truck, ShieldCheck, Loader2, CheckCircle2, Smartphone, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export default function CheckoutPage() {
  const { subdomain: rawSubdomain } = useParams();
  const subdomain = typeof rawSubdomain === 'string' ? rawSubdomain.toLowerCase() : '';
  const router = useRouter();
  const { toast } = useToast();

  const [store, setStore] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [clientIp, setClientIp] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "cod"
  });

  useEffect(() => {
    // Capture IP Address
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => setClientIp(data.ip))
      .catch(err => console.error("IP Capture Error:", err));

    if (subdomain) {
      fetchStoreData();
      const savedCart = localStorage.getItem(`cart_${subdomain}`);
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setCart(parsedCart);
          if (parsedCart.length === 0) {
            router.push(`/${subdomain}`);
          }
        } catch (e) {
          console.error("Cart parse error", e);
        }
      } else {
        router.push(`/${subdomain}`);
      }
    }
  }, [subdomain, router]);

  const fetchStoreData = async () => {
    try {
      const storeQuery = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQuery);
      if (!storeSnap.empty) {
        setStore({ id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = useCallback(async (data: typeof formData) => {
    if (!store || cart.length === 0) return;
    if (!data.fullName && !data.phone) return;

    const draftData = {
      storeId: store.id,
      ownerId: store.ownerId,
      items: cart,
      customer: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        ip: clientIp
      },
      total: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      lastUpdated: serverTimestamp(),
      subdomain
    };

    try {
      if (draftId) {
        await updateDoc(doc(db, "uncompleted_orders", draftId), draftData);
      } else {
        const docRef = await addDoc(collection(db, "uncompleted_orders"), draftData);
        setDraftId(docRef.id);
      }
    } catch (e) {
      console.error("Draft Save Error:", e);
    }
  }, [store, cart, draftId, subdomain, clientIp]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.fullName || formData.phone) {
        saveDraft(formData);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [formData, saveDraft]);

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill in all required fields." });
      return;
    }

    setIsPlacingOrder(true);
    try {
      // --- FRAUD SHIELD CHECK ---
      const blockValues = [clientIp, formData.email, formData.phone].filter(Boolean);
      if (blockValues.length > 0) {
        const fraudQ = query(
          collection(db, "fraud_blocks"),
          where("storeId", "==", store.id),
          where("value", "in", blockValues),
          limit(1)
        );
        const fraudSnap = await getDocs(fraudQ);
        if (!fraudSnap.empty) {
          toast({ 
            variant: "destructive", 
            title: "Transaction Denied", 
            description: "Your details have been restricted by the merchant. Please use different details or contact support." 
          });
          setIsPlacingOrder(false);
          return;
        }
      }

      const orderData = {
        storeId: store.id,
        ownerId: store.ownerId,
        items: cart,
        customer: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          ip: clientIp
        },
        total: cartTotal,
        paymentMethod: formData.paymentMethod,
        status: "pending",
        paymentStatus: "unpaid",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "orders"), orderData);
      
      if (draftId) {
        await deleteDoc(doc(db, "uncompleted_orders", draftId));
      }

      localStorage.removeItem(`cart_${subdomain}`);
      setOrderSuccess(true);
      toast({ title: "Order Placed!", description: "Your order has been successfully received." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Order Failed", description: "Something went wrong while placing your order." });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight">THANK YOU!</h1>
        <p className="text-slate-500 mt-2 max-w-sm mx-auto">Your order has been placed successfully. We'll contact you soon for confirmation.</p>
        <div className="mt-10 flex flex-col gap-3 w-full max-w-xs">
          <Link href={`/${subdomain}`}>
            <Button className="w-full rounded-2xl h-14 font-bold text-lg shadow-xl shadow-primary/20">Back to Store</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" className="rounded-xl font-bold gap-2 text-slate-500" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <Link href={`/${subdomain}`} className="flex items-center gap-2">
            <h1 className="text-lg font-headline font-black tracking-tighter text-slate-900 uppercase">
              {store?.name}
            </h1>
          </Link>
          <div className="w-20" />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Truck className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-headline font-black tracking-tight text-slate-900 uppercase">Shipping Information</h2>
              </div>

              <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name *</Label>
                      <Input 
                        placeholder="John Doe" 
                        className="h-12 rounded-xl bg-slate-50 border-none px-4" 
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Number *</Label>
                      <Input 
                        placeholder="01XXXXXXXXX" 
                        className="h-12 rounded-xl bg-slate-50 border-none px-4" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address (Optional)</Label>
                    <Input 
                      placeholder="john@example.com" 
                      className="h-12 rounded-xl bg-slate-50 border-none px-4" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Delivery Address *</Label>
                    <Textarea 
                      placeholder="Flat, House, Street, Area, City" 
                      className="min-h-[100px] rounded-2xl bg-slate-50 border-none p-4" 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-headline font-black tracking-tight text-slate-900 uppercase">Payment Method</h2>
              </div>

              <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
                <CardContent className="p-6 sm:p-8">
                  <RadioGroup value={formData.paymentMethod} onValueChange={(val) => setFormData({...formData, paymentMethod: val})} className="space-y-4">
                    {store?.paymentSettings?.cod && (
                      <div 
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-slate-50 bg-slate-50/50'}`}
                        onClick={() => setFormData({...formData, paymentMethod: 'cod'})}
                      >
                        <div className="flex items-center gap-4">
                          <RadioGroupItem value="cod" id="cod" className="border-primary text-primary" />
                          <div>
                            <Label htmlFor="cod" className="font-bold text-base cursor-pointer">Cash on Delivery</Label>
                            <p className="text-xs text-muted-foreground">Pay when you receive the product.</p>
                          </div>
                        </div>
                        <Truck className="w-5 h-5 text-slate-300" />
                      </div>
                    )}

                    {store?.paymentSettings?.manualEnabled && (
                      <div 
                        className={`flex flex-col p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.paymentMethod === 'manual' ? 'border-primary bg-primary/5' : 'border-slate-50 bg-slate-50/50'}`}
                        onClick={() => setFormData({...formData, paymentMethod: 'manual'})}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <RadioGroupItem value="manual" id="manual" className="border-primary text-primary" />
                            <div>
                              <Label htmlFor="manual" className="font-bold text-base cursor-pointer">Manual Payment</Label>
                              <p className="text-xs text-muted-foreground">Mobile Banking / Bank Transfer.</p>
                            </div>
                          </div>
                          <CreditCard className="w-5 h-5 text-slate-300" />
                        </div>
                        {formData.paymentMethod === 'manual' && (
                          <div className="mt-4 p-5 bg-white/80 rounded-2xl border border-primary/10 space-y-4 animate-in slide-in-from-top-2 duration-300">
                             <div className="flex items-center gap-2 text-primary">
                               <Smartphone className="w-4 h-4" />
                               <span className="text-[10px] font-black uppercase tracking-widest">Payment Numbers</span>
                             </div>
                             
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {store.paymentSettings.bkashNumber && (
                                  <div className="flex justify-between items-center p-3 bg-pink-50 rounded-xl">
                                     <span className="text-xs font-black text-pink-600">bKash</span>
                                     <span className="text-sm font-mono font-bold">{store.paymentSettings.bkashNumber}</span>
                                  </div>
                                )}
                                {store.paymentSettings.nagadNumber && (
                                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
                                     <span className="text-xs font-black text-orange-600">Nagad</span>
                                     <span className="text-sm font-mono font-bold">{store.paymentSettings.nagadNumber}</span>
                                  </div>
                                )}
                             </div>

                             {store.paymentSettings.manualDetails && (
                               <div className="text-[11px] leading-relaxed text-slate-600 pt-3 border-t border-slate-100 italic" 
                                    dangerouslySetInnerHTML={{ __html: store.paymentSettings.manualDetails.replace(/\n/g, '<br/>') }} />
                             )}
                          </div>
                        )}
                      </div>
                    )}
                  </RadioGroup>
                </CardContent>
              </Card>
            </section>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-headline font-black tracking-tight text-slate-900 uppercase">Order Summary</h2>
            <Card className="rounded-[40px] border-none shadow-xl bg-white overflow-hidden sticky top-24">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-xl bg-slate-50 border overflow-hidden shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs line-clamp-1">{item.name}</h4>
                        <p className="text-slate-400 text-[10px] font-bold">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                      </div>
                      <p className="font-black text-sm text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                    <span className="font-bold">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Shipping</span>
                    <span className="text-emerald-500 font-black">FREE</span>
                  </div>
                  <Separator className="bg-slate-50" />
                  <div className="flex justify-between items-end pt-2">
                    <span className="text-slate-900 font-black uppercase tracking-tight text-lg">Total</span>
                    <span className="text-3xl font-black text-primary tracking-tighter">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full h-16 rounded-[24px] text-xl font-black shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95" 
                  disabled={isPlacingOrder || cart.length === 0}
                  onClick={handlePlaceOrder}
                >
                  {isPlacingOrder ? <Loader2 className="w-6 h-6 animate-spin" /> : "Place Order Now"}
                </Button>

                <div className="flex items-center justify-center gap-2 text-slate-400">
                   <ShieldCheck className="w-4 h-4 text-emerald-500" />
                   <span className="text-[9px] font-black uppercase tracking-[0.2em]">Secure Checkout</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
