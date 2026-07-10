"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSupabaseClient } from "@/supabase";
import {
  ArrowRight, ShoppingCart, ShieldCheck, Zap,
  CheckCircle2, Star, Smartphone, Globe,
  Sparkles, Rocket, Lock, TrendingUp, MousePointer2,
  Layout, BarChart3, MessageSquare, Laptop, Check,
  Target, Award, Users, Search, ChevronDown, ChevronUp,
  Instagram, Facebook, Twitter, Mail, PhoneCall,
  Activity, Menu, X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Icon mapping helper
const ICON_MAP: Record<string, any> = {
  Zap, ShieldCheck, Star, Smartphone, Globe,
  Sparkles, Rocket, Lock, CheckCircle2, TrendingUp, MousePointer2,
  Layout, BarChart3, MessageSquare, Laptop, Users, ShoppingCart
};

interface LandingClientProps {
  initialPlans: any[];
  initialFeatures: any[];
}

export default function LandingClient({ initialPlans, initialFeatures }: LandingClientProps) {
  const supabase = useSupabaseClient();
  const [plans] = useState<any[]>(initialPlans || []);
  const [features] = useState<any[]>(initialFeatures || []);
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const defaultFeatures = [
    { icon: Layout, title: "ল্যান্ডিং পেজ বিল্ডার", desc: "ড্র্যাগ এন্ড ড্রপ দিয়ে তৈরি করুন হাই-কনভার্টিং পেজ।", category: "builder" },
    { icon: Smartphone, title: "OTP ভেরিফিকেশন", desc: "SMS এর মাধ্যমে কাস্টমার ভেরিফাই করুন এবং ফেক অর্ডার রোধ করুন।", category: "sales" },
    { icon: BarChart3, title: "সেলস এনালাইটিক্স", desc: "ব্যবসার রিয়েল-টাইম ডাটা, অর্ডার ও বিক্রির গ্রাফ দেখুন।", category: "sales" },
    { icon: MessageSquare, title: "কাস্টম ডোমেইন", desc: "আপনার নিজের ব্র্যান্ডের ডোমেইন খুব সহজে যুক্ত করুন।", category: "builder" },
    { icon: Globe, title: "মাল্টি-টেন্যান্ট", desc: "নিরাপদ, দ্রুত এবং অত্যন্ত স্কেলেবল আধুনিক ক্লাউড প্ল্যাটফর্ম।", category: "admin" },
    { icon: ShieldCheck, title: "ব্যাংক লেভেল সিকিউরিটি", desc: "আপনার ডাটা ও ট্রানজাকশন সবসময় সুরক্ষিত থাকবে।", category: "admin" },
    { icon: Sparkles, title: "এআই ডেসক্রিপশন জেনারেটর", desc: "Gemini AI ব্যবহার করে সেকেন্ডেই আকর্ষণীয় ডেসক্রিপশন তৈরি করুন।", category: "builder" },
    { icon: Rocket, title: "সুপার ফাস্ট পেজ স্পিড", desc: "গতি অপ্টিমাইজড পেজ যা গ্রাহকের কেনাকাটার অভিজ্ঞতা বাড়ায়।", category: "builder" },
    { icon: ShoppingCart, title: "স্মার্ট পেমেন্ট ও কার্ট", desc: "বিকাশ, নগদ, রকেটের পাশাপাশি ক্যাশ অন ডেলিভারি সাপোর্ট।", category: "sales" },
    { icon: TrendingUp, title: "কুপন ও ডিসকাউন্ট", desc: "প্রোমো কোড ও ডিসকাউন্ট অফার দিয়ে বিক্রির পরিমাণ বাড়িয়ে নিন।", category: "sales" },
    { icon: MousePointer2, title: "সহজ অর্ডার সিস্টেম", desc: "সহজেই পেন্ডিং অর্ডার ট্র্যাকিং ও অর্ডার প্রসেসিং ব্যবস্থা।", category: "admin" },
    { icon: Users, title: "কাস্টমার ডাটাবেজ", desc: "সব গ্রাহকের তথ্য এক জায়গায় সংরক্ষণ করে রিমার্কেটিং করুন।", category: "admin" }
  ];

  const currentFeatures = features.length > 0 ? features.map(f => ({
    icon: ICON_MAP[f.icon] || Zap,
    title: f.title,
    desc: f.description || f.desc,
    category: f.category || "builder"
  })) : defaultFeatures;

  const filteredFeatures = currentFeatures.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "all" || f.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const displayedFeatures = showAll ? filteredFeatures : currentFeatures.slice(0, 6);

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-950 selection:bg-primary selection:text-white overflow-x-hidden">

      {/* ── Floating Header ── */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "py-2 bg-slate-950/90 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20"
            : "py-3 bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="iHut.Shop Home">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-700 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
              <Rocket className="text-white w-4 h-4" />
            </div>
            <span className="text-[17px] font-black text-white tracking-tighter uppercase">IHut<span className="text-primary">.Shop</span></span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            <a href="#features" className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/5">ফিচার</a>
            <a href="#pricing" className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/5">মূল্য</a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Link href={user ? "/dashboard" : "/auth"}>
              <Button variant="ghost" size="sm" className="h-9 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-xl">
                {user ? "ড্যাশবোর্ড" : "লগইন"}
              </Button>
            </Link>
            <Link href={user ? "/dashboard" : "/auth"}>
              <Button size="sm" id="header-cta" className="h-9 px-5 bg-primary hover:bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all">
                শুরু করুন <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Toggle mobile menu"
            id="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-bold text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-colors">ফিচার</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-bold text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-colors">মূল্য</a>
            <div className="flex gap-2 pt-2 border-t border-white/5">
              <Link href={user ? "/dashboard" : "/auth"} className="flex-1">
                <Button variant="ghost" size="sm" className="w-full h-10 text-xs font-black uppercase text-slate-400 hover:text-white hover:bg-white/5 rounded-xl">
                  {user ? "ড্যাশবোর্ড" : "লগইন"}
                </Button>
              </Link>
              <Link href={user ? "/dashboard" : "/auth"} className="flex-1">
                <Button size="sm" className="w-full h-10 bg-primary text-white font-black text-xs uppercase rounded-xl">
                  শুরু করুন
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="w-full">
        {/* ── Hero Section ── */}
        <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-20 px-4 overflow-hidden bg-slate-950">
          {/* Background ambient glows */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
            <div className="absolute top-20 -right-20 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
            <div className="absolute bottom-0 -left-20 w-72 h-72 bg-emerald-500/8 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: "4s" }} />
            {/* Dot grid */}
            <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px]" />
          </div>

          <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full animate-in fade-in zoom-in duration-700">
              <Badge className="bg-primary text-white border-none rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider">PRO</Badge>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">অত্যাধুনিক ই-কমার্স সলিউশন</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] text-white tracking-tight">
              আপনার অনলাইন ব্যবসা<br />
              <span className="text-gradient">এক ধাপ এগিয়ে</span>
            </h1>

            {/* Sub-copy */}
            <p className="text-sm sm:text-lg text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
              ল্যান্ডিং পেজ, অর্ডার ম্যানেজমেন্ট এবং সেলস এনালাইটিক্স — সবকিছুই এখন আপনার হাতের মুঠোয়।
              মাত্র কয়েক মিনিটে শুরু করুন আপনার প্রফেশনাল স্টোর।
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
              <Link href={user ? "/dashboard" : "/auth"} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  id="hero-cta-primary"
                  className="w-full sm:w-auto h-13 px-8 text-base rounded-2xl bg-primary hover:bg-blue-600 text-white shadow-2xl shadow-primary/30 font-black uppercase tracking-tight hover:scale-105 active:scale-95 transition-all"
                >
                  বিনামূল্যে শুরু করুন <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <a href="#features" className="w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="lg"
                  id="hero-cta-secondary"
                  className="w-full sm:w-auto h-13 px-8 text-base rounded-2xl text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 font-bold tracking-tight transition-all"
                >
                  ফিচার দেখুন
                </Button>
              </a>
            </div>

            {/* Social proof stats */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10 pt-6 border-t border-white/5">
              {[
                { val: "৫০০+", label: "একটিভ স্টোর" },
                { val: "৯৯.৯%", label: "আপটাইম" },
                { val: "২৪/৭", label: "সাপোর্ট" },
                ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl sm:text-3xl font-black text-white">{s.val}</div>
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Dashboard Mockup Showcase ── */}
        <section className="relative py-10 sm:py-16 px-4 bg-slate-950 overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950 z-10" />
          </div>
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="relative group cursor-pointer">
              {/* Animated glow ring */}
              <div className="absolute -inset-2 sm:-inset-4 rounded-[28px] bg-gradient-to-br from-primary/30 via-purple-500/20 to-emerald-500/20 blur-2xl opacity-60 group-hover:opacity-90 transition-opacity duration-700 animate-pulse-slow" />
              {/* Mockup card */}
              <div className="relative rounded-2xl sm:rounded-[24px] overflow-hidden border border-white/10 shadow-2xl shadow-black/60 bg-slate-900 animate-border-glow">
                {/* Top bar chrome */}
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800/80 border-b border-white/5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  <div className="flex-1 ml-2 h-5 bg-slate-700/50 rounded-md max-w-48" />
                </div>
                <img
                  src="/images/dashboard_mockup.png"
                  alt="iHut.Shop SaaS Dashboard Preview"
                  width={1024}
                  height={768}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto block group-hover:scale-[1.01] transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Why Choose Us ── */}
        <section className="py-14 sm:py-20 px-4 bg-slate-900/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
              {/* Text Side */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <Badge className="bg-primary/15 text-primary border border-primary/20 px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">
                    কেন আমাদের বেছে নেবেন?
                  </Badge>
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                    আপনার ব্যবসার <span className="text-gradient">বিশ্বস্ত সাথী</span>
                  </h2>
                  <p className="text-slate-400 text-sm sm:text-base font-medium leading-relaxed">
                    আমরা শুধু একটি প্ল্যাটফর্ম নই, আমরা আপনার ব্যবসার প্রবৃদ্ধির প্রতিটি ধাপে আপনার পাশে আছি।
                  </p>
                </div>

                <div className="grid gap-5">
                  {[
                    { icon: Target, title: "সহজ ইউজার ইন্টারফেস", desc: "কোনো টেকনিক্যাল জ্ঞান ছাড়াই আপনি আপনার স্টোর পরিচালনা করতে পারবেন সহজে।" },
                    { icon: Award, title: "প্রিমিয়াম ডিজাইন", desc: "আমাদের প্রতিটি টেমপ্লেট আধুনিক এবং কনভার্সন বাড়াতে অপ্টিমাইজড করা।" },
                    { icon: Users, title: "২৪/৭ কাস্টমার সাপোর্ট", desc: "যেকোনো সমস্যায় আমাদের সাপোর্ট টিম আপনার সেবায় সবসময় নিয়োজিত।" },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="w-11 h-11 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                        <item.icon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h4 className="font-black text-base text-white tracking-tight mb-1">{item.title}</h4>
                        <p className="text-sm text-slate-400 font-medium leading-snug">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { val: "৫০০+", label: "সক্রিয় উদ্যোক্তা", color: "from-blue-500/20 to-blue-600/5", icon: Users },
                  { val: "৯৯.৯%", label: "সার্ভার আপটাইম", color: "from-emerald-500/20 to-emerald-600/5", icon: Activity },
                  { val: "৩মি", label: "সেটাপ সময়", color: "from-purple-500/20 to-purple-600/5", icon: Zap },
                  { val: "৫★", label: "গ্রাহক রেটিং", color: "from-amber-500/20 to-amber-600/5", icon: Star },
                ].map((stat, i) => (
                  <div key={i} className={cn(
                    "relative p-5 rounded-2xl border border-white/8 bg-gradient-to-br overflow-hidden group hover:border-white/15 transition-colors",
                    stat.color
                  )}>
                    <stat.icon className="w-5 h-5 text-slate-400 mb-3" />
                    <div className="text-3xl font-black text-white">{stat.val}</div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Features Section ── */}
        <section id="features" className="py-14 sm:py-20 px-4 bg-slate-950">
          <div className="max-w-7xl mx-auto space-y-10 sm:space-y-12">
            <div className="text-center space-y-2">
              <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em]">প্ল্যাটফর্ম ফিচারসমূহ</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">এক নজরে সব সুবিধা</h2>
            </div>

            {/* Search & Filter (when expanded) */}
            {showAll && (
              <div className="flex flex-col md:flex-row items-center gap-3 bg-slate-900/80 border border-white/8 p-4 rounded-2xl max-w-4xl mx-auto animate-in fade-in slide-in-from-top-3 duration-400">
                <div className="relative w-full md:flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="ফিচার খুঁজুন..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-white/8 rounded-xl text-sm font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-slate-800 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                  {[
                    { id: "all", label: "সব" },
                    { id: "builder", label: "বিল্ডার" },
                    { id: "sales", label: "সেলস" },
                    { id: "admin", label: "অ্যাডমিন" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCategory(tab.id)}
                      className={cn(
                        "px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all",
                        activeCategory === tab.id
                          ? "bg-primary text-white shadow shadow-primary/30"
                          : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedFeatures.length === 0 ? (
                <div className="col-span-3 text-center py-16 text-slate-500 text-sm font-bold">কোনো ফিচার পাওয়া যায়নি।</div>
              ) : (
                displayedFeatures.map((f, i) => (
                  <div
                    key={i}
                    className="p-6 bg-slate-900/60 border border-white/8 rounded-2xl hover:border-primary/30 hover:-translate-y-1 hover:bg-slate-900/80 transition-all duration-300 group animate-in fade-in duration-500"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:border-primary/50 transition-all duration-300">
                      <f.icon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-base font-black text-white mb-2 tracking-tight">{f.title}</h3>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed">{f.desc}</p>
                  </div>
                ))
              )}
            </div>

            {/* Feature checklist (compact) */}
            {(!showAll || filteredFeatures.length > 0) && (
              <div className="max-w-4xl mx-auto bg-slate-900/60 border border-white/8 rounded-2xl p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
                  <h3 className="text-base font-black text-white uppercase tracking-tight">সকল সুবিধার তালিকা</h3>
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-white/15">
                    {showAll ? `${filteredFeatures.length}টি ফিচার` : `${currentFeatures.length}+`}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {(showAll ? filteredFeatures : currentFeatures.slice(0, 6)).map((f, i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <div className="w-5 h-5 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-sm font-semibold text-slate-300">{f.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Toggle button */}
            <div className="flex justify-center">
              <Button
                id="features-toggle"
                onClick={() => {
                  setShowAll(!showAll);
                  if (showAll) { setSearchTerm(""); setActiveCategory("all"); }
                }}
                size="sm"
                className="h-10 px-6 rounded-full bg-white/5 border border-white/10 text-white font-black text-[11px] uppercase tracking-widest hover:bg-white/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                {showAll ? <><ChevronUp className="w-3.5 h-3.5" /> কম দেখুন</> : <><ChevronDown className="w-3.5 h-3.5" /> সব ফিচার দেখুন</>}
              </Button>
            </div>
          </div>
        </section>

        {/* ── Pricing Section ── */}
        <section id="pricing" className="py-14 sm:py-20 px-4 bg-slate-900/40">
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em]">মূল্য পরিকল্পনা</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">সাশ্রয়ী প্যাকেজ</h2>
              <p className="text-slate-400 text-sm font-medium">আপনার সাধ্যের মধ্যেই সেরা সলিউশন।</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {plans.map((plan) => {
                const isPro = plan.price > 50;
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative flex flex-col p-7 rounded-2xl border transition-all duration-300 group",
                      isPro
                        ? "bg-gradient-to-b from-blue-950/80 to-slate-900 border-primary/30 shadow-xl shadow-primary/10 scale-[1.02]"
                        : "bg-slate-900/60 border-white/8 hover:border-white/15"
                    )}
                  >
                    {isPro && (
                      <>
                        {/* Glow effect */}
                        <div aria-hidden="true" className="absolute inset-0 rounded-2xl bg-primary/5 pointer-events-none" />
                        <div className="absolute -top-px left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-5 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                          <Star className="w-2.5 h-2.5 fill-white" /> সেরা পছন্দ
                        </div>
                      </>
                    )}

                    <div className="mb-5">
                      <h3 className="text-base font-black uppercase text-white mb-1 tracking-tight">{plan.name}</h3>
                      <p className="text-xs font-medium text-slate-400 line-clamp-2">{plan.description}</p>
                    </div>

                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-black text-white">৳{plan.price}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">/ মাস</span>
                    </div>

                    <div className="space-y-3 flex-1 mb-6">
                      {(plan.features || []).slice(0, 6).map((feat: string, i: number) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <CheckCircle2 className={cn("w-4 h-4 shrink-0 mt-0.5", isPro ? "text-primary" : "text-emerald-400")} />
                          <span className="text-xs sm:text-sm font-medium text-slate-300 line-clamp-1">{feat}</span>
                        </div>
                      ))}
                    </div>

                    <Link href={user ? "/dashboard" : `/auth?planId=${plan.id}`}>
                      <Button
                        size="lg"
                        id={`pricing-cta-${plan.id}`}
                        className={cn(
                          "w-full h-12 rounded-xl font-black text-sm uppercase tracking-tight transition-all hover:scale-[1.02] active:scale-[0.98]",
                          isPro
                            ? "bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/30"
                            : "bg-white/8 hover:bg-white/12 text-white border border-white/10"
                        )}
                      >
                        {user ? "ড্যাশবোর্ড" : "এখনই শুরু করুন"}
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="px-4 py-14 sm:py-20 bg-slate-950">
          <div className="max-w-4xl mx-auto relative overflow-hidden rounded-2xl sm:rounded-3xl p-8 sm:p-16 text-center bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border border-white/8">
            <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-64 bg-primary/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10 space-y-5">
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                আজই আপনার যাত্রা শুরু করুন
              </h2>
              <p className="text-slate-400 text-sm sm:text-base font-medium">
                কোনো লুকানো খরচ নেই। আমাদের সাথে আপনার ব্যবসা বাড়বে দ্বিগুণ গতিতে।
              </p>
              <Link href={user ? "/dashboard" : "/auth"}>
                <Button
                  size="lg"
                  id="final-cta"
                  className="h-13 px-10 text-base rounded-2xl bg-primary hover:bg-blue-600 text-white shadow-2xl shadow-primary/30 font-black uppercase tracking-tight hover:scale-105 active:scale-95 transition-all"
                >
                  বিনামূল্যে শুরু করুন <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full bg-slate-900/80 border-t border-white/5 pt-12 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/5">
            {/* Brand Column */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                  <Rocket className="text-white w-4 h-4" />
                </div>
                <span className="text-lg font-black text-white tracking-tighter uppercase">IHut<span className="text-primary">.Shop</span></span>
              </div>
              <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-xs">
                বাংলাদেশের উদ্যোক্তাদের জন্য সেরা ই-কমার্স প্ল্যাটফর্ম। দ্রুত, নিরাপদ এবং সহজে পরিচালনাযোগ্য।
              </p>
              {/* Operational status */}
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">All Systems Operational</span>
              </div>
              {/* Social Links */}
              <div className="flex items-center gap-2 pt-1">
                {[
                  { icon: Facebook, href: "#", label: "Facebook" },
                  { icon: Instagram, href: "#", label: "Instagram" },
                  { icon: Twitter, href: "#", label: "Twitter" },
                  { icon: Mail, href: "mailto:support@ihut.shop", label: "Email" },
                ].map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    aria-label={s.label}
                    className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary hover:border-primary transition-all hover:scale-110"
                  >
                    <s.icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">প্ল্যাটফর্ম</h4>
              <ul className="space-y-2">
                {[
                  { label: "ফিচারসমূহ", href: "#features" },
                  { label: "মূল্য পরিকল্পনা", href: "#pricing" },
                  { label: "ড্যাশবোর্ড", href: "/dashboard" },
                  { label: "রেজিস্ট্রেশন", href: "/auth" },
                ].map((link, i) => (
                  <li key={i}>
                    <a href={link.href} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">যোগাযোগ</h4>
              <ul className="space-y-3">
                <li>
                  <a href="mailto:support@ihut.shop" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group">
                    <Mail className="w-3.5 h-3.5 text-slate-500 group-hover:text-primary transition-colors" />
                    support@ihut.shop
                  </a>
                </li>
                <li>
                  <a href="tel:+8801700000000" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group">
                    <PhoneCall className="w-3.5 h-3.5 text-slate-500 group-hover:text-primary transition-colors" />
                    +880 17xx-xxxxxx
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6">
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
              &copy; {new Date().getFullYear()} IHut.Shop — সর্বস্বত্ব সংরক্ষিত
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-[11px] text-slate-500 hover:text-slate-300 font-bold uppercase tracking-widest transition-colors">প্রাইভেসি পলিসি</a>
              <a href="#" className="text-[11px] text-slate-500 hover:text-slate-300 font-bold uppercase tracking-widest transition-colors">শর্তাবলী</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
