
"use client";

import React, { useState, useEffect } from "react";
import { cn, getTenantPath } from "@/lib/utils";

import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import * as LucideIcons from "lucide-react";
import { 
  CheckCircle2, Truck, Smartphone, Loader2, Check,
  ChevronUp, ChevronDown, Plus, Trash2, GripVertical,
  CheckCircle, CreditCard, ShieldCheck, Image as ImageIcon,
  Columns, LayoutList, Zap, ArrowRight, Star, BookOpen, Quote,
  Phone, Microscope, Banknote, RotateCcw, CheckSquare, Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { CSS } from "@dnd-kit/utilities";
import { Block, BlockType, PageStyle } from "./types";
import { Label } from "@/components/ui/label";

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

const renderTextWithHighlights = (text: string, highlightColor?: string) => {
  if (!text) return "";
  const parts = text.split(/(\[.*?\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      const word = part.slice(1, -1);
      return (
        <span 
          key={i} 
          className="text-highlight font-bold" 
          style={{ '--highlight-color': highlightColor || '#FFD700' } as any}
        >
          {word}
        </span>
      );
    }
    return part;
  });
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
               <Button variant="ghost" size="icon" className="h-5 v-5 text-white hover:bg-white/20 p-0" onClick={(e) => { e.stopPropagation(); onMoveUp(block.id); }}>
                  <ChevronUp className="w-3 h-3" />
               </Button>
               <Button variant="ghost" size="icon" className="h-5 v-5 text-white hover:bg-white/20 p-0" onClick={(e) => { e.stopPropagation(); onMoveDown(block.id); }}>
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
          <div className="flex items-center gap-1">
            <Trash2 className="w-3 h-3 cursor-pointer hover:text-red-200" onClick={(e) => { e.stopPropagation(); onRemove(block.id); }} />
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
  const isHidden = (viewMode === "desktop" && block.style?.hideDesktop) || (viewMode === "mobile" && block.style?.hideMobile);
  if (isHidden && isPreview) return null;

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
    borderStyle: block.style?.borderStyle,
    borderWidth: block.style?.borderWidth ? `${block.style.borderWidth}px` : undefined,
    borderColor: block.style?.borderColor,
    borderRadius: block.style?.borderRadius ? `${block.style.borderRadius}px` : undefined,
    ...(block.style?.columnSpan !== undefined && { gridColumn: `span ${block.style.columnSpan}` })
  };

  const gridColsMap: Record<number, string> = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
  };

  const handleButtonClick = (link?: string) => {
    if (isBuilder) return;
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

  switch (block.type) {
    case "navbar":
      const LogoIcon = (LucideIcons as any)[block.content?.logoIcon] || Menu;
      const navItems = block.content?.items || [];
      const showCta = block.content?.showCta;
      const navPosition = block.content?.position || "normal"; 
      
      const posStyles: any = {
        normal: { position: 'relative' },
        sticky: { position: 'sticky', top: 0, zIndex: 1000 },
        fixed: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }
      };

      const renderItems = (pos: string) => (
        <div className={cn("flex items-center gap-6", {
          "justify-start": pos === "left",
          "justify-center": pos === "center",
          "justify-end": pos === "right"
        })}>
          {block.content?.logoPosition === pos && (
            <div className="flex items-center gap-2">
              {block.content?.logoType === "image" && block.content?.logoUrl ? (
                <img src={block.content.logoUrl} className="h-8 w-auto object-contain" alt="logo" />
              ) : block.content?.logoType === "icon" ? (
                <LogoIcon className="w-6 h-6" style={{ color: block.content?.primaryColor || 'currentColor' }} />
              ) : (
                <span className="font-headline font-black text-lg uppercase tracking-tight">{block.content?.logoText || "LOGO"}</span>
              )}
            </div>
          )}
          {navItems.filter((i: any) => i.position === pos).map((item: any) => (
            <button key={item.id} onClick={() => handleButtonClick(item.link)} className="text-sm font-bold opacity-80 hover:opacity-100 transition-opacity">
              {item.label}
            </button>
          ))}
          {showCta && block.content?.ctaPosition === pos && (
            <Button 
              size="sm" 
              className={cn("rounded-xl h-9 px-6 font-bold text-xs uppercase tracking-widest", isTraditional ? 'gold-btn text-white' : '')} 
              onClick={() => handleButtonClick(block.content.ctaLink)}
            >
              {block.content.ctaText}
            </Button>
          )}
        </div>
      );

      return (
        <div 
          style={{ 
            backgroundColor: block.content?.transparent ? 'transparent' : (block.content?.backgroundColor || '#ffffff'),
            color: block.content?.textColor || '#1a1a1a',
            ...posStyles[navPosition],
          }} 
          className={cn(
            "w-full px-6 py-4 border-b border-white/10 backdrop-blur-md z-[1000]",
            navPosition === "fixed" && "left-0 right-0"
          )}
        >
          <div className="max-w-7xl mx-auto grid grid-cols-3 items-center">
            {renderItems("left")}
            {renderItems("center")}
            {renderItems("right")}
          </div>
        </div>
      );

    case "ultra-hero":
      const trustItems = block.content?.trustItems || [];
      const heroBgStyle: any = {
        ...(block.content?.bgType === 'image' && block.content?.bgImage ? {
          backgroundImage: `url(${block.content.bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {})
      };

      const getButtonStyle = (btn: 'cta' | 'phone') => {
        const type = block.content?.[`${btn}Type`] || (btn === 'cta' ? 'gradient' : 'outline');
        const bg = block.content?.[`${btn}Bg`];
        const text = block.content?.[`${btn}TextColor`];
        const border = block.content?.[`${btn}BorderColor`];
        const radius = block.content?.[`${btn}BorderRadius`];
        const width = block.content?.[`${btn}BorderWidth`];

        const s: any = {};
        if (type === 'gradient' && btn === 'cta') {
          s.background = 'linear-gradient(135deg, #f9a825, #e65c00)';
        } else if (type === 'solid' || type === 'gradient') {
          if (bg) s.backgroundColor = bg;
        } else if (type === 'outline') {
          s.backgroundColor = 'transparent';
          s.borderStyle = 'solid';
          s.borderWidth = `${width || 2}px`;
          if (border) s.borderColor = border;
        }

        if (text) s.color = text;
        if (radius !== undefined) s.borderRadius = `${radius}px`;
        
        return s;
      };

      return (
        <div style={{ ...style, ...heroBgStyle }} className="w-full relative overflow-hidden">
           {block.content?.bgType !== 'image' && (
             <div className={cn(
               "absolute inset-0 -z-10",
               isOrganic ? "bg-gradient-to-br from-[#1b5e20] via-[#2d7a3a] to-[#388e3c]" : 
               isTraditional ? "bg-gradient-to-br from-[#1a7c3e] via-[#0f5a2b] to-[#0a3d1d]" :
               "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950"
             )} />
           )}
           {block.content?.bgType === 'image' && <div className="absolute inset-0 bg-black/40 -z-10" />}
           
           <div className="absolute inset-0 -z-10 opacity-[0.03]" style={{ backgroundImage: `repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)`, backgroundSize: '10px 10px' }} />

           <div className="max-w-4xl mx-auto px-6 py-16 sm:py-24 text-center flex flex-col items-center">
              <div 
                style={{ color: block.content?.badgeColor || '#facc15' }}
                className="mb-8 inline-flex items-center px-5 py-2 rounded-full bg-white/10 border border-white/20 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-top-4 duration-700"
              >
                {block.content?.badgeText || "BSTI অনুমোদিত • BCSIR ল্যাব টেস্টেড"}
              </div>

              <h1 
                style={{ color: block.content?.titleColor || '#ffffff' }}
                className="text-4xl sm:text-7xl font-headline font-black leading-[1.1] sm:leading-[0.95] mb-4 tracking-tighter max-w-3xl"
              >
                {renderTextWithHighlights(block.content?.title || "অসুস্থ ব্যক্তি ছাড়া সুস্থতার মূল্য কেউ বোঝে না", block.style?.highlightColor)}
              </h1>

              <p 
                style={{ color: block.content?.subtitleColor || 'rgba(253, 224, 71, 0.9)' }}
                className="text-lg sm:text-2xl font-bold mb-10 tracking-tight"
              >
                {block.content?.subtitle || "শক্তি ও সুস্বাস্থ্যের নির্ভরযোগ্য উপহার"}
              </p>

              <div className="bg-white rounded-full px-8 py-3 mb-12 shadow-2xl shadow-black/20 flex items-center gap-4 border-2 border-white/20 animate-pulse">
                 <span 
                   style={{ color: block.content?.brandTitleColor || '#1a7c3e' }}
                   className="text-2xl sm:text-3xl font-black tracking-tighter"
                 >
                   "{block.content?.brandTitle || "সাম"}"
                 </span>
                 <div className="h-6 w-px bg-slate-200" />
                 <span 
                   style={{ color: block.content?.brandSubtitleColor || '#64748b' }}
                   className="text-xs sm:text-sm font-bold uppercase tracking-widest pt-1"
                 >
                   {block.content?.brandSubtitle || "প্রাকৃতিক স্বাস্থ্য সুরক্ষা"}
                 </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center mb-16">
                 <Button 
                   size="lg" 
                   style={getButtonStyle('cta')}
                   className={cn(
                     "h-16 px-10 rounded-full text-white font-black text-xl shadow-xl shadow-orange-950/20 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
                   )}
                   onClick={() => handleButtonClick(block.content?.ctaLink || "[checkout]")}
                 >
                   <ArrowRight className="w-5 h-5 mr-2" />
                   {block.content?.ctaText || "এখানে অর্ডার করুন"}
                 </Button>

                 <Button 
                   variant="outline"
                   size="lg" 
                   style={getButtonStyle('phone')}
                   className="h-16 px-10 rounded-full border-2 border-white/30 bg-white/5 hover:bg-white/10 font-bold text-lg w-full sm:w-auto"
                   onClick={() => handleButtonClick(block.content?.phoneLink || "tel:01621611589")}
                 >
                   <Phone className="w-5 h-5 mr-2" />
                   {block.content?.phoneText || "01621-611589"}
                 </Button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-6 sm:gap-10 w-full pt-12 border-t border-white/10">
                 {trustItems.map((item: any, i: number) => {
                   const TrustIcon = (LucideIcons as any)[item.iconName] || CheckSquare;
                   return (
                     <div key={i} className="flex flex-col items-center gap-3 group">
                        <div 
                          style={{ 
                            backgroundColor: block.content?.ribbonIconBg || 'rgba(255,255,255,0.1)',
                            color: block.content?.ribbonIconColor || '#34d399'
                          }}
                          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-all duration-300"
                        >
                           <TrustIcon className="w-6 h-6" />
                        </div>
                        <span 
                          style={{ color: block.content?.ribbonTextColor || 'rgba(255,255,255,0.7)' }}
                          className="text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors"
                        >
                          {item.label}
                        </span>
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>
      );

    case "quote":
      const quoteIcon = block.content?.iconName ? (LucideIcons as any)[block.content.iconName] : null;
      return (
        <div style={style} className="px-4 w-full max-w-6xl mx-auto">
           <blockquote 
             className={cn(
               "relative bg-white p-8 rounded-3xl shadow-sm border-l-4 overflow-hidden group",
               (isOrganic || isTraditional) ? "border-primary" : "border-slate-200"
             )}
             style={{ borderLeftColor: block.style?.accentColor }}
           >
              <div className="flex gap-4 items-start mb-4">
                 {quoteIcon && React.createElement(quoteIcon, { 
                   className: "w-8 h-8 shrink-0", 
                   style: { color: block.style?.accentColor || (isOrganic || isTraditional ? '#1a7c3e' : '#145DCC') } 
                 })}
                 <div className="space-y-1 flex-1">
                    <h4 className="font-bold text-lg text-slate-900">{block.content?.title || "Reference Title"}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed italic">{block.content?.text || "Quote or reference text goes here..."}</p>
                 </div>
              </div>
              
              {block.content?.reference && (
                <div 
                  className="mt-6 -mx-8 -mb-8 p-4 px-8 bg-emerald-50/50 border-t border-slate-50 flex items-center gap-3 transition-colors group-hover:bg-emerald-50"
                  style={{ backgroundColor: block.style?.refBgColor }}
                >
                   <BookOpen className="w-4 h-4 text-emerald-600" />
                   <span className="text-xs font-bold text-emerald-800 uppercase tracking-tight">{block.content.reference}</span>
                </div>
              )}
           </blockquote>
        </div>
      );
    case "marquee":
      const marqueeItems = block.content?.items || ["Text Point 1", "Text Point 2"];
      return (
        <div style={style} className="overflow-hidden bg-primary py-3 w-full">
           <div className="flex animate-marquee whitespace-nowrap gap-12 items-center">
              {[...marqueeItems, ...marqueeItems].map((txt, i) => (
                <div key={i} className="flex items-center gap-2 text-white font-bold text-sm">
                   <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center text-[10px]">✓</div>
                   {txt}
                </div>
              ))}
           </div>
        </div>
      );

    case "row":
      const colsCount = block.content?.columns || 1;
      const gridClass = gridColsMap[colsCount] || "lg:grid-cols-1";
      const children = block.children || [];

      return (
        <div 
          style={style} 
          className={cn(
            "grid gap-6 px-4 max-w-6xl mx-auto w-full relative", 
            "grid-cols-1 sm:grid-cols-2", 
            gridClass,
            isBuilder && "border-2 border-dashed border-primary/20 p-4 sm:p-6 rounded-[40px] bg-slate-50/5 min-h-[120px] transition-all hover:border-primary/40"
          )}
        >
          {isBuilder && (
            <div className="absolute top-3 left-8 px-2 py-0.5 bg-primary/10 rounded-full flex items-center gap-1.5 z-10">
               <Columns className="w-2.5 h-2.5 text-primary/50" />
               <span className="text-[7px] font-black text-primary/50 uppercase tracking-widest">Layout Row ({colsCount} Columns)</span>
            </div>
          )}

          {Array.from({ length: colsCount }).map((_, colIdx) => {
            const colChildren = children.filter(c => (c.style?.columnIndex ?? 0) === colIdx);
            const colItemIds = colChildren.map(c => c.id);
            
            return (
              <div key={colIdx} className={cn(
                "flex flex-col gap-4 min-h-[60px] relative pointer-events-auto",
                isBuilder && "border border-dashed border-slate-200/30 p-4 rounded-3xl bg-white/5"
              )}>
                {isBuilder && (
                   <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-slate-100 rounded-full flex items-center gap-1 z-10 border border-slate-200 shadow-sm">
                      <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Column {colIdx + 1}</span>
                   </div>
                )}

                {isBuilder ? (
                  <SortableContext items={colItemIds} strategy={verticalListSortingStrategy}>
                    {colChildren.map((child: any) => (
                      <CanvasBlockWrapper 
                        key={child.id} 
                        block={child} 
                        products={products} 
                        store={store}
                        viewMode={viewMode} 
                        isMobile={isMobile}
                        onAddNested={onAddNested}
                        isSelected={selectedBlockId === child.id}
                        selectedBlockId={selectedBlockId}
                        onSelect={onSelect}
                        onRemove={onRemove}
                        onMoveUp={onMoveUp}
                        onMoveDown={onMoveDown}
                        onInsertRequest={onInsertRequest}
                        isBuilder={isBuilder}
                        pageStyle={pageStyle}
                      />
                    ))}
                  </SortableContext>
                ) : (
                  colChildren.map((child: any) => (
                    <BlockRenderer key={child.id} block={child} products={products} store={store} isPreview={isPreview} viewMode={viewMode} pageStyle={pageStyle} />
                  ))
                )}

                {isBuilder && (
                   <button 
                     className="mt-auto pointer-events-auto h-8 border border-dashed border-slate-200 text-slate-300 hover:text-primary hover:border-primary/50 text-[8px] uppercase font-bold rounded-xl bg-white/10 flex items-center justify-center px-3 transition-all"
                     onClick={(e) => { e.stopPropagation(); onAddNested?.(block.id, colIdx); }}
                   >
                     <Plus className="w-3 h-3 mr-1" />
                     Add to Col {colIdx + 1}
                   </button>
                )}
              </div>
            );
          })}
        </div>
      );
    case "accordion":
      const accItems = block.content?.items || [{ id: "1", title: "Item 1", content: "Content 1" }];
      return (
        <div style={style} className="px-4 w-full max-w-6xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {accItems.map((item: any) => (
              <AccordionItem key={item.id} value={item.id} className="border-b-0 mb-2">
                <AccordionTrigger className={cn(
                  "px-6 py-4 rounded-xl hover:no-underline font-bold text-sm text-left transition-all group",
                  isOrganic ? "bg-[#fff] border-2 border-[#d9e8da] text-[#1b5e20] hover:bg-[#f0f7f0]" : 
                  isTraditional ? "bg-[#fff] border-2 border-[#ddd] text-[#1a7c3e] hover:bg-[#e8f5ee]" :
                  "bg-slate-50 hover:bg-slate-100"
                )}>
                  <div className="flex items-center gap-3">
                     {item.iconName && React.createElement((LucideIcons as any)[item.iconName], { className: "w-4 h-4 text-primary shrink-0" })}
                     <div>
                        <p>{item.title}</p>
                        {item.subtitle && <p className="text-[10px] font-normal text-muted-foreground opacity-60">{item.subtitle}</p>}
                     </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className={cn(
                  "px-6 py-4 bg-white rounded-b-xl border -mt-1",
                  isOrganic ? "border-[#d9e8da]" : 
                  isTraditional ? "border-[#ddd]" :
                  "border-slate-50"
                )}>
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                     {item.imageUrl && <img src={item.imageUrl} className="w-full md:w-32 aspect-video object-cover rounded-lg border" />}
                     <div className="text-xs text-muted-foreground leading-relaxed flex-1">
                        {item.content}
                     </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      );
    case "card":
      const IconComp = block.content?.showIcon && block.content?.iconName ? (LucideIcons as any)[block.content.iconName] : null;
      const cardTextAlign = block.style?.textAlign || "left";
      const isHorizontal = block.content?.layout === "horizontal";
      
      return (
        <div 
          style={style} 
          className={cn(
            "px-4 w-full max-w-6xl mx-auto relative overflow-hidden",
            isOrganic && !block.style?.borderWidth && "border-l-4 border-[#2d7a3a] bg-white rounded-r-xl shadow-sm",
            isTraditional && !block.style?.borderWidth && "border-l-4 border-[#1a7c3e] bg-white rounded-r-xl shadow-sm"
          )}
        >
          {block.content?.bgImage && <img src={block.content.bgImage} className="absolute inset-0 w-full h-full object-cover z-0 opacity-40" alt="" />}
          <div className={cn("relative z-10 flex", 
            isHorizontal ? "flex-row items-center gap-4" : "flex-col gap-4",
            {
              "items-start text-left": !isHorizontal && cardTextAlign === "left",
              "items-center text-center": !isHorizontal && cardTextAlign === "center",
              "items-end text-right": !isHorizontal && cardTextAlign === "right",
              "items-stretch text-justify": !isHorizontal && cardTextAlign === "justify"
            }
          )}>
             {IconComp && <IconComp style={{ color: block.content?.iconColor || (isOrganic ? "#2d7a3a" : isTraditional ? "#1a7c3e" : "#145DCC") }} size={block.content?.iconSize || 32} className="shrink-0" />}
             <div className="space-y-1 w-full flex-1">
                <h4 className={cn("font-bold text-xl", (isOrganic || isTraditional) && `text-primary`)}>{block.content?.title || "Feature Title"}</h4>
                <p className="text-sm opacity-80 leading-relaxed">{block.content?.subtitle || "Description placeholder..."}</p>
                {(block.content?.items || []).length > 0 && (
                  <div className={cn("space-y-2 pt-2 w-full flex flex-col", {
                      "items-start": isHorizontal || cardTextAlign === "left",
                      "items-center": !isHorizontal && cardTextAlign === "center",
                      "items-end": !isHorizontal && cardTextAlign === "right",
                      "items-stretch": !isHorizontal && cardTextAlign === "justify"
                  })}>
                    {block.content.items.map((item: string, i: number) => {
                        let prefix;
                        const lStyle = block.content?.listStyle || "check";
                        if (lStyle === "check") prefix = <Check className={cn("w-3.5 h-3.5", (isOrganic || isTraditional) ? "text-primary" : "text-primary")} />;
                        else if (lStyle === "bullet") prefix = <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />;
                        else if (lStyle === "number") prefix = <span className={cn("text-[10px] font-bold", (isOrganic || isTraditional) ? "text-primary" : "text-primary")}>{i+1}.</span>;

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
        </div>
      );
    case "header":
      const HeaderTag = block.content?.level || 'h2';
      const headerSizes: any = { h1: 'text-3xl md:text-7xl', h2: 'text-2xl md:text-5xl', h3: 'text-xl md:text-3xl' };
      const themeActive = isOrganic || isTraditional;
      const isPill = block.style?.borderRadius && block.style.borderRadius > 20 && block.style.backgroundColor;

      return (
        <div 
          style={style} 
          className={cn(
            "px-4 font-headline font-bold leading-tight",
            isPill ? "w-fit mx-auto px-6 py-2" : "w-full",
            themeActive && !block.style?.backgroundColor && "text-center py-12 text-white relative overflow-hidden",
          )}
        >
          {themeActive && !block.style?.backgroundColor && (
             <div className={cn(
               "absolute inset-0 -z-10",
               isOrganic ? "bg-gradient-to-br from-[#1b5e20] via-[#2d7a3a] to-[#388e3c]" : "bg-gradient-to-br from-[#1a7c3e] via-[#0f5a2b] to-[#0a3d1d]"
             )} />
          )}
          <HeaderTag className={headerSizes[HeaderTag]}>
            {renderTextWithHighlights(block.content?.text || "Heading", block.style?.highlightColor)}
          </HeaderTag>
        </div>
      );
    case "paragraph":
      return <div style={style} className="px-4 w-full leading-relaxed whitespace-pre-wrap text-lg opacity-80">{renderTextWithHighlights(block.content?.text || "Text", block.style?.highlightColor)}</div>;
    case "rich-text":
      return (
        <div style={style} className="px-4 w-full">
          <div 
            className="prose prose-sm prose-slate max-w-none prose-p:my-1" 
            dangerouslySetInnerHTML={{ __html: block.content?.html || "Add your rich text content in the sidebar editor." }} 
          />
        </div>
      );
    case "image":
      return <div style={style} className="px-4 w-full">
        {block.content?.url ? (
          <img src={block.content.url} className="w-full h-auto shadow-md rounded-xl" alt="" />
        ) : (
          <div className="w-full aspect-video bg-slate-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-slate-400 gap-2">
            <ImageIcon className="w-10 h-10 opacity-20" />
            <span className="text-[10px] font-black uppercase tracking-widest">Image Placeholder</span>
          </div>
        )}
      </div>;
    case "button":
      return (
        <div style={style} className="px-4 w-full">
          <Button 
            size="lg" 
            className={cn(
              "rounded-2xl px-12 h-16 font-bold text-xl shadow-2xl transition-all hover:scale-105",
              isOrganic ? "bg-[#c9941a] hover:bg-[#b5830e] text-white shadow-primary/30" : 
              isTraditional ? "bg-gradient-to-br from-[#f9a825] to-[#e65c00] hover:opacity-90 text-white shadow-primary/30" : 
              "bg-primary text-white shadow-primary/30"
            )} 
            onClick={() => handleButtonClick()}
          >
            {block.content?.text || "Action Button"}
          </Button>
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
      const carouselItems = block.content?.items || [];
      return (
        <div style={style} className="px-4 w-full max-w-6xl mx-auto">
          {carouselItems.length > 0 ? (
            <Carousel opts={{ align: "start" }} className="w-full">
              <CarouselContent>
                {carouselItems.map((item: any) => (
                  <CarouselItem key={item.id} className={cn(carouselColMapping[carouselCols] || "basis-full", "px-1")}>
                    <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100 h-full flex flex-col">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full aspect-square bg-slate-100 flex items-center justify-center opacity-10"><ImageIcon /></div>
                      )}
                      {(item.title || item.subtitle || item.buttonText) && (
                        <div className="p-3 space-y-1.5 flex-1">
                          {item.title && <h4 className="font-bold text-xs">{item.title}</h4>}
                          {item.subtitle && <p className="text-[10px] text-muted-foreground line-clamp-2">{item.subtitle}</p>}
                          {item.buttonText && <Button variant="secondary" className="w-full h-7 text-[8px] uppercase font-black rounded-lg mt-1">{item.buttonText}</Button>}
                        </div>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-1 h-8 w-8" />
              <CarouselNext className="right-1 h-8 w-8" />
            </Carousel>
          ) : (
            <div className="p-10 bg-slate-50 rounded-3xl text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-2 border-dashed border-slate-200">
               Empty Carousel Placeholder
            </div>
          )}
        </div>
      );
    case "checked-list":
      const listStyle = block.content?.listStyle || "check";
      const listItems = block.content?.items || ["Point 1", "Point 2", "Point 3"];
      return (
        <div style={style} className="px-4 w-full max-w-6xl mx-auto space-y-2">
          {listItems.map((item: string, i: number) => {
            let prefix;
            if (listStyle === "check") {
              prefix = <CheckCircle className={cn("w-5 h-5 shrink-0", (isOrganic || isTraditional) ? "text-primary" : "text-primary")} />;
            } else if (listStyle === "bullet") {
              prefix = <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mx-1" />;
            } else if (listStyle === "number") {
              prefix = <span className={cn("text-[10px] font-bold w-4 shrink-0", (isOrganic || isTraditional) ? "text-primary" : "text-primary")}>{i + 1}.</span>;
            }

            return (
              <div key={i} className="flex items-center gap-3">
                {prefix}
                <span className="text-xl font-medium">{item}</span>
              </div>
            );
          })}
        </div>
      );
    case "product-order-form":
      const productIds = block.content?.productIds || (block.content?.mainProductId ? [block.content.mainProductId] : []);
      const selectedProducts = products.filter(p => productIds.includes(p.id));
      return (
        <div style={style} className="px-4 w-full max-w-5xl mx-auto text-left" data-block-type="product-order-form">
           {selectedProducts.length > 0 ? (
             <LandingPageOrderForm products={selectedProducts} store={store} isOrganic={isOrganic} isTraditional={isTraditional} />
           ) : (
             <div className="p-12 bg-white rounded-[40px] shadow-sm border-2 border-dashed flex flex-col items-center justify-center gap-4 text-slate-300">
                <CreditCard className="w-10 h-10 opacity-10" />
                <span className="text-[10px] font-black uppercase tracking-widest">Select products in sidebar to see order form</span>
             </div>
           )}
        </div>
      );
    default: return null;
  }
}

function LandingPageOrderForm({ products, store, isOrganic, isTraditional }: { products: any[], store: any, isOrganic: boolean, isTraditional: boolean }) {
  const { toast } = useToast();
  const db = useFirestore();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [clientIp, setClientIp] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");

  const product = products.find(p => p.id === selectedProductId) || products[0];

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    paymentMethod: "cod"
  });

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => setClientIp(data.ip))
      .catch(err => console.error("IP Capture Error:", err));
  }, []);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !formData.fullName || !formData.phone || !formData.address) {
      toast({ variant: "destructive", title: "তথ্য অসম্পূর্ণ" });
      return;
    }

    setIsPlacingOrder(true);
    try {
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
        total: Number(product.currentPrice),
        status: "pending",
        paymentStatus: "unpaid",
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
                    <p className={cn("font-black text-sm", (isOrganic || isTraditional) ? "text-[#c0392b]" : "text-primary")}>৳ {p.currentPrice}</p>
                  </div>
                </div>
              ))}
           </div>
        )}
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t">
          <div className="space-y-4">
            <Label className={cn("text-[10px] font-black uppercase tracking-widest", (isOrganic || isTraditional) ? "text-primary" : "text-slate-400")}>আপনার তথ্য</Label>
            <Input placeholder="আপনার পুরো নাম" className="rounded-2xl h-14 bg-white border-2 border-slate-100 px-6 text-lg" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
            <Input placeholder="মোবাইল নাম্বার" className="rounded-2xl h-14 bg-white border-2 border-slate-100 px-6 text-lg" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            <Textarea placeholder="পুরো ঠিকানা (জেলা সহ)" className="rounded-3xl min-h-[120px] bg-white border-2 border-slate-100 p-6 text-lg" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
          </div>
          <div className="space-y-6">
            <div className={cn("p-10 rounded-[40px] border space-y-5", (isOrganic || isTraditional) ? "bg-white border-[#d9e8da]" : "bg-slate-50")}>
              <div className="flex justify-between text-muted-foreground font-bold text-xs uppercase tracking-widest">
                <span>পণ্য মূল্য</span>
                <span>৳ {product?.currentPrice || 0}</span>
              </div>
              <div className="flex justify-between text-muted-foreground font-bold text-xs uppercase tracking-widest">
                <span>ডেলিভারি চার্জ</span>
                <span className="text-primary">ফ্রি</span>
              </div>
              <div className={cn("flex justify-between text-4xl font-black border-t pt-8 mt-4", (isOrganic || isTraditional) ? "text-primary" : "text-primary")}>
                <span className="text-xs pt-4 uppercase">মোট</span>
                <span>৳ {(Number(product?.currentPrice || 0)).toFixed(0)}</span>
              </div>
            </div>
            <Button type="submit" disabled={isPlacingOrder || !product} className={cn("w-full h-20 rounded-[32px] text-2xl font-black uppercase tracking-widest shadow-2xl transition-transform hover:scale-[1.02]", (isOrganic || isTraditional) ? "bg-gradient-to-br from-[#1a7c3e] via-[#0f5a2b] to-[#0a3d1d] hover:opacity-90 shadow-primary/20" : "bg-primary")}>
              {isPlacingOrder ? <Loader2 className="animate-spin" /> : "অর্ডার সম্পন্ন করুন"}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
