"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useSupabaseClient } from "@/supabase";
import { getSubdomain } from "@/lib/subdomain";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar";
import { LayoutDashboard, ShoppingBag, Settings, Store, ChevronLeft, ChevronDown, Layers, Bookmark, Percent, PlusCircle, PenTool, Loader2, Users, Receipt, AlertCircle, Bell, Lock, ShieldCheck, Home, ShoppingCart, WifiOff, Palette, ShieldAlert, AlertTriangle, Sparkles, Hammer, Tags } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn, getTenantPath, getConsoleUrl, getAuthUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ConfirmationProvider } from "@/hooks/use-confirm";
import { useToast } from "@/hooks/use-toast";
import FBPixel from "@/components/FBPixel";
import StorefrontHeader from "@/components/StorefrontHeader";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function StoreLayoutClient({
  children,
  initialStore,
  initialSubdomain
}: {
  children: React.ReactNode,
  initialStore?: any,
  initialSubdomain?: string
}) {
  const { subdomain: paramsSubdomain } = useParams();
  const [subdomain, setSubdomain] = useState<string>(initialSubdomain || "");

  useEffect(() => {
    if (initialSubdomain) return;
    let sub = typeof paramsSubdomain === 'string' ? paramsSubdomain.toLowerCase() : '';
    if (!sub && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ihut.shop";
      const extracted = getSubdomain(hostname, rootDomain);
      if (extracted) sub = extracted.toLowerCase();
    }
    setSubdomain(sub);
  }, [paramsSubdomain]);

  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [store, setStore] = useState<any>(initialStore || null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const [accessDenied, setAccessDenied] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [managerPassword, setManagerPassword] = useState("");
  const [counts, setCounts] = useState({ orders: 0, uncompleted: 0, system: 0, customers: 0 });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>("user");
  const [currentUser, setCurrentUser] = useState<any>(null);

  const normalizedPath = pathname.startsWith(`/${subdomain}/`)
    ? pathname.replace(`/${subdomain}`, "")
    : pathname === `/${subdomain}` ? "/" : pathname;

  const adminSegments = ["dashboard", "overview", "products", "orders", "customers", "categories", "sub-categories", "brands", "taxes", "tags", "settings", "notifications", "sections", "home-manager"];
  const isAdminPath = adminSegments.some(segment => normalizedPath.startsWith(`/${segment}`));
  const isEditor = normalizedPath.startsWith("/sections/") && normalizedPath.split("/").filter(Boolean).length > 1;

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      if (user) {
        await verifyStoreAccess(user.id);
      } else {
        if (isAdminPath) {
          window.location.href = getAuthUrl();
        } else {
          setLoading(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [subdomain, isAdminPath]);

  // Fetch counts and notifications
  const fetchCountsAndNotifications = async () => {
    if (!store?.id || !currentUser || !isAdminPath || !isPasswordVerified) return;

    try {
      // Get unread orders count
      const { count: ordersCount, data: ordersData } = await supabase
        .from("orders")
        .select("*", { count: "exact" })
        .eq("store_id", store.id)
        .eq("is_read", false);

      // Get uncompleted orders count
      const { count: uncompletedCount, data: uncompletedData } = await supabase
        .from("uncompleted_orders")
        .select("*", { count: "exact" })
        .eq("store_id", store.id);

      // Get system notifications
      const { count: systemCount, data: systemData } = await supabase
        .from("system_notifications")
        .select("*", { count: "exact" })
        .eq("user_id", currentUser.id)
        .eq("read", false);

      // Get customers count
      const { count: customersCount } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store.id);

      setCounts({
        orders: ordersCount || 0,
        uncompleted: uncompletedCount || 0,
        system: systemCount || 0,
        customers: customersCount || 0
      });

      // Build Notification items list
      const orderNotifs = (ordersData || []).map(d => ({
        id: d.id,
        type: 'order',
        title: 'New Order',
        description: `Order #${d.id.slice(0, 6)} from ${d.customer?.fullName || 'Guest'}`,
        time: d.created_at || d.createdAt,
        href: `/orders/${d.id}`
      }));

      const draftNotifs = (uncompletedData || []).map(d => ({
        id: d.id,
        type: 'draft',
        title: 'Abandoned Cart',
        description: `Draft #${d.id.slice(0, 6)} by ${d.customer?.fullName || 'Guest'}`,
        time: d.updated_at || d.updatedAt || d.created_at,
        href: `/orders/uncompleted/${d.id}`
      }));

      const sysNotifs = (systemData || []).map(d => ({
        id: d.id,
        type: 'system',
        title: d.title || 'System Alert',
        description: d.message,
        time: d.created_at || d.createdAt,
        href: '/notifications'
      }));

      const allNotifs = [...orderNotifs, ...draftNotifs, ...sysNotifs].sort((a, b) => 
        new Date(b.time).getTime() - new Date(a.time).getTime()
      );

      setNotifications(allNotifs);

    } catch (e) {
      console.error("Error fetching counts:", e);
    }
  };

  useEffect(() => {
    fetchCountsAndNotifications();
    // Poll notifications every 30 seconds
    const interval = setInterval(fetchCountsAndNotifications, 30000);
    return () => clearInterval(interval);
  }, [store?.id, currentUser, isAdminPath, isPasswordVerified]);

  const verifyStoreAccess = async (uid: string) => {
    if (!subdomain) {
      setLoading(false);
      return;
    }
    try {
      setIsOffline(false);
      // Fetch user profile role
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", uid)
        .single();
      
      const role = userProfile?.role || "user";
      setUserRole(role);

      // Fetch store
      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .select("*")
        .eq("subdomain", subdomain)
        .single();

      if (storeError || !storeData) {
        setLoading(false);
        return;
      }

      setStore(storeData);

      if (storeData.owner_id !== uid && role !== 'admin') {
        if (isAdminPath) setAccessDenied(true);
      } else {
        const sessionKey = `vault_session_${subdomain}`;
        const savedSession = localStorage.getItem(sessionKey);
        if (savedSession) {
          try {
            const { timestamp } = JSON.parse(savedSession);
            if (Date.now() - timestamp < 3600000) setIsPasswordVerified(true);
          } catch (e) {}
        }
        if (!storeData.managePassword || role === 'admin') setIsPasswordVerified(true);
      }
    } catch (error: any) {
      console.error("Store access check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, type: 'order' | 'draft' | 'system', href: string) => {
    try {
      if (type === 'order') {
        await supabase.from("orders").update({ is_read: true }).eq("id", id);
      } else if (type === 'draft') {
        await supabase.from("uncompleted_orders").update({ is_read: true }).eq("id", id);
      } else if (type === 'system') {
        await supabase.from("system_notifications").update({ read: true }).eq("id", id);
      }
      router.push(getTenantPath(subdomain, href));
      fetchCountsAndNotifications();
    } catch (e) {
      console.error(e);
      router.push(getTenantPath(subdomain, href));
    }
  };

  const markAllAsRead = async () => {
    if (!store?.id || !currentUser) return;
    try {
      await Promise.all([
        supabase.from("orders").update({ is_read: true }).eq("store_id", store.id).eq("is_read", false),
        supabase.from("uncompleted_orders").update({ is_read: true }).eq("store_id", store.id).eq("is_read", false),
        supabase.from("system_notifications").update({ read: true }).eq("user_id", currentUser.id).eq("read", false)
      ]);
      toast({ title: "Notifications cleared" });
      fetchCountsAndNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleVaultAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (managerPassword === store?.managePassword) {
      setIsPasswordVerified(true);
      localStorage.setItem(`vault_session_${subdomain}`, JSON.stringify({ timestamp: Date.now() }));
      toast({ title: "Vault Unlocked" });
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: "Invalid PIN." });
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  if (isOffline && isAdminPath) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-md w-full p-12 rounded-[40px] shadow-2xl border-none text-center space-y-6">
        <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mx-auto"><WifiOff className="w-10 h-10" /></div>
        <h2 className="text-3xl font-headline font-black">Connection Error</h2>
        <p className="text-muted-foreground">We are having trouble reaching the database. Please check your network.</p>
        <Button onClick={() => window.location.reload()} className="w-full h-14 rounded-2xl text-lg font-bold">Reload Console</Button>
      </Card>
    </div>
  );

  if (store?.isMaintenance && !isAdminPath) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[32px] flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10 border border-amber-100">
            <Hammer className="w-12 h-12" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Maintenance Mode</h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed px-4">
              We're currently performing scheduled maintenance to improve your experience. We'll be back shortly!
            </p>
          </div>
          <div className="pt-6">
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-sm font-bold text-slate-700">New features and optimizations are being deployed.</p>
              </div>
              {currentUser?.id === store.owner_id || currentUser?.id === store.ownerId ? (
                <Button
                  onClick={() => router.push(getTenantPath(subdomain, '/dashboard'))}
                  className="w-full h-14 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest hover:scale-[1.02] transition-transform"
                >
                  Go to Manager
                </Button>
              ) : (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estimated Completion: Soon</p>
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">{store.name}</p>
        </div>
      </div>
    );
  }

  if (store?.isSuspended) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center mx-auto shadow-xl shadow-rose-500/10 border border-rose-100">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Store Suspended</h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed px-4">
              This store has been temporarily suspended by the platform administration.
            </p>
          </div>
          <div className="pt-6">
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-sm font-bold text-slate-700">Access to this website is currently restricted.</p>
              </div>
              <Button
                onClick={() => window.location.href = '/'}
                className="w-full h-14 rounded-2xl bg-slate-950 text-white font-black uppercase tracking-widest hover:scale-[1.02] transition-transform"
              >
                Return to Home
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">IHut.Shop Trust & Safety</p>
        </div>
      </div>
    );
  }

  if (isAdminPath && !isPasswordVerified && !accessDenied) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-md w-full p-10 rounded-[40px] shadow-2xl border-none text-center space-y-8">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto"><Lock className="w-10 h-10" /></div>
        <div><h2 className="text-3xl font-headline font-black tracking-tight">Vault PIN</h2><p className="text-muted-foreground mt-2">Enter your security PIN to manage this store.</p></div>
        <form onSubmit={handleVaultAccess} className="space-y-4">
          <input type="password" placeholder="••••" className="h-14 rounded-2xl bg-slate-50 border-none text-center text-3xl font-bold tracking-[0.5em] w-full" value={managerPassword} onChange={(e) => setManagerPassword(e.target.value)} autoFocus />
          <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">Unlock Dashboard</Button>
        </form>
        <Link href={getConsoleUrl()}><Button variant="ghost" className="text-muted-foreground"><ChevronLeft className="mr-1 w-4 h-4" /> Cancel</Button></Link>
      </Card>
    </div>
  );

  if (accessDenied && isAdminPath) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-12 rounded-[40px] shadow-2xl border border-border/50">
        <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle className="w-12 h-12 text-destructive" /></div>
        <h2 className="text-3xl font-headline font-bold">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to manage this store.</p>
        <Link href={getConsoleUrl()}><Button className="w-full h-14 rounded-2xl text-lg font-bold">Back to My Console</Button></Link>
      </div>
    </div>
  );

  const catalogItems = [
    { title: "Products", icon: ShoppingBag, href: "/products" },
    { title: "Categories", icon: Layers, href: "/categories" },
    { title: "Brands", icon: Store, href: "/brands" },
    { title: "Tags", icon: Tags, href: "/tags" },
  ];

  const salesItems = [
    { title: "All Orders", icon: Receipt, href: "/orders", count: counts.orders },
    { title: "Uncompleted", icon: AlertCircle, href: "/orders/uncompleted", count: counts.uncompleted },
    { title: "Customers", icon: Users, href: "/customers", count: counts.customers },
  ];

  if (!isAdminPath || isEditor) return (
    <ConfirmationProvider>
      <div className="min-h-screen flex flex-col bg-background relative">
        <FBPixel pixelId={store?.facebookPixelId} />
        {!isEditor && <StorefrontHeader store={store} subdomain={subdomain} />}
        <div className="flex-1">{children}</div>
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
                <div className="overflow-hidden"><h3 className="font-headline font-bold text-lg truncate leading-none">{store?.name}</h3><p className="text-xs text-muted-foreground truncate">{store?.subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'ihut.shop'}</p></div>
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
                  <SidebarGroupLabel asChild><CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 hover:bg-muted/50 rounded-lg transition-colors"><span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Orchestration</span><ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" /></CollapsibleTrigger></SidebarGroupLabel>
                  <CollapsibleContent><SidebarGroupContent><SidebarMenu className="mt-2">
                    <SidebarMenuItem><SidebarMenuButton asChild isActive={normalizedPath.startsWith("/sections")} className="rounded-xl h-10 px-4"><Link href={getTenantPath(subdomain, "/sections")} className="flex items-center gap-3"><Layers className={`w-4 h-4 ${normalizedPath.startsWith("/sections") ? 'text-primary' : 'text-muted-foreground'}`} /><span className="text-sm font-medium">Landing Pages</span></Link></SidebarMenuButton></SidebarMenuItem>
                    <SidebarMenuItem><SidebarMenuButton asChild isActive={normalizedPath === "/home-manager"} className="rounded-xl h-10 px-4"><Link href={getTenantPath(subdomain, "/home-manager")} className="flex items-center gap-3"><Home className={`w-4 h-4 ${normalizedPath === "/home-manager" ? 'text-primary' : 'text-muted-foreground'}`} /><span className="text-sm font-medium">Home Meta</span></Link></SidebarMenuButton></SidebarMenuItem>
                  </SidebarMenu></SidebarGroupContent></CollapsibleContent>
                </SidebarGroup>
              </Collapsible>

              <Collapsible defaultOpen className="group/collapsible">
                <SidebarGroup>
                  <SidebarGroupLabel asChild><CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 hover:bg-muted/50 rounded-lg transition-colors"><span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Catalog</span><ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" /></CollapsibleTrigger></SidebarGroupLabel>
                  <CollapsibleContent><SidebarGroupContent><SidebarMenu className="mt-2">
                    {catalogItems.map((item) => (
                      <SidebarMenuItem key={item.title}><SidebarMenuButton asChild isActive={normalizedPath === item.href} className="rounded-xl h-10 px-4"><Link href={getTenantPath(subdomain, item.href)} className="flex items-center gap-3"><item.icon className={`w-4 h-4 ${normalizedPath === item.href ? 'text-primary' : 'text-muted-foreground'}`} /><span className="text-sm font-medium">{item.title}</span></Link></SidebarMenuButton></SidebarMenuItem>
                    ))}
                  </SidebarMenu></SidebarGroupContent></CollapsibleContent>
                </SidebarGroup>
              </Collapsible>

              <Collapsible defaultOpen className="group/collapsible">
                <SidebarGroup>
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 hover:bg-muted/50 rounded-lg transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Sales</span>
                        {counts.uncompleted > 0 && <Badge className="h-4 px-1.5 bg-amber-500 text-white text-[8px] font-black border-none rounded-full">{counts.uncompleted}</Badge>}
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent><SidebarGroupContent><SidebarMenu className="mt-2">
                    {salesItems.map((item) => (
                      <SidebarMenuItem key={item.title}><SidebarMenuButton asChild isActive={normalizedPath === item.href} className="rounded-xl h-10 px-4"><Link href={getTenantPath(subdomain, item.href)} className="flex items-between justify-between gap-3 w-full"><div className="flex items-center gap-3"><item.icon className={`w-4 h-4 ${normalizedPath === item.href ? 'text-primary' : 'text-muted-foreground'}`} /><span className="text-sm font-medium">{item.title}</span></div>{item.count > 0 && <Badge className="h-5 px-2 bg-primary/10 text-primary text-[10px] font-black border-none rounded-full">{item.count}</Badge>}</Link></SidebarMenuButton></SidebarMenuItem>
                    ))}
                  </SidebarMenu></SidebarGroupContent></CollapsibleContent>
                </SidebarGroup>
              </Collapsible>

              <SidebarMenu><SidebarMenuItem><SidebarMenuButton asChild isActive={normalizedPath === "/settings"} className="rounded-xl h-11 px-4"><Link href={getTenantPath(subdomain, "/settings")} className="flex items-center gap-3"><Settings className={`w-5 h-5 ${normalizedPath === "/settings" ? 'text-primary' : 'text-muted-foreground'}`} /><span className="font-medium">Settings</span></Link></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
            </SidebarContent>
            <div className="mt-auto p-4 border-t border-border/50"><Link href={getConsoleUrl()}><Button variant="ghost" className="w-full justify-start gap-3 rounded-xl hover:bg-muted h-10 text-sm"><ChevronLeft className="w-4 h-4" /> Back to Console</Button></Link></div>
          </Sidebar>

          <SidebarInset className="bg-background">
            <header className="flex h-16 items-center justify-between px-6 border-b border-border/50 bg-white/80 backdrop-blur-md sticky top-0 z-50">
              <div className="flex items-center gap-3"><SidebarTrigger className="md:hidden" /><h2 className="text-lg font-headline font-bold text-foreground capitalize">{normalizedPath === "/" ? "Storefront" : normalizedPath.split("/").pop()?.replace('-', ' ')}</h2></div>
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full outline-none transition-all">
                      <Bell className="w-5 h-5" />
                      {(counts.orders + counts.uncompleted + counts.system) > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-[10px] font-black text-white flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in">
                          {counts.orders + counts.uncompleted + counts.system}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[380px] rounded-[32px] p-2 border-border/50 shadow-2xl bg-white/95 backdrop-blur-xl">
                    <div className="p-4 flex items-center justify-between">
                      <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Activity Stream</h3>
                      {notifications.length > 0 && (
                        <Button variant="ghost" className="h-7 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/5" onClick={markAllAsRead}>Mark all read</Button>
                      )}
                    </div>
                    <DropdownMenuSeparator className="bg-slate-50" />
                    <ScrollArea className="h-[400px]">
                      {notifications.length === 0 ? (
                        <div className="p-12 text-center space-y-3">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-200"><Bell className="w-6 h-6" /></div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Inbox Zero</p>
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
                          {notifications.map((n) => (
                            <DropdownMenuItem key={n.id} className="rounded-2xl p-4 cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group" onClick={() => markAsRead(n.id, n.type, n.href)}>
                              <div className="flex gap-4">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                  n.type === 'order' ? "bg-emerald-50 text-emerald-600" :
                                    n.type === 'draft' ? "bg-amber-50 text-amber-600" : "bg-primary/5 text-primary"
                                )}>
                                  {n.type === 'order' ? <ShoppingBag className="w-5 h-5" /> :
                                    n.type === 'draft' ? <AlertCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                                </div>
                                <div className="space-y-1 overflow-hidden">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-black uppercase text-slate-900 truncate">{n.title}</p>
                                    <span className="text-[9px] font-bold text-slate-400 shrink-0">{new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{n.description}</p>
                                </div>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">{currentUser?.email?.[0].toUpperCase()}</div>
              </div>
            </header>
            <main className="flex-1 p-0 md:p-10">{children}</main>
          </SidebarInset>
        </div>
      </ConfirmationProvider>
    </SidebarProvider>
  );
}
