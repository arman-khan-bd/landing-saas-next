"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { getSubdomain } from "@/lib/subdomain";
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ShoppingCart, Loader2, CheckCircle2, Plus, Minus, X, Trash2, ChevronLeft, ShieldCheck, Truck, CreditCard, Smartphone, Copy, Check } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, getTenantPath } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
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

export default function ProductDetailPage() {
  const { subdomain: paramsSubdomain, slug } = useParams();
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
    transactionId: "",
    otp: ""
  });
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);

  useEffect(() => {
    if (product) {
      fpixel.event('ViewContent', {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: product.currentPrice,
        currency: 'BDT'
      });
      
      // Also track InitiateCheckout as the form is visible on single product direct purchase
      fpixel.event('InitiateCheckout', {
        content_ids: [product.id],
        content_type: 'product',
        value: product.currentPrice,
        currency: 'BDT'
      });
    }
  }, [product]);

  useEffect(() => {
    let sub = typeof paramsSubdomain === 'string' ? paramsSubdomain.toLowerCase() : '';
    if (!sub && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ihut.shop";
      const extracted = getSubdomain(hostname, rootDomain);
      if (extracted) sub = extracted.toLowerCase();
    }
    setSubdomain(sub);

    const handleOpenCart = () => setIsCartOpen(true);
    window.addEventListener('open-cart', handleOpenCart);
    return () => window.removeEventListener('open-cart', handleOpenCart);
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
      const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain), limit(1));
      const storeSnap = await getDocs(storeQ);
      if (!storeSnap.empty) {
        const storeData = { id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() } as any;
        setStore(storeData);
        if (storeData.shippingSettings?.enabled && storeData.shippingSettings.methods?.length > 0) {
          setSelectedShipping(storeData.shippingSettings.methods[0]);
        }
      }

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

  const normalizePhoneNumber = (phone: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      return '88' + cleaned;
    }
    if (cleaned.length === 13 && cleaned.startsWith('880')) {
      return cleaned;
    }
    // If it's just 10 digits or something else, try to make it 880...
    if (cleaned.length === 10) {
      return '880' + cleaned;
    }
    return cleaned;
  };

  const sendVerificationCode = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      toast({ variant: "destructive", title: "ভুল নাম্বার", description: "সঠিক মোবাইল নাম্বার প্রদান করুন।" });
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
          title: "ব্যর্থ হয়েছে",
          description: result.error || "আবার চেষ্টা করুন।"
        });
        return;
      }

      setOtpSent(true);
      toast({ title: "OTP পাঠানো হয়েছে", description: "আপনার মোবাইলে আসা কোডটি প্রদান করুন।" });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "SMS পাঠাতে ব্যর্থ", description: "আবার চেষ্টা করুন।" });
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
        toast({ title: "ভেরিফিকেশন সফল", description: "এখন আপনি অর্ডার সম্পন্ন করতে পারেন।" });
      } else {
        toast({ variant: "destructive", title: "ভুল কোড", description: "কোডটি সঠিক নয়।" });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setVerifying(false);
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

    fpixel.event('AddToCart', {
      content_name: product.name,
      content_ids: [product.id],
      content_type: 'product',
      value: product.currentPrice,
      currency: 'USD'
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
    if (!isVerified && (store?.otpVerification !== false)) {
      toast({ variant: "destructive", title: "নাম্বার ভেরিফাই করুন", description: "অর্ডার করার আগে মোবাইল নাম্বার ভেরিফাই করা প্রয়োজন।" });
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
        const fraudQ = query(
          collection(db, "fraud_blocks"),
          where("storeId", "==", store.id),
          where("value", "in", blockValues),
          limit(1)
        );
        const fraudSnap = await getDocs(fraudQ);
        if (!fraudSnap.empty) {
          toast({ variant: "destructive", title: "Transaction Denied", description: "Security restriction applied." });
          setIsPlacingOrder(false);
          return;
        }
      }

      const shippingCost = selectedShipping?.cost || 0;
      const subtotal = Number(product.currentPrice) * quantity;
      const total = subtotal + shippingCost;

      const orderData = {
        storeId: store.id,
        ownerId: store.ownerId,
        items: [{
          id: product.id,
          name: product.name,
          price: Number(product.currentPrice),
          image: selectedImage,
          quantity: quantity
        }],
        customer: {
          fullName: formData.fullName,
          phone: normalizePhoneNumber(formData.phone),
          address: formData.address,
          ip: clientIp
        },
        shipping: selectedShipping ? {
          name: selectedShipping.name,
          cost: shippingCost
        } : { name: "Direct Order", cost: 0 },
        subtotal: subtotal,
        shippingCost: shippingCost,
        total: total,
        paymentMethod: formData.paymentMethod,
        transactionId: formData.paymentMethod === 'manual' ? formData.transactionId : null,
        selectedManualMethodId: formData.paymentMethod === 'manual' ? formData.selectedManualMethodId : null,
        status: "pending",
        paymentStatus: formData.paymentMethod === 'cod' ? "unpaid" : "pending_verification",
        isRead: false,
        createdAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db, "orders"), orderData);

      await syncCustomerData({
        ...orderData,
        id: orderRef.id
      });

      fpixel.event('Purchase', {
        value: total,
        currency: 'USD',
        content_ids: [product.id],
        content_type: 'product'
      });

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

      <main className="max-w-6xl mx-auto p-2 sm:p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          <section className="space-y-3">
            <div className="aspect-square rounded-[24px] md:rounded-[32px] overflow-hidden bg-white shadow-lg shadow-slate-200 border border-white">
              <img src={selectedImage} className="w-full h-full object-cover" alt={product.name} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[product.featuredImage, ...(product.gallery || [])].filter(Boolean).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={cn(
                    "w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl overflow-hidden shrink-0 border-2 transition-all",
                    selectedImage === img ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>

            <div className="hidden lg:block bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 space-y-4">
              <h3 className="font-headline font-black text-sm uppercase tracking-widest text-slate-400">বিস্তারিত বিবরণ</h3>
              <div className="text-slate-600 text-sm leading-relaxed prose prose-sm prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: product.description || "No detailed description available." }} />
            </div>
          </section>

          <section className="space-y-6">
            <div className="bg-white p-4 md:p-8 rounded-[24px] md:rounded-[32px] shadow-sm border border-slate-100">
              <div className="space-y-2">
                <Badge className="bg-emerald-50 text-emerald-600 border-none px-2 py-0.5 rounded-full font-black text-[8px] uppercase tracking-widest">অফিসিয়াল প্রোডাক্ট</Badge>
                <h1 className="text-xl md:text-3xl lg:text-4xl font-headline font-black tracking-tight text-slate-900 leading-[1.1]">{product.name}</h1>
                <div className="flex items-center gap-3">
                  <p className="text-2xl md:text-3xl font-black text-primary tracking-tight">${Number(product.currentPrice).toFixed(2)}</p>
                  {product.prevPrice && <p className="text-base text-slate-300 line-through">${Number(product.prevPrice).toFixed(2)}</p>}
                </div>
              </div>

              <div className="space-y-4 mt-6">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex items-center bg-slate-50 rounded-xl p-1 h-10 md:h-12 border border-slate-100">
                    <button onClick={() => setItemQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-white rounded-lg transition-all"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="w-8 md:w-10 text-center font-black text-sm md:text-base">{quantity}</span>
                    <button onClick={() => setItemQuantity(q => q + 1)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-white rounded-lg transition-all"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                  <Button size="lg" className="flex-1 h-auto py-3 md:h-12 rounded-xl text-[12px] md:text-base font-black shadow-xl shadow-primary/20" onClick={addToCart}>কার্টে যোগ করুন</Button>
                </div>
              </div>

              <div className="lg:hidden space-y-3 mt-8 pt-8 border-t border-slate-100">
                <h3 className="font-headline font-black text-sm uppercase tracking-widest text-slate-400">বিস্তারিত বিবরণ</h3>
                <div className="text-slate-600 text-sm leading-relaxed prose prose-sm prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: product.description || "No detailed description available." }} />
              </div>
            </div>

            <Card className="rounded-[32px] md:rounded-[40px] border-none shadow-2xl overflow-hidden bg-white ring-4 ring-primary/5">
              <div className="bg-[#161625] text-white p-4 md:p-10 text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3"><Truck className="w-5 h-5 md:w-6 md:h-6 text-primary" /></div>
                <h3 className="text-xl md:text-3xl font-headline font-black tracking-tight uppercase">অর্ডার কনফার্ম করুন</h3>
                <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mt-1">নিরাপদ এবং দ্রুত ডেলিভারি</p>
              </div>
              <CardContent className="p-4 md:p-10 space-y-6">
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

                  <div className="space-y-3 pt-2 border-t border-slate-50">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">আপনার তথ্য প্রদান করুন</Label>
                    <div className="space-y-3">
                      <Input placeholder="আপনার পুরো নাম" className="h-10 rounded-xl bg-slate-50 border-none px-4 text-sm" value={formData.fullName} onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))} />

                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              placeholder="মোবাইল নাম্বার"
                              className="h-10 rounded-xl bg-slate-50 border-none px-4 text-sm"
                              value={formData.phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                              disabled={isVerified}
                            />
                            {isVerified && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
                          </div>
                          {(store?.otpVerification !== false) && !isVerified && (
                            <Button
                              type="button"
                              size="sm"
                              className="h-10 rounded-xl px-4 font-bold text-[10px]"
                              onClick={sendVerificationCode}
                              disabled={sendingSms || !formData.phone}
                            >
                              {sendingSms ? <Loader2 className="w-3 h-3 animate-spin" /> : otpSent ? "Resend" : "Verify"}
                            </Button>
                          )}
                        </div>

                        {(store?.otpVerification !== false) && otpSent && !isVerified && (
                          <div className="flex flex-col gap-3 items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2 duration-300">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">কোডটি এখানে লিখুন</Label>
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
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="w-full h-10 rounded-xl font-bold text-[10px] bg-primary text-white hover:bg-primary/90"
                              onClick={verifyOtp}
                              disabled={verifying || formData.otp.length < 6}
                            >
                              {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify Code"}
                            </Button>
                          </div>
                        )}
                      </div>

                      <Textarea placeholder="পুরো ঠিকানা (বাসা/রোড, জেলা)" className="min-h-[80px] rounded-xl bg-slate-50 border-none p-4 text-sm" value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} />
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
                          onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'manual' }))}
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
                                  <Button key={m.id} type="button" variant="outline" className={cn("h-10 rounded-xl text-[10px] font-black uppercase", formData.selectedManualMethodId === m.id ? 'bg-primary text-white' : '')} onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, selectedManualMethodId: m.id })); }}>{m.name}</Button>
                                ))}
                              </div>
                              {selectedManualMethod && (
                                <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                                  <div className="p-4 bg-white rounded-2xl border border-primary/10 flex items-center justify-between">
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-black text-primary uppercase">নাম্বার: {selectedManualMethod.number}</p>
                                      {selectedManualMethod.instructions && <p className="text-[10px] text-slate-500 italic whitespace-pre-wrap">{selectedManualMethod.instructions}</p>}
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-lg hover:bg-primary/5 text-primary shrink-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(selectedManualMethod.number);
                                        toast({ title: "কপি হয়েছে", description: "নাম্বারটি ক্লিপবোর্ডে কপি করা হয়েছে।" });
                                      }}
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                  <Input placeholder="ট্রানজাকশন আইডি লিখুন" className="h-12 rounded-xl bg-white border-primary/20" value={formData.transactionId} onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value.toUpperCase() }))} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <div className="bg-slate-50 p-4 md:p-6 rounded-[24px] border space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 tracking-widest"><span>পণ্য মূল্য</span><span>${(Number(product.currentPrice) * quantity).toFixed(2)}</span></div>
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 tracking-widest"><span>ডেলিভারি চার্জ</span><span>${(selectedShipping?.cost || 0).toFixed(2)}</span></div>
                      <Separator className="bg-slate-200" />
                      <div className="flex justify-between items-end text-xl md:text-3xl font-black text-primary"><span className="text-[9px] pb-1.5 text-slate-900 uppercase">মোট</span><span>${(Number(product.currentPrice) * quantity + (selectedShipping?.cost || 0)).toFixed(2)}</span></div>
                    </div>
                    <Button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={isPlacingOrder || (!isVerified && (store?.otpVerification !== false))}
                      className="w-full h-12 md:h-16 rounded-[20px] md:rounded-[24px] text-lg md:text-xl font-black shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:grayscale disabled:cursor-not-allowed"
                    >
                      {isPlacingOrder ? <Loader2 className="w-5 h-5 animate-spin" /> : (!isVerified && (store?.otpVerification !== false)) ? "ভেরিফাই করুন" : "অর্ডার সম্পন্ন করুন"}
                    </Button>
                    {(!isVerified && (store?.otpVerification !== false)) && <p className="text-[10px] text-center font-bold text-rose-500 uppercase tracking-widest animate-pulse">নাম্বার ভেরিফাই করা বাধ্যতামূলক</p>}
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
          <SheetHeader className="p-3 md:p-4 bg-slate-900 text-white shrink-0">
            <div className="flex items-center justify-between"><SheetTitle className="text-lg font-headline font-black text-white flex items-center gap-3 uppercase tracking-tight"><ShoppingCart className="w-5 h-5 text-primary" />আপনার ব্যাগ</SheetTitle><SheetClose className="text-white/60 hover:text-white transition-colors"><X className="w-5 h-5" /></SheetClose></div>
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
          <SheetFooter className="p-3 md:p-4 bg-white border-t shrink-0">
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center px-1"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">মোট মূল্য</span><span className="text-lg font-black text-primary">${cartTotal.toFixed(2)}</span></div>
              <div className="flex gap-2">
                <SheetClose asChild>
                    <Button variant="outline" className="flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-500 hover:bg-slate-50">ফিরুন</Button>
                </SheetClose>
                <Link href={getTenantPath(subdomain, "/checkout")} className="flex-[2]">
                    <Button className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20" disabled={cart.length === 0}>অর্ডার করুন</Button>
                </Link>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
