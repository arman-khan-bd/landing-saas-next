
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar";
import { LayoutDashboard, ShoppingBag, Settings, Store, ChevronLeft, ChevronDown, Tags, Layers, Bookmark, Percent, PlusCircle, PenTool, Loader2, Users, Receipt, AlertCircle, Bell, Lock, ShieldCheck, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const { subdomain: rawSubdomain } = useParams();
  const subdomain = typeof rawSubdomain === 'string' ? rawSubdomain.toLowerCase() : '';
  
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const [accessDenied, setAccessDenied] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [managerPassword, setManagerPassword] = useState("");

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await verifyStoreAccess(user.uid);
      } else {
        // If they are on an admin path and not logged in, redirect to login
        if (isAdminPath) {
          router.push("/auth");
        } else {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [subdomain, router, auth]);

  const verifyStoreAccess = async (uid: string) => {
    if (!firestore || !subdomain) {
      setLoading(false);
      return;
    }
    
    try {
      const q = query(
        collection(firestore, "stores"),
        where("subdomain", "==", subdomain)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // If store doesn't exist, we'll let the page component handle 404
        setLoading(false);
        return;
      }

      const storeData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      
      // Security Check: Only the owner can access administrative routes
      if (storeData.ownerId !== uid) {
        setAccessDenied(true);
      } else {
        setStore(storeData);

        // Check for existing 1-hour session in localStorage
        const sessionKey = `vault_session_${subdomain}`;
        const savedSession = localStorage.getItem(sessionKey);
        if (savedSession) {
          try {
            const { timestamp } = JSON.parse(savedSession);
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;
            if (now - timestamp < oneHour) {
              setIsPasswordVerified(true);
            }
          } catch (e) {
            console.error("Session parse error", e);
          }
        }

        // If no password set, consider it verified
        if (!storeData.managePassword) {
          setIsPasswordVerified(true);
        }
      }
    } catch (error) {
      console.error("Access verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVaultAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (managerPassword === store?.managePassword) {
      setIsPasswordVerified(true);
      // Save 1-hour session
      const sessionKey = `vault_session_${subdomain}`;
      localStorage.setItem(sessionKey, JSON.stringify({ timestamp: Date.now() }));
      toast({
        title: "Vault Unlocked",
        description: "Management session active for 1 hour.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Invalid Manager Vault Password. Please try again.",
      });
    }
  };

  // Precise path normalization for sidebar active states
  const normalizedPath = pathname.startsWith(`/${subdomain}/`)
      ? pathname.replace(`/${subdomain}`, "")
      : pathname === `/${subdomain}` ? "/" : pathname;

  const adminSegments = ["overview", "products", "orders", "customers", "categories", "sub-categories", "brands", "taxes", "tags", "settings", "notifications", "builder", "home-manager"];
  const isBuilderEditor = normalizedPath.includes("/builder/") && normalizedPath.split("/").filter(Boolean).length > 1;
  const isAdminPath = adminSegments.some(segment => normalizedPath.startsWith(`/${segment}`)) && !isBuilderEditor;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Vault Password Screen
  if (isAdminPath && !isPasswordVerified && !accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full p-10 rounded-[40px] shadow-2xl border-none text-center space-y-8">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto">
            <Lock className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-3xl font-headline font-black tracking-tight">Manager Vault</h2>
            <p className="text-muted-foreground mt-2">Enter your management password to continue to the administrative dashboard.</p>
          </div>
          <form onSubmit={handleVaultAccess} className="space-y-4">
            <input 
              type="password" 
              placeholder="Vault Password" 
              className="h-14 rounded-2xl bg-slate-50 border-none text-center text-xl font-bold tracking-widest w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={managerPassword}
              onChange={(e) => setManagerPassword(e.target.value)}
              autoFocus
            />
            <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">
              <ShieldCheck className="mr-2" /> Unlock Dashboard
            </Button>
          </form>
          <Link href="/dashboard">
            <Button variant="ghost" className="text-muted-foreground hover:text-primary">
              <ChevronLeft className="mr-1 w-4 h-4" /> Cancel & Exit
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (accessDenied && isAdminPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-12 rounded-[40px] shadow-2xl border border-border/50">
          <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
          <h2 className="text-3xl font-headline font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground leading-relaxed">
            You do not have permission to manage this store. Only the authenticated owner can access this dashboard.
          </p>
          <div className="pt-4">
            <Link href="/dashboard">
              <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20">
                Back to My Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const catalogItems = [
    { title: "Products", icon: ShoppingBag, href: `/${subdomain}/products` },
    { title: "Categories", icon: Layers, href: `/${subdomain}/categories` },
    { title: "Sub Categories", icon: Bookmark, href: `/${subdomain}/sub-categories` },
    { title: "Brands", icon: Store, href: `/${subdomain}/brands` },
    { title: "Taxes", icon: Percent, href: `/${subdomain}/taxes` },
    { title: "Tags", icon: Tags, href: `/${subdomain}/tags` },
  ];

  const salesItems = [
    { title: "All Orders", icon: Receipt, href: `/${subdomain}/orders` },
    { title: "Uncompleted", icon: AlertCircle, href: `/${subdomain}/orders/uncompleted` },
  ];

  const customerItems = [
    { title: "All Customers", icon: Users, href: `/${subdomain}/customers` },
    { title: "Fraud List", icon: AlertCircle, href: `/${subdomain}/customers/fraud` },
  ];

  if (!isAdminPath) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <Sidebar className="border-r border-border/50 bg-white">
          <SidebarHeader className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <h3 className="font-headline font-bold text-lg truncate leading-none">{store?.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{store?.subdomain}.ihut.shop</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-4 space-y-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={normalizedPath === "/overview"} className="rounded-xl h-11 px-4">
                  <Link href={`/${subdomain}/overview`} className="flex items-center gap-3">
                    <LayoutDashboard className={`w-5 h-5 ${normalizedPath === "/overview" ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-medium">Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <Collapsible defaultOpen className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 hover:bg-muted/50 rounded-lg transition-colors">
                    <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Design</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="mt-2">
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={normalizedPath === "/home-manager"} className="rounded-xl h-10 px-4">
                          <Link href={`/${subdomain}/home-manager`} className="flex items-center gap-3">
                            <Home className={`w-4 h-4 ${normalizedPath === "/home-manager" ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="text-sm font-medium">Home Manager</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={normalizedPath === "/builder"} className="rounded-xl h-10 px-4">
                          <Link href={`/${subdomain}/builder`} className="flex items-center gap-3">
                            <PenTool className={`w-4 h-4 ${normalizedPath === "/builder" ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="text-sm font-medium">Landing Page</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

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
                          <SidebarMenuButton asChild isActive={normalizedPath === item.href.replace(`/${subdomain}`, "")} className="rounded-xl h-10 px-4">
                            <Link href={item.href} className="flex items-center gap-3">
                              <item.icon className={`w-4 h-4 ${normalizedPath === item.href.replace(`/${subdomain}`, "") ? 'text-primary' : 'text-muted-foreground'}`} />
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

            <Collapsible defaultOpen className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 hover:bg-muted/50 rounded-lg transition-colors">
                    <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Sales</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="mt-2">
                      {salesItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={normalizedPath === item.href.replace(`/${subdomain}`, "")} className="rounded-xl h-10 px-4">
                            <Link href={item.href} className="flex items-center gap-3">
                              <item.icon className={`w-4 h-4 ${normalizedPath === item.href.replace(`/${subdomain}`, "") ? 'text-primary' : 'text-muted-foreground'}`} />
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

            <Collapsible defaultOpen className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 hover:bg-muted/50 rounded-lg transition-colors">
                    <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Customers</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="mt-2">
                      {customerItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={normalizedPath === item.href.replace(`/${subdomain}`, "")} className="rounded-xl h-10 px-4">
                            <Link href={item.href} className="flex items-center gap-3">
                              <item.icon className={`w-4 h-4 ${normalizedPath === item.href.replace(`/${subdomain}`, "") ? 'text-primary' : 'text-muted-foreground'}`} />
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
                <SidebarMenuButton asChild isActive={normalizedPath === "/settings"} className="rounded-xl h-11 px-4">
                  <Link href={`/${subdomain}/settings`} className="flex items-center gap-3">
                    <Settings className={`w-5 h-5 ${normalizedPath === "/settings" ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-medium">Store Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <div className="mt-auto p-4 border-t border-border/50">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl hover:bg-muted h-10 text-sm">
                <ChevronLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </Link>
          </div>
        </Sidebar>

        <SidebarInset className="bg-background">
          <header className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6 border-b border-border/50 bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3 overflow-hidden">
              <SidebarTrigger className="md:hidden" />
              <h2 className="text-lg sm:text-xl font-headline font-bold text-foreground capitalize truncate">
                {normalizedPath === "/" ? "Storefront" : 
                 normalizedPath.startsWith("/builder") ? "Landing Page" :
                 normalizedPath.startsWith("/home-manager") ? "Home Manager" :
                 normalizedPath.split("/").pop()?.replace('-', ' ')}
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <Link href={`/${subdomain}/notifications`} className="relative p-2 text-muted-foreground hover:text-primary transition-colors hover:bg-primary/5 rounded-full">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-white">
                  3
                </span>
              </Link>
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                {auth?.currentUser?.email?.[0].toUpperCase()}
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 md:p-10 max-w-[100vw]">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
