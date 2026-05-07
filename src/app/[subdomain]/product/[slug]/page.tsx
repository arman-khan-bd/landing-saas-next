import { Metadata, ResolvingMetadata } from "next";
import { getStoreBySubdomain, getProductBySlug } from "@/lib/store-server";
import ProductClient from "./ProductClient";

type Props = {
  params: Promise<{ subdomain: string; slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { subdomain, slug } = await params;
  const store = await getStoreBySubdomain(subdomain);
  
  if (!store) return { title: "Store Not Found" };
  
  const product = await getProductBySlug(store.id, slug);
  
  if (!product) return { title: "Product Not Found" };

  const title = `${product.name} | ${store.name || subdomain}`;
  const description = product.description?.substring(0, 160) || `Buy ${product.name} at ${store.name}. Best prices and quality.`;
  const image = product.featuredImage || product.gallery?.[0] || "";

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: image ? [image] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { subdomain, slug } = await params;
  const store = await getStoreBySubdomain(subdomain);
  const product = store ? await getProductBySlug(store.id, slug) : null;

  const jsonLd = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.featuredImage || product.gallery?.[0],
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": store?.name
    },
    "offers": {
      "@type": "Offer",
      "url": `https://${subdomain}.ihut.shop/product/${slug}`,
      "priceCurrency": "USD",
      "price": product.currentPrice,
      "availability": "https://schema.org/InStock"
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductClient initialProduct={product} initialStore={store} />
    </>
  );
}
