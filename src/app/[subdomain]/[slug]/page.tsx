
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

// --- Types ---
type BlockType = "header" | "paragraph" | "image" | "accordion" | "button" | "link" | "carousel" | "checked-list" | "product-order-form" | "row";

interface Block {
  id: string;
  type: BlockType;
  content: any;
  style: any;
  children?: Block[];
}

export default function RenderDynamicPage() {
  const { subdomain, slug } = useParams();
  const [page, setPage] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Get Store
        const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain));
        const storeSnap = await getDocs(storeQ);
        if (storeSnap.empty) {
          setError("Store not found");
          return;
        }
        const storeId = storeSnap.docs[0].id;

        // 2. Get Page by Slug
        const pageQ = query(collection(db, "pages"), where("storeId", "==", storeId), where("slug", "==", slug));
        const pageSnap = await getDocs(pageQ);
        if (pageSnap.empty) {
          setError("Page not found");
          return;
        }
        setPage(pageSnap.docs[0].data());

        // 3. Get Products for standard components
        const prodQ = query(collection(db, "products"), where("storeId", "==", storeId));
        const prodSnap = await getDocs(prodQ);
        setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (err) {
        console.error(err);
        setError("An error occurred while loading the page.");
      } finally {
        setLoading(false);
      }
    };

    if (subdomain && slug) {
      fetchData();
    }
  }, [subdomain, slug]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  
  if (error || !page) return (
    <div className="flex flex-col h-screen items-center justify-center space-y-4 px-6 text-center">
      <AlertCircle className="w-16 h-16 text-destructive opacity-20" />
      <h1 className="text-3xl font-headline font-bold">{error || "404 Not Found"}</h1>
      <p className="text-muted-foreground">The page you are looking for doesn't exist or has been moved.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {page.config?.map((block: Block) => (
        <BlockRenderer key={block.id} block={block} products={products} />
      ))}
    </div>
  );
}

// --- Simplified Component Renderer for public pages ---
function BlockRenderer({ block, products }: { block: Block, products: any[] }) {
  const style = {
    padding: block.style?.padding || "0px",
    margin: block.style?.margin || "0px",
    textAlign: block.style?.textAlign as any,
    backgroundColor: block.style?.backgroundColor,
    color: block.style?.textColor,
  };

  switch (block.type) {
    case "row":
      return (
        <div style={style} className={cn("grid gap-6 grid-cols-1 px-6 max-w-6xl mx-auto", `md:grid-cols-${block.content?.columns || 1}`)}>
          {block.children?.map(child => (
            <BlockRenderer key={child.id} block={child} products={products} />
          ))}
        </div>
      );

    case "header":
      const Tag = block.content?.level || 'h2';
      const sizes = { h1: 'text-4xl md:text-6xl', h2: 'text-3xl md:text-5xl', h3: 'text-2xl md:text-3xl' };
      return (
        <div style={style} className="px-6 py-4 max-w-6xl mx-auto">
          <Tag className={cn(sizes[Tag as keyof typeof sizes], "font-headline font-bold")}>{block.content?.text}</Tag>
        </div>
      );
    
    case "paragraph":
      return (
        <div style={style} className="px-6 py-2 max-w-6xl mx-auto text-muted-foreground leading-relaxed whitespace-pre-wrap text-lg">
          {block.content?.text}
        </div>
      );
    
    case "image":
      return (
        <div style={style} className="px-6 py-4 max-w-6xl mx-auto">
          {block.content?.url && <img src={block.content.url} className="w-full rounded-[32px] shadow-2xl" />}
        </div>
      );

    case "button":
      return (
        <div style={style} className="px-6 py-4 max-w-6xl mx-auto">
          <Button size="lg" className="rounded-2xl px-10 h-14 font-bold text-lg shadow-xl shadow-primary/20">
            {block.content?.text}
          </Button>
        </div>
      );

    // Add other cases as needed...
    default:
      return null;
  }
}
