
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { Loader2, Save, Globe, Palette, CreditCard, Layout, Megaphone, Share2, AlertCircle, Smartphone, Lock, Truck, ShieldCheck, Zap, CheckCircle2, Clock, Info, ArrowUpRight, Copy, Database, Image as ImageIcon, Search, Plus, Trash2, BarChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStoreUrl, cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    otpVerification: true,
    currency: "BDT",
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

        // Fetch subscription to check Pro status
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
              setIsPro(plan.price > 0 && days > 0);
            } else {
              setIsPro(plan.price > 0);
            }
          }
        }

        // Fetch Domain Requests
        const domQ = query(
          collection(db, "custom_domain_requests"),
          where("storeId", "==", sId),
          where("ownerId", "==", uid)
        );
        
        onSnapshot(domQ, (s) => {
          setDomainRequests(s.docs.map(d => ({ id: d.id, ...d.data() })));
        }, async (err) => {
          const permissionError = new FirestorePermissionError({
            path: "custom_domain_requests",
            operation: "list",
          });
          errorEmitter.emit('permission-error', permissionError);
        });

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
          paymentSettings: { 
            ...prev.paymentSettings, 
            ...data.paymentSettings,
            manualMethods: data.paymentSettings?.manualMethods || []
          },
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

  const handleRequestDomain = async () => {
    if (!newDomain || !storeId || !auth.currentUser) return;
    setRequestingDomain(true);
    try {
      await addDoc(collection(db, "custom_domain_requests"), {
        storeId,
        storeName: settings.name,
        subdomain,
        ownerId: auth.currentUser.uid,
        domain: newDomain.toLowerCase().trim(),
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast({ title: "Request Submitted", description: "Admin will review your custom domain request." });
      setNewDomain("");
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
      await updateDoc(doc(db, "stores", storeId), settings);
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
              <TabsTrigger value="marketing" className="rounded-xl py-3 text-xs font-bold">Marketing</TabsTrigger>
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
                <div className="space-y-2">
                  <Label>Store Currency</Label>
                  <Select value={settings.currency || 'BDT'} onValueChange={(val) => setSettings({ ...settings, currency: val })}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BDT">BDT (৳)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Select the primary currency for your products and analytics.</p>
                </div>
                <div className="space-y-2">
                  <Label>Working Days / Hours</Label>
                  <Input className="h-12 rounded-xl" value={settings.workingDays} onChange={(e) => setSettings({ ...settings, workingDays: e.target.value })} placeholder="e.g. Sat-Thu, 10am-8pm" />
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

              <div className={`p-6 border-2 border-dashed rounded-[24px] space-y-8 relative overflow-hidden transition-all ${isPro ? 'bg-white border-primary/20' : 'bg-slate-50 opacity-80'}`}>
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

                            {req.status === 'approved' && req.dnsRecords && Array.isArray(req.dnsRecords) && (
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
                                      {req.dnsRecords.map((r: any, idx: number) => (
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

              <div className="flex items-center justify-between p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold">OTP Verification</h4>
                    <p className="text-xs text-muted-foreground">Require customers to verify their phone number via SMS.</p>
                  </div>
                </div>
                <Switch
                  checked={settings.otpVerification}
                  disabled={currentPlan && (settings.smsCount || 0) >= (currentPlan.smsLimit || 0)}
                  onCheckedChange={(val) => setSettings({
                    ...settings,
                    otpVerification: val
                  })}
                />
              </div>
              {currentPlan && (settings.smsCount || 0) >= (currentPlan.smsLimit || 0) && (
                <div className="mt-2 p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-center gap-2 text-rose-600">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-[10px] font-bold uppercase">SMS limit reached for your plan. Please upgrade to reactivate OTP.</p>
                </div>
              )}

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
                </div>
              )}

              {currentPlan && (
                <div className="mt-8 p-8 bg-indigo-50/30 rounded-[32px] border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">SMS Verification Usage</h4>
                      <p className="text-xs text-slate-500">Track your verification message consumption.</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center sm:items-end gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-indigo-600">{settings.smsCount || 0}</span>
                      <span className="text-slate-400 font-bold">/ {currentPlan.smsLimit || 0}</span>
                    </div>
                    <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 transition-all duration-1000" 
                        style={{ width: `${Math.min(((settings.smsCount || 0) / (currentPlan.smsLimit || 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mt-1">
                      {Math.max(0, (currentPlan.smsLimit || 0) - (settings.smsCount || 0))} Messages Remaining
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allPlans.map((plan) => (
                  <Card key={plan.id} className={`rounded-[40px] border-border/50 bg-white transition-all ${currentPlan?.id === plan.id ? 'border-primary ring-2 ring-primary/10 shadow-xl' : 'hover:shadow-2xl'}`}>
                    <CardHeader className="p-8 pb-4">
                      <CardTitle className="text-xl font-black uppercase tracking-tight">{plan.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-primary">${plan.price}</span>
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">/ {plan.billingInterval}</span>
                      </div>
                      <div className="space-y-2">
                        {(plan.features || []).map((feat: string, i: number) => (
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

        <TabsContent value="marketing" className="mt-6">
          <Card className="rounded-[32px] border-border/50 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 bg-muted/30 border-b">
              <div className="flex items-center gap-2">
                <BarChart className="text-primary h-5 w-5" />
                <CardTitle className="text-xl font-headline font-bold">Tracking & Marketing</CardTitle>
              </div>
              <CardDescription>Integrate analytics tools to track customer behavior and optimize sales.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">Facebook Pixel</h4>
                      <p className="text-[10px] text-muted-foreground uppercase font-black">Meta Ad Tracking</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Pixel ID</Label>
                    <Input 
                        placeholder="e.g. 123456789012345" 
                        className="h-12 rounded-xl bg-white"
                        value={settings.facebookPixelId}
                        onChange={(e) => setSettings({ ...settings, facebookPixelId: e.target.value })}
                    />
                    <p className="text-[10px] text-muted-foreground italic">Tracks ViewContent, AddToCart, InitiateCheckout, and Purchase events.</p>
                  </div>
                </div>

                <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                      <BarChart className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">Google Analytics</h4>
                      <p className="text-[10px] text-muted-foreground uppercase font-black">GA4 Measurement ID</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Measurement ID</Label>
                    <Input 
                        placeholder="e.g. G-XXXXXXXXXX" 
                        className="h-12 rounded-xl bg-white"
                        value={settings.googleAnalyticsId}
                        onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
                    />
                    <p className="text-[10px] text-muted-foreground italic">Monitor traffic and conversion performance through Google Analytics 4.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
