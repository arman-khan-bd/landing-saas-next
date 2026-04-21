"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { Loader2, Save, Globe, Palette, CreditCard, Layout, Megaphone, Share2, AlertCircle, Smartphone, Lock, Truck, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStoreUrl } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function StoreSettingsPage() {
  const { subdomain } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeId, setStoreId] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [settings, setSettings] = useState<any>({
    name: "",
    homePageTitle: "",
    address: "",
    phone: "",
    email: "",
    logo: "",
    favicon: "",
    pwaLogo: "",
    selectedTheme: "modern",
    googleAnalyticsId: "",
    facebookPixelId: "",
    googleMapEmbed: "",
    workingDays: "",
    paymentSettings: {
      cod: true,
      manualEnabled: false,
      manualDetails: "",
      bkashNumber: "",
      nagadNumber: "",
      rocketNumber: ""
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

  useEffect(() => {
    fetchSettings();
  }, [subdomain]);

  const fetchSettings = async () => {
    setLoading(true);
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const q = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        const sId = snap.docs[0].id;
        setStoreId(sId);

        // Fetch subscription to check Pro status with ownership filter
        const subQ = query(
          collection(db, "stores", sId, "subscription"),
          where("ownerId", "==", uid),
          where("status", "in", ["active", "pending"])
        );
        const subSnap = await getDocs(subQ);
        if (!subSnap.empty) {
          const subData = subSnap.docs[0].data();
          const planSnap = await getDoc(doc(db, "subscriptionPlans", subData.planId));
          if (planSnap.exists()) {
            setIsPro(planSnap.data().price > 0);
          }
        }

        setSettings((prev: any) => ({
          ...prev,
          ...data,
          paymentSettings: { ...prev.paymentSettings, ...data.paymentSettings },
          seo: { ...prev.seo, ...data.seo },
          shopConfig: { ...prev.shopConfig, ...data.shopConfig },
          socialLinks: { ...prev.socialLinks, ...data.socialLinks },
          shippingSettings: data.shippingSettings || prev.shippingSettings
        }));
      }
    } catch (error) {
      console.error("Settings Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!storeId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "stores", storeId), settings);
      toast({ title: "Settings Updated", description: "Your store configuration has been saved." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Store Configuration</h1>
          <p className="text-muted-foreground">Manage your brand identity, payments, and tier-specific features.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto rounded-xl h-12 px-8 shadow-lg shadow-primary/20 shrink-0">
          {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <div className="relative">
          <ScrollArea className="w-full">
            <TabsList className="flex w-full grid grid-cols-2 lg:grid-cols-6 h-auto p-1 bg-muted/50 rounded-2xl">
              <TabsTrigger value="general" className="rounded-xl py-3">General</TabsTrigger>
              <TabsTrigger value="domains" className="rounded-xl py-3">Domains</TabsTrigger>
              <TabsTrigger value="branding" className="rounded-xl py-3">Branding</TabsTrigger>
              <TabsTrigger value="payment" className="rounded-xl py-3">Payment</TabsTrigger>
              <TabsTrigger value="shipping" className="rounded-xl py-3">Shipping</TabsTrigger>
              <TabsTrigger value="seo" className="rounded-xl py-3">SEO</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-xl py-3">Advanced</TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>

        <TabsContent value="domains" className="mt-6">
          <Card className="rounded-[32px] border-border/50 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 bg-muted/30 border-b">
              <div className="flex items-center gap-2">
                <Globe className="text-primary h-5 w-5" />
                <CardTitle className="text-xl font-headline font-bold">Domain Management</CardTitle>
              </div>
              <CardDescription>Control how customers access your store online.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="p-6 border rounded-[24px] bg-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold">Standard Subdomain</h4>
                    <p className="text-xs text-muted-foreground">Included with every NexusCart account.</p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 font-black text-[8px] tracking-widest">LIVE</Badge>
                </div>
                <div className="flex items-center gap-2 bg-white border px-4 rounded-xl h-12 text-sm font-bold text-primary">
                  {settings.subdomain}.ihut.shop
                </div>
              </div>

              <div className={`p-6 border-2 border-dashed rounded-[24px] space-y-6 relative overflow-hidden transition-all ${isPro ? 'bg-white border-primary/20' : 'bg-slate-50 opacity-80'}`}>
                {!isPro && (
                  <div className="absolute inset-0 z-10 bg-slate-900/5 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="bg-white p-6 rounded-3xl shadow-2xl text-center space-y-3 max-w-xs border border-primary/10">
                      <Lock className="w-8 h-8 text-primary mx-auto" />
                      <h5 className="font-bold text-lg">Pro Feature</h5>
                      <p className="text-xs text-muted-foreground">Unlock custom domains by upgrading your store to a paid plan.</p>
                      <Button className="w-full rounded-xl font-black text-[10px] uppercase tracking-widest">View Plans</Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold">Custom Domain Mapping</h4>
                    <p className="text-xs text-muted-foreground">Connect your own brand (e.g. store.mybrand.com).</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-none px-3 py-1 font-black text-[8px] tracking-widest uppercase">PRO ONLY</Badge>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Domain</Label>
                      <Input
                        placeholder="e.g. shop.luxury.com"
                        disabled={!isPro}
                        className="h-12 rounded-xl bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">DNS Record Type</Label>
                      <Input disabled value="CNAME" className="h-12 rounded-xl bg-slate-50" />
                    </div>
                  </div>
                  <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">Configuration</p>
                    <p className="text-xs font-mono break-all">Point your domain CNAME record to: <span className="text-primary font-bold">host.ihut.shop</span></p>
                  </div>
                  <Button disabled={!isPro} className="w-full sm:w-auto h-12 px-8 rounded-xl font-black uppercase tracking-widest">Validate Domain</Button>
                </div>
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

        <TabsContent value="analytics" className="mt-6">
          <Card className="rounded-[32px] border-border/50 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 bg-slate-900 border-b">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-primary h-5 w-5" />
                <CardTitle className="text-xl font-headline font-bold text-white uppercase tracking-tight">Security Vault</CardTitle>
              </div>
              <CardDescription className="text-slate-400">Manage your administrative access controls and protection layers.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <h4 className="font-bold text-lg">Management PIN</h4>
                  <p className="text-xs text-slate-500">Enable an extra layer of security before accessing the dashboard.</p>
                </div>
                <Input
                  type="password"
                  placeholder="Enter 4-8 digit PIN"
                  value={settings.managePassword || ""}
                  onChange={(e) => setSettings({ ...settings, managePassword: e.target.value })}
                  className="max-w-[240px] h-12 rounded-xl text-center font-mono text-xl tracking-[0.5em]"
                />
              </div>

              <div className="p-8 border-2 border-rose-100 rounded-[32px] bg-rose-50/30 space-y-4">
                <div className="flex items-center gap-3 text-rose-600">
                  <AlertCircle className="w-5 h-5" />
                  <h4 className="font-black uppercase tracking-widest text-xs">Danger Zone</h4>
                </div>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900">Permanently Delete Store</p>
                    <p className="text-xs text-slate-500">This action will erase all products, orders, and customer data. It cannot be undone.</p>
                  </div>
                  <Button variant="destructive" className="rounded-xl h-11 px-8 font-bold">Delete This Store</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="mt-6">
          <Card className="rounded-[32px] border-border/50 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 bg-muted/30 border-b">
              <div className="flex items-center gap-2">
                <Layout className="text-primary h-5 w-5" />
                <CardTitle className="text-xl font-headline font-bold">Business Records</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Legal Store Name</Label>
                  <Input className="h-12 rounded-xl" value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Primary Contact Email</Label>
                  <Input className="h-12 rounded-xl" type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Business Address</Label>
                <Textarea className="rounded-2xl min-h-[100px]" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}