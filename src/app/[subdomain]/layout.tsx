"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { LayoutDashboard, ShoppingBag, Settings, Store, ChevronLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const { subdomain } = useParams();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await verifyStoreAccess(user.uid);
      } else {
        router.push("/auth");
      }
    });
    return () => unsubscribe();
  }, [subdomain, router]);

  const verifyStoreAccess = async (uid: string) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "stores"),
        where("subdomain", "==", subdomain),
        where("ownerId", "==", uid)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        router.push("/dashboard");
        return;
      }
      setStore({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
    } catch (error) {
      console.error(error);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const navItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: `/${subdomain}` },
    { title: "Products", icon: ShoppingBag, href: `/${subdomain}/products` },
    { title: "Settings", icon: Settings, href: `/${subdomain}/settings` },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-border/50 bg-white">
          <SidebarHeader className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                <Store className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <h3 className="font-headline font-bold text-lg truncate leading-none">{store?.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{store?.subdomain}.nexuscart.com</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} className="rounded-xl h-11 px-4">
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <div className="mt-auto p-4 border-t border-border/50">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl hover:bg-muted">
                <ChevronLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </Link>
          </div>
        </Sidebar>

        <SidebarInset className="bg-background">
          <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-border/50 bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <h2 className="text-xl font-headline font-bold text-foreground capitalize">
                {pathname.split("/").pop() === subdomain ? "Overview" : pathname.split("/").pop()}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                {auth.currentUser?.email?.[0].toUpperCase()}
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 md:p-10">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

import { Button } from "@/components/ui/button";