
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2, Layers, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function CategoriesPage() {
  const { subdomain } = useParams();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeId, setStoreId] = useState("");
  const [newCategory, setNewCategory] = useState({ name: "", slug: "" });
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
    setCreating(true);
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
      fetchStoreAndCategories();
    } catch (error) {
      toast({ variant: "destructive", title: "Error adding category" });
    } finally {
      setCreating(false);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search categories..." 
            className="pl-10 rounded-xl bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-xl w-full sm:w-auto">
              <Plus className="mr-2 w-5 h-5" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>New Category</DialogTitle>
              <DialogDescription>Create a new product grouping.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  placeholder="Electronics" 
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (Optional)</Label>
                <Input 
                  placeholder="electronics" 
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full rounded-xl" onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="animate-spin w-4 h-4" /> : "Save Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-3xl overflow-hidden border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-10">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-20 text-muted-foreground">
                    <Layers className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.slug}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
