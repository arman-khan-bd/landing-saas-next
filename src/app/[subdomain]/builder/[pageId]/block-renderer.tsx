
"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn, getTenantPath, getCurrencySymbol } from "@/lib/utils";

import { useSupabaseClient } from "@/supabase";
import { useToast } from "@/hooks/use-toast";
import * as LucideIcons from "lucide-react";
import { 
  CheckCircle2, Truck, Smartphone, Loader2, Check,
  ChevronUp, ChevronDown, Plus, Trash2, GripVertical,
  CheckCircle, CreditCard, ShieldCheck, Image as ImageIcon,
  Columns, LayoutList, Zap, ArrowRight, Star, BookOpen, Quote,
  Phone, Microscope, Banknote, RotateCcw, CheckSquare, Menu, Play, Code, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { CSS } from "@dnd-kit/utilities";
import { Block, BlockType, PageStyle } from "./types";
import { Label } from "@/components/ui/label";

// Import Modular Block Components
import { NavbarBlock } from "./blocks/NavbarBlock";
import { HeroBlock } from "./blocks/HeroBlock";
import { OrderFormBlock } from "./blocks/OrderFormBlock";
import { CarouselBlock } from "./blocks/CarouselBlock";
import { PackageCardBlock } from "./blocks/PackageCardBlock";
import { 
  HeaderBlock, ParagraphBlock, ButtonBlock, MarqueeBlock, 
  CardBlock, AccordionBlock, VideoBlock, ImageBlock, 
  SelectorBlock, CheckedListBlock, ScoreCardsBlock
} from "./blocks/GenericBlocks";

interface BlockRendererProps {
  block: Block;
  products: any[];
  store: any;
  isPreview?: boolean;
  viewMode?: "desktop" | "mobile";
  isBuilder?: boolean;
  isMobile?: boolean;
  selectedBlockId?: string | null;
  onSelect?: (id?: string) => void;
  onRemove?: (id?: string) => void;
  onMoveUp?: (id?: string) => void;
  onMoveDown?: (id?: string) => void;
  onInsertRequest?: (id: string, position: "before" | "after") => void;
  onAddNested?: (parentId: string, colIdx?: number) => void;
  subdomain?: string;
  pageStyle?: PageStyle;
}

const renderTextWithHighlights = (text: string, highlightColor?: string): React.ReactNode => {
  if (!text) return "";

  // Helper function to recursively parse text
  const parseText = (input: string): React.ReactNode[] => {
    const parts = [];
    let currentText = "";
    let i = 0;

    while (i < input.length) {
      if (input[i] === '[') {
        // Push accumulated text
        if (currentText) {
          parts.push(currentText);
          currentText = "";
        }

        // Find matching closing bracket
        let depth = 1;
        let j = i + 1;
        while (j < input.length && depth > 0) {
          if (input[j] === '[') depth++;
          if (input[j] === ']') depth--;
          j++;
        }

        if (depth === 0) {
          const innerContent = input.slice(i + 1, j - 1);
          
          if (innerContent.includes(':')) {
             const firstColonIdx = innerContent.indexOf(':');
             const tagPart = innerContent.slice(0, firstColonIdx);
             const wordPart = innerContent.slice(firstColonIdx + 1);
             
             let className = "";
             let styleObj: any = {};
             
             if (tagPart.includes('=')) {
               const [tag, val] = tagPart.split('=');
               if (tag === 'c' || tag === 'color') styleObj.color = val;
               if (tag === 'bg') styleObj.backgroundColor = val;
               if (tag === 'pad') {
                  styleObj.padding = val;
                  styleObj.borderRadius = '4px';
               }
             } else {
               if (tagPart === 'b') className += " font-bold";
               else if (tagPart === 'i') className += " italic";
               else if (tagPart === 'u') className += " underline underline-offset-4";
               else if (tagPart === 's') className += " line-through";
               else if (tagPart === 'cross') className += " marker-cross";
               else if (tagPart === 'underline') className += " marker-underline";
               else className += ` animate-${tagPart}`;
             }

             parts.push(
               <span key={i} className={cn("inline-block", className)} style={styleObj}>
                 {parseText(wordPart)}
               </span>
             );
          } else {
             // Handle old default highlight style without colon
             parts.push(
               <span key={i} className="text-highlight font-bold inline-block" style={{ '--highlight-color': highlightColor || '#FFD700' } as any}>
                 {parseText(innerContent)}
               </span>
             );
          }
          i = j;
          continue;
        }
      }
      
      currentText += input[i];
      i++;
    }

    if (currentText) {
      parts.push(currentText);
    }

    return parts;
  };

  return <>{parseText(text)}</>;
};

export function CanvasBlockWrapper({ block, products, store, isSelected, isMobile, onSelect, onRemove, onMoveUp, onMoveDown, onInsertRequest, viewMode, onAddNested, selectedBlockId, isBuilder, pageStyle }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id, disabled: isMobile });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.3 : 1,
  };

  const isHidden = (viewMode === "desktop" && block.style?.hideDesktop) || (viewMode === "mobile" && block.style?.hideMobile);

  return (
    <div
      ref={setNodeRef}
      id={block.id}
      style={style}
      onClick={(e) => { 
        e.stopPropagation(); 
        onSelect(block.id); 
      }}
      className={cn(
        "relative group/block transition-all duration-300 cursor-pointer min-h-[20px]",
        isSelected ? "ring-2 ring-primary ring-offset-2 z-40 bg-primary/5 rounded-lg" : "hover:bg-primary/5",
        isHidden ? "opacity-20 blur-[0.5px] grayscale" : ""
      )}
    >
      {isSelected && (
        <div className="absolute -top-7 left-0 flex items-center gap-2 bg-primary text-white rounded-t-lg px-2.5 py-1 text-[8px] font-black uppercase tracking-widest z-50 shadow-lg">
          {!isMobile ? (
            <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing hover:bg-white/20 p-0.5 rounded mr-1">
              <GripVertical className="w-2.5 h-2.5" />
            </div>
          ) : (
            <div className="flex items-center gap-1 border-r border-white/20 pr-1 mr-1">
               <Button variant="ghost" size="icon" className="h-5 w-5 text-white hover:bg-white/20 p-0" onClick={(e) => { e.stopPropagation(); onMoveUp(block.id); }}>
                  <ChevronUp className="w-3 h-3" />
               </Button>
               <Button variant="ghost" size="icon" className="h-5 w-5 text-white hover:bg-white/20 p-0" onClick={(e) => { e.stopPropagation(); onMoveDown(block.id); }}>
                  <ChevronDown className="w-3 h-3" />
               </Button>
            </div>
          )}
          <div className="flex items-center gap-1.5 border-r border-white/20 pr-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-4 w-4 text-white hover:bg-white/20 p-0"
              onClick={(e) => { e.stopPropagation(); onInsertRequest(block.id, 'before'); }}
            >
              <Plus className="w-2.5 h-2.5" />
            </Button>
            <span>{block.type}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-4 w-4 text-white hover:bg-white/20 p-0"
              onClick={(e) => { e.stopPropagation(); onInsertRequest(block.id, 'after'); }}
            >
              <Plus className="w-2.5 h-2.5" />
            </Button>
          </div>
          <div className="flex items-center gap-1 border-l border-white/20 pl-1 ml-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 text-white hover:bg-rose-500 hover:text-white transition-all p-0 rounded-md" 
              onClick={(e) => { e.stopPropagation(); onRemove(block.id); }}
              title="Remove Section"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
      <div className={cn(
        "relative",
        isBuilder && block.type !== "row" && "pointer-events-auto"
      )}>
        <BlockRenderer 
          block={block} 
          products={products} 
          store={store}
          viewMode={viewMode} 
          onAddNested={onAddNested}
          isBuilder={isBuilder}
          isMobile={isMobile}
          selectedBlockId={selectedBlockId}
          onSelect={onSelect}
          onRemove={onRemove}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onInsertRequest={onInsertRequest}
          pageStyle={pageStyle}
        />
      </div>
    </div>
  );
}

export function BlockRenderer({ block, products, store, isPreview = false, viewMode = "desktop", onAddNested, isBuilder, isMobile, onSelect, onRemove, onMoveUp, onMoveDown, onInsertRequest, selectedBlockId, pageStyle }: BlockRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  // We can safely remove the useEffect for setTimeout since we default to true,
  // animations will still trigger via CSS transitions if they mount with the class.

  const isHidden = (viewMode === "desktop" && block.style?.hideDesktop) || (viewMode === "mobile" && block.style?.hideMobile);
  if (isHidden && isPreview) return null;

  const isOrganic = pageStyle?.themeId === 'organic';
  const isTraditional = pageStyle?.themeId === 'laam';

  const getAnimationStyle = () => {
    if (!isVisible) return { opacity: 0, transform: block.style?.animation === 'fadeIn' ? 'none' : 'translateY(20px)' };
    return { opacity: block.style?.opacity ?? 1, transform: 'none', transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)' };
  };

  // Adaptive values for font size and padding
  const adaptivePaddingTop = block.style?.paddingTop !== undefined ? (isMobile ? block.style.paddingTop * 0.6 : block.style.paddingTop) : undefined;
  const adaptivePaddingBottom = block.style?.paddingBottom !== undefined ? (isMobile ? block.style.paddingBottom * 0.6 : block.style.paddingBottom) : undefined;
  const adaptiveFontSize = block.style?.fontSize !== undefined ? (isMobile ? Math.max(14, block.style.fontSize * 0.75) : block.style.fontSize) : undefined;

  const style: any = {
    ...(adaptivePaddingTop !== undefined && { paddingTop: `${adaptivePaddingTop}px` }),
    ...(adaptivePaddingBottom !== undefined && { paddingBottom: `${adaptivePaddingBottom}px` }),
    ...(block.style?.paddingLeft !== undefined && { paddingLeft: `${block.style.paddingLeft}px` }),
    ...(block.style?.paddingRight !== undefined && { paddingRight: `${block.style.paddingRight}px` }),
    ...(block.style?.marginTop !== undefined && { marginTop: `${block.style.marginTop}px` }),
    ...(block.style?.marginBottom !== undefined && { marginBottom: `${block.style.marginBottom}px` }),
    ...(block.style?.marginLeft !== undefined && { marginLeft: `${block.style.marginLeft}px` }),
    ...(block.style?.marginRight !== undefined && { marginRight: `${block.style.marginRight}px` }),
    textAlign: block.style?.textAlign,
    backgroundColor: block.style?.backgroundColor,
    backgroundImage: block.style?.backgroundImage ? `url(${block.style.backgroundImage})` : undefined,
    backgroundSize: block.style?.backgroundSize || 'cover',
    backgroundPosition: block.style?.backgroundPosition || 'center',
    backgroundRepeat: block.style?.backgroundRepeat || 'no-repeat',
    color: block.style?.textColor,
    fontSize: adaptiveFontSize ? `${adaptiveFontSize}px` : undefined,
    fontWeight: block.style?.fontWeight,
    borderStyle: block.style?.borderStyle,
    borderWidth: block.style?.borderWidth ? `${block.style.borderWidth}px` : undefined,
    borderTopWidth: block.style?.borderTopWidth !== undefined ? `${block.style.borderTopWidth}px` : undefined,
    borderBottomWidth: block.style?.borderBottomWidth !== undefined ? `${block.style.borderBottomWidth}px` : undefined,
    borderLeftWidth: block.style?.borderLeftWidth !== undefined ? `${block.style.borderLeftWidth}px` : undefined,
    borderRightWidth: block.style?.borderRightWidth !== undefined ? `${block.style.borderRightWidth}px` : undefined,
    borderColor: block.style?.borderColor,
    borderRadius: block.style?.borderRadius ? `${block.style.borderRadius}px` : undefined,
    ...(block.style?.columnSpan !== undefined && { gridColumn: `span ${block.style.columnSpan}` }),
    opacity: block.style?.opacity ?? 1,
    display: block.style?.display || undefined,
    ...(block.style?.maxWidth && { maxWidth: block.style.maxWidth }),
    ...(block.style?.alignment === 'center' && { marginLeft: 'auto', marginRight: 'auto' }),
    ...(block.style?.alignment === 'left' && { marginRight: 'auto' }),
    ...(block.style?.alignment === 'right' && { marginLeft: 'auto' }),
    ...getAnimationStyle()
  };

  const getTextureStyle = () => {
    const texture = block.style?.backgroundTexture || 'none';
    if (texture === 'dots') return { backgroundImage: 'radial-gradient(circle, #0000001a 1px, transparent 1px)', backgroundSize: '20px 20px' };
    if (texture === 'grid') return { backgroundImage: 'linear-gradient(#0000000d 1px, transparent 1px), linear-gradient(90deg, #0000000d 1px, transparent 1px)', backgroundSize: '20px 20px' };
    if (texture === 'diagonal') return { backgroundImage: 'repeating-linear-gradient(45deg, #00000008, #00000008 10px, transparent 10px, transparent 20px)' };
    return {};
  };

  const finalStyle = { ...style, ...getTextureStyle() };

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

  const handleButtonClick = (link?: string, targetId?: string) => {
    // We allow scrolling in builder mode because it doesn't navigate away, 
    // but we block external links to prevent accidental tab closing.
    const isScrollAction = targetId || (block.content?.actionType === 'scroll' && block.content?.targetId);
    if (isBuilder && !isScrollAction) return;

    // 1. Scroll to targetId if provided directly (from Navbar items, etc)
    if (targetId) {
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    // 2. Check for explicit scroll action on the block itself (from Button component)
    if (block.content?.actionType === 'scroll' && block.content?.targetId) {
      const targetEl = document.getElementById(block.content.targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    // 3. Handle standard links or the [checkout] shortcut
    const targetLink = link || block.content?.link;
    if (!targetLink) return;

    if (targetLink === "[checkout]") {
      const orderForm = document.querySelector('[data-block-type="product-order-form"]');
      if (orderForm) {
        orderForm.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (targetLink.startsWith("http") || targetLink.startsWith("tel:")) {
      window.open(targetLink, '_blank');
    } else {
      window.location.href = getTenantPath(store?.subdomain || "", targetLink);
    }
  };

  const commonProps = {
    block,
    style: finalStyle,
    products,
    store,
    handleButtonClick,
    renderBlockIcon,
    renderTextWithHighlights,
    isMobile,
    isOrganic,
    isTraditional
  };

  const renderContent = () => {
    switch (block.type) {
      case "navbar":
        return <NavbarBlock block={block} isBuilder={!!isBuilder} handleButtonClick={handleButtonClick} renderTextWithHighlights={renderTextWithHighlights} />;
      case "ultra-hero":
        return <HeroBlock {...commonProps} />;
      case "header": return <HeaderBlock {...commonProps} />;
      case "paragraph": return <ParagraphBlock {...commonProps} />;
      case "button": return <ButtonBlock {...commonProps} />;
      case "marquee": return <MarqueeBlock {...commonProps} />;
      case "card": return <CardBlock {...commonProps} />;
      case "accordion": return <AccordionBlock {...commonProps} />;
      case "video": return <VideoBlock {...commonProps} />;
      case "image": return <ImageBlock {...commonProps} />;
      case "selector": return <SelectorBlock {...commonProps} />;
      case "checked-list": return <CheckedListBlock {...commonProps} />;
      case "carousel": return <CarouselBlock {...commonProps} />;
      case "package-card": return <PackageCardBlock {...commonProps} />;
      case "product-order-form": return <OrderFormBlock {...commonProps} />;
      case "score-cards": return <ScoreCardsBlock {...commonProps} />;
      case "row":
        const columns = block.content?.columns || 2;
        return (
          <div id={block.id} style={finalStyle} className="px-4 w-full max-w-7xl mx-auto">
            <div className={cn(
              "grid gap-4 sm:gap-8",
              columns === 1 ? "grid-cols-1" : 
              columns === 2 ? "grid-cols-1 md:grid-cols-2" : 
              columns === 3 ? "grid-cols-1 md:grid-cols-3" : 
              "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            )}>
              {[...Array(columns)].map((_, i) => (
                <div key={i} className="space-y-4 min-h-[100px] flex flex-col items-center">
                  <SortableContext
                    items={(block.children || []).filter((child: any) => child.colIdx === i || child.style?.columnIndex === i).map((c: any) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {(block.children || []).filter((child: any) => child.colIdx === i || child.style?.columnIndex === i).map((child: any) => (
                      <div key={child.id} className="w-full">
                         {isBuilder ? (
                            <CanvasBlockWrapper
                              block={child}
                              products={products}
                              store={store}
                              isSelected={selectedBlockId === child.id}
                              isMobile={isMobile}
                              onSelect={onSelect}
                              onRemove={onRemove}
                              onMoveUp={onMoveUp}
                              onMoveDown={onMoveDown}
                              onInsertRequest={onInsertRequest}
                              viewMode={viewMode}
                              onAddNested={onAddNested}
                              selectedBlockId={selectedBlockId}
                              isBuilder={true}
                              pageStyle={pageStyle}
                            />
                         ) : (
                            <BlockRenderer
                              block={child}
                              products={products}
                              store={store}
                              isPreview={isPreview}
                              viewMode={viewMode}
                              pageStyle={pageStyle}
                              isMobile={isMobile}
                            />
                         )}
                      </div>
                    ))}
                  </SortableContext>
                  {isBuilder && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full border-2 border-dashed border-slate-100 hover:border-primary/20 hover:bg-primary/5 h-12 rounded-xl text-[8px] font-black uppercase tracking-widest text-slate-300 hover:text-primary transition-all mt-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddNested?.(block.id, i);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-2" /> Add to Column {i + 1}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case "rich-text":
        return (
          <div id={block.id} style={finalStyle} className="px-4 w-full">
            <div 
              className="prose prose-sm xs:prose-base prose-slate max-w-none prose-p:my-1" 
              dangerouslySetInnerHTML={{ __html: block.content?.html || "Add your rich text content in the sidebar editor." }} 
            />
          </div>
        );
      case "code":
        return isPreview ? null : (
          <div id={block.id} style={finalStyle} className="px-4 w-full max-w-6xl mx-auto">
             <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400">
                   <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                   <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Custom Logic / Code Block</span>
                </div>
                <pre className="text-[10px] sm:text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap bg-black/40 p-3 sm:p-4 rounded-xl">
                   {block.content?.code || "// No code provided"}
                </pre>
                <div className="flex items-center gap-2 text-amber-500/60">
                   <Info className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                   <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-tight">This node is only visible in the manager. Scripts run globally in production.</p>
                </div>
             </div>
          </div>
        );
      case "footer":
        return (
          <footer id={block.id} style={finalStyle} className="px-4 w-full bg-slate-900 text-white rounded-t-2xl sm:rounded-t-[40px] py-12 sm:py-16">
             <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-12">
                <div className="space-y-4 sm:space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/20 rounded-lg sm:rounded-xl flex items-center justify-center text-primary"><Zap className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                      <h4 className="text-lg sm:text-xl font-headline font-black uppercase">{block.content?.brandName || "Store Brand"}</h4>
                   </div>
                   <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{block.content?.description || "Description placeholder..."}</p>
                </div>
                <div className="space-y-3 sm:space-y-4">
                   <h5 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">Contact Channels</h5>
                   <p className="text-xs sm:text-sm font-bold">{block.content?.phone || "Phone N/A"}</p>
                   <p className="text-xs sm:text-sm text-slate-400">{block.content?.email || "Email N/A"}</p>
                   <p className="text-[11px] sm:text-xs text-slate-500">{block.content?.address || "Address N/A"}</p>
                </div>
                <div className="space-y-3 sm:space-y-4">
                   <h5 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">Legal Documents</h5>
                   <div className="flex flex-col gap-1.5 sm:gap-2">
                      <button className="text-xs sm:text-sm text-slate-400 hover:text-white transition-colors text-left">Privacy Policy</button>
                      <button className="text-xs sm:text-sm text-slate-400 hover:text-white transition-colors text-left">Terms & Conditions</button>
                   </div>
                </div>
             </div>
             <div className="max-w-6xl mx-auto pt-8 sm:pt-12 mt-8 sm:mt-12 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-600">&copy; {new Date().getFullYear()} {block.content?.copyright || "All Rights Reserved"}</p>
                <div className="flex gap-4">
                   <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
             </div>
          </footer>
        );
      default: return null;
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "relative w-full", 
        block.style?.animation !== 'none' && "overflow-hidden",
        block.style?.animation && block.style.animation !== 'none' && !['fadeIn', 'slideUp', 'zoomIn'].includes(block.style.animation) && `animate-${block.style.animation}`
      )}
    >
      {renderContent()}
    </div>
  );
}

function LandingPageOrderForm({ products, store, isOrganic, isTraditional }: { products: any[], store: any, isOrganic: boolean, isTraditional: boolean }) {
  const { toast } = useToast();
  const supabase = useSupabaseClient();
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
        const { data: fraudData } = await supabase
          .from("fraud_blocks")
          .select("id")
          .eq("store_id", store.id)
          .in("value", blockValues)
          .limit(1);
        if (fraudData && fraudData.length > 0) {
          toast({ variant: "destructive", title: "অর্ডার গ্রহণ করা সম্ভব হচ্ছে না" });
          setIsPlacingOrder(false);
          return;
        }
      }

      const shippingCost = selectedShipping?.cost || 0;
      const subtotal = Number(product.currentPrice);
      const total = subtotal + shippingCost;

      const orderData = {
        store_id: store.id,
        owner_id: store.owner_id || store.ownerId,
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
        shipping_cost: shippingCost,
        total: total,
        payment_method: formData.paymentMethod,
        transaction_id: formData.paymentMethod === 'manual' ? formData.transactionId : null,
        selected_manual_method_id: formData.paymentMethod === 'manual' ? formData.selectedManualMethodId : null,
        status: "pending",
        payment_status: formData.paymentMethod === 'cod' ? "unpaid" : "pending_verification",
        is_read: false
      };

      await supabase.from("orders").insert(orderData);
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
      <Card className="rounded-[32px] sm:rounded-[40px] shadow-2xl p-8 sm:p-12 text-center bg-white animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-headline font-black text-slate-900 uppercase">THANK YOU!</h3>
        <p className="text-sm sm:text-slate-500 mt-2">আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে।</p>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "rounded-[32px] sm:rounded-[40px] shadow-2xl border-none overflow-hidden text-left bg-white",
      (isOrganic || isTraditional) && "border-2 border-[#d9e8da] bg-[#fdf8f0]"
    )}>
      <div className={cn(
        "text-white p-8 sm:p-14 text-center",
        isOrganic ? "bg-[#1b5e20]" : isTraditional ? "bg-gradient-to-br from-[#1a7c3e] via-[#0f5a2b] to-[#0a3d1d]" : "bg-[#161625]"
      )}>
        <h3 className="text-3xl sm:text-5xl font-headline font-black mb-3 tracking-tighter uppercase">অর্ডার কনফার্ম করুন</h3>
        <p className="text-white/60 font-medium uppercase tracking-[0.3em] text-[9px] sm:text-xs">নিরাপদ এবং দ্রুত ডেলিভারি</p>
      </div>

      <div className="p-6 sm:p-14 space-y-8 sm:space-y-12">
        {products.length > 1 && (
           <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
              {products.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedProductId(p.id)} 
                  className={cn("flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer", selectedProductId === p.id ? "border-primary bg-primary/5" : "bg-white border-slate-100")}
                >
                  <div className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center", selectedProductId === p.id ? 'border-primary' : 'border-slate-300')}>
                    {selectedProductId === p.id && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />}
                  </div>
                  <img src={p.featuredImage} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[10px] sm:text-xs truncate">{p.name}</p>
                    <p className={cn("font-black text-xs sm:text-sm", (isOrganic || isTraditional) ? "text-[#c0392b]" : "text-primary")}>৳ {p.currentPrice}</p>
                  </div>
                </div>
              ))}
           </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 pt-6 sm:pt-8 border-t">
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
               <Label className={cn("text-[9px] sm:text-[10px] font-black uppercase tracking-widest", (isOrganic || isTraditional) ? "text-primary" : "text-slate-400")}>আপনার তথ্য</Label>
               <Input placeholder="আপনার পুরো নাম" className="rounded-xl sm:rounded-2xl h-12 sm:h-14 bg-white border-2 border-slate-100 px-4 sm:px-6 text-base sm:text-lg" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
               <Input placeholder="মোবাইল নাম্বার" className="rounded-xl sm:rounded-2xl h-12 sm:h-14 bg-white border-2 border-slate-100 px-4 sm:px-6 text-base sm:text-lg" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
               <Textarea placeholder="পুরো ঠিকানা (জেলা সহ)" className="rounded-2xl sm:rounded-3xl min-h-[100px] sm:min-h-[120px] bg-white border-2 border-slate-100 p-4 sm:p-6 text-base sm:text-lg" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>

            {store?.shippingSettings?.enabled && (
              <div className="space-y-3 sm:space-y-4">
                 <Label className={cn("text-[9px] sm:text-[10px] font-black uppercase tracking-widest", (isOrganic || isTraditional) ? "text-primary" : "text-slate-400")}>ডেলিভারি এরিয়া</Label>
                 <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
                   {store.shippingSettings.methods.map((method: any) => (
                     <div 
                       key={method.id} 
                       className={cn("flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer", selectedShipping?.id === method.id ? 'border-primary bg-primary/5' : 'bg-slate-50')} 
                       onClick={() => setSelectedShipping(method)}
                     >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center", selectedShipping?.id === method.id ? 'border-primary' : 'border-slate-300')}>
                            {selectedShipping?.id === method.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          <span className="font-bold text-xs sm:text-sm">{method.name}</span>
                        </div>
                        <span className="font-black text-xs sm:text-sm">{method.cost > 0 ? `৳ ${method.cost}` : 'ফ্রি'}</span>
                     </div>
                   ))}
                 </div>
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
               <Label className={cn("text-[9px] sm:text-[10px] font-black uppercase tracking-widest", (isOrganic || isTraditional) ? "text-primary" : "text-slate-400")}>পেমেন্ট মেথড</Label>
               <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
                  {store?.paymentSettings?.cod && (
                    <div 
                      className={cn("flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all", formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'bg-slate-50')} 
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cod', selectedManualMethodId: "", transactionId: "" }))}
                    >
                       <div className="flex items-center gap-3">
                          <div className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center", formData.paymentMethod === 'cod' ? 'border-primary' : 'border-slate-300')}>
                            {formData.paymentMethod === 'cod' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />}
                          </div>
                          <span className="font-bold text-sm sm:text-base">ক্যাশ অন ডেলিভারি</span>
                       </div>
                       <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                    </div>
                  )}

                  {store?.paymentSettings?.manualEnabled && store.paymentSettings.manualMethods?.length > 0 && (
                    <div 
                      className={cn("flex flex-col p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all", formData.paymentMethod === 'manual' ? 'border-primary bg-primary/5' : 'bg-slate-50')} 
                      onClick={() => setFormData(prev => ({...prev, paymentMethod: 'manual'}))}
                    >
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center", formData.paymentMethod === 'manual' ? 'border-primary' : 'border-slate-300')}>
                              {formData.paymentMethod === 'manual' && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />}
                            </div>
                            <span className="font-bold text-sm sm:text-base">বিকাশ/নগদ/রকেট</span>
                          </div>
                          <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                       </div>

                       {formData.paymentMethod === 'manual' && (
                         <div className="mt-4 pt-4 border-t border-primary/10 space-y-4 animate-in slide-in-from-top-2">
                            <div className="grid grid-cols-2 gap-2">
                               {store.paymentSettings.manualMethods.map((m: any) => (
                                 <Button key={m.id} type="button" variant="outline" className={cn("h-9 sm:h-10 rounded-xl text-[9px] sm:text-[10px] font-black uppercase", formData.selectedManualMethodId === m.id ? 'bg-primary text-white border-none' : '')} onClick={(e) => { e.stopPropagation(); setFormData(prev => ({...prev, selectedManualMethodId: m.id})); }}>{m.name}</Button>
                               ))}
                            </div>
                            {selectedManualMethod && (
                               <div className="space-y-3 sm:space-y-4" onClick={(e) => e.stopPropagation()}>
                                  <div className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border-2 border-primary/10">
                                     <p className="text-[9px] sm:text-[10px] font-black text-primary uppercase">নাম্বার: {selectedManualMethod.number}</p>
                                     <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1 italic whitespace-pre-wrap">{selectedManualMethod.instructions}</p>
                                  </div>
                                  <Input placeholder="ট্রানজাকশন আইডি লিখুন" className="h-11 sm:h-12 rounded-xl bg-white border-primary/20" value={formData.transactionId} onChange={(e) => setFormData(prev => ({...prev, transactionId: e.target.value.toUpperCase()}))} />
                               </div>
                            )}
                         </div>
                       )}
                    </div>
                  )}
               </div>
            </div>
          </div>

          <div className="space-y-5 sm:space-y-6">
            <div className={cn("p-8 sm:p-10 rounded-3xl sm:rounded-[40px] border space-y-4 sm:space-y-5", (isOrganic || isTraditional) ? "bg-white border-[#d9e8da]" : "bg-slate-50")}>
              <div className="flex justify-between text-muted-foreground font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                <span>পণ্য মূল্য</span>
                <span>৳ {product?.currentPrice || 0}</span>
              </div>
              <div className="flex justify-between text-muted-foreground font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                <span>ডেলিভারি চার্জ</span>
                <span className={cn("font-black", (selectedShipping?.cost || 0) > 0 ? "text-slate-900" : "text-emerald-500")}>
                   { (selectedShipping?.cost || 0) > 0 ? `৳ ${selectedShipping.cost}` : 'ফ্রি' }
                </span>
              </div>
              <div className={cn("flex justify-between text-3xl sm:text-4xl font-black border-t pt-6 sm:pt-8 mt-4", (isOrganic || isTraditional) ? "text-primary" : "text-primary")}>
                <span className="text-[9px] sm:text-xs pt-3 sm:pt-4 uppercase">মোট</span>
                <span>৳ {(Number(product?.currentPrice || 0) + (selectedShipping?.cost || 0)).toFixed(0)}</span>
              </div>
            </div>
            <Button type="submit" disabled={isPlacingOrder || !product} className={cn("w-full h-16 sm:h-20 rounded-2xl sm:rounded-[32px] text-xl sm:text-2xl font-black uppercase tracking-widest shadow-2xl transition-transform hover:scale-[1.02]", (isOrganic || isTraditional) ? "bg-gradient-to-br from-[#1a7c3e] via-[#0f5a2b] to-[#0a3d1d] hover:opacity-90 shadow-primary/20" : "bg-primary")}>
              {isPlacingOrder ? <Loader2 className="animate-spin" /> : "অর্ডার সম্পন্ন করুন"}
            </Button>
            <div className="flex items-center justify-center gap-2 text-slate-400 mt-2">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em]">নিরাপদ পেমেন্ট ব্যবস্থা</span>
            </div>
          </div>
        </form>
      </div>
    </Card>
  );
}
