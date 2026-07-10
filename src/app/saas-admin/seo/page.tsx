"use client";

import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase/provider";
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Globe, Image as ImageIcon, Sparkles, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CloudinaryUpload } from "@/components/cloudinary-upload";

export default function SeoManager() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    metaTitle: "",
    metaDescription: "",
    logo: "",
    favicon: "",
    seoImage: "",
    ogImage: "",
    keywords: ""
  });

  useEffect(() => {
    if (!firestore) return;
    const unsub = onSnapshot(doc(firestore, "platformSettings", "seo"), (docSnap) => {
      if (docSnap.exists()) {
        setFormData(docSnap.data() as any);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [firestore]);

  const handleSave = async () => {
    if (!firestore) return;
    setProcessing(true);
    try {
      await setDoc(doc(firestore, "platformSettings", "seo"), {
        ...formData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "SEO Settings Saved", description: "Your platform metadata is now updated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: "Please try again later." });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-headline font-black text-white uppercase tracking-tight">SaaS SEO Engine</h1>
          <p className="text-slate-400">Optimize how your platform appears on Google and Social Media.</p>
        </div>
        <Button onClick={handleSave} disabled={processing} className="rounded-2xl h-14 px-10 font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 text-lg uppercase tracking-widest">
          {processing ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-5 h-5" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Meta Data */}
        <Card className="bg-slate-900 border-white/5 rounded-[40px] shadow-2xl">
          <CardHeader className="p-8 sm:p-10 pb-0">
            <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-4">
              <Globe className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-black text-white uppercase tracking-tight">Search Engine Meta</CardTitle>
            <CardDescription className="text-slate-500">How your site appears in search results.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 sm:p-10 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Site Meta Title</Label>
              <Input 
                value={formData.metaTitle} 
                onChange={(e) => setFormData({...formData, metaTitle: e.target.value})}
                placeholder="e.g. IHut.Shop | Build Your E-commerce Empire"
                className="bg-slate-800 border-none rounded-2xl h-14 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Meta Description</Label>
              <Textarea 
                value={formData.metaDescription} 
                onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                placeholder="Briefly describe your platform for Google..."
                className="bg-slate-800 border-none rounded-2xl min-h-[120px] text-white resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Keywords (Comma Separated)</Label>
              <Input 
                value={formData.keywords} 
                onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                placeholder="ecommerce, saas, landing page builder..."
                className="bg-slate-800 border-none rounded-2xl h-14 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Brand Assets */}
        <Card className="bg-slate-900 border-white/5 rounded-[40px] shadow-2xl">
          <CardHeader className="p-8 sm:p-10 pb-0">
            <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-black text-white uppercase tracking-tight">Platform Branding</CardTitle>
            <CardDescription className="text-slate-500">Logos and icons for browsers and tabs.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 sm:p-10 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Platform Logo</Label>
                <CloudinaryUpload 
                  value={formData.logo}
                  onUpload={(url) => setFormData({...formData, logo: url})}
                  onRemove={() => setFormData({...formData, logo: ""})}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Browser Favicon</Label>
                <CloudinaryUpload 
                  value={formData.favicon}
                  onUpload={(url) => setFormData({...formData, favicon: url})}
                  onRemove={() => setFormData({...formData, favicon: ""})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Sharing */}
        <Card className="bg-slate-900 border-white/5 rounded-[40px] shadow-2xl lg:col-span-2">
          <CardHeader className="p-8 sm:p-10 pb-0">
            <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-4">
              <Share2 className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-black text-white uppercase tracking-tight">Social Media Cards</CardTitle>
            <CardDescription className="text-slate-500">These images appear when someone shares your platform on Facebook, Twitter, or WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 sm:p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex flex-col">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Standard SEO Image</Label>
                  <span className="text-[9px] text-slate-600 uppercase mb-3">Recommended: 1200x630px</span>
                </div>
                <CloudinaryUpload 
                  value={formData.seoImage}
                  onUpload={(url) => setFormData({...formData, seoImage: url})}
                  onRemove={() => setFormData({...formData, seoImage: ""})}
                />
              </div>
              <div className="space-y-3">
                <div className="flex flex-col">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">OG:Image (Open Graph)</Label>
                  <span className="text-[9px] text-slate-600 uppercase mb-3">Displays specifically on Facebook & LinkedIn</span>
                </div>
                <CloudinaryUpload 
                  value={formData.ogImage}
                  onUpload={(url) => setFormData({...formData, ogImage: url})}
                  onRemove={() => setFormData({...formData, ogImage: ""})}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO Preview Mockup */}
      <div className="mt-10 p-8 sm:p-12 bg-black/40 border border-white/5 rounded-[40px] space-y-6">
        <h4 className="text-lg font-black text-white uppercase tracking-tighter">Google Preview</h4>
        <div className="max-w-2xl space-y-1">
          <p className="text-indigo-400 text-lg hover:underline cursor-pointer truncate">{formData.metaTitle || "Platform Title Goes Here"}</p>
          <p className="text-emerald-500 text-xs truncate">https://ihut.shop</p>
          <p className="text-slate-400 text-sm line-clamp-2">{formData.metaDescription || "Provide a description to see how it will look in Google search results."}</p>
        </div>
      </div>
    </div>
  );
}
