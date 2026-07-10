"use client";

import React, { useState, useEffect, useRef } from "react";
import { BlockRenderer } from "./block-renderer";
import { Loader2 } from "lucide-react";

interface LazySectionProps {
  block: any;
  products: any[];
  store: any;
  pageStyle: any;
  index: number;
}

export function LazySection({ block, products, store, pageStyle, index, isPreview = false }: LazySectionProps & { isPreview?: boolean }) {
  const [isVisible, setIsVisible] = useState(index === 0); // First section always visible
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // Start loading 200px before it comes into view
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <div ref={ref} className="min-h-[100px]">
      {isVisible ? (
        <BlockRenderer 
          block={block} 
          products={products} 
          store={store} 
          isPreview={isPreview} 
          pageStyle={pageStyle} 
        />
      ) : (
        <div className="flex items-center justify-center py-20 opacity-10">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}
    </div>
  );
}
