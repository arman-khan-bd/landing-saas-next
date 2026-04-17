
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2, Tags, Search, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

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
    if (!confirm("Delete this tag?")) return;
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
    <div className="space-y-6">
      <Card className="rounded-3xl border-border/50">
        <CardContent className="p-6">
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <Label>Quick Add Tag</Label>
              <Input placeholder="e.g. Summer Collection" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
            </div>
            <Button type="submit" className="rounded-xl h-10 px-8" disabled={processing}>
              {processing ? <Loader2 className="animate-spin" /> : <Plus className="mr-2" />} Add Tag
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center px-2">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Filter tags..." className="pl-10 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
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
                <TableRow><TableCell colSpan={2} className="text-center py-20 opacity-20"><Tags className="mx-auto" /> No tags found.</TableCell></TableRow>
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
                          <DialogHeader><DialogTitle>Edit Tag</DialogTitle></DialogHeader>
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
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
