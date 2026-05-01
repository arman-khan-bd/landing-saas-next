
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Palette, Sparkles, Check, Layout, Leaf, Zap, Moon, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const THEMES = [
  {
    id: "default",
    name: "Classic Light",
    description: "Clean, professional white aesthetic with blue highlights.",
    style: { backgroundColor: "#FFFFFF", primaryColor: "#145DCC", accentColor: "#26D87F", textColor: "#1a1a1a" }
  },
  {
    id: "organic",
    name: "Natural Organic",
    description: "Premium cream and green palette for natural products.",
    style: {
      backgroundColor: "#fdf8f0", 
      primaryColor: "#2d7a3a",    
      accentColor: "#c9941a",     
      textColor: "#1a1a1a"
    }
  },
  {
    id: "midnight",
    name: "Midnight Pro",
    description: "Dark, sleek professional look for tech or luxury goods.",
    style: { backgroundColor: "#0f172a", primaryColor: "#6366f1", accentColor: "#f43f5e", textColor: "#f8fafc" }
  }
];

export default function ThemeManagerPage() {
  const { subdomain } = useParams();
  const { toast } = useToast();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);

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

  const applyThemeToPage = async (pageId: string, theme: any) => {
    setApplyingId(`${pageId}-${theme.id}`);
    try {
      const pageRef = doc(db, "pages", pageId);
      const newStyle = {
        themeId: theme.id,
        backgroundColor: theme.style.backgroundColor,
        primaryColor: theme.style.primaryColor,
        accentColor: theme.style.accentColor,
        textColor: theme.style.textColor,
        paddingTop: 40,
        paddingBottom: 40
      };

      await updateDoc(pageRef, {
        pageStyle: newStyle,
        updatedAt: serverTimestamp()
      });

      setPages(prev => prev.map(p => p.id === pageId ? { ...p, pageStyle: newStyle } : p));
      toast({ title: "Theme Applied", description: `"${theme.name}" is now active on this page.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Apply Failed" });
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="space-y-2">
        <h1 className="text-3xl font-headline font-black uppercase tracking-tight">Design Gallery</h1>
        <p className="text-muted-foreground">Apply professionally crafted themes to your landing pages.</p>
      </div>

      {pages.length === 0 ? (
        <Card className="rounded-[40px] border-dashed border-2 py-32 text-center bg-muted/20">
           <Layout className="w-16 h-16 mx-auto mb-4 opacity-10" />
           <p className="font-bold text-slate-400">No landing pages found. Create one first to apply themes.</p>
        </Card>
      ) : (
        <div className="space-y-12">
          {pages.map((page) => (
            <section key={page.id} className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                       <Layout className="w-5 h-5" />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold">{page.title}</h3>
                       <p className="text-xs text-muted-foreground font-mono">/{page.slug}</p>
                    </div>
                 </div>
                 <Badge variant="outline" className="rounded-lg h-7 font-black uppercase tracking-widest text-[9px] px-3">
                    Current: {THEMES.find(t => t.id === page.pageStyle?.themeId)?.name || 'Default'}
                 </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {THEMES.map((theme) => {
                  const isCurrent = page.pageStyle?.themeId === theme.id;
                  const isApplying = applyingId === `${page.id}-${theme.id}`;

                  return (
                    <Card 
                      key={theme.id}
                      className={cn(
                        "rounded-[32px] overflow-hidden transition-all duration-300 border-2 relative",
                        isCurrent ? 'border-primary ring-4 ring-primary/5' : 'border-border/50 hover:border-primary/20'
                      )}
                    >
                       <CardHeader className="p-6 pb-4">
                          <div className="flex justify-between items-start">
                             <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                {theme.id === 'organic' ? <Leaf className="w-5 h-5 text-emerald-600" /> : 
                                 theme.id === 'midnight' ? <Moon className="w-5 h-5 text-indigo-600" /> : 
                                 <Sun className="w-5 h-5 text-primary" />}
                             </div>
                             {isCurrent && <Check className="w-5 h-5 text-primary" />}
                          </div>
                          <CardTitle className="text-lg font-bold mt-4">{theme.name}</CardTitle>
                          <CardDescription className="text-xs line-clamp-1">{theme.description}</CardDescription>
                       </CardHeader>
                       <CardContent className="p-6 pt-0 space-y-6">
                          <div className="flex gap-2">
                             <div className="h-6 w-12 rounded-full shadow-inner border border-black/5" style={{ backgroundColor: theme.style.primaryColor }} />
                             <div className="h-6 w-12 rounded-full shadow-inner border border-black/5" style={{ backgroundColor: theme.style.accentColor }} />
                             <div className="h-6 w-12 rounded-full shadow-inner border border-black/5" style={{ backgroundColor: theme.style.backgroundColor }} />
                          </div>
                          <Button 
                            className="w-full h-11 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                            variant={isCurrent ? "secondary" : "default"}
                            disabled={isCurrent || !!isApplying}
                            onClick={() => applyThemeToPage(page.id, theme)}
                          >
                             {isApplying ? <Loader2 className="animate-spin" /> : isCurrent ? "Active Theme" : "Apply Design"}
                          </Button>
                       </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
