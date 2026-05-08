
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore } from "@/firebase/provider";
import { getSubdomain } from "@/lib/subdomain";
import { collection, query, where, getDocs, limit, orderBy, onSnapshot, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Search, ShoppingBag, ShoppingCart, Loader2, ArrowRight, ChevronLeft, ChevronRight, X, Minus, Plus, Trash2, LayoutGrid, Package, Image as ImageIcon } from "lucide-react";
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
import { PageSkeleton } from "@/components/PageSkeleton";
import { useUser } from "@/firebase/provider";
import { ShieldAlert, LogIn } from "lucide-react";

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
  const { user } = useUser();
  const isOwner = user?.uid && store?.ownerId === user?.uid;
  const isSuspendedStatus = store?.status === "suspended";
  const shouldBlockContent = isSuspendedStatus && !isOwner;

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
      // Real-time store listener for immediate status updates (suspension)
      const q = query(collection(firestore, "stores"), where("subdomain", "==", subdomain), limit(1));
      const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const storeData = { id: snap.docs[0].id, ...snap.docs[0].data() };
          setStore(storeData);
          if (!page) fetchStoreAndPage(); // Fallback for initial load
        }
      });

      if (store?.id) {
        fetchProducts(store.id);
      }

      return () => unsub();
    }
  }, [subdomain, firestore, store?.id, !!page]);

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
      // Fetch pages with fuzzy/fallback matching
      const [allPagesSnap, prodSnap, catSnap, subCatSnap] = await Promise.all([
        getDocs(query(collection(firestore, "pages"), where("storeId", "==", storeData.id))),
        getDocs(query(collection(firestore, "products"), where("storeId", "==", storeData.id), orderBy("createdAt", "desc"))).catch(() =>
          getDocs(query(collection(firestore, "products"), where("storeId", "==", storeData.id)))
        ),
        getDocs(query(collection(firestore, "categories"), where("storeId", "==", storeData.id))),
        getDocs(query(collection(firestore, "sub-categories"), where("storeId", "==", storeData.id))).catch(() => ({ docs: [] }))
      ]);

      let matchedPage = null;
      if (!allPagesSnap.empty) {
        const pages = allPagesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        matchedPage = pages.find(p => p.slug === "index") || pages.find(p => p.slug?.toLowerCase() === "index");
        
        if (!matchedPage && pages.length > 0) {
          matchedPage = pages.sort((a: any, b: any) => {
            const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
            const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
            return timeB - timeA;
          })[0];
        }
      }
      
      if (matchedPage) {
        setPage(matchedPage);
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

  if (loading) return <PageSkeleton />;
  if (!store) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center"><h1 className="text-2xl font-black">Store Registry Not Found</h1><Link href="/"><Button className="mt-6">Return to Hub</Button></Link></div>;

  const config = Array.isArray(page?.config) ? page.config : [];
  const pageStyle = page?.pageStyle || { backgroundColor: "#FFFFFF", paddingTop: 0, paddingBottom: 40 };

  if (shouldBlockContent) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center p-6 space-y-10 animate-in fade-in duration-700">
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-rose-50 rounded-[40px] flex items-center justify-center text-rose-500 shadow-2xl border border-rose-100 animate-bounce">
          <ShieldAlert className="w-12 h-12 sm:w-16 sm:h-16" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-7xl font-headline font-black text-slate-950 uppercase tracking-tighter leading-none">Website Suspended</h1>
          <p className="text-slate-500 max-w-md mx-auto font-medium text-sm sm:text-lg">This storefront is currently unavailable. Please contact the site administrator for more information.</p>
        </div>
        {!user && (
          <Link href="/auth">
            <Button className="rounded-2xl h-14 sm:h-16 px-8 sm:px-12 bg-slate-900 text-white font-black uppercase tracking-widest text-xs sm:text-sm shadow-xl hover:scale-105 transition-all">
              <LogIn className="mr-2 w-4 h-4 sm:w-5 h-5" /> Owner Login
            </Button>
          </Link>
        )}
      </div>
    );
  }

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
      <div className="animate-in fade-in duration-700">
        {/* Custom Nav for Suspended State - Visible to everyone if suspended */}
        {isSuspendedStatus && (
           <div className="bg-rose-600 text-white py-2.5 px-4 text-center text-[10px] sm:text-[11px] font-black uppercase tracking-widest sticky top-0 z-[100] shadow-xl">
             This website has been suspended by the platform administrator
           </div>
        )}
          {/* Hero Main Content - Full Width */}
          <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
            <div className="w-full min-h-[350px] sm:min-h-[450px] md:min-h-[550px] rounded-[32px] sm:rounded-[48px] relative overflow-hidden bg-slate-900 group shadow-2xl">
              {store.homeBanner ? (
                <>
                  <img
                    src={store.homeBanner}
                    alt={store.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                </>
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/30 via-slate-950 to-slate-950" />
              )}

              <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8 sm:p-12 md:p-20 space-y-6 sm:space-y-10">
                <div className="space-y-4 sm:space-y-6 max-w-4xl">
                  <Badge className="bg-primary text-white border-none rounded-full px-4 sm:px-6 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] animate-in fade-in zoom-in duration-1000">
                    Welcome to {store.name}
                  </Badge>
                  <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-headline font-black text-white uppercase tracking-tighter leading-[0.9] sm:leading-[0.85] animate-in slide-in-from-bottom-8 duration-1000 delay-100">
                    {store.homePageTitle || "Premium Collection"}
                  </h1>
                  <p className="text-slate-300 text-sm sm:text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed animate-in slide-in-from-bottom-10 duration-1000 delay-200 px-4 opacity-80">
                    {store.description || "Experience the perfect blend of quality, innovation, and style in every product we create."}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom-12 duration-1000 delay-300 w-full max-w-md mx-auto">
                  <Link href={getTenantPath(subdomain, "/all-products")} className="w-full">
                    <Button size="lg" className="w-full h-14 sm:h-16 px-8 sm:px-12 rounded-2xl sm:rounded-3xl font-black uppercase text-sm sm:text-base tracking-widest shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-primary text-white hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 border-b-4 border-primary-dark">
                      Shop Collection <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Horizontal */}
          <div className="max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-20">
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {categories.filter(c => !c.parentId && !c.categoryId).slice(0, 6).map((cat: any) => (
                   <Link 
                      key={cat.id} 
                      href={`${getTenantPath(subdomain, "/all-products")}?category=${cat.id}`}
                      className="group flex flex-col items-center gap-4 p-6 rounded-[32px] bg-white border border-slate-100 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500"
                   >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-500">
                         {cat.image ? (
                            <img src={cat.image} className="w-full h-full object-cover" alt="" />
                         ) : (
                            <Package className="w-8 h-8 text-slate-300 group-hover:text-primary transition-colors" />
                         )}
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-600 group-hover:text-primary transition-colors text-center">{cat.name}</span>
                   </Link>
                ))}
             </div>
          </div>

          {/* Featured Products Section */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-32">
            <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-8 mb-12 md:mb-20">
              <div className="space-y-4">
                <Badge variant="outline" className="border-primary/30 text-primary rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest">
                   Our Store
                </Badge>
                <h2 className="text-4xl md:text-6xl font-headline font-black uppercase tracking-tighter leading-none">Fresh Arrivals</h2>
                <p className="text-slate-400 font-medium text-sm sm:text-base max-w-lg">Explore our latest additions, carefully selected to provide you with the best quality and value.</p>
              </div>
              <Link href={getTenantPath(subdomain, "/all-products")}>
                <Button size="lg" className="h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest bg-white text-slate-900 border border-slate-200 hover:bg-slate-900 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200/50">
                  Browse All Products <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {products.length === 0 ? (
                [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="space-y-6 bg-white p-4 md:p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <Skeleton className="aspect-square w-full rounded-[32px]" />
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-8 w-1/2" />
                    </div>
                    <div className="space-y-2 pt-4">
                      <Skeleton className="h-12 w-full rounded-2xl" />
                      <Skeleton className="h-12 w-full rounded-2xl" />
                    </div>
                  </div>
                ))
              ) : (
                (store.productDisplayType === "manual" && store.selectedProducts?.length > 0
                  ? products.filter(p => store.selectedProducts.includes(p.id))
                  : products.slice(0, 12)
                ).map((p) => (
                  <Card key={p.id} className="group bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full">
                    <Link href={getTenantPath(subdomain, `/product/${p.slug}`)} className="block aspect-square relative overflow-hidden bg-slate-50">
                      {p.featuredImage ? (
                        <img src={p.featuredImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={p.name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                           <ImageIcon className="w-16 h-16 opacity-10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      {p.prevPrice && (
                         <div className="absolute top-6 left-6 bg-rose-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl">
                            Special Sale
                         </div>
                      )}
                    </Link>
                    <div className="p-6 md:p-8 space-y-4 md:space-y-6 flex-1 flex flex-col">
                      <div className="space-y-1 md:space-y-2">
                        <h4 className="font-bold text-sm md:text-lg text-slate-800 line-clamp-2 min-h-[40px] md:min-h-[56px] group-hover:text-primary transition-colors leading-tight">{p.name}</h4>
                        <div className="flex items-baseline gap-2">
                           <p className="text-xl md:text-3xl font-black text-slate-900">{getCurrencySymbol(store?.currency)}{Number(p.currentPrice).toFixed(0)}</p>
                           {p.prevPrice && <p className="text-sm md:text-base text-slate-400 line-through font-medium">{getCurrencySymbol(store?.currency)}{Number(p.prevPrice).toFixed(0)}</p>}
                        </div>
                      </div>
  
                      <div className="pt-2 space-y-2 mt-auto">
                        <Button
                          className="w-full h-12 md:h-14 rounded-2xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest bg-slate-900 hover:bg-primary text-white transition-all shadow-lg hover:shadow-primary/30"
                          onClick={() => addToCart(p)}
                        >
                          <ShoppingCart className="mr-2 w-4 h-4 md:w-5 md:h-5" /> কার্টে যোগ করুন
                        </Button>
                        <Link href={getTenantPath(subdomain, `/product/${p.slug}`)} className="block">
                          <Button variant="outline" className="w-full h-10 md:h-12 rounded-xl md:rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest border-slate-200 hover:bg-slate-50 transition-all text-slate-500 hover:text-slate-900">
                            More Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
            
            <div className="mt-16 md:mt-24 text-center">
               <Link href={getTenantPath(subdomain, "/all-products")}>
                  <Button variant="link" className="group text-slate-400 hover:text-primary font-black uppercase tracking-[0.3em] text-[10px] transition-all">
                     View Complete Collection <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </Button>
               </Link>
            </div>
          </section>
              </>
            )}

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
