import { Metadata, ResolvingMetadata } from "next";
import { getStoreBySubdomain } from "@/lib/store-server";
import StoreLayoutClient from "./layout-client";
import { FirebaseClientProvider } from "@/firebase/client-provider";

type Props = {
  params: Promise<{ subdomain: string }>;
  children: React.ReactNode;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { subdomain } = await params;
  const store = await getStoreBySubdomain(subdomain);

  if (!store) {
    return {
      title: "Store Not Found",
    };
  }

  const title = store.name || subdomain;
  const description = store.description || `Welcome to ${title} official storefront. Shop our latest collection.`;
  const logo = store.logo || "";
  const favicon = store.favicon || logo || "/favicon.ico";

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
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
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
  };
}

export default async function SubdomainLayout({ children, params }: Props) {
  const { subdomain } = await params;
  const store = await getStoreBySubdomain(subdomain);

  return (
    <FirebaseClientProvider>
      <StoreLayoutClient initialStore={store} initialSubdomain={subdomain}>
        {children}
      </StoreLayoutClient>
    </FirebaseClientProvider>
  );
}
