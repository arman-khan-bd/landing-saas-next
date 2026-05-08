"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Image as ImageIcon } from "lucide-react";

interface CarouselBlockProps {
  block: any;
  style: React.CSSProperties;
  handleButtonClick: (link?: string, targetId?: string) => void;
  renderTextWithHighlights: (text: string, highlightColor?: string) => React.ReactNode;
}

export const CarouselBlock = ({ block, style, handleButtonClick, renderTextWithHighlights }: CarouselBlockProps) => {
  const carouselItems = block.content?.items || [];
  const carouselSettings = block.content?.settings || {
    showArrows: true,
    showDots: true,
    autoplay: false,
    autoplayInterval: 3000,
    loop: true,
    desktopItems: 1,
    gap: 16
  };

  const renderCarouselItem = (item: any) => {
    const type = item.type || block.content?.type || "image";
    const itemBg = item.bgColor || block.content?.itemBgColor || "#ffffff";
    const itemTextColor = item.textColor || block.content?.itemTextColor || "#1a1a1a";
    const textPos = item.textPosition || "center";
    const overlayOpacity = item.overlayOpacity ?? 0.4;
    
    const posClasses = {
      'top-left': 'items-start justify-start text-left',
      'top-center': 'items-center justify-start text-center',
      'top-right': 'items-end justify-start text-right',
      'center-left': 'items-start justify-center text-left',
      'center': 'items-center justify-center text-center',
      'center-right': 'items-end justify-center text-right',
      'bottom-left': 'items-start justify-end text-left',
      'bottom-center': 'items-center justify-end text-center',
      'bottom-right': 'items-end justify-end text-right',
    }[textPos as string] || 'items-center justify-center text-center';

    return (
      <div 
        className={cn(
          "relative h-full w-full rounded-2xl sm:rounded-[40px] overflow-hidden flex flex-col transition-all duration-700 min-h-[400px] sm:min-h-[600px]",
          type === "box" ? "p-6 sm:p-12 justify-center" : ""
        )}
        style={{ 
          backgroundColor: type === "box" ? itemBg : "#000000", 
          color: itemTextColor,
          isolation: 'isolate',
          transform: 'translateZ(0)'
        }}
      >
        {/* Background Layer */}
        {type === "image" && item.image && (
          <div className="absolute inset-0 z-0">
            <img 
              src={item.image} 
              className="w-full h-full object-cover" 
              style={{ 
                width: item.width ? `${item.width}%` : '100%',
                margin: '0 auto'
              }}
              alt={item.header || ""} 
            />
            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />
          </div>
        )}
        
        {type === "video" && item.videoUrl && (
          <div className="absolute inset-0 z-0 bg-black">
             <iframe 
                src={`https://www.youtube.com/embed/${item.videoUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/)?.[1]}?autoplay=1&controls=0&loop=1&playlist=${item.videoUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/)?.[1]}`} 
                className="w-full h-full scale-150" 
                allow="autoplay; encrypted-media"
                allowFullScreen 
             />
             <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />
          </div>
        )}

        {/* Content Overlay */}
        <div className={cn("relative z-10 p-8 sm:p-20 flex flex-col h-full w-full", posClasses)}>
          <div className="max-w-3xl space-y-4 sm:space-y-6">
            {item.header && (
              <h3 
                className="text-3xl sm:text-6xl font-black uppercase tracking-tighter leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-700"
                style={{ color: item.headerColor || itemTextColor }}
              >
                {renderTextWithHighlights(item.header, block.style?.highlightColor)}
              </h3>
            )}
            {item.paragraph && (
              <p 
                className="text-sm sm:text-xl opacity-90 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100"
                style={{ color: item.paragraphColor || itemTextColor }}
              >
                {renderTextWithHighlights(item.paragraph, block.style?.highlightColor)}
              </p>
            )}
            {(item.buttonLabel) && (
              <div className="pt-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                <Button 
                  className="rounded-full px-10 h-14 sm:h-16 font-black uppercase tracking-widest shadow-2xl hover:scale-110 transition-all duration-300 border-none text-xs sm:text-sm"
                  style={{ 
                    backgroundColor: item.btnBg || '#ffffff', 
                    color: item.btnTextColor || '#000000' 
                  }}
                  onClick={() => handleButtonClick(item.buttonLink, item.buttonTargetId)}
                >
                  {renderTextWithHighlights(item.buttonLabel, block.style?.highlightColor)}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (carouselItems.length === 0) {
     return (
       <div id={block.id} style={finalStyle} className="px-4 w-full">
         <div className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center gap-4 text-slate-400">
            <ImageIcon className="w-12 h-12 opacity-10" />
            <p className="text-[10px] font-black uppercase tracking-widest">Setup your carousel items in sidebar</p>
         </div>
       </div>
     );
  }

  return (
    <div id={block.id} style={style} className="px-4 w-full max-w-[1600px] mx-auto group/carousel relative">
      <Carousel 
        opts={{
          align: "start",
          loop: carouselSettings.loop,
        }}
        plugins={carouselSettings.autoplay ? [
          Autoplay({
            delay: carouselSettings.autoplayInterval || 3000,
            stopOnInteraction: false,
          })
        ] : []}
        className="w-full"
      >
        <CarouselContent className={cn("-ml-4", `gap-${carouselSettings.gap || 0}`)}>
          {carouselItems.map((item: any, idx: number) => (
            <CarouselItem key={idx} className={cn(
              "pl-4",
              carouselSettings.desktopItems === 1 ? "basis-full" : 
              carouselSettings.desktopItems === 2 ? "basis-full md:basis-1/2" : 
              carouselSettings.desktopItems === 3 ? "basis-full md:basis-1/3" : 
              "basis-full md:basis-1/4"
            )}>
              {renderCarouselItem(item)}
            </CarouselItem>
          ))}
        </CarouselContent>
        {carouselSettings.showArrows && (
          <>
            <CarouselPrevious className="flex -left-4 sm:-left-8 opacity-0 group-hover/carousel:opacity-100 transition-all bg-white/90 hover:bg-white text-slate-900 border-none shadow-2xl h-10 w-10 sm:h-14 sm:w-14 z-20" />
            <CarouselNext className="flex -right-4 sm:-right-8 opacity-0 group-hover/carousel:opacity-100 transition-all bg-white/90 hover:bg-white text-slate-900 border-none shadow-2xl h-10 w-10 sm:h-14 sm:w-14 z-20" />
          </>
        )}
      </Carousel>
    </div>
  );
};
