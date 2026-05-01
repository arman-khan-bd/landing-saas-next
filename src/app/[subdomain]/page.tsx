
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { getSubdomain } from "@/lib/subdomain";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ShoppingCart, Loader2, Zap, ArrowRight, ShieldCheck, ChevronLeft, ChevronRight, X, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTenantPath, getConsoleUrl } from "@/lib/utils";
import { BlockRenderer } from "./builder/[pageId]/block-renderer";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export default function Storefront() {
  const { subdomain: paramsSubdomain } = useParams();
  const [subdomain, setSubdomain] = useState<string>("");

  useEffect(() => {
    let sub = typeof paramsSubdomain === 'string' ? paramsSubdomain.toLowerCase() : '';
    if (!sub && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ihut.shop";
      const extracted = getSubdomain(hostname, rootDomain);
      if (extracted) sub = extracted.toLowerCase();
    }
    setSubdomain(sub);
  }, [paramsSubdomain]);

  const [store, setStore] = useState<any>(null);
  const [page, setPage] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subdomain) {
      fetchStoreAndPage();
    }
  }, [subdomain]);

  const fetchStoreAndPage = async () => {
    setLoading(true);
    try {
      const storeQuery = query(collection(db, "stores"), where("subdomain", "==", subdomain), limit(1));
      const storeSnap = await getDocs(storeQuery);

      if (storeSnap.empty) {
        setStore(null);
        setLoading(false);
        return;
      }

      const storeData = { id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() };
      setStore(storeData);

      // Fetch dynamic landing sections
      const pageQ = query(collection(db, "pages"), where("storeId", "==", storeData.id), where("slug", "==", "index"), limit(1));
      const pageSnap = await getDocs(pageQ);
      if (!pageSnap.empty) {
        setPage(pageSnap.docs[0].data());
      }

      // Fetch products for order form components
      const prodQuery = query(collection(db, "products"), where("storeId", "==", storeData.id));
      const prodSnap = await getDocs(prodQuery);
      setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-white"><Loader2 className="w-10 h-10 animate-spin text-primary mb-2" /><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Waking Up Business Matrix</p></div>;
  if (!store) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center"><h1 className="text-2xl font-black">Store Registry Not Found</h1><Link href="/"><Button className="mt-6">Return to Hub</Button></Link></div>;

  const config = page?.config || [];
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
        config.map((block: any) => (
          <BlockRenderer 
            key={block.id} 
            block={block} 
            products={products} 
            store={store} 
            isPreview 
            pageStyle={pageStyle} 
          />
        ))
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 text-center px-6">
           <Layers className="w-20 h-20 text-slate-100" />
           <div>
              <h1 className="text-3xl font-headline font-black text-slate-900 uppercase">Storefront Under Orchestration</h1>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">This merchant has not yet published their high-conversion section matrix.</p>
           </div>
           <Link href={getTenantPath(subdomain, "/sections")}><Button className="rounded-xl h-12 px-8 font-bold">Open Manager</Button></Link>
        </div>
      )}
    </div>
  );
}

const Layers = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m2.6 12.14 8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83l-8.58 3.9a2 2 0 0 1-1.66 0l-8.58-3.9a1 1 0 0 0 0 1.83Z"/><path d="m2.6 16.14 8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83l-8.58 3.9a2 2 0 0 1-1.66 0l-8.58-3.9a1 1 0 0 0 0 1.83Z"/></svg>
);
