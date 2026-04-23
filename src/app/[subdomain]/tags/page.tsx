"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2, Tags as TagsIcon, Search, Edit, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function TagsPage() {
  const { subdomain } = useParams();
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeId, setStoreId] = useState("");
  const [newTag, setNewTag] = useState("");
  const [editingTag, setEditingTag] = useState<any>(null);
  const { toast } = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    fetchTags();
  }, [subdomain]);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const storeQuery = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQuery);
      if (storeSnap.empty) return;
      const sId = storeSnap.docs[0].id;
      setStoreId(sId);

      const q = query(collection(db, "tags"), where("storeId", "==", sId));
      const querySnapshot = await getDocs(q);
      setTags(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag) return;
    setProcessing(true);
    try {
      await addDoc(collection(db, "tags"), {
        name: newTag,
        storeId,
        ownerId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Tag added" });
      setNewTag("");
      fetchTags();
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
      await updateDoc(doc(db, "tags", editingTag.id), {
        name: editingTag.name,
      });
      toast({ title: "Tag updated" });
      setEditingTag(null);
      fetchTags();
    } catch (error) {
      toast({ variant: "destructive", title: "Error updating tag" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Tag",
      message: "Are you sure you want to delete this tag? It will be removed from all products using it.",
      confirmText: "Confirm Delete",
      variant: "danger"
    });

    if (!isConfirmed) return;

    try {
      await deleteDoc(doc(db, "tags", id));
      toast({ title: "Tag deleted" });
      fetchTags();
    } catch (error) {
      toast({ variant: "destructive", title: "Error deleting" });
    }
  };

  const filtered = tags.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="rounded-[24px] sm:rounded-3xl border-border/50 bg-white shadow-sm overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Add Tag</Label>
              <Input placeholder="e.g. Summer Collection" value={newTag} onChange={(e) => setNewTag(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <Button type="submit" className="w-full sm:w-auto rounded-xl h-11 px-8 font-bold shadow-lg shadow-primary/10" disabled={processing || !newTag}>
              {processing ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />} Add Tag
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 px-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Filter tags..." className="pl-10 rounded-2xl bg-white border-border/50 h-11 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-muted/10 rounded-[32px] border-2 border-dashed">
          <TagsIcon className="w-16 h-16 mx-auto mb-4 opacity-10" />
          <p className="text-muted-foreground">No tags found.</p>
        </div>
      ) : (
        <>
          {/* Desktop View */}
          <div className="hidden md:block">
            <Card className="rounded-[32px] overflow-hidden border-border/50 shadow-sm bg-white">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-border/50">
                      <TableHead className="py-4 px-6">Tag Name</TableHead>
                      <TableHead className="py-4 px-6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow key={item.id} className="border-border/50 hover:bg-primary/5 transition-colors">
                        <TableCell className="py-4 px-6">
                           <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-full">
                              #{item.name}
                           </span>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setEditingTag({ ...item })}>
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
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filtered.map((item) => (
              <Card key={item.id} className="rounded-2xl border-border/50 bg-white shadow-sm overflow-hidden">
                <CardContent className="p-4 flex justify-between items-center">
                  <span className="font-bold text-primary">#{item.name}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[140px]">
                      <DropdownMenuItem className="gap-3 py-2.5 rounded-xl" onClick={() => setEditingTag({ ...item })}>
                        <Edit className="w-4 h-4 text-primary" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-3 py-2.5 rounded-xl text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Edit Dialog */}
      {editingTag && (
        <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
          <DialogContent className="rounded-3xl max-w-[90vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-headline font-bold">Edit Tag</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label>Tag Name</Label>
              <Input 
                value={editingTag.name} 
                onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })} 
                className="mt-2 h-11 rounded-xl"
              />
            </div>
            <DialogFooter>
              <Button className="w-full rounded-xl h-11 font-bold" onClick={handleUpdate} disabled={processing}>
                {processing ? <Loader2 className="animate-spin w-4 h-4" /> : "Update Tag"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
