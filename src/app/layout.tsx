import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SupabaseClientProvider } from "@/supabase";

export const runtime = 'edge';

export async function generateMetadata(): Promise<Metadata> {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'iHut';
  const defaultTitle = process.env.NEXT_PUBLIC_APP_TITLE || `${appName} | Multi-tenant E-commerce SaaS`;
  const defaultDesc = process.env.NEXT_PUBLIC_APP_DESC || 'The ultimate platform for launching your online store in minutes.';
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'seo')
        .maybeSingle();
      
      if (data && data.value) {
        const seo = data.value as any;
        return {
          title: seo.metaTitle || defaultTitle,
          description: seo.metaDescription || defaultDesc,
          keywords: seo.keywords || undefined,
          icons: seo.favicon ? { icon: seo.favicon } : undefined,
        };
      }
    }
  } catch (e) {
    console.error("Error loading layout metadata:", e);
  }
  
  return {
    title: defaultTitle,
    description: defaultDesc,
  };
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
