"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, ShoppingCart, ShieldCheck, Zap, LogIn, 
  CheckCircle2, Loader2, Star, Smartphone, Globe, 
  Sparkles, Rocket, Lock, TrendingUp, MousePointer2 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Icon mapping helper
const ICON_MAP: Record<string, any> = {
  Zap, ShieldCheck, Star, Smartphone, Globe, 
  Sparkles, Rocket, Lock, CheckCircle2, TrendingUp, MousePointer2
};

export default function Home() {
  const [plans, setPlans] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex flex-col items-center min-h-screen bg-background overflow-x-hidden">
      {/* Header - Compact App-Style */}
      <header className="fixed top-0 w-full p-3 sm:p-5 flex justify-between items-center max-w-7xl mx-auto bg-background/90 backdrop-blur-md z-50 border-b border-border/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <ShoppingCart className="text-white w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-lg sm:text-xl font-headline font-black text-primary tracking-tight">IHut.Shop</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <Link href="/auth">
            <Button variant="ghost" size="sm" className="rounded-full px-3 h-8 sm:h-10 font-bold text-xs">
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden xs:inline">Login</span>
            </Button>
          </Link>
          <Link href="/auth">
            <Button size="sm" className="rounded-full px-4 h-8 sm:h-10 shadow-lg shadow-primary/20 font-bold text-xs uppercase tracking-wider">Launch</Button>
          </Link>
        </div>
      </header>

      <main className="w-full max-w-6xl px-4 pt-24 sm:pt-40">
        {/* Hero Section - High Density */}
        <div className="text-center space-y-4 sm:space-y-6 max-w-4xl mx-auto">
          <Badge className="bg-primary/10 text-primary border-none px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-[0.2em] animate-in fade-in slide-in-from-top-4 duration-700">
            Next-Gen E-commerce
          </Badge>
          <h1 className="text-4xl xs:text-5xl sm:text-7xl md:text-8xl font-headline font-black leading-[1.05] sm:leading-[0.95] text-foreground tracking-tighter">
            Build Your <span className="text-primary italic underline decoration-accent/30 decoration-4 sm:decoration-8 underline-offset-4 sm:underline-offset-8">Empire</span> Effortlessly
          </h1>
          <p className="text-sm sm:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed px-2">
            The multi-tenant engine designed for scale. Launch professional storefronts with landing pages and analytics in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center items-center pt-4 px-2">
            <Link href="/auth" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-xl rounded-2xl sm:rounded-[24px] shadow-xl shadow-primary/20 font-black uppercase tracking-tight">
                Start Selling <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
            <Link href="#pricing" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-xl rounded-2xl sm:rounded-[24px] border-2 font-bold opacity-70 hover:opacity-100">
                View Plans
              </Button>
            </Link>
          </div>
        </div>

        {/* Dynamic Feature Grid */}
        <div id="features" className="mt-20 sm:mt-40 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
          {features.length > 0 ? (
            features.map((feature) => (
              <FeatureCard
                key={feature.id}
                icon={ICON_MAP[feature.icon] || Zap}
                title={feature.title}
                desc={feature.description}
                accent={feature.accent || 'primary'}
              />
            ))
          ) : (
            <>
              <FeatureCard
                icon={Zap}
                title="Instant Subdomains"
                desc="Every store gets a unique [brand].ihut.shop address automatically. Zero config."
                accent="accent"
              />
              <FeatureCard
                icon={ShieldCheck}
                title="Tenant Isolation"
                desc="Your data is strictly isolated with bank-grade security rules. Safe and private."
                accent="primary"
              />
              <FeatureCard
                icon={Star}
                title="AI Content Engine"
                desc="Generate product data and store names using built-in Google Gemini integration."
                accent="accent"
              />
            </>
          )}
        </div>

        {/* Pricing Section - Compact Cards */}
        <section id="pricing" className="mt-24 sm:mt-48 space-y-10 sm:space-y-16 pb-20">
          <div className="text-center space-y-2 sm:space-y-4 px-2">
            <h2 className="text-2xl sm:text-5xl font-headline font-black tracking-tight uppercase">Platform Tiers</h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-xl mx-auto">Choose a plan that fits your scale. Upgrade anytime.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-muted/30 rounded-3xl p-12 border-2 border-dashed text-center opacity-50">
              <p className="font-bold uppercase tracking-widest text-[10px]">Updating Tiers...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {plans.map((plan) => (
                <Card key={plan.id} className="group relative rounded-[32px] sm:rounded-[40px] border-border/50 bg-white hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col">
                  {plan.price > 50 && (
                    <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1.5 rounded-bl-2xl font-black text-[9px] uppercase tracking-widest z-10 flex items-center gap-1.5 shadow-lg">
                      <Star className="w-2.5 h-2.5 fill-white" /> Popular
                    </div>
                  )}
                  <CardHeader className="p-6 sm:p-10 pb-4">
                    <CardTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-1">{plan.name}</CardTitle>
                    <CardDescription className="text-xs sm:text-base line-clamp-1 sm:line-clamp-2">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-10 pt-0 flex-1 space-y-6 sm:space-y-8">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-5xl font-black text-primary">${plan.price}</span>
                      <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px] sm:text-xs">/ {plan.billingInterval}</span>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Privileges</p>
                      <div className="grid gap-2 sm:gap-3">
                        {(plan.features || []).map((feat: string, i: number) => (
                          <div key={i} className="flex items-center gap-2.5 text-[11px] sm:text-sm font-medium text-slate-600">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="line-clamp-1">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-6 sm:p-10 pt-0">
                    <Link href={`/auth?planId=${plan.id}`}>
                      <Button className="w-full h-12 sm:h-14 rounded-2xl text-sm sm:text-lg font-black uppercase tracking-tight group-hover:bg-primary group-hover:text-white transition-all shadow-xl shadow-primary/5">
                        Select {plan.name}
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="w-full border-t border-border/10 py-12 px-6 text-center space-y-6 bg-slate-50/50">
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <span className="text-lg font-headline font-black tracking-tight text-slate-900 uppercase">IHut.Shop</span>
        </div>
        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em]">
          &copy; {new Date().getFullYear()} IHut.Shop CLOUD ENGINE.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, accent }: any) {
  const accentClass = accent === 'accent' ? 'text-accent' : 'text-primary';
  const bgClass = accent === 'accent' ? 'bg-accent/10' : 'bg-primary/10';

  return (
    <div className="p-6 sm:p-10 bg-white rounded-[24px] sm:rounded-[48px] shadow-sm border border-border/40 hover:shadow-xl transition-all duration-500 group">
      <div className={`w-10 h-10 sm:w-14 ${bgClass} rounded-xl sm:rounded-2xl flex items-center justify-center mb-5 sm:mb-8 group-hover:scale-110 transition-transform`}>
        <Icon className={`w-5 h-5 sm:w-7 sm:h-7 ${accentClass}`} />
      </div>
      <h3 className="text-lg sm:text-2xl font-headline font-black mb-2 sm:mb-4 tracking-tight leading-tight">{title}</h3>
      <p className="text-xs sm:text-base text-muted-foreground font-medium leading-relaxed line-clamp-3">{desc}</p>
    </div>
  );
}
