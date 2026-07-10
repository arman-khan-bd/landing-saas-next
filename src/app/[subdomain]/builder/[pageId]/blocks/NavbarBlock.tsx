"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import * as LucideIcons from "lucide-react";
import { Menu } from "lucide-react";

interface NavbarBlockProps {
  block: any;
  isBuilder: boolean;
  handleButtonClick: (link?: string, targetId?: string) => void;
  renderTextWithHighlights: (text: string, highlightColor?: string) => React.ReactNode;
}

export const NavbarBlock = ({ block, isBuilder, handleButtonClick, renderTextWithHighlights }: NavbarBlockProps) => {
  const LogoIcon = (LucideIcons as any)[block.content?.logoIcon] || Menu;
  const navItems = block.content?.items || [];
  const showCta = block.content?.showCta;
  const navPosition = block.content?.position || "normal"; 
  const isTransparent = block.content?.transparent;
  
  const posStyles: any = {
    normal: { position: 'relative' },
    sticky: { position: 'sticky', top: 0, zIndex: 40 },
    fixed: { 
      position: isBuilder ? 'sticky' : 'fixed', 
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
            <span className="font-headline font-black text-sm sm:text-lg uppercase tracking-tight">{renderTextWithHighlights(block.content?.logoText || "LOGO", block.style?.highlightColor)}</span>
          )}
        </div>
      )}
      <div className="hidden sm:flex items-center gap-6">
        {navItems.filter((i: any) => (i.position || 'center') === pos).map((item: any) => (
          <button key={item.id} onClick={(e) => {
            if (item.targetId) {
              e.stopPropagation();
            }
            handleButtonClick(item.link, item.targetId);
          }} className="text-sm font-bold opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap">
            {renderTextWithHighlights(item.label, block.style?.highlightColor)}
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
           <Button key={btn.id} style={btnStyle} className="font-bold whitespace-nowrap transition-transform hover:scale-105" onClick={() => handleButtonClick(btn.link)}>
              {renderTextWithHighlights(btn.label, block.style?.highlightColor)}
           </Button>
         );
      })}
      {showCta && block.content?.ctaPosition === pos && (
        <Button 
          size="sm" 
          className={cn("rounded-xl h-8 sm:h-9 px-4 sm:px-6 font-bold text-[10px] sm:text-xs uppercase tracking-widest")} 
          onClick={() => handleButtonClick(block.content.ctaLink)}
        >
          {renderTextWithHighlights(block.content.ctaText, block.style?.highlightColor)}
        </Button>
      )}
    </div>
  );

  return (
    <div 
      id={block.id}
      style={{ 
        backgroundColor: isTransparent ? 'transparent' : (block.content?.backgroundColor || '#ffffff'),
        color: block.content?.textColor || '#1a1a1a',
        borderBottomColor: isTransparent ? 'transparent' : 'rgba(0,0,0,0.05)',
        ...posStyles[navPosition],
      }} 
      className={cn(
        "w-full px-4 sm:px-6 py-3 sm:py-4 border-b transition-all duration-300",
        !isTransparent && "backdrop-blur-md shadow-sm",
        navPosition === "fixed" && !isBuilder && "left-0 right-0"
      )}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-3 items-center gap-2 sm:gap-4">
        {renderNavItems("left")}
        {renderNavItems("center")}
        {renderNavItems("right")}
      </div>
    </div>
  );
};
