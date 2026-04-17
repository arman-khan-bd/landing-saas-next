"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    features: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Get Store ID
      const storeQuery = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQuery);
      if (storeSnap.empty) return;
      const storeId = storeSnap.docs[0].id;

      await addDoc(collection(db, "products"), {
        storeId,
        name: formData.name,
        price: Number(formData.price),
        stock: Number(formData.stock),
        description: formData.description,
        images: formData.image ? [formData.image] : [],
        createdAt: serverTimestamp(),
      });

      toast({ title: "Product Added!" });
      router.push(`/${subdomain}/products`);
    } catch (error) {
      toast({ variant: "destructive", title: "Error saving product" });
    } finally {
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
              <div className="space-y-2">
                <Label htmlFor="features">Key Features (comma separated)</Label>
                <Input
                  id="features"
                  placeholder="Waterproof, 2 year warranty, Italian leather"
                  className="rounded-xl"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
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
              <CardDescription>Upload a high-quality photo of your product.</CardDescription>
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
