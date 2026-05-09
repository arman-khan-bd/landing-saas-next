"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CreditCard, Truck, ShieldCheck, Loader2, CheckCircle2, Smartphone, ShieldAlert, SmartphoneIcon, User, Copy, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
        if (storeData.otpVerification === false || storeData.isOtpDisabled) setIsVerified(true);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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

    if (store?.shippingSettings?.enabled && !selectedShipping) {
      toast({ variant: "destructive", title: "ডেলিভারি এরিয়া নির্বাচন করুন", description: "অনুগ্রহ করে আপনার ডেলিভারি এরিয়া নির্বাচন করুন।" });
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
        }
      }

      const orderData = {
        storeId: store.id,
        ownerId: store.ownerId,
        items: cart,
        customer: {
          fullName: formData.fullName,
          email: formData.email,
          phone: normalizedPhone,
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
          </div>
        </div>
      </main>
    </div>
  );
}
