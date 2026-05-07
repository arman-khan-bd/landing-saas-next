"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PackageCardBlockProps {
  block: any;
  style: React.CSSProperties;
  handleButtonClick: (link?: string, targetId?: string) => void;
}

export const PackageCardBlock = ({ block, style, handleButtonClick }: PackageCardBlockProps) => {
  const packages = block.content?.packages || [];
  const packSettings = block.content?.settings || {
    desktopColumns: 3,
    gap: 20
  };

  return (
    <div id={block.id} style={style} className="px-4 w-full max-w-7xl mx-auto">
      <div className={cn(
        "grid gap-6 md:gap-8",
        packSettings.desktopColumns === 1 ? "grid-cols-1" :
        packSettings.desktopColumns === 2 ? "grid-cols-1 md:grid-cols-2" :
        packSettings.desktopColumns === 3 ? "grid-cols-1 md:grid-cols-3" :
        "grid-cols-1 md:grid-cols-4"
      )} style={{ gap: `${packSettings.gap || 20}px` }}>
        {packages.map((pkg: any, idx: number) => (
          <div 
            key={idx}
            className={cn(
              "relative overflow-hidden rounded-[32px] p-8 md:p-12 flex flex-col min-h-[400px] transition-all duration-500 hover:scale-[1.02] group shadow-xl",
              pkg.isFeatured ? "ring-4 ring-primary ring-offset-4" : ""
            )}
            style={{ 
              backgroundColor: pkg.bgColor || "#ffffff",
              color: pkg.textColor || "#1a1a1a"
            }}
          >
            {/* Background Layer */}
            {pkg.bgImage && (
              <div className="absolute inset-0 z-0">
                <img src={pkg.bgImage} className="w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-700" alt="" />
              </div>
            )}
            
            {/* Texture Overlay */}
            {pkg.texture && pkg.texture !== "none" && (
              <div className="absolute inset-0 z-0 pointer-events-none" style={{
                backgroundImage: pkg.texture === "dots" ? "radial-gradient(circle, currentColor 1px, transparent 1px)" :
                               pkg.texture === "grid" ? "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)" :
                               "repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)",
                backgroundSize: pkg.texture === "grid" ? "20px 20px" : "15px 15px",
                opacity: 0.05
              }} />
            )}

            <div className="relative z-10 flex flex-col h-full">
              {pkg.badge && (
                <div className="mb-4">
                  <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {pkg.badge}
                  </span>
                </div>
              )}
              <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none mb-2">{pkg.header}</h3>
              <p className="text-sm md:text-base opacity-70 font-medium leading-relaxed mb-8">{pkg.subtitle}</p>
              
              {pkg.price && (
                 <div className="mb-8 mt-auto">
                    <span className="text-4xl md:text-5xl font-black">{pkg.price}</span>
                    {pkg.priceUnit && <span className="text-xs font-bold opacity-50 ml-1">/{pkg.priceUnit}</span>}
                 </div>
              )}

              <div className="mt-auto pt-6">
                <Button 
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest transition-all group-hover:shadow-2xl"
                  style={{ 
                    backgroundColor: pkg.btnBg || "#1a1a1a", 
                    color: pkg.btnTextColor || "#ffffff" 
                  }}
                  onClick={() => handleButtonClick(pkg.buttonLink, pkg.buttonTargetId)}
                >
                  {pkg.buttonLabel || "Get Started"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
