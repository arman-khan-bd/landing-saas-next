"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function NewProductPage() {
  const { subdomain } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    image: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const storeQuery = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQuery);
      if (storeSnap.empty) {
        toast({ variant: "destructive", title: "Store not found" });
        setLoading(false);
        return;
      }
      const storeId = storeSnap.docs[0].id;
      const ownerId = auth.currentUser?.uid;

      if (!ownerId) {
        toast({ variant: "destructive", title: "Authentication required" });
        setLoading(false);
        return;
      }

      const productData = {
        storeId,
        ownerId,
        name: formData.name,
        price: Number(formData.price),
        stock: Number(formData.stock),
        description: formData.description,
        images: formData.image ? [formData.image] : [],
        createdAt: serverTimestamp(),
      };

      addDoc(collection(db, "products"), productData)
        .then(() => {
          toast({ title: "Product Added!" });
          router.push(`/${subdomain}/products`);
        })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: 'products',
            operation: 'create',
            requestResourceData: productData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });

    } catch (error) {
      toast({ variant: "destructive", title: "Error processing request" });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-headline font-bold">New Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-3xl border-border/50">
            <CardHeader>
              <CardTitle className="font-headline font-bold">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  placeholder="Premium Leather Wallet"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell your customers about this product..."
                  className="min-h-[200px] rounded-xl"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/50">
            <CardHeader>
              <CardTitle className="font-headline font-bold">Inventory & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="49.99"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Initial Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="100"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                  className="rounded-xl h-12"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-3xl border-border/50">
            <CardHeader>
              <CardTitle className="font-headline font-bold">Product Image</CardTitle>
              <CardDescription>Upload via Cloudinary.</CardDescription>
            </CardHeader>
            <CardContent>
              <CloudinaryUpload 
                onUpload={(url) => setFormData({ ...formData, image: url })}
                onRemove={() => setFormData({ ...formData, image: "" })}
                value={formData.image}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            Save Product
          </Button>
        </div>
      </form>
    </div>
  );
}