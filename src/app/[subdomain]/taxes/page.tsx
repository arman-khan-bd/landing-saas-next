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

export default function TaxesPage() {
  const { subdomain } = useParams();
  const supabase = useSupabaseClient();
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeId, setStoreId] = useState("");
  const [newTax, setNewTax] = useState({ name: "", rate: "" });
  const [editingTax, setEditingTax] = useState<any>(null);
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
        .from("taxes")
        .select("*")
        .eq("store_id", storeData.id);
      setTaxes(data ?? []);
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
    if (!newTax.name || !newTax.rate) return;
    setProcessing(true);
    try {
      await supabase.from("taxes").insert({
        name: newTax.name,
        rate: Number(newTax.rate),
        store_id: storeId
      });
      toast({ title: "Tax added" });
      setNewTax({ name: "", rate: "" });
      setIsCreateDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error adding tax" });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTax?.name || !editingTax?.rate || !editingTax?.id) return;
    setProcessing(true);
    try {
      await supabase
        .from("taxes")
        .update({
          name: editingTax.name,
          rate: Number(editingTax.rate)
        })
        .eq("id", editingTax.id);
      toast({ title: "Tax updated" });
      setEditingTax(null);
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error updating tax" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Tax Rule",
      message: "Are you sure you want to permanently delete this tax rule?",
      confirmText: "Confirm Delete",
      variant: "danger"
    });

    if (!isConfirmed) return;

    try {
      await supabase.from("taxes").delete().eq("id", id);
      toast({ title: "Deleted" });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error deleting" });
    }
  };

  const filtered = taxes.filter(t => t.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search tax rules..." 
            className="pl-10 rounded-xl bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl w-full sm:w-auto">
              <Plus className="mr-2 w-5 h-5" /> Add Tax Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>New Tax Rule</DialogTitle>
              <DialogDescription>Define tax properties applied at checkout.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tax Name</Label>
                <Input value={newTax.name} onChange={(e) => setNewTax({ ...newTax, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Rate (%)</Label>
                <Input type="number" step="0.01" value={newTax.rate} onChange={(e) => setNewTax({ ...newTax, rate: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full rounded-xl" onClick={handleCreate} disabled={processing}>
                {processing ? <Loader2 className="animate-spin w-4 h-4" /> : "Save Tax Rule"}
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
                <TableHead>Rate (%)</TableHead>
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
                    No tax rules found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.rate}%</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingTax({ ...item })}>
                            <Edit className="w-4 h-4 text-primary" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl">
                          <DialogHeader>
                            <DialogTitle>Edit Tax Rule</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Tax Name</Label>
                              <Input 
                                value={editingTax?.name || ""}
                                onChange={(e) => setEditingTax({ ...editingTax, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Rate (%)</Label>
                              <Input 
                                type="number" 
                                step="0.01"
                                value={editingTax?.rate || ""}
                                onChange={(e) => setEditingTax({ ...editingTax, rate: e.target.value })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button className="w-full rounded-xl" onClick={handleUpdate} disabled={processing}>
                              {processing ? <Loader2 className="animate-spin w-4 h-4" /> : "Update Tax Rule"}
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
