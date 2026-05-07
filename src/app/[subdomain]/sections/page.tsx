"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore, useUser } from "@/firebase/provider";
import { collection, query, where, getDocs, doc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, Layers, Search, Edit3, Trash2, 
  ExternalLink, Loader2, Globe, Clock, 
  Layout, MoreVertical, Sparkles, CheckCircle2 
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { getTenantPath } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function LandingPagesDashboard() {
  const { subdomain } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [storeId, setStoreId] = useState("");

  const [newPage, setNewPage] = useState({ title: "", slug: "" });

  useEffect(() => {
    if (firestore && subdomain && user) {
      fetchPages();
    }
  }, [firestore, subdomain, user]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const storeQ = query(collection(firestore!, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQ);
      if (storeSnap.empty) return;
      const sId = storeSnap.docs[0].id;
      setStoreId(sId);

      const q = query(collection(firestore!, "pages"), where("storeId", "==", sId));
      const snap = await getDocs(q);
      setPages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newPage.title || !newPage.slug) return;
    setCreating(true);
    try {
      const slug = newPage.slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
      
      // Check if slug exists
      const q = query(collection(firestore!, "pages"), where("storeId", "==", storeId), where("slug", "==", slug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast({ variant: "destructive", title: "Slug already exists", description: "Choose a unique slug for this page." });
        setCreating(false);
        return;
      }

      await addDoc(collection(firestore!, "pages"), {
        storeId,
        ownerId: user?.uid,
        title: newPage.title,
        slug,
        config: [], // Start with empty config
        pageStyle: {
          backgroundColor: "#fdf6e3",
          textColor: "#1a1a1a",
          primaryColor: "#1a4a1a",
          themeId: "laam",
          paddingTop: 40,
          paddingBottom: 40,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({ title: "Page Created", description: "You can now start orchestrating sections." });
      setIsCreateOpen(false);
      setNewPage({ title: "", slug: "" });
      fetchPages();
    } catch (error) {
      toast({ variant: "destructive", title: "Creation Failed" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (await confirm({
      title: "Delete Landing Page?",
      message: `Are you sure you want to permanently delete "${title}"? This will destroy all section data.`,
      confirmText: "Purge Page",
      variant: "danger"
    })) {
      try {
        await deleteDoc(doc(firestore!, "pages", id));
        toast({ title: "Page Deleted" });
        fetchPages();
      } catch (error) {
        toast({ variant: "destructive", title: "Delete Failed" });
      }
    }
  };

  const filtered = pages.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-black text-slate-900 uppercase tracking-tight">Landing Page Matrix</h1>
          <p className="text-muted-foreground">Manage and orchestrate high-conversion landing pages for your products.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-12 px-8 font-bold shadow-xl shadow-primary/20">
              <Plus className="mr-2 w-5 h-5" /> New Landing Page
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[32px] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-black uppercase">Create New Page</DialogTitle>
              <DialogDescription>Define the identity of your new high-conversion landing page.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6">
               <div className="space-y-2">
                  <Label>Page Title</Label>
                  <Input 
                    placeholder="e.g. Summer Special Sale" 
                    value={newPage.title}
                    onChange={(e) => {
                       const title = e.target.value;
                       const slug = title.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
                       setNewPage({ title, slug });
                    }}
                    className="h-12 rounded-xl"
                  />
               </div>
               <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <div className="flex items-center">
                     <div className="h-12 bg-slate-100 flex items-center px-4 rounded-l-xl border border-r-0 text-[10px] font-black text-slate-400">/p/</div>
                     <Input 
                       placeholder="summer-sale" 
                       value={newPage.slug}
                       onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                       className="h-12 rounded-r-xl rounded-l-none"
                     />
                  </div>
               </div>
            </div>
            <DialogFooter>
              <Button className="w-full h-14 rounded-2xl font-black uppercase text-lg" onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="animate-spin" /> : "Deploy Architecture"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Filter pages..." 
          className="pl-10 h-11 rounded-xl bg-white border-border/50 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
           <Layers className="w-20 h-20 text-slate-100 mx-auto mb-6" />
           <h3 className="text-xl font-bold text-slate-900">No landing pages found</h3>
           <p className="text-muted-foreground mt-2">Launch your first high-conversion landing page to start scaling.</p>
           <Button variant="link" className="mt-4 font-black" onClick={() => setIsCreateOpen(true)}>Create First Page</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((page) => (
            <Card key={page.id} className="rounded-[32px] border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white group overflow-hidden">
               <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-start mb-6">
                     <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Layout className="w-6 h-6" />
                     </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-slate-300 hover:text-slate-600">
                              <MoreVertical className="w-5 h-5" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[160px] shadow-2xl">
                           <DropdownMenuItem className="gap-2 py-2.5 rounded-xl cursor-pointer" onClick={() => router.push(getTenantPath(subdomain as string, `/sections/${page.id}`))}>
                              <Edit3 className="w-4 h-4 text-muted-foreground" /> Orchestrate Sections
                           </DropdownMenuItem>
                           <DropdownMenuItem className="gap-2 py-2.5 rounded-xl cursor-pointer" asChild>
                              <a href={getTenantPath(subdomain as string, `/p/${page.slug}`)} target="_blank">
                                 <ExternalLink className="w-4 h-4 text-muted-foreground" /> View Production
                              </a>
                           </DropdownMenuItem>
                           <DropdownMenuItem className="gap-2 py-2.5 rounded-xl cursor-pointer text-rose-500" onClick={() => handleDelete(page.id, page.title)}>
                              <Trash2 className="w-4 h-4" /> Purge Page
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </div>
                  <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors truncate">{page.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2 font-mono text-[10px] font-bold uppercase text-slate-400">
                     <Globe className="w-3 h-3" /> /p/{page.slug}
                  </CardDescription>
               </CardHeader>
               <CardContent className="p-8 pt-0 space-y-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Matrix</p>
                        <p className="text-sm font-bold text-slate-700">{page.config?.length || 0} Sections</p>
                     </div>
                     <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-lg text-[9px] font-black px-2">LIVE</Badge>
                  </div>
                  <Button 
                    className="w-full h-12 rounded-xl font-black uppercase text-xs tracking-widest bg-slate-900 hover:bg-primary transition-all shadow-xl shadow-slate-900/10"
                    onClick={() => router.push(getTenantPath(subdomain as string, `/sections/${page.id}`))}
                  >
                    Manage Design
                  </Button>
               </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
