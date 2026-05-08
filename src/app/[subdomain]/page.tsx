import { Metadata, ResolvingMetadata } from "next";
import { getStoreBySubdomain, getPageBySlug } from "@/lib/store-server";
import StorefrontClient from "./StorefrontClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: Promise<{ subdomain: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { subdomain } = await params;
  const store = await getStoreBySubdomain(subdomain);

  if (!store) return { title: "Store Not Found" };

  const title = store.homePageTitle || store.name || subdomain;
  const description = store.description || `Welcome to ${title}. Discover our curated collection of premium products.`;
  const logo = store.logo || store.homeBanner || "";

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: logo ? [logo] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: logo ? [logo] : [],
    },
  };
}



export default async function StorefrontPage({ params }: Props) {
  const { subdomain } = await params;
  const store = await getStoreBySubdomain(subdomain);
  
  if (!store) return null;
  
  const indexPage = await getPageBySlug(store.id, "index");
  
  return <StorefrontClient initialStore={store} initialSubdomain={subdomain} initialPage={indexPage} />;
}
