"use client";

import { useEffect, useState } from "react";
import { useSupabaseClient } from "@/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Globe, Shield, Settings, Sliders, Sparkles, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CloudinaryUpload } from "@/components/cloudinary-upload";

export default function PlatformSettingsManager() {
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Settings state split by keys
  const [generalConfig, setGeneralConfig] = useState({
    platformName: "iHut.Shop",
    platformSubtitle: "Launch your ecommerce store in minutes",
    logo: "",
    favicon: ""
  });

  const [seoConfig, setSeoConfig] = useState({
    metaTitle: "iHut | Multi-tenant E-commerce SaaS",
    metaDescription: "The ultimate platform for launching your online store.",
    keywords: "ecommerce, saas, store, shop",
    ogImage: ""
  });

  const [advancedConfig, setAdvancedConfig] = useState({
    rootDomain: "ihut.shop",
    cnameTarget: "cname.ihut.shop",
    maintenanceMode: false,
    allowFreeTrial: true,
    trialDurationDays: 14
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*");

      if (data) {
        const general = data.find(item => item.key === "general");
        const seo = data.find(item => item.key === "seo");
        const advanced = data.find(item => item.key === "advanced");

        if (general && general.value) setGeneralConfig(prev => ({ ...prev, ...general.value }));
        if (seo && seo.value) setSeoConfig(prev => ({ ...prev, ...seo.value }));
        if (advanced && advanced.value) setAdvancedConfig(prev => ({ ...prev, ...advanced.value }));
      }
    } catch (err) {
      console.error("Error fetching platform settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upsert all three keys to platform_settings
      const updates = [
        { key: "general", value: generalConfig, updated_at: new Date().toISOString() },
        { key: "seo", value: seoConfig, updated_at: new Date().toISOString() },
        { key: "advanced", value: advancedConfig, updated_at: new Date().toISOString() }
      ];

      for (const update of updates) {
        await supabase
          .from("platform_settings")
          .upsert(update, { onConflict: "key" });
      }

      toast({ title: "Settings Saved Successfully", description: "Platform configuration updated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: "Please try again later." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-20 text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black text-white uppercase tracking-tight">Platform Configuration</h1>
          <p className="text-slate-400 text-sm">Control general settings, SEO optimization, and advanced capabilities for your entire SaaS platform.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-xl h-11 px-6 font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/10 text-xs uppercase tracking-widest gap-2">
          {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
          Save Platform Config
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Tabs List */}
        <div className="lg:col-span-1 bg-slate-900/50 p-2 rounded-2xl border border-white/5 shadow-2xl flex flex-col gap-1 w-full">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 py-2">Settings Group</p>
          <TabsList className="flex flex-col w-full h-auto bg-transparent gap-1 p-0">
            <TabsTrigger value="general" className="w-full justify-start rounded-xl py-2.5 px-3 text-xs font-bold text-slate-400 data-[state=active]:bg-indigo-600 data-[state=active]:text-white shadow-sm border border-transparent gap-2 flex items-center"><Settings className="h-4 w-4 text-slate-400 data-[state=active]:text-white" /> General Platform</TabsTrigger>
            <TabsTrigger value="seo" className="w-full justify-start rounded-xl py-2.5 px-3 text-xs font-bold text-slate-400 data-[state=active]:bg-indigo-600 data-[state=active]:text-white shadow-sm border border-transparent gap-2 flex items-center"><Globe className="h-4 w-4 text-slate-400 data-[state=active]:text-white" /> SEO Config</TabsTrigger>
            <TabsTrigger value="advanced" className="w-full justify-start rounded-xl py-2.5 px-3 text-xs font-bold text-slate-400 data-[state=active]:bg-indigo-600 data-[state=active]:text-white shadow-sm border border-transparent gap-2 flex items-center"><Sliders className="h-4 w-4 text-slate-400 data-[state=active]:text-white" /> Advanced Features</TabsTrigger>
          </TabsList>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-3 space-y-6 w-full mt-0">
          <TabsContent value="general" className="mt-0">
            <Card className="bg-slate-900 border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <CardHeader className="p-6 border-b border-white/5">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Sparkles className="h-5 w-5" />
                  <CardTitle className="text-lg font-headline font-bold text-white">General Branding</CardTitle>
                </div>
                <CardDescription className="text-slate-400 text-xs">Configure the general settings and branding for the landing page of your SaaS platform.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-300">Platform Full Name</Label>
                    <Input 
                      value={generalConfig.platformName} 
                      onChange={e => setGeneralConfig({ ...generalConfig, platformName: e.target.value })}
                      placeholder="e.g. iHut.Shop" 
                      className="bg-slate-800 border-none rounded-xl h-11 text-white text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-300">Platform Slogan / Subtitle</Label>
                    <Input 
                      value={generalConfig.platformSubtitle} 
                      onChange={e => setGeneralConfig({ ...generalConfig, platformSubtitle: e.target.value })}
                      placeholder="e.g. Launch your ecommerce store in minutes" 
                      className="bg-slate-800 border-none rounded-xl h-11 text-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Platform Logo</Label>
                    <CloudinaryUpload 
                      value={generalConfig.logo}
                      onUpload={url => setGeneralConfig({ ...generalConfig, logo: url })}
                      onRemove={() => setGeneralConfig({ ...generalConfig, logo: "" })}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Favicon (32x32)</Label>
                    <CloudinaryUpload 
                      value={generalConfig.favicon}
                      onUpload={url => setGeneralConfig({ ...generalConfig, favicon: url })}
                      onRemove={() => setGeneralConfig({ ...generalConfig, favicon: "" })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="mt-0">
            <Card className="bg-slate-900 border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <CardHeader className="p-6 border-b border-white/5">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Globe className="h-5 w-5" />
                  <CardTitle className="text-lg font-headline font-bold text-white">SaaS SEO Engine</CardTitle>
                </div>
                <CardDescription className="text-slate-400 text-xs">Optimize how your main SaaS platform appears on Google and Social Media.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Site Meta Title</Label>
                  <Input 
                    value={seoConfig.metaTitle} 
                    onChange={e => setSeoConfig({ ...seoConfig, metaTitle: e.target.value })}
                    placeholder="e.g. IHut.Shop | Build Your E-commerce Empire"
                    className="bg-slate-800 border-none rounded-xl h-11 text-white text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Meta Description</Label>
                  <Textarea 
                    value={seoConfig.metaDescription} 
                    onChange={e => setSeoConfig({ ...seoConfig, metaDescription: e.target.value })}
                    placeholder="Briefly describe your platform for Google..."
                    className="bg-slate-800 border-none rounded-xl min-h-[90px] text-white text-sm resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Keywords (Comma Separated)</Label>
                  <Input 
                    value={seoConfig.keywords} 
                    onChange={e => setSeoConfig({ ...seoConfig, keywords: e.target.value })}
                    placeholder="ecommerce, saas, landing page builder..."
                    className="bg-slate-800 border-none rounded-xl h-11 text-white text-sm"
                  />
                </div>
                <div className="space-y-3 pt-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">OG:Image (Open Graph)</Label>
                  <CloudinaryUpload 
                    value={seoConfig.ogImage}
                    onUpload={url => setSeoConfig({ ...seoConfig, ogImage: url })}
                    onRemove={() => setSeoConfig({ ...seoConfig, ogImage: "" })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="mt-0">
            <Card className="bg-slate-900 border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <CardHeader className="p-6 border-b border-white/5">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Shield className="h-5 w-5" />
                  <CardTitle className="text-lg font-headline font-bold text-white">Advanced Features & DNS</CardTitle>
                </div>
                <CardDescription className="text-slate-400 text-xs">Configure platform targets, subdomains, trial durations, and system switches.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-300">Root Domain</Label>
                    <Input 
                      value={advancedConfig.rootDomain} 
                      onChange={e => setAdvancedConfig({ ...advancedConfig, rootDomain: e.target.value })}
                      placeholder="ihut.shop" 
                      className="bg-slate-800 border-none rounded-xl h-11 text-white text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-300">DNS CNAME Target</Label>
                    <Input 
                      value={advancedConfig.cnameTarget} 
                      onChange={e => setAdvancedConfig({ ...advancedConfig, cnameTarget: e.target.value })}
                      placeholder="cname.ihut.shop" 
                      className="bg-slate-800 border-none rounded-xl h-11 text-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-300">Free Trial Duration (Days)</Label>
                    <Input 
                      type="number"
                      value={advancedConfig.trialDurationDays} 
                      onChange={e => setAdvancedConfig({ ...advancedConfig, trialDurationDays: parseInt(e.target.value) || 0 })}
                      className="bg-slate-800 border-none rounded-xl h-11 text-white text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-white/5">
                    <div className="space-y-0.5">
                      <h5 className="text-sm font-bold text-white">Enable Free Trial Plan Signups</h5>
                      <p className="text-[11px] text-slate-400">Allows new store merchants to self-register into default trial plans.</p>
                    </div>
                    <Switch 
                      checked={advancedConfig.allowFreeTrial} 
                      onCheckedChange={checked => setAdvancedConfig({ ...advancedConfig, allowFreeTrial: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-rose-950/20 rounded-xl border border-rose-950/40">
                    <div className="space-y-0.5">
                      <h5 className="text-sm font-bold text-rose-300">Platform-Wide Maintenance Mode</h5>
                      <p className="text-[11px] text-slate-400">Lock merchant shops and platform access with a maintenance notice screen.</p>
                    </div>
                    <Switch 
                      checked={advancedConfig.maintenanceMode} 
                      onCheckedChange={checked => setAdvancedConfig({ ...advancedConfig, maintenanceMode: checked })}
                    />
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
