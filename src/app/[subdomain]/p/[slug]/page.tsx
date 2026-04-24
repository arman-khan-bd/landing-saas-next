
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
import { cn, getTenantPath } from "@/lib/utils";
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
  if (error || !page) return <div className="flex flex-col h-screen items-center justify-center space-y-4 px-6 text-center bg-white"><AlertCircle className="w-16 h-16 text-destructive opacity-20" /><h1 className="text-3xl font-headline font-bold">{error || "404 - Not Found"}</h1><p className="text-muted-foreground leading-relaxed">The page you're looking for was not found or is currently private.</p></div>;

  const pageStyle: PageStyle = page.pageStyle || {};

  return (
    <div className="min-h-screen" style={{ backgroundColor: pageStyle.backgroundColor || "#FFFFFF", backgroundImage: pageStyle.backgroundImage ? `url(${pageStyle.backgroundImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', paddingTop: `${pageStyle.paddingTop || 40}px`, paddingBottom: `${pageStyle.paddingBottom || 40}px` }}>
      <div className="py-0">{page.config?.map((block: Block) => <BlockRenderer key={block.id} block={block} products={products} store={store} subdomain={subdomain as string} />)}</div>
    </div>
  );
}

function BlockRenderer({ block, products, store, subdomain }: { block: Block, products: any[], store: any, subdomain: string }) {
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
    const shadows = { sm: "0 2px 4px rgba(0,0,0,0.05)", md: "0 10px 15px -3px rgba(0,0,0,0.1)", lg: "0 20px 25px -5px rgba(0,0,0,0.1)", xl: "0 25px 50px -12px rgba(0,0,0,0.25)" };
    style.boxShadow = shadows[block.style.boxShadow as keyof typeof shadows];
  }

  const animClass = block.style?.animation === "fadeIn" ? "animate-in fade-in fill-mode-both duration-700" : block.style?.animation === "slideUp" ? "animate-in slide-in-from-bottom-10 fill-mode-both duration-700" : block.style?.animation === "zoomIn" ? "animate-in zoom-in-95 fill-mode-both duration-700" : "";
  const responsiveClass = cn(block.style?.hideDesktop ? "md:hidden" : "", block.style?.hideMobile ? "hidden md:block" : "");

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
    case "row":
      const gridClass = { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" }[block.content?.columns || 1] || "md:grid-cols-1";
      return <div style={style} className={cn("grid gap-6 px-6 max-w-6xl mx-auto grid-cols-1", gridClass, animClass, responsiveClass)}>{block.children?.map(child => <BlockRenderer key={child.id} block={child} products={products} store={store} subdomain={subdomain} />)}</div>;
    
    case "accordion":
      return (
        <div style={style} className={cn("px-6 max-w-6xl mx-auto", animClass, responsiveClass)}>
          <Accordion type="single" collapsible className="w-full">
            {(block.content?.items || []).map((item: any) => (
              <AccordionItem key={item.id} value={item.id} className="border-b-0 mb-2">
                <AccordionTrigger className="bg-slate-50 px-6 py-4 rounded-xl hover:bg-slate-100 hover:no-underline font-bold text-sm text-left">
                  {item.title}
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 text-sm text-slate-600 bg-white rounded-b-xl border border-slate-50 -mt-1">
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
          style={style} 
          className={cn("px-6 w-full max-w-6xl mx-auto relative overflow-hidden", animClass, responsiveClass)}
        >
          {block.content?.bgImage && <img src={block.content.bgImage} className="absolute inset-0 w-full h-full object-cover z-0 opacity-40" alt="" />}
          <div className={cn("relative z-10 space-y-4 flex flex-col", {
            "items-start text-left": cardTextAlign === "left",
            "items-center text-center": cardTextAlign === "center",
            "items-end text-right": cardTextAlign === "right",
            "items-stretch text-justify": cardTextAlign === "justify"
          })}>
             {IconComp && <IconComp style={{ color: block.content?.iconColor || "#145DCC" }} size={block.content?.iconSize || 32} className="shrink-0" />}
             <div className="space-y-1 w-full">
                <h4 className="font-bold text-xl">{block.content?.title}</h4>
                <p className="text-sm opacity-80 leading-relaxed">{block.content?.subtitle}</p>
             </div>
             {(block.content?.items || []).length > 0 && (
               <div className={cn("space-y-2 pt-2 w-full flex flex-col", {
                  "items-start": cardTextAlign === "left",
                  "items-center": cardTextAlign === "center",
                  "items-end": cardTextAlign === "right",
                  "items-stretch": cardTextAlign === "justify"
               })}>
                 {block.content.items.map((item: string, i: number) => {
                    let prefix;
                    const lStyle = block.content?.listStyle || "check";
                    if (lStyle === "check") prefix = <Check className="w-3.5 h-3.5 text-primary" />;
                    else if (lStyle === "bullet") prefix = <div className="w-1 h-1 rounded-full bg-slate-400" />;
                    else if (lStyle === "number") prefix = <span className="text-[10px] font-bold text-primary">{i+1}.</span>;
                    else if (lStyle === "roman") prefix = <span className="text-[10px] font-bold text-primary">{["I", "II", "III", "IV", "V"][i] || i+1}.</span>;
                    else if (lStyle === "bengali") prefix = <span className="text-[10px] font-bold text-primary">{['০', '১', '২', '৩', '৪'][i] || i+1}.</span>;

                    return (
                      <div key={i} className="flex items-center gap-2">
                        {prefix}
                        <span className="text-sm font-medium">{item}</span>
                      </div>
                    );
                 })}
               </div>
             )}
          </div>
        </div>
      );

    case "header":
      const Tag = block.content?.level || 'h2';
      return <div style={style} className={cn("px-6 max-w-6xl mx-auto", animClass, responsiveClass)}><Tag className={cn({ h1: 'text-5xl md:text-7xl', h2: 'text-4xl md:text-5xl', h3: 'text-2xl md:text-3xl' }[Tag as any] || "text-3xl", "font-headline font-bold leading-tight")}>{block.content?.text}</Tag></div>;
    case "paragraph":
      return <div style={style} className={cn("px-6 max-w-6xl mx-auto text-muted-foreground leading-relaxed whitespace-pre-wrap text-lg", animClass, responsiveClass)}>{block.content?.text}</div>;
    case "rich-text":
      return (
        <div style={style} className={cn("px-6 max-w-6xl mx-auto", animClass, responsiveClass)}>
          <div 
            className="prose prose-lg prose-slate max-w-none" 
            dangerouslySetInnerHTML={{ __html: block.content?.html || "" }} 
          />
        </div>
      );
    case "image":
      return <div style={style} className={cn("px-6 max-w-6xl mx-auto", animClass, responsiveClass)}>{block.content?.url && <img src={block.content.url} className="w-full shadow-2xl" style={{ borderRadius: style.borderRadius }} alt="" />}</div>;
    case "button":
      return <div style={style} className={cn("px-6 max-w-6xl mx-auto", animClass, responsiveClass)}><Button size="lg" className="rounded-2xl px-12 h-16 font-bold text-xl shadow-2xl shadow-primary/30 transition-all hover:scale-105" onClick={handleButtonClick}>{block.content?.text}</Button></div>;
    case "checked-list":
      return <div style={style} className={cn("px-6 max-w-6xl mx-auto space-y-4", animClass, responsiveClass)}>{(block.content?.items || []).map((item: string, i: number) => {
        let prefix = <div className="mt-1 bg-primary/10 p-1.5 rounded-full text-primary shadow-sm"><LucideIcons.CheckCircle className="w-5 h-5 fill-primary text-white" /></div>;
        if (block.content?.listStyle === "bullet") prefix = <div className="mt-4 w-2 h-2 rounded-full bg-primary shrink-0 ml-3 mr-1" />;
        else if (block.content?.listStyle === "number") prefix = <div className="mt-1 bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-primary font-black text-sm shrink-0">{i + 1}</div>;
        return <div key={i} className="flex items-start gap-4">{prefix}<span className="text-xl font-medium pt-0.5">{item}</span></div>;
      })}</div>;
    case "carousel":
      const carColMapping = { 1: "basis-full", 2: "basis-full md:basis-1/2", 3: "basis-full md:basis-1/3", 4: "basis-full md:basis-1/4" }[block.style?.desktopColumns || 3] || "basis-full";
      return <div style={style} className={cn("px-6 w-full max-w-6xl mx-auto", animClass, responsiveClass)}><Carousel opts={{ align: "start" }} className="w-full"><CarouselContent>{(block.content?.items || []).map((item: any) => <CarouselItem key={item.id} className={cn(carColMapping, "px-2")}><div className="bg-slate-50 rounded-[32px] overflow-hidden border border-slate-100 h-full flex flex-col shadow-sm">{item.imageUrl && <img src={item.imageUrl} className="w-full aspect-square object-cover" />}{(item.title || item.subtitle || item.buttonText) && <div className="p-6 space-y-3 flex-1">{item.title && <h4 className="font-bold text-xl">{item.title}</h4>}{item.subtitle && <p className="text-sm text-muted-foreground line-clamp-3">{item.subtitle}</p>}{item.buttonText && <Button variant="secondary" className="w-full h-12 text-xs uppercase font-black rounded-2xl mt-4">{item.buttonText}</Button>}</div>}</div></CarouselItem>)}</CarouselContent><CarouselPrevious className="left-2 bg-white/80 hover:bg-white border-none shadow-lg text-primary h-12 w-12" /><CarouselNext className="right-2 bg-white/80 hover:bg-white border-none shadow-lg text-primary h-12 w-12" /></Carousel></div>;
    case "product-order-form":
      const productIds = block.content?.productIds || (block.content?.mainProductId ? [block.content.mainProductId] : []);
      const selectedProducts = products.filter(p => productIds.includes(p.id));
      return <div style={style} className={cn("px-6 max-w-5xl mx-auto", animClass, responsiveClass)} data-block-type="product-order-form"><LandingPageOrderForm products={selectedProducts} store={store} /></div>;
    default: return null;
  }
}

function LandingPageOrderForm({ products, store }: { products: any[], store: any }) {
  const { toast } = useToast();
  const db = useFirestore();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [clientIp, setClientIp] = useState("");
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");

  const product = products.find(p => p.id === selectedProductId) || products[0];

  const [formData, setFormData] = useState({ fullName: "", phone: "", address: "", paymentMethod: "cod", selectedManualMethodId: "", transactionId: "" });

  useEffect(() => {
    fetch("https://api.ipify.org?format=json").then(res => res.json()).then(data => setClientIp(data.ip)).catch(e => console.error(e));
    if (store?.shippingSettings?.enabled && store.shippingSettings.methods?.length > 0) setSelectedShipping(store.shippingSettings.methods[0]);
  }, [store]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !formData.fullName || !formData.phone || !formData.address) { toast({ variant: "destructive", title: "তথ্য অসম্পূর্ণ" }); return; }
    if (formData.paymentMethod === 'manual' && (!formData.transactionId || !formData.selectedManualMethodId)) { toast({ variant: "destructive", title: "পেমেন্ট তথ্য প্রয়োজন" }); return; }
    setIsPlacingOrder(true);
    try {
      const shippingCost = selectedShipping?.cost || 0;
      const total = Number(product.currentPrice) + shippingCost;
      await addDoc(collection(db, "orders"), {
        storeId: store.id, ownerId: store.ownerId, items: [{ id: product.id, name: product.name, price: Number(product.currentPrice), image: product.featuredImage || product.gallery?.[0], quantity: 1 }],
        customer: { fullName: formData.fullName, phone: formData.phone, address: formData.address, ip: clientIp },
        shipping: selectedShipping ? { name: selectedShipping.name, cost: selectedShipping.cost } : { name: "Standard", cost: 0 },
        subtotal: Number(product.currentPrice), shippingCost: shippingCost, total, paymentMethod: formData.paymentMethod, transactionId: formData.paymentMethod === 'manual' ? formData.transactionId : null, selectedManualMethodId: formData.paymentMethod === 'manual' ? formData.selectedManualMethodId : null, status: "pending", paymentStatus: formData.paymentMethod === 'cod' ? "unpaid" : "pending_verification", isRead: false, createdAt: serverTimestamp(),
      });
      setOrderSuccess(true);
      toast({ title: "অর্ডার সফল হয়েছে!" });
    } catch (error) { console.error(error); toast({ variant: "destructive", title: "Order Failed" }); } finally { setIsPlacingOrder(false); }
  };

  if (orderSuccess) return <Card className="rounded-[40px] shadow-2xl p-12 text-center bg-white animate-in zoom-in-95 duration-500"><div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6"><CheckCircle2 className="w-12 h-12" /></div><h3 className="text-3xl font-headline font-black text-slate-900 uppercase">THANK YOU!</h3><p className="text-slate-500 mt-2">আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে।</p></Card>;

  return (
    <Card className="rounded-[40px] shadow-2xl border-none overflow-hidden text-left bg-white">
      <div className="bg-[#161625] text-white p-10 md:p-14 text-center"><h3 className="text-4xl md:text-5xl font-headline font-black mb-4 tracking-tighter uppercase">অর্ডার কনফার্ম করুন</h3><p className="text-white/60 font-medium uppercase tracking-[0.3em] text-xs">নিরাপদ এবং দ্রুত ডেলিভারি</p></div>
      
      {products.length > 1 && (
        <div className="p-8 md:p-14 pb-0 space-y-4">
           <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">আপনার পছন্দের প্যাকেজটি নির্বাচন করুন</Label>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                    selectedProductId === p.id ? "border-primary bg-primary/5" : "bg-slate-50 border-transparent hover:bg-slate-100"
                  )}
                >
                   <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", selectedProductId === p.id ? 'border-primary' : 'border-slate-300')}>
                      {selectedProductId === p.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                   </div>
                   <img src={p.featuredImage} className="w-10 h-10 rounded-lg object-cover" alt="" />
                   <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs truncate">{p.name}</p>
                      <p className="text-primary font-black text-sm">${p.currentPrice}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="p-8 md:p-14 space-y-12">
        {product ? <div className="flex flex-col md:flex-row justify-between items-center p-8 bg-slate-50 rounded-[32px] border border-slate-100 gap-8"><div className="flex items-center gap-8"><img src={product.featuredImage} className="w-24 h-24 rounded-2xl object-cover shadow-lg" /><div><h4 className="text-2xl font-bold tracking-tight">{product.name}</h4><p className="text-primary font-black text-3xl mt-1">${product.currentPrice}</p></div></div><CheckCircle className="text-primary w-12 h-12" /></div> : <div className="p-12 text-center border-2 border-dashed rounded-[32px] opacity-20 font-bold uppercase tracking-widest">পণ্য নির্বাচন করা হয়নি</div>}
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t">
          <div className="space-y-6">
            <h4 className="font-bold text-xl text-slate-400 uppercase tracking-widest">আপনার তথ্য</h4>
            <div className="space-y-4"><Input placeholder="আপনার পুরো নাম" className="rounded-2xl h-14 bg-slate-50 border-none px-6 text-lg" value={formData.fullName} onChange={(e) => setFormData(prev => ({...prev, fullName: e.target.value}))} /><Input placeholder="মোবাইল নাম্বার" className="rounded-2xl h-14 bg-slate-50 border-none px-6 text-lg" value={formData.phone} onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))} /><Textarea placeholder="পুরো ঠিকানা (বাসা/রোড, জেলা)" className="rounded-3xl min-h-[120px] bg-slate-50 border-none p-6 text-lg" value={formData.address} onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))} /></div>
            {store?.shippingSettings?.enabled && (
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-400 uppercase tracking-widest">ডেলিভারি এরিয়া</h4>
                <div className="grid gap-3">
                  {store.shippingSettings.methods.map((method: any) => (
                    <div 
                      key={method.id} 
                      className={cn("flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer", selectedShipping?.id === method.id ? 'border-primary bg-primary/5' : 'bg-slate-50 border-transparent')} 
                      onClick={() => setSelectedShipping(method)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", selectedShipping?.id === method.id ? 'border-primary' : 'border-slate-300')}>
                          {selectedShipping?.id === method.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <span className="font-bold cursor-pointer">{method.name}</span>
                      </div>
                      <span className="font-bold text-sm">{method.cost > 0 ? `$${method.cost}` : 'Free'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-6">
            <h4 className="font-bold text-xl text-slate-400 uppercase tracking-widest">পেমেন্ট মেথড</h4>
            <div className="grid gap-3">
              <div 
                className={cn("flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all", formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'bg-slate-50 border-transparent')} 
                onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cod', selectedManualMethodId: "", transactionId: "" }))}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.paymentMethod === 'cod' ? 'border-primary' : 'border-slate-300')}>
                    {formData.paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="font-bold flex-1 cursor-pointer">ক্যাশ অন ডেলিভারি</span>
                </div>
                <Truck className="w-5 h-5 text-slate-300" />
              </div>
              
              {store?.paymentSettings?.manualEnabled && store.paymentSettings.manualMethods?.length > 0 && (
                <div 
                  className={cn("flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all", formData.paymentMethod === 'manual' ? 'border-primary bg-primary/5' : 'bg-slate-50 border-transparent')} 
                  onClick={() => setFormData(prev => ({...prev, paymentMethod: 'manual'}))}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.paymentMethod === 'manual' ? 'border-primary' : 'border-slate-300')}>
                         {formData.paymentMethod === 'manual' && <div className="w-2 h-2 rounded-full bg-primary" />}
                       </div>
                       <span className="font-bold cursor-pointer">বিকাশ/নগদ/রকেট</span>
                    </div>
                    <Smartphone className="w-5 h-5 text-slate-300" />
                  </div>
                  {formData.paymentMethod === 'manual' && (
                    <div className="mt-4 pt-4 border-t border-primary/10 space-y-4 animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-2 gap-2">
                        {store.paymentSettings.manualMethods.map((m: any) => (
                          <Button key={m.id} type="button" variant="outline" className={cn("h-10 rounded-xl text-[10px] font-black uppercase", formData.selectedManualMethodId === m.id ? 'bg-primary text-white' : '')} onClick={(e) => { e.stopPropagation(); setFormData(prev => ({...prev, selectedManualMethodId: m.id})); }}>{m.name}</Button>
                        ))}
                      </div>
                      {selectedManualMethod && (
                        <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                          <div className="p-4 bg-white rounded-2xl border border-primary/10">
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
            <div className="bg-slate-50 p-10 rounded-[40px] border space-y-5"><div className="flex justify-between text-muted-foreground font-bold uppercase text-xs tracking-widest"><span>পণ্য মূল্য</span><span>${(Number(product?.currentPrice || 0)).toFixed(2)}</span></div><div className="flex justify-between text-muted-foreground font-bold uppercase text-xs tracking-widest"><span>ডেলিভারি চার্জ</span><span>${(selectedShipping?.cost || 0).toFixed(2)}</span></div><div className="flex justify-between text-4xl font-black text-primary border-t pt-8 mt-4"><span>মোট</span><span>${(Number(product?.currentPrice || 0) + (selectedShipping?.cost || 0)).toFixed(2)}</span></div></div>
            <Button type="button" onClick={handlePlaceOrder} disabled={isPlacingOrder || !product} className="w-full h-20 rounded-[32px] text-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/40 transition-transform hover:scale-[1.02]">{isPlacingOrder ? <Loader2 className="animate-spin" /> : "অর্ডার সম্পন্ন করুন"}</Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
