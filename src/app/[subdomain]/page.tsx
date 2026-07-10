<<<<<<< HEAD
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSupabaseClient } from "@/supabase";
import { getSubdomain } from "@/lib/subdomain";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { getTenantPath } from "@/lib/utils";
import { BlockRenderer } from "./builder/[pageId]/block-renderer";

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
=======
import { Metadata, ResolvingMetadata } from "next";
import { getStoreBySubdomain, getPageBySlug, getProductsByStore, getCategoriesByStore } from "@/lib/store-server";
import StorefrontClient from "./StorefrontClient";

type Props = {
  params: Promise<{ subdomain: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { subdomain } = await params;
  const store = await getStoreBySubdomain(subdomain);

  if (!store) return { title: "Store Not Found" };

  const title = store.homePageTitle || store.name || subdomain;
  const description = store.description || `Welcome to ${title}. Discover our curated collection of premium products.`;
  const logo = store.logo || store.homeBanner || "";

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: logo ? [logo] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: logo ? [logo] : [],
    },
  };
}

export default async function StorefrontPage({ params }: Props) {
  const { subdomain } = await params;
  const store = await getStoreBySubdomain(subdomain);

  if (!store) return null;

  // Pre-fetch page, products, and categories in parallel on the server
  const [indexPage, products, categories] = await Promise.all([
    getPageBySlug(store.id, "index"),
    getProductsByStore(store.id),
    getCategoriesByStore(store.id)
  ]);

  return (
    <StorefrontClient
      initialStore={store}
      initialSubdomain={subdomain}
      initialPage={indexPage}
      initialProducts={products}
      initialCategories={categories}
    />
  );
}
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
