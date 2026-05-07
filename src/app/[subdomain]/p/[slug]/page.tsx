import { getStoreBySubdomain, getPageBySlug } from "@/lib/store-server";
import DynamicClientPage from "./client-page";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ subdomain: string; slug: string }>;
}

export default async function Page({ params }: Props) {
  const { subdomain, slug } = await params;
  
  const store = await getStoreBySubdomain(subdomain);
  if (!store) return notFound();
  
  const page = await getPageBySlug(store.id, slug);
  if (!page) return notFound();

  // We can also pre-fetch some products if needed, but let's keep it lean for fast initial load.
  // The first section's data is now available on the server.
  
  return (
    <DynamicClientPage 
      initialPage={page} 
      initialStore={store} 
      subdomain={subdomain} 
      slug={slug} 
    />
  );
}
