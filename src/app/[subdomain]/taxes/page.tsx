"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2, Percent, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function TaxesPage() {
  const { subdomain } = useParams();
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [storeId, setStoreId] = useState("");
  const [newTax, setNewTax] = useState({ name: "", percentage: "" });
  const [editingTax, setEditingTag] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    fetchTaxes();
  }, [subdomain]);

  const fetchTaxes = async () => {
    setLoading(true);
    try {
      const storeQuery = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQuery);
      if (storeSnap.empty) return;
      const sId = storeSnap.docs[0].id;
      setStoreId(sId);

      const q = query(collection(db, "taxes"), where("storeId", "==", sId));
      const querySnapshot = await getDocs(q);
      setTaxes(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTax.name || !newTax.percentage) return;
    setProcessing(true);
    try {
      await addDoc(collection(db, "taxes"), {
        name: newTax.name,
        percentage: Number(newTax.percentage),
        storeId,
        ownerId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Tax added" });
      setNewTax({ name: "", percentage: "" });
      setIsCreateOpen(false);
      fetchTaxes();
    } catch (error) {
      toast({ variant: "destructive", title: "Error adding tax" });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTax?.name || !editingTax?.percentage || !editingTax?.id) return;
    setProcessing(true);
    try {
      await updateDoc(doc(db, "taxes", editingTax.id), {
        name: editingTax.name,
        percentage: Number(editingTax.percentage),
      });
      toast({ title: "Tax updated" });
      setEditingTag(null);
      fetchTaxes();
    } catch (error) {
      toast({ variant: "destructive", title: "Error updating" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Tax Setting",
      message: "Are you sure you want to delete this tax configuration? This will remove it from all products associated with it.",
      confirmText: "Delete Permanently",
      variant: "danger"
    });

    if (!isConfirmed) return;

    try {
      await deleteDoc(doc(db, "taxes", id));
      toast({ title: "Tax deleted" });
      fetchTaxes();
    } catch (error) {
      toast({ variant: "destructive", title: "Error deleting" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-headline font-bold">Tax Management</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild><Button className="rounded-xl"><Plus className="mr-2" /> Add Tax</Button></DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader><DialogTitle>New Tax Setting</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tax Name</Label>
                <Input placeholder="Standard VAT" value={newTax.name} onChange={(e) => setNewTax({ ...newTax, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Percentage (%)</Label>
                <Input type="number" placeholder="15" value={newTax.percentage} onChange={(e) => setNewTax({ ...newTax, percentage: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full rounded-xl" onClick={handleCreate} disabled={processing}>
                {processing ? <Loader2 className="animate-spin w-4 h-4" /> : "Save Tax"}
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
                <TableHead>Tax Name</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-10">Loading...</TableCell></TableRow>
              ) : taxes.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-20 opacity-20"><Percent className="mx-auto" /> No taxes defined.</TableCell></TableRow>
              ) : (
                taxes.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.percentage}%</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingTag({ ...item })}>
                            <Edit className="w-4 h-4 text-primary" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl">
                          <DialogHeader><DialogTitle>Edit Tax</DialogTitle></DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Tax Name</Label>
                              <Input value={editingTax?.name || ""} onChange={(e) => setEditingTag({ ...editingTax, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label>Percentage (%)</Label>
                              <Input type="number" value={editingTax?.percentage || ""} onChange={(e) => setEditingTag({ ...editingTax, percentage: e.target.value })} />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button className="w-full rounded-xl" onClick={handleUpdate} disabled={processing}>
                              {processing ? <Loader2 className="animate-spin w-4 h-4" /> : "Update Tax"}
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
