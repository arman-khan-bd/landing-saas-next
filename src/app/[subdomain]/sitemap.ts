import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export default async function sitemap({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<MetadataRoute.Sitemap> {
  const { subdomain } = await params;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'ihut.shop';
  const baseUrl = `https://${subdomain}.${rootDomain}`;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get store by subdomain
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("subdomain", subdomain)
      .limit(1)
      .maybeSingle();

    if (!store) return [{ url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 }];

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
        changeFrequency: 'daily' as const,
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
        changeFrequency: 'daily' as const,
        priority: 1,
      }
    ];
  }
}
