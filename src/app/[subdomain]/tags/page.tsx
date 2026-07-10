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

export default function TagsPage() {
  const { subdomain } = useParams();
  const supabase = useSupabaseClient();
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeId, setStoreId] = useState("");
  const [newName, setNewName] = useState("");
  const [editingTag, setEditingTag] = useState<any>(null);
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

      const { data } = await supabase
        .from("tags")
        .select("*")
        .eq("store_id", storeData.id);
      setTags(data ?? []);
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
    if (!newName) return;
    setProcessing(true);
    try {
      await supabase.from("tags").insert({
        name: newName,
        store_id: storeId
      });
      toast({ title: "Tag added" });
      setNewName("");
      setIsCreateDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error adding tag" });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTag?.name || !editingTag?.id) return;
    setProcessing(true);
    try {
      await supabase
        .from("tags")
        .update({ name: editingTag.name })
        .eq("id", editingTag.id);
      toast({ title: "Tag updated" });
      setEditingTag(null);
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error updating tag" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Tag",
      message: "Are you sure you want to delete this tag?",
      confirmText: "Confirm Delete",
      variant: "danger"
    });

    if (!isConfirmed) return;

    try {
      await supabase.from("tags").delete().eq("id", id);
      toast({ title: "Deleted" });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error deleting" });
    }
  };

  const filtered = tags.filter(t => t.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search tags..." 
            className="pl-10 rounded-xl bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl w-full sm:w-auto">
              <Plus className="mr-2 w-5 h-5" /> Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>New Tag</DialogTitle>
              <DialogDescription>Define a label for categorizing products.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tag Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full rounded-xl" onClick={handleCreate} disabled={processing}>
                {processing ? <Loader2 className="animate-spin w-4 h-4" /> : "Save Tag"}
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
                <TableHead>Tag Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={2} className="text-center py-10">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-20 text-muted-foreground">
                    <Bookmark className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    No tags found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingTag({ ...item })}>
                            <Edit className="w-4 h-4 text-primary" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl">
                          <DialogHeader>
                            <DialogTitle>Edit Tag</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Tag Name</Label>
                              <Input 
                                value={editingTag?.name || ""}
                                onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button className="w-full rounded-xl" onClick={handleUpdate} disabled={processing}>
                              {processing ? <Loader2 className="animate-spin w-4 h-4" /> : "Update Tag"}
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
