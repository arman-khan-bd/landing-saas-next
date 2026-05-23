import { Metadata, ResolvingMetadata } from "next";
import { AlertCircle } from "lucide-react";
import { getStoreBySubdomain, getPageBySlug, getProductsByStore } from "@/lib/store-server";
import DynamicPageClient from "./DynamicPageClient";

// Force dynamic rendering to always fetch latest page configurations
export const revalidate = 0; // Disable cache or set to low value like 0 for builder previews

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

  const page = await getPageBySlug(store.id, slug);
  if (!page) return { title: `${store.name || subdomain} - Page Not Found` };

  const title = page.title || `${page.name} - ${store.name || subdomain}`;
  const description = page.description || store.description || `Welcome to ${title}`;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
    },
  };
}

export default async function Page({ params }: Props) {
  const { subdomain, slug } = await params;
  const store = await getStoreBySubdomain(subdomain);

  if (!store) {
    return (
      <div className="flex flex-col h-screen items-center justify-center space-y-4 px-6 text-center bg-white">
        <AlertCircle className="w-16 h-16 text-destructive opacity-20" />
        <h1 className="text-3xl font-headline font-bold">Store Not Found</h1>
        <p className="text-muted-foreground leading-relaxed">The store you're trying to reach does not exist.</p>
      </div>
    );
  }

  const page = await getPageBySlug(store.id, slug);

  if (!page) {
    return (
      <div className="flex flex-col h-screen items-center justify-center space-y-4 px-6 text-center bg-white">
        <AlertCircle className="w-16 h-16 text-destructive opacity-20" />
        <h1 className="text-3xl font-headline font-bold">404 - Page Not Found</h1>
        <p className="text-muted-foreground leading-relaxed">The page you're looking for was not found or is currently private.</p>
      </div>
    );
  }

  const products = await getProductsByStore(store.id);

  return (
    <DynamicPageClient
      initialStore={store}
      initialPage={page}
      initialProducts={products}
      initialSubdomain={subdomain}
      initialSlug={slug}
    />
  );
}
