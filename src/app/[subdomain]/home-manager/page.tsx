"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSupabaseClient } from "@/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { Loader2, Save, Layout, ArrowUp, ArrowDown, Settings, Eye, HelpCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const DEFAULT_SECTIONS = [
  { id: "announcement_bar", title: "Announcement Bar", enabled: true, config: { text: "নিত্যপ্রয়োজনীয় পণ্য নিয়ে আমরা আছি আপনার পাশে। দেশজুড়ে ক্যাশ অন ডেলিভারি!" } },
  { id: "header", title: "Sticky Header", enabled: true, config: { logoTextBn: "ঘরোয়া বাজার", logoTextEn: "PURE & TRUSTED" } },
  { id: "category_nav", title: "Category Navigation Pills", enabled: true, config: {} },
  { id: "hero", title: "Hero Grid Banners", enabled: true, config: { badgeText: "100% PURE & NATURAL", title: "খাটি ও নিরাপদ পন্যের সমাহার", subtitle: "সুস্বাস্থ্যই আমাদের মূল লক্ষ্য। সরাসরি খামার থেকে আপনাদের হাতে পৌঁছে দিচ্ছি বিশুদ্ধ খাবার।", buttonText: "পণ্যসমূহ দেখুন", buttonLink: "#products", image: "", sideBanner1Label: "SPECIAL OFFER", sideBanner1Title: "মধু ও অর্গানিক তেল সংগ্রহ করুন", sideBanner1ButtonText: "অর্ডার করুন", sideBanner1Link: "#", sideBanner1Image: "", sideBanner2Label: "POPULAR CATEGORY", sideBanner2Title: "প্রাকৃতিক উপাদানে তৈরি হেলথ পাউডার", sideBanner2ButtonText: "অর্ডার করুন", sideBanner2Link: "#", sideBanner2Image: "" } },
  { id: "trust_strip", title: "Trust Benefits Strip", enabled: true, config: {} },
  { id: "category_grid", title: "Category Icons Grid", enabled: true, config: {} },
  { id: "products_grid", title: "Featured Products Grid", enabled: true, config: { title: "আমাদের জনপ্রিয় পণ্যসমূহ", subtitle: "গ্রাহকদের পছন্দের তালিকার শীর্ষে থাকা সেরা পণ্যসমূহ সংগ্রহ করুন।" } },
  { id: "promo_banners", title: "Promo Banners Grid (3 Cols)", enabled: true, config: { banner1Title: "খাটি ঘি ও মধু কিনুন", banner1Subtitle: "স্পেশাল ডিসকাউন্ট", banner1Image: "", banner2Title: "ঘরোয়া মশলা সামগ্রী", banner2Subtitle: "শতভাগ নিরাপদ", banner2Image: "", banner3Title: "অর্গানিক স্কিন কেয়ার", banner3Subtitle: "প্রাকৃতিক সৌন্দর্য", banner3Image: "" } },
  { id: "app_download", title: "Social Media Links", enabled: true, config: { title: "আমাদের সামাজিক যোগাযোগ মাধ্যম", subtitle: "ফেসবুক, ইউটিউব ও অন্যান্য মাধ্যমে আমাদের সাথে যুক্ত থাকুন।", facebookUrl: "", youtubeUrl: "", instagramUrl: "", whatsappUrl: "" } },
  { id: "testimonials", title: "Customer Testimonials", enabled: true, config: {} },
  { id: "footer", title: "Footer & Newsletter", enabled: true, config: { description: "ঘরোয়া বাজার আপনাদের জন্য নিয়ে এসেছে সম্পূর্ণ খাটি ও রাসায়নিক মুক্ত নিত্যপ্রয়োজনীয় খাদ্যপণ্য। আমাদের লক্ষ্য সবার কাছে ভেজালহীন খাদ্য পৌঁছে দেওয়া।" } }
];

export default function HomePageManager() {
  const { subdomain } = useParams();
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeId, setStoreId] = useState("");
  const [sections, setSections] = useState<any[]>(DEFAULT_SECTIONS);
  const [activeSectionId, setActiveSectionId] = useState<string>("announcement_bar");

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("stores")
        .select("id, home_sections")
        .eq("subdomain", subdomain)
        .single();
      if (data) {
        setStoreId(data.id);
        if (data.home_sections && Array.isArray(data.home_sections) && data.home_sections.length > 0) {
          // Merge fetched config to match DEFAULT_SECTIONS format in case new sections were added
          const merged = DEFAULT_SECTIONS.map(def => {
            const fetched = data.home_sections.find((s: any) => s.id === def.id);
            return fetched ? { ...def, ...fetched, config: { ...def.config, ...fetched.config } } : def;
          });
          
          // Re-sort to match fetched order
          const ordered = [...merged].sort((a, b) => {
            const indexA = data.home_sections.findIndex((s: any) => s.id === a.id);
            const indexB = data.home_sections.findIndex((s: any) => s.id === b.id);
            return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
          });
          setSections(ordered);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, [subdomain]);

  const handleSave = async () => {
    if (!storeId) return;
    setSaving(true);
    try {
      await supabase
        .from("stores")
        .update({
          home_sections: sections,
          updated_at: new Date().toISOString()
        })
        .eq("id", storeId);
      toast({ title: "Branding Grid Live!", description: "Home section configurations have been saved successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSection = (id: string, checked: boolean) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: checked } : s));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    setSections(newSections);
  };

  const updateActiveConfig = (key: string, value: any) => {
    setSections(prev => prev.map(s => s.id === activeSectionId ? {
      ...s,
      config: { ...s.config, [key]: value }
    } : s));
  };

  const activeSection = sections.find(s => s.id === activeSectionId);

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Home Page Builder</h1>
          <p className="text-muted-foreground text-sm">Design, order, and toggle layouts similar to Ghorerbazar storefronts.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto rounded-xl h-12 px-8 shadow-lg shadow-primary/20 shrink-0">
          {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
          Publish Storefront Layout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar Layout Selector */}
        <Card className="lg:col-span-4 rounded-3xl border-border/50 shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-muted/30 border-b p-6">
            <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
              <Layout className="w-5 h-5 text-primary" /> Layout Matrix
            </CardTitle>
            <CardDescription className="text-xs">Toggle and order home components.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[600px] pr-2">
              <div className="space-y-2">
                {sections.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      activeSectionId === item.id 
                        ? "bg-primary/5 border-primary/20" 
                        : "hover:bg-slate-50 border-transparent"
                    }`}
                    onClick={() => setActiveSectionId(item.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Switch 
                        checked={item.enabled} 
                        onCheckedChange={(val) => handleToggleSection(item.id, val)}
                        onClick={(e) => e.stopPropagation()} // Prevent setting active item
                      />
                      <span className={`text-sm font-bold truncate ${item.enabled ? "text-slate-900" : "text-slate-400 line-through"}`}>
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg" 
                        disabled={idx === 0}
                        onClick={() => moveSection(idx, "up")}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg" 
                        disabled={idx === sections.length - 1}
                        onClick={() => moveSection(idx, "down")}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Configuration Panel */}
        <Card className="lg:col-span-8 rounded-3xl border-border/50 shadow-sm overflow-hidden bg-white min-h-[600px]">
          <CardHeader className="bg-muted/30 border-b p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Settings className="w-5 h-5 text-primary" /></div>
              <div>
                <CardTitle className="text-xl font-bold">{activeSection?.title} Settings</CardTitle>
                <CardDescription className="text-xs">Customize texts and parameters for this layout segment.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {activeSection && activeSection.enabled === false && (
              <div className="bg-amber-50 text-amber-800 border border-amber-200/50 rounded-2xl p-4 flex gap-3 items-start text-sm">
                <HelpCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Section Disabled</p>
                  <p className="text-xs text-amber-700/80">This section is currently hidden. Turn on the switch in the sidebar to display it on the live storefront.</p>
                </div>
              </div>
            )}

            {/* Custom fields per active section type */}
            {activeSection?.id === "announcement_bar" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Banner Announcement Text</Label>
                  <Input 
                    value={activeSection.config.text || ""} 
                    onChange={(e) => updateActiveConfig("text", e.target.value)} 
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>
            )}

            {activeSection?.id === "header" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Logo Name (Bangla)</Label>
                    <Input 
                      value={activeSection.config.logoTextBn || ""} 
                      onChange={(e) => updateActiveConfig("logoTextBn", e.target.value)} 
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle Logo (English)</Label>
                    <Input 
                      value={activeSection.config.logoTextEn || ""} 
                      onChange={(e) => updateActiveConfig("logoTextEn", e.target.value)} 
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection?.id === "hero" && (
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border space-y-4">
                  <h4 className="font-bold text-sm text-slate-800 border-b pb-2">Main Hero Slide</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Badge Text</Label>
                      <Input value={activeSection.config.badgeText || ""} onChange={(e) => updateActiveConfig("badgeText", e.target.value)} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={activeSection.config.title || ""} onChange={(e) => updateActiveConfig("title", e.target.value)} className="h-12 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle</Label>
                    <Textarea value={activeSection.config.subtitle || ""} onChange={(e) => updateActiveConfig("subtitle", e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Button Text</Label>
                      <Input value={activeSection.config.buttonText || ""} onChange={(e) => updateActiveConfig("buttonText", e.target.value)} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Button Redirect Link</Label>
                      <Input value={activeSection.config.buttonLink || ""} onChange={(e) => updateActiveConfig("buttonLink", e.target.value)} className="h-12 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Hero Background Image</Label>
                    <CloudinaryUpload value={activeSection.config.image || ""} onUpload={(url) => updateActiveConfig("image", url)} onRemove={() => updateActiveConfig("image", "")} />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border space-y-4">
                  <h4 className="font-bold text-sm text-slate-800 border-b pb-2">Right Sidebar Banner 1</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input value={activeSection.config.sideBanner1Label || ""} onChange={(e) => updateActiveConfig("sideBanner1Label", e.target.value)} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={activeSection.config.sideBanner1Title || ""} onChange={(e) => updateActiveConfig("sideBanner1Title", e.target.value)} className="h-12 rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Button Text</Label>
                      <Input value={activeSection.config.sideBanner1ButtonText || ""} onChange={(e) => updateActiveConfig("sideBanner1ButtonText", e.target.value)} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Redirect Link</Label>
                      <Input value={activeSection.config.sideBanner1Link || ""} onChange={(e) => updateActiveConfig("sideBanner1Link", e.target.value)} className="h-12 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Banner 1 Background Image</Label>
                    <CloudinaryUpload value={activeSection.config.sideBanner1Image || ""} onUpload={(url) => updateActiveConfig("sideBanner1Image", url)} onRemove={() => updateActiveConfig("sideBanner1Image", "")} />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border space-y-4">
                  <h4 className="font-bold text-sm text-slate-800 border-b pb-2">Right Sidebar Banner 2</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input value={activeSection.config.sideBanner2Label || ""} onChange={(e) => updateActiveConfig("sideBanner2Label", e.target.value)} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={activeSection.config.sideBanner2Title || ""} onChange={(e) => updateActiveConfig("sideBanner2Title", e.target.value)} className="h-12 rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Button Text</Label>
                      <Input value={activeSection.config.sideBanner2ButtonText || ""} onChange={(e) => updateActiveConfig("sideBanner2ButtonText", e.target.value)} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Redirect Link</Label>
                      <Input value={activeSection.config.sideBanner2Link || ""} onChange={(e) => updateActiveConfig("sideBanner2Link", e.target.value)} className="h-12 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Banner 2 Background Image</Label>
                    <CloudinaryUpload value={activeSection.config.sideBanner2Image || ""} onUpload={(url) => updateActiveConfig("sideBanner2Image", url)} onRemove={() => updateActiveConfig("sideBanner2Image", "")} />
                  </div>
                </div>
              </div>
            )}

            {activeSection?.id === "flash_sale" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banner Title</Label>
                    <Input value={activeSection.config.title || ""} onChange={(e) => updateActiveConfig("title", e.target.value)} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Banner Subtitle</Label>
                    <Input value={activeSection.config.subtitle || ""} onChange={(e) => updateActiveConfig("subtitle", e.target.value)} className="h-12 rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Countdown Target Date/Time</Label>
                    <Input placeholder="YYYY-MM-DDTHH:MM:SS" value={activeSection.config.countdownDate || ""} onChange={(e) => updateActiveConfig("countdownDate", e.target.value)} className="h-12 rounded-xl" />
                    <p className="text-[10px] text-muted-foreground">Format: 2026-07-20T23:59:59</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input value={activeSection.config.buttonText || ""} onChange={(e) => updateActiveConfig("buttonText", e.target.value)} className="h-12 rounded-xl" />
                  </div>
                </div>
              </div>
            )}

            {activeSection?.id === "products_grid" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Section Title</Label>
                    <Input value={activeSection.config.title || ""} onChange={(e) => updateActiveConfig("title", e.target.value)} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Section Subtitle</Label>
                    <Input value={activeSection.config.subtitle || ""} onChange={(e) => updateActiveConfig("subtitle", e.target.value)} className="h-12 rounded-xl" />
                  </div>
                </div>
              </div>
            )}

            {activeSection?.id === "promo_banners" && (
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border space-y-4">
                  <h4 className="font-bold text-sm">Promo Card 1</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Title" value={activeSection.config.banner1Title || ""} onChange={(e) => updateActiveConfig("banner1Title", e.target.value)} className="h-12 rounded-xl" />
                    <Input placeholder="Subtitle" value={activeSection.config.banner1Subtitle || ""} onChange={(e) => updateActiveConfig("banner1Subtitle", e.target.value)} className="h-12 rounded-xl" />
                  </div>
                  <CloudinaryUpload value={activeSection.config.banner1Image || ""} onUpload={(url) => updateActiveConfig("banner1Image", url)} onRemove={() => updateActiveConfig("banner1Image", "")} />
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border space-y-4">
                  <h4 className="font-bold text-sm">Promo Card 2</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Title" value={activeSection.config.banner2Title || ""} onChange={(e) => updateActiveConfig("banner2Title", e.target.value)} className="h-12 rounded-xl" />
                    <Input placeholder="Subtitle" value={activeSection.config.banner2Subtitle || ""} onChange={(e) => updateActiveConfig("banner2Subtitle", e.target.value)} className="h-12 rounded-xl" />
                  </div>
                  <CloudinaryUpload value={activeSection.config.banner2Image || ""} onUpload={(url) => updateActiveConfig("banner2Image", url)} onRemove={() => updateActiveConfig("banner2Image", "")} />
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border space-y-4">
                  <h4 className="font-bold text-sm">Promo Card 3</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Title" value={activeSection.config.banner3Title || ""} onChange={(e) => updateActiveConfig("banner3Title", e.target.value)} className="h-12 rounded-xl" />
                    <Input placeholder="Subtitle" value={activeSection.config.banner3Subtitle || ""} onChange={(e) => updateActiveConfig("banner3Subtitle", e.target.value)} className="h-12 rounded-xl" />
                  </div>
                  <CloudinaryUpload value={activeSection.config.banner3Image || ""} onUpload={(url) => updateActiveConfig("banner3Image", url)} onRemove={() => updateActiveConfig("banner3Image", "")} />
                </div>
              </div>
            )}

            {activeSection?.id === "app_download" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input value={activeSection.config.title || ""} onChange={(e) => updateActiveConfig("title", e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle Description</Label>
                  <Textarea value={activeSection.config.subtitle || ""} onChange={(e) => updateActiveConfig("subtitle", e.target.value)} className="rounded-xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Facebook Page URL</Label>
                    <Input value={activeSection.config.facebookUrl || ""} onChange={(e) => updateActiveConfig("facebookUrl", e.target.value)} placeholder="https://facebook.com/yourpage" className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>YouTube Channel URL</Label>
                    <Input value={activeSection.config.youtubeUrl || ""} onChange={(e) => updateActiveConfig("youtubeUrl", e.target.value)} placeholder="https://youtube.com/yourchannel" className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Instagram Profile URL</Label>
                    <Input value={activeSection.config.instagramUrl || ""} onChange={(e) => updateActiveConfig("instagramUrl", e.target.value)} placeholder="https://instagram.com/yourprofile" className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp Number / API Link</Label>
                    <Input value={activeSection.config.whatsappUrl || ""} onChange={(e) => updateActiveConfig("whatsappUrl", e.target.value)} placeholder="https://wa.me/8801XXXXXXXXX" className="h-12 rounded-xl" />
                  </div>
                </div>
              </div>
            )}

            {activeSection?.id === "footer" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Footer Short Description</Label>
                  <Textarea value={activeSection.config.description || ""} onChange={(e) => updateActiveConfig("description", e.target.value)} className="rounded-xl" />
                </div>
              </div>
            )}

            {/* Default information for static components without fields */}
            {(activeSection?.id === "category_nav" || activeSection?.id === "trust_strip" || activeSection?.id === "category_grid" || activeSection?.id === "testimonials") && (
              <div className="text-center py-12 border border-dashed rounded-3xl bg-slate-50 text-slate-400">
                <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="font-bold text-sm">Dynamic Render Component</p>
                <p className="text-xs max-w-sm mx-auto mt-1">This section is dynamically generated using your store database entities (products, categories, customer feedback) and has no manual configuration fields.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
