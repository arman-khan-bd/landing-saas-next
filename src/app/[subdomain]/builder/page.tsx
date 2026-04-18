
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, Search, MoreHorizontal, Edit, Trash2, Layout, 
  ExternalLink, Loader2, Globe, ArrowRight, Eye, PenTool
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getStoreUrl } from "@/lib/utils";

export default function PageManager() {
  const { subdomain } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isNewPageOpen, setIsNewPageOpen] = useState(false);
  const [newPageData, setNewPageData] = useState({ title: "", slug: "" });

  useEffect(() => {
    fetchPages();
  }, [subdomain]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      // First get storeId
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
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "pages"), pageData);
      toast({ title: "Page created!", description: "Opening designer..." });
      router.push(`/${subdomain}/builder/${docRef.id}`);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Creation failed" });
    } finally {
      setCreating(false);
      setIsNewPageOpen(false);
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm("Delete this page? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "pages", id));
      toast({ title: "Page deleted" });
      fetchPages();
    } catch (error) {
      toast({ variant: "destructive", title: "Delete failed" });
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Landing Pages</h1>
          <p className="text-muted-foreground mt-1">Design high-converting pages for your store.</p>
        </div>
        
        <Dialog open={isNewPageOpen} onOpenChange={setIsNewPageOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20">
              <Plus className="mr-2 w-5 h-5" /> Create New Page
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-bold">New Landing Page</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Page Title</Label>
                <Input 
                  placeholder="e.g. Summer Sale 2024" 
                  className="rounded-xl h-12"
                  value={newPageData.title}
                  onChange={(e) => setNewPageData({ ...newPageData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>URL Slug</Label>
                <div className="flex items-center gap-2 bg-muted/30 px-4 rounded-xl border">
                  <span className="text-muted-foreground text-sm font-mono">/</span>
                  <Input 
                    placeholder="summer-sale" 
                    className="border-none bg-transparent h-12 px-0 focus-visible:ring-0 font-mono"
                    value={newPageData.slug}
                    onChange={(e) => setNewPageData({ ...newPageData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                className="w-full h-12 rounded-xl font-bold" 
                onClick={handleCreatePage} 
                disabled={creating || !newPageData.title || !newPageData.slug}
              >
                {creating ? <Loader2 className="animate-spin w-5 h-5" /> : "Start Designing"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-[32px]" />
          ))
        ) : pages.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4 bg-muted/30 rounded-[40px] border-2 border-dashed">
            <Layout className="w-16 h-16 mx-auto text-muted-foreground/20" />
            <h3 className="text-xl font-headline font-bold">No pages yet</h3>
            <p className="text-muted-foreground">Start building your first high-converting landing page.</p>
          </div>
        ) : (
          pages.map((page) => (
            <Card key={page.id} className="group rounded-[32px] overflow-hidden border-border/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 bg-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <PenTool className="w-6 h-6" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => router.push(`/${subdomain}/builder/${page.id}`)}>
                        <Edit className="mr-2 w-4 h-4" /> Design Content
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePage(page.id)}>
                        <Trash2 className="mr-2 w-4 h-4" /> Delete Page
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="space-y-2 mb-6">
                  <h3 className="text-xl font-headline font-bold group-hover:text-primary transition-colors">{page.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                    <Globe className="w-3.5 h-3.5" />
                    /{page.slug}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button variant="secondary" className="rounded-xl h-11 font-bold group-hover:bg-primary group-hover:text-white transition-colors" onClick={() => router.push(`/${subdomain}/builder/${page.id}`)}>
                    Design
                  </Button>
                  <Button variant="outline" className="rounded-xl h-11" asChild>
                    <a href={getStoreUrl(subdomain) + '/p/' + page.slug} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
