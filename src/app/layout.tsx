import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import NextTopLoader from 'nextjs-toploader';
import { db } from '@/lib/firebase-server';
import { doc, getDoc } from 'firebase/firestore';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seoRef = doc(db, "platformSettings", "seo");
    const seoSnap = await getDoc(seoRef);
    
    if (seoSnap.exists()) {
      const data = seoSnap.data();
      return {
        title: data.metaTitle || 'iHut | Multi-tenant E-commerce SaaS',
        description: data.metaDescription || 'The ultimate platform for launching your online store in minutes.',
        keywords: data.keywords || 'ecommerce, saas, store builder',
        icons: {
          icon: data.favicon || '/favicon.ico',
          apple: data.favicon || '/favicon.ico',
        },
        openGraph: {
          title: data.metaTitle,
          description: data.metaDescription,
          images: [
            {
              url: data.ogImage || data.seoImage || '/og-image.png',
              width: 1200,
              height: 630,
              alt: data.metaTitle,
            }
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: data.metaTitle,
          description: data.metaDescription,
          images: [data.seoImage || data.ogImage || '/og-image.png'],
        }
      };
    }
  } catch (error) {
    console.error("Metadata fetch error:", error);
  }

  return {
    title: 'iHut | Multi-tenant E-commerce SaaS',
    description: 'The ultimate platform for launching your online store in minutes.',
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
        <FirebaseClientProvider>
          <NextTopLoader
            color="#0a5318ff"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #2563eb,0 0 5px #2563eb"
          />
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
