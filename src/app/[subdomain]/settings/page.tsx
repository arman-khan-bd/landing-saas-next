"use client";

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
import { Loader2, Save, Globe, CreditCard, Layout, Megaphone, Lock, Truck, ShieldCheck, Zap, CheckCircle2, Clock, Copy, Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [expiryDate, setExpiryDate] = useState<any>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  // Payment states
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [transactionId, setTransactionId] = useState("");

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
          homePageTitle: storeData.home_page_title || storeData.homePageTitle || "",
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
      const updatePayload = {
        name: settings.name,
        logo: settings.logo,
        favicon: settings.favicon,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        home_page_title: settings.homePageTitle,
        payment_settings: settings.paymentSettings,
        shipping_settings: settings.shippingSettings,
        seo: settings.seo,
        shop_config: settings.shopConfig,
        social_links: settings.socialLinks,
        google_analytics_id: settings.googleAnalyticsId,
        facebook_pixel_id: settings.facebookPixelId,
        google_map_embed: settings.googleMapEmbed,
        working_days: settings.workingDays,
        selected_theme: settings.selectedTheme,
        updated_at: new Date().toISOString()
      };
      await supabase.from("stores").update(updatePayload).eq("id", storeId);
      toast({ title: "Settings Updated", description: "Your store configuration has been saved." });
    } catch (error) {
      console.error("Save Settings Error:", error);
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
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold">Store Configuration</h1>
          <p className="text-muted-foreground text-xs">Manage your brand identity, payments, and tier-specific features.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto rounded-xl h-11 px-6 shadow-lg shadow-primary/10 shrink-0">
          {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side Tab Navigation */}
        <div className="lg:col-span-1 bg-slate-50 p-2 rounded-2xl border border-border/50 shadow-sm flex flex-col gap-1 w-full">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-3 py-1.5">Settings Tab</p>
          <TabsList className="flex flex-col w-full h-auto bg-transparent gap-1 p-0">
            <TabsTrigger value="general" className="w-full justify-start rounded-xl py-2.5 px-3 text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-primary shadow-sm border border-transparent data-[state=active]:border-border/40 gap-2 flex items-center"><Layout className="h-4 w-4 text-slate-400" /> General</TabsTrigger>
            <TabsTrigger value="domains" className="w-full justify-start rounded-xl py-2.5 px-3 text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-primary shadow-sm border border-transparent data-[state=active]:border-border/40 gap-2 flex items-center"><Globe className="h-4 w-4 text-slate-400" /> Domains</TabsTrigger>
            <TabsTrigger value="payment" className="w-full justify-start rounded-xl py-2.5 px-3 text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-primary shadow-sm border border-transparent data-[state=active]:border-border/40 gap-2 flex items-center"><CreditCard className="h-4 w-4 text-slate-400" /> Payment</TabsTrigger>
            <TabsTrigger value="shipping" className="w-full justify-start rounded-xl py-2.5 px-3 text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-primary shadow-sm border border-transparent data-[state=active]:border-border/40 gap-2 flex items-center"><Truck className="h-4 w-4 text-slate-400" /> Shipping</TabsTrigger>
            <TabsTrigger value="subscription" className="w-full justify-start rounded-xl py-2.5 px-3 text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-primary shadow-sm border border-transparent data-[state=active]:border-border/40 gap-2 flex items-center"><Zap className="h-4 w-4 text-slate-400" /> Subscription</TabsTrigger>
            <TabsTrigger value="seo" className="w-full justify-start rounded-xl py-2.5 px-3 text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-primary shadow-sm border border-transparent data-[state=active]:border-border/40 gap-2 flex items-center"><Megaphone className="h-4 w-4 text-slate-400" /> SEO</TabsTrigger>
          </TabsList>
        </div>

        {/* Right Side Content - Reduced Padding */}
        <div className="lg:col-span-3 space-y-6 w-full mt-0">
          <TabsContent value="general" className="mt-0 space-y-6">
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-5 bg-muted/20 border-b">
                <div className="flex items-center gap-2">
                  <Layout className="text-primary h-4.5 w-4.5" />
                  <CardTitle className="text-base font-headline font-bold">Store Identity</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Store Name</Label>
                      <Input className="h-10 rounded-xl text-sm" value={settings.name || ""} onChange={(e) => setSettings({ ...settings, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Store Subtitle / Slogan</Label>
                      <Input className="h-10 rounded-xl text-sm" value={settings.homePageTitle || ""} onChange={(e) => setSettings({ ...settings, homePageTitle: e.target.value })} placeholder="e.g. Quality you can trust" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Primary Contact Email</Label>
                      <Input className="h-10 rounded-xl text-sm" type="email" value={settings.email || ""} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Phone Number</Label>
                      <Input className="h-10 rounded-xl text-sm" value={settings.phone || ""} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Store Logo</Label>
                    <CloudinaryUpload
                      value={settings.logo}
                      onUpload={(url) => setSettings({ ...settings, logo: url })}
                      onRemove={() => setSettings({ ...settings, logo: "" })}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Favicon (32x32)</Label>
                    <CloudinaryUpload
                      value={settings.favicon}
                      onUpload={(url) => setSettings({ ...settings, favicon: url })}
                      onRemove={() => setSettings({ ...settings, favicon: "" })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Business Physical Address</Label>
                  <Textarea className="rounded-xl min-h-[80px] text-sm" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domains" className="mt-0">
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-5 bg-muted/20 border-b">
                <div className="flex items-center gap-2">
                  <Globe className="text-primary h-4.5 w-4.5" />
                  <CardTitle className="text-base font-headline font-bold">Domain Management</CardTitle>
                </div>
                <CardDescription className="text-xs">Control how customers access your store online.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                <div className="p-4 border rounded-xl bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm">Standard Subdomain</h4>
                      <p className="text-xs text-muted-foreground">Included with every account.</p>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none px-2.5 py-0.5 font-black text-[8px] tracking-widest uppercase">Live</Badge>
                  </div>
                  <div className="flex items-center gap-2 bg-white border px-3 rounded-lg h-10 text-xs font-bold text-primary">
                    {settings.subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'ihut.shop'}
                  </div>
                </div>

                <div className={"p-4 border-2 border-dashed rounded-xl space-y-6 relative overflow-hidden transition-all " + (isPro ? "bg-white border-primary/20" : "bg-slate-50 opacity-80")}>
                  {!isPro && (
                    <div className="absolute inset-0 z-10 bg-slate-900/5 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="bg-white p-5 rounded-2xl shadow-xl text-center space-y-3 max-w-xs border border-primary/10">
                        <Lock className="w-8 h-8 text-primary mx-auto" />
                        <h5 className="font-headline font-black text-lg">PRO FEATURE</h5>
                        <p className="text-xs text-muted-foreground">Custom domains require an active Pro subscription.</p>
                        <Button onClick={() => setActiveTab("subscription")} className="w-full h-10 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">Upgrade Now</Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-base">Request Custom Domain</h4>
                      <p className="text-xs text-muted-foreground">Connect your own brand (e.g. shop.luxury.com).</p>
                    </div>
                    <Badge className="bg-primary text-white border-none px-2.5 py-0.5 font-black text-[8px] tracking-widest uppercase">PRO</Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        placeholder="e.g. shop.luxury.com"
                        disabled={!isPro || requestingDomain}
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        className="h-10 rounded-xl bg-white text-sm"
                      />
                      <Button
                        disabled={!isPro || requestingDomain || !newDomain}
                        onClick={handleRequestDomain}
                        className="h-10 px-6 rounded-xl font-black uppercase tracking-tight shadow-xl shadow-primary/10"
                      >
                        {requestingDomain ? <Loader2 className="animate-spin w-4 h-4" /> : "Request Domain"}
                      </Button>
                    </div>

                    {domainRequests.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Request History</h5>
                        <div className="grid gap-3">
                          {domainRequests.map((req) => (
                            <div key={req.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-primary" />
                                  <span className="font-bold text-sm text-slate-700">{req.domain}</span>
                                </div>
                                <Badge className={cn(
                                  "border-none px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                  req.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                    req.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                                      'bg-amber-100 text-amber-600'
                                )}>
                                  {req.status}
                                </Badge>
                              </div>

                              {req.status === 'approved' && req.dns_records && Array.isArray(req.dns_records) && (
                                <div className="animate-in slide-in-from-top-2 duration-300">
                                  <div className="p-4 bg-white rounded-xl border border-primary/10 space-y-4 shadow-sm">
                                    <div className="flex items-center gap-1.5 text-primary">
                                      <ShieldCheck className="w-4 h-4" />
                                      <p className="text-[9px] font-black uppercase tracking-widest">DNS Configuration</p>
                                    </div>

                                    <Table>
                                      <TableHeader className="bg-slate-50">
                                        <TableRow className="hover:bg-transparent">
                                          <TableHead className="text-[9px] font-black uppercase p-2 h-auto">Type</TableHead>
                                          <TableHead className="text-[9px] font-black uppercase p-2 h-auto">Host</TableHead>
                                          <TableHead className="text-[9px] font-black uppercase p-2 h-auto">Value</TableHead>
                                          <TableHead className="text-right p-2 h-auto"></TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {req.dns_records.map((r: any, idx: number) => (
                                          <TableRow key={idx}>
                                            <TableCell className="p-2 h-auto"><Badge variant="outline" className="font-bold bg-primary/5 text-primary border-primary/10 text-[9px] px-1.5 py-0.5">{r.type}</Badge></TableCell>
                                            <TableCell className="font-mono text-[10px] p-2 h-auto">{r.host}</TableCell>
                                            <TableCell className="font-mono text-[10px] max-w-[150px] truncate p-2 h-auto">{r.value}</TableCell>
                                            <TableCell className="text-right p-2 h-auto">
                                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-slate-100" onClick={() => copyToClipboard(r.value)}>
                                                <Copy className="w-3 h-3" />
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

          <TabsContent value="payment" className="mt-0">
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-5 bg-muted/20 border-b">
                <div className="flex items-center gap-2">
                  <CreditCard className="text-primary h-4.5 w-4.5" />
                  <CardTitle className="text-base font-headline font-bold">Payment Methods</CardTitle>
                </div>
                <CardDescription className="text-xs">Activate and configure checkout options for your customers.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm">Cash on Delivery (COD)</h4>
                    <p className="text-xs text-muted-foreground">Customers pay upon order receipt.</p>
                  </div>
                  <Switch
                    checked={settings.paymentSettings?.cod}
                    onCheckedChange={(val) => setSettings({
                      ...settings,
                      paymentSettings: { ...settings.paymentSettings, cod: val }
                    })}
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-indigo-600 text-sm">Manual / Mobile Payment</h4>
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
                    <div className="animate-in slide-in-from-top-2 duration-300 space-y-4 pt-3 border-t border-slate-200">
                      <div className="space-y-3">
                        {settings.paymentSettings.manualMethods?.map((method: any, idx: number) => (
                          <div key={method.id} className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-sm relative group">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeManualPaymentMethod(method.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-slate-400">Provider Name</Label>
                                <Input
                                  value={method.name}
                                  onChange={(e) => updateManualPaymentMethod(method.id, "name", e.target.value)}
                                  placeholder="e.g. bKash Personal"
                                  className="h-10 rounded-xl bg-slate-50 border-none text-xs text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-slate-400">Account Number</Label>
                                <Input
                                  value={method.number}
                                  onChange={(e) => updateManualPaymentMethod(method.id, "number", e.target.value)}
                                  placeholder="01XXXXXXXXX"
                                  className="h-10 rounded-xl bg-slate-50 border-none text-xs text-slate-800"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[9px] font-black uppercase text-slate-400">Instructions</Label>
                              <Textarea
                                value={method.instructions}
                                onChange={(e) => updateManualPaymentMethod(method.id, "instructions", e.target.value)}
                                placeholder="Detailed payment instructions for this method..."
                                className="rounded-xl bg-slate-50 border-none min-h-[70px] text-xs text-slate-800"
                              />
                            </div>
                          </div>
                        ))}

                        <Button
                          onClick={addManualPaymentMethod}
                          variant="outline"
                          className="w-full h-11 border-dashed border-2 rounded-xl text-indigo-600 font-bold gap-2 text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Mobile Banking / Manual Method
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="mt-0">
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-5 bg-muted/20 border-b flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Truck className="text-primary h-4.5 w-4.5" />
                    <CardTitle className="text-base font-headline font-bold">Shipping Methods</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Configure delivery areas and shipping costs for your store.</CardDescription>
                </div>
                <Switch
                  checked={settings.shippingSettings?.enabled}
                  onCheckedChange={(val) => setSettings({
                    ...settings,
                    shippingSettings: { ...settings.shippingSettings, enabled: val }
                  })}
                />
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-3">
                  {settings.shippingSettings?.methods.map((method: any, index: number) => (
                    <div key={method.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Method Name</Label>
                        <Input
                          value={method.name || ""}
                          onChange={(e) => {
                            const newMethods = [...settings.shippingSettings.methods];
                            newMethods[index].name = e.target.value;
                            setSettings({ ...settings, shippingSettings: { ...settings.shippingSettings, methods: newMethods } });
                          }}
                          className="h-10 rounded-xl bg-white border-none text-xs text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cost ($)</Label>
                        <Input
                          type="number"
                          value={method.cost ?? 0}
                          onChange={(e) => {
                            const newMethods = [...settings.shippingSettings.methods];
                            newMethods[index].cost = parseFloat(e.target.value) || 0;
                            setSettings({ ...settings, shippingSettings: { ...settings.shippingSettings, methods: newMethods } });
                          }}
                          className="h-10 rounded-xl bg-white border-none text-xs text-slate-800"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          const newMethods = settings.shippingSettings.methods.filter((_: any, i: number) => i !== index);
                          setSettings({ ...settings, shippingSettings: { ...settings.shippingSettings, methods: newMethods } });
                        }}
                        className="h-10 rounded-xl w-full md:w-auto text-xs"
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
                    className="w-full h-11 border-dashed rounded-xl text-primary font-bold text-xs"
                  >
                    + Add Shipping Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="mt-0">
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-5 bg-primary/5 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="text-primary h-4.5 w-4.5" />
                    <CardTitle className="text-base font-headline font-black tracking-tight uppercase">Subscription</CardTitle>
                  </div>
                  {subscriptionStatus === "pending" && (
                    <Badge className="bg-amber-500/10 text-amber-600 border-none px-3 py-1 font-black text-[9px] tracking-widest uppercase">Verification Pending</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                {currentPlan ? (
                  <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-black text-slate-800">{currentPlan.name}</h4>
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-2 py-0.5 font-black text-[8px] tracking-widest uppercase">{subscriptionStatus}</Badge>
                        </div>
                        <p className="text-slate-500 text-xs font-medium">
                          Billed every {currentPlan.billing_interval || 'month'}
                          {expiryDate && ` (Expires: ${new Date(expiryDate).toLocaleDateString()})`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-primary">${currentPlan.price}</p>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Current Tier</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed">
                    <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h4 className="font-bold text-sm text-slate-600">No Active Subscription</h4>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allPlans.map((plan) => (
                    <Card key={plan.id} className={`rounded-2xl border-border/50 bg-white transition-all flex flex-col justify-between ${currentPlan?.id === plan.id ? 'border-primary ring-2 ring-primary/10 shadow-lg' : 'hover:shadow-xl'}`}>
                      <div>
                        <CardHeader className="p-5 pb-2">
                          <CardTitle className="text-sm font-black uppercase tracking-tight text-slate-800">{plan.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0 space-y-4">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-primary">${plan.price}</span>
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">/ {plan.billing_interval || 'month'}</span>
                          </div>
                          <div className="space-y-1.5">
                            {(plan.features || []).map((feat: string, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="truncate">{feat}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </div>
                      <div className="p-5 pt-0">
                        {currentPlan?.id === plan.id ? (
                          <Button disabled className="w-full rounded-xl h-10 font-bold text-xs bg-slate-100 text-slate-400 border-none">
                            Active Tier
                          </Button>
                        ) : (
                          <Button
                            onClick={() => {
                              setSelectedPlanForPayment(plan);
                              if (saasPaymentMethods.length > 0) {
                                setSelectedPaymentMethod(saasPaymentMethods[0]);
                              }
                            }}
                            className="w-full rounded-xl h-10 font-bold text-xs shadow-md shadow-primary/10"
                          >
                            {plan.price === 0 ? "Select Free Plan" : "Upgrade Plan"}
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment & Activation Dialog */}
            {selectedPlanForPayment && (
              <Dialog open={!!selectedPlanForPayment} onOpenChange={(open) => { if (!open) setSelectedPlanForPayment(null); }}>
                <DialogContent className="rounded-3xl bg-white border-none shadow-2xl max-w-md p-6 text-slate-800">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-headline font-black text-slate-900 uppercase">Activate Plan</DialogTitle>
                    <DialogDescription className="text-slate-500 text-xs">
                      Submit payment details to subscribe to <strong>{selectedPlanForPayment.name}</strong> tier.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="flex justify-between items-center p-3 bg-indigo-50/50 rounded-xl border border-indigo-50">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tear Pricing</p>
                        <p className="text-lg font-black text-indigo-600">${selectedPlanForPayment.price} / {selectedPlanForPayment.billing_interval}</p>
                      </div>
                    </div>

                    {selectedPlanForPayment.price > 0 ? (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-600">Select Payment Gateway</Label>
                          <Select
                            value={selectedPaymentMethod?.id}
                            onValueChange={(val) => {
                              const found = saasPaymentMethods.find(m => m.id === val);
                              if (found) setSelectedPaymentMethod(found);
                            }}
                          >
                            <SelectTrigger className="h-10 rounded-xl border-slate-200">
                              <SelectValue placeholder="Choose payment method" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {saasPaymentMethods.map((method) => (
                                <SelectItem key={method.id} value={method.id}>{method.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedPaymentMethod && (
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 animate-in fade-in duration-300">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Instructions</p>
                            <div className="text-xs font-bold text-slate-700 whitespace-pre-wrap">{selectedPaymentMethod.details || selectedPaymentMethod.instructions}</div>
                            {selectedPaymentMethod.number && (
                              <div className="flex items-center justify-between pt-2 border-t text-xs">
                                <span className="font-bold text-slate-500">Account No:</span>
                                <span className="font-mono font-black text-indigo-600">{selectedPaymentMethod.number}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-600">Transaction ID / Reference Number</Label>
                          <Input
                            placeholder="Enter the transaction ID or receipt code"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="h-10 rounded-xl border-slate-200"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600 text-xs font-medium">
                        This is a Free/Trial plan. No payment proof is required to activate.
                      </div>
                    )}
                  </div>

                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setSelectedPlanForPayment(null)} className="rounded-xl h-11 text-xs">
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          const { data: { user } } = await supabase.auth.getUser();
                          if (!user) return;

                          if (selectedPlanForPayment.price > 0) {
                            if (!selectedPaymentMethod || !transactionId) {
                              toast({ variant: "destructive", title: "Missing Details", description: "Please complete payment info." });
                              return;
                            }

                            // 1. Insert saas_transactions record
                            const { error: txError } = await supabase
                              .from("saas_transactions")
                              .insert({
                                owner_id: user.id,
                                store_id: storeId,
                                plan_id: selectedPlanForPayment.id,
                                amount: selectedPlanForPayment.price,
                                currency: selectedPlanForPayment.currency || 'USD',
                                payment_method: selectedPaymentMethod.name,
                                transaction_id: transactionId,
                                status: 'pending'
                              });

                            if (txError) throw txError;

                            // 2. Upsert subscriptions record as pending
                            const { error: subError } = await supabase
                              .from("subscriptions")
                              .upsert({
                                store_id: storeId,
                                owner_id: user.id,
                                plan_id: selectedPlanForPayment.id,
                                status: 'pending'
                              });

                            if (subError) throw subError;

                            toast({ title: "Activation Pending", description: "Payment submitted. Admin will verify shortly." });
                          } else {
                            // Free Plan - auto activate
                            const { error: subError } = await supabase
                              .from("subscriptions")
                              .upsert({
                                store_id: storeId,
                                owner_id: user.id,
                                plan_id: selectedPlanForPayment.id,
                                status: 'active'
                              });

                            if (subError) throw subError;
                            toast({ title: "Plan Activated", description: "Free plan has been activated successfully." });
                          }

                          setSelectedPlanForPayment(null);
                          setTransactionId("");
                          fetchSettings();
                        } catch (e) {
                          console.error(e);
                          toast({ variant: "destructive", title: "Submission Failed" });
                        }
                      }}
                      className="rounded-xl h-11 text-xs"
                    >
                      {selectedPlanForPayment.price > 0 ? "Submit Proof" : "Activate"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          <TabsContent value="seo" className="mt-0 space-y-6">
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-5 bg-muted/30 border-b">
                <div className="flex items-center gap-2">
                  <Megaphone className="text-primary h-4.5 w-4.5" />
                  <CardTitle className="text-base font-headline font-bold">SEO Optimization</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Meta Keywords</Label>
                      <Input
                        placeholder="e.g. ecommerce, fashion, store"
                        className="h-10 rounded-xl text-sm"
                        value={settings.seo?.keywords || ""}
                        onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, keywords: e.target.value } })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Meta Description</Label>
                      <Textarea
                        className="rounded-xl min-h-[100px] text-sm text-slate-800"
                        placeholder="Describe your store for Google results..."
                        value={settings.seo?.description || ""}
                        onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, description: e.target.value } })}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Social Share Image</Label>
                    <CloudinaryUpload
                      value={settings.seo?.metaImage}
                      onUpload={(url) => setSettings({ ...settings, seo: { ...settings.seo, metaImage: url } })}
                      onRemove={() => setSettings({ ...settings, seo: { ...settings.seo, metaImage: "" } })}
                    />
                    <p className="text-[9px] text-muted-foreground mt-1 italic">Recommended size: 1200x630 pixels.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
