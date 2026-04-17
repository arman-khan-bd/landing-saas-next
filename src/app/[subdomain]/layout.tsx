"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar";
import { LayoutDashboard, ShoppingBag, Settings, Store, ChevronLeft, ChevronDown, Tags, Layers, Bookmark, Percent, PlusCircle, PenTool, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const { subdomain } = useParams();
  const auth = useAuth();
  const firestore = useFirestore();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await verifyStoreAccess(user.uid);
      } else {
        router.push("/auth");
      }
    });
    return () => unsubscribe();
  }, [subdomain, router, auth]);

  const verifyStoreAccess = async (uid: string) => {
    if (!firestore) return;
    setLoading(true);
    try {
      const q = query(
        collection(firestore, "stores"),
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

  const catalogItems = [
    { title: "Products", icon: ShoppingBag, href: `/${subdomain}/products` },
    { title: "Add Product", icon: PlusCircle, href: `/${subdomain}/products/new` },
    { title: "Categories", icon: Layers, href: `/${subdomain}/categories` },
    { title: "Sub Categories", icon: Bookmark, href: `/${subdomain}/sub-categories` },
    { title: "Brands", icon: Store, href: `/${subdomain}/brands` },
    { title: "Taxes", icon: Percent, href: `/${subdomain}/taxes` },
    { title: "Tags", icon: Tags, href: `/${subdomain}/tags` },
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
          <SidebarContent className="p-4 space-y-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === `/${subdomain}`} className="rounded-xl h-11 px-4">
                  <Link href={`/${subdomain}`} className="flex items-center gap-3">
                    <LayoutDashboard className={`w-5 h-5 ${pathname === `/${subdomain}` ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-medium">Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === `/${subdomain}/builder`} className="rounded-xl h-11 px-4">
                  <Link href={`/${subdomain}/builder`} className="flex items-center gap-3">
                    <PenTool className={`w-5 h-5 ${pathname === `/${subdomain}/builder` ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-medium">Page Builder</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <Collapsible defaultOpen className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 hover:bg-muted/50 rounded-lg transition-colors">
                    <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Catalog</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="mt-2">
                      {catalogItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={pathname === item.href} className="rounded-xl h-10 px-4">
                            <Link href={item.href} className="flex items-center gap-3">
                              <item.icon className={`w-4 h-4 ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span className="text-sm font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === `/${subdomain}/settings`} className="rounded-xl h-11 px-4">
                  <Link href={`/${subdomain}/settings`} className="flex items-center gap-3">
                    <Settings className={`w-5 h-5 ${pathname === `/${subdomain}/settings` ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-medium">Store Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
                {pathname.split("/").pop() === subdomain ? "Overview" : pathname.split("/").pop()?.replace('-', ' ')}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                {auth?.currentUser?.email?.[0].toUpperCase()}
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
