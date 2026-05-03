
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, limit } from "firebase/firestore";
import * as LucideIcons from "lucide-react";
import { Loader2, AlertCircle, CheckCircle, Truck, CreditCard, ShieldCheck, Smartphone, Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn, getTenantPath, getCurrencySymbol } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// --- Types ---
type BlockType = "header" | "paragraph" | "rich-text" | "image" | "accordion" | "button" | "link" | "carousel" | "checked-list" | "product-order-form" | "row" | "card";

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
    columnIndex?: number;
    columnSpan?: number;
  };
  children?: Block[];
}

interface PageStyle {
  backgroundColor?: string;
  backgroundImage?: string;
  paddingTop?: number;
  paddingBottom?: number;
  themeId?: string;
  primaryColor?: string;
  accentColor?: string;
}

export default function RenderDynamicPage() {
  const { subdomain, slug } = useParams();
  const db = useFirestore();
  const [page, setPage] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
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
        const storeData = { id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() };
        setStore(storeData);

        const pageQ = query(collection(db, "pages"), where("storeId", "==", storeData.id), where("slug", "==", slug));
        const pageSnap = await getDocs(pageQ);
        if (pageSnap.empty) {
          setError("Page not found");
          return;
        }
        setPage(pageSnap.docs[0].data());

        const prodQ = query(collection(db, "products"), where("storeId", "==", storeData.id));
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
          <BlockRenderer key={block.id} block={block} products={products} store={store} subdomain={subdomain as string} pageStyle={pageStyle} />
        ))}
      </div>
    </div>
  );
}

function BlockRenderer({ block, products, store, subdomain, pageStyle }: { block: Block, products: any[], store: any, subdomain: string, pageStyle?: PageStyle }) {
  const isOrganic = pageStyle?.themeId === 'organic';
  const isTraditional = pageStyle?.themeId === 'laam';
  
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
    backgroundImage: block.style?.backgroundImage ? `url(${block.style.backgroundImage})` : undefined,
    backgroundSize: block.style?.backgroundSize || 'cover',
    backgroundPosition: block.style?.backgroundPosition || 'center',
    backgroundRepeat: block.style?.backgroundRepeat || 'no-repeat',
    ...(block.style?.columnSpan !== undefined && { gridColumn: `span ${block.style.columnSpan}` })
  };

  const renderBlockIcon = () => {
    if (!block.style?.iconName || block.style.iconName === 'none') return null;
    const Icon = (LucideIcons as any)[block.style.iconName];
    if (!Icon) return null;
    return (
       <div className={cn("flex w-full mb-4", {
          "justify-start": block.style.iconPosition === "left",
          "justify-center": block.style.iconPosition === "top" || !block.style.iconPosition,
          "justify-end": block.style.iconPosition === "right"
       })}>
          <Icon size={block.style.iconSize || 48} color={block.style.iconColor || "currentColor"} />
       </div>
    );
  };

  const handleButtonClick = () => {
    const link = block.content?.link;
    if (!link) return;

    if (link === "[checkout]") {
      const orderForm = document.querySelector('[data-block-type="product-order-form"]');
      if (orderForm) {
        orderForm.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (link.startsWith("http")) {
      window.open(link, '_blank');
    } else {
      window.location.href = getTenantPath(subdomain, link);
    }
  };

  switch (block.type) {
    case "navbar":
      const LogoIcon = (LucideIcons as any)[block.content?.logoIcon] || Menu;
      const navItems = block.content?.items || [];
      const showCta = block.content?.showCta;
      const navPosition = block.content?.position || "normal"; 
      const isTransparent = block.content?.transparent;
      
      const posStyles: any = {
        normal: { position: 'relative' },
        sticky: { position: 'sticky', top: 0, zIndex: 40 },
        fixed: { 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 40 
        }
      };

      const renderNavItems = (pos: string) => (
        <div className={cn("flex items-center gap-2 sm:gap-6", {
          "justify-start": pos === "left",
          "justify-center": pos === "center",
          "justify-end": pos === "right"
        })}>
          {(block.content?.showLogo !== false) && (block.content?.logoPosition === pos || (!block.content?.logoPosition && pos === 'left')) && (
            <div className="flex items-center gap-2">
              {block.content?.logoType === "image" && block.content?.logoUrl ? (
                <img src={block.content.logoUrl} className="h-6 sm:h-8 w-auto object-contain" alt="logo" />
              ) : block.content?.logoType === "icon" ? (
                <LogoIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: block.content?.primaryColor || 'currentColor' }} />
              ) : (
                <span className="font-headline font-black text-sm sm:text-lg uppercase tracking-tight">{block.content?.logoText || "LOGO"}</span>
              )}
            </div>
          )}
          <div className="hidden sm:flex items-center gap-6">
            {navItems.filter((i: any) => (i.position || 'center') === pos).map((item: any) => (
              <button key={item.id} onClick={() => handleButtonClick()} className="text-sm font-bold opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.label}
              </button>
            ))}
          </div>
          {(block.content?.buttons || []).filter((b: any) => (b.position || 'right') === pos).map((btn: any) => {
             const btnStyle: any = {};
             if (btn.type === 'solid' || btn.type === 'gradient' || btn.type === 'flat') btnStyle.backgroundColor = btn.bgColor || '#145DCC';
             if (btn.type === 'gradient') btnStyle.background = `linear-gradient(135deg, ${btn.bgColor || '#145DCC'}, ${btn.bgColor ? btn.bgColor+'cc' : '#104ea3'})`;
             if (btn.type === 'outline') { btnStyle.backgroundColor = 'transparent'; btnStyle.borderColor = btn.borderColor || '#ffffff'; btnStyle.borderWidth = `${btn.borderSize || 2}px`; btnStyle.borderStyle = 'solid'; }
             if (btn.type === 'texture') { btnStyle.backgroundColor = btn.bgColor || '#145DCC'; btnStyle.backgroundImage = `repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 1px, transparent 0, transparent 50%)`; btnStyle.backgroundSize = '10px 10px'; }
             if (btn.type === 'image' && btn.bgImage) { btnStyle.backgroundImage = `url(${btn.bgImage})`; btnStyle.backgroundSize = 'cover'; btnStyle.backgroundPosition = 'center'; }
             btnStyle.color = btn.textColor || '#ffffff';
             btnStyle.borderRadius = `${btn.borderRadius || 8}px`;
             btnStyle.fontSize = `${btn.fontSize || 14}px`;
             if (btn.borderSize > 0 && btn.type !== 'outline') { btnStyle.borderWidth = `${btn.borderSize}px`; btnStyle.borderStyle = 'solid'; btnStyle.borderColor = btn.borderColor || '#ffffff'; }
             
             return (
               <Button key={btn.id} style={btnStyle} className="font-bold whitespace-nowrap transition-transform hover:scale-105" onClick={() => handleButtonClick()}>
                  {btn.label}
               </Button>
             );
          })}
        </div>
      );

      return (
        <div 
          style={{ 
            backgroundColor: isTransparent ? 'transparent' : (block.content?.backgroundColor || '#ffffff'),
            color: block.content?.textColor || '#1a1a1a',
            borderBottomColor: isTransparent ? 'transparent' : 'rgba(0,0,0,0.05)',
            ...posStyles[navPosition],
          }} 
          className={cn(
            "w-full px-4 sm:px-6 py-3 sm:py-4 border-b transition-all duration-300",
            !isTransparent && "backdrop-blur-md shadow-sm",
            navPosition === "fixed" && "left-0 right-0"
          )}
        >
          <div className="max-w-7xl mx-auto grid grid-cols-3 items-center gap-2 sm:gap-4">
            {renderNavItems("left")}
            {renderNavItems("center")}
            {renderNavItems("right")}
          </div>
        </div>
      );

    case "row":
      const colsCount = block.content?.columns || 1;
      const gridColsMap: Record<number, string> = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };
      return (
        <div style={style} className={cn("grid gap-6 px-6 max-w-6xl mx-auto grid-cols-1 sm:grid-cols-2", gridColsMap[colsCount] || "lg:grid-cols-1")}>
          {Array.from({ length: colsCount }).map((_, colIdx) => (
             <div key={colIdx} className="flex flex-col gap-4">
                {block.children?.filter(c => (c.style?.columnIndex ?? 0) === colIdx).map(child => (
                   <BlockRenderer key={child.id} block={child} products={products} store={store} subdomain={subdomain} pageStyle={pageStyle} />
                ))}
             </div>
          ))}
        </div>
      );

    case "accordion":
      return (
        <div style={style} className="px-6 max-w-6xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {(block.content?.items || []).map((item: any) => (
              <AccordionItem key={item.id} value={item.id} className="border-b-0 mb-2">
                <AccordionTrigger className={cn("px-6 py-4 rounded-xl hover:bg-slate-100 hover:no-underline font-bold text-sm", (isOrganic || isTraditional) ? "bg-[#fff] border-2 border-[#d9e8da] text-primary" : "bg-slate-50")}>
                  {item.title}
                </AccordionTrigger>
                <AccordionContent className={cn("px-6 py-4 text-sm text-slate-600 bg-white rounded-b-xl border -mt-1", (isOrganic || isTraditional) ? "border-[#d9e8da]" : "border-slate-50")}>
                  {item.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      );

    case "card":
      const IconComp = block.content?.showIcon && block.content?.iconName ? (LucideIcons as any)[block.content.iconName] : null;
      const cardTextAlign = block.style?.textAlign || "left";
      return (
        <div 
          style={{
            ...style,
            borderWidth: block.content?.cardBorderSize ? `${block.content.cardBorderSize}px` : undefined,
            borderRadius: block.content?.cardBorderRadius ? `${block.content.cardBorderRadius}px` : undefined,
            borderColor: block.content?.cardBorderColor,
            borderStyle: block.content?.cardBorderStyle || 'solid',
            backgroundColor: block.content?.cardBgColor,
          }} 
          className={cn(
            "px-6 w-full max-w-6xl mx-auto relative overflow-hidden",
            (isOrganic || isTraditional) && !block.content?.cardBorderSize && !block.style?.borderWidth && "border-l-4 border-primary bg-white rounded-r-xl shadow-sm"
          )}
        >
          {renderBlockIcon()}
          {block.content?.bgImage && <img src={block.content.bgImage} className="absolute inset-0 w-full h-full object-cover z-0 opacity-40" alt="" />}
          <div className={cn("relative z-10 space-y-4 flex flex-col", {
            "items-start text-left": cardTextAlign === "left",
            "items-center text-center": cardTextAlign === "center",
            "items-end text-right": cardTextAlign === "right"
          })}>
             {IconComp && <IconComp style={{ color: block.content?.iconColor || (isOrganic || isTraditional ? "#1a7c3e" : "#145DCC") }} size={block.content?.iconSize || 32} className="shrink-0 mb-2" />}
             <div className="space-y-1 w-full">
                <h4 className={cn("font-bold text-xl", (isOrganic || isTraditional) && "text-primary")}>{block.content?.title}</h4>
                <p className="text-sm opacity-80 leading-relaxed">{block.content?.subtitle}</p>
             </div>
             {(block.content?.items || []).length > 0 && (
               <div className={cn("space-y-2 pt-2 w-full flex flex-col", {"items-start": cardTextAlign === "left", "items-center": cardTextAlign === "center"})}>
                 {block.content.items.map((item: string, i: number) => (
                   <div key={i} className="flex items-center gap-2">
                     <Check className={cn("w-3.5 h-3.5", (isOrganic || isTraditional) ? "text-primary" : "text-primary")} />
                     <span className="text-sm font-medium">{item}</span>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      );

    case "header":
      const Tag = block.content?.level || 'h2';
      const sizes: any = { h1: 'text-4xl md:text-7xl', h2: 'text-3xl md:text-5xl', h3: 'text-xl md:text-3xl' };
      const themeActive = isOrganic || isTraditional;
      return (
        <div style={style} className={cn("px-6 max-w-6xl mx-auto font-headline font-bold leading-tight", themeActive && "text-center py-12 text-white relative overflow-hidden")}>
          {themeActive && (
             <div className={cn(
               "absolute inset-0 -z-10",
               isOrganic ? "bg-gradient-to-br from-[#1b5e20] via-[#2d7a3a] to-[#388e3c]" : "bg-gradient-to-br from-[#1a7c3e] via-[#0f5a2b] to-[#0a3d1d]"
             )} />
          )}
          {renderBlockIcon()}
          <Tag className={sizes[Tag] || "text-3xl"}>{block.content?.text}</Tag>
        </div>
      );
    
    case "paragraph":
      return (
        <div style={style} className="px-6 max-w-6xl mx-auto text-muted-foreground leading-relaxed whitespace-pre-wrap text-lg">
          {renderBlockIcon()}
          {block.content?.text}
        </div>
      );

    case "rich-text":
      return (
        <div style={style} className="px-6 max-w-6xl mx-auto">
          <div 
            className="prose prose-lg prose-slate max-w-none" 
            dangerouslySetInnerHTML={{ __html: block.content?.html || "" }} 
          />
        </div>
      );
    
    case "image":
      return (
        <div style={style} className="px-6 max-w-6xl mx-auto">
          {block.content?.url && <img src={block.content.url} className="w-full shadow-2xl rounded-xl" alt="" />}
        </div>
      );

    case "button":
        const btnStyleConfig = block.content || {};
        const bs: any = { ...style };
        if (btnStyleConfig.type === 'solid' || btnStyleConfig.type === 'gradient' || btnStyleConfig.type === 'flat') bs.backgroundColor = btnStyleConfig.bgColor || '#145DCC';
        if (btnStyleConfig.type === 'gradient') bs.background = `linear-gradient(135deg, ${btnStyleConfig.bgColor || '#145DCC'}, ${btnStyleConfig.bgColor ? btnStyleConfig.bgColor+'cc' : '#104ea3'})`;
        if (btnStyleConfig.type === 'outline') { bs.backgroundColor = 'transparent'; bs.borderColor = btnStyleConfig.borderColor || '#ffffff'; bs.borderWidth = `${btnStyleConfig.borderSize || 2}px`; bs.borderStyle = 'solid'; }
        if (btnStyleConfig.type === 'texture') { bs.backgroundColor = btnStyleConfig.bgColor || '#145DCC'; bs.backgroundImage = `repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 1px, transparent 0, transparent 50%)`; bs.backgroundSize = '10px 10px'; }
        if (btnStyleConfig.type === 'image' && btnStyleConfig.bgImage) { bs.backgroundImage = `url(${btnStyleConfig.bgImage})`; bs.backgroundSize = 'cover'; bs.backgroundPosition = 'center'; }
        bs.color = btnStyleConfig.textColor || '#ffffff';
        bs.borderRadius = `${btnStyleConfig.borderRadius || 8}px`;
        
        if (btnStyleConfig.borderSize > 0 && btnStyleConfig.type !== 'outline') { bs.borderWidth = `${btnStyleConfig.borderSize}px`; bs.borderStyle = 'solid'; bs.borderColor = btnStyleConfig.borderColor || '#ffffff'; }

      return (
        <div style={style} className="px-6 max-w-6xl mx-auto flex justify-center flex-col items-center">
          {renderBlockIcon()}
          <Button 
            size="lg" 
            style={bs}
            className="rounded-2xl px-12 h-16 font-bold text-xl shadow-2xl transition-all hover:scale-105"
            onClick={handleButtonClick}
          >
            {block.content?.text || "Action Button"}
          </Button>
        </div>
      );

    case "carousel":
      const carouselColMapping: any = { 1: "basis-full", 2: "basis-full md:basis-1/2", 3: "basis-full md:basis-1/3", 4: "basis-full md:basis-1/4" };
      return (
        <div style={style} className="px-6 w-full max-w-6xl mx-auto">
          <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent>
              {(block.content?.items || []).map((item: any) => (
                <CarouselItem key={item.id} className={cn(carouselColMapping[block.style?.desktopColumns || 3] || "basis-full", "px-2")}>
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
            <CarouselPrevious className="left-2 bg-white/80 hover:bg-white border-none shadow-lg text-primary h-12 w-12" />
            <CarouselNext className="right-2 bg-white/80 hover:bg-white border-none shadow-lg text-primary h-12 w-12" />
          </Carousel>
        </div>
      );

    case "product-order-form":
      const productIds = block.content?.productIds || (block.content?.mainProductId ? [block.content.mainProductId] : []);
      const selectedProducts = products.filter(p => productIds.includes(p.id));
      return (
        <div style={style} className="px-6 max-w-5xl mx-auto" data-block-type="product-order-form">
          <LandingPageOrderForm products={selectedProducts} store={store} isOrganic={isOrganic} isTraditional={isTraditional} />
        </div>
      );

    case "checked-list":
      return (
        <div style={style} className="px-6 max-w-6xl mx-auto space-y-4">
          {(block.content?.items || []).map((item: string, i: number) => (
            <div key={i} className="flex items-start gap-4">
              <div className="mt-1 bg-primary/10 p-1.5 rounded-full text-primary shadow-sm"><LucideIcons.CheckCircle className="w-5 h-5 fill-primary text-white" /></div>
              <span className="text-xl font-medium pt-0.5">{item}</span>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

function LandingPageOrderForm({ products, store, isOrganic, isTraditional }: { products: any[], store: any, isOrganic: boolean, isTraditional: boolean }) {
  const { toast } = useToast();
  const db = useFirestore();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [clientIp, setClientIp] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");
  const [selectedShipping, setSelectedShipping] = useState<any>(null);

  const product = products.find(p => p.id === selectedProductId) || products[0];

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    paymentMethod: "cod",
    selectedManualMethodId: "",
    transactionId: ""
  });

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => setClientIp(data.ip))
      .catch(err => console.error("IP Capture Error:", err));

    if (store?.shippingSettings?.enabled && store.shippingSettings.methods?.length > 0) {
      setSelectedShipping(store.shippingSettings.methods[0]);
    }
  }, [store]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !formData.fullName || !formData.phone || !formData.address) {
      toast({ variant: "destructive", title: "তথ্য অসম্পূর্ণ" });
      return;
    }

    if (formData.paymentMethod === 'manual' && !formData.transactionId) {
      toast({ variant: "destructive", title: "পেমেন্ট তথ্য প্রয়োজন", description: "ট্রানজাকশন আইডি প্রদান করুন।" });
      return;
    }

    setIsPlacingOrder(true);
    try {
      const blockValues = [clientIp, formData.phone].filter(Boolean);
      if (blockValues.length > 0) {
        const fraudQ = query(
          collection(db, "fraud_blocks"),
          where("storeId", "==", store.id),
          where("value", "in", blockValues),
          limit(1)
        );
        const fraudSnap = await getDocs(fraudQ);
        if (!fraudSnap.empty) {
          toast({ variant: "destructive", title: "অর্ডার গ্রহণ করা সম্ভব হচ্ছে না" });
          setIsPlacingOrder(false);
          return;
        }
      }

      const shippingCost = selectedShipping?.cost || 0;
      const subtotal = Number(product.currentPrice);
      const total = subtotal + shippingCost;

      const orderData = {
        storeId: store.id,
        ownerId: store.ownerId,
        items: [{
          id: product.id,
          name: product.name,
          price: Number(product.currentPrice),
          image: product.featuredImage,
          quantity: 1
        }],
        customer: { ...formData, ip: clientIp },
        shipping: selectedShipping ? {
          name: selectedShipping.name,
          cost: shippingCost
        } : { name: "Direct Order", cost: 0 },
        subtotal: subtotal,
        shippingCost: shippingCost,
        total: total,
        paymentMethod: formData.paymentMethod,
        transactionId: formData.paymentMethod === 'manual' ? formData.transactionId : null,
        selectedManualMethodId: formData.paymentMethod === 'manual' ? formData.selectedManualMethodId : null,
        status: "pending",
        paymentStatus: formData.paymentMethod === 'cod' ? "unpaid" : "pending_verification",
        isRead: false,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "orders"), orderData);
      setOrderSuccess(true);
      toast({ title: "অর্ডার সফল হয়েছে!" });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Order Failed" });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const selectedManualMethod = store?.paymentSettings?.manualMethods?.find((m: any) => m.id === formData.selectedManualMethodId);

  if (orderSuccess) {
    return (
      <Card className="rounded-[40px] shadow-2xl p-12 text-center bg-white animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h3 className="text-3xl font-headline font-black text-slate-900 uppercase">THANK YOU!</h3>
        <p className="text-slate-500 mt-2">আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে।</p>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "rounded-[40px] shadow-2xl border-none overflow-hidden text-left bg-white",
      (isOrganic || isTraditional) && "border-2 border-[#d9e8da] bg-[#fdf8f0]"
    )}>
      <div className={cn(
        "text-white p-10 md:p-14 text-center",
        isOrganic ? "bg-[#1b5e20]" : isTraditional ? "bg-gradient-to-br from-[#1a7c3e] via-[#0f5a2b] to-[#0a3d1d]" : "bg-[#161625]"
      )}>
        <h3 className="text-4xl md:text-5xl font-headline font-black mb-4 tracking-tighter uppercase">অর্ডার কনফার্ম করুন</h3>
        <p className="text-white/60 font-medium uppercase tracking-[0.3em] text-xs">নিরাপদ এবং দ্রুত ডেলিভারি</p>
      </div>

      <div className="p-8 md:p-14 space-y-12">
        {products.length > 1 && (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedProductId(p.id)} 
                  className={cn("flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer", selectedProductId === p.id ? "border-primary bg-primary/5" : "bg-white border-slate-100")}
                >
                  <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", selectedProductId === p.id ? 'border-primary' : 'border-slate-300')}>
                    {selectedProductId === p.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <img src={p.featuredImage} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="font-bold text-xs truncate">{p.name}</p>
                    <p className={cn("font-black text-sm", (isOrganic || isTraditional) ? "text-[#c0392b]" : "text-primary")}>{getCurrencySymbol(store?.currency)} {p.currentPrice}</p>
                  </div>
                </div>
              ))}
           </div>
        )}
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t">
          <div className="space-y-8">
            <div className="space-y-4">
               <Label className={cn("text-[10px] font-black uppercase tracking-widest", (isOrganic || isTraditional) ? "text-primary" : "text-slate-400")}>আপনার তথ্য</Label>
               <Input placeholder="আপনার পুরো নাম" className="rounded-2xl h-14 bg-white border-2 border-slate-100 px-6 text-lg" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
               <Input placeholder="মোবাইল নাম্বার" className="rounded-2xl h-14 bg-white border-2 border-slate-100 px-6 text-lg" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
               <Textarea placeholder="পুরো ঠিকানা (জেলা সহ)" className="rounded-3xl min-h-[120px] bg-white border-2 border-slate-100 p-6 text-lg" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>

            {store?.shippingSettings?.enabled && (
              <div className="space-y-4">
                 <Label className={cn("text-[10px] font-black uppercase tracking-widest", (isOrganic || isTraditional) ? "text-primary" : "text-slate-400")}>ডেলিভারি এরিয়া</Label>
                 <div className="grid grid-cols-1 gap-3">
                   {store.shippingSettings.methods.map((method: any) => (
                     <div 
                       key={method.id} 
                       className={cn("flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer", selectedShipping?.id === method.id ? 'border-primary bg-primary/5' : 'bg-slate-50')} 
                       onClick={() => setSelectedShipping(method)}
                     >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", selectedShipping?.id === method.id ? 'border-primary' : 'border-slate-300')}>
                            {selectedShipping?.id === method.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          <span className="font-bold text-sm">{method.name}</span>
                        </div>
                        <span className="font-black text-sm">{method.cost > 0 ? `${getCurrencySymbol(store?.currency)} ${method.cost}` : 'ফ্রি'}</span>
                     </div>
                   ))}
                 </div>
              </div>
            )}

            <div className="space-y-4">
               <Label className={cn("text-[10px] font-black uppercase tracking-widest", (isOrganic || isTraditional) ? "text-primary" : "text-slate-400")}>পেমেন্ট মেথড</Label>
               <div className="grid grid-cols-1 gap-3">
                  {store?.paymentSettings?.cod && (
                    <div 
                      className={cn("flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all", formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'bg-slate-50')} 
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cod', selectedManualMethodId: "", transactionId: "" }))}
                    >
                       <div className="flex items-center gap-3">
                          <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.paymentMethod === 'cod' ? 'border-primary' : 'border-slate-300')}>
                            {formData.paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          <span className="font-bold">ক্যাশ অন ডেলিভারি</span>
                       </div>
                       <Truck className="w-5 h-5 text-slate-300" />
                    </div>
                  )}

                  {store?.paymentSettings?.manualEnabled && store.paymentSettings.manualMethods?.length > 0 && (
                    <div 
                      className={cn("flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all", formData.paymentMethod === 'manual' ? 'border-primary bg-primary/5' : 'bg-slate-50')} 
                      onClick={() => setFormData(prev => ({...prev, paymentMethod: 'manual'}))}
                    >
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.paymentMethod === 'manual' ? 'border-primary' : 'border-slate-300')}>
                              {formData.paymentMethod === 'manual' && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <span className="font-bold">বিকাশ/নগদ/রকেট</span>
                          </div>
                          <Smartphone className="w-5 h-5 text-slate-300" />
                       </div>

                       {formData.paymentMethod === 'manual' && (
                         <div className="mt-4 pt-4 border-t border-primary/10 space-y-4 animate-in slide-in-from-top-2">
                            <div className="grid grid-cols-2 gap-2">
                               {store.paymentSettings.manualMethods.map((m: any) => (
                                 <Button key={m.id} type="button" variant="outline" className={cn("h-10 rounded-xl text-[10px] font-black uppercase", formData.selectedManualMethodId === m.id ? 'bg-primary text-white border-none' : '')} onClick={(e) => { e.stopPropagation(); setFormData(prev => ({...prev, selectedManualMethodId: m.id})); }}>{m.name}</Button>
                               ))}
                            </div>
                            {selectedManualMethod && (
                               <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                                  <div className="p-4 bg-white rounded-2xl border-2 border-primary/10">
                                     <p className="text-[10px] font-black text-primary uppercase">নাম্বার: {selectedManualMethod.number}</p>
                                     <p className="text-[10px] text-slate-500 mt-1 italic whitespace-pre-wrap">{selectedManualMethod.instructions}</p>
                                  </div>
                                  <Input placeholder="ট্রানজাকশন আইডি লিখুন" className="h-12 rounded-xl bg-white border-primary/20" value={formData.transactionId} onChange={(e) => setFormData(prev => ({...prev, transactionId: e.target.value.toUpperCase()}))} />
                               </div>
                            )}
                         </div>
                       )}
                    </div>
                  )}
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={cn("p-10 rounded-[40px] border space-y-5", (isOrganic || isTraditional) ? "bg-white border-[#d9e8da]" : "bg-slate-50")}>
              <div className="flex justify-between text-muted-foreground font-bold text-xs uppercase tracking-widest">
                <span>পণ্য মূল্য</span>
                <span>{getCurrencySymbol(store?.currency)} {product?.currentPrice || 0}</span>
              </div>
              <div className="flex justify-between text-muted-foreground font-bold text-xs uppercase tracking-widest">
                <span>ডেলিভারি চার্জ</span>
                <span className={cn("font-black", (selectedShipping?.cost || 0) > 0 ? "text-slate-900" : "text-emerald-500")}>
                   { (selectedShipping?.cost || 0) > 0 ? `${getCurrencySymbol(store?.currency)} ${selectedShipping.cost}` : 'ফ্রি' }
                </span>
              </div>
              <div className={cn("flex justify-between text-4xl font-black border-t pt-8 mt-4", (isOrganic || isTraditional) ? "text-primary" : "text-primary")}>
                <span className="text-xs pt-4 uppercase">মোট</span>
                <span>{getCurrencySymbol(store?.currency)} {(Number(product?.currentPrice || 0) + (selectedShipping?.cost || 0)).toFixed(0)}</span>
              </div>
            </div>
            <Button type="submit" disabled={isPlacingOrder || !product} className={cn("w-full h-20 rounded-[32px] text-2xl font-black uppercase tracking-widest shadow-2xl transition-transform hover:scale-[1.02]", (isOrganic || isTraditional) ? "bg-gradient-to-br from-[#1a7c3e] via-[#0f5a2b] to-[#0a3d1d] hover:opacity-90 shadow-primary/20" : "bg-primary")}>
              {isPlacingOrder ? <Loader2 className="animate-spin" /> : "অর্ডার সম্পন্ন করুন"}
            </Button>
            <div className="flex items-center justify-center gap-2 text-slate-400 mt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">নিরাপদ পেমেন্ট ব্যবস্থা</span>
            </div>
          </div>
        </form>
      </div>
    </Card>
  );
}
