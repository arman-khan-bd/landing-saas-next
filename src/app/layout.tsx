import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SupabaseClientProvider } from "@/supabase";
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

import { headers } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'iHut';
  const defaultTitle = process.env.NEXT_PUBLIC_APP_TITLE || `${appName} | Multi-tenant E-commerce SaaS`;
  const defaultDesc = process.env.NEXT_PUBLIC_APP_DESC || 'The ultimate platform for launching your online store in minutes.';
  const fallback: Metadata = { title: defaultTitle, description: defaultDesc };

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) return fallback;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const headersList = await headers();
    const host = headersList.get("host") || "";
    const tenant = headersList.get("x-subdomain-tenant") || "";
    const customDomain = headersList.get("x-custom-domain") || "";

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ihut.shop";
    const currentHost = host.toLowerCase().split(":")[0];
    const isRoot = currentHost === rootDomain || currentHost === `www.${rootDomain}` || currentHost === "localhost" || currentHost === "127.0.0.1";

    if (!isRoot && (tenant || customDomain)) {
      const lookupVal = tenant || customDomain;
      const { data: store } = await supabase
        .from('stores')
        .select('name, home_page_title, seo, favicon')
        .or(`subdomain.eq.${lookupVal},custom_domain.eq.${lookupVal}`)
        .maybeSingle();

      if (store) {
        const seoData = store.seo || {};
        return {
          title: store.home_page_title || store.name || defaultTitle,
          description: seoData.description || defaultDesc,
          keywords: seoData.keywords || undefined,
          icons: {
            icon: store.favicon || "/favicon.ico",
          }
        };
      }
    }

    const { data: settings } = await supabase
      .from('platform_settings')
      .select('key, value');

    if (settings && settings.length > 0) {
      const general = settings.find(s => s.key === 'general')?.value || {};
      const seo = settings.find(s => s.key === 'seo')?.value || {};

      const favicon = general.favicon || seo.favicon || "/favicon.ico";
      return {
        title: seo.metaTitle || general.platformName || defaultTitle,
        description: seo.metaDescription || general.platformSubtitle || defaultDesc,
        keywords: seo.keywords || undefined,
        icons: {
          icon: favicon,
        }
      };
    }
  } catch (error) {
    console.error("Error fetching metadata:", error);
  }

  return fallback;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@100..800&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background min-h-screen" suppressHydrationWarning>
        <SupabaseClientProvider>
          {children}
          <Toaster />
        </SupabaseClientProvider>
      </body>
    </html>
  );
}
