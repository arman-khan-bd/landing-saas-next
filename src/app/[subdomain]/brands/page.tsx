
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2, Store, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CloudinaryUpload } from "@/components/cloudinary-upload";

export default function BrandsPage() {
  const { subdomain } = useParams();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeId, setStoreId] = useState("");
  const [newBrand, setNewBrand] = useState({ name: "", logo: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchBrands();
  }, [subdomain]);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const storeQuery = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQuery);
      if (storeSnap.empty) return;
      const sId = storeSnap.docs[0].id;
      setStoreId(sId);

      const q = query(collection(db, "brands"), where("storeId", "==", sId));
      const querySnapshot = await getDocs(q);
      setBrands(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newBrand.name) return;
    setCreating(true);
    try {
      await addDoc(collection(db, "brands"), {
        ...newBrand,
        storeId,
        ownerId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Brand added" });
      setNewBrand({ name: "", logo: "" });
      fetchBrands();
    } catch (error) {
      toast({ variant: "destructive", title: "Error adding brand" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this brand?")) return;
    try {
      await deleteDoc(doc(db, "brands", id));
      toast({ title: "Brand deleted" });
      fetchBrands();
    } catch (error) {
      toast({ variant: "destructive", title: "Error deleting" });
    }
  };

  const filtered = brands.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search brands..." className="pl-10 rounded-xl bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Dialog>
          <DialogTrigger asChild><Button className="rounded-xl"><Plus className="mr-2" /> Add Brand</Button></DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader><DialogTitle>New Brand</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Brand Name</Label>
                <Input value={newBrand.name} onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                <CloudinaryUpload value={newBrand.logo} onUpload={(url) => setNewBrand({ ...newBrand, logo: url })} onRemove={() => setNewBrand({ ...newBrand, logo: "" })} />
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full rounded-xl" onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="animate-spin w-4 h-4" /> : "Save Brand"}
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
                <TableHead>Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-10">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-20 opacity-20"><Store className="mx-auto" /> No brands found.</TableCell></TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">{item.logo ? <img src={item.logo} className="w-full h-full object-cover" /> : <Store className="w-5 h-5" />}</div></TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
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
