"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabaseClient } from "@/supabase";
import { getSubdomain } from "@/lib/subdomain";
import { Button } from "@/components/ui/button";
import { Search, ShoppingBag, ShoppingCart, Loader2, ArrowRight, ChevronLeft, ChevronRight, X, Minus, Plus, Trash2, LayoutGrid, Package, Image as ImageIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTenantPath, getConsoleUrl, getCurrencySymbol, optimizeCloudinaryUrl } from "@/lib/utils";
import { BlockRenderer } from "./builder/[pageId]/block-renderer";
import { LazySection } from "./builder/[pageId]/lazy-section";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSkeleton } from "@/components/PageSkeleton";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const pad = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="countdown">
      <div className="cd-block"><span className="cd-num">{pad(timeLeft.hours)}</span><div className="cd-label">Hours</div></div>
      <div className="cd-sep">:</div>
      <div className="cd-block"><span className="cd-num">{pad(timeLeft.minutes)}</span><div className="cd-label">Mins</div></div>
      <div className="cd-sep">:</div>
      <div className="cd-block"><span className="cd-num">{pad(timeLeft.seconds)}</span><div className="cd-label">Secs</div></div>
    </div>
  );
}

export default function Storefront({
  initialStore,
  initialSubdomain,
  initialPage,
  initialProducts,
  initialCategories
}: {
  initialStore?: any,
  initialSubdomain?: string,
  initialPage?: any,
  initialProducts?: any[],
  initialCategories?: any[]
}) {
  const { subdomain: paramsSubdomain } = useParams();
  const supabase = useSupabaseClient();
  const [subdomain, setSubdomain] = useState<string>(initialSubdomain || "");

  useEffect(() => {
    if (initialSubdomain) return;
    let sub = typeof paramsSubdomain === 'string' ? paramsSubdomain.toLowerCase() : '';
    if (!sub && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ihut.shop";
      const extracted = getSubdomain(hostname, rootDomain);
      if (extracted) sub = extracted.toLowerCase();
    }
    setSubdomain(sub);
  }, [paramsSubdomain]);

  const [store, setStore] = useState<any>(initialStore || null);
  const [page, setPage] = useState<any>(initialPage || null);
  const [products, setProducts] = useState<any[]>(initialProducts || []);
  const [categories, setCategories] = useState<any[]>(initialCategories || []);
  const [catsLoading, setCatsLoading] = useState(!initialProducts);
  const [loading, setLoading] = useState(!initialStore);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (subdomain) {
      const savedCart = localStorage.getItem(`cart_${subdomain}`);
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error("Cart parse error", e);
        }
      }
    }

    const handleOpenCart = () => setIsCartOpen(true);
    window.addEventListener('open-cart', handleOpenCart);
    return () => window.removeEventListener('open-cart', handleOpenCart);
  }, [subdomain]);

  useEffect(() => {
    if (subdomain && cart.length >= 0) {
      localStorage.setItem(`cart_${subdomain}`, JSON.stringify(cart));
    }
  }, [cart, subdomain]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: Number(product.currentPrice),
        image: product.featuredImage || (product.gallery && product.gallery[0]),
        quantity: 1
      }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  useEffect(() => {
    if (subdomain) {
      if (!store || !page) {
        fetchStoreAndPage();
      } else if (store?.id && (!initialProducts || products.length === 0)) {
        fetchProducts(store.id);
      }
    }
  }, [subdomain, !!store, !!page, store?.id, initialProducts, products.length]);

  const fetchProducts = async (storeId: string) => {
    setCatsLoading(true);
    try {
      const { data: prodsData } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });
      
      setProducts(prodsData || []);

      const [catRes, subCatRes] = await Promise.all([
        supabase.from("categories").select("*").eq("store_id", storeId),
        supabase.from("sub_categories").select("*").eq("store_id", storeId)
      ]);

      const mainCats = catRes.data || [];
      const subCats = (subCatRes.data || []).map(s => ({ ...s, isSub: true }));

      setCategories([...mainCats, ...subCats]);
    } catch (e) {
      console.error("Fetch Products Error:", e);
    } finally {
      setCatsLoading(false);
    }
  };

  const fetchStoreAndPage = async () => {
    if (initialPage && initialStore) {
       fetchProducts(initialStore.id);
       return;
    }
    setLoading(true);
    setCatsLoading(true);
    try {
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("subdomain", subdomain)
        .single();

      if (!storeData) {
        setStore(null);
        setLoading(false);
        return;
      }

      setStore(storeData);

      const [pagesRes, prodRes, catRes, subCatRes] = await Promise.all([
        supabase.from("pages").select("*").eq("store_id", storeData.id),
        supabase.from("products").select("*").eq("store_id", storeData.id).order("created_at", { ascending: false }),
        supabase.from("categories").select("*").eq("store_id", storeData.id),
        supabase.from("sub_categories").select("*").eq("store_id", storeData.id)
      ]);

      let matchedPage = null;
      if (pagesRes.data && pagesRes.data.length > 0) {
        const pages = pagesRes.data;
        matchedPage = pages.find(p => p.slug === "index") || pages.find(p => p.slug?.toLowerCase() === "index");
        
        if (!matchedPage && pages.length > 0) {
          matchedPage = pages.sort((a: any, b: any) => {
            const timeA = new Date(a.updated_at || a.updatedAt || 0).getTime();
            const timeB = new Date(b.updated_at || b.updatedAt || 0).getTime();
            return timeB - timeA;
          })[0];
        }
      }
      
      if (matchedPage) {
        setPage(matchedPage);
      }

      setProducts(prodRes.data || []);

      const mainCats = catRes.data || [];
      const subCats = (subCatRes.data || []).map(s => ({ ...s, isSub: true }));

      setCategories([...mainCats, ...subCats]);

    } catch (e) {
      console.error("Storefront Init Error:", e);
    } finally {
      setLoading(false);
      setCatsLoading(false);
    }
  };

  if (loading) return <PageSkeleton />;
  if (!store) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center"><h1 className="text-2xl font-black">Store Registry Not Found</h1><Link href="/"><Button className="mt-6">Return to Hub</Button></Link></div>;

  const activeSections = Array.isArray(store?.home_sections) 
    ? store.home_sections 
    : [
        { id: "announcement_bar", enabled: true, config: { text: "নিত্যপ্রয়োজনীয় পণ্য নিয়ে আমরা আছি আপনার পাশে। দেশজুড়ে ক্যাশ অন ডেলিভারি!" } },
        { id: "header", enabled: true, config: { logoTextBn: "ঘরোয়া বাজার", logoTextEn: "PURE & TRUSTED" } },
        { id: "category_nav", enabled: true, config: {} },
        { id: "hero", enabled: true, config: { badgeText: "100% PURE & NATURAL", title: "খাটি ও নিরাপদ পন্যের সমাহার", subtitle: "সুস্বাস্থ্যই আমাদের মূল লক্ষ্য। সরাসরি খামার থেকে আপনাদের হাতে পৌঁছে দিচ্ছি বিশুদ্ধ খাবার।", buttonText: "পণ্যসমূহ দেখুন", buttonLink: "#products", sideBanner1Label: "SPECIAL OFFER", sideBanner1Title: "মধু ও অর্গানিক তেল সংগ্রহ করুন", sideBanner1ButtonText: "অর্ডার করুন", sideBanner1Link: "#", sideBanner2Label: "POPULAR CATEGORY", sideBanner2Title: "প্রাকৃতিক উপাদানে তৈরি হেলথ পাউডার", sideBanner2ButtonText: "অর্ডার করুন", sideBanner2Link: "#" } },
        { id: "trust_strip", enabled: true, config: {} },
        { id: "category_grid", enabled: true, config: {} },
        { id: "flash_sale", enabled: true, config: { title: "ধামাকা ফ্ল্যাশ সেল!", subtitle: "সীমিত সময়ের অফার, দ্রুত সংগ্রহ করুন!", countdownDate: "2026-07-20T23:59:59", buttonText: "অফার দেখুন" } },
        { id: "products_grid", enabled: true, config: { title: "আমাদের জনপ্রিয় পণ্যসমূহ", subtitle: "গ্রাহকদের পছন্দের তালিকার শীর্ষে থাকা সেরা পণ্যসমূহ সংগ্রহ করুন。" } },
        { id: "promo_banners", enabled: true, config: { banner1Title: "খাটি ঘি ও মধু কিনুন", banner1Subtitle: "স্পেশাল ডিসকাউন্ট", banner2Title: "ঘরোয়া মশলা সামগ্রী", banner2Subtitle: "শতভাগ নিরাপদ", banner3Title: "অর্গানিক স্কিন কেয়ার", banner3Subtitle: "প্রাকৃতিক সৌন্দর্য" } },
        { id: "app_download", enabled: true, config: { title: "ঘরোয়া বাজার অ্যাপ ডাউনলোড করুন", subtitle: "সহজে অর্ডার করতে এবং নিয়মিত আপডেট পেতে আমাদের মোবাইল অ্যাপটি ডাউনলোড করুন।" } },
        { id: "testimonials", enabled: true, config: {} },
        { id: "footer", enabled: true, config: { description: "ঘরোয়া বাজার আপনাদের জন্য নিয়ে এসেছে সম্পূর্ণ খাটি ও রাসায়নিক মুক্ত নিত্যপ্রয়োজনীয় খাদ্যপণ্য। আমাদের লক্ষ্য সবার কাছে ভেজালহীন খাদ্য পৌঁছে দেওয়া।" } }
      ];

  const pageStyle = page?.page_style || page?.pageStyle || { backgroundColor: "#f4f7f4", paddingTop: 0, paddingBottom: 40 };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: pageStyle.backgroundColor,
        color: pageStyle.textColor || "#1a2e1a"
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap');
        
        .store-body {
          font-family: 'Poppins', 'Hind Siliguri', sans-serif;
        }
        :root {
          --green:       #2e7d32;
          --green-dark:  #1b5e20;
          --green-light: #4caf50;
          --green-pale:  #e8f5e9;
          --yellow:      #f9a825;
          --yellow-dark: #e65100;
          --red:         #d32f2f;
          --red-light:   #ffebee;
          --gray-50:     #f9fafb;
          --gray-100:    #f1f5f0;
          --gray-200:    #e2e8df;
          --gray-400:    #9aab97;
          --gray-500:    #6b7d68;
          --gray-600:    #4a5c47;
          --gray-800:    #1e2d1c;
          --gray-900:    #111b10;
          --white:       #ffffff;
          --shadow-sm:   0 1px 4px rgba(0,0,0,.07);
          --shadow-md:   0 4px 16px rgba(0,0,0,.09);
          --shadow-lg:   0 8px 32px rgba(46,125,50,.14);
          --radius-sm:   8px;
          --radius-md:   12px;
          --radius-lg:   18px;
          --radius-xl:   24px;
          --transition:  .2s ease;
        }
        .announcement-bar {
          background: var(--green);
          color: var(--white);
          font-size: 12px;
          font-weight: 500;
          padding: 8px 0;
          overflow: hidden;
          letter-spacing: .02em;
        }
        @keyframes ticker {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .ticker-track {
          display: inline-block;
          white-space: nowrap;
          animation: ticker 30s linear infinite;
        }
        .ticker-track .sep {
          display: inline-block;
          margin: 0 18px;
          opacity: .5;
        }
        .ticker-track .ticker-icon {
          color: var(--yellow);
          margin-right: 5px;
        }
        .site-header {
          background: var(--white);
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 16px rgba(0,0,0,.07);
        }
        .header-top {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 0;
        }
        .logo-link { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .logo-icon {
          width: 42px; height: 42px;
          background: var(--green);
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          box-shadow: var(--shadow-sm);
        }
        .logo-icon i { color: var(--white); font-size: 18px; }
        .logo-text-bn {
          display: block;
          font-family: 'Hind Siliguri', sans-serif;
          font-size: 17px; font-weight: 700;
          color: var(--green);
          line-height: 1.2;
        }
        .logo-text-en {
          display: block;
          font-size: 9px; font-weight: 500;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: var(--gray-400);
        }
        .location-btn {
          display: flex; align-items: center; gap: 6px;
          border: 1.5px solid var(--gray-200);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          font-size: 12.5px;
          color: var(--gray-600);
          transition: border-color var(--transition);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .location-btn:hover { border-color: var(--green); }
        .location-btn i.fa-location-dot { color: var(--green); font-size: 13px; }
        .location-btn .city { font-weight: 600; color: var(--green); }
        .location-btn i.fa-chevron-down { font-size: 10px; color: var(--gray-400); }
        .search-wrap {
          flex: 1;
          position: relative;
        }
        .search-wrap input {
          width: 100%;
          border: 1.5px solid var(--gray-200);
          border-radius: var(--radius-md);
          padding: 10px 100px 10px 16px;
          font-size: 13px;
          color: var(--gray-800);
          outline: none;
          transition: border-color var(--transition), box-shadow var(--transition);
          background: var(--white);
        }
        .search-wrap input::placeholder { color: var(--gray-400); }
        .search-wrap input:focus {
          border-color: var(--green);
          box-shadow: 0 0 0 3px rgba(46,125,50,.1);
        }
        .search-btn {
          position: absolute;
          right: 5px; top: 50%;
          transform: translateY(-50%);
          background: var(--green);
          color: var(--white);
          border-radius: var(--radius-sm);
          padding: 7px 14px;
          font-size: 13px;
          transition: background var(--transition);
          display: flex; align-items: center; gap: 6px;
        }
        .search-btn:hover { background: var(--green-dark); }
        .header-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .hdr-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: 2px; padding: 6px 10px;
          color: var(--gray-600);
          border-radius: var(--radius-sm);
          transition: color var(--transition), background var(--transition);
          font-size: 11px; font-weight: 500;
          position: relative;
        }
        .hdr-btn:hover { color: var(--green); background: var(--green-pale); }
        .hdr-btn i { font-size: 18px; }
        .cart-badge {
          position: absolute;
          top: 2px; right: 4px;
          background: var(--red);
          color: var(--white);
          font-size: 9px; font-weight: 700;
          width: 16px; height: 16px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          animation: pulse-badge 1.6s infinite;
        }
        @keyframes pulse-badge { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
        .cat-nav {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 0 10px;
          overflow-x: auto;
          border-top: 1px solid var(--gray-100);
          scrollbar-width: none;
        }
        .cat-nav::-webkit-scrollbar { display: none; }
        .cat-pill {
          display: flex; align-items: center; gap: 6px;
          flex-shrink: 0;
          font-size: 12px; font-weight: 500;
          color: var(--gray-600);
          padding: 6px 13px;
          border-radius: 50px;
          border: 1.5px solid var(--gray-200);
          background: var(--white);
          transition: all var(--transition);
          white-space: nowrap;
        }
        .cat-pill i { font-size: 11px; color: var(--green-light); }
        .cat-pill:hover {
          background: var(--green);
          color: var(--white);
          border-color: var(--green);
        }
        .cat-pill:hover i { color: var(--white); }
        .hero-section { padding: 16px 0; }
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 12px;
        }
        .hero-main {
          background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%);
          border-radius: var(--radius-xl);
          padding: 48px 56px;
          color: var(--white);
          min-height: 280px;
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
          background-size: cover;
          background-position: center;
        }
        .hero-bg-icon {
          position: absolute;
          right: -20px; top: 50%;
          transform: translateY(-50%);
          font-size: 200px;
          opacity: .07;
          color: var(--white);
          pointer-events: none;
          line-height: 1;
        }
        .hero-content { position: relative; z-index: 1; max-width: 420px; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--yellow);
          color: var(--yellow-dark);
          font-size: 11px; font-weight: 700;
          padding: 4px 12px;
          border-radius: 50px;
          margin-bottom: 16px;
          letter-spacing: .04em;
        }
        .hero-title {
          font-family: 'Hind Siliguri', sans-serif;
          font-size: 36px; font-weight: 800;
          line-height: 1.2;
          margin-bottom: 12px;
        }
        .hero-sub {
          font-size: 13px;
          color: rgba(255,255,255,.8);
          margin-bottom: 24px;
          line-height: 1.7;
        }
        .hero-btns { display: flex; gap: 10px; flex-wrap: wrap; }
        .btn-white {
          background: var(--white);
          color: var(--green);
          font-weight: 700; font-size: 13px;
          padding: 10px 22px;
          border-radius: var(--radius-md);
          transition: background var(--transition);
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-white:hover { background: #e8f5e9; }
        .btn-outline-white {
          border: 1.5px solid rgba(255,255,255,.4);
          color: var(--white);
          font-weight: 500; font-size: 13px;
          padding: 10px 22px;
          border-radius: var(--radius-md);
          transition: background var(--transition);
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-outline-white:hover { background: rgba(255,255,255,.1); }
        .hero-side { display: flex; flex-direction: column; gap: 12px; }
        .side-banner {
          flex: 1;
          border-radius: var(--radius-lg);
          padding: 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 130px;
          background-size: cover;
          background-position: center;
        }
        .side-banner.amber { background: #fff8e1; border: 1.5px solid #ffe082; }
        .side-banner.blue  { background: #e3f2fd; border: 1.5px solid #90caf9; }
        .sb-label { font-size: 11px; font-weight: 700; margin-bottom: 4px; }
        .sb-label.amber { color: #e65100; }
        .sb-label.blue  { color: #1565c0; }
        .sb-label i { margin-right: 4px; }
        .sb-title { font-family: 'Hind Siliguri', sans-serif; font-size: 14px; font-weight: 700; color: var(--gray-800); line-height: 1.3; }
        .sb-row { display: flex; align-items: flex-end; justify-content: space-between; margin-top: 10px; }
        .sb-icon { font-size: 32px; }
        .sb-icon.amber { color: #f9a825; }
        .sb-icon.blue  { color: #42a5f5; }
        .btn-sm {
          font-size: 11.5px; font-weight: 700;
          padding: 7px 13px;
          border-radius: var(--radius-sm);
          transition: opacity var(--transition);
          display: inline-flex; align-items: center; gap: 5px;
        }
        .btn-sm:hover { opacity: .85; }
        .btn-sm.amber { background: #f9a825; color: var(--white); }
        .btn-sm.blue  { background: #1976d2; color: var(--white); }
        .trust-strip {
          background: var(--white);
          border-radius: var(--radius-lg);
          border: 1.5px solid var(--gray-100);
          box-shadow: var(--shadow-sm);
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          margin-bottom: 28px;
        }
        .trust-item {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 20px;
          border-right: 1px solid var(--gray-100);
        }
        .trust-item:last-child { border-right: none; }
        .trust-icon {
          width: 40px; height: 40px;
          border-radius: var(--radius-sm);
          background: var(--green-pale);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .trust-icon i { color: var(--green); font-size: 16px; }
        .trust-title { font-weight: 600; font-size: 13px; color: var(--gray-800); }
        .trust-sub   { font-size: 11.5px; color: var(--gray-400); }
        .section-header {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-bottom: 18px;
        }
        .section-title { font-size: 18px; font-weight: 700; color: var(--gray-800); display: flex; align-items: center; gap: 8px; }
        .section-title i { color: var(--green); font-size: 16px; }
        .section-sub  { font-size: 12px; color: var(--gray-400); margin-top: 2px; }
        .see-all {
          font-size: 12.5px; font-weight: 600; color: var(--green);
          display: flex; align-items: center; gap: 4px;
          transition: gap var(--transition);
        }
        .see-all:hover { gap: 8px; }
        .section { margin-bottom: 36px; }
        .cat-grid {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 12px;
        }
        .cat-item {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          cursor: pointer;
        }
        .cat-icon-wrap {
          width: 58px; height: 58px;
          border-radius: var(--radius-lg);
          display: flex; align-items: center; justify-content: center;
          transition: background var(--transition), transform var(--transition), box-shadow var(--transition);
        }
        .cat-icon-wrap i { font-size: 22px; transition: color var(--transition); }
        .cat-item:hover .cat-icon-wrap { transform: translateY(-3px); box-shadow: var(--shadow-md); }
        .cat-label { font-size: 11px; font-weight: 500; color: var(--gray-600); text-align: center; transition: color var(--transition); }
        .cat-item:hover .cat-label { color: var(--green); }
        
        .c-green  { background: #e8f5e9; } .c-green  i { color: #2e7d32; }
        .c-orange { background: #fff3e0; } .c-orange i { color: #e65100; }
        .c-red    { background: #ffebee; } .c-red    i { color: #c62828; }
        .c-blue   { background: #e3f2fd; } .c-blue   i { color: #1565c0; }
        .c-yellow { background: #fffde7; } .c-yellow i { color: #f57f17; }
        .c-amber  { background: #fff8e1; } .c-amber  i { color: #f59f00; }
        .c-purple { background: #f3e5f5; } .c-purple i { color: #6a1b9a; }
        .c-teal   { background: #e0f2f1; } .c-teal   i { color: #00695c; }
        .c-pink   { background: #fce4ec; } .c-pink   i { color: #ad1457; }
        .c-lime   { background: #f9fbe7; } .c-lime   i { color: #558b2f; }
        
        .cat-item:hover .c-green  { background: #2e7d32; } .cat-item:hover .c-green  i { color: #fff; }
        .cat-item:hover .c-orange { background: #e65100; } .cat-item:hover .c-orange i { color: #fff; }
        .cat-item:hover .c-red    { background: #c62828; } .cat-item:hover .c-red    i { color: #fff; }
        .cat-item:hover .c-blue   { background: #1565c0; } .cat-item:hover .c-blue   i { color: #fff; }
        .cat-item:hover .c-yellow { background: #f57f17; } .cat-item:hover .c-yellow i { color: #fff; }
        .cat-item:hover .c-amber  { background: #f59f00; } .cat-item:hover .c-amber  i { color: #fff; }
        .cat-item:hover .c-purple { background: #6a1b9a; } .cat-item:hover .c-purple i { color: #fff; }
        .cat-item:hover .c-teal   { background: #00695c; } .cat-item:hover .c-teal   i { color: #fff; }
        .cat-item:hover .c-pink   { background: #ad1457; } .cat-item:hover .c-pink   i { color: #fff; }
        .cat-item:hover .c-lime   { background: #558b2f; } .cat-item:hover .c-lime   i { color: #fff; }
        
        .flash-banner {
          background: linear-gradient(135deg, #e65100, #c62828);
          border-radius: var(--radius-xl);
          padding: 20px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          color: var(--white);
          margin-bottom: 28px;
          box-shadow: 0 6px 24px rgba(198,40,40,.25);
        }
        .flash-left { display: flex; align-items: center; gap: 16px; }
        .flash-bolt { font-size: 36px; color: var(--yellow); }
        .flash-title { font-size: 20px; font-weight: 800; }
        .flash-sub   { font-size: 12.5px; color: rgba(255,255,255,.8); margin-top: 2px; }
        .countdown { display: flex; align-items: center; gap: 8px; }
        .cd-block { text-align: center; }
        .cd-num {
          background: rgba(255,255,255,.2);
          border-radius: var(--radius-sm);
          padding: 8px 14px;
          font-family: 'Courier New', monospace;
          font-size: 22px; font-weight: 700;
          min-width: 52px; display: block;
        }
        .cd-label { font-size: 10px; margin-top: 3px; opacity: .75; }
        .cd-sep { font-size: 22px; font-weight: 700; margin-bottom: 14px; color: white; }
        .btn-flash {
          background: var(--white);
          color: #c62828;
          font-weight: 700; font-size: 13px;
          padding: 10px 22px;
          border-radius: var(--radius-md);
          transition: opacity var(--transition);
          white-space: nowrap;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-flash:hover { opacity: .9; }
        
        .product-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 14px;
        }
        .product-card {
          background: var(--white);
          border-radius: var(--radius-lg);
          border: 1.5px solid var(--gray-100);
          overflow: hidden;
          cursor: pointer;
          position: relative;
          transition: box-shadow var(--transition), transform var(--transition);
        }
        .product-card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }
        .product-card:hover .add-btn {
          opacity: 1;
          transform: translateY(0);
        }
        .pc-badge {
          position: absolute;
          top: 10px; left: 10px;
          z-index: 2;
          font-size: 10px; font-weight: 700;
          padding: 3px 9px;
          border-radius: 50px;
          letter-spacing: .03em;
        }
        .pc-badge.red    { background: var(--red);    color: var(--white); }
        .pc-badge.yellow { background: var(--yellow);  color: #5d4000; }
        .pc-badge.green  { background: var(--green);   color: var(--white); }
        .pc-badge.right  { left: auto; right: 10px; }
        
        .pc-img {
          height: 140px;
          display: flex; align-items: center; justify-content: center;
          position: relative;
        }
        .pc-img i { font-size: 62px; }
        
        .bg-green-pale  { background: #e8f5e9; }
        .bg-orange-pale { background: #fff3e0; }
        .bg-red-pale    { background: #ffebee; }
        .bg-yellow-pale { background: #fffde7; }
        .bg-purple-pale { background: #f3e5f5; }
        .bg-blue-pale   { background: #e3f2fd; }
        .bg-amber-pale  { background: #fff8e1; }
        .bg-pink-pale   { background: #fce4ec; }
        .bg-teal-pale   { background: #e0f2f1; }
        .bg-lime-pale   { background: #f9fbe7; }
        
        .pc-body { padding: 12px; }
        .pc-origin { font-size: 10.5px; color: var(--gray-400); margin-bottom: 2px; }
        .pc-name   { font-size: 13px; font-weight: 600; color: var(--gray-800); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pc-qty    { font-size: 11px; color: var(--gray-400); margin-bottom: 8px; }
        .pc-pricing { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .pc-price  { font-size: 14px; font-weight: 700; color: var(--green); }
        .pc-old    { font-size: 11.5px; color: var(--gray-400); text-decoration: line-through; }
        .add-btn {
          width: 100%;
          background: var(--green);
          color: var(--white);
          font-size: 11.5px; font-weight: 600;
          padding: 8px 0;
          border-radius: var(--radius-sm);
          opacity: 0;
          transform: translateY(6px);
          transition: opacity .22s ease, transform .22s ease, background var(--transition);
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .add-btn:hover { background: var(--green-dark); }
        
        .promo-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 36px;
        }
        .promo-card {
          border-radius: var(--radius-xl);
          padding: 24px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px;
          color: var(--white);
          background-size: cover;
          background-position: center;
        }
        .promo-card.g1 { background: linear-gradient(135deg, #1b5e20, #2e7d32); }
        .promo-card.g2 { background: linear-gradient(135deg, #e65100, #f9a825); }
        .promo-card.g3 { background: linear-gradient(135deg, #1565c0, #3949ab); }
        .promo-eyebrow { font-size: 10px; font-weight: 700; opacity: .75; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 5px; }
        .promo-title   { font-family: 'Hind Siliguri', sans-serif; font-size: 17px; font-weight: 700; line-height: 1.3; margin-bottom: 10px; }
        .promo-icon    { font-size: 52px; opacity: .9; flex-shrink: 0; }
        .btn-promo {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,.22);
          border: 1.5px solid rgba(255,255,255,.4);
          color: var(--white);
          font-size: 12px; font-weight: 700;
          padding: 7px 16px;
          border-radius: var(--radius-sm);
          transition: background var(--transition);
        }
        .btn-promo:hover { background: rgba(255,255,255,.35); }
        
        .app-banner {
          background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 60%, #388e3c 100%);
          border-radius: var(--radius-xl);
          padding: 48px 56px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 32px;
          color: var(--white);
          position: relative;
          overflow: hidden;
          margin-bottom: 36px;
        }
        .app-banner-bg {
          position: absolute; right: 180px; top: 50%; transform: translateY(-50%);
          font-size: 220px; opacity: .05;
          color: var(--white); pointer-events: none; line-height: 1;
        }
        .app-banner-content { position: relative; z-index: 1; }
        .app-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.65); margin-bottom: 10px; }
        .app-title   { font-family: 'Hind Siliguri', sans-serif; font-size: 32px; font-weight: 800; margin-bottom: 10px; }
        .app-sub     { font-size: 13.5px; color: rgba(255,255,255,.75); max-width: 400px; line-height: 1.7; margin-bottom: 24px; }
        .app-btns    { display: flex; gap: 12px; flex-wrap: wrap; }
        .app-store-btn {
          display: flex; align-items: center; gap: 10px;
          background: rgba(0,0,0,.28);
          border: 1.5px solid rgba(255,255,255,.2);
          border-radius: var(--radius-md);
          padding: 10px 18px;
          color: var(--white);
          transition: background var(--transition);
        }
        .app-store-btn:hover { background: rgba(0,0,0,.42); }
        .app-store-btn i { font-size: 24px; }
        .asb-label { font-size: 10px; opacity: .7; }
        .asb-name  { font-size: 14px; font-weight: 700; }
        .app-phone {
          position: relative; z-index: 1;
          font-size: 120px;
          color: var(--white);
          opacity: .85;
          flex-shrink: 0;
        }
        
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .review-card {
          background: var(--white);
          border-radius: var(--radius-lg);
          border: 1.5px solid var(--gray-100);
          padding: 20px;
          box-shadow: var(--shadow-sm);
        }
        .stars { display: flex; gap: 2px; margin-bottom: 12px; }
        .stars i { color: var(--yellow); font-size: 13px; }
        .stars i.dim { color: var(--gray-200); }
        .review-text { font-size: 13px; color: var(--gray-600); margin-bottom: 16px; line-height: 1.7; font-style: italic; }
        .reviewer    { display: flex; align-items: center; gap: 10px; }
        .reviewer-av {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--white); font-weight: 700; font-size: 13px;
          flex-shrink: 0;
        }
        .reviewer-name { font-weight: 600; font-size: 13px; }
        .reviewer-loc  { font-size: 11px; color: var(--gray-400); }
        
        footer { background: #111b10; color: #9aab97; }
        .footer-newsletter {
          border-bottom: 1px solid #1e2d1c;
          padding: 32px 0;
        }
        .newsletter-inner {
          display: flex; align-items: center; justify-content: space-between; gap: 24px;
        }
        .nl-title { font-size: 17px; font-weight: 700; color: var(--white); margin-bottom: 4px; }
        .nl-sub   { font-size: 12.5px; color: #6b7d68; }
        .nl-form  { display: flex; gap: 8px; }
        .nl-input {
          background: #1e2d1c;
          border: 1.5px solid #2a3d28;
          border-radius: var(--radius-md);
          padding: 10px 16px;
          font-size: 13px;
          color: var(--white);
          outline: none;
          width: 300px;
          transition: border-color var(--transition);
        }
        .nl-input::placeholder { color: #4a5c47; }
        .nl-input:focus { border-color: var(--green); }
        .btn-subscribe {
          background: var(--green);
          color: var(--white);
          font-size: 13px; font-weight: 700;
          padding: 10px 22px;
          border-radius: var(--radius-md);
          transition: background var(--transition);
          white-space: nowrap;
          display: flex; align-items: center; gap: 6px;
        }
        .btn-subscribe:hover { background: var(--green-dark); }
        .footer-main {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
          gap: 40px;
          padding: 48px 0;
        }
        .footer-brand-icon {
          width: 38px; height: 38px;
          background: var(--green);
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px;
        }
        .footer-brand-icon i { color: var(--white); font-size: 16px; }
        .footer-brand-name-bn { font-family: 'Hind Siliguri', sans-serif; font-size: 16px; font-weight: 700; color: var(--white); }
        .footer-brand-name-en { font-size: 9px; letter-spacing: .14em; color: #4a5c47; text-transform: uppercase; }
        .footer-desc { font-size: 12.5px; color: #6b7d68; line-height: 1.8; margin: 14px 0 18px; }
        .social-links { display: flex; gap: 8px; }
        .social-link {
          width: 32px; height: 32px;
          background: #1e2d1c;
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          color: #6b7d68;
          font-size: 13px;
          transition: background var(--transition), color var(--transition);
        }
        .social-link:hover { background: var(--green); color: var(--white); }
        .footer-col-title { font-size: 13.5px; font-weight: 700; color: var(--white); margin-bottom: 18px; }
        .footer-links li { margin-bottom: 10px; }
        .footer-links a { font-size: 12.5px; color: #6b7d68; transition: color var(--transition); display: flex; align-items: center; gap: 6px; }
        .footer-links a:hover { color: var(--green-light); }
        .footer-links a i { font-size: 10px; }
        .contact-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; font-size: 12.5px; color: #6b7d68; }
        .contact-item i { color: var(--green-light); font-size: 13px; margin-top: 1px; flex-shrink: 0; }
        .contact-item a { color: #6b7d68; transition: color var(--transition); }
        .contact-item a:hover { color: var(--green-light); }
        .payment-label { font-size: 10.5px; color: #4a5c47; margin: 16px 0 8px; letter-spacing: .05em; text-transform: uppercase; }
        .payment-badges { display: flex; flex-wrap: wrap; gap: 6px; }
        .pay-badge { background: #1e2d1c; border: 1px solid #2a3d28; color: #9aab97; font-size: 11px; font-weight: 600; padding: 5px 11px; border-radius: 6px; }
        
        .footer-bottom {
          border-top: 1px solid #1e2d1c;
          padding: 16px 0;
          display: flex; align-items: center; justify-content: space-between;
          font-size: 11.5px; color: #4a5c47;
        }
        .footer-bottom i { color: var(--red); }
        .footer-bottom .flag { font-size: 14px; }
        
        @media (max-width: 1100px) {
          .product-grid { grid-template-columns: repeat(4, 1fr); }
          .cat-grid     { grid-template-columns: repeat(5, 1fr); }
        }
        @media (max-width: 900px) {
          .hero-grid    { grid-template-columns: 1fr; }
          .hero-side    { flex-direction: row; }
          .trust-strip  { grid-template-columns: repeat(2, 1fr); }
          .trust-item   { border-right: none; border-bottom: 1px solid var(--gray-100); }
          .trust-item:nth-child(odd)  { border-right: 1px solid var(--gray-100); }
          .trust-item:last-child,
          .trust-item:nth-last-child(2) { border-bottom: none; }
          .promo-grid   { grid-template-columns: 1fr; }
          .testimonials-grid { grid-template-columns: 1fr; }
          .footer-main  { grid-template-columns: 1fr 1fr; }
          .product-grid { grid-template-columns: repeat(3, 1fr); }
          .app-banner   { flex-direction: column; text-align: center; }
          .app-phone    { display: none; }
          .app-btns     { justify-content: center; }
          .flash-banner { flex-direction: column; text-align: center; }
          .location-btn { display: none; }
          .newsletter-inner { flex-direction: column; text-align: center; }
          .nl-input { width: 100%; }
        }
        @media (max-width: 600px) {
          .product-grid { grid-template-columns: repeat(2, 1fr); }
          .cat-grid     { grid-template-columns: repeat(4, 1fr); }
          .hero-main    { padding: 32px 24px; }
          .hero-title   { font-size: 26px; }
          .footer-main  { grid-template-columns: 1fr; }
          .hdr-btn span { display: none; }
          .footer-bottom { flex-direction: column; gap: 6px; text-align: center; }
        }
      ` }} />

      <div className="store-body">
        {activeSections.map((section) => {
          if (!section.enabled) return null;

          switch (section.id) {
            case "announcement_bar":
              return (
                <div key={section.id} className="announcement-bar">
                  <div className="ticker-track">
                    <i className="fa-solid fa-truck-fast ticker-icon"></i> {section.config.text || "Free delivery on orders over ৳500"}
                    <span className="sep">|</span>
                    <i className="fa-solid fa-leaf ticker-icon"></i> Organic vegetables daily
                    <span className="sep">|</span>
                    <i className="fa-solid fa-bolt ticker-icon"></i> Same-day delivery
                    <span className="sep">|</span>
                    <i className="fa-solid fa-tag ticker-icon"></i> 20% OFF with code NAYA20
                    <span className="sep">|</span>
                    <i className="fa-solid fa-truck-fast ticker-icon"></i> {section.config.text || "Free delivery on orders over ৳500"}
                  </div>
                </div>
              );

            case "header":
              return (
                <header key={section.id} className="site-header">
                  <div className="container">
                    <div className="header-top">
                      <a href="#" className="logo-link">
                        <div className="logo-icon">
                          <i className="fa-solid fa-basket-shopping"></i>
                        </div>
                        <div>
                          <span className="logo-text-bn">{section.config.logoTextBn || store.name}</span>
                          <span className="logo-text-en">{section.config.logoTextEn || "Pure & Trusted"}</span>
                        </div>
                      </a>
                      <button className="location-btn">
                        <i className="fa-solid fa-location-dot"></i>
                        <span className="city">Dhaka</span>
                        <i className="fa-solid fa-chevron-down"></i>
                      </button>
                      <div className="search-wrap">
                        <input type="text" placeholder="Search for groceries, vegetables, fruits…" />
                        <button className="search-btn">
                          <i className="fa-solid fa-magnifying-glass"></i> Search
                        </button>
                      </div>
                      <div className="header-actions">
                        <button className="hdr-btn">
                          <i className="fa-regular fa-user"></i>
                          <span>Login</span>
                        </button>
                        <button className="hdr-btn" onClick={() => setIsCartOpen(true)}>
                          <i className="fa-solid fa-basket-shopping"></i>
                          <span>Cart</span>
                          {cart.length > 0 && (
                            <span className="cart-badge">{cart.reduce((acc, i) => acc + i.quantity, 0)}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </header>
              );

            case "category_nav":
              return (
                <div key={section.id} className="container">
                  <nav className="cat-nav">
                    {categories.filter(c => !c.parentId && !c.categoryId).map((cat) => (
                      <Link key={cat.id} href={`${getTenantPath(subdomain, "/all-products")}?category=${cat.id}`} className="cat-pill">
                        <i className="fa-solid fa-seedling"></i> {cat.name}
                      </Link>
                    ))}
                  </nav>
                </div>
              );

            case "hero":
              return (
                <section key={section.id} className="hero-section">
                  <div className="container">
                    <div className="hero-grid">
                      <div 
                        className="hero-main"
                        style={section.config.image ? { backgroundImage: `url(${section.config.image})` } : {}}
                      >
                        <div className="hero-bg-icon"><i className="fa-solid fa-basket-shopping"></i></div>
                        <div className="hero-content">
                          <div className="hero-badge">
                            <i className="fa-solid fa-fire"></i> {section.config.badgeText || "SPECIAL OFFER"}
                          </div>
                          <h1 className="hero-title">{section.config.title || "খাটি ও নিরাপদ পন্যের সমাহার"}</h1>
                          <p className="hero-sub">{section.config.subtitle || "সুস্বাস্থ্যই আমাদের মূল লক্ষ্য।"}</p>
                          <div className="hero-btns">
                            <Link href={getTenantPath(subdomain, section.config.buttonLink || "/all-products")} className="btn-white">
                              <i className="fa-solid fa-bag-shopping"></i> {section.config.buttonText || "Shop Now"}
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="hero-side">
                        <div 
                          className="side-banner amber"
                          style={section.config.sideBanner1Image ? { backgroundImage: `url(${section.config.sideBanner1Image})` } : {}}
                        >
                          <div>
                            <div className="sb-label amber"><i className="fa-solid fa-bolt"></i> {section.config.sideBanner1Label || "Flash Sale"}</div>
                            <div className="sb-title">{section.config.sideBanner1Title || "মধু ও তেল"}</div>
                          </div>
                          <div className="sb-row">
                            <Link href={section.config.sideBanner1Link || "#"} className="btn-sm amber">
                              <i className="fa-solid fa-cart-plus"></i> {section.config.sideBanner1ButtonText || "Buy Now"}
                            </Link>
                            <i className="fa-solid fa-lemon sb-icon amber"></i>
                          </div>
                        </div>
                        <div 
                          className="side-banner blue"
                          style={section.config.sideBanner2Image ? { backgroundImage: `url(${section.config.sideBanner2Image})` } : {}}
                        >
                          <div>
                            <div className="sb-label blue"><i className="fa-solid fa-truck-fast"></i> {section.config.sideBanner2Label || "Free Delivery"}</div>
                            <div className="sb-title">{section.config.sideBanner2Title || "প্রাকৃতিক উপাদান"}</div>
                          </div>
                          <div className="sb-row">
                            <Link href={section.config.sideBanner2Link || "#"} className="btn-sm blue">
                              <i className="fa-solid fa-compass"></i> {section.config.sideBanner2ButtonText || "Explore"}
                            </Link>
                            <i className="fa-solid fa-leaf sb-icon blue"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              );

            case "trust_strip":
              return (
                <div key={section.id} className="container" style={{ paddingTop: "16px", paddingBottom: 0 }}>
                  <div className="trust-strip">
                    <div className="trust-item">
                      <div className="trust-icon"><i className="fa-solid fa-truck-fast"></i></div>
                      <div><div className="trust-title">Fast Delivery</div><div className="trust-sub">Within 2 hours in Dhaka</div></div>
                    </div>
                    <div className="trust-item">
                      <div className="trust-icon"><i className="fa-solid fa-circle-check"></i></div>
                      <div><div className="trust-title">Quality Assured</div><div className="trust-sub">100% fresh guaranteed</div></div>
                    </div>
                    <div className="trust-item">
                      <div className="trust-icon"><i className="fa-solid fa-shield-halved"></i></div>
                      <div><div className="trust-title">Secure Payment</div><div className="trust-sub">bKash, Nagad, Card</div></div>
                    </div>
                    <div className="trust-item">
                      <div className="trust-icon"><i className="fa-solid fa-rotate-left"></i></div>
                      <div><div className="trust-title">Easy Returns</div><div className="trust-sub">Hassle-free policy</div></div>
                    </div>
                  </div>
                </div>
              );

            case "category_grid":
              return (
                <div key={section.id} className="container" style={{ paddingTop: "32px" }}>
                  <div className="section">
                    <div className="section-header">
                      <div>
                        <div className="section-title"><i className="fa-solid fa-grid-2"></i> Shop by Category</div>
                      </div>
                      <Link href={getTenantPath(subdomain, "/all-products")} className="see-all">
                        View All <i className="fa-solid fa-arrow-right"></i>
                      </Link>
                    </div>
                    <div className="cat-grid">
                      {categories.filter(c => !c.parentId && !c.categoryId).map((cat, idx) => {
                        const bgClasses = ["c-green", "c-orange", "c-red", "c-blue", "c-yellow", "c-amber", "c-purple", "c-teal", "c-pink", "c-lime"];
                        const bgClass = bgClasses[idx % bgClasses.length];
                        return (
                          <Link key={cat.id} href={`${getTenantPath(subdomain, "/all-products")}?category=${cat.id}`} className="cat-item">
                            <div className={`cat-icon-wrap ${bgClass}`}><i className="fa-solid fa-seedling"></i></div>
                            <span className="cat-label">{cat.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );

            case "flash_sale":
              return (
                <div key={section.id} className="container">
                  <div className="flash-banner">
                    <div className="flash-left">
                      <i className="fa-solid fa-bolt flash-bolt"></i>
                      <div>
                        <div className="flash-title">{section.config.title || "Flash Sale"}</div>
                        <div className="flash-sub">{section.config.subtitle || "Today's special offers"}</div>
                      </div>
                    </div>
                    <CountdownTimer targetDate={section.config.countdownDate || "2026-07-20T23:59:59"} />
                  </div>
                </div>
              );

            case "products_grid":
              return (
                <div key={section.id} className="container">
                  <div className="section">
                    <div className="section-header">
                      <div>
                        <div className="section-title"><i className="fa-solid fa-basket-shopping"></i> {section.config.title || "Featured Products"}</div>
                        <div className="section-sub">{section.config.subtitle || "Top selected catalog"}</div>
                      </div>
                      <Link href={getTenantPath(subdomain, "/all-products")} className="see-all">
                        See All <i className="fa-solid fa-arrow-right"></i>
                      </Link>
                    </div>
                    <div className="product-grid">
                      {products.slice(0, 12).map((p, idx) => {
                        const bgClasses = ["bg-green-pale", "bg-orange-pale", "bg-red-pale", "bg-yellow-pale", "bg-purple-pale", "bg-blue-pale"];
                        const bgClass = bgClasses[idx % bgClasses.length];
                        return (
                          <div key={p.id} className="product-card">
                            {p.prevPrice && (
                              <span className="pc-badge red">-{Math.round(((Number(p.prevPrice) - Number(p.currentPrice)) / Number(p.prevPrice)) * 100)}%</span>
                            )}
                            <Link href={getTenantPath(subdomain, `/product/${p.slug}`)}>
                              <div className={`pc-img ${bgClass}`}>
                                {p.featuredImage ? (
                                  <img src={p.featuredImage} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <i className="fa-solid fa-carrot" style={{ color: "#e65100" }}></i>
                                )}
                              </div>
                            </Link>
                            <div className="pc-body">
                              <div className="pc-origin">Fresh Product</div>
                              <h4 className="pc-name">{p.name}</h4>
                              <div className="pc-qty">{p.totalInStock > 0 ? "In Stock" : "Out of Stock"}</div>
                              <div className="pc-pricing">
                                <span className="pc-price">{getCurrencySymbol(store?.currency)}{Number(p.currentPrice).toFixed(0)}</span>
                                {p.prevPrice && <span className="pc-old">{getCurrencySymbol(store?.currency)}{Number(p.prevPrice).toFixed(0)}</span>}
                              </div>
                              <button className="add-btn" onClick={() => addToCart(p)}>
                                <i className="fa-solid fa-cart-plus"></i> Add to Cart
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );

            case "promo_banners":
              return (
                <div key={section.id} className="container">
                  <div className="promo-grid">
                    <div 
                      className="promo-card g1"
                      style={section.config.banner1Image ? { backgroundImage: `url(${section.config.banner1Image})` } : {}}
                    >
                      <div>
                        <div className="promo-eyebrow">{section.config.banner1Subtitle || "Everyday Fresh"}</div>
                        <div className="promo-title">{section.config.banner1Title || "অর্গানিক সবজি"}</div>
                        <Link href={getTenantPath(subdomain, "/all-products")} className="btn-promo">
                          <i className="fa-solid fa-leaf"></i> Order Now
                        </Link>
                      </div>
                      <i className="fa-solid fa-seedling promo-icon"></i>
                    </div>
                    <div 
                      className="promo-card g2"
                      style={section.config.banner2Image ? { backgroundImage: `url(${section.config.banner2Image})` } : {}}
                    >
                      <div>
                        <div className="promo-eyebrow">{section.config.banner2Subtitle || "Seasonal Picks"}</div>
                        <div className="promo-title">{section.config.banner2Title || "Tropical Fruits"}</div>
                        <Link href={getTenantPath(subdomain, "/all-products")} className="btn-promo">
                          <i className="fa-solid fa-apple-whole"></i> Explore
                        </Link>
                      </div>
                      <i className="fa-solid fa-apple-whole promo-icon"></i>
                    </div>
                    <div 
                      className="promo-card g3"
                      style={section.config.banner3Image ? { backgroundImage: `url(${section.config.banner3Image})` } : {}}
                    >
                      <div>
                        <div className="promo-eyebrow">{section.config.banner3Subtitle || "Subscribe & Save"}</div>
                        <div className="promo-title">{section.config.banner3Title || "Daily Essentials"}</div>
                        <Link href={getTenantPath(subdomain, "/all-products")} className="btn-promo">
                          <i className="fa-solid fa-repeat"></i> Subscribe
                        </Link>
                      </div>
                      <i className="fa-solid fa-basket-shopping promo-icon"></i>
                    </div>
                  </div>
                </div>
              );

            case "app_download":
              return (
                <div key={section.id} className="container">
                  <div className="app-banner">
                    <div className="app-banner-bg"><i className="fa-solid fa-basket-shopping"></i></div>
                    <div className="app-banner-content">
                      <div className="app-eyebrow">Store Application</div>
                      <h2 className="app-title">{section.config.title || "অ্যাপ ডাউনলোড করুন"}</h2>
                      <p className="app-sub">{section.config.subtitle || "সহজে অর্ডার করতে এবং নিয়মিত আপডেট পেতে আমাদের মোবাইল অ্যাপটি ডাউনলোড করুন।"}</p>
                      <div className="app-btns">
                        <button className="app-store-btn">
                          <i className="fa-brands fa-google-play"></i>
                          <div className="text-left">
                            <div className="asb-label">GET IT ON</div>
                            <div className="asb-name">Google Play</div>
                          </div>
                        </button>
                        <button className="app-store-btn">
                          <i className="fa-brands fa-apple"></i>
                          <div className="text-left">
                            <div className="asb-label">Download on the</div>
                            <div className="asb-name">App Store</div>
                          </div>
                        </button>
                      </div>
                    </div>
                    {section.config.image ? (
                      <img src={section.config.image} className="w-[180px] h-auto object-contain shrink-0 relative z-10" alt="mockup" />
                    ) : (
                      <i className="fa-solid fa-mobile-screen-button app-phone"></i>
                    )}
                  </div>
                </div>
              );

            case "testimonials":
              return (
                <div key={section.id} className="container" style={{ paddingBottom: "36px" }}>
                  <div className="section">
                    <div className="section-header">
                      <div>
                        <div className="section-title"><i className="fa-solid fa-star"></i> Customer Testimonials</div>
                      </div>
                    </div>
                    <div className="testimonials-grid">
                      <div className="review-card">
                        <div className="stars"><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i></div>
                        <p className="review-text">"The organic ghee is extremely pure and fragrance is amazing. Highly recommended!"</p>
                        <div className="reviewer">
                          <div className="reviewer-av bg-green">A</div>
                          <div><div className="reviewer-name">Abdur Rahman</div><div className="reviewer-loc">Dhaka</div></div>
                        </div>
                      </div>
                      <div className="review-card">
                        <div className="stars"><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i></div>
                        <p className="review-text">"Always delivered fresh groceries within 2 hours. Very satisfied."</p>
                        <div className="reviewer">
                          <div className="reviewer-av bg-orange">K</div>
                          <div><div className="reviewer-name">Kamrul Hasan</div><div className="reviewer-loc">Chittagong</div></div>
                        </div>
                      </div>
                      <div className="review-card">
                        <div className="stars"><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i></div>
                        <p className="review-text">"Loved the fresh local farm tomatoes. High quality packaging."</p>
                        <div className="reviewer">
                          <div className="reviewer-av bg-blue">S</div>
                          <div><div className="reviewer-name">Sadia Islam</div><div className="reviewer-loc">Sylhet</div></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );

            case "footer":
              return (
                <footer key={section.id}>
                  <div className="footer-newsletter">
                    <div className="container">
                      <div className="newsletter-inner">
                        <div>
                          <h3 className="nl-title">Stay Updated</h3>
                          <p className="nl-sub">Subscribe to our newsletter for exclusive offers and daily updates.</p>
                        </div>
                        <div className="nl-form">
                          <input type="email" placeholder="Your email address" className="nl-input" />
                          <button className="btn-subscribe">Subscribe <i className="fa-solid fa-envelope"></i></button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="container">
                    <div className="footer-main">
                      <div>
                        <div className="footer-brand-icon"><i className="fa-solid fa-basket-shopping"></i></div>
                        <span className="footer-brand-name-bn">{store.name}</span>
                        <p className="footer-desc">{section.config.description || "ঘরোয়া বাজার আপনাদের জন্য নিয়ে এসেছে খাটি খাদ্যপণ্য।"}</p>
                        <div className="social-links">
                          <a href="#" className="social-link"><i className="fa-brands fa-facebook-f"></i></a>
                          <a href="#" className="social-link"><i className="fa-brands fa-instagram"></i></a>
                          <a href="#" className="social-link"><i className="fa-brands fa-youtube"></i></a>
                        </div>
                      </div>
                      <div>
                        <h4 className="footer-col-title">Quick Links</h4>
                        <ul className="footer-links">
                          <li><Link href={getTenantPath(subdomain, "/all-products")}>All Products</Link></li>
                          <li><Link href="#">Privacy Policy</Link></li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="footer-col-title">Categories</h4>
                        <ul className="footer-links">
                          {categories.filter(c => !c.parentId && !c.categoryId).slice(0, 4).map(c => (
                            <li key={c.id}>
                              <Link href={`${getTenantPath(subdomain, "/all-products")}?category=${c.id}`}>
                                {c.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="footer-col-title">Contact Us</h4>
                        <div className="contact-item"><i className="fa-solid fa-phone"></i> <span>+880 1700-000000</span></div>
                        <div className="contact-item"><i className="fa-solid fa-envelope"></i> <span>support@ihut.shop</span></div>
                        <div className="contact-item"><i className="fa-solid fa-location-dot"></i> <span>Dhaka, Bangladesh</span></div>
                      </div>
                    </div>
                    <div className="footer-bottom">
                      <div>&copy; {new Date().getFullYear()} {store.name}. All Rights Reserved.</div>
                      <div>Made with <i className="fa-solid fa-heart"></i> in Bangladesh <span className="flag">🇧🇩</span></div>
                    </div>
                  </div>
                </footer>
              );

            default:
              return null;
          }
        })}
      </div>

      {/* Floating Cart Trigger */}
      {cart.length > 0 && !isCartOpen && (
        <Button
          className="fixed bottom-4 right-4 md:bottom-8 md:right-8 h-10 w-10 md:h-16 md:w-16 rounded-full shadow-2xl z-50 animate-in zoom-in duration-300 p-0"
          onClick={() => setIsCartOpen(true)}
        >
          <ShoppingCart className="w-4 h-4 md:w-6 md:h-6" />
          <span className="absolute -top-1 -right-1 w-4 h-4 md:w-6 md:h-6 bg-rose-500 text-white text-[8px] md:text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
            {cart.reduce((acc, i) => acc + i.quantity, 0)}
          </span>
        </Button>
      )}

      {/* Cart Drawer */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-none rounded-l-[40px] shadow-2xl">
          <SheetHeader className="p-5 md:p-8 bg-slate-900 text-white shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl md:text-2xl font-headline font-black text-white flex items-center gap-2 uppercase tracking-tight">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Cart
              </SheetTitle>
              <SheetClose className="text-white/60 hover:text-white"><X className="w-6 h-6" /></SheetClose>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1 px-5 md:px-8 py-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-20">
                <ShoppingBag className="w-16 h-16 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-14 h-14 rounded-lg bg-white overflow-hidden border shrink-0">
                      <img src={optimizeCloudinaryUrl(item.image, 100)} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-[10px] truncate pr-4">{item.name}</h4>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-primary font-black text-xs">{getCurrencySymbol(store?.currency)}{item.price.toFixed(2)}</p>
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-0.5 hover:bg-slate-50 rounded"><Minus className="w-3 h-3" /></button>
                          <span className="w-6 text-center text-[10px] font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-0.5 hover:bg-slate-50 rounded"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <SheetFooter className="p-3 md:p-4 bg-white border-t shrink-0">
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center px-1"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">মোট</span><span className="text-lg font-black text-primary">{getCurrencySymbol(store?.currency)}{cartTotal.toFixed(2)}</span></div>
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
