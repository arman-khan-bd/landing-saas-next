"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Plus, Trash2, GripVertical, CheckCircle, 
  ChevronUp, ChevronDown, Image as ImageIcon,
  Columns, LayoutList, Zap, ArrowRight, Star, BookOpen, Quote,
  Phone, Microscope, Banknote, RotateCcw, CheckSquare, Menu, Play, Code, Info
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface GenericBlockProps {
  block: any;
  style: React.CSSProperties;
  handleButtonClick: (link?: string, targetId?: string) => void;
  renderTextWithHighlights: (text: string, highlightColor?: string) => React.ReactNode;
}

export const HeaderBlock = ({ block, style, renderTextWithHighlights }: GenericBlockProps) => {
  const Tag = (block.content?.level || "h2") as keyof JSX.IntrinsicElements;
  const defaultSizes: any = {
    h1: "text-4xl sm:text-6xl",
    h2: "text-3xl sm:text-5xl",
    h3: "text-2xl sm:text-4xl",
    h4: "text-xl sm:text-3xl"
  };
  const sizeClass = style.fontSize ? "" : (defaultSizes[Tag as string] || defaultSizes.h2);

  return (
    <div id={block.id} style={style} className="px-4 w-full">
      <Tag className={cn("font-headline tracking-tight leading-[1.1] sm:leading-tight", sizeClass)}>
        {renderTextWithHighlights(block.content?.title || block.content?.text || "Headline Text", block.style?.highlightColor)}
      </Tag>
    </div>
  );
};

export const ParagraphBlock = ({ block, style }: GenericBlockProps) => (
  <div id={block.id} style={style} className="px-4 w-full max-w-4xl mx-auto">
    <p className="opacity-80 leading-relaxed font-medium">
      {block.content?.text || "Paragraph text goes here..."}
    </p>
  </div>
);

export const ButtonBlock = ({ block, style, handleButtonClick }: GenericBlockProps) => {
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
    <div id={block.id} style={style} className="px-4 w-full flex justify-center flex-col items-center">
      <Button 
        size="lg" 
        style={bs}
        className="rounded-xl sm:rounded-2xl px-6 sm:px-12 h-12 sm:h-16 font-bold text-base sm:text-xl shadow-2xl transition-all hover:scale-105 w-full sm:w-auto"
        onClick={(e) => {
          if (block.content?.actionType === 'scroll' && block.content?.targetId) {
            e.stopPropagation();
            handleButtonClick(undefined, block.content.targetId);
          } else {
            handleButtonClick();
          }
        }}
      >
        {block.content?.text || "Action Button"}
      </Button>
    </div>
  );
};

export const MarqueeBlock = ({ block, style }: GenericBlockProps) => (
  <div id={block.id} style={style} className="w-full bg-slate-900 overflow-hidden py-4 sm:py-8 select-none">
    <div className="flex whitespace-nowrap animate-marquee">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex items-center gap-8 sm:gap-16 mx-4 sm:mx-8">
          {(block.content?.items || []).map((text: string, idx: number) => (
            <div key={idx} className="flex items-center">
              <span className="text-white font-black uppercase tracking-tighter opacity-100">{text}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const CardBlock = ({ block, style }: GenericBlockProps) => {
  const Icon = (LucideIcons as any)[block.content?.iconName || "Star"] || Star;
  return (
    <div id={block.id} style={style} className="px-4 w-full max-w-md mx-auto">
      <div className="p-6 sm:p-10 bg-white rounded-2xl sm:rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100 flex flex-col gap-4 sm:gap-6 group transition-all hover:scale-105">
        {block.content?.showIcon !== false && (
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl sm:rounded-3xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
        )}
        <div className="space-y-2 sm:space-y-3">
          <h4 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight">{block.content?.title || "Feature Title"}</h4>
          <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed">{block.content?.subtitle || "Feature description goes here..."}</p>
        </div>
        {(block.content?.items || []).length > 0 && (
          <div className="space-y-2 sm:space-y-3 pt-2 sm:pt-4">
            {block.content.items.map((item: string, i: number) => (
              <div key={i} className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-700">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const AccordionBlock = ({ block, style }: GenericBlockProps) => (
  <div id={block.id} style={style} className="px-4 w-full max-w-4xl mx-auto">
    <Accordion type="single" collapsible className="w-full space-y-3 sm:space-y-4">
      {(block.content?.items || []).map((item: any, i: number) => (
        <AccordionItem key={i} value={`item-${i}`} className="border-none bg-white rounded-xl sm:rounded-3xl px-4 sm:px-8 shadow-sm hover:shadow-md transition-all">
          <AccordionTrigger className="hover:no-underline py-4 sm:py-6">
            <span className="text-left text-sm sm:text-xl font-black uppercase tracking-tight">{item.title}</span>
          </AccordionTrigger>
          <AccordionContent className="pb-4 sm:pb-8 text-sm sm:text-lg text-slate-500 font-medium leading-relaxed">
            {item.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
);

export const VideoBlock = ({ block, style }: GenericBlockProps) => {
  const videoId = block.content?.url?.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/)?.[1];
  return (
    <div id={block.id} style={style} className="px-4 w-full max-w-6xl mx-auto">
       <div className="aspect-video w-full rounded-2xl sm:rounded-[40px] overflow-hidden shadow-2xl bg-black">
          {videoId ? (
            <iframe 
              src={`https://www.youtube.com/embed/${videoId}`} 
              className="w-full h-full" 
              allowFullScreen 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/20">
              <Play className="w-12 h-12 sm:w-20 sm:h-20" />
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Enter valid YouTube URL in sidebar</p>
            </div>
          )}
       </div>
    </div>
  );
};

export const ImageBlock = ({ block, style }: GenericBlockProps) => (
  <div id={block.id} style={style} className="px-4 w-full flex justify-center">
    <div className={cn(
      "overflow-hidden shadow-2xl",
      block.content?.borderRadius === 'full' ? 'rounded-full' : 
      block.content?.borderRadius === 'none' ? 'rounded-none' : 
      'rounded-2xl sm:rounded-[40px]'
    )} style={{ width: block.content?.width ? `${block.content.width}%` : 'auto', maxWidth: '100%' }}>
      {block.content?.url ? (
        <img src={block.content.url} alt="" className="w-full h-auto object-cover transition-transform duration-700 hover:scale-105" />
      ) : (
        <div className="aspect-video bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-300">
           <ImageIcon className="w-12 h-12 opacity-10" />
           <p className="text-[10px] font-black uppercase tracking-widest">Upload image in sidebar</p>
        </div>
      )}
    </div>
  </div>
);

export const SelectorBlock = ({ block, style }: GenericBlockProps) => {
  const options = block.content?.options || [{ label: "Option 1", value: "1" }, { label: "Option 2", value: "2" }];
  const selectorType = block.content?.selectorType || "pills";
  return (
    <div id={block.id} style={style} className="px-4 w-full max-w-6xl mx-auto flex flex-col items-center gap-4">
      {block.content?.title && <h4 className="text-lg font-bold mb-2">{block.content.title}</h4>}
      <div className={cn(
        "flex flex-wrap gap-2 justify-center",
        selectorType === "cards" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 w-full" : ""
      )}>
        {options.map((opt: any, idx: number) => (
          <div 
            key={idx}
            onClick={(e) => {
              if (opt.targetId) {
                e.stopPropagation();
                const el = document.getElementById(opt.targetId);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className={cn(
              "cursor-pointer transition-all duration-300",
              selectorType === "pills" ? "px-6 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs" : 
              "p-6 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md flex flex-col gap-2"
            )}
          >
            <span className={cn(selectorType === "pills" ? "" : "text-sm font-black uppercase")}>{opt.label}</span>
            {selectorType === "cards" && opt.description && <p className="text-xs text-slate-500">{opt.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CheckedListBlock = ({ block, style }: GenericBlockProps) => (
  <div id={block.id} style={style} className="px-4 w-full max-w-6xl mx-auto space-y-3 sm:space-y-4">
    {(block.content?.items || []).map((item: string, i: number) => (
      <div key={i} className="flex items-start gap-3 sm:gap-4">
        <div className="mt-1 bg-primary/10 p-1 sm:p-1.5 rounded-full text-primary shadow-sm">
          <CheckCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-primary text-white" />
        </div>
        <span className="text-base sm:text-xl font-medium pt-0.5">{item}</span>
      </div>
    ))}
  </div>
);
