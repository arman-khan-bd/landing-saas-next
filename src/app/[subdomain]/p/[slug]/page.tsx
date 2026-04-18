"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { 
  Loader2, AlertCircle, CheckCircle, ShoppingCart, 
  Layout as LayoutIcon, Type, List, Image as ImageIcon, 
  ChevronDown, Monitor, Smartphone, Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// --- Types ---
type BlockType = "header" | "paragraph" | "image" | "accordion" | "button" | "link" | "carousel" | "checked-list" | "product-order-form" | "row";

interface Block {
  id: string;
  type: BlockType;
  content: any;
  style: {
    padding?: string;
    margin?: string;
    textAlign?: "left" | "center" | "right" | "justify";
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: "normal" | "italic";
    textDecoration?: "none" | "underline";
    lineHeight?: number;
    // Advanced
    borderStyle?: "none" | "solid" | "dashed" | "dotted";
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
    boxShadow?: "none" | "sm" | "md" | "lg" | "xl";
    animation?: "none" | "fadeIn" | "slideUp" | "zoomIn";
    hideDesktop?: boolean;
    hideMobile?: boolean;
    // Specifics
    desktopColumns?: number;
    columns?: number;
  };
  children?: Block[];
}

export default function RenderDynamicPage() {
  const { subdomain, slug } = useParams();
  const db = useFirestore();
  const [page, setPage] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!subdomain || !slug) return;
      setLoading(true);
      setError(null);
      try {
        const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain));
        const storeSnap = await getDocs(storeQ);
        if (storeSnap.empty) {
          setError("Store not found");
          return;
        }
        const storeId = storeSnap.docs[0].id;

        const pageQ = query(collection(db, "pages"), where("storeId", "==", storeId), where("slug", "==", slug));
        const pageSnap = await getDocs(pageQ);
        if (pageSnap.empty) {
          setError("Page not found");
          return;
        }
        setPage(pageSnap.docs[0].data());

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

    fetchData();
  }, [subdomain, slug, db]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  
  if (error || !page) return (
    <div className="flex flex-col h-screen items-center justify-center space-y-4 px-6 text-center bg-white">
      <AlertCircle className="w-16 h-16 text-destructive opacity-20" />
      <h1 className="text-3xl font-headline font-bold">{error || "404 - Not Found"}</h1>
      <p className="text-muted-foreground leading-relaxed">The page you're looking for was not found or is currently private.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="py-0">
        {page.config?.map((block: Block) => (
          <BlockRenderer key={block.id} block={block} products={products} />
        ))}
      </div>
    </div>
  );
}

function BlockRenderer({ block, products }: { block: Block, products: any[] }) {
  const hideOnDesktop = block.style?.hideDesktop;
  const hideOnMobile = block.style?.hideMobile;

  const style: any = {
    padding: block.style?.padding || "0px",
    margin: block.style?.margin || "0px",
    textAlign: block.style?.textAlign as any,
    backgroundColor: block.style?.backgroundColor,
    color: block.style?.textColor,
    fontSize: block.style?.fontSize ? `${block.style.fontSize}px` : undefined,
    fontWeight: block.style?.fontWeight,
    fontStyle: block.style?.fontStyle,
    textDecoration: block.style?.textDecoration,
    lineHeight: block.style?.lineHeight,
    borderStyle: block.style?.borderStyle,
    borderWidth: block.style?.borderWidth ? `${block.style.borderWidth}px` : undefined,
    borderColor: block.style?.borderColor,
    borderRadius: block.style?.borderRadius ? `${block.style.borderRadius}px` : undefined,
  };

  if (block.style?.boxShadow && block.style?.boxShadow !== "none") {
    const shadows = {
      sm: "0 2px 4px rgba(0,0,0,0.05)",
      md: "0 10px 15px -3px rgba(0,0,0,0.1)",
      lg: "0 20px 25px -5px rgba(0,0,0,0.1)",
      xl: "0 25px 50px -12px rgba(0,0,0,0.25)"
    };
    style.boxShadow = shadows[block.style.boxShadow as keyof typeof shadows];
  }

  const animClass = block.style?.animation === "fadeIn" ? "animate-in fade-in fill-mode-both duration-700" :
                   block.style?.animation === "slideUp" ? "animate-in slide-in-from-bottom-10 fill-mode-both duration-700" :
                   block.style?.animation === "zoomIn" ? "animate-in zoom-in-95 fill-mode-both duration-700" : "";

  const responsiveClass = cn(
    hideOnDesktop ? "md:hidden" : "",
    hideOnMobile ? "hidden md:block" : ""
  );

  switch (block.type) {
    case "row":
      return (
        <div style={style} className={cn("grid gap-6 grid-cols-1 px-6 max-w-6xl mx-auto", `md:grid-cols-${block.content?.columns || 1}`, animClass, responsiveClass)}>
          {block.children?.map(child => (
            <BlockRenderer key={child.id} block={child} products={products} />
          ))}
        </div>
      );

    case "header":
      const Tag = block.content?.level || 'h2';
      const sizes: any = { h1: 'text-5xl md:text-7xl', h2: 'text-4xl md:text-5xl', h3: 'text-2xl md:text-3xl' };
      return (
        <div style={style} className={cn("px-6 py-4 max-w-6xl mx-auto", animClass, responsiveClass)}>
          <Tag className={cn(sizes[Tag] || "text-3xl", "font-headline font-bold leading-tight")}>{block.content?.text}</Tag>
        </div>
      );
    
    case "paragraph":
      return (
        <div style={style} className={cn("px-6 py-2 max-w-6xl mx-auto text-muted-foreground leading-relaxed whitespace-pre-wrap text-lg", animClass, responsiveClass)}>
          {block.content?.text}
        </div>
      );
    
    case "image":
      return (
        <div style={style} className={cn("px-6 py-8 max-w-6xl mx-auto", animClass, responsiveClass)}>
          {block.content?.url && <img src={block.content.url} className="w-full shadow-2xl" style={{ borderRadius: style.borderRadius }} alt="" />}
        </div>
      );

    case "button":
      return (
        <div style={style} className={cn("px-6 py-6 max-w-6xl mx-auto", animClass, responsiveClass)}>
          <Button size="lg" className="rounded-2xl px-12 h-16 font-bold text-xl shadow-2xl shadow-primary/30 transition-all hover:scale-105">
            {block.content?.text}
          </Button>
        </div>
      );

    case "checked-list":
      return (
        <div style={style} className={cn("px-6 py-4 max-w-6xl mx-auto space-y-4", animClass, responsiveClass)}>
          {(block.content?.items || []).map((item: string, i: number) => (
            <div key={i} className="flex items-start gap-4">
              <div className="mt-1 bg-primary/10 p-1.5 rounded-full text-primary shadow-sm"><CheckCircle className="w-5 h-5 fill-primary text-white" /></div>
              <span className="text-xl font-medium pt-0.5">{item}</span>
            </div>
          ))}
        </div>
      );

    case "product-order-form":
      const mainProd = products.find(p => p.id === block.content?.mainProductId);
      return (
        <div style={style} className={cn("px-6 py-12 max-w-5xl mx-auto", animClass, responsiveClass)}>
          <Card className="rounded-[40px] shadow-2xl border-none overflow-hidden text-left bg-white">
            <div className="bg-[#161625] text-white p-10 md:p-14 text-center">
              <h3 className="text-4xl md:text-5xl font-headline font-bold mb-4 tracking-tighter">COMPLETE ORDER</h3>
              <p className="text-white/60 font-medium uppercase tracking-[0.3em] text-xs">Secure Checkout Environment</p>
            </div>
            <div className="p-8 md:p-14 space-y-12">
              {mainProd && (
                <div className="flex flex-col md:flex-row justify-between items-center p-8 bg-slate-50 rounded-[32px] border border-slate-100 gap-8">
                  <div className="flex items-center gap-8">
                    <img src={mainProd.featuredImage} className="w-24 h-24 rounded-2xl object-cover shadow-lg" />
                    <div>
                      <h4 className="text-2xl font-bold tracking-tight">{mainProd.name}</h4>
                      <p className="text-primary font-black text-3xl mt-1">${mainProd.currentPrice}</p>
                    </div>
                  </div>
                  <CheckCircle className="text-primary w-12 h-12" />
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t">
                <div className="space-y-6">
                  <h4 className="font-bold text-xl text-slate-400 uppercase tracking-widest">Logistic Records</h4>
                  <div className="space-y-4">
                    <Input placeholder="Full Legal Name" className="rounded-2xl h-14 bg-slate-50 border-none px-6 text-lg" />
                    <Input placeholder="Contact Phone" className="rounded-2xl h-14 bg-slate-50 border-none px-6 text-lg" />
                    <Textarea placeholder="Full Delivery Address" className="rounded-3xl min-h-[120px] bg-slate-50 border-none p-6 text-lg" />
                  </div>
                </div>
                <div className="space-y-6">
                  <h4 className="font-bold text-xl text-slate-400 uppercase tracking-widest">Order Summary</h4>
                  <div className="bg-slate-50 p-10 rounded-[40px] border space-y-5">
                    <div className="flex justify-between text-4xl font-black text-primary border-t pt-8 mt-4">
                      <span>TOTAL</span>
                      <span>${mainProd?.currentPrice || 0}</span>
                    </div>
                  </div>
                  <Button className="w-full h-20 rounded-[32px] text-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/40 transition-transform hover:scale-[1.02]">Place Order Now</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );

    default:
      return null;
  }
}
