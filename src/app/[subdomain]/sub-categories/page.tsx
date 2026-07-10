"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSupabaseClient } from "@/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2, Bookmark, Search, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SubCategoriesPage() {
  const { subdomain } = useParams();
  const supabase = useSupabaseClient();
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeId, setStoreId] = useState("");
  const [newSub, setNewSub] = useState({ name: "", slug: "", categoryId: "" });
  const [editingSub, setEditingSub] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const confirm = useConfirm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: storeData } = await supabase
        .from("stores")
        .select("id")
        .eq("subdomain", subdomain)
        .single();
      if (!storeData) return;
      setStoreId(storeData.id);

      const [subsRes, catsRes] = await Promise.all([
        supabase.from("sub_categories").select("*").eq("store_id", storeData.id),
        supabase.from("categories").select("*").eq("store_id", storeData.id)
      ]);

      setSubCategories(subsRes.data ?? []);
      setCategories(catsRes.data ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [subdomain]);

  const handleCreate = async () => {
    if (!newSub.name || !newSub.categoryId) return;
    setProcessing(true);
    const slug = newSub.slug || newSub.name.toLowerCase().replace(/ /g, "-");
    
    try {
      await supabase.from("sub_categories").insert({
        name: newSub.name,
        slug,
        category_id: newSub.categoryId,
        store_id: storeId
      });
      toast({ title: "Sub-category added" });
      setNewSub({ name: "", slug: "", categoryId: "" });
      setIsCreateDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error adding sub-category" });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingSub?.name || !editingSub?.id || !editingSub?.categoryId) return;
    setProcessing(true);
    try {
      const slug = editingSub.slug || editingSub.name.toLowerCase().replace(/ /g, "-");
      await supabase
        .from("sub_categories")
        .update({
          name: editingSub.name,
          slug: slug,
          category_id: editingSub.categoryId,
        })
        .eq("id", editingSub.id);
      toast({ title: "Sub-category updated" });
      setEditingSub(null);
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error updating" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Sub-category",
      message: "Are you sure you want to permanently delete this sub-category? This action cannot be reversed.",
      confirmText: "Confirm Delete",
      variant: "danger"
    });

    if (!isConfirmed) return;

    try {
      await supabase.from("sub_categories").delete().eq("id", id);
      toast({ title: "Deleted" });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error deleting" });
    }
  };

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || "N/A";
  const filtered = subCategories.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search sub-categories..." 
            className="pl-10 rounded-xl bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl w-full sm:w-auto">
              <Plus className="mr-2 w-5 h-5" /> Add Sub-category
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>New Sub-category</DialogTitle>
              <DialogDescription>Define a secondary layer for your catalog.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Parent Category</Label>
                <Select value={newSub.categoryId} onValueChange={(val) => setNewSub({ ...newSub, categoryId: val })}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newSub.name} onChange={(e) => setNewSub({ ...newSub, name: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full rounded-xl" onClick={handleCreate} disabled={processing}>
                {processing ? <Loader2 className="animate-spin w-4 h-4" /> : "Save Sub-category"}
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
                <TableHead>Parent Category</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-10">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-20 text-muted-foreground">
                    <Bookmark className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    No sub-categories found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{getCategoryName(item.category_id)}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingSub({ ...item, categoryId: item.category_id })}>
                            <Edit className="w-4 h-4 text-primary" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl">
                          <DialogHeader>
                            <DialogTitle>Edit Sub-category</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Parent Category</Label>
                              <Select value={editingSub?.categoryId} onValueChange={(val) => setEditingSub({ ...editingSub, categoryId: val })}>
                                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                <SelectContent>
                                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Name</Label>
                              <Input 
                                value={editingSub?.name || ""}
                                onChange={(e) => setEditingSub({ ...editingSub, name: e.target.value })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button className="w-full rounded-xl" onClick={handleUpdate} disabled={processing}>
                              {processing ? <Loader2 className="animate-spin w-4 h-4" /> : "Update Sub-category"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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
