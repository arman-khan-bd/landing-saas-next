"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSupabaseClient } from "@/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2, Palette, Search, Edit, Bookmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AttributesPage() {
  const { subdomain } = useParams();
  const supabase = useSupabaseClient();
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeId, setStoreId] = useState("");
  const [newName, setNewName] = useState("");
  const [newValues, setNewValues] = useState(""); // Comma-separated list
  const [editingAttr, setEditingAttr] = useState<any>(null);
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
        .from("attributes")
        .select("*")
        .eq("store_id", storeData.id);
      setAttributes(data ?? []);
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
    
    // Convert comma-separated string to clean trimmed array
    const valuesArray = newValues
      .split(",")
      .map(v => v.trim())
      .filter(v => v !== "");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("attributes").insert({
        name: newName,
        values: valuesArray,
        store_id: storeId,
        owner_id: user.id
      });
      toast({ title: "Attribute added" });
      setNewName("");
      setNewValues("");
      setIsCreateDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error adding attribute" });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingAttr?.name || !editingAttr?.id) return;
    setProcessing(true);

    const valuesArray = typeof editingAttr.values === "string"
      ? editingAttr.values.split(",").map((v: string) => v.trim()).filter((v: string) => v !== "")
      : editingAttr.values;

    try {
      await supabase
        .from("attributes")
        .update({
          name: editingAttr.name,
          values: valuesArray
        })
        .eq("id", editingAttr.id);
      toast({ title: "Attribute updated" });
      setEditingAttr(null);
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error updating attribute" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Attribute",
      message: "Are you sure you want to permanently delete this attribute? This will remove all options associated with it.",
      confirmText: "Confirm Delete",
      variant: "danger"
    });

    if (!isConfirmed) return;

    try {
      await supabase.from("attributes").delete().eq("id", id);
      toast({ title: "Deleted" });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error deleting" });
    }
  };

  const filtered = attributes.filter(a => a.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search attributes..." 
            className="pl-10 rounded-xl bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl w-full sm:w-auto">
              <Plus className="mr-2 w-5 h-5" /> Add Attribute
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>New Attribute</DialogTitle>
              <DialogDescription>Define a custom product property (e.g. Size, Color).</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Attribute Name</Label>
                <Input placeholder="Size" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Values (Comma-separated)</Label>
                <Input placeholder="S, M, L, XL" value={newValues} onChange={(e) => setNewValues(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full rounded-xl" onClick={handleCreate} disabled={processing}>
                {processing ? <Loader2 className="animate-spin w-4 h-4" /> : "Save Attribute"}
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
                <TableHead>Attribute Name</TableHead>
                <TableHead>Values</TableHead>
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
                    No attributes found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {item.values && item.values.map((val: string, index: number) => (
                          <span key={index} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-bold">
                            {val}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingAttr({ ...item, values: item.values.join(", ") })}>
                            <Edit className="w-4 h-4 text-primary" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl">
                          <DialogHeader>
                            <DialogTitle>Edit Attribute</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Attribute Name</Label>
                              <Input 
                                value={editingAttr?.name || ""}
                                onChange={(e) => setEditingAttr({ ...editingAttr, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Values (Comma-separated)</Label>
                              <Input 
                                value={editingAttr?.values || ""}
                                onChange={(e) => setEditingAttr({ ...editingAttr, values: e.target.value })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button className="w-full rounded-xl" onClick={handleUpdate} disabled={processing}>
                              {processing ? <Loader2 className="animate-spin w-4 h-4" /> : "Update Attribute"}
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
