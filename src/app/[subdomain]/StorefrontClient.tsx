
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore } from "@/firebase/provider";
import { getSubdomain } from "@/lib/subdomain";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Search, ShoppingBag, ShoppingCart, Loader2, Zap, ArrowRight, ShieldCheck, ChevronLeft, ChevronRight, X, Minus, Plus, Trash2, LayoutGrid } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTenantPath, getConsoleUrl, getCurrencySymbol } from "@/lib/utils";
import { BlockRenderer } from "./builder/[pageId]/block-renderer";
import { LazySection } from "./builder/[pageId]/lazy-section";
import { Skeleton } from "@/components/ui/skeleton";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export default function Storefront({
  initialStore,
  initialSubdomain,
  initialPage
}: {
  initialStore?: any,
  initialSubdomain?: string,
  initialPage?: any
}) {
  const { subdomain: paramsSubdomain } = useParams();
  const firestore = useFirestore();
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
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
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
      } else if (store?.id) {
        fetchProducts(store.id);
      }
    }
  }, [subdomain, !!store, !!page, store?.id, firestore]);

  const fetchProducts = async (storeId: string) => {
    if (!firestore) return;
    setCatsLoading(true);
    try {
      let prodSnap;
      try {
        const prodQuery = query(collection(firestore, "products"), where("storeId", "==", storeId), orderBy("createdAt", "desc"));
        prodSnap = await getDocs(prodQuery);
      } catch (error) {
        const prodQuery = query(collection(firestore, "products"), where("storeId", "==", storeId));
        prodSnap = await getDocs(prodQuery);
      }
      setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch categories and sub-categories in parallel
      const [catSnap, subCatSnap] = await Promise.all([
        getDocs(query(collection(firestore, "categories"), where("storeId", "==", storeId))),
        getDocs(query(collection(firestore, "sub-categories"), where("storeId", "==", storeId))).catch(() => ({ docs: [] }))
      ]);

      const mainCats = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const subCats = subCatSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), isSub: true }));

      setCategories([...mainCats, ...subCats]);
      console.log("Categories loaded in fetchProducts:", mainCats.length, "Sub-categories:", subCats.length);
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
    if (!firestore) return;
    setLoading(true);
    setCatsLoading(true);
    try {
      const storeQuery = query(collection(firestore, "stores"), where("subdomain", "==", subdomain), limit(1));
      const storeSnap = await getDocs(storeQuery);

      if (storeSnap.empty) {
        setStore(null);
        setLoading(false);
        return;
      }

      const storeData = { id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() };
      setStore(storeData);

      // Parallel fetch for page, products, categories, and sub-categories
      const [pageSnap, prodSnap, catSnap, subCatSnap] = await Promise.all([
        getDocs(query(collection(firestore, "pages"), where("storeId", "==", storeData.id), where("slug", "==", "index"), limit(1))),
        getDocs(query(collection(firestore, "products"), where("storeId", "==", storeData.id), orderBy("createdAt", "desc"))).catch(() =>
          getDocs(query(collection(firestore, "products"), where("storeId", "==", storeData.id)))
        ),
        getDocs(query(collection(firestore, "categories"), where("storeId", "==", storeData.id))),
        getDocs(query(collection(firestore, "sub-categories"), where("storeId", "==", storeData.id))).catch(() => ({ docs: [] }))
      ]);

      if (!pageSnap.empty) {
        setPage(pageSnap.docs[0].data());
      } else {
        // Fallback: If no "index" page, try to get the most recent page
        const fallbackPageSnap = await getDocs(query(
          collection(firestore, "pages"), 
          where("storeId", "==", storeData.id), 
          orderBy("createdAt", "desc"), 
          limit(1)
        ));
        if (!fallbackPageSnap.empty) {
          setPage(fallbackPageSnap.docs[0].data());
        }
      }
      setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const mainCats = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const subCats = subCatSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), isSub: true }));

      setCategories([...mainCats, ...subCats]);
      console.log("Storefront Init Categories:", mainCats.length, "Sub-categories:", subCats.length);

    } catch (e) {
      console.error("Storefront Init Error:", e);
    } finally {
      setLoading(false);
      setCatsLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-white"><Loader2 className="w-10 h-10 animate-spin text-primary mb-2" /><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Waking Up Business Matrix</p></div>;
  if (!store) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center"><h1 className="text-2xl font-black">Store Registry Not Found</h1><Link href="/"><Button className="mt-6">Return to Hub</Button></Link></div>;

  const config = Array.isArray(page?.config) ? page.config : [];
  const pageStyle = page?.pageStyle || { backgroundColor: "#FFFFFF", paddingTop: 0, paddingBottom: 40 };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: pageStyle.backgroundColor,
        paddingTop: `${pageStyle.paddingTop}px`,
        paddingBottom: `${pageStyle.paddingBottom}px`,
        color: pageStyle.textColor
      }}
    >
      {config.length > 0 ? (
        config.map((block: any, idx: number) => (
          <BlockRenderer
            key={block.id}
            block={block}
            products={products}
            store={store}
            pageStyle={pageStyle}
            isPreview={false}
          />
        ))
      ) : (
        <div className="animate-in fade-in duration-700">
          {/* Promo Banner */}

          {/* Hero Section */}
          <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 md:py-6 lg:py-8">
            <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:items-stretch">
              {/* Categories Sidebar */}
              <aside className="hidden lg:block w-72 shrink-0">
                <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden h-full min-h-[500px]">
                  <div className="bg-slate-900 p-4 text-white flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">পণ্য ক্যাটাগরি</span>
                  </div>
                  <ScrollArea className="h-[calc(100%-56px)]">
                    <Accordion type="single" collapsible className="w-full">
                      {catsLoading ? (
                        <div className="p-4 space-y-4">
                          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i} className="flex items-center gap-3 py-2">
                              <Skeleton className="w-8 h-8 rounded-xl bg-slate-100" />
                              <Skeleton className="h-4 w-32 bg-slate-100 rounded-lg" />
                            </div>
                          ))}
                        </div>
                      ) : categories.length > 0 ? (
                        categories.filter(c => (!c.parentId || c.parentId === "") && !c.isSub).map((cat, idx) => (
                          <AccordionItem key={cat.id} value={`item-${idx}`} className="border-none px-4">
                            <AccordionTrigger className="hover:no-underline py-3 group text-left">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                  <Zap className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900">{cat.name}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="pl-11 space-y-2 pb-2">
                                {categories.filter(sc => sc.parentId === cat.id || sc.categoryId === cat.id).length > 0 ? (
                                  categories.filter(sc => sc.parentId === cat.id || sc.categoryId === cat.id).map(sub => (
                                    <Link
                                      key={sub.id}
                                      href={`${getTenantPath(subdomain, "/all-products")}?category=${sub.id}`}
                                      className="block text-[10px] text-slate-400 hover:text-primary font-bold transition-colors"
                                    >
                                      {sub.name}
                                    </Link>
                                  ))
                                ) : (
                                  <Link
                                    href={`${getTenantPath(subdomain, "/all-products")}?category=${cat.id}`}
                                    className="block text-[10px] text-slate-400 hover:text-primary font-bold transition-colors"
                                  >
                                    সব দেখুন
                                  </Link>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))
                      ) : (
                        <div className="p-12 text-center space-y-4">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto opacity-20">
                            <LayoutGrid className="w-8 h-8" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">কোন ক্যাটাগরি পাওয়া যায়নি</p>
                        </div>
                      )}
                    </Accordion>
                  </ScrollArea>
                </Card>
              </aside>

              {/* Hero Main Content */}
              <div className="flex-1 min-h-[280px] sm:min-h-[350px] md:min-h-[450px] lg:min-h-[500px] rounded-[24px] sm:rounded-[32px] md:rounded-[40px] relative overflow-hidden bg-slate-900 group">
                {store.homeBanner ? (
                  <>
                    <img
                      src={store.homeBanner}
                      alt={store.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-slate-950 to-slate-950" />
                )}

                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-6 sm:p-8 md:p-12 lg:p-16 space-y-4 sm:space-y-6 md:space-y-8">
                  <div className="space-y-4">
                    <Badge className="bg-primary/20 text-primary border-primary/20 rounded-full px-3 sm:px-4 py-0.5 sm:py-1 text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-bottom-4 duration-700">
                      {store.name}
                    </Badge>
                    <h1 className="text-2xl min-[340px]:text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-headline font-black text-white uppercase tracking-tighter leading-[0.95] sm:leading-[0.9] animate-in slide-in-from-bottom-6 duration-700 delay-100 max-w-2xl">
                      {store.homePageTitle || store.name}
                    </h1>
                    <p className="text-slate-300 text-[10px] sm:text-xs md:text-base lg:text-lg max-w-xl mx-auto font-medium leading-relaxed animate-in slide-in-from-bottom-8 duration-700 delay-200 px-2">
                      {store.description || "Discover our curated collection of premium products designed for quality and style."}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-300 w-full px-4">
                    <Link href={getTenantPath(subdomain, "/all-products")} className="w-full sm:w-auto">
                      <Button size="lg" className="w-xs sm:w-sm h-10 sm:h-11 md:h-12 px-6 md:px-8 rounded-xl sm:rounded-xl font-black uppercase text-xs md:text-sm tracking-widest shadow-2xl shadow-primary/20 transition-transform hover:scale-105 active:scale-95">
                        {store.heroButtonText || "এখনই কিনুন"} <ShoppingBag className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Curated Products */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-24 space-y-8 md:space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-headline font-black uppercase tracking-tighter">Featured Items</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Handpicked for you</p>
              </div>
              <Link href={getTenantPath(subdomain, "/all-products")}>
                <Button variant="ghost" className="font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 hover:text-primary">
                  View All Products <ArrowRight className="ml-2 w-3 h-3" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {(store.productDisplayType === "manual" && store.selectedProducts?.length > 0
                ? products.filter(p => store.selectedProducts.includes(p.id))
                : products.slice(0, 8)
              ).map((p) => (
                <Card key={p.id} className="group bg-white rounded-[32px] overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col">
                  <Link href={getTenantPath(subdomain, `/product/${p.slug}`)} className="block aspect-square relative overflow-hidden bg-slate-50 border-b border-slate-100">
                    {p.featuredImage && <img src={p.featuredImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={p.name} />}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    {p.prevPrice && <div className="absolute top-4 left-4 bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Sale</div>}
                  </Link>
                  <div className="p-3 md:p-6 space-y-2 md:space-y-4 flex-1 flex flex-col">
                    <div className="space-y-0.5 md:space-y-1">
                      <h4 className="font-bold text-[11px] md:text-sm text-slate-800 line-clamp-2 min-h-[32px] md:min-h-[40px] group-hover:text-primary transition-colors">{p.name}</h4>
                      <p className="text-base md:text-2xl font-black text-slate-900">{getCurrencySymbol(store?.currency)}{Number(p.currentPrice).toFixed(2)}</p>
                    </div>

                    <div className="pt-1 space-y-1.5 mt-auto">
                      <Button
                        className="w-full h-auto py-3 md:h-12 rounded-lg md:rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest bg-slate-900 hover:bg-primary transition-all"
                        onClick={() => addToCart(p)}
                      >
                        <ShoppingCart className="mr-1.5 w-3.5 h-3.5 md:w-4 md:h-4" /> কার্টে যোগ করুন
                      </Button>
                      <Link href={getTenantPath(subdomain, `/product/${p.slug}`)} className="block">
                        <Button variant="outline" className="w-full h-9 md:h-12 rounded-lg md:rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest border-slate-200 hover:bg-slate-50 transition-all">
                          Buy Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Features / Trust Badges */}
          <section className="bg-slate-50 py-10 md:py-20 px-4 md:px-6 border-y border-slate-100">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-slate-100 shrink-0"><ShieldCheck className="w-6 h-6" /></div>
                <div className="space-y-1">
                  <h4 className="font-black uppercase text-xs tracking-widest">Secure Commerce</h4>
                  <p className="text-sm text-slate-500 font-medium">Your transactions are encrypted and processed securely.</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-slate-100 shrink-0"><Zap className="w-6 h-6" /></div>
                <div className="space-y-1">
                  <h4 className="font-black uppercase text-xs tracking-widest">Fast Delivery</h4>
                  <p className="text-sm text-slate-500 font-medium">We prioritize swift dispatch to get your items to you faster.</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-slate-100 shrink-0"><ShoppingCart className="w-6 h-6" /></div>
                <div className="space-y-1">
                  <h4 className="font-black uppercase text-xs tracking-widest">Premium Support</h4>
                  <p className="text-sm text-slate-500 font-medium">Dedicated support team ready to assist with any questions.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

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
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
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

const Layers = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" /><path d="m2.6 12.14 8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83l-8.58 3.9a2 2 0 0 1-1.66 0l-8.58-3.9a1 1 0 0 0 0 1.83Z" /><path d="m2.6 16.14 8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83l-8.58 3.9a2 2 0 0 1-1.66 0l-8.58-3.9a1 1 0 0 0 0 1.83Z" /></svg>
);
