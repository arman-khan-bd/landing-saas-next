
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { getSubdomain } from "@/lib/subdomain";
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar";
import { LayoutDashboard, ShoppingBag, Settings, Store, ChevronLeft, ChevronDown, Tags, Layers, Bookmark, Percent, PlusCircle, PenTool, Loader2, Users, Receipt, AlertCircle, Bell, Lock, ShieldCheck, Home, ShoppingCart, WifiOff, Palette } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn, getTenantPath, getConsoleUrl, getAuthUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ConfirmationProvider } from "@/hooks/use-confirm";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const { subdomain: paramsSubdomain } = useParams();
  const [subdomain, setSubdomain] = useState<string>("");

  useEffect(() => {
    let sub = typeof paramsSubdomain === 'string' ? paramsSubdomain.toLowerCase() : '';
    
    if (!sub && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ihut.shop";
      const extracted = getSubdomain(hostname, rootDomain);
      if (extracted) sub = extracted.toLowerCase();
    }
    
    setSubdomain(sub);
  }, [paramsSubdomain]);

  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const [accessDenied, setAccessDenied] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [managerPassword, setManagerPassword] = useState("");
  const [counts, setCounts] = useState({ orders: 0, uncompleted: 0, system: 0 });
  const [userRole, setUserRole] = useState<string>("user");
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  const normalizedPath = pathname.startsWith(`/${subdomain}/`)
    ? pathname.replace(`/${subdomain}`, "")
    : pathname === `/${subdomain}` ? "/" : pathname;

  const adminSegments = ["dashboard", "overview", "products", "orders", "customers", "categories", "sub-categories", "brands", "taxes", "tags", "settings", "notifications", "builder", "home-manager"];
  const isBuilderEditor = normalizedPath.includes("/builder/") && normalizedPath.split("/").filter(Boolean).length > 1;
  const isAdminPath = adminSegments.some(segment => normalizedPath.startsWith(`/${segment}`)) && !isBuilderEditor;

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await verifyStoreAccess(user.uid);
      } else {
        if (isAdminPath) {
          window.location.href = getAuthUrl();
        } else {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [subdomain, router, auth, isAdminPath]);

  useEffect(() => {
    if (!firestore || !store?.id || !auth?.currentUser || !isAdminPath) return;

    // Only listen if user is store owner or admin to avoid permission errors for anonymous visitors
    const isStoreOwner = store.ownerId === auth.currentUser.uid;
    if (!isStoreOwner && userRole !== 'admin') return;

    const ordersQ = query(
      collection(firestore, "orders"),
      where("storeId", "==", store.id),
      where("ownerId", "==", auth.currentUser.uid),
      where("isRead", "==", false)
    );

    const uncompletedQ = query(
      collection(firestore, "uncompleted_orders"),
      where("storeId", "==", store.id),
      where("ownerId", "==", auth.currentUser.uid),
      where("isRead", "==", false)
    );

    const systemQ = query(
      collection(firestore, "system_notifications"),
      where("userId", "==", auth.currentUser.uid),
      where("read", "==", false)
    );

    const unsubOrders = onSnapshot(ordersQ, (snap) => {
      setCounts(prev => ({ ...prev, orders: snap.size }));
    }, async (err) => {
      // Permission handled at rule level, empty callback prevents console noise
    });

    const unsubUncompleted = onSnapshot(uncompletedQ, (snap) => {
      setCounts(prev => ({ ...prev, uncompleted: snap.size }));
    }, async (err) => {
      // Empty callback
    });

    const unsubSystem = onSnapshot(systemQ, (snap) => {
      setCounts(prev => ({ ...prev, system: snap.size }));
    }, async (err) => {
      // Empty callback
    });

    return () => {
      unsubOrders();
      unsubUncompleted();
      unsubSystem();
    };
  }, [firestore, store?.id, auth?.currentUser, userRole, isAdminPath]);

  const verifyStoreAccess = async (uid: string) => {
    if (!firestore || !subdomain) {
      setLoading(false);
      return;
    }

    try {
      setIsOffline(false);
      const userRef = doc(firestore, "users", uid);
      const userSnap = await getDoc(userRef);
      const role = userSnap.exists() ? (userSnap.data().role || "user") : "user";
      setUserRole(role);

      const q = query(
        collection(firestore, "stores"),
        where("subdomain", "==", subdomain)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setLoading(false);
        return;
      }

      const storeData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };

      if (storeData.ownerId !== uid && role !== 'admin') {
        setAccessDenied(true);
      } else {
        setStore(storeData);

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

        if (!storeData.managePassword || role === 'admin') {
          setIsPasswordVerified(true);
        }

        if (storeData.subscription) {
          setSubscriptionData(storeData.subscription);
          const end = storeData.subscription.currentPeriodEnd?.toDate 
            ? storeData.subscription.currentPeriodEnd.toDate() 
            : (storeData.subscription.currentPeriodEnd ? new Date(storeData.subscription.currentPeriodEnd) : null);
          
          if (end && end < new Date()) {
            setIsSubscriptionExpired(true);
          } else {
            setIsSubscriptionExpired(false);
          }
        }
      }
    } catch (error: any) {
      console.error("Access verification error:", error);
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        setIsOffline(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVaultAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (managerPassword === store?.managePassword) {
      setIsPasswordVerified(true);
      const sessionKey = `vault_session_${subdomain}`;
      localStorage.setItem(sessionKey, JSON.stringify({ timestamp: Date.now() }));
      toast({ title: "Vault Unlocked" });
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: "Invalid PIN." });
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  if (isOffline && isAdminPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full p-12 rounded-[40px] shadow-2xl border-none text-center space-y-6">
          <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mx-auto">
            <WifiOff className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-headline font-black">Connection Error</h2>
          <p className="text-muted-foreground">We are having trouble reaching the database. Please check your network and try again.</p>
          <Button onClick={() => window.location.reload()} className="w-full h-14 rounded-2xl text-lg font-bold">Reload Console</Button>
        </Card>
      </div>
    );
  }

  if (isAdminPath && !isPasswordVerified && !accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full p-10 rounded-[40px] shadow-2xl border-none text-center space-y-8">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto"><Lock className="w-10 h-10" /></div>
          <div>
            <h2 className="text-3xl font-headline font-black tracking-tight">Vault PIN</h2>
            <p className="text-muted-foreground mt-2">Enter your security code to manage this store.</p>
          </div>
          <form onSubmit={handleVaultAccess} className="space-y-4">
            <input type="password" placeholder="••••" className="h-14 rounded-2xl bg-slate-50 border-none text-center text-3xl font-bold tracking-[0.5em] w-full" value={managerPassword} onChange={(e) => setManagerPassword(e.target.value)} autoFocus />
            <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">Unlock Dashboard</Button>
          </form>
          <Link href={getConsoleUrl()}><Button variant="ghost" className="text-muted-foreground"><ChevronLeft className="mr-1 w-4 h-4" /> Cancel</Button></Link>
        </Card>
      </div>
    );
  }

  if (accessDenied && isAdminPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-12 rounded-[40px] shadow-2xl border border-border/50">
          <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle className="w-12 h-12 text-destructive" /></div>
          <h2 className="text-3xl font-headline font-bold">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to manage this tenant.</p>
          <Link href={getConsoleUrl()}><Button className="w-full h-14 rounded-2xl text-lg font-bold">Back to My Console</Button></Link>
        </div>
      </div>
    );
  }

  const catalogItems = [
    { title: "Products", icon: ShoppingBag, href: "/products" },
    { title: "Categories", icon: Layers, href: "/categories" },
    { title: "Sub Categories", icon: Bookmark, href: "/sub-categories" },
    { title: "Brands", icon: Store, href: "/brands" },
    { title: "Taxes", icon: Percent, href: "/taxes" },
    { title: "Tags", icon: Tags, href: "/tags" },
  ];

  const salesItems = [
    { title: "All Orders", icon: Receipt, href: "/orders", count: counts.orders },
    { title: "Uncompleted", icon: AlertCircle, href: "/orders/uncompleted", count: counts.uncompleted },
  ];

  if (!isAdminPath) return (
    <ConfirmationProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1">
          {children}
        </div>
        <StorefrontFooter store={store} subdomain={subdomain} isSubscriptionExpired={isSubscriptionExpired} />
      </div>
    </ConfirmationProvider>
  );

  return (
    <SidebarProvider>
      <ConfirmationProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <Sidebar className="border-r border-border/50 bg-white">
            <SidebarHeader className="p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shrink-0"><Store className="w-6 h-6" /></div>
                <div className="overflow-hidden">
                  <h3 className="font-headline font-bold text-lg truncate leading-none">{store?.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{store?.subdomain}.ihut.shop</p>
                </div>
              </div>
            </SidebarHeader>
            <SidebarContent className="p-4 space-y-4">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={normalizedPath === "/dashboard"} className="rounded-xl h-11 px-4">
                    <Link href={getTenantPath(subdomain, "/dashboard")} className="flex items-center gap-3">
                      <LayoutDashboard className={`w-5 h-5 ${normalizedPath === "/dashboard" ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-medium">Dashboard</span>
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
                            <Link href={getTenantPath(subdomain, "/home-manager")} className="flex items-center gap-3">
                              <Home className={`w-4 h-4 ${normalizedPath === "/home-manager" ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span className="text-sm font-medium">Home Manager</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild isActive={normalizedPath === "/builder"} className="rounded-xl h-10 px-4">
                            <Link href={getTenantPath(subdomain, "/builder")} className="flex items-center gap-3">
                              <PenTool className={`w-4 h-4 ${normalizedPath === "/builder" ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span className="text-sm font-medium">Landing Pages</span>
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
                            <SidebarMenuButton asChild isActive={normalizedPath === item.href} className="rounded-xl h-10 px-4">
                              <Link href={getTenantPath(subdomain, item.href)} className="flex items-center gap-3">
                                <item.icon className={`w-4 h-4 ${normalizedPath === item.href ? 'text-primary' : 'text-muted-foreground'}`} />
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
                            <SidebarMenuButton asChild isActive={normalizedPath === item.href} className="rounded-xl h-10 px-4">
                              <Link href={getTenantPath(subdomain, item.href)} className="flex items-center justify-between gap-3 w-full">
                                <div className="flex items-center gap-3">
                                  <item.icon className={`w-4 h-4 ${normalizedPath === item.href ? 'text-primary' : 'text-muted-foreground'}`} />
                                  <span className="text-sm font-medium">{item.title}</span>
                                </div>
                                {item.count > 0 && <Badge className="h-5 px-2 bg-primary/10 text-primary text-[10px] font-black border-none rounded-full">{item.count}</Badge>}
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
                    <Link href={getTenantPath(subdomain, "/settings")} className="flex items-center gap-3">
                      <Settings className={`w-5 h-5 ${normalizedPath === "/settings" ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-medium">Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
            <div className="mt-auto p-4 border-t border-border/50 space-y-2">
              <Link href={getConsoleUrl()}>
                <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl hover:bg-muted h-10 text-sm">
                  <ChevronLeft className="w-4 h-4" /> Back to Console
                </Button>
              </Link>
            </div>
          </Sidebar>

          <SidebarInset className="bg-background">
            <header className="flex h-16 items-center justify-between px-6 border-b border-border/50 bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="md:hidden" />
                <h2 className="text-lg font-headline font-bold text-foreground capitalize">
                  {normalizedPath === "/" ? "Storefront" : normalizedPath.split("/").pop()?.replace('-', ' ')}
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <Link href={getTenantPath(subdomain, "/notifications")} className="relative p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full">
                  <Bell className="w-5 h-5" />
                  {(counts.orders + counts.uncompleted + counts.system) > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-[10px] font-black text-white flex items-center justify-center rounded-full border-2 border-white">
                      {counts.orders + counts.uncompleted + counts.system}
                    </span>
                  )}
                </Link>
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                  {auth?.currentUser?.email?.[0].toUpperCase()}
                </div>
              </div>
            </header>
            <main className="flex-1 p-6 md:p-10">
              {children}
            </main>
          </SidebarInset>
        </div>
      </ConfirmationProvider>
    </SidebarProvider>
  );
}

function StorefrontFooter({ store, subdomain, isSubscriptionExpired }: { store: any, subdomain: string, isSubscriptionExpired: boolean }) {
  if (!store) return null;
  
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-12 px-6 mt-auto">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
          <div className="space-y-4 md:col-span-2">
            <Link href={getTenantPath(subdomain, "/")} className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-xl font-headline font-black tracking-tight uppercase text-slate-900">{store?.name || subdomain}</span>
            </Link>
            <p className="text-slate-500 text-sm max-w-sm mx-auto md:mx-0 font-medium leading-relaxed">
              Discover the best collection curated specifically for you. Quality products, fast delivery, and exceptional service.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Shop</h4>
            <ul className="space-y-2.5 text-sm font-bold text-slate-600">
              <li><Link href={getTenantPath(subdomain, "/all-products")} className="hover:text-primary transition-colors">All Products</Link></li>
              <li><Link href={getTenantPath(subdomain, "/")} className="hover:text-primary transition-colors">Featured Items</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Support</h4>
            <ul className="space-y-2.5 text-sm font-bold text-slate-600">
              <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
              &copy; {new Date().getFullYear()} {(store?.name || subdomain).toUpperCase()}
            </div>
            <div className="flex items-center gap-3 opacity-30">
              <div className="w-5 h-5 bg-slate-200 rounded-md" />
              <div className="w-5 h-5 bg-slate-200 rounded-md" />
              <div className="w-5 h-5 bg-slate-200 rounded-md" />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest">Secure Payments</span>
            </div>

            {(!store?.subscription || isSubscriptionExpired) && (
              <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Powered by</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-primary rounded-[4px] flex items-center justify-center">
                    <ShoppingCart className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-[10px] font-headline font-black tracking-tight text-primary uppercase">IHut.Shop</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
