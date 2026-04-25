
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, Search, MoreHorizontal, Edit, Trash2, Layout, 
  ExternalLink, Loader2, Globe, ArrowRight, Eye, PenTool,
  Palette, Check, Sparkles, Moon, Sun, Leaf, Zap, Layers
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { getStoreUrl, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Block } from "./[pageId]/types";

const THEMES = [
  {
    id: "default",
    name: "Classic Light",
    description: "Clean, professional white aesthetic with blue highlights.",
    icon: Sun,
    style: { backgroundColor: "#FFFFFF", primaryColor: "#145DCC", accentColor: "#26D87F", textColor: "#1a1a1a" }
  },
  {
    id: "organic",
    name: "Natural Organic",
    description: "Premium cream and green palette for natural products.",
    icon: Leaf,
    style: { backgroundColor: "#fdf8f0", primaryColor: "#2d7a3a", accentColor: "#c9941a", textColor: "#1a1a1a" }
  },
  {
    id: "laam",
    name: "Traditional Green",
    description: "High-conversion Bengali design with deep green and gold highlights.",
    icon: Zap,
    style: { backgroundColor: "#fdf6e3", primaryColor: "#1a4a1a", accentColor: "#c9a227", textColor: "#1c1c1c" }
  }
];

const getThemeTemplate = (themeId: string): Block[] => {
  if (themeId === 'laam') {
    return [
      {
        id: "marquee-top",
        type: "marquee",
        content: { items: ["🌿 সারাদেশে ফ্রি হোম ডেলিভারি", "✅ BSTI অনুমোদিত", "🔬 BCSIR ল্যাব টেস্টেড", "💰 ক্যাশ অন ডেলিভারি"] },
        style: { paddingTop: 10, paddingBottom: 10, backgroundColor: "#c9a227", textColor: "#1a1a1a" }
      },
      {
        id: "hero-sam",
        type: "ultra-hero",
        content: { 
          badgeText: "BSTI অনুমোদিত • BCSIR ল্যাব টেস্টেড", 
          title: "অসুস্থ ব্যক্তি ছাড়া [সুস্থতার মূল্য] কেউ বোঝে না", 
          subtitle: "শক্তি ও সুস্বাস্থ্যের নির্ভরযোগ্য উপহার",
          brandTitle: "সাম",
          brandSubtitle: "প্রাকৃতিক স্বাস্থ্য সুরক্ষা",
          ctaText: "⬇ এখানে অর্ডার করুন",
          ctaLink: "[checkout]",
          phoneText: "01621-611589",
          phoneLink: "tel:01621611589",
          badgeColor: "#c9a227",
          titleColor: "#f5e9c4",
          subtitleColor: "#e8c547",
          brandTitleColor: "#1a4a1a",
          brandSubtitleColor: "#6b3a1f",
          trustItems: [
            { iconName: "CheckCircle", label: "✅ BSTI অনুমোদিত" },
            { iconName: "Microscope", label: "🔬 ল্যাব টেস্টেড" },
            { iconName: "Truck", label: "🚚 ফ্রি ডেলিভারি" },
            { iconName: "RotateCcw", label: "↩️ সহজ রিফান্ড" }
          ]
        },
        style: { animation: "fadeIn" }
      },
      {
        id: "intro-pill",
        type: "header",
        content: { text: '"সাম" – প্রাকৃতিক স্বাস্থ্য সুরক্ষার অনন্য ফর্মুলা', level: "h3" },
        style: { textAlign: "center", backgroundColor: "#c9a227", textColor: "#1a1a1a", borderRadius: 40, paddingTop: 12, paddingBottom: 12, paddingLeft: 24, paddingRight: 24, fontSize: 14, marginTop: 40, marginBottom: 10, animation: "slideUp" }
      },
      {
        id: "ingredients-grid",
        type: "row",
        content: { columns: 3 },
        children: [
          { id: "ing-1", type: "card", content: { title: "ইরানী জাফরান", subtitle: "মন প্রশান্ত করে, উদ্বেগ কমায়", iconName: "Zap", showIcon: true, layout: "horizontal", iconColor: "#1a4a1a" }, style: { columnIndex: 0, columnSpan: 1, backgroundColor: "#ffffff", borderRadius: 20, paddingTop: 20, paddingBottom: 20, animation: "zoomIn" } },
          { id: "ing-2", type: "card", content: { title: "ত্বীন (অঞ্জির)", subtitle: "জান্নাতের ফল, পুষ্টিগুণে ভরপুর", iconName: "Zap", showIcon: true, layout: "horizontal", iconColor: "#1a4a1a" }, style: { columnIndex: 1, columnSpan: 1, backgroundColor: "#ffffff", borderRadius: 20, paddingTop: 20, paddingBottom: 20, animation: "zoomIn" } },
          { id: "ing-3", type: "card", content: { title: "মধু", subtitle: "রোগ প্রতিরোধ ক্ষমতা বৃদ্ধি করে", iconName: "Zap", showIcon: true, layout: "horizontal", iconColor: "#1a4a1a" }, style: { columnIndex: 2, columnSpan: 1, backgroundColor: "#ffffff", borderRadius: 20, paddingTop: 20, paddingBottom: 20, animation: "zoomIn" } }
        ]
      },
      {
        id: "hadith-quote",
        type: "quote",
        content: { title: "কালোজিরা ও শেফা", text: "কালোজিরা সেবন করো, কারণ এতে মৃত্যু ব্যতীত সকল রোগের মহৌষধ রয়েছে।", reference: "📖 সহীহ বুখারী: ৫৬৮৭", iconName: "BookOpen" },
        style: { paddingTop: 40, paddingBottom: 40, animation: "fadeIn", highlightColor: "#c9a227" }
      },
      {
        id: "benefits-header",
        type: "header",
        content: { text: "যেসব সমস্যায় [সাম কাজ করে]", level: "h2" },
        style: { textAlign: "center", paddingTop: 40, animation: "slideUp", highlightColor: "#1a4a1a" }
      },
      {
        id: "health-benefits-grid",
        type: "row",
        content: { columns: 2 },
        children: [
          { id: "h-1", type: "card", content: { title: "হার্টের সমস্যা", subtitle: "হার্ট ব্লক বা হার্টের সমস্যায় মহাঔষধ", iconName: "Heart", showIcon: true, layout: "horizontal", iconColor: "#c0392b" }, style: { columnIndex: 0, backgroundColor: "#ffffff", borderRadius: 12, borderStyle: "solid", borderWidth: 4, borderColor: "#4a9c3f", animation: "slideUp" } },
          { id: "h-2", type: "card", content: { title: "উচ্চ রক্তচাপ", subtitle: "হাই প্রেশারের প্রাকৃতিক সমাধান", iconName: "Droplets", showIcon: true, layout: "horizontal", iconColor: "#c9a227" }, style: { columnIndex: 1, backgroundColor: "#ffffff", borderRadius: 12, borderStyle: "solid", borderWidth: 4, borderColor: "#4a9c3f", animation: "slideUp" } }
        ]
      },
      {
        id: "usage-badge",
        type: "header",
        content: { text: "🥄 প্রতিদিন সকালে ও রাতে ১/২ চামচ", level: "h3" },
        style: { textAlign: "center", backgroundColor: "#1a4a1a", textColor: "#ffffff", borderRadius: 24, paddingTop: 20, paddingBottom: 20, marginTop: 40, animation: "bounce" }
      },
      {
        id: "footer-sam",
        type: "footer",
        content: { brandName: "সাম ন্যাচারাল", description: "Jhenaida, Kaliganj. Organic Users BD.", phone: "01621-611589", email: "info@organicusersbd.com", copyright: "2024 organicusersbd" },
        style: { backgroundColor: "#0f2e0f", textColor: "#ffffff" }
      }
    ];
  }
  return [];
};

export default function SectionManager() {
  const { subdomain } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isNewPageOpen, setIsNewPageOpen] = useState(false);
  const [newPageData, setNewPageData] = useState({ title: "", slug: "" });
  
  const [selectedPageForTheme, setSelectedPageForTheme] = useState<any>(null);
  const [applyingThemeId, setApplyingThemeId] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
  }, [subdomain]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQ);
      if (storeSnap.empty) return;
      const storeId = storeSnap.docs[0].id;

      const q = query(collection(db, "pages"), where("storeId", "==", storeId));
      const querySnapshot = await getDocs(q);
      setPages(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async () => {
    if (!newPageData.title || !newPageData.slug) return;
    setCreating(true);
    try {
      const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQ);
      const storeId = storeSnap.docs[0].id;
      const ownerId = auth.currentUser?.uid;

      const pageData = {
        storeId,
        ownerId,
        title: newPageData.title,
        slug: newPageData.slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
        config: [],
        pageStyle: {
          themeId: "default",
          backgroundColor: "#FFFFFF",
          primaryColor: "#145DCC",
          accentColor: "#26D87F",
          paddingTop: 40,
          paddingBottom: 40
        },
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "pages"), pageData);
      toast({ title: "Section Matrix Ready!", description: "Opening orchestration engine..." });
      router.push(`/${subdomain}/builder/${docRef.id}`);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Creation failed" });
    } finally {
      setCreating(false);
      setIsNewPageOpen(false);
    }
  };

  const handleApplyTheme = async (theme: any) => {
    if (!selectedPageForTheme) return;
    setApplyingThemeId(theme.id);
    try {
      const pageRef = doc(db, "pages", selectedPageForTheme.id);
      const newStyle = {
        ...selectedPageForTheme.pageStyle,
        themeId: theme.id,
        backgroundColor: theme.style.backgroundColor,
        primaryColor: theme.style.primaryColor,
        accentColor: theme.style.accentColor,
        textColor: theme.style.textColor,
      };

      const template = getThemeTemplate(theme.id);
      const updateData: any = {
        pageStyle: newStyle,
        updatedAt: serverTimestamp()
      };

      if (template.length > 0) {
        updateData.config = template;
      }

      await updateDoc(pageRef, updateData);

      setPages(prev => prev.map(p => p.id === selectedPageForTheme.id ? { ...p, pageStyle: newStyle, config: template.length > 0 ? template : p.config } : p));
      toast({ title: "Section Logic Applied", description: `"${theme.name}" matrix has been deployed.` });
      setSelectedPageForTheme(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Apply Failed" });
    } finally {
      setApplyingThemeId(null);
    }
  };

  const handleDeletePage = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Destroy Section",
      message: "This will permanently remove this landing page structure. Proceed?",
      confirmText: "Delete Matrix",
      variant: "danger"
    });

    if (!isConfirmed) return;

    try {
      await deleteDoc(doc(db, "pages", id));
      toast({ title: "Section Removed" });
      fetchPages();
    } catch (error) {
      toast({ variant: "destructive", title: "Delete failed" });
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
              <Layers className="w-7 h-7" />
           </div>
           <div>
              <h1 className="text-3xl font-headline font-black uppercase tracking-tight">Section Orchestration</h1>
              <p className="text-muted-foreground mt-0.5">Build high-conversion funnels with modular section matrices.</p>
           </div>
        </div>
        
        <Dialog open={isNewPageOpen} onOpenChange={setIsNewPageOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 w-5 h-5" /> New Landing Funnel
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl border-none shadow-2xl">
            <DialogHeader><DialogTitle className="text-2xl font-headline font-bold">Launch Funnel Matrix</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Matrix Title</Label><Input placeholder="e.g. Black Cumin Sales" className="rounded-xl h-12" value={newPageData.title} onChange={(e) => setNewPageData({ ...newPageData, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>URL Slug</Label><div className="flex items-center gap-2 bg-muted/30 px-4 rounded-xl border"><span className="text-muted-foreground text-sm font-mono">/</span><Input placeholder="organic-boost" className="border-none bg-transparent h-12 px-0 focus-visible:ring-0 font-mono" value={newPageData.slug} onChange={(e) => setNewPageData({ ...newPageData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} /></div></div>
            </div>
            <DialogFooter><Button className="w-full h-12 rounded-xl font-bold bg-indigo-600" onClick={handleCreatePage} disabled={creating || !newPageData.title || !newPageData.slug}>{creating ? <Loader2 className="animate-spin w-5 h-5" /> : "Deploy Matrix"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 bg-muted animate-pulse rounded-[32px]" />)
        ) : pages.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4 bg-muted/30 rounded-[40px] border-2 border-dashed"><Layout className="w-16 h-16 mx-auto text-muted-foreground/20" /><h3 className="text-xl font-headline font-bold">No funnels deployed</h3><p className="text-muted-foreground">Start by deploying your first high-converting landing matrix.</p></div>
        ) : (
          pages.map((page) => (
            <Card key={page.id} className="group rounded-[32px] overflow-hidden border-border/50 hover:shadow-2xl hover:shadow-indigo-600/5 transition-all duration-500 hover:-translate-y-1 bg-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                   <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                      <Layers className="w-6 h-6" />
                   </div>
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                         <DropdownMenuItem onClick={() => router.push(`/${subdomain}/builder/${page.id}`)}><Edit className="mr-2 w-4 h-4" /> Manage Sections</DropdownMenuItem>
                         <DropdownMenuItem onClick={() => setSelectedPageForTheme(page)}><Palette className="mr-2 w-4 h-4" /> Import Demo Matrix</DropdownMenuItem>
                         <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePage(page.id)}><Trash2 className="mr-2 w-4 h-4" /> Destroy Matrix</DropdownMenuItem>
                      </DropdownMenuContent>
                   </DropdownMenu>
                </div>
                <div className="space-y-2 mb-6">
                   <div className="flex items-center justify-between"><h3 className="text-xl font-headline font-bold group-hover:text-indigo-600 transition-colors">{page.title}</h3><Badge variant="outline" className="text-[8px] font-black uppercase rounded-lg">{THEMES.find(t => t.id === page.pageStyle?.themeId)?.name || 'Custom'}</Badge></div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono"><Globe className="w-3.5 h-3.5" />/{page.slug}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                   <Button className="rounded-xl h-11 font-black uppercase text-[10px] bg-slate-900 group-hover:bg-indigo-600 transition-colors" onClick={() => router.push(`/${subdomain}/builder/${page.id}`)}>Edit Logic</Button>
                   <Button variant="outline" className="rounded-xl h-11 text-[10px] font-bold uppercase" onClick={() => setSelectedPageForTheme(page)}>Demo Import</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedPageForTheme} onOpenChange={(open) => !open && setSelectedPageForTheme(null)}>
        <DialogContent className="max-w-3xl rounded-[40px] border-none shadow-2xl p-0 overflow-hidden bg-slate-50 flex flex-col max-h-[90vh]">
          <DialogHeader className="p-8 bg-white border-b shrink-0"><div className="flex items-center gap-4"><div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-600/20"><Palette className="w-6 h-6" /></div><div><DialogTitle className="text-2xl font-headline font-black">Demo Matrix Repository</DialogTitle><DialogDescription>Select a conversion blueprint to instantly populate "{selectedPageForTheme?.title}"</DialogDescription></div></div></DialogHeader>
          <ScrollArea className="flex-1 w-full">
             <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {THEMES.map((theme) => { 
                   const isCurrent = selectedPageForTheme?.pageStyle?.themeId === theme.id; 
                   const isApplying = applyingThemeId === theme.id; 
                   const Icon = theme.icon; 
                   return (
                      <Card key={theme.id} className={cn("rounded-[32px] overflow-hidden transition-all duration-300 border-2 cursor-pointer relative", isCurrent ? 'border-indigo-600 ring-4 ring-indigo-600/5 shadow-xl scale-[1.02]' : 'border-white hover:border-indigo-600/20 hover:shadow-lg')} onClick={() => !isCurrent && handleApplyTheme(theme)}>
                         <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start"><div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><Icon className="w-5 h-5 text-slate-600" /></div>{isCurrent && <Check className="w-5 h-5 text-indigo-600" />}</div>
                            <div><h4 className="font-bold text-base">{theme.name}</h4><p className="text-[10px] text-muted-foreground leading-relaxed">{theme.description}</p></div>
                            <div className="flex gap-1.5 pt-2"><div className="h-4 w-8 rounded-full border shadow-inner" style={{ backgroundColor: theme.style.primaryColor }} /><div className="h-4 w-8 rounded-full border shadow-inner" style={{ backgroundColor: theme.style.accentColor }} /><div className="h-4 w-8 rounded-full border shadow-inner" style={{ backgroundColor: theme.style.backgroundColor }} /></div>
                            <Button className="w-full h-10 rounded-xl font-black uppercase text-[9px] tracking-widest mt-2 bg-indigo-600" disabled={isCurrent || !!applyingThemeId}>{isApplying ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : isCurrent ? "Matrix Active" : "Import Blueprint"}</Button>
                         </div>
                      </Card>
                   ); 
                })}
             </div>
          </ScrollArea>
          <div className="p-6 bg-indigo-600/5 text-center shrink-0 border-t"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-600 italic">One-click conversion blueprints</p></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
