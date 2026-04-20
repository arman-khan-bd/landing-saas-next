
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { Loader2, Save, Home, Image as ImageIcon, Zap, Layout } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function HomeManagerPage() {
  const { subdomain } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeId, setStoreId] = useState("");
  const [homeData, setHomeData] = useState<any>({
    homePageTitle: "",
    description: "",
    homeBanner: "",
    offerBanner: false,
    offerText: "",
    offerLink: ""
  });

  useEffect(() => {
    fetchHomeData();
  }, [subdomain]);

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setStoreId(snap.docs[0].id);
        setHomeData({
          homePageTitle: data.homePageTitle || "",
          description: data.description || "",
          homeBanner: data.homeBanner || "",
          offerBanner: data.offerBanner || false,
          offerText: data.offerText || "",
          offerLink: data.offerLink || ""
        });
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
      await updateDoc(doc(db, "stores", storeId), {
        ...homeData,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Home Page Updated", description: "Your branding changes are live." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Home Page Manager</h1>
          <p className="text-muted-foreground text-sm">Customize the first impression your customers see.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto rounded-xl h-12 px-8 shadow-lg shadow-primary/20 shrink-0">
          {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Section */}
          <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-muted/30 border-b p-8">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><Layout className="w-5 h-5 text-primary" /></div>
                  <CardTitle className="text-xl">Hero Branding</CardTitle>
               </div>
               <CardDescription>Main title and welcome banner.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
               <div className="space-y-2">
                 <Label>Welcome Title</Label>
                 <Input 
                   placeholder="e.g. Premium Gear for Pro Athletes" 
                   value={homeData.homePageTitle} 
                   onChange={(e) => setHomeData({...homeData, homePageTitle: e.target.value})}
                   className="h-12 rounded-xl"
                 />
               </div>
               <div className="space-y-2">
                 <Label>Store Description / Subtitle</Label>
                 <Textarea 
                   placeholder="Briefly explain what makes your store special..." 
                   className="rounded-xl min-h-[100px]"
                   value={homeData.description}
                   onChange={(e) => setHomeData({...homeData, description: e.target.value})}
                 />
               </div>
               <div className="space-y-2">
                 <Label>Hero Banner Image</Label>
                 <CloudinaryUpload 
                   value={homeData.homeBanner} 
                   onUpload={(url) => setHomeData({...homeData, homeBanner: url})} 
                   onRemove={() => setHomeData({...homeData, homeBanner: ""})} 
                 />
               </div>
            </CardContent>
          </Card>

          {/* Offer Banner Section */}
          <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-muted/30 border-b p-8">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg"><Zap className="w-5 h-5 text-accent" /></div>
                    <CardTitle className="text-xl">Promo Banner</CardTitle>
                  </div>
                  <Switch 
                    checked={homeData.offerBanner} 
                    onCheckedChange={(val) => setHomeData({...homeData, offerBanner: val})} 
                  />
               </div>
               <CardDescription>A secondary strip to highlight flash sales or codes.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Promo Text</Label>
                    <Input 
                      placeholder="e.g. Use code SPRING20 for 20% off!" 
                      value={homeData.offerText} 
                      onChange={(e) => setHomeData({...homeData, offerText: e.target.value})}
                      disabled={!homeData.offerBanner}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Promo Link (Optional)</Label>
                    <Input 
                      placeholder="e.g. /all-products" 
                      value={homeData.offerLink} 
                      onChange={(e) => setHomeData({...homeData, offerLink: e.target.value})}
                      disabled={!homeData.offerBanner}
                      className="h-12 rounded-xl"
                    />
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
           <Card className="rounded-3xl border-border/50 shadow-md bg-slate-900 text-white p-6">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                 <Layout className="w-4 h-4 text-primary" /> Visual Preview
              </h4>
              <div className="space-y-4">
                 <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden relative">
                    {homeData.homeBanner && <img src={homeData.homeBanner} className="w-full h-full object-cover opacity-50" />}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                       <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Preview</p>
                       <h5 className="font-bold text-sm truncate w-full">{homeData.homePageTitle || "Your Title"}</h5>
                    </div>
                 </div>
                 {homeData.offerBanner && (
                   <div className="bg-accent h-6 rounded-lg flex items-center justify-center text-[8px] font-black uppercase tracking-widest px-2">
                      {homeData.offerText || "Promo Text Preview"}
                   </div>
                 )}
              </div>
           </Card>

           <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                 <Zap className="w-4 h-4 text-primary" /> Pro Tip
              </h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                 Use high-contrast images for your banner. Text is rendered in white, so darker backgrounds work best for readability.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
