
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useFirestore } from "@/firebase/provider";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { Loader2, AlertCircle } from "lucide-react";
import { BlockRenderer } from "../../builder/[pageId]/block-renderer";
import Script from "next/script";

import { LazySection } from "../../builder/[pageId]/lazy-section";

export default function RenderDynamicPage({ initialPage, initialStore, subdomain, slug }: any) {
  const db = useFirestore();
  const [page, setPage] = useState<any>(initialPage);
  const [store, setStore] = useState<any>(initialStore);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // Already have initial data
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!db || !subdomain || !slug) return;
      
      // Only show loading if we don't have initial data
      if (!page || !store) setLoading(true);
      
      try {
        let currentStore = store;
        
        // Fetch store if missing
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

        // Fetch Page
        let matchedPage = null;
        try {
          const allPagesQ = query(collection(db, "pages"), where("storeId", "==", currentStore.id));
          const allPagesSnap = await getDocs(allPagesQ);
          
          if (!allPagesSnap.empty) {
            const pages = allPagesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            // Try exact match first
            matchedPage = pages.find(p => p.slug === slug);
            
            // Try case-insensitive match
            if (!matchedPage) {
              matchedPage = pages.find(p => p.slug?.toLowerCase() === slug.toLowerCase());
            }
            
            // Try stripping hyphens
            if (!matchedPage) {
              matchedPage = pages.find(p => p.slug?.replace(/-/g, "") === slug.replace(/-/g, ""));
            }
            
            // Fallback to most recently updated page if absolutely necessary
            if (!matchedPage && pages.length > 0) {
               matchedPage = pages.sort((a: any, b: any) => {
                 const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
                 const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
                 return timeB - timeA;
               })[0];
            }
          }
        } catch (e) {
          console.error("Error fetching pages:", e);
        }

        if (matchedPage) {
          setPage(matchedPage);
        } else if (!page) {
           setError("Page not found");
        }

        // Fetch Products
        const prodQ = query(collection(db, "products"), where("storeId", "==", currentStore.id));
        const prodSnap = await getDocs(prodQ);
        setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err: any) {
        console.error("Error fetching data on client:", err);
        if (!page) setError(err.message || "Error loading page");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [db, store?.id, subdomain, slug]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
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
