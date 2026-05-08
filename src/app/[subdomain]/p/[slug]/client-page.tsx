
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useFirestore } from "@/firebase/provider";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { Loader2, AlertCircle } from "lucide-react";
import { BlockRenderer } from "../../builder/[pageId]/block-renderer";
import Script from "next/script";
import { PageSkeleton } from "@/components/PageSkeleton";

import { LazySection } from "../../builder/[pageId]/lazy-section";

export default function RenderDynamicPage({ initialPage, initialStore, subdomain, slug }: any) {
  const db = useFirestore();
  const [page, setPage] = useState<any>(initialPage);
  const [store, setStore] = useState<any>(initialStore);
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!db || !subdomain || !slug) return;
      
      // Only show full page loading if we don't even have the store/page shell
      if (!page || !store) setLoading(true);
      
      try {
        let currentStore = store;
        
        // 1. Fetch store if missing
        if (!currentStore) {
          const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain), limit(1));
          const storeSnap = await getDocs(storeQ);
          if (!storeSnap.empty) {
            currentStore = { id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() };
            setStore(currentStore);
          } else {
            setError("Store not found");
            setLoading(false);
            return;
          }
        }

        if (!currentStore?.id) {
          setLoading(false);
          return;
        }

        // 2. Fetch Page and Products in parallel if we have store ID
        const [allPagesSnap, prodSnap] = await Promise.all([
          getDocs(query(collection(db, "pages"), where("storeId", "==", currentStore.id))),
          getDocs(query(collection(db, "products"), where("storeId", "==", currentStore.id)))
        ]);

        // Process Pages
        if (!allPagesSnap.empty) {
          const pages = allPagesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          let matchedPage = pages.find(p => p.slug === slug);
          if (!matchedPage) matchedPage = pages.find(p => p.slug?.toLowerCase() === slug.toLowerCase());
          if (!matchedPage) matchedPage = pages.find(p => p.slug?.replace(/-/g, "") === slug.replace(/-/g, ""));
          
          if (!matchedPage && pages.length > 0) {
            matchedPage = pages.sort((a: any, b: any) => {
              const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
              const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
              return timeB - timeA;
            })[0];
          }

          if (matchedPage) setPage(matchedPage);
          else if (!page) setError("Page not found");
        }

        // Process Products
        setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setProductsLoading(false);

      } catch (err: any) {
        console.error("Error fetching data on client:", err);
        if (!page) setError(err.message || "Error loading page");
      } finally {
        setLoading(false);
        setProductsLoading(false);
      }
    };
    
    fetchData();
  }, [db, subdomain, slug]);

  if (loading) return <PageSkeleton />;
  if (error || !page) return <div className="flex flex-col h-screen items-center justify-center space-y-4 px-6 text-center bg-white"><AlertCircle className="w-16 h-16 text-destructive opacity-20" /><h1 className="text-3xl font-headline font-bold">{error || "404 - Not Found"}</h1><p className="text-muted-foreground leading-relaxed">The page you're looking for was not found or is currently private.</p></div>;

  const config = Array.isArray(page?.config) ? page.config : [];
  const pageStyle = page.pageStyle || { backgroundColor: "#FFFFFF", paddingTop: 0, paddingBottom: 40 };

  const getBackgroundStyles = () => {
    const styles: any = {
      backgroundColor: pageStyle.backgroundColor || "#FFFFFF",
      paddingTop: `${pageStyle.paddingTop || 0}px`,
      paddingBottom: `${pageStyle.paddingBottom || 40}px`,
      position: 'relative'
    };

    if (pageStyle.backgroundImage) {
      styles.backgroundImage = `url(${pageStyle.backgroundImage})`;
      styles.backgroundSize = pageStyle.backgroundSize || 'cover';
      styles.backgroundPosition = 'center';
    }

    return styles;
  };

  const getTextureOverlay = () => {
    if (pageStyle.backgroundTexture === "none" || !pageStyle.backgroundTexture) return null;
    
    let pattern = "";
    if (pageStyle.backgroundTexture === "dots") {
      pattern = "radial-gradient(circle, currentColor 1px, transparent 1px)";
    } else if (pageStyle.backgroundTexture === "grid") {
      pattern = "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)";
    } else if (pageStyle.backgroundTexture === "diagonal") {
      pattern = "repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)";
    }

    return (
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          backgroundImage: pattern, 
          backgroundSize: pageStyle.backgroundTexture === "grid" ? "20px 20px" : "15px 15px",
          opacity: (pageStyle.backgroundOpacity || 10) / 100,
          color: pageStyle.textColor || '#000'
        }} 
      />
    );
  };


  return (
    <div className="min-h-screen" style={getBackgroundStyles()}>
      {getTextureOverlay()}
      <div className="relative z-10">
        {config.map((block: any, idx: number) => (
          <BlockRenderer 
            key={block.id} 
            block={block} 
            products={products} 
            store={store} 
            pageStyle={pageStyle} 
            isPreview={false}
          />
        ))}
      </div>
    </div>
  );
}
