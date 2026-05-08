"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, ShoppingCart, ShieldCheck, Zap, LogIn, 
  CheckCircle2, Loader2, Star, Smartphone, Globe, 
  Sparkles, Rocket, Lock, TrendingUp, MousePointer2,
  Layout, BarChart3, MessageSquare, Laptop, Check,
  Target, Award, Users, Heart
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/firebase/provider";
import { cn } from "@/lib/utils";

// Icon mapping helper
const ICON_MAP: Record<string, any> = {
  Zap, ShieldCheck, Star, Smartphone, Globe, 
  Sparkles, Rocket, Lock, CheckCircle2, TrendingUp, MousePointer2,
  Layout, BarChart3, MessageSquare, Laptop
};

export default function Home() {
  const [plans, setPlans] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    fetchPlans();
    
    // Real-time listener for features
    const featuresQ = query(collection(db, "platformFeatures"), orderBy("order", "asc"));
    const unsubFeatures = onSnapshot(featuresQ, (snap) => {
      setFeatures(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubFeatures();
  }, []);

  const fetchPlans = async () => {
    try {
      const q = query(collection(db, "subscriptionPlans"), where("isActive", "==", true));
      const snap = await getDocs(q);
      setPlans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const defaultFeatures = [
    { icon: Layout, title: "ল্যান্ডিং পেজ বিল্ডার", desc: "ড্র্যাগ এন্ড ড্রপ দিয়ে তৈরি করুন হাই-কনভার্টিং পেজ।" },
    { icon: Smartphone, title: "OTP ভেরিফিকেশন", desc: "SMS এর মাধ্যমে কাস্টমার ভেরিফাই করুন।" },
    { icon: BarChart3, title: "সেলস এনালাইটিক্স", desc: "ব্যবসার রিয়েল-টাইম ডাটা দেখুন।" },
    { icon: MessageSquare, title: "কাস্টম ডোমেইন", desc: "আপনার নিজের ডোমেইন যুক্ত করুন।" },
    { icon: Globe, title: "মাল্টি-টেন্যান্ট", desc: "নিরাপদ এবং স্কেলেবল প্ল্যাটফর্ম।" },
    { icon: ShieldCheck, title: "ব্যাংক সিকিউরিটি", desc: "আপনার ডাটা সবসময় সুরক্ষিত।" }
  ];

  const currentFeatures = features.length > 0 ? features.map(f => ({
    icon: ICON_MAP[f.icon] || Zap,
    title: f.title,
    desc: f.description
  })) : defaultFeatures;

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-50 selection:bg-primary selection:text-white overflow-x-hidden">
      {/* Compact Header */}
      <header className="fixed top-0 w-full p-3 sm:p-4 flex justify-between items-center max-w-7xl mx-auto bg-white/90 backdrop-blur-md z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 group cursor-pointer pl-2">
          <div className="w-8 h-8 bg-slate-950 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-12">
            <Rocket className="text-white w-4 h-4" />
          </div>
          <span className="text-lg font-black text-slate-900 tracking-tighter uppercase">IHut.Shop</span>
        </div>
        
        <div className="flex items-center gap-2 pr-2">
          <Link href={user ? "/dashboard" : "/auth"}>
            <Button variant="ghost" size="sm" className="rounded-xl px-4 h-9 font-black text-[10px] uppercase tracking-widest text-slate-600">
              {user ? "ড্যাশবোর্ড" : "লগইন"}
            </Button>
          </Link>
          <Link href={user ? "/dashboard" : "/auth"}>
            <Button size="sm" className="rounded-xl px-5 h-9 bg-slate-950 text-white font-black text-[10px] uppercase tracking-widest shadow-lg">
               শুরু করুন
            </Button>
          </Link>
        </div>
      </header>

      <main className="w-full">
        {/* Compact Hero with Modern BG */}
        <section className="relative pt-24 sm:pt-40 pb-16 sm:pb-24 px-4 overflow-hidden bg-slate-950">
          <div className="absolute inset-0 opacity-20">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
             <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/30 to-transparent blur-3xl" />
             <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-r from-accent/20 to-transparent blur-3xl" />
          </div>

          <div className="max-w-6xl mx-auto text-center space-y-6 sm:space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full animate-in fade-in zoom-in duration-700">
               <Badge className="bg-primary text-white border-none rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase">PRO</Badge>
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">অত্যাধুনিক ই-কমার্স সলিউশন</span>
            </div>

            <h1 className="text-4xl sm:text-7xl font-black leading-[1] text-white tracking-tight">
              আপনার অনলাইন ব্যবসা <br />
              <span className="text-primary italic">এক ধাপ এগিয়ে</span>
            </h1>

            <p className="text-sm sm:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed px-4 opacity-80">
              ল্যান্ডিং পেজ, অর্ডার ম্যানেজমেন্ট এবং সেলস এনালাইটিক্স - সবকিছুই এখন আপনার হাতের মুঠোয়। মাত্র কয়েক মিনিটে শুরু করুন আপনার প্রফেশনাল স্টোর।
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4">
              <Link href={user ? "/dashboard" : "/auth"} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-xl rounded-2xl bg-primary text-white shadow-2xl shadow-primary/20 font-black uppercase tracking-tight hover:scale-105 active:scale-95 transition-all">
                  শুরু করুন <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Why Choose Us - New Section */}
        <section className="py-16 sm:py-24 px-4 bg-white border-b border-slate-100">
           <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-20 items-center">
                 <div className="space-y-8">
                    <div className="space-y-4">
                       <Badge className="bg-primary/10 text-primary border-none px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">কেন আমাদের বেছে নেবেন?</Badge>
                       <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight uppercase">আপনার ব্যবসার বিশ্বস্ত সাথী</h2>
                       <p className="text-slate-500 text-sm sm:text-lg font-medium leading-relaxed">আমরা শুধু একটি প্ল্যাটফর্ম নই, আমরা আপনার ব্যবসার প্রবৃদ্ধির প্রতিটি ধাপে আপনার পাশে আছি।</p>
                    </div>

                    <div className="grid gap-6">
                       <div className="flex gap-4 group">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                             <Target className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                             <h4 className="font-black text-lg text-slate-900 uppercase tracking-tight">সহজ ইউজার ইন্টারফেস</h4>
                             <p className="text-sm text-slate-500 font-medium leading-snug">কোনো টেকনিক্যাল জ্ঞান ছাড়াই আপনি আপনার স্টোর পরিচালনা করতে পারবেন সহজে।</p>
                          </div>
                       </div>
                       <div className="flex gap-4 group">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                             <Award className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                             <h4 className="font-black text-lg text-slate-900 uppercase tracking-tight">প্রিমিয়াম ডিজাইন</h4>
                             <p className="text-sm text-slate-500 font-medium leading-snug">আমাদের প্রতিটি টেমপ্লেট আধুনিক এবং কনভার্সন বাড়াতে অপ্টিমাইজড করা।</p>
                          </div>
                       </div>
                       <div className="flex gap-4 group">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                             <Users className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                             <h4 className="font-black text-lg text-slate-900 uppercase tracking-tight">২৪/৭ কাস্টমার সাপোর্ট</h4>
                             <p className="text-sm text-slate-500 font-medium leading-snug">যেকোনো সমস্যায় আমাদের সাপোর্ট টিম আপনার সেবায় সবসময় নিয়োজিত।</p>
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="relative group">
                    <div className="absolute inset-0 bg-primary/10 rounded-[40px] rotate-3 scale-105 group-hover:rotate-6 transition-transform" />
                    <div className="relative aspect-[4/3] bg-slate-100 rounded-[40px] overflow-hidden border-8 border-white shadow-2xl flex items-center justify-center">
                       <Sparkles className="w-20 h-20 text-slate-300" />
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Features Grid & List View */}
        <section id="features" className="py-16 sm:py-24 bg-slate-50/50">
          <div className="max-w-7xl mx-auto px-4 space-y-16 sm:space-y-24">
            <div className="text-center space-y-3">
               <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight uppercase">প্ল্যাটফর্ম ফিচারসমূহ</h2>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">এক নজরে আপনার সব সুবিধা</p>
            </div>

            {/* Grid View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
               {currentFeatures.map((f, i) => (
                  <div key={i} className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
                     <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                        <f.icon className="w-5 h-5" />
                     </div>
                     <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">{f.title}</h3>
                     <p className="text-sm text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                  </div>
               ))}
            </div>

            {/* List View - Compact */}
            <div className="max-w-4xl mx-auto bg-white rounded-[32px] sm:rounded-[48px] p-6 sm:p-12 border border-slate-100 shadow-sm space-y-6 sm:space-y-8">
               <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">বিস্তারিত তালিকা</h3>
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest">সকল সুবিধা</Badge>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-x-12 sm:gap-y-6">
                  {currentFeatures.map((f, i) => (
                     <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0 md:border-0 md:odd:border-r md:odd:pr-6">
                        <div className="w-6 h-6 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
                           <Check className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm sm:text-base font-bold text-slate-700">{f.title}</span>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        </section>

        {/* Compact Pricing */}
        <section id="pricing" className="py-16 sm:py-24 px-4">
          <div className="max-w-7xl mx-auto space-y-12 sm:space-y-20">
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight uppercase">সাশ্রয়ী প্যাকেজ</h2>
              <p className="text-slate-500 text-sm sm:text-lg font-medium">আপনার সাধ্যের মধ্যেই সেরা সলিউশন।</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
                {plans.map((plan) => (
                  <div key={plan.id} className={cn(
                     "relative flex flex-col p-8 rounded-[40px] border transition-all duration-300",
                     plan.price > 50 ? "bg-slate-950 text-white border-slate-800 shadow-2xl scale-105 z-10" : "bg-white text-slate-900 border-slate-100"
                  )}>
                    {plan.price > 50 && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-2 rounded-full font-black text-[8px] uppercase tracking-widest shadow-xl flex items-center gap-1.5">
                        <Star className="w-2.5 h-2.5 fill-white" /> প্রো
                      </div>
                    )}
                    
                    <div className="mb-8">
                      <h3 className="text-xl font-black uppercase mb-1">{plan.name}</h3>
                      <p className={cn("text-xs font-medium opacity-60", plan.price > 50 ? "text-slate-300" : "text-slate-500")}>{plan.description}</p>
                    </div>

                    <div className="flex items-baseline gap-1.5 mb-10">
                      <span className="text-4xl font-black">৳{plan.price}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-40">/ মাস</span>
                    </div>

                    <div className="space-y-4 flex-1 mb-10">
                       {(plan.features || []).slice(0, 6).map((feat: string, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                           <CheckCircle2 className={cn("w-4 h-4 shrink-0", plan.price > 50 ? "text-primary" : "text-emerald-500")} />
                           <span className="text-xs sm:text-sm font-bold opacity-80 line-clamp-1">{feat}</span>
                        </div>
                       ))}
                    </div>

                    <Link href={user ? "/dashboard" : `/auth?planId=${plan.id}`}>
                      <Button size="lg" className={cn(
                         "w-full h-14 rounded-2xl text-base font-black uppercase tracking-tight",
                         plan.price > 50 ? "bg-primary text-white" : "bg-slate-950 text-white"
                      )}>
                        {user ? "ড্যাশবোর্ড" : "সিলেক্ট করুন"}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Simplified CTA */}
        <section className="px-4 pb-16 sm:pb-24">
           <div className="max-w-5xl mx-auto bg-slate-950 rounded-[40px] p-8 sm:p-20 text-center text-white space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
              <h2 className="text-3xl sm:text-6xl font-black tracking-tight leading-none relative z-10">আজই আপনার যাত্রা শুরু করুন</h2>
              <p className="text-sm sm:text-xl font-medium text-slate-400 relative z-10">কোনো লুকানো খরচ নেই। আমাদের সাথে আপনার ব্যবসা বাড়বে দ্বিগুণ গতিতে।</p>
              <div className="relative z-10">
                 <Link href="/auth">
                   <Button size="lg" className="h-14 sm:h-20 px-8 sm:px-16 text-lg sm:text-2xl rounded-2xl sm:rounded-3xl bg-primary text-white shadow-2xl font-black uppercase tracking-tight">
                      শুরু করুন <ArrowRight className="ml-2 w-5 h-5" />
                   </Button>
                 </Link>
              </div>
           </div>
        </section>
      </main>

      <footer className="w-full border-t border-slate-100 py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-slate-950 rounded-lg flex items-center justify-center text-white">
                <Rocket className="w-3.5 h-3.5" />
              </div>
              <span className="text-lg font-black tracking-tighter text-slate-950 uppercase">IHut.Shop</span>
           </div>
           <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.4em]">
             &copy; {new Date().getFullYear()} IHut.Shop.
           </p>
        </div>
      </footer>
    </div>
  );
}
