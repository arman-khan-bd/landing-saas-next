"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
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
import { Loader2, Save, Globe, Palette, CreditCard, Layout, Megaphone, Share2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStoreUrl } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function StoreSettingsPage() {
  const { subdomain } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeId, setStoreId] = useState("");
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
      manualDetails: ""
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
    }
  });

  useEffect(() => {
    fetchSettings();
  }, [subdomain]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setStoreId(snap.docs[0].id);
        setSettings((prev: any) => ({
          ...prev,
          ...data,
          paymentSettings: { ...prev.paymentSettings, ...data.paymentSettings },
          seo: { ...prev.seo, ...data.seo },
          shopConfig: { ...prev.shopConfig, ...data.shopConfig },
          socialLinks: { ...prev.socialLinks, ...data.socialLinks }
        }));
      }
    } catch (error) {
      console.error(error);
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
      
      if (settings.subdomain !== subdomain) {
        toast({ title: "Subdomain Changed", description: "Redirecting to your new store address..." });
        setTimeout(() => {
          window.location.href = `/${settings.subdomain}/settings`;
        }, 1500);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-headline font-bold">Store Configuration</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Manage your brand identity, payments, and global settings.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto rounded-xl h-12 px-8 shadow-lg shadow-primary/20 shrink-0">
          {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <div className="relative">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex w-max sm:w-full sm:grid sm:grid-cols-2 lg:grid-cols-6 h-auto p-1 bg-muted/50 rounded-2xl">
              <TabsTrigger value="general" className="rounded-xl py-2.5 px-4 sm:py-3">General</TabsTrigger>
              <TabsTrigger value="domains" className="rounded-xl py-2.5 px-4 sm:py-3">Domains</TabsTrigger>
              <TabsTrigger value="branding" className="rounded-xl py-2.5 px-4 sm:py-3">Branding</TabsTrigger>
              <TabsTrigger value="payment" className="rounded-xl py-2.5 px-4 sm:py-3">Payment</TabsTrigger>
              <TabsTrigger value="shop-ui" className="rounded-xl py-2.5 px-4 sm:py-3">Shop UI</TabsTrigger>
              <TabsTrigger value="seo" className="rounded-xl py-2.5 px-4 sm:py-3">SEO</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-xl py-2.5 px-4 sm:py-3">Advanced</TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>

        {/* General Info */}
        <TabsContent value="general" className="mt-6">
          <Card className="rounded-[24px] sm:rounded-3xl border-border/50 shadow-sm">
            <CardHeader className="p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Globe className="text-primary h-5 w-5" />
                <CardTitle className="text-lg sm:text-xl">Basic Information</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">Configure core store details and contact info.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label>Store Name</Label>
                  <Input className="h-11 rounded-xl" value={settings.name} onChange={(e) => setSettings({...settings, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Home Page Title</Label>
                  <Input className="h-11 rounded-xl" value={settings.homePageTitle} onChange={(e) => setSettings({...settings, homePageTitle: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input className="h-11 rounded-xl" type="email" value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input className="h-11 rounded-xl" value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Store Address</Label>
                <Textarea className="rounded-xl min-h-[100px]" value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label>Working Days/Hours</Label>
                  <Input className="h-11 rounded-xl" placeholder="Sat - Thu, 9AM - 8PM" value={settings.workingDays} onChange={(e) => setSettings({...settings, workingDays: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Google Map Embed Link</Label>
                  <Input className="h-11 rounded-xl" placeholder="https://www.google.com/maps/embed?..." value={settings.googleMapEmbed} onChange={(e) => setSettings({...settings, googleMapEmbed: e.target.value})} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domains */}
        <TabsContent value="domains" className="mt-6">
          <Card className="rounded-[24px] sm:rounded-3xl border-border/50 shadow-sm">
            <CardHeader className="p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Globe className="text-primary h-5 w-5" />
                <CardTitle className="text-lg sm:text-xl">Domain Settings</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">Configure your store&apos;s web address.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-6">
              <div className="p-4 sm:p-6 border rounded-2xl bg-muted/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm sm:text-base">NexusCart Subdomain</h4>
                    <p className="text-xs text-muted-foreground">Your default store address.</p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px]">Live</Badge>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 bg-white border border-border/50 px-4 rounded-xl flex-1 text-sm font-medium text-muted-foreground">
                    Subdomain: 
                    <Input 
                      className="border-none bg-transparent p-0 h-10 text-foreground font-bold focus-visible:ring-0 w-auto min-w-[80px]" 
                      value={settings.subdomain}
                      onChange={(e) => setSettings({...settings, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")})}
                    />
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-xl text-[10px] sm:text-xs font-mono break-all flex items-center gap-2">
                    <Globe className="w-3 h-3 text-secondary-foreground shrink-0" />
                    Live at: <span className="text-primary font-bold">{getStoreUrl(settings.subdomain)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 border border-dashed rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                   <div>
                    <h4 className="font-bold text-sm sm:text-base">Custom Domain</h4>
                    <p className="text-xs text-muted-foreground">Connect your own domain.</p>
                   </div>
                   <Badge className="bg-primary/10 text-primary border-none text-[10px]">PRO</Badge>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input disabled placeholder="e.g. store.mydomain.com" className="rounded-xl h-11 bg-muted/50" />
                  <Button disabled variant="outline" className="rounded-xl px-6 h-11">Connect</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <Card className="rounded-[24px] sm:rounded-3xl border-border/50">
              <CardHeader className="p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <Palette className="text-primary h-5 w-5" />
                  <CardTitle className="text-lg sm:text-xl">Logos & Assets</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-8">
                <div className="space-y-2">
                  <Label>Store Logo</Label>
                  <CloudinaryUpload value={settings.logo} onUpload={(url) => setSettings({...settings, logo: url})} onRemove={() => setSettings({...settings, logo: ""})} />
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label>Favicon</Label>
                    <CloudinaryUpload value={settings.favicon} onUpload={(url) => setSettings({...settings, favicon: url})} onRemove={() => setSettings({...settings, favicon: ""})} />
                  </div>
                  <div className="space-y-2">
                    <Label>PWA / App Logo</Label>
                    <CloudinaryUpload value={settings.pwaLogo} onUpload={(url) => setSettings({...settings, pwaLogo: url})} onRemove={() => setSettings({...settings, pwaLogo: ""})} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[24px] sm:rounded-3xl border-border/50">
              <CardHeader className="p-5 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Store Theme</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Select visual style for customers.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {['modern', 'minimal', 'bold', 'classic'].map((theme) => (
                    <div 
                      key={theme}
                      onClick={() => setSettings({...settings, selectedTheme: theme})}
                      className={`cursor-pointer rounded-2xl border-2 p-3 sm:p-4 transition-all ${settings.selectedTheme === theme ? 'border-primary bg-primary/5' : 'border-border'}`}
                    >
                      <div className="aspect-video bg-muted rounded-lg mb-2 flex items-center justify-center font-bold capitalize text-xs sm:text-sm">
                        {theme}
                      </div>
                      <p className="text-center font-medium capitalize text-xs sm:text-sm">{theme}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Other tabs content (Payment, Shop UI, SEO, Analytics) follows the same pattern of responsive cards and spacing */}
        <TabsContent value="payment" className="mt-6">
          <Card className="rounded-[24px] sm:rounded-3xl border-border/50">
            <CardHeader className="p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <CreditCard className="text-primary h-5 w-5" />
                <CardTitle className="text-lg sm:text-xl">Payment Methods</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-sm sm:text-base">Cash on Delivery (COD)</p>
                  <p className="text-xs text-muted-foreground truncate">Pay when you receive the product.</p>
                </div>
                <Switch 
                  checked={settings.paymentSettings?.cod} 
                  onCheckedChange={(val) => setSettings({
                    ...settings, 
                    paymentSettings: { ...settings.paymentSettings, cod: val }
                  })} 
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-sm sm:text-base">Manual Payments</p>
                  <p className="text-xs text-muted-foreground truncate">bKash, Nagad, Rocket, etc.</p>
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
                <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                  <Label>Payment Instructions</Label>
                  <Textarea 
                    placeholder="Enter instructions for the customer..." 
                    className="min-h-[120px] rounded-2xl text-sm"
                    value={settings.paymentSettings?.manualDetails}
                    onChange={(e) => setSettings({
                      ...settings, 
                      paymentSettings: { ...settings.paymentSettings, manualDetails: e.target.value }
                    })}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <Card className="rounded-[24px] sm:rounded-3xl border-border/50">
              <CardHeader className="p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <Share2 className="text-primary h-5 w-5" />
                  <CardTitle className="text-lg sm:text-xl">Social Links</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Facebook URL</Label>
                  <Input className="h-11 rounded-xl" value={settings.socialLinks?.facebook} onChange={(e) => setSettings({...settings, socialLinks: {...settings.socialLinks, facebook: e.target.value}})} />
                </div>
                <div className="space-y-2">
                  <Label>Instagram URL</Label>
                  <Input className="h-11 rounded-xl" value={settings.socialLinks?.instagram} onChange={(e) => setSettings({...settings, socialLinks: {...settings.socialLinks, instagram: e.target.value}})} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[24px] sm:rounded-3xl border-border/50">
              <CardHeader className="p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <Megaphone className="text-primary h-5 w-5" />
                  <CardTitle className="text-lg sm:text-xl">Tracking</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Google Analytics ID</Label>
                  <Input className="h-11 rounded-xl" placeholder="G-XXXXXXXXXX" value={settings.googleAnalyticsId} onChange={(e) => setSettings({...settings, googleAnalyticsId: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Facebook Pixel ID</Label>
                  <Input className="h-11 rounded-xl" placeholder="1234567890" value={settings.facebookPixelId} onChange={(e) => setSettings({...settings, facebookPixelId: e.target.value})} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
