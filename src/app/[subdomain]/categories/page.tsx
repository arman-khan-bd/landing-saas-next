"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2, Layers, Search, Edit, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function CategoriesPage() {
  const { subdomain } = useParams();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeId, setStoreId] = useState("");
  const [newCategory, setNewCategory] = useState({ name: "", slug: "" });
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStoreAndCategories();
  }, [subdomain]);

  const fetchStoreAndCategories = async () => {
    setLoading(true);
    try {
      const storeQuery = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQuery);
      if (storeSnap.empty) return;
      const sId = storeSnap.docs[0].id;
      setStoreId(sId);

      const q = query(collection(db, "categories"), where("storeId", "==", sId));
      const querySnapshot = await getDocs(q);
      setCategories(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCategory.name) return;
    setProcessing(true);
    const slug = newCategory.slug || newCategory.name.toLowerCase().replace(/ /g, "-");
    
    try {
      await addDoc(collection(db, "categories"), {
        name: newCategory.name,
        slug,
        storeId,
        ownerId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Category added" });
      setNewCategory({ name: "", slug: "" });
      setIsDialogOpen(false);
      fetchStoreAndCategories();
    } catch (error) {
      toast({ variant: "destructive", title: "Error adding category" });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingCategory?.name || !editingCategory?.id) return;
    setProcessing(true);
    try {
      const slug = editingCategory.slug || editingCategory.name.toLowerCase().replace(/ /g, "-");
      await updateDoc(doc(db, "categories", editingCategory.id), {
        name: editingCategory.name,
        slug: slug,
      });
      toast({ title: "Category updated" });
      setEditingCategory(null);
      fetchStoreAndCategories();
    } catch (error) {
      toast({ variant: "destructive", title: "Error updating category" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteDoc(doc(db, "categories", id));
      toast({ title: "Category deleted" });
      fetchStoreAndCategories();
    } catch (error) {
      toast({ variant: "destructive", title: "Error deleting category" });
    }
  };

  const filtered = categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search categories..." 
            className="pl-10 rounded-2xl bg-white border-border/50 h-11 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20 font-bold" onClick={() => {
              setNewCategory({ name: "", slug: "" });
              setEditingCategory(null);
            }}>
              <Plus className="mr-2 w-5 h-5" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-headline font-bold">New Category</DialogTitle>
              <DialogDescription className="text-xs">Create a new product grouping.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  placeholder="Electronics" 
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (Optional)</Label>
                <Input 
                  placeholder="electronics" 
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full rounded-xl h-11 font-bold" onClick={handleCreate} disabled={processing}>
                {processing ? <Loader2 className="animate-spin w-4 h-4" /> : "Save Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-[32px] border-dashed border-2 py-20 text-center text-muted-foreground bg-muted/10">
          <Layers className="w-16 h-16 mx-auto mb-4 opacity-10" />
          <h3 className="text-xl font-bold">No categories found</h3>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card className="rounded-[32px] overflow-hidden border-border/50 shadow-sm bg-white">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-border/50">
                      <TableHead className="py-4 px-6">Name</TableHead>
                      <TableHead className="py-4 px-6">Slug</TableHead>
                      <TableHead className="py-4 px-6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow key={item.id} className="border-border/50 hover:bg-primary/5 transition-colors group">
                        <TableCell className="py-4 px-6 font-bold">{item.name}</TableCell>
                        <TableCell className="py-4 px-6 font-mono text-xs text-muted-foreground">{item.slug}</TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => {
                              setEditingCategory({ ...item });
                              setIsDialogOpen(true);
                            }}>
                              <Edit className="w-4 h-4 text-primary" />
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Card List View */}
          <div className="grid grid-cols-1 gap-4 md:hidden pb-10">
            {filtered.map((item) => (
              <Card key={item.id} className="rounded-[24px] border-border/50 bg-white shadow-sm overflow-hidden active:scale-[0.98] transition-transform">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-lg leading-tight truncate">{item.name}</h4>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase mt-1">Slug: {item.slug}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[160px]">
                        <DropdownMenuItem className="gap-3 py-3 rounded-xl" onClick={() => {
                          setEditingCategory({ ...item });
                          setIsDialogOpen(true);
                        }}>
                          <Edit className="w-4 h-4 text-primary" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 py-3 rounded-xl text-destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Edit Dialog - Reuse isDialogOpen or separate */}
      {editingCategory && (
        <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
          <DialogContent className="rounded-3xl max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-headline font-bold">Edit Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input 
                  value={editingCategory.slug}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full rounded-xl h-11 font-bold" onClick={handleUpdate} disabled={processing}>
                {processing ? <Loader2 className="animate-spin w-4 h-4" /> : "Update Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
