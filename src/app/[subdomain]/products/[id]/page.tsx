"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Save, Tags, Globe, Layout, DollarSign, Package, Video, CheckCircle2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import "react-quill-new/dist/quill.snow.css";

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { 
  ssr: false, 
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-md" /> 
});

export default function EditProductPage() {
  const { subdomain, id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const quillRef = useRef<any>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [formData, setFormData] = useState<any>({
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    featuredImage: "",
    gallery: [],
    tags: "",
    metaKeywords: "",
    metaDescription: "",
    currentPrice: "",
    prevPrice: "",
    category: "",
    subCategory: "",
    brand: "",
    totalInStock: "",
    tax: "0",
    sku: "",
    youtubeLink: "",
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "products", id as string);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          ...data,
          currentPrice: data.currentPrice?.toString() || "",
          prevPrice: data.prevPrice?.toString() || "",
          totalInStock: data.totalInStock?.toString() || "",
          tags: Array.isArray(data.tags) ? data.tags.join(", ") : data.tags || "",
        });

        // Fetch Metadata for the store
        const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain));
        const storeSnap = await getDocs(storeQ);
        if (!storeSnap.empty) {
          const storeId = storeSnap.docs[0].id;
          const [catSnap, subSnap, brandSnap] = await Promise.all([
            getDocs(query(collection(db, "categories"), where("storeId", "==", storeId))),
            getDocs(query(collection(db, "sub-categories"), where("storeId", "==", storeId))),
            getDocs(query(collection(db, "brands"), where("storeId", "==", storeId)))
          ]);
          setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          setSubCategories(subSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          setBrands(brandSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }

      } else {
        toast({ variant: "destructive", title: "Product not found" });
        router.push(`/${subdomain}/products`);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error fetching product" });
    } finally {
      setLoading(false);
    }
  };
 
  const generateSKU = () => {
    const prefix = formData.name ? formData.name.substring(0, 3).toUpperCase() : "PRD";
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    const sku = `${prefix}-${random}-${timestamp}`;
    setFormData((prev: any) => ({ ...prev, sku }));
    toast({ title: "SKU Generated", description: `New SKU: ${sku}` });
  };

  const filteredSubCategories = useMemo(() => {
    if (!formData.category) return [];
    return subCategories.filter(s => s.categoryId === formData.category);
  }, [formData.category, subCategories]);

  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("upload_preset", "krishi-bazar");

      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/dj7pg5slk/image/upload`, {
          method: "POST",
          body: uploadData,
        });
        const data = await res.json();
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, "image", data.secure_url);
        }
      } catch (error) {
        console.error("Editor image upload error:", error);
        toast({ variant: "destructive", title: "Image upload failed" });
      }
    };
  }, [toast]);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  }), [imageHandler]);

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    
    try {
      const docRef = doc(db, "products", id as string);
      const productData = {
        name: formData.name,
        slug: formData.slug,
        shortDescription: formData.shortDescription,
        description: formData.description,
        featuredImage: formData.featuredImage,
        gallery: formData.gallery,
        tags: typeof formData.tags === 'string' ? formData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag !== "") : formData.tags,
        metaKeywords: formData.metaKeywords,
        metaDescription: formData.metaDescription,
        currentPrice: Number(formData.currentPrice),
        prevPrice: formData.prevPrice ? Number(formData.prevPrice) : null,
        category: formData.category,
        subCategory: formData.subCategory,
        brand: formData.brand,
        totalInStock: Number(formData.totalInStock),
        tax: formData.tax,
        sku: formData.sku,
        youtubeLink: formData.youtubeLink,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, productData);
      toast({ title: "Product Updated Successfully!" });
      router.push(`/${subdomain}/products`);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error updating product" });
    } finally {
      setSaving(false);
    }
  };

  const handleGalleryUpload = (url: string) => {
    setFormData((prev: any) => ({ ...prev, gallery: [...prev.gallery, url] }));
  };

  const handleGalleryRemove = (urlToRemove: string) => {
    setFormData((prev: any) => ({ ...prev, gallery: prev.gallery.filter((url: string) => url !== urlToRemove) }));
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-headline font-bold">Edit Product</h1>
            <p className="text-muted-foreground text-sm">Update your product details and stay competitive.</p>
          </div>
        </div>
        <Button onClick={() => handleUpdate()} className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20" disabled={saving}>
          {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          Update Product
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Layout className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl font-headline font-bold">General Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Product Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="rounded-xl h-11 bg-muted/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Textarea
                  id="shortDescription"
                  className="rounded-xl h-24 resize-none"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Full Description</Label>
                <div className="rounded-xl overflow-hidden border border-input">
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={formData.description}
                    onChange={(val) => setFormData({ ...formData, description: val })}
                    modules={modules}
                    className="min-h-[250px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/50 shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl font-headline font-bold">Media & Assets</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-4">
                <Label>Featured Image</Label>
                <CloudinaryUpload 
                  value={formData.featuredImage}
                  onUpload={(url) => setFormData({ ...formData, featuredImage: url })}
                  onRemove={() => setFormData({ ...formData, featuredImage: "" })}
                />
              </div>

              <div className="space-y-4">
                <Label>Gallery Images</Label>
                <CloudinaryUpload 
                  multiple
                  value={formData.gallery}
                  onUpload={handleGalleryUpload}
                  onRemove={handleGalleryRemove}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="rounded-3xl border-border/50 shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl font-headline font-bold">Pricing & Stock</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPrice">New Price ($)</Label>
                  <Input
                    id="currentPrice"
                    type="number"
                    value={formData.currentPrice}
                    onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                    required
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prevPrice">Old Price ($)</Label>
                  <Input
                    id="prevPrice"
                    type="number"
                    value={formData.prevPrice}
                    onChange={(e) => setFormData({ ...formData, prevPrice: e.target.value })}
                    className="rounded-xl h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="totalInStock">Stock</Label>
                  <Input
                    id="totalInStock"
                    type="number"
                    value={formData.totalInStock}
                    onChange={(e) => setFormData({ ...formData, totalInStock: e.target.value })}
                    required
                    className="rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sku"
                      placeholder="L-BAG-VINT-001"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="rounded-xl h-11 flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={generateSKU}
                      className="h-11 w-11 rounded-xl border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-all"
                      title="Auto Generate SKU"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/50 shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Tags className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl font-headline font-bold">Organization</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val, subCategory: "" })}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categories.length === 0 ? (
                      <p className="p-4 text-xs text-muted-foreground text-center italic">No categories found</p>
                    ) : (
                      categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sub Category</Label>
                <Select 
                  value={formData.subCategory} 
                  onValueChange={(val) => setFormData({ ...formData, subCategory: val })}
                  disabled={!formData.category || filteredSubCategories.length === 0}
                >
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder={formData.category ? "Select Sub Category" : "Choose Category First"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {filteredSubCategories.map(sub => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Brand</Label>
                <Select value={formData.brand} onValueChange={(val) => setFormData({ ...formData, brand: val })}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select Brand" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {brands.length === 0 ? (
                      <p className="p-4 text-xs text-muted-foreground text-center italic">No brands found</p>
                    ) : (
                      brands.map(brand => (
                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile-Friendly Bottom Save Button */}
      <div className="pt-6 sm:hidden">
        <Button 
          onClick={() => handleUpdate()} 
          className="w-full h-16 rounded-2xl text-xl font-black shadow-2xl shadow-primary/30 uppercase tracking-tight"
          disabled={saving}
        >
          {saving ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <CheckCircle2 className="mr-2 w-6 h-6" />}
          Update Changes
        </Button>
      </div>
    </div>
  );
}
