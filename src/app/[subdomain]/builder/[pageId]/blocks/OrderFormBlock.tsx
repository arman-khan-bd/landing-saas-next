"use client";

import React, { useState, useEffect } from "react";
import { cn, getCurrencySymbol } from "@/lib/utils";
import { useFirestore } from "@/firebase/provider";
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, Truck, Smartphone, Loader2, Check,
  CreditCard, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { sendSMS } from "@/app/actions/sms";
import { syncCustomerData } from "@/app/actions/customers";
import { SmartphoneIcon, ShieldAlert } from "lucide-react";

interface OrderFormBlockProps {
  block: any;
  style: React.CSSProperties;
  products: any[];
  store: any;
  isOrganic?: boolean;
  isTraditional?: boolean;
}

export const OrderFormBlock = ({ block, style, products, store, isOrganic = false, isTraditional = false, renderTextWithHighlights }: OrderFormBlockProps & { renderTextWithHighlights: any }) => {
  const productIds = block.content?.productIds || (block.content?.mainProductId ? [block.content.mainProductId] : []);
  const selectedProducts = Array.isArray(products) ? products.filter(p => productIds.includes(p.id)) : [];

  // Determine if we should show a skeleton
  const isInitialLoad = products.length === 0 && !block.isPreview;

  if (isInitialLoad) {
    return (
      <div id={block.id} style={style} className="px-4 w-full max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-3xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id={block.id} style={style} className="px-4 w-full max-w-5xl mx-auto text-left" data-block-type="product-order-form">
       {selectedProducts.length > 0 ? (
          <LandingPageOrderForm 
            products={selectedProducts} 
            store={store} 
            isOrganic={isOrganic} 
            isTraditional={isTraditional} 
            showShipping={block.content?.showShipping !== false}
          />
       ) : (
         <div className="p-8 sm:p-12 bg-white rounded-2xl sm:rounded-[40px] shadow-sm border-2 border-dashed flex flex-col items-center justify-center gap-4 text-slate-300">
            <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 opacity-10" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-center">Select products in sidebar to see order form</span>
         </div>
       )}
    </div>
  );
};

function LandingPageOrderForm({ products, store, isOrganic, isTraditional, showShipping }: { products: any[], store: any, isOrganic: boolean, isTraditional: boolean, showShipping: boolean }) {
  const { toast } = useToast();
  const db = useFirestore();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [clientIp, setClientIp] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(products[0]?.id ? [products[0].id] : []);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  
  // OTP States
  const [sendingSms, setSendingSms] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(store?.otpVerification === false || !!store?.isOtpDisabled);
  const [otpCode, setOtpCode] = useState("");

  const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
  const shippingCost = showShipping ? (selectedShipping?.cost || 0) : 0;
  const subtotal = selectedProducts.reduce((acc, p) => acc + Number(p.currentPrice), 0);
  const total = subtotal + shippingCost;

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    paymentMethod: "cod",
    selectedManualMethodId: "",
    transactionId: ""
  });

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => setClientIp(data.ip))
      .catch(err => console.error("IP Capture Error:", err));
  }, []);

  const normalizePhoneNumber = (phone: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('0')) return '88' + cleaned;
    if (cleaned.length === 13 && cleaned.startsWith('880')) return cleaned;
    if (cleaned.length === 10) return '880' + cleaned;
    return cleaned;
  };

  const handleSendOtp = async () => {
    if (!formData.phone || formData.phone.length < 11) {
      toast({ variant: "destructive", title: "Error", description: "সঠিক ফোন নম্বর দিন" });
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
          description: "এই মোবাইল নম্বরটি দিয়ে অর্ডার করা সম্ভব নয়।" 
        });
        return;
      }

      const res = await sendSMS(normalizedPhone, store?.name || "Store", store?.id);
      if (res.success) {
        setOtpSent(true);
        toast({ title: "OTP Sent", description: "আপনার মোবাইলে একটি কোড পাঠানো হয়েছে।" });
      } else {
        toast({ variant: "destructive", title: "SMS Failed", description: res.error || "SMS পাঠাতে সমস্যা হয়েছে" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong" });
    } finally {
      setSendingSms(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (code.length !== 6) return;
    setVerifying(true);
    try {
      const normalizedPhone = normalizePhoneNumber(formData.phone);
      const q = query(
        collection(db, "verification_codes"),
        where("phone", "==", normalizedPhone),
        where("code", "==", code),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setIsVerified(true);
        toast({ title: "Verified", description: "ফোন নম্বর সফলভাবে ভেরিফাই হয়েছে" });
      } else {
        toast({ variant: "destructive", title: "Invalid Code", description: "সঠিক কোড দিন" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "ভেরিফিকেশন ব্যর্থ হয়েছে" });
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (store?.shippingSettings?.enabled && store.shippingSettings.methods?.length > 0) {
      setSelectedShipping(store.shippingSettings.methods[0]);
    }
  }, [store]);

  const toggleProduct = (productId: string) => {
    if (productId === products[0]?.id) return;
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length === 0 || !formData.fullName || !formData.phone || !formData.address) {
      toast({ variant: "destructive", title: "তথ্য অসম্পূর্ণ" });
      return;
    }

    if (showShipping && store?.shippingSettings?.enabled && !selectedShipping) {
      toast({ variant: "destructive", title: "ডেলিভারি এরিয়া নির্বাচন করুন", description: "অনুগ্রহ করে আপনার ডেলিভারি এরিয়া নির্বাচন করুন।" });
      return;
    }

    if (!isVerified && (store?.otpVerification !== false)) {
      toast({ variant: "destructive", title: "নাম্বার ভেরিফাই করুন", description: "অর্ডার করার আগে মোবাইল নাম্বার ভেরিফাই করা প্রয়োজন।" });
      return;
    }

    if (formData.paymentMethod === 'manual' && !formData.transactionId) {
      toast({ variant: "destructive", title: "পেমেন্ট তথ্য প্রয়োজন", description: "ট্রানজাকশন আইডি প্রদান করুন।" });
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
        toast({ variant: "destructive", title: "অর্ডার গ্রহণ করা সম্ভব হচ্ছে না", description: "আপনার ফোন নম্বরটি নিষিদ্ধ করা হয়েছে।" });
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

      const subtotal = selectedProducts.reduce((acc, p) => acc + Number(p.currentPrice), 0);
      const total = subtotal + shippingCost;

      const orderData = {
        storeId: store.id,
        ownerId: store.ownerId,
        items: selectedProducts.map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.currentPrice),
          image: p.featuredImage,
          quantity: 1
        })),
        customer: { ...formData, phone: normalizedPhone, ip: clientIp },
        shipping: (showShipping && selectedShipping) ? {
          name: selectedShipping.name,
          cost: shippingCost
        } : { name: "Free Delivery", cost: 0 },
        subtotal: subtotal,
        shippingCost: shippingCost,
        total: total,
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

      setOrderSuccess(true);
      toast({ title: "অর্ডার সফল হয়েছে!" });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Order Failed" });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const manualMethodsArray = (store?.paymentSettings?.manualMethods && typeof store.paymentSettings.manualMethods === 'object') 
    ? (Array.isArray(store.paymentSettings.manualMethods) 
        ? store.paymentSettings.manualMethods 
        : Object.values(store.paymentSettings.manualMethods)) 
    : [];
  const selectedManualMethod = manualMethodsArray.find((m: any) => m.id === formData.selectedManualMethodId);

  if (orderSuccess) {
    return (
      <Card className="rounded-[32px] sm:rounded-[40px] shadow-2xl p-8 sm:p-12 text-center bg-white animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-headline font-black text-slate-900 uppercase">THANK YOU!</h3>
        <p className="text-sm sm:text-slate-500 mt-2">আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে.</p>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "rounded-[32px] sm:rounded-[40px] shadow-2xl border-none overflow-hidden text-left bg-white",
      (isOrganic || isTraditional) && "border-2 border-[#d9e8da] bg-[#fdf8f0]"
    )}>
      <div className={cn(
        "text-white p-8 sm:p-14 text-center",
        isOrganic ? "bg-[#1b5e20]" : isTraditional ? "bg-gradient-to-br from-[#1a7c3e] via-[#0f5a2b] to-[#0a3d1d]" : "bg-[#161625]"
      )}>
        <h3 className="text-3xl sm:text-5xl font-headline font-black mb-3 tracking-tighter uppercase">অর্ডার কনফার্ম করুন</h3>
        <p className="text-white/60 font-medium uppercase tracking-[0.3em] text-[9px] sm:text-xs">নিরাপদ এবং দ্রুত ডেলিভারি</p>
      </div>

      <div className="p-6 sm:p-14 space-y-8 sm:space-y-12">
        {products.length > 1 && (
           <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
              {products.map((p, idx) => {
                const isSelected = selectedProductIds.includes(p.id);
                const isRequired = idx === 0;
                return (
                  <div 
                    key={p.id} 
                    onClick={() => toggleProduct(p.id)} 
                    className={cn(
                      "flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer relative", 
                      isSelected ? "border-primary bg-primary/5" : "bg-white border-slate-100",
                      isRequired && "ring-1 ring-primary/20"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-all", 
                      isSelected ? 'bg-primary border-primary' : 'border-slate-300'
                    )}>
                      {isSelected && <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
                    </div>
                    <img src={p.featuredImage} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[10px] sm:text-xs truncate">{p.name}</p>
                      <p className={cn("font-black text-xs sm:text-sm", (isOrganic || isTraditional) ? "text-[#c0392b]" : "text-primary")}>{getCurrencySymbol(store?.currency)} {p.currentPrice}</p>
                    </div>
                    {isRequired && (
                      <span className="absolute -top-2 -right-2 bg-primary text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase">Required</span>
                    )}
                  </div>
                );
              })}
           </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 pt-6 sm:pt-8 border-t">
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
               <Label className={cn("text-[9px] sm:text-[10px] font-black uppercase tracking-widest", (isOrganic || isTraditional) ? "text-primary" : "text-slate-400")}>আপনার তথ্য</Label>
               <Input placeholder="আপনার পুরো নাম" className="rounded-xl sm:rounded-2xl h-12 sm:h-14 bg-white border-2 border-slate-100 px-4 sm:px-6 text-base sm:text-lg" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
               
               <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-800 uppercase">মোবাইল নম্বর <span className="text-rose-500">*</span></Label>
                        <div className="flex gap-2">
                          <Input 
                            required 
                            disabled={isVerified && store?.otpVerification !== false}
                            value={formData.phone} 
                            onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))} 
                            placeholder="01XXXXXXXXX" 
                            className="h-11 sm:h-12 rounded-xl bg-white border-primary/20" 
                          />
                          {(store?.otpVerification !== false) && !store?.isOtpDisabled && !isVerified && (
                            <Button 
                              type="button"
                              disabled={sendingSms || !formData.phone || formData.phone.length < 11}
                              onClick={handleSendOtp}
                              className="h-11 sm:h-12 px-4 rounded-xl shrink-0 text-[10px] font-black uppercase"
                            >
                              {sendingSms ? <Loader2 className="w-4 h-4 animate-spin" /> : otpSent ? "আবার পাঠান" : "ভেরিফাই"}
                            </Button>
                          )}
                          {(store?.otpVerification !== false) && isVerified && (
                             <div className="h-11 sm:h-12 w-12 flex items-center justify-center bg-emerald-50 text-emerald-500 rounded-xl border border-emerald-100">
                                <CheckCircle2 className="w-5 h-5" />
                             </div>
                          )}
                        </div>
                        {otpSent && !isVerified && (
                          <div className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3 animate-in slide-in-from-top-2">
                            <Label className="text-[10px] font-black text-primary uppercase text-center block">ভেরিফিকেশন কোড লিখুন</Label>
                            <div className="flex justify-center">
                              <InputOTP 
                                maxLength={6} 
                                value={otpCode} 
                                onChange={(val) => {
                                  setOtpCode(val);
                                  if (val.length === 6) handleVerifyOtp(val);
                                }}
                              >
                                <InputOTPGroup>
                                  <InputOTPSlot index={0} className="w-9 h-11 sm:w-10 sm:h-12 bg-white" />
                                  <InputOTPSlot index={1} className="w-9 h-11 sm:w-10 sm:h-12 bg-white" />
                                  <InputOTPSlot index={2} className="w-9 h-11 sm:w-10 sm:h-12 bg-white" />
                                  <InputOTPSlot index={3} className="w-9 h-11 sm:w-10 sm:h-12 bg-white" />
                                  <InputOTPSlot index={4} className="w-9 h-11 sm:w-10 sm:h-12 bg-white" />
                                  <InputOTPSlot index={5} className="w-9 h-11 sm:w-10 sm:h-12 bg-white" />
                                </InputOTPGroup>
                              </InputOTP>
                            </div>
                            {verifying && <p className="text-[9px] text-center font-bold text-slate-400 uppercase tracking-widest animate-pulse">যাচাই করা হচ্ছে...</p>}
                          </div>
                        )}
                      </div>
               
               <Textarea placeholder="পুরো ঠিকানা (জেলা সহ)" className="rounded-2xl sm:rounded-3xl min-h-[100px] sm:min-h-[120px] bg-white border-2 border-slate-100 p-4 sm:p-6 text-base sm:text-lg" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>

            {showShipping && (store?.shippingSettings?.enabled === true || String(store?.shippingSettings?.enabled) === 'true') && 
             Array.isArray(store?.shippingSettings?.methods) && 
             store.shippingSettings.methods.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                 <Label className={cn("text-[9px] sm:text-[10px] font-black uppercase tracking-widest", (isOrganic || isTraditional) ? "text-primary" : "text-slate-400")}>ডেলিভারি এরিয়া</Label>
                 <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
                   {(Array.isArray(store.shippingSettings.methods) ? store.shippingSettings.methods : []).map((method: any) => (
                     <div 
                       key={method.id} 
                       className={cn("flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer", selectedShipping?.id === method.id ? 'border-primary bg-primary/5' : 'bg-slate-50')} 
                       onClick={() => setSelectedShipping(method)}
                     >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center", selectedShipping?.id === method.id ? 'border-primary' : 'border-slate-300')}>
                            {selectedShipping?.id === method.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          <span className="font-bold text-xs sm:text-sm">{method.name}</span>
                        </div>
                        <span className="font-black text-xs sm:text-sm">{method.cost > 0 ? `${getCurrencySymbol(store?.currency)} ${method.cost}` : 'ফ্রি'}</span>
                     </div>
                   ))}
                 </div>
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
               <Label className={cn("text-[9px] sm:text-[10px] font-black uppercase tracking-widest", (isOrganic || isTraditional) ? "text-primary" : "text-slate-400")}>পেমেন্ট মেথড</Label>
               <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
                  {store?.paymentSettings?.cod && (
                    <div 
                      className={cn("flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all", formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'bg-slate-50')} 
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cod', selectedManualMethodId: "", transactionId: "" }))}
                    >
                       <div className="flex items-center gap-3">
                          <div className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center", formData.paymentMethod === 'cod' ? 'border-primary' : 'border-slate-300')}>
                            {formData.paymentMethod === 'cod' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />}
                          </div>
                          <span className="font-bold text-sm sm:text-base">ক্যাশ অন ডেলিভারি</span>
                       </div>
                       <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                    </div>
                  )}

                  {store?.paymentSettings?.manualEnabled && manualMethodsArray.length > 0 && (
                    <div 
                      className={cn("flex flex-col p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all", formData.paymentMethod === 'manual' ? 'border-primary bg-primary/5' : 'bg-slate-50')} 
                      onClick={() => setFormData(prev => ({...prev, paymentMethod: 'manual'}))}
                    >
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center", formData.paymentMethod === 'manual' ? 'border-primary' : 'border-slate-300')}>
                              {formData.paymentMethod === 'manual' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />}
                            </div>
                            <span className="font-bold text-sm sm:text-base">বিকাশ/নগদ/রকেট</span>
                          </div>
                          <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                       </div>

                       {formData.paymentMethod === 'manual' && (
                         <div className="mt-4 pt-4 border-t border-primary/10 space-y-4 animate-in slide-in-from-top-2">
                           <div className="grid grid-cols-1 xs:grid-cols-3 gap-2">
                              {manualMethodsArray.map((m: any) => (
                                <div 
                                  key={m.id} 
                                  onClick={(e) => { e.stopPropagation(); setFormData(prev => ({...prev, selectedManualMethodId: m.id})) }} 
                                  className={cn("p-2 sm:p-3 rounded-xl border-2 text-center transition-all", formData.selectedManualMethodId === m.id ? 'border-primary bg-white' : 'border-slate-100')}
                                >
                                  <p className="text-[10px] font-black uppercase">{m.name}</p>
                                  <p className="text-[8px] font-bold opacity-60">{m.type}</p>
                                </div>
                              ))}
                           </div>

                           {selectedManualMethod && (
                             <div className="p-4 bg-white rounded-2xl border-2 border-primary/10 space-y-4">
                                <div className="text-center space-y-1">
                                   <p className="text-[10px] font-black uppercase text-slate-400">Send Money to</p>
                                   <p className="text-xl sm:text-2xl font-black text-primary tracking-wider">{selectedManualMethod.number}</p>
                                   <p className="text-[9px] font-bold text-slate-500 italic">টোটাল {getCurrencySymbol(store?.currency)} {total.toFixed(0)} টাকা পাঠিয়ে নিচের বক্সে ট্রানজাকশন আইডি দিন।</p>
                                </div>
                                <Input 
                                  placeholder="Transaction ID (TRXID)" 
                                  className="h-11 sm:h-12 rounded-xl bg-slate-50 border-none px-4 text-center font-mono font-black" 
                                  value={formData.transactionId} 
                                  onChange={(e) => setFormData(prev => ({...prev, transactionId: e.target.value}))} 
                                />
                             </div>
                           )}
                         </div>
                       )}
                    </div>
                  )}
               </div>
            </div>
          </div>

          <div className="space-y-8 sm:space-y-10">
             <div className="bg-slate-50 rounded-3xl p-6 sm:p-10 border-2 border-slate-100 space-y-6 sm:space-y-8">
                <div className="space-y-4">
                   <h4 className="text-lg font-black uppercase tracking-tight border-b pb-4">অর্ডার সামারি</h4>
                   <div className="space-y-3 sm:space-y-4">
                      {selectedProducts.map(p => (
                        <div key={p.id} className="flex justify-between items-center text-sm sm:text-base">
                           <span className="font-bold text-slate-600">১x {p.name}</span>
                           <span className="font-black">{getCurrencySymbol(store?.currency)} {p.currentPrice}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-3 sm:space-y-4 border-t pt-6">
                   <div className="flex justify-between text-sm sm:text-base">
                      <span className="font-bold text-slate-400 uppercase tracking-widest">সাব-টোটাল</span>
                      <span className="font-bold">{getCurrencySymbol(store?.currency)} {subtotal.toFixed(0)}</span>
                   </div>
                   <div className="flex justify-between text-sm sm:text-base">
                      <span className="font-bold text-slate-400 uppercase tracking-widest">ডেলিভারি চার্জ</span>
                      <span className="font-bold text-emerald-600">{shippingCost > 0 ? `${getCurrencySymbol(store?.currency)} ${shippingCost}` : 'ফ্রি'}</span>
                   </div>
                   <div className="flex justify-between pt-4 border-t">
                      <span className="text-lg sm:text-xl font-black uppercase tracking-tighter">সর্বমোট</span>
                      <span className={cn("text-2xl sm:text-4xl font-headline font-black", (isOrganic || isTraditional) ? "text-[#c0392b]" : "text-primary")}>
                        {getCurrencySymbol(store?.currency)} {total.toFixed(0)}
                      </span>
                   </div>
                </div>
             </div>

             <Button 
               disabled={isPlacingOrder} 
               className={cn(
                 "w-full h-16 sm:h-24 rounded-[24px] sm:rounded-[40px] font-black text-xl sm:text-3xl uppercase tracking-[0.1em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95",
                 isOrganic ? "bg-[#1b5e20] shadow-[#1b5e20]/30" : isTraditional ? "bg-[#0a3d1d] shadow-[#0a3d1d]/30" : "bg-primary shadow-primary/30"
               )}
             >
               {isPlacingOrder ? <Loader2 className="w-8 h-8 animate-spin" /> : "অর্ডার কনফার্ম করুন"}
             </Button>

             <div className="flex items-center justify-center gap-4 sm:gap-6">
                <div className="flex flex-col items-center gap-1">
                   <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100">
                      <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                   </div>
                   <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 tracking-widest">Secure</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                   <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100">
                      <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
                   </div>
                   <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 tracking-widest">Fast Delivery</span>
                </div>
             </div>
          </div>
        </form>
      </div>
    </Card>
  );
}
