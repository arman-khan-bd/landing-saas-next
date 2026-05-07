import { getStoreBySubdomain, getPageBySlug } from "@/lib/store-server";
import DynamicClientPage from "./client-page";
import { notFound } from "next/navigation";

import { Metadata, ResolvingMetadata } from "next";

interface Props {
  params: Promise<{ subdomain: string; slug: string }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { subdomain, slug } = await params;
  
  const store = await getStoreBySubdomain(subdomain).catch(() => null);
  const page = store ? await getPageBySlug(store.id, slug).catch(() => null) : null;

  if (!page) {
    return { title: "Page Not Found" };
  }

  const seo = page.pageStyle?.seoSettings || {};
  const fallbackTitle = page.title || "Landing Page";
  
  return {
    title: seo.title || fallbackTitle,
    description: seo.description || `Welcome to ${fallbackTitle}`,
    keywords: seo.keywords || "",
    openGraph: {
      title: seo.title || fallbackTitle,
      description: seo.description || `Welcome to ${fallbackTitle}`,
      images: seo.ogImage ? [seo.ogImage] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title || fallbackTitle,
      description: seo.description || `Welcome to ${fallbackTitle}`,
      images: seo.ogImage ? [seo.ogImage] : [],
    }
  };
}

export default async function Page({ params }: Props) {
  const { subdomain, slug } = await params;
  
  const store = await getStoreBySubdomain(subdomain).catch(() => null);
  const page = store ? await getPageBySlug(store.id, slug).catch(() => null) : null;

  // Let the client component handle the 404 state if both server and client fetches fail.
  // This prevents SSR crashes from showing a hard Next.js 404.
  
  return (
    <DynamicClientPage 
      initialPage={page} 
      initialStore={store} 
      subdomain={subdomain} 
      slug={slug} 
    />
  );
}
