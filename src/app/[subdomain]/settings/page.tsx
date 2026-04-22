"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { Loader2, Save, Globe, Palette, CreditCard, Layout, Megaphone, Share2, AlertCircle, Smartphone, Lock, Truck, ShieldCheck, Zap, CheckCircle2, Clock, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStoreUrl } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

export default function StoreSettingsPage() {
  const { subdomain } = useParams();
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
            const plan = planSnap.data();
            setCurrentPlan({ id: planSnap.id, ...plan });
            setSubscriptionStatus(subData.status);

            if (subData.currentPeriodEnd) {
              const end = subData.currentPeriodEnd.toDate ? subData.currentPeriodEnd.toDate() : new Date(subData.currentPeriodEnd);
              setExpiryDate(end);
              const diff = end.getTime() - new Date().getTime();
              const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
              setDaysRemaining(days);
              // Set Pro status only if not expired
              setIsPro(plan.price > 0 && days > 0);
            } else {
              setIsPro(plan.price > 0);
            }
          }
        }

        // Fetch all plans
        const plansQ = query(collection(db, "subscriptionPlans"), where("isActive", "==", true));
        const plansSnap = await getDocs(plansQ);
        setAllPlans(plansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch SaaS payment methods
        const payQ = query(collection(db, "saasPaymentMethods"), where("isActive", "==", true));
        const paySnap = await getDocs(payQ);
        setSaasPaymentMethods(paySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="relative">
          <ScrollArea className="w-full">
            <TabsList className="flex w-full grid grid-cols-2 lg:grid-cols-7 h-auto p-1 bg-muted/50 rounded-2xl">
              <TabsTrigger value="general" className="rounded-xl py-3">General</TabsTrigger>
              <TabsTrigger value="domains" className="rounded-xl py-3">Domains</TabsTrigger>
              <TabsTrigger value="branding" className="rounded-xl py-3">Branding</TabsTrigger>
              <TabsTrigger value="payment" className="rounded-xl py-3">Payment</TabsTrigger>
              <TabsTrigger value="shipping" className="rounded-xl py-3">Shipping</TabsTrigger>
              <TabsTrigger value="subscription" className="rounded-xl py-3">Subscription</TabsTrigger>
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
                    <p className="text-xs text-muted-foreground">Included with every IHut.Shop account.</p>
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
                      <Button onClick={() => setActiveTab("subscription")} className="w-full rounded-xl font-black text-[10px] uppercase tracking-widest">View Plans</Button>
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

        <TabsContent value="subscription" className="mt-6">
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[32px] border-border/50 shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-8 bg-primary/5 border-b">
                <div className="flex items-center gap-3">
                  <Zap className="text-primary h-6 w-6" />
                  <div>
                    <CardTitle className="text-2xl font-headline font-black tracking-tight uppercase">Subscription Management</CardTitle>
                    <CardDescription>Upgrade your store limits and unlock premium features.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {daysRemaining !== null && daysRemaining <= 10 && daysRemaining > 0 && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4 text-amber-800">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                    <div className="flex-1">
                      <p className="font-bold">Subscription Expiring Soon</p>
                      <p className="text-xs">Your subscription will expire in {daysRemaining} days. Please upgrade or renew to keep your Pro features active.</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-amber-300 text-amber-700" onClick={() => {
                      const element = document.getElementById("plan-selection-grid");
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}>Upgrade Now</Button>
                  </div>
                )}

                {daysRemaining !== null && daysRemaining <= 0 && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-4 text-rose-800">
                    <AlertCircle className="w-6 h-6 text-rose-600" />
                    <div className="flex-1">
                      <p className="font-bold">Subscription Expired</p>
                      <p className="text-xs">Your subscription has expired. Pro features are now disabled. Upgrade now to restore access.</p>
                    </div>
                  </div>
                )}

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
                        <p className="text-slate-500 text-sm font-medium">Billed every {currentPlan.billingInterval}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-primary">${currentPlan.price}</p>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Current Tier</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-[32px] border-2 border-dashed">
                    <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h4 className="font-bold text-lg text-slate-600">No Active Subscription</h4>
                    <p className="text-sm text-slate-400">Select a plan below to get started with Pro features.</p>
                  </div>
                )}

                <div id="plan-selection-grid" className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {allPlans.map((plan) => (
                    <Card key={plan.id} className={`group relative rounded-[40px] border-border/50 bg-white transition-all duration-500 overflow-hidden flex flex-col ${currentPlan?.id === plan.id ? 'border-primary ring-2 ring-primary/10 shadow-xl' : 'hover:shadow-2xl'}`}>
                      <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-black uppercase tracking-tight mb-1">{plan.name}</CardTitle>
                        <CardDescription className="text-sm line-clamp-2">{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-8 pt-0 flex-1 space-y-6">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-4xl font-black text-primary">${plan.price}</span>
                          <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">/ {plan.billingInterval}</span>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Privileges</p>
                          <div className="grid gap-3">
                            {(plan.features || []).map((feat: string, i: number) => (
                              <div key={i} className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                      <div className="p-8 pt-0">
                        {currentPlan?.id === plan.id ? (
                          <Button disabled className="w-full h-12 rounded-xl text-sm font-black uppercase tracking-tight bg-slate-100 text-slate-400">
                            Active Plan
                          </Button>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => {
                                  setSelectedPlanForPayment(plan);
                                  setSelectedPaymentMethod(null);
                                  setTransactionId("");
                                }}
                                disabled={subscriptionStatus === "pending"}
                                className="w-full h-12 rounded-xl text-sm font-black uppercase tracking-tight shadow-lg shadow-primary/10"
                              >
                                {subscriptionStatus === "pending" ? "Request Pending" : "Select Plan"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-[40px] bg-white border-none shadow-2xl max-w-lg">
                              <DialogHeader>
                                <DialogTitle className="text-3xl font-headline font-black tracking-tight">Complete Subscription</DialogTitle>
                                <DialogDescription>You are subscribing to the <span className="text-primary font-black">{plan.name}</span> plan for <span className="text-primary font-black">${plan.price}/{plan.billingInterval}</span></DialogDescription>
                              </DialogHeader>

                              <div className="py-6 space-y-6">
                                <div className="space-y-2">
                                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Payment Method</p>
                                  <div className="grid grid-cols-1 gap-3">
                                    {saasPaymentMethods.length === 0 ? (
                                      <p className="text-sm text-amber-600 font-medium">No manual payment methods available. Please contact admin.</p>
                                    ) : (
                                      saasPaymentMethods.map(method => (
                                        <div
                                          key={method.id}
                                          onClick={() => setSelectedPaymentMethod(method)}
                                          className={`p-4 border-2 rounded-2xl transition-all cursor-pointer group ${selectedPaymentMethod?.id === method.id ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}
                                        >
                                          <div className="flex items-center justify-between mb-1">
                                            <h5 className={`font-bold transition-colors ${selectedPaymentMethod?.id === method.id ? 'text-primary' : 'text-slate-900'}`}>{method.name}</h5>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod?.id === method.id ? 'border-primary bg-primary text-white' : 'border-slate-300'}`}>
                                              {selectedPaymentMethod?.id === method.id && <CheckCircle2 className="w-3 h-3" />}
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>

                                  {selectedPaymentMethod && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                                      <div className="p-5 bg-slate-900 rounded-[24px] text-white space-y-3 shadow-xl">
                                        <div className="flex items-center gap-2 text-primary">
                                          <Info className="w-4 h-4" />
                                          <p className="text-[10px] font-black uppercase tracking-widest">Payment Instructions</p>
                                        </div>
                                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedPaymentMethod.details}</p>
                                      </div>

                                      <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Transaction ID / Proof</Label>
                                        <Input
                                          placeholder="Enter the transaction ID or reference"
                                          value={transactionId}
                                          onChange={(e) => setTransactionId(e.target.value)}
                                          className="h-12 rounded-xl border-slate-200 focus:ring-primary focus:border-primary"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>

                              </div>

                              <DialogFooter>
                                <Button
                                  disabled={!selectedPaymentMethod || !transactionId}
                                  className="w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-all disabled:opacity-50 disabled:grayscale"
                                  onClick={async () => {
                                    try {
                                      const uid = auth.currentUser?.uid;
                                      if (!uid || !storeId || !selectedPaymentMethod || !transactionId) return;

                                      // 1. Create subcollection entry for store-specific tracking
                                      await addDoc(collection(db, "stores", storeId, "subscription"), {
                                        planId: plan.id,
                                        planName: plan.name,
                                        ownerId: uid,
                                        status: "pending",
                                        paymentMethodId: selectedPaymentMethod.id,
                                        paymentMethodName: selectedPaymentMethod.name,
                                        transactionId: transactionId,
                                        createdAt: serverTimestamp(),
                                        updatedAt: serverTimestamp()
                                      });

                                      // 2. Create global transaction entry for SaaS Admin
                                      await addDoc(collection(db, "saas_transactions"), {
                                        storeId: storeId,
                                        storeName: settings.name,
                                        subdomain: subdomain,
                                        ownerId: uid,
                                        planId: plan.id,
                                        planName: plan.name,
                                        amount: plan.price,
                                        paymentMethodId: selectedPaymentMethod.id,
                                        paymentMethodName: selectedPaymentMethod.name,
                                        transactionId: transactionId,
                                        status: "pending",
                                        createdAt: serverTimestamp(),
                                        updatedAt: serverTimestamp()
                                      });

                                      toast({ title: "Request Submitted", description: "Admin will verify your payment soon." });
                                      setSelectedPaymentMethod(null);
                                      setTransactionId("");
                                      fetchSettings();
                                    } catch (e) {
                                      toast({ variant: "destructive", title: "Error submitting request" });
                                    }
                                  }}
                                >
                                  Submit Payment Verification
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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