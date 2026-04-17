
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
import { Loader2, Save, Globe, Palette, CreditCard, Layout, Megaphone, Share2 } from "lucide-react";

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
        // Merge with defaults to ensure all fields exist
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
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold">Store Configuration</h1>
          <p className="text-muted-foreground">Manage your brand identity, payments, and global settings.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-xl h-12 px-8 shadow-lg shadow-primary/20">
          {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto p-1 bg-muted/50 rounded-2xl">
          <TabsTrigger value="general" className="rounded-xl py-3">General</TabsTrigger>
          <TabsTrigger value="branding" className="rounded-xl py-3">Branding</TabsTrigger>
          <TabsTrigger value="payment" className="rounded-xl py-3">Payment</TabsTrigger>
          <TabsTrigger value="shop-ui" className="rounded-xl py-3">Shop UI</TabsTrigger>
          <TabsTrigger value="seo" className="rounded-xl py-3">SEO</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl py-3">Advanced</TabsTrigger>
        </TabsList>

        {/* General Info */}
        <TabsContent value="general" className="mt-6">
          <Card className="rounded-3xl border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="text-primary" />
                <CardTitle>Basic Information</CardTitle>
              </div>
              <CardDescription>Configure core store details and contact info.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Dokan Name</Label>
                  <Input value={settings.name} onChange={(e) => setSettings({...settings, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Home Page Title</Label>
                  <Input value={settings.homePageTitle} onChange={(e) => setSettings({...settings, homePageTitle: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Store Address</Label>
                <Textarea value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Working Days/Hours</Label>
                  <Input placeholder="Sat - Thu, 9AM - 8PM" value={settings.workingDays} onChange={(e) => setSettings({...settings, workingDays: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Google Map Embed Link</Label>
                  <Input placeholder="https://www.google.com/maps/embed?..." value={settings.googleMapEmbed} onChange={(e) => setSettings({...settings, googleMapEmbed: e.target.value})} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="rounded-3xl border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="text-primary" />
                  <CardTitle>Logos & Assets</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-2">
                  <Label>Store Logo</Label>
                  <CloudinaryUpload value={settings.logo} onUpload={(url) => setSettings({...settings, logo: url})} onRemove={() => setSettings({...settings, logo: ""})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
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

            <Card className="rounded-3xl border-border/50">
              <CardHeader>
                <CardTitle>Store Theme</CardTitle>
                <CardDescription>Select the visual style for your customer-facing store.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {['modern', 'minimal', 'bold', 'classic'].map((theme) => (
                    <div 
                      key={theme}
                      onClick={() => setSettings({...settings, selectedTheme: theme})}
                      className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${settings.selectedTheme === theme ? 'border-primary bg-primary/5' : 'border-border'}`}
                    >
                      <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center font-bold capitalize">
                        {theme}
                      </div>
                      <p className="text-center font-medium capitalize">{theme}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment */}
        <TabsContent value="payment" className="mt-6">
          <Card className="rounded-3xl border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="text-primary" />
                <CardTitle>Payment Methods</CardTitle>
              </div>
              <CardDescription>Configure how customers pay for their orders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border">
                <div>
                  <p className="font-bold">Cash on Delivery (COD)</p>
                  <p className="text-sm text-muted-foreground">Allow customers to pay when they receive the product.</p>
                </div>
                <Switch 
                  checked={settings.paymentSettings?.cod} 
                  onCheckedChange={(val) => setSettings({
                    ...settings, 
                    paymentSettings: { ...settings.paymentSettings, cod: val }
                  })} 
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border">
                  <div>
                    <p className="font-bold">Manual Payment Methods</p>
                    <p className="text-sm text-muted-foreground">bKash, Nagad, Rocket, Upay, etc.</p>
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
                      placeholder="Enter your bKash/Nagad number and instructions for the customer..." 
                      className="min-h-[150px] rounded-2xl"
                      value={settings.paymentSettings?.manualDetails}
                      onChange={(e) => setSettings({
                        ...settings, 
                        paymentSettings: { ...settings.paymentSettings, manualDetails: e.target.value }
                      })}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shop UI */}
        <TabsContent value="shop-ui" className="mt-6">
          <Card className="rounded-3xl border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layout className="text-primary" />
                <CardTitle>Interface Controls</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border">
                <div>
                  <p className="font-bold">Show Header</p>
                  <p className="text-sm text-muted-foreground">Toggle navigation visibility.</p>
                </div>
                <Switch 
                  checked={settings.shopConfig?.showHeader} 
                  onCheckedChange={(val) => setSettings({
                    ...settings, 
                    shopConfig: { ...settings.shopConfig, showHeader: val }
                  })} 
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border">
                <div>
                  <p className="font-bold">Sticky Header</p>
                  <p className="text-sm text-muted-foreground">Keep navigation fixed at top on scroll.</p>
                </div>
                <Switch 
                  checked={settings.shopConfig?.stickyHeader} 
                  onCheckedChange={(val) => setSettings({
                    ...settings, 
                    shopConfig: { ...settings.shopConfig, stickyHeader: val }
                  })} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo" className="mt-6">
          <Card className="rounded-3xl border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Megaphone className="text-primary" />
                <CardTitle>Search Engine Optimization</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Meta Share Image</Label>
                <CloudinaryUpload 
                  value={settings.seo?.metaImage} 
                  onUpload={(url) => setSettings({ ...settings, seo: { ...settings.seo, metaImage: url }})} 
                  onRemove={() => setSettings({ ...settings, seo: { ...settings.seo, metaImage: "" }})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Site Meta Keywords</Label>
                <Input 
                  placeholder="e-commerce, fashion, store" 
                  value={settings.seo?.keywords}
                  onChange={(e) => setSettings({...settings, seo: {...settings.seo, keywords: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <Label>Site Meta Description</Label>
                <Textarea 
                  className="rounded-2xl"
                  value={settings.seo?.description}
                  onChange={(e) => setSettings({...settings, seo: {...settings.seo, description: e.target.value}})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced / Social / Analytics */}
        <TabsContent value="analytics" className="mt-6 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="rounded-3xl border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Share2 className="text-primary" />
                  <CardTitle>Social Media Links</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Facebook URL</Label>
                  <Input value={settings.socialLinks?.facebook} onChange={(e) => setSettings({...settings, socialLinks: {...settings.socialLinks, facebook: e.target.value}})} />
                </div>
                <div className="space-y-2">
                  <Label>Twitter / X URL</Label>
                  <Input value={settings.socialLinks?.twitter} onChange={(e) => setSettings({...settings, socialLinks: {...settings.socialLinks, twitter: e.target.value}})} />
                </div>
                <div className="space-y-2">
                  <Label>Instagram URL</Label>
                  <Input value={settings.socialLinks?.instagram} onChange={(e) => setSettings({...settings, socialLinks: {...settings.socialLinks, instagram: e.target.value}})} />
                </div>
                <div className="space-y-2">
                  <Label>YouTube URL</Label>
                  <Input value={settings.socialLinks?.youtube} onChange={(e) => setSettings({...settings, socialLinks: {...settings.socialLinks, youtube: e.target.value}})} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Megaphone className="text-primary" />
                  <CardTitle>Analytics & Tracking</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Google Analytics ID</Label>
                  <Input placeholder="G-XXXXXXXXXX" value={settings.googleAnalyticsId} onChange={(e) => setSettings({...settings, googleAnalyticsId: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Facebook Pixel ID</Label>
                  <Input placeholder="1234567890" value={settings.facebookPixelId} onChange={(e) => setSettings({...settings, facebookPixelId: e.target.value})} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
