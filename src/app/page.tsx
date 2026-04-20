
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingCart, ShieldCheck, Zap, LogIn, CheckCircle2, Loader2, Star } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
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
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background overflow-x-hidden">
      <header className="fixed top-0 w-full p-4 sm:p-6 flex justify-between items-center max-w-7xl mx-auto bg-background/80 backdrop-blur-sm z-50 border-b border-border/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <ShoppingCart className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="text-xl sm:text-2xl font-headline font-bold text-primary tracking-tight">NexusCart</span>
        </div>
        <nav className="hidden lg:flex gap-8 text-sm font-bold uppercase tracking-widest">
          <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/auth">
            <Button variant="ghost" size="sm" className="rounded-full px-4 h-9 font-bold flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Button>
          </Link>
          <Link href="/auth">
            <Button size="sm" className="rounded-full px-4 h-9 shadow-lg shadow-primary/20 font-bold">Launch Store</Button>
          </Link>
        </div>
      </header>

      <main className="text-center mt-32 sm:mt-40 max-w-6xl w-full">
        <div className="space-y-6 max-w-4xl mx-auto px-4">
          <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] animate-in fade-in slide-in-from-top-4 duration-1000">
            Next-Gen E-commerce SaaS
          </Badge>
          <h1 className="text-4xl xs:text-5xl sm:text-7xl md:text-8xl font-headline font-black mb-4 sm:mb-8 leading-[0.95] text-foreground tracking-tighter">
            Build Your <span className="text-primary italic underline decoration-accent/30 decoration-8 underline-offset-8">Empire</span> Effortlessly
          </h1>
          <p className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-10 sm:mb-14 max-w-3xl mx-auto font-medium px-2 leading-relaxed">
            The multi-tenant infrastructure designed for rapid scaling. Launch professional storefronts with built-in landing pages and advanced analytics in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4">
            <Link href="/auth" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 sm:h-16 px-10 sm:px-12 text-lg sm:text-xl rounded-[24px] shadow-2xl shadow-primary/30 font-black">
                Get Started Now <ArrowRight className="ml-2 w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </Link>
            <Link href="#pricing" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full h-14 sm:h-16 px-10 sm:px-12 text-lg sm:text-xl rounded-[24px] border-2 font-bold">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div id="features" className="mt-32 sm:mt-48 grid grid-cols-1 md:grid-cols-3 gap-8 text-left px-4">
          <FeatureCard 
            icon={Zap} 
            title="Instant Subdomains" 
            desc="Every store gets a unique [brand].ihut.shop address automatically. Zero configuration required." 
            accent="accent"
          />
          <FeatureCard 
            icon={ShieldCheck} 
            title="Tenant Isolation" 
            desc="Your data is strictly isolated with bank-grade Firestore security rules. Safe, secure, and private." 
            accent="primary"
          />
          <FeatureCard 
            icon={ShoppingCart} 
            title="AI Content Engine" 
            desc="Generate product descriptions and store names using built-in Google Gemini integration." 
            accent="accent"
          />
        </div>

        {/* Pricing Section */}
        <section id="pricing" className="mt-32 sm:mt-48 space-y-16 pb-20 px-4">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-5xl font-headline font-black tracking-tight uppercase">Platform Tiers</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Choose the plan that fits your current scale. Upgrade or downgrade anytime.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-muted/30 rounded-[40px] p-20 border-2 border-dashed text-center opacity-50">
               <p className="font-bold uppercase tracking-widest">Pricing data arriving soon...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <Card key={plan.id} className="group relative rounded-[40px] border-border/50 bg-white hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col">
                  {plan.price > 50 && (
                    <div className="absolute top-0 right-0 bg-primary text-white px-6 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest z-10 flex items-center gap-2">
                       <Star className="w-3 h-3 fill-white" /> Recommended
                    </div>
                  )}
                  <CardHeader className="p-10 pb-6">
                    <CardTitle className="text-2xl font-black uppercase tracking-tight mb-2">{plan.name}</CardTitle>
                    <CardDescription className="text-base line-clamp-2">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 pt-0 flex-1 space-y-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-primary">${plan.price}</span>
                      <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">/ {plan.billingInterval}</span>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Included Features</p>
                      <div className="grid gap-3">
                        {(plan.features || []).map((feat: string, i: number) => (
                          <div key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            {feat}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-10 pt-0">
                    <Link href={`/auth?planId=${plan.id}`}>
                      <Button className="w-full h-14 rounded-2xl text-lg font-black group-hover:bg-primary group-hover:text-white transition-all shadow-xl shadow-primary/10">
                        Choose {plan.name}
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="mt-20 py-20 w-full border-t border-border/50 text-center space-y-8 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <span className="text-xl font-headline font-black tracking-tight text-slate-900">NexusCart</span>
        </div>
        <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.4em]">
          &copy; {new Date().getFullYear()} NEXUSCART POWERED CLOUD.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, accent }: any) {
  const accentClass = accent === 'accent' ? 'text-accent' : 'text-primary';
  const bgClass = accent === 'accent' ? 'bg-accent/10' : 'bg-primary/10';

  return (
    <div className="p-10 bg-white rounded-[48px] shadow-sm border border-border/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group">
      <div className={`w-14 h-14 ${bgClass} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
        <Icon className={`w-7 h-7 ${accentClass}`} />
      </div>
      <h3 className="text-2xl font-headline font-black mb-4 tracking-tight">{title}</h3>
      <p className="text-base text-muted-foreground font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
