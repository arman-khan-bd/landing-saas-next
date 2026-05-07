"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Phone, ArrowRight, Star } from "lucide-react";

interface HeroBlockProps {
  block: any;
  style: React.CSSProperties;
  renderTextWithHighlights: (text: string, highlightColor?: string) => React.ReactNode;
  handleButtonClick: (link?: string, targetId?: string) => void;
  isOrganic?: boolean;
  isTraditional?: boolean;
}

export const HeroBlock = ({ block, style, renderTextWithHighlights, handleButtonClick, isOrganic = false, isTraditional = false }: HeroBlockProps) => {
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
    <div id={block.id} style={{ ...style, ...heroBgStyle }} className="w-full relative overflow-hidden">
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

       <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-24 text-center flex flex-col items-center">
          <div 
            style={{ color: block.content?.badgeColor || '#facc15' }}
            className="mb-6 sm:mb-8 inline-flex items-center px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white/10 border border-white/20 text-[9px] sm:text-xs font-black uppercase tracking-[0.2em]"
          >
            {block.content?.badgeText || "BSTI অনুমোদিত • BCSIR ল্যাব টেস্টেড"}
          </div>

          <h1 
            style={{ color: block.content?.titleColor || '#ffffff' }}
            className="text-2xl xs:text-4xl sm:text-7xl font-headline font-black leading-[1.1] sm:leading-[0.95] mb-4 tracking-tighter max-w-3xl"
          >
            {renderTextWithHighlights(block.content?.title || "অসুস্থ ব্যক্তি ছাড়া সুস্থতার মূল্য কেউ বোঝে না", block.style?.highlightColor)}
          </h1>

          <p 
            style={{ color: block.content?.subtitleColor || 'rgba(253, 224, 71, 0.9)' }}
            className="text-sm sm:text-2xl font-bold mb-6 sm:mb-10 tracking-tight"
          >
            {block.content?.subtitle || "শক্তি ও সুস্বাস্থ্যের নির্ভরযোগ্য উপহার"}
          </p>

          <div className="bg-white rounded-2xl sm:rounded-full px-4 sm:px-8 py-2 sm:py-3 mb-8 sm:mb-12 shadow-2xl shadow-black/20 flex items-center gap-2 sm:gap-4 border-2 border-white/20">
             <span 
               style={{ color: block.content?.brandTitleColor || '#1a7c3e' }}
               className="text-lg sm:text-3xl font-black tracking-tighter"
             >
               "{block.content?.brandTitle || "সাম"}"
             </span>
             <div className="h-4 sm:h-6 w-px bg-slate-200" />
             <span 
               style={{ color: block.content?.brandSubtitleColor || '#64748b' }}
               className="text-[9px] sm:text-sm font-bold uppercase tracking-widest pt-0.5 sm:pt-1"
             >
               {block.content?.brandSubtitle || "প্রাকৃতিক স্বাস্থ্য সুরক্ষা"}
             </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full justify-center items-center mb-12 sm:mb-16 px-4">
             <Button 
               size="lg" 
               style={getButtonStyle('cta')}
               className="rounded-xl sm:rounded-2xl h-14 sm:h-20 px-8 sm:px-14 text-base sm:text-2xl font-black shadow-2xl transition-all hover:scale-105 uppercase tracking-tighter flex items-center gap-3 w-full sm:w-auto"
               onClick={() => {
                  if (block.content?.ctaAction === 'scroll' && block.content?.ctaTargetId) {
                    handleButtonClick(undefined, block.content.ctaTargetId);
                  } else {
                    handleButtonClick();
                  }
               }}
             >
               {block.content?.ctaText || "অর্ডার করতে এখানে ক্লিক করুন"}
               <ArrowRight className="w-5 h-5 sm:w-7 sm:h-7" />
             </Button>

             <Button 
               size="lg" 
               variant="outline"
               style={getButtonStyle('phone')}
               className="rounded-xl sm:rounded-2xl h-14 sm:h-20 px-8 sm:px-12 text-base sm:text-2xl font-black shadow-xl transition-all hover:scale-105 border-2 w-full sm:w-auto flex items-center gap-3"
               onClick={() => {
                  if (block.content?.phone) window.location.href = `tel:${block.content.phone}`;
               }}
             >
               <Phone className="w-4 h-4 sm:w-6 sm:h-6" />
               {block.content?.phone || "ফোন করুন"}
             </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-4 sm:mt-8">
             {trustItems.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2 group">
                   <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shadow-lg transition-all group-hover:scale-110">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] sm:text-xs font-black text-white leading-none uppercase tracking-widest">{item.title || "Quality"}</p>
                      <p className="text-[8px] sm:text-[10px] font-bold text-white/50">{item.subtitle || "Guaranteed"}</p>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};
