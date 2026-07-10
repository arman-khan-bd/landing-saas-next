import { MetadataRoute } from 'next';
import { getStoreBySubdomain } from '@/lib/store-server';
import { getSupabaseServerClient } from '@/supabase/server';

export default async function sitemap({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<MetadataRoute.Sitemap> {
  const { subdomain } = await params;
  const store = await getStoreBySubdomain(subdomain);

  if (!store) return [];

  const baseUrl = `https://${subdomain}.ihut.shop`;

  try {
    const supabase = await getSupabaseServerClient();
    // Fetch all products for this store
    const { data: products } = await supabase
      .from("products")
      .select("slug")
      .eq("store_id", store.id);

    const productUrls = (products || []).map((p) => ({
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
  } catch (e) {
    console.error("Error generating sitemap:", e);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      }
    ];
  }
}
