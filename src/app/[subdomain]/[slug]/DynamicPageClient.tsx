"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { BlockRenderer } from "../builder/[pageId]/block-renderer";

interface DynamicPageClientProps {
  initialStore: any;
  initialPage: any;
  initialProducts: any[];
  initialSubdomain: string;
  initialSlug: string;
}

export default function DynamicPageClient({
  initialStore,
  initialPage,
  initialProducts,
  initialSubdomain,
  initialSlug
}: DynamicPageClientProps) {
  const [store] = useState<any>(initialStore);
  const [page] = useState<any>(initialPage);
  const [products] = useState<any[]>(initialProducts || []);

  if (!page || !store) {
    return (
      <div className="flex flex-col h-screen items-center justify-center space-y-4 px-6 text-center bg-white">
        <AlertCircle className="w-16 h-16 text-destructive opacity-20" />
        <h1 className="text-3xl font-headline font-bold">404 - Not Found</h1>
        <p className="text-muted-foreground leading-relaxed">The page you're looking for was not found or is currently private.</p>
      </div>
    );
  }

  const pageStyle: any = page.pageStyle || {};

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: pageStyle.backgroundColor || "#FFFFFF",
        backgroundImage: pageStyle.backgroundImage ? `url(${pageStyle.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        paddingTop: `${pageStyle.paddingTop || 0}px`,
        paddingBottom: `${pageStyle.paddingBottom || 40}px`,
      }}
    >
      <div className="py-0">
        {page.config?.map((block: any) => (
          <BlockRenderer
            key={block.id}
            block={block}
            products={products}
            store={store}
            pageStyle={pageStyle}
          />
        ))}
      </div>
    </div>
  );
}
