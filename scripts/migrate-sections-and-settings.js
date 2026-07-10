const fs = require('fs');
const path = require('path');

// 1. Rewrite sections/page.tsx
const sectionsPath = path.join(__dirname, '..', 'src', 'app', '[subdomain]', 'sections', 'page.tsx');
const sectionsCode = `"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabaseClient, useUser } from "@/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, Layers, Search, Edit3, Trash2, 
  ExternalLink, Loader2, Globe, Clock, 
  Layout, MoreVertical, Sparkles, CheckCircle2 
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { getTenantPath } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function LandingPagesDashboard() {
  const { subdomain } = useParams();
  const router = useRouter();
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [storeId, setStoreId] = useState("");

  const [newPage, setNewPage] = useState({ title: "", slug: "" });

  const fetchPages = async () => {
    setLoading(true);
    try {
      const { data: storeData } = await supabase
        .from("stores")
        .select("id")
        .eq("subdomain", subdomain)
        .single();
      if (!storeData) return;
      setStoreId(storeData.id);

      const { data } = await supabase
        .from("sections")
        .select("*")
        .eq("store_id", storeData.id);
      setPages(data ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subdomain && user) {
      fetchPages();
    }
  }, [subdomain, user]);

  const handleCreate = async () => {
    if (!newPage.title || !newPage.slug) return;
    setCreating(true);
    try {
      const slug = newPage.slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
      
      // Check if slug exists
      const { data: existing } = await supabase
        .from("sections")
        .select("id")
        .eq("store_id", storeId)
        .eq("slug", slug)
        .maybeSingle();

      if (existing) {
        toast({ variant: "destructive", title: "Slug already exists", description: "Choose a unique slug for this page." });
        setCreating(false);
        return;
      }

      await supabase.from("sections").insert({
        store_id: storeId,
        title: newPage.title,
        slug,
        blocks: [], // Start with empty config/blocks
        is_published: true
      });

      toast({ title: "Page Created", description: "You can now start orchestrating sections." });
      setIsCreateOpen(false);
      setNewPage({ title: "", slug: "" });
      fetchPages();
    } catch (error) {
      toast({ variant: "destructive", title: "Creation Failed" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (await confirm({
      title: "Delete Landing Page?",
      message: \`Are you sure you want to permanently delete "\${title}"? This will destroy all section data.\`,
      confirmText: "Purge Page",
      variant: "danger"
    })) {
      try {
        await supabase.from("sections").delete().eq("id", id);
        toast({ title: "Page Deleted" });
        fetchPages();
      } catch (error) {
        toast({ variant: "destructive", title: "Delete Failed" });
      }
    }
  };

  const filtered = pages.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-black text-slate-900 uppercase tracking-tight">Landing Page Matrix</h1>
          <p className="text-muted-foreground">Manage and orchestrate high-conversion landing pages for your products.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-12 px-8 font-bold shadow-xl shadow-primary/20">
              <Plus className="mr-2 w-5 h-5" /> New Landing Page
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[32px] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-black uppercase">Create New Page</DialogTitle>
              <DialogDescription>Define the identity of your new high-conversion landing page.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6">
               <div className="space-y-2">
                  <Label>Page Title</Label>
                  <Input 
                    placeholder="e.g. Summer Special Sale" 
                    value={newPage.title}
                    onChange={(e) => {
                       const title = e.target.value;
                       const slug = title.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
                       setNewPage({ title, slug });
                    }}
                    className="h-12 rounded-xl"
                  />
               </div>
               <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <div className="flex items-center">
                     <div className="h-12 bg-slate-100 flex items-center px-4 rounded-l-xl border border-r-0 text-[10px] font-black text-slate-400">/p/</div>
                     <Input 
                       placeholder="summer-sale" 
                       value={newPage.slug}
                       onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                       className="h-12 rounded-r-xl rounded-l-none"
                     />
                  </div>
               </div>
            </div>
            <DialogFooter>
              <Button className="w-full h-14 rounded-2xl font-black uppercase text-lg" onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="animate-spin" /> : "Deploy Architecture"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Filter pages..." 
          className="pl-10 h-11 rounded-xl bg-white border-border/50 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
           <Layers className="w-20 h-20 text-slate-100 mx-auto mb-6" />
           <h3 className="text-xl font-bold text-slate-900">No landing pages found</h3>
           <p className="text-muted-foreground mt-2">Launch your first high-conversion landing page to start scaling.</p>
           <Button variant="link" className="mt-4 font-black" onClick={() => setIsCreateOpen(true)}>Create First Page</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((page) => (
            <Card key={page.id} className="rounded-[32px] border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white group overflow-hidden">
               <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-start mb-6">
                     <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Layout className="w-6 h-6" />
                     </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-slate-300 hover:text-slate-600">
                              <MoreVertical className="w-5 h-5" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[160px] shadow-2xl">
                           <DropdownMenuItem className="gap-2 py-2.5 rounded-xl cursor-pointer" onClick={() => router.push(getTenantPath(subdomain as string, \`/sections/\${page.id}\`))}>
                              <Edit3 className="w-4 h-4 text-muted-foreground" /> Orchestrate Sections
                           </DropdownMenuItem>
                           <DropdownMenuItem className="gap-2 py-2.5 rounded-xl cursor-pointer" asChild>
                              <a href={getTenantPath(subdomain as string, \`/p/\${page.slug}\`)} target="_blank">
                                 <ExternalLink className="w-4 h-4 text-muted-foreground" /> View Production
                              </a>
                           </DropdownMenuItem>
                           <DropdownMenuItem className="gap-2 py-2.5 rounded-xl cursor-pointer text-rose-500" onClick={() => handleDelete(page.id, page.title)}>
                              <Trash2 className="w-4 h-4" /> Purge Page
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </div>
                  <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors truncate">{page.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2 font-mono text-[10px] font-bold uppercase text-slate-400">
                     <Globe className="w-3 h-3" /> /p/{page.slug}
                  </CardDescription>
               </CardHeader>
               <CardContent className="p-8 pt-0 space-y-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Matrix</p>
                        <p className="text-sm font-bold text-slate-700">{page.blocks?.length || 0} Blocks</p>
                     </div>
                     <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-lg text-[9px] font-black px-2">LIVE</Badge>
                  </div>
                  <Button 
                    className="w-full h-12 rounded-xl font-black uppercase text-xs tracking-widest bg-slate-900 hover:bg-primary transition-all shadow-xl shadow-slate-900/10"
                    onClick={() => router.push(getTenantPath(subdomain as string, \`/sections/\${page.id}\`))}
                  >
                    Manage Design
                  </Button>
               </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync(sectionsPath, sectionsCode, 'utf8');
console.log("Completely rewrote sections/page.tsx with clean Supabase client API");

// 2. Rewrite settings/page.tsx
const settingsPath = path.join(__dirname, '..', 'src', 'app', '[subdomain]', 'settings', 'page.tsx');
const settingsCode = `"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSupabaseClient } from "@/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { Loader2, Save, Globe, Palette, CreditCard, Layout, Megaphone, Share2, AlertCircle, Smartphone, Lock, Truck, ShieldCheck, Zap, CheckCircle2, Clock, Info, ArrowUpRight, Copy, Database, Image as ImageIcon, Search, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStoreUrl, cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function StoreSettingsPage() {
  const { subdomain } = useParams();
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [storeId, setStoreId] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("none");
  const [saasPaymentMethods, setSaasPaymentMethods] = useState<any[]>([]);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [transactionId, setTransactionId] = useState("");
  const [expiryDate, setExpiryDate] = useState<any>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  // Domain Request States
  const [domainRequests, setDomainRequests] = useState<any[]>([]);
  const [requestingDomain, setRequestingDomain] = useState(false);
  const [newDomain, setNewDomain] = useState("");

  const [settings, setSettings] = useState<any>({
    name: "",
    homePageTitle: "",
    address: "",
    phone: "",
    email: "",
    logo: "",
    favicon: "",
    selectedTheme: "modern",
    googleAnalyticsId: "",
    facebookPixelId: "",
    googleMapEmbed: "",
    workingDays: "",
    paymentSettings: {
      cod: true,
      manualEnabled: false,
      manualMethods: []
    },
    seo: {
      metaImage: "",
      keywords: "",
      description: ""
    },
    shopConfig: {
      showHeader: true,
      stickyHeader: true
    },
    socialLinks: {
      facebook: "",
      twitter: "",
      instagram: "",
      youtube: ""
    },
    managePassword: "",
    shippingSettings: {
      enabled: false,
      methods: [
        { id: "1", name: "Standard Shipping", cost: 0 }
      ]
    }
  });

  const fetchSettings = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("subdomain", subdomain)
        .single();

      if (storeData) {
        const sId = storeData.id;
        setStoreId(sId);

        // Fetch subscription
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("store_id", sId)
          .eq("owner_id", user.id)
          .in("status", ["active", "pending"])
          .maybeSingle();

        if (subData) {
          const { data: planData } = await supabase
            .from("subscription_plans")
            .select("*")
            .eq("id", subData.plan_id)
            .maybeSingle();

          if (planData) {
            setCurrentPlan({ id: planData.id, ...planData });
            setSubscriptionStatus(subData.status);

            if (subData.current_period_end) {
              const end = new Date(subData.current_period_end);
              setExpiryDate(end);
              const diff = end.getTime() - new Date().getTime();
              const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
              setDaysRemaining(days);
              setIsPro(planData.price > 0 && days > 0);
            } else {
              setIsPro(planData.price > 0);
            }
          }
        }

        // Fetch Domain Requests
        const { data: domainReqs } = await supabase
          .from("custom_domain_requests")
          .select("*")
          .eq("store_id", sId)
          .eq("owner_id", user.id);
        setDomainRequests(domainReqs ?? []);

        // Fetch all active subscription plans
        const { data: plans } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true);
        setAllPlans(plans ?? []);

        // Fetch SaaS payment methods
        const { data: payMethods } = await supabase
          .from("saas_payment_methods")
          .select("*")
          .eq("is_active", true);
        setSaasPaymentMethods(payMethods ?? []);

        setSettings((prev: any) => ({
          ...prev,
          ...storeData,
          paymentSettings: {
            ...prev.paymentSettings,
            ...storeData.paymentSettings,
            manualMethods: storeData.paymentSettings?.manualMethods || []
          },
          seo: { ...prev.seo, ...storeData.seo },
          shopConfig: { ...prev.shopConfig, ...storeData.shopConfig },
          socialLinks: { ...prev.socialLinks, ...storeData.socialLinks },
          shippingSettings: storeData.shippingSettings || prev.shippingSettings
        }));
      }
    } catch (error) {
      console.error("Settings Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [subdomain]);

  const handleRequestDomain = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!newDomain || !storeId || !user) return;
    setRequestingDomain(true);
    try {
      await supabase.from("custom_domain_requests").insert({
        store_id: storeId,
        store_name: settings.name,
        subdomain,
        owner_id: user.id,
        domain: newDomain.toLowerCase().trim(),
        status: "pending"
      });
      toast({ title: "Request Submitted", description: "Admin will review your custom domain request." });
      setNewDomain("");
      fetchSettings();
    } catch (e) {
      toast({ variant: "destructive", title: "Request Failed" });
    } finally {
      setRequestingDomain(false);
    }
  };

  const handleSave = async () => {
    if (!storeId) return;
    setSaving(true);
    try {
      await supabase.from("stores").update(settings).eq("id", storeId);
      toast({ title: "Settings Updated", description: "Your store configuration has been saved." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const addManualPaymentMethod = () => {
    const newMethod = {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      number: "",
      instructions: ""
    };
    setSettings({
      ...settings,
      paymentSettings: {
        ...settings.paymentSettings,
        manualMethods: [...(settings.paymentSettings.manualMethods || []), newMethod]
      }
    });
  };

  const removeManualPaymentMethod = (id: string) => {
    setSettings({
      ...settings,
      paymentSettings: {
        ...settings.paymentSettings,
        manualMethods: settings.paymentSettings.manualMethods.filter((m: any) => m.id !== id)
      }
    });
  };

  const updateManualPaymentMethod = (id: string, field: string, value: string) => {
    setSettings({
      ...settings,
      paymentSettings: {
        ...settings.paymentSettings,
        manualMethods: settings.paymentSettings.manualMethods.map((m: any) => 
          m.id === id ? { ...m, [field]: value } : m
        )
      }
    });
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Store Configuration</h1>
          <p className="text-muted-foreground text-sm">Manage your brand identity, payments, and tier-specific features.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto rounded-xl h-12 px-8 shadow-lg shadow-primary/20 shrink-0">
          {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="relative">
          <ScrollArea className="w-full">
            <TabsList className="flex w-full grid grid-cols-2 lg:grid-cols-6 h-auto p-1 bg-muted/50 rounded-2xl">
              <TabsTrigger value="general" className="rounded-xl py-3 text-xs font-bold">General</TabsTrigger>
              <TabsTrigger value="domains" className="rounded-xl py-3 text-xs font-bold">Domains</TabsTrigger>
              <TabsTrigger value="payment" className="rounded-xl py-3 text-xs font-bold">Payment</TabsTrigger>
              <TabsTrigger value="shipping" className="rounded-xl py-3 text-xs font-bold">Shipping</TabsTrigger>
              <TabsTrigger value="subscription" className="rounded-xl py-3 text-xs font-bold">Subscription</TabsTrigger>
              <TabsTrigger value="seo" className="rounded-xl py-3 text-xs font-bold">SEO</TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card className="rounded-[32px] border-border/50 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 bg-muted/30 border-b">
              <div className="flex items-center gap-2">
                <Layout className="text-primary h-5 w-5" />
                <CardTitle className="text-xl font-headline font-bold">Store Identity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Store Name</Label>
                    <Input className="h-12 rounded-xl" value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Store Subtitle / Slogan</Label>
                    <Input className="h-12 rounded-xl" value={settings.homePageTitle} onChange={(e) => setSettings({ ...settings, homePageTitle: e.target.value })} placeholder="e.g. Quality you can trust" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Primary Contact Email</Label>
                    <Input className="h-12 rounded-xl" type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input className="h-12 rounded-xl" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Store Logo</Label>
                   <CloudinaryUpload 
                     value={settings.logo}
                     onUpload={(url) => setSettings({...settings, logo: url})}
                     onRemove={() => setSettings({...settings, logo: ""})}
                   />
                </div>
                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Favicon (32x32)</Label>
                   <CloudinaryUpload 
                     value={settings.favicon}
                     onUpload={(url) => setSettings({...settings, favicon: url})}
                     onRemove={() => setSettings({...settings, favicon: ""})}
                   />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Business Physical Address</Label>
                <Textarea className="rounded-2xl min-h-[100px]" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="mt-6">
          <Card className="rounded-[32px] border-border/50 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 bg-muted/30 border-b">
              <div className="flex items-center gap-2">
                <Globe className="text-primary h-5 w-5" />
                <CardTitle className="text-xl font-headline font-bold">Domain Management</CardTitle>
              </div>
              <CardDescription>Control how customers access your store online.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <div className="p-6 border rounded-[24px] bg-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold">Standard Subdomain</h4>
                    <p className="text-xs text-muted-foreground">Included with every IHut.Shop account.</p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 font-black text-[8px] tracking-widest uppercase">Live</Badge>
                </div>
                <div className="flex items-center gap-2 bg-white border px-4 rounded-xl h-12 text-sm font-bold text-primary">
                  {settings.subdomain}.ihut.shop
                </div>
              </div>

              <div className={"p-6 border-2 border-dashed rounded-[24px] space-y-8 relative overflow-hidden transition-all " + (isPro ? "bg-white border-primary/20" : "bg-slate-50 opacity-80")}>
                {!isPro && (
                  <div className="absolute inset-0 z-10 bg-slate-900/5 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="bg-white p-8 rounded-[32px] shadow-2xl text-center space-y-4 max-w-xs border border-primary/10">
                      <Lock className="w-10 h-10 text-primary mx-auto" />
                      <h5 className="font-headline font-black text-xl">PRO FEATURE</h5>
                      <p className="text-sm text-muted-foreground">Custom domains require an active Pro subscription.</p>
                      <Button onClick={() => setActiveTab("subscription")} className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">Upgrade Now</Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-lg">Request Custom Domain</h4>
                    <p className="text-xs text-muted-foreground">Connect your own brand (e.g. shop.luxury.com).</p>
                  </div>
                  <Badge className="bg-primary text-white border-none px-3 py-1 font-black text-[8px] tracking-widest uppercase">PRO</Badge>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      placeholder="e.g. shop.luxury.com"
                      disabled={!isPro || requestingDomain}
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      className="h-14 rounded-xl bg-white text-lg"
                    />
                    <Button 
                      disabled={!isPro || requestingDomain || !newDomain} 
                      onClick={handleRequestDomain}
                      className="h-14 px-8 rounded-xl font-black uppercase tracking-tight shadow-xl shadow-primary/20"
                    >
                      {requestingDomain ? <Loader2 className="animate-spin w-5 h-5" /> : "Request Domain"}
                    </Button>
                  </div>

                  {domainRequests.length > 0 && (
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                      <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Request History</h5>
                      <div className="grid gap-4">
                        {domainRequests.map((req) => (
                          <div key={req.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-primary" />
                                <span className="font-bold text-base">{req.domain}</span>
                              </div>
                              <Badge className={cn(
                                "border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                req.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                req.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                                'bg-amber-100 text-amber-600'
                              )}>
                                {req.status}
                              </Badge>
                            </div>

                            {req.status === 'approved' && req.dns_records && Array.isArray(req.dns_records) && (
                              <div className="animate-in slide-in-from-top-2 duration-300">
                                <div className="p-6 bg-white rounded-2xl border-2 border-primary/10 space-y-6 shadow-sm">
                                  <div className="flex items-center gap-2 text-primary">
                                    <ShieldCheck className="w-5 h-5" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Global DNS Configuration</p>
                                  </div>
                                  
                                  <Table>
                                    <TableHeader className="bg-slate-50">
                                      <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase">Type</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase">Host</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase">Value</TableHead>
                                        <TableHead className="text-right"></TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {req.dns_records.map((r: any, idx: number) => (
                                        <TableRow key={idx}>
                                          <TableCell><Badge variant="outline" className="font-bold bg-primary/5 text-primary border-primary/10">{r.type}</Badge></TableCell>
                                          <TableCell className="font-mono text-xs">{r.host}</TableCell>
                                          <TableCell className="font-mono text-xs max-w-[200px] truncate">{r.value}</TableCell>
                                          <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100" onClick={() => copyToClipboard(r.value)}>
                                              <Copy className="w-3.5 h-3.5" />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <Card className="rounded-[32px] border-border/50 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 bg-muted/30 border-b">
              <div className="flex items-center gap-2">
                <CreditCard className="text-primary h-5 w-5" />
                <CardTitle className="text-xl font-headline font-bold">Payment Methods</CardTitle>
              </div>
              <CardDescription>Activate and configure checkout options for your customers.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="space-y-0.5">
                  <h4 className="font-bold">Cash on Delivery (COD)</h4>
                  <p className="text-xs text-muted-foreground">Allow customers to pay when they receive the product.</p>
                </div>
                <Switch
                  checked={settings.paymentSettings?.cod}
                  onCheckedChange={(val) => setSettings({
                    ...settings,
                    paymentSettings: { ...settings.paymentSettings, cod: val }
                  })}
                />
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-indigo-600">Manual / Mobile Payment</h4>
                    <p className="text-xs text-muted-foreground">Accept payments via bKash, Nagad, or Bank Transfer.</p>
                  </div>
                  <Switch
                    checked={settings.paymentSettings?.manualEnabled}
                    onCheckedChange={(val) => setSettings({
                      ...settings,
                      paymentSettings: { ...settings.paymentSettings, manualEnabled: val }
                    })}
                  />
                </div>

                {settings.paymentSettings?.manualEnabled && (
                  <div className="animate-in slide-in-from-top-2 duration-300 space-y-6 pt-4 border-t border-slate-200">
                    <div className="space-y-4">
                      {settings.paymentSettings.manualMethods?.map((method: any, idx: number) => (
                        <div key={method.id} className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-sm relative group">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 h-8 w-8 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeManualPaymentMethod(method.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-slate-400">Provider Name</Label>
                              <Input 
                                value={method.name} 
                                onChange={(e) => updateManualPaymentMethod(method.id, "name", e.target.value)}
                                placeholder="e.g. bKash Personal"
                                className="h-11 rounded-xl bg-slate-50 border-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-slate-400">Account Number</Label>
                              <Input 
                                value={method.number} 
                                onChange={(e) => updateManualPaymentMethod(method.id, "number", e.target.value)}
                                placeholder="01XXXXXXXXX"
                                className="h-11 rounded-xl bg-slate-50 border-none"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Payment Instructions</Label>
                            <Textarea 
                              value={method.instructions} 
                              onChange={(e) => updateManualPaymentMethod(method.id, "instructions", e.target.value)}
                              placeholder="Detailed payment instructions for this method..."
                              className="rounded-xl bg-slate-50 border-none min-h-[100px]"
                            />
                          </div>
                        </div>
                      ))}

                      <Button 
                        onClick={addManualPaymentMethod}
                        variant="outline"
                        className="w-full h-12 border-dashed border-2 rounded-xl text-indigo-600 font-bold gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add Mobile Banking / Manual Method
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="mt-6">
          <Card className="rounded-[32px] border-border/50 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 bg-muted/30 border-b flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Truck className="text-primary h-5 w-5" />
                  <CardTitle className="text-xl font-headline font-bold">Shipping Methods</CardTitle>
                </div>
                <CardDescription>Configure delivery areas and shipping costs for your store.</CardDescription>
              </div>
              <Switch
                checked={settings.shippingSettings?.enabled}
                onCheckedChange={(val) => setSettings({
                  ...settings,
                  shippingSettings: { ...settings.shippingSettings, enabled: val }
                })}
              />
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                {settings.shippingSettings?.methods.map((method: any, index: number) => (
                  <div key={method.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Method Name (e.g. Inside Dhaka)</Label>
                      <Input
                        value={method.name}
                        onChange={(e) => {
                          const newMethods = [...settings.shippingSettings.methods];
                          newMethods[index].name = e.target.value;
                          setSettings({ ...settings, shippingSettings: { ...settings.shippingSettings, methods: newMethods } });
                        }}
                        className="h-12 rounded-xl bg-white border-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cost ($)</Label>
                      <Input
                        type="number"
                        value={method.cost}
                        onChange={(e) => {
                          const newMethods = [...settings.shippingSettings.methods];
                          newMethods[index].cost = parseFloat(e.target.value) || 0;
                          setSettings({ ...settings, shippingSettings: { ...settings.shippingSettings, methods: newMethods } });
                        }}
                        className="h-12 rounded-xl bg-white border-none"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        const newMethods = settings.shippingSettings.methods.filter((_: any, i: number) => i !== index);
                        setSettings({ ...settings, shippingSettings: { ...settings.shippingSettings, methods: newMethods } });
                      }}
                      className="h-12 rounded-xl w-full md:w-auto"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={() => {
                    const newMethods = [...settings.shippingSettings.methods, { id: Math.random().toString(36).substr(2, 9), name: "", cost: 0 }];
                    setSettings({ ...settings, shippingSettings: { ...settings.shippingSettings, methods: newMethods } });
                  }}
                  variant="outline"
                  className="w-full h-14 border-dashed rounded-2xl text-primary font-bold"
                >
                  + Add Shipping Method
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="mt-6">
          <Card className="rounded-[32px] border-border/50 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 bg-primary/5 border-b">
              <div className="flex items-center gap-3">
                <Zap className="text-primary h-6 w-6" />
                <CardTitle className="text-2xl font-headline font-black tracking-tight uppercase">Subscription Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {currentPlan ? (
                <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-slate-50 rounded-[32px] border border-slate-100 gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-2xl font-black">{currentPlan.name}</h4>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-3 py-1 font-black text-[10px] tracking-widest uppercase">{subscriptionStatus}</Badge>
                      </div>
                      <p className="text-slate-500 text-sm font-medium">Billed every {currentPlan.billing_interval || 'month'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-primary">\${currentPlan.price}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Current Tier</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-[32px] border-2 border-dashed">
                  <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h4 className="font-bold text-lg text-slate-600">No Active Subscription</h4>
                </div>
              )}

              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allPlans.map((plan) => (
                  <Card key={plan.id} className={\`rounded-[40px] border-border/50 bg-white transition-all \${currentPlan?.id === plan.id ? 'border-primary ring-2 ring-primary/10 shadow-xl' : 'hover:shadow-2xl'}\`}>
                    <CardHeader className="p-8 pb-4">
                      <CardTitle className="text-xl font-black uppercase tracking-tight">{plan.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-primary">\${plan.price}</span>
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">/ {plan.billing_interval || 'month'}</span>
                      </div>
                      <div className="space-y-2">
                        {(plan.features || []).map((feat, i) => (
                          <div key={i} className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="mt-6 space-y-6">
          <Card className="rounded-[32px] border-border/50 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 bg-muted/30 border-b">
              <div className="flex items-center gap-2">
                <Megaphone className="text-primary h-5 w-5" />
                <CardTitle className="text-xl font-headline font-bold">Search Engine Optimization</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Meta Keywords</Label>
                      <Input 
                        placeholder="e.g. ecommerce, fashion, store" 
                        className="h-12 rounded-xl"
                        value={settings.seo?.keywords}
                        onChange={(e) => setSettings({...settings, seo: {...settings.seo, keywords: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Meta Description</Label>
                      <Textarea 
                        className="rounded-2xl min-h-[120px]" 
                        placeholder="Describe your store for Google results..."
                        value={settings.seo?.description}
                        onChange={(e) => setSettings({...settings, seo: {...settings.seo, description: e.target.value}})}
                      />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Social Share Image (Meta Image)</Label>
                    <CloudinaryUpload 
                      value={settings.seo?.metaImage}
                      onUpload={(url) => setSettings({...settings, seo: {...settings.seo, metaImage: url}})}
                      onRemove={() => setSettings({...settings, seo: {...settings.seo, metaImage: ""}})}
                    />
                    <p className="text-[10px] text-muted-foreground mt-2 italic">Recommended size: 1200x630 pixels for optimal social sharing visibility.</p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
`;

fs.writeFileSync(settingsPath, settingsCode, 'utf8');
console.log("Completely rewrote settings/page.tsx with clean Supabase client API");
