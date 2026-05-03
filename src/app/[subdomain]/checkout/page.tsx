"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CreditCard, Truck, ShieldCheck, Loader2, CheckCircle2, Smartphone, ShieldAlert, SmartphoneIcon, User, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { sendSMS } from "@/app/actions/sms";
import { syncCustomerData } from "@/app/actions/customers";
import * as fpixel from "@/lib/fpixel";

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
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [clientIp, setClientIp] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "cod",
    selectedManualMethodId: "",
    transactionId: "",
    otp: ""
  });
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);

  useEffect(() => {
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
          const savedDraftId = localStorage.getItem(`draftId_${subdomain}`);
          if (savedDraftId) setDraftId(savedDraftId);
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
        const storeData = { id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() };
        setStore(storeData);
        if (storeData.shippingSettings?.enabled && storeData.shippingSettings.methods?.length > 0) {
          setSelectedShipping(storeData.shippingSettings.methods[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      if (cart.length > 0) {
        fpixel.event('InitiateCheckout', {
          content_ids: cart.map(i => i.id),
          content_type: 'product',
          value: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
          currency: 'BDT'
        });
      }
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
      subtotal: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      shippingCost: selectedShipping?.cost || 0,
      total: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) + (selectedShipping?.cost || 0),
      shipping: selectedShipping ? {
        id: selectedShipping.id,
        name: selectedShipping.name,
        cost: selectedShipping.cost
      } : null,
      isRead: false,
      lastUpdated: serverTimestamp(),
      subdomain
    };

    try {
      if (draftId) {
        await updateDoc(doc(db, "uncompleted_orders", draftId), draftData);
      } else {
        const docRef = await addDoc(collection(db, "uncompleted_orders"), draftData);
        setDraftId(docRef.id);
        localStorage.setItem(`draftId_${subdomain}`, docRef.id);
      }
    } catch (e) {
      console.error("Draft Save Error:", e);
    }
  }, [store, cart, draftId, subdomain, clientIp, selectedShipping]);

  const normalizePhoneNumber = (phone: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      return '88' + cleaned;
    }
    if (cleaned.length === 13 && cleaned.startsWith('880')) {
      return cleaned;
    }
    if (cleaned.length === 10) {
      return '880' + cleaned;
    }
    return cleaned;
  };

  const sendVerificationCode = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a valid phone number." });
      return;
    }
    setSendingSms(true);
    try {
      const normalizedPhone = normalizePhoneNumber(formData.phone);
      const storeName = store?.name || "Store";
      
      // Check IP Block
      const ipQ = query(
        collection(db, "customers"),
        where("storeId", "==", store.id),
        where("ips", "array-contains", clientIp),
        where("status.ipBlocked", "==", true)
      );
      const ipSnap = await getDocs(ipQ);
      if (!ipSnap.empty) {
        toast({ variant: "destructive", title: "Access Denied", description: "You are blocked from admin." });
        return;
      }

      const result = await sendSMS(normalizedPhone, storeName, store.id);
      
      if (!result.success) {
        toast({ 
          variant: "destructive", 
          title: "Failed", 
          description: result.error || "Please try again later." 
        });
        return;
      }
      
      setOtpSent(true);
      toast({ title: "OTP Sent", description: "Verification code sent to your mobile." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "SMS Failed" });
    } finally {
      setSendingSms(false);
    }
  };

  const verifyOtp = async () => {
    if (!formData.otp) return;
    setVerifying(true);
    try {
      const normalizedPhone = normalizePhoneNumber(formData.phone);
      const q = query(
        collection(db, "verification_codes"),
        where("phone", "==", normalizedPhone),
        where("code", "==", formData.otp),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setIsVerified(true);
        toast({ title: "Verified", description: "Phone number successfully verified." });
      } else {
        toast({ variant: "destructive", title: "Invalid Code" });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.fullName || formData.phone) {
        saveDraft(formData);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [formData, saveDraft, selectedShipping]);

  const cartSubtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingCost = selectedShipping?.cost || 0;
  const cartTotal = cartSubtotal + shippingCost;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill in all required fields." });
      return;
    }

    if (!isVerified && (store?.otpVerification !== false)) {
      toast({ variant: "destructive", title: "Verification Required", description: "Please verify your phone number first." });
      return;
    }

    if (formData.paymentMethod === 'manual' && !formData.transactionId) {
      toast({ variant: "destructive", title: "Transaction ID Required", description: "Please enter your payment Transaction ID." });
      return;
    }

    setIsPlacingOrder(true);
    try {
      const blockValues = [clientIp, formData.phone].filter(Boolean);
      if (blockValues.length > 0) {
        const fraudQ = query(
          collection(db, "fraud_blocks"),
          where("storeId", "==", store.id),
          where("value", "in", blockValues),
          limit(1)
        );
        const fraudSnap = await getDocs(fraudQ);
        if (!fraudSnap.empty) {
          toast({ variant: "destructive", title: "Transaction Denied", description: "Your details have been restricted by the merchant." });
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
          phone: normalizePhoneNumber(formData.phone),
          address: formData.address,
          ip: clientIp
        },
        shipping: selectedShipping ? {
          name: selectedShipping.name,
          cost: shippingCost
        } : { name: "Free Shipping", cost: 0 },
        subtotal: cartSubtotal,
        shippingCost: shippingCost,
        total: cartTotal,
        paymentMethod: formData.paymentMethod,
        transactionId: formData.paymentMethod === 'manual' ? formData.transactionId : null,
        selectedManualMethodId: formData.paymentMethod === 'manual' ? formData.selectedManualMethodId : null,
        status: "pending",
        paymentStatus: formData.paymentMethod === 'cod' ? "unpaid" : "pending_verification",
        isRead: false,
        createdAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db, "orders"), orderData);
      
      // Sync Customer Data
      await syncCustomerData({
        ...orderData,
        id: orderRef.id
      });

      if (draftId) {
        await deleteDoc(doc(db, "uncompleted_orders", draftId));
        localStorage.removeItem(`draftId_${subdomain}`);
      }
      localStorage.removeItem(`cart_${subdomain}`);
      
      fpixel.event('Purchase', {
        value: cartTotal,
        currency: 'BDT',
        content_ids: cart.map(i => i.id),
        content_type: 'product'
      });

      setOrderSuccess(true);
      toast({ title: "Order Placed!", description: "Your order has been successfully received." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Order Failed" });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const selectedManualMethod = store?.paymentSettings?.manualMethods?.find((m: any) => m.id === formData.selectedManualMethodId);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6"><CheckCircle2 className="w-12 h-12" /></div>
        <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight">THANK YOU!</h1>
        <p className="text-slate-500 mt-2 max-w-sm mx-auto">Your order has been placed successfully. We'll contact you soon for confirmation.</p>
        <div className="mt-10 flex flex-col gap-3 w-full max-w-xs"><Link href={`/${subdomain}`}><Button className="w-full rounded-2xl h-14 font-bold text-lg shadow-xl shadow-primary/20">Back to Store</Button></Link></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">

      <main className="max-w-6xl mx-auto p-2 md:p-6 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <section className="space-y-4">
              <div className="flex items-center gap-2"><div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><User className="w-4 h-4" /></div><h2 className="text-lg font-headline font-black tracking-tight text-slate-900 uppercase">Customer Details</h2></div>
              <Card className="rounded-[24px] border-none shadow-sm overflow-hidden bg-white">
                <CardContent className="p-4 md:p-8 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Full Name *</Label><Input placeholder="John Doe" className="h-10 rounded-xl bg-slate-50 border-none px-4 text-sm" value={formData.fullName} onChange={(e) => setFormData(prev => ({...prev, fullName: e.target.value}))} /></div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Contact Number *</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input placeholder="01XXXXXXXXX" className="h-10 rounded-xl bg-slate-50 border-none px-4 text-sm" value={formData.phone} onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))} disabled={isVerified} />
                            {isVerified && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />}
                          </div>
                          {(store?.otpVerification !== false) && !isVerified && (
                            <Button size="sm" className="h-10 px-4 rounded-xl text-[10px] font-bold" onClick={sendVerificationCode} disabled={sendingSms || !formData.phone}>{sendingSms ? <Loader2 className="w-3 h-3 animate-spin" /> : otpSent ? "Resend" : "Verify"}</Button>
                          )}
                        </div>
                        {(store?.otpVerification !== false) && otpSent && !isVerified && (
                          <div className="flex flex-col gap-3 items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-1">
                            <Label className="text-[9px] font-black uppercase text-slate-400">Enter Verification Code</Label>
                            <InputOTP 
                               maxLength={6} 
                               value={formData.otp} 
                               onChange={(val) => setFormData(prev => ({...prev, otp: val}))}
                             >
                               <InputOTPGroup>
                                 <InputOTPSlot index={0} className="bg-white" />
                                 <InputOTPSlot index={1} className="bg-white" />
                                 <InputOTPSlot index={2} className="bg-white" />
                                 <InputOTPSlot index={3} className="bg-white" />
                                 <InputOTPSlot index={4} className="bg-white" />
                                 <InputOTPSlot index={5} className="bg-white" />
                               </InputOTPGroup>
                             </InputOTP>
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="w-full h-10 rounded-xl text-[10px] font-bold bg-primary text-white hover:bg-primary/90" 
                              onClick={verifyOtp} 
                              disabled={verifying || formData.otp.length < 6}
                            >
                              {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify & Continue"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Email Address (Optional)</Label><Input placeholder="john@example.com" className="h-10 rounded-xl bg-slate-50 border-none px-4 text-sm" value={formData.email} onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))} /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Full Delivery Address *</Label><Textarea placeholder="Flat, House, Street, Area, City" className="min-h-[80px] rounded-xl bg-slate-50 border-none p-4 text-sm" value={formData.address} onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))} /></div>
                </CardContent>
              </Card>
            </section>

            {store?.shippingSettings?.enabled && store.shippingSettings.methods?.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3"><div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500"><Truck className="w-5 h-5" /></div><h2 className="text-2xl font-headline font-black tracking-tight text-slate-900 uppercase">Shipping Zone</h2></div>
                <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
                  <CardContent className="p-6 sm:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {store.shippingSettings.methods.map((method: any) => (
                        <div 
                          key={method.id} 
                          className={cn("flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer", selectedShipping?.id === method.id ? 'border-primary bg-primary/5' : 'border-slate-50 bg-slate-50/50')} 
                          onClick={() => setSelectedShipping(method)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", selectedShipping?.id === method.id ? 'border-primary' : 'border-slate-300')}>
                              {selectedShipping?.id === method.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-base cursor-pointer truncate block">{method.name}</span>
                              <p className="text-xs text-muted-foreground">{method.cost > 0 ? `$${method.cost.toFixed(2)}` : 'Free Delivery'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            <section className="space-y-6">
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent"><CreditCard className="w-5 h-5" /></div><h2 className="text-2xl font-headline font-black tracking-tight text-slate-900 uppercase">Payment Strategy</h2></div>
              <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
                <CardContent className="p-6 sm:p-8 space-y-4">
                  {store?.paymentSettings?.cod && (
                    <div 
                      className={cn("flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer", formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-slate-50 bg-slate-50/50')} 
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cod', selectedManualMethodId: "", transactionId: "" }))}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.paymentMethod === 'cod' ? 'border-primary' : 'border-slate-300')}>
                          {formData.paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <span className="font-bold text-base cursor-pointer">Cash on Delivery</span>
                      </div>
                      <Truck className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                  {store?.paymentSettings?.manualEnabled && store.paymentSettings.manualMethods?.length > 0 && (
                    <div 
                      className={cn("flex flex-col p-4 rounded-2xl border-2 transition-all cursor-pointer", formData.paymentMethod === 'manual' ? 'border-primary bg-primary/5' : 'border-slate-50 bg-slate-50/50')} 
                      onClick={() => setFormData(prev => ({...prev, paymentMethod: 'manual'}))}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.paymentMethod === 'manual' ? 'border-primary' : 'border-slate-300')}>
                            {formData.paymentMethod === 'manual' && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          <span className="font-bold text-base cursor-pointer">Manual Payment</span>
                        </div>
                        <SmartphoneIcon className="w-5 h-5 text-slate-300" />
                      </div>
                      {formData.paymentMethod === 'manual' && (
                        <div className="mt-6 p-6 bg-white/80 rounded-2xl border border-primary/10 space-y-6 animate-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Select Provider</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {store.paymentSettings.manualMethods.map((method: any) => (
                                <div key={method.id} onClick={() => setFormData(prev => ({...prev, selectedManualMethodId: method.id}))} className={cn("p-4 rounded-xl border-2 transition-all text-center cursor-pointer", formData.selectedManualMethodId === method.id ? 'border-primary bg-primary/5 text-primary' : 'border-slate-50 bg-slate-50 hover:bg-slate-100')}><p className="text-xs font-black uppercase tracking-tight">{method.name}</p></div>
                              ))}
                            </div>
                          </div>
                          {selectedManualMethod && (
                            <div className="space-y-6">
                              <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between group">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black uppercase text-primary">Number</p>
                                  <p className="text-lg font-mono font-black text-slate-900 select-all">{selectedManualMethod.number}</p>
                                  {selectedManualMethod.instructions && <div className="text-[11px] leading-relaxed text-slate-600 italic whitespace-pre-wrap">{selectedManualMethod.instructions}</div>}
                                </div>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg hover:bg-primary/5 text-primary shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(selectedManualMethod.number);
                                    toast({ title: "Copied", description: "Payment number copied to clipboard." });
                                  }}
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Transaction ID *</Label>
                                <Input placeholder="Enter the ID from your SMS" className="h-12 rounded-xl bg-white border-primary/20 font-mono text-center text-lg" value={formData.transactionId} onChange={(e) => setFormData(prev => ({...prev, transactionId: e.target.value.toUpperCase()}))} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-headline font-black tracking-tight text-slate-900 uppercase">Order Strategy</h2>
            <Card className="rounded-[32px] border-none shadow-xl bg-white overflow-hidden sticky top-20">
              <CardContent className="p-6 space-y-5">
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3 items-center"><div className="w-12 h-12 rounded-lg bg-slate-50 border overflow-hidden shrink-0"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div><div className="flex-1 min-w-0"><h4 className="font-bold text-[11px] line-clamp-1">{item.name}</h4><p className="text-slate-400 text-[9px] font-bold">Qty: {item.quantity} × ৳{item.price.toFixed(2)}</p></div><p className="font-black text-xs text-slate-900">৳{(item.price * item.quantity).toFixed(2)}</p></div>
                  ))}
                </div>
                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Subtotal</span><span className="font-bold text-xs">৳{cartSubtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Delivery</span><span className={cn("font-black text-xs", shippingCost > 0 ? "text-slate-900" : "text-emerald-500")}>{shippingCost > 0 ? `৳${shippingCost.toFixed(2)}` : 'FREE'}</span></div>
                  <Separator className="bg-slate-50" /><div className="flex justify-between items-end pt-1"><span className="text-slate-900 font-black uppercase tracking-tight text-base leading-none">Total</span><span className="text-2xl font-black text-primary tracking-tighter">৳{cartTotal.toFixed(2)}</span></div>
                    <Button 
                      type="button" 
                      className="w-full h-16 rounded-[24px] text-xl font-black shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale" 
                      disabled={isPlacingOrder || (!isVerified && (store?.otpVerification !== false)) || cart.length === 0}
                      onClick={handlePlaceOrder}
                    >
                      {isPlacingOrder ? <Loader2 className="w-6 h-6 animate-spin" /> : (!isVerified && (store?.otpVerification !== false)) ? "Verify to Complete" : "Confirm My Order"}
                    </Button>
                </div>
                {!isVerified && (store?.otpVerification !== false) && <p className="text-[10px] text-center font-bold text-rose-500 uppercase tracking-widest animate-pulse">Verification Required to Checkout</p>}
                <div className="flex items-center justify-center gap-2 text-slate-400"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">Global Secure Network</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
