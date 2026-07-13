"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSupabaseClient } from "@/supabase";
import { getSubdomain } from "@/lib/subdomain";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { getTenantPath } from "@/lib/utils";
import { BlockRenderer } from "./builder/[pageId]/block-renderer";
import StorefrontClientPage from "./StorefrontClient";

export default function Storefront() {
  const { subdomain: paramsSubdomain } = useParams();
  const supabase = useSupabaseClient();
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

  const fetchStoreAndPage = async () => {
    setLoading(true);
    try {
      // Determine if this is a custom domain (e.g., dokanbd.shop) or a subdomain (e.g., mystore)
      const isCustomDomain = subdomain.includes(".");
      
      let storeQuery = supabase.from("stores").select("*");
      if (isCustomDomain) {
        // Custom domain: try custom_domain field first, then fall back to subdomain match
        const { data: byCustomDomain } = await supabase
          .from("stores")
          .select("*")
          .eq("custom_domain", subdomain)
          .maybeSingle();
        
        if (byCustomDomain) {
          storeQuery = supabase.from("stores").select("*").eq("custom_domain", subdomain);
        } else {
          // Fallback: try the first part before the dot as subdomain
          const subPart = subdomain.split(".")[0];
          storeQuery = supabase.from("stores").select("*").eq("subdomain", subPart);
        }
      } else {
        storeQuery = supabase.from("stores").select("*").eq("subdomain", subdomain);
      }

      const { data: storeData } = await storeQuery.single();

      if (!storeData) {
        setStore(null);
        setLoading(false);
        return;
      }
      setStore(storeData);

      // Fetch dynamic landing sections (pages)
      const { data: pageData } = await supabase
        .from("sections")
        .select("*")
        .eq("store_id", storeData.id)
        .eq("slug", "index")
        .maybeSingle();
      if (pageData) {
        setPage(pageData);
      }

      // Fetch products for order form components
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeData.id);
      setProducts(prods ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subdomain) {
      fetchStoreAndPage();
    }
  }, [subdomain]);

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-white"><Loader2 className="w-10 h-10 animate-spin text-primary mb-2" /><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Waking Up Business Matrix</p></div>;
  if (!store) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center"><h1 className="text-2xl font-black">Store Registry Not Found</h1><Link href="/"><Button className="mt-6">Return to Hub</Button></Link></div>;

  const config = page?.blocks || [];
  const pageStyle = page?.page_style || { backgroundColor: "#FFFFFF", paddingTop: 0, paddingBottom: 40 };

  if (config.length > 0) {
    return (
      <div 
        className="min-h-screen" 
        style={{ 
          backgroundColor: pageStyle.backgroundColor, 
          paddingTop: pageStyle.paddingTop ? (pageStyle.paddingTop + "px") : "0px", 
          paddingBottom: pageStyle.paddingBottom ? (pageStyle.paddingBottom + "px") : "0px",
          color: pageStyle.textColor 
        }}
      >
        {config.map((block: any) => (
          <BlockRenderer 
            key={block.id} 
            block={block} 
            products={products} 
            store={store} 
            isPreview 
            pageStyle={pageStyle} 
          />
        ))}
      </div>
    );
  }

  // Fallback to default Storefront client layout if no dynamic section matrix has been published yet
  return (
    <StorefrontClientPage 
      initialStore={store} 
      initialSubdomain={subdomain} 
      initialPage={page} 
      initialProducts={products} 
    />
  );
}

const Layers = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m2.6 12.14 8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83l-8.58 3.9a2 2 0 0 1-1.66 0l-8.58-3.9a1 1 0 0 0 0 1.83Z"/><path d="m2.6 16.14 8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83l-8.58 3.9a2 2 0 0 1-1.66 0l-8.58-3.9a1 1 0 0 0 0 1.83Z"/></svg>
);
