"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSupabaseClient } from "@/supabase";
import { Loader2, AlertCircle } from "lucide-react";
import { BlockRenderer } from "../../builder/[pageId]/block-renderer";

export default function RenderDynamicPage() {
  const { subdomain, slug } = useParams();
  const supabase = useSupabaseClient();
  const [page, setPage] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!subdomain || !slug) return;
      setLoading(true);
      setError(null);
      try {
        const { data: storeData } = await supabase
          .from("stores")
          .select("*")
          .eq("subdomain", subdomain)
          .single();
        if (!storeData) {
          setError("Store not found");
          return;
        }
        setStore(storeData);

        const { data: pageData } = await supabase
          .from("sections")
          .select("*")
          .eq("store_id", storeData.id)
          .eq("slug", slug)
          .single();

        if (!pageData) {
          setError("Page not found");
          return;
        }
        setPage(pageData);

        const { data: prods } = await supabase
          .from("products")
          .select("*")
          .eq("store_id", storeData.id);
        setProducts(prods ?? []);
      } catch (err) {
        console.error(err);
        setError("An error occurred while loading the page.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [subdomain, slug]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (error || !page) return <div className="flex flex-col h-screen items-center justify-center space-y-4 px-6 text-center bg-white"><AlertCircle className="w-16 h-16 text-destructive opacity-20" /><h1 className="text-3xl font-headline font-bold">{error || "404 - Not Found"}</h1><p className="text-muted-foreground leading-relaxed">The page you're looking for was not found or is currently private.</p></div>;

  const config = page.blocks || [];
  const pageStyle = page.page_style || { backgroundColor: "#FFFFFF", paddingTop: 0, paddingBottom: 40 };

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
    </div>
  );
}
