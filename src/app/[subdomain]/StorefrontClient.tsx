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
               </Link>
            </div>
          </section>
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
