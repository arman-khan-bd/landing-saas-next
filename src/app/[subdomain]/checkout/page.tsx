"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
<<<<<<< HEAD
import { useSupabaseClient } from "@/supabase";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CreditCard, Truck, ShieldCheck, Loader2, CheckCircle2, User } from "lucide-react";
=======
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CreditCard, Truck, ShieldCheck, Loader2, CheckCircle2, Smartphone, ShieldAlert, SmartphoneIcon, User, Copy, ShoppingCart } from "lucide-react";
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
<<<<<<< HEAD
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
=======
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { cn, getTenantPath, getCurrencySymbol } from "@/lib/utils";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { sendSMS } from "@/app/actions/sms";
import { syncCustomerData } from "@/app/actions/customers";
import * as fpixel from "@/lib/fpixel";
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58

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
<<<<<<< HEAD
  const supabase = useSupabaseClient();
=======
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58

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
<<<<<<< HEAD
    transactionId: ""
  });
=======
    transactionId: "",
    otp: ""
  });
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58

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
<<<<<<< HEAD
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("subdomain", subdomain)
        .single();
      if (storeData) {
=======
      const storeQuery = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQuery);
      if (!storeSnap.empty) {
        const storeData = { id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() };
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
        setStore(storeData);
        if (storeData.shippingSettings?.enabled && storeData.shippingSettings.methods?.length > 0) {
          setSelectedShipping(storeData.shippingSettings.methods[0]);
        }
<<<<<<< HEAD
      }
    } catch (e) {
      console.error(e);
=======
        if (storeData.otpVerification === false || storeData.isOtpDisabled) setIsVerified(true);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error(error);
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const saveDraft = useCallback(async (data: typeof formData) => {
    if (!store || cart.length === 0) return;
    if (!data.fullName && !data.phone) return;

    const draftData = {
      store_id: store.id,
      owner_id: store.owner_id || store.ownerId,
      items: cart,
      customer: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        ip: clientIp
      },
      subtotal: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      shipping_cost: selectedShipping?.cost || 0,
      total: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) + (selectedShipping?.cost || 0),
      shipping: selectedShipping ? {
        id: selectedShipping.id,
        name: selectedShipping.name,
        cost: selectedShipping.cost
      } : null,
      is_read: false,
      updated_at: new Date().toISOString()
    };

    try {
      if (draftId) {
        await supabase.from("uncompleted_orders").update(draftData).eq("id", draftId);
      } else {
        const { data: inserted, error } = await supabase.from("uncompleted_orders").insert(draftData).select("id").single();
        if (inserted) {
          setDraftId(inserted.id);
          localStorage.setItem(`draftId_${subdomain}`, inserted.id);
        }
=======
  const saveDraft = useCallback(async (data: any) => {
    if (!store || cart.length === 0) return;
    try {
      const draftData = {
        storeId: store.id,
        ownerId: store.ownerId,
        items: cart,
        customer: {
          fullName: data.fullName,
          email: data.email,
          phone: normalizePhoneNumber(data.phone),
          address: data.address,
          ip: clientIp
        },
        total: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) + (selectedShipping?.cost || 0),
        lastUpdated: serverTimestamp(),
      };

      if (draftId) {
        await updateDoc(doc(db, "uncompleted_orders", draftId), draftData);
      } else {
        const docRef = await addDoc(collection(db, "uncompleted_orders"), draftData);
        setDraftId(docRef.id);
        localStorage.setItem(`draftId_${subdomain}`, docRef.id);
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
      }
    } catch (e) {
      console.error("Draft Save Error:", e);
    }
  }, [store, cart, draftId, subdomain, clientIp, selectedShipping]);

<<<<<<< HEAD
=======
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

      // Phone Block Check
      const phoneBlockQ = query(
        collection(db, "fraud_blocks"),
        where("storeId", "==", store.id),
        where("type", "==", "phone"),
        where("value", "==", normalizedPhone),
        limit(1)
      );
      const phoneBlockSnap = await getDocs(phoneBlockQ);
      if (!phoneBlockSnap.empty) {
        toast({
          variant: "destructive",
          title: "Access Restricted",
          description: "This mobile number is restricted from placing orders."
        });
        return;
      }

      const result = await sendSMS(normalizedPhone, store?.name || "Store", store.id);

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

>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
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
<<<<<<< HEAD

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
=======
 
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
    if (!formData.fullName || !formData.phone || !formData.address) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill in all required fields." });
      return;
    }

<<<<<<< HEAD
=======
    if (store?.shippingSettings?.enabled && !selectedShipping) {
      toast({ variant: "destructive", title: "ডেলিভারি এরিয়া নির্বাচন করুন", description: "অনুগ্রহ করে আপনার ডেলিভারি এরিয়া নির্বাচন করুন।" });
      return;
    }

    if (!isVerified && (store?.otpVerification !== false)) {
      toast({ variant: "destructive", title: "Verification Required", description: "Please verify your phone number first." });
      return;
    }

>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
    if (formData.paymentMethod === 'manual' && !formData.transactionId) {
      toast({ variant: "destructive", title: "Transaction ID Required", description: "Please enter your payment Transaction ID." });
      return;
    }

    setIsPlacingOrder(true);
    try {
<<<<<<< HEAD
      const blockValues = [clientIp, formData.phone].filter(Boolean);
      if (blockValues.length > 0) {
        const { data: fraudData } = await supabase
          .from("fraud_blocks")
          .select("id")
          .eq("store_id", store.id)
          .in("value", blockValues)
          .limit(1);
        if (fraudData && fraudData.length > 0) {
          toast({ variant: "destructive", title: "Transaction Denied", description: "Your details have been restricted by the merchant." });
          setIsPlacingOrder(false);
          return;
=======
      const normalizedPhone = normalizePhoneNumber(formData.phone);

      // Phone Block Check (Final)
      const phoneBlockQ = query(
        collection(db, "fraud_blocks"),
        where("storeId", "==", store.id),
        where("type", "==", "phone"),
        where("value", "==", normalizedPhone),
        limit(1)
      );
      const phoneBlockSnap = await getDocs(phoneBlockQ);
      if (!phoneBlockSnap.empty) {
        toast({ variant: "destructive", title: "Transaction Denied", description: "Your phone number has been restricted by the merchant." });
        setIsPlacingOrder(false);
        return;
      }

      // IP Spam Check
      let isSpam = false;
      if (clientIp) {
        const ipBlockQ = query(
          collection(db, "fraud_blocks"),
          where("storeId", "==", store.id),
          where("type", "==", "ip"),
          where("value", "==", clientIp),
          limit(1)
        );
        const ipBlockSnap = await getDocs(ipBlockQ);
        if (!ipBlockSnap.empty) {
          isSpam = true;
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
        }
      }

      const orderData = {
<<<<<<< HEAD
        store_id: store.id,
        owner_id: store.owner_id || store.ownerId,
=======
        storeId: store.id,
        ownerId: store.ownerId,
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
        items: cart,
        customer: {
          fullName: formData.fullName,
          email: formData.email,
<<<<<<< HEAD
          phone: formData.phone,
=======
          phone: normalizedPhone,
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
          address: formData.address,
          ip: clientIp
        },
        shipping: selectedShipping ? {
          name: selectedShipping.name,
          cost: shippingCost
        } : { name: "Free Shipping", cost: 0 },
        subtotal: cartSubtotal,
<<<<<<< HEAD
        shipping_cost: shippingCost,
        total: cartTotal,
        payment_method: formData.paymentMethod,
        transaction_id: formData.paymentMethod === 'manual' ? formData.transactionId : null,
        selected_manual_method_id: formData.paymentMethod === 'manual' ? formData.selectedManualMethodId : null,
        status: "pending",
        payment_status: formData.paymentMethod === 'cod' ? "unpaid" : "pending_verification",
        is_read: false
      };

      await supabase.from("orders").insert(orderData);
      if (draftId) {
        await supabase.from("uncompleted_orders").delete().eq("id", draftId);
        localStorage.removeItem(`draftId_${subdomain}`);
      }
      localStorage.removeItem(`cart_${subdomain}`);
=======
        shippingCost: shippingCost,
        total: cartTotal,
        paymentMethod: formData.paymentMethod,
        transactionId: formData.paymentMethod === 'manual' ? formData.transactionId : null,
        selectedManualMethodId: formData.paymentMethod === 'manual' ? formData.selectedManualMethodId : null,
        status: "pending",
        paymentStatus: formData.paymentMethod === 'cod' ? "unpaid" : "pending_verification",
        isRead: false,
        isSpam: isSpam,
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

>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
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
<<<<<<< HEAD
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" className="rounded-xl font-bold gap-2 text-slate-500" onClick={() => router.back()}><ChevronLeft className="w-4 h-4" /> Back</Button>
          <Link href={`/${subdomain}`} className="flex items-center gap-2"><h1 className="text-lg font-headline font-black tracking-tighter text-slate-900 uppercase">{store?.name}</h1></Link>
          <div className="w-20" />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <section className="space-y-6">
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><User className="w-5 h-5" /></div><h2 className="text-2xl font-headline font-black tracking-tight text-slate-900 uppercase">Customer Information</h2></div>
              <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white"><CardContent className="p-6 sm:p-8 space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name *</Label><Input placeholder="John Doe" className="h-12 rounded-xl bg-slate-50 border-none px-4" value={formData.fullName} onChange={(e) => setFormData(prev => ({...prev, fullName: e.target.value}))} /></div><div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Number *</Label><Input placeholder="01XXXXXXXXX" className="h-12 rounded-xl bg-slate-50 border-none px-4" value={formData.phone} onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))} /></div></div><div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address (Optional)</Label><Input placeholder="john@example.com" className="h-12 rounded-xl bg-slate-50 border-none px-4" value={formData.email} onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))} /></div><div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Delivery Address *</Label><Textarea placeholder="Flat, House, Street, Area, City" className="min-h-[100px] rounded-2xl bg-slate-50 border-none p-4" value={formData.address} onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))} /></div></CardContent></Card>
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
                              <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                                <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-primary">Number</span><span className="text-lg font-mono font-black text-slate-900 select-all">{selectedManualMethod.number}</span></div>
                                {selectedManualMethod.instructions && <div className="text-[11px] leading-relaxed text-slate-600 bg-white/50 p-3 rounded-lg border border-primary/5 italic whitespace-pre-wrap">{selectedManualMethod.instructions}</div>}
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

          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-headline font-black tracking-tight text-slate-900 uppercase">Cart Intelligence</h2>
            <Card className="rounded-[40px] border-none shadow-xl bg-white overflow-hidden sticky top-24">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center"><div className="w-16 h-16 rounded-xl bg-slate-50 border overflow-hidden shrink-0"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div><div className="flex-1 min-w-0"><h4 className="font-bold text-xs line-clamp-1">{item.name}</h4><p className="text-slate-400 text-[10px] font-bold">Qty: {item.quantity} × ${item.price.toFixed(2)}</p></div><p className="font-black text-sm text-slate-900">${(item.price * item.quantity).toFixed(2)}</p></div>
                  ))}
                </div>
                <div className="space-y-3 pt-6 border-t border-slate-100">
                  <div className="flex justify-between text-sm"><span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Net Value</span><span className="font-bold">${cartSubtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Logistics</span><span className={cn("font-black", shippingCost > 0 ? "text-slate-900" : "text-emerald-500")}>{shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : 'FREE'}</span></div>
                  <Separator className="bg-slate-50" /><div className="flex justify-between items-end pt-2"><span className="text-slate-900 font-black uppercase tracking-tight text-lg leading-none">Order Total</span><span className="text-3xl font-black text-primary tracking-tighter">${cartTotal.toFixed(2)}</span></div>
                </div>
                <Button className="w-full h-16 rounded-[24px] text-xl font-black shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95" disabled={isPlacingOrder || cart.length === 0} onClick={handlePlaceOrder}>{isPlacingOrder ? <Loader2 className="w-6 h-6 animate-spin" /> : "Deploy Order Now"}</Button>
                <div className="flex items-center justify-center gap-2 text-slate-400"><ShieldCheck className="w-4 h-4 text-emerald-500" /><span className="text-[9px] font-black uppercase tracking-[0.2em]">Secure Global Checkout</span></div>
              </CardContent>
            </Card>
=======

      <main className="max-w-6xl mx-auto p-2 md:p-6 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <section className="space-y-4">
              <div className="flex items-center gap-2"><div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><User className="w-4 h-4" /></div><h2 className="text-lg font-headline font-black tracking-tight text-slate-900 uppercase">Customer Details</h2></div>
              <Card className="rounded-[24px] border-none shadow-sm overflow-hidden bg-white">
                <CardContent className="p-4 md:p-8 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Full Name *</Label><Input placeholder="John Doe" className="h-10 rounded-xl bg-slate-50 border-none px-4 text-sm" value={formData.fullName} onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))} /></div>

                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Contact Number *</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input placeholder="01XXXXXXXXX" className="h-10 rounded-xl bg-slate-50 border-none px-4 text-sm" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} disabled={isVerified && store?.otpVerification !== false} />
                            {isVerified && (store?.otpVerification !== false) && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />}
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
                              onChange={(val) => setFormData(prev => ({ ...prev, otp: val }))}
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
                            <Button size="sm" variant="outline" className="rounded-xl font-bold px-8 h-9" onClick={verifyOtp} disabled={verifying || formData.otp.length !== 6}>
                              {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify Code"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Email Address (Optional)</Label><Input placeholder="email@example.com" className="h-10 rounded-xl bg-slate-50 border-none px-4 text-sm" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Delivery Address *</Label><Textarea placeholder="Area, City, House/Road details..." className="min-h-[100px] rounded-xl bg-slate-50 border-none p-4 text-sm resize-none" value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} /></div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2"><div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><Truck className="w-4 h-4" /></div><h2 className="text-lg font-headline font-black tracking-tight text-slate-900 uppercase">Delivery Logistics</h2></div>
              <RadioGroup value={selectedShipping?.id} onValueChange={(val) => setSelectedShipping(store.shippingSettings.methods.find((m: any) => m.id === val))} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {store?.shippingSettings?.methods?.map((method: any) => (
                  <Label key={method.id} className={cn("relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white", selectedShipping?.id === method.id ? "border-primary bg-primary/5 shadow-md" : "border-transparent hover:border-slate-200")}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", selectedShipping?.id === method.id ? "bg-primary text-white" : "bg-slate-50 text-slate-400")}><Truck className="w-5 h-5" /></div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900 text-sm">{method.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{method.duration || "Standard"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary text-lg">{method.cost > 0 ? `${getCurrencySymbol(store.currency)}${method.cost}` : 'FREE'}</p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2"><div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><CreditCard className="w-4 h-4" /></div><h2 className="text-lg font-headline font-black tracking-tight text-slate-900 uppercase">Payment Strategy</h2></div>
              <RadioGroup value={formData.paymentMethod} onValueChange={(val) => setFormData(prev => ({ ...prev, paymentMethod: val }))} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Label className={cn("relative flex flex-col p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white group", formData.paymentMethod === 'cod' ? "border-primary bg-primary/5 shadow-md" : "border-transparent hover:border-slate-200")}>
                  <RadioGroupItem value="cod" id="cod" className="sr-only" />
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", formData.paymentMethod === 'cod' ? "bg-primary text-white" : "bg-slate-50 text-slate-400")}><Truck className="w-5 h-5" /></div>
                    {formData.paymentMethod === 'cod' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="text-left">
                    <p className="font-black text-slate-900 text-sm">Cash on Delivery</p>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1 uppercase tracking-tighter">Pay securely when items arrive at your doorstep.</p>
                  </div>
                </Label>

                {store?.paymentSettings?.manualEnabled && (
                  <Label className={cn("relative flex flex-col p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white group", formData.paymentMethod === 'manual' ? "border-primary bg-primary/5 shadow-md" : "border-transparent hover:border-slate-200")}>
                    <RadioGroupItem value="manual" id="manual" className="sr-only" />
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", formData.paymentMethod === 'manual' ? "bg-primary text-white" : "bg-slate-50 text-slate-400")}><Smartphone className="w-5 h-5" /></div>
                      {formData.paymentMethod === 'manual' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="text-left">
                      <p className="font-black text-slate-900 text-sm">Mobile Banking</p>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1 uppercase tracking-tighter">Bkash, Nagad or Rocket manual payment processing.</p>
                    </div>
                  </Label>
                )}
              </RadioGroup>

              {formData.paymentMethod === 'manual' && (
                <div className="p-6 bg-white rounded-[32px] border-none shadow-sm space-y-6 animate-in slide-in-from-top-2">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Select Gateway</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {store?.paymentSettings?.manualMethods?.map((method: any) => (
                        <button key={method.id} type="button" onClick={() => setFormData(prev => ({ ...prev, selectedManualMethodId: method.id }))} className={cn("p-4 rounded-2xl border-2 transition-all text-left", formData.selectedManualMethodId === method.id ? "border-indigo-600 bg-indigo-50" : "border-slate-100 hover:border-slate-200")}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-black text-xs text-slate-900">{method.name}</p>
                            {formData.selectedManualMethodId === method.id && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                          </div>
                          <p className="text-[10px] font-bold text-indigo-600">{method.number}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedManualMethod && (
                    <div className="p-6 bg-slate-50 rounded-3xl space-y-6 border border-slate-100">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100"><ShieldCheck className="w-5 h-5 text-indigo-600" /></div>
                        <div className="space-y-2">
                          <p className="text-xs font-black uppercase tracking-tight text-slate-900">Payment Instructions</p>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">Please send <span className="font-black text-indigo-600">{getCurrencySymbol(store.currency)}{cartTotal.toFixed(0)}</span> to the number below using {selectedManualMethod.name} ({selectedManualMethod.type}).</p>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Target Number</p>
                          <p className="text-xl font-mono font-black text-slate-900">{selectedManualMethod.number}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-slate-50" onClick={() => { navigator.clipboard.writeText(selectedManualMethod.number); toast({ title: "Copied!" }) }}><Copy className="w-4 h-4" /></Button>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Verification Transaction ID</Label>
                        <Input placeholder="TRXID..." className="h-12 rounded-2xl bg-white border-slate-200 px-5 text-lg font-mono font-black placeholder:font-sans placeholder:text-sm" value={formData.transactionId} onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-10 space-y-6">
              <section className="space-y-4">
                <div className="flex items-center gap-2"><div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><ShoppingCart className="w-4 h-4" /></div><h2 className="text-lg font-headline font-black tracking-tight text-slate-900 uppercase">Order Summary</h2></div>
                <Card className="rounded-[32px] border-none shadow-xl overflow-hidden bg-white">
                  <CardContent className="p-0">
                    <div className="p-6 md:p-8 space-y-6">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 shrink-0"><img src={item.image} className="w-full h-full object-cover" /></div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-slate-900 text-sm truncate uppercase tracking-tight">{item.name}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.quantity} × {getCurrencySymbol(store?.currency)}{item.price}</p>
                          </div>
                          <p className="font-black text-slate-900">{getCurrencySymbol(store?.currency)}{(item.price * item.quantity).toFixed(0)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-8 bg-slate-50 space-y-4 border-t border-slate-100">
                      <div className="flex justify-between text-sm font-medium text-slate-500"><span>Subtotal</span><span className="font-black text-slate-900">{getCurrencySymbol(store?.currency)}{cartSubtotal.toFixed(0)}</span></div>
                      <div className="flex justify-between text-sm font-medium text-slate-500"><span>Shipping</span><span className="font-black text-emerald-600">{shippingCost > 0 ? `${getCurrencySymbol(store?.currency)}${shippingCost}` : 'FREE'}</span></div>
                      <Separator className="my-4 bg-slate-200" />
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Grand Total</p>
                          <p className="text-4xl font-headline font-black text-primary tracking-tighter leading-none">{getCurrencySymbol(store?.currency)}{cartTotal.toFixed(0)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1 justify-end"><ShieldCheck className="w-3 h-3" /> Secure Checkout</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <Button onClick={handlePlaceOrder} disabled={isPlacingOrder} className="w-full h-16 rounded-[24px] bg-primary text-white font-black text-xl uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                {isPlacingOrder ? <Loader2 className="w-6 h-6 animate-spin" /> : "Complete Purchase"}
              </Button>
              <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fully Encrypted Transaction Control</p>
            </div>
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
          </div>
        </div>
      </main>
    </div>
  );
}
<<<<<<< HEAD

const SmartphoneIcon = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
        <line x1="12" x2="12.01" y1="18" y2="18" />
    </svg>
);
=======
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
