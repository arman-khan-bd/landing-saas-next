import { MetadataRoute } from 'next';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getStoreBySubdomain } from '@/lib/store-server';

export default async function sitemap({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<MetadataRoute.Sitemap> {
  const { subdomain } = await params;
  const store = await getStoreBySubdomain(subdomain);

  if (!store) return [];

  const baseUrl = `https://${subdomain}.ihut.shop`;

  // Fetch all products for this store
  const prodQuery = query(collection(db, "products"), where("storeId", "==", store.id));
  const prodSnap = await getDocs(prodQuery);
  const products = prodSnap.docs.map(doc => doc.data());

  const productUrls = products.map((p) => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...productUrls,
  ];
}
