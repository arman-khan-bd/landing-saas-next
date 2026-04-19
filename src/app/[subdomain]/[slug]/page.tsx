
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
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
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    textAlign?: "left" | "center" | "right" | "justify";
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: "normal" | "italic";
    textDecoration?: "none" | "underline";
    lineHeight?: number;
    borderStyle?: "none" | "solid" | "dashed" | "dotted";
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
    boxShadow?: "none" | "sm" | "md" | "lg" | "xl";
    animation?: "none" | "fadeIn" | "slideUp" | "zoomIn";
    hideDesktop?: boolean;
    hideMobile?: boolean;
    desktopColumns?: number;
    columns?: number;
  };
  children?: Block[];
}

interface PageStyle {
  backgroundColor?: string;
  backgroundImage?: string;
  paddingTop?: number;
  paddingBottom?: number;
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
      if (!subdomain || !slug || !db) return;
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

  const pageStyle: PageStyle = page.pageStyle || {};

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: pageStyle.backgroundColor || "#FFFFFF",
        backgroundImage: pageStyle.backgroundImage ? `url(${pageStyle.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        paddingTop: `${pageStyle.paddingTop || 40}px`,
        paddingBottom: `${pageStyle.paddingBottom || 40}px`,
      }}
    >
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
    ...(block.style?.paddingTop !== undefined && { paddingTop: `${block.style.paddingTop}px` }),
    ...(block.style?.paddingBottom !== undefined && { paddingBottom: `${block.style.paddingBottom}px` }),
    ...(block.style?.paddingLeft !== undefined && { paddingLeft: `${block.style.paddingLeft}px` }),
    ...(block.style?.paddingRight !== undefined && { paddingRight: `${block.style.paddingRight}px` }),
    ...(block.style?.marginTop !== undefined && { marginTop: `${block.style.marginTop}px` }),
    ...(block.style?.marginBottom !== undefined && { marginBottom: `${block.style.marginBottom}px` }),
    ...(block.style?.marginLeft !== undefined && { marginLeft: `${block.style.marginLeft}px` }),
    ...(block.style?.marginRight !== undefined && { marginRight: `${block.style.marginRight}px` }),
    textAlign: block.style?.textAlign,
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

  const gridColsMap: Record<number, string> = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  switch (block.type) {
    case "row":
      const colsCount = block.content?.columns || 1;
      const gridClass = gridColsMap[colsCount] || "md:grid-cols-1";
      return (
        <div style={style} className={cn("grid gap-6 px-6 max-w-6xl mx-auto", "grid-cols-1", gridClass, animClass, responsiveClass)}>
          {block.children?.map(child => (
            <BlockRenderer key={child.id} block={child} products={products} />
          ))}
        </div>
      );

    case "header":
      const Tag = block.content?.level || 'h2';
      const sizes: any = { h1: 'text-5xl md:text-7xl', h2: 'text-4xl md:text-5xl', h3: 'text-2xl md:text-3xl' };
      return (
        <div style={style} className={cn("px-6 max-w-6xl mx-auto", animClass, responsiveClass)}>
          <Tag className={cn(sizes[Tag] || "text-3xl", "font-headline font-bold leading-tight")}>{block.content?.text}</Tag>
        </div>
      );
    
    case "paragraph":
      return (
        <div style={style} className={cn("px-6 max-w-6xl mx-auto text-muted-foreground leading-relaxed whitespace-pre-wrap text-lg", animClass, responsiveClass)}>
          {block.content?.text}
        </div>
      );
    
    case "image":
      return (
        <div style={style} className={cn("px-6 max-w-6xl mx-auto", animClass, responsiveClass)}>
          {block.content?.url && <img src={block.content.url} className="w-full shadow-2xl" style={{ borderRadius: style.borderRadius }} alt="" />}
        </div>
      );

    case "button":
      return (
        <div style={style} className={cn("px-6 max-w-6xl mx-auto", animClass, responsiveClass)}>
          <Button size="lg" className="rounded-2xl px-12 h-16 font-bold text-xl shadow-2xl shadow-primary/30 transition-all hover:scale-105">
            {block.content?.text}
          </Button>
        </div>
      );

    case "checked-list":
      const listStyle = block.content?.listStyle || "check";
      return (
        <div style={style} className={cn("px-6 max-w-6xl mx-auto space-y-4", animClass, responsiveClass)}>
          {(block.content?.items || []).map((item: string, i: number) => {
            let prefix;
            if (listStyle === "check") {
              prefix = <div className="mt-1 bg-primary/10 p-1.5 rounded-full text-primary shadow-sm"><CheckCircle className="w-5 h-5 fill-primary text-white" /></div>;
            } else if (listStyle === "bullet") {
              prefix = <div className="mt-4 w-2 h-2 rounded-full bg-primary shrink-0 ml-3 mr-1" />;
            } else if (listStyle === "number") {
              prefix = <div className="mt-1 bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-primary font-black text-sm shrink-0">{i + 1}</div>;
            } else if (listStyle === "roman") {
              const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][i] || (i + 1);
              prefix = <div className="mt-1 bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-primary font-black text-[10px] shrink-0">{roman}</div>;
            } else if (listStyle === "bengali") {
              const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
              const bengali = (i + 1).toString().split('').map(d => bengaliDigits[parseInt(d)]).join('');
              prefix = <div className="mt-1 bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-primary font-black text-sm shrink-0">{bengali}</div>;
            }

            return (
              <div key={i} className="flex items-start gap-4">
                {prefix}
                <span className="text-xl font-medium pt-0.5">{item}</span>
              </div>
            );
          })}
        </div>
      );

    case "carousel":
      const carouselCols = block.style?.desktopColumns || 3;
      const carouselColMapping: any = {
        1: "basis-full",
        2: "basis-full md:basis-1/2",
        3: "basis-full md:basis-1/3",
        4: "basis-full md:basis-1/4"
      };
      return (
        <div style={style} className={cn("px-6 w-full max-w-6xl mx-auto", animClass, responsiveClass)}>
          <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent>
              {(block.content?.items || []).map((item: any) => (
                <CarouselItem key={item.id} className={cn(carouselColMapping[carouselCols] || "basis-full", "px-2")}>
                  <div className="bg-slate-50 rounded-[32px] overflow-hidden border border-slate-100 h-full flex flex-col shadow-sm">
                    {item.imageUrl && <img src={item.imageUrl} className="w-full aspect-square object-cover" />}
                    {(item.title || item.subtitle || item.buttonText) && (
                      <div className="p-6 space-y-3 flex-1">
                        {item.title && <h4 className="font-bold text-xl">{item.title}</h4>}
                        {item.subtitle && <p className="text-sm text-muted-foreground line-clamp-3">{item.subtitle}</p>}
                        {item.buttonText && <Button variant="secondary" className="w-full h-12 text-xs uppercase font-black rounded-2xl mt-4">{item.buttonText}</Button>}
                      </div>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      );

    case "product-order-form":
      const mainProd = products.find(p => p.id === block.content?.mainProductId);
      return (
        <div style={style} className={cn("px-6 max-w-5xl mx-auto", animClass, responsiveClass)}>
          <Card className="rounded-[40px] shadow-2xl border-none overflow-hidden text-left bg-white">
            <div className="bg-[#161625] text-white p-10 md:p-14 text-center">
              <h3 className="text-4xl md:text-5xl font-headline font-bold mb-4 tracking-tighter">COMPLETE ORDER</h3>
              <p className="text-white/60 font-medium uppercase tracking-[0.3em] text-xs">Secure Checkout Environment</p>
            </div>
            <div className="p-8 md:p-14 space-y-12">
              {mainProd ? (
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
              ) : (
                <div className="p-12 text-center border-2 border-dashed rounded-[32px] opacity-20 font-bold uppercase tracking-widest">Product Configuration Required</div>
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
