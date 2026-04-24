"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Save, Tags, Globe, Layout, DollarSign, Package, Video, Layers, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import "react-quill-new/dist/quill.snow.css";

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { 
  ssr: false, 
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-md" /> 
});

export default function NewProductPage() {
  const { subdomain } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const quillRef = useRef<any>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    featuredImage: "",
    gallery: [] as string[],
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

  // Fetch Metadata (Categories, Brands, etc.)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain));
        const storeSnap = await getDocs(storeQ);
        if (storeSnap.empty) return;
        const storeId = storeSnap.docs[0].id;

        const [catSnap, subSnap, brandSnap] = await Promise.all([
          getDocs(query(collection(db, "categories"), where("storeId", "==", storeId))),
          getDocs(query(collection(db, "sub-categories"), where("storeId", "==", storeId))),
          getDocs(query(collection(db, "brands"), where("storeId", "==", storeId)))
        ]);

        setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setSubCategories(subSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setBrands(brandSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Meta fetch error:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [subdomain]);

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name]);

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        slug: formData.slug,
        shortDescription: formData.shortDescription,
        description: formData.description,
        featuredImage: formData.featuredImage,
        gallery: formData.gallery,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ""),
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      addDoc(collection(db, "products"), productData)
        .then(() => {
          toast({ title: "Product Created Successfully!" });
          router.push(`/${subdomain}/products`);
        })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: 'products',
            operation: 'create',
            requestResourceData: productData,
          });
          errorEmitter.emit('permission-error', permissionError);
          setLoading(false);
        });

    } catch (error) {
      toast({ variant: "destructive", title: "Error processing request" });
      setLoading(false);
    }
  };

  const handleGalleryUpload = (url: string) => {
    setFormData(prev => ({ ...prev, gallery: [...prev.gallery, url] }));
  };

  const handleGalleryRemove = (urlToRemove: string) => {
    setFormData(prev => ({ ...prev, gallery: prev.gallery.filter(url => url !== urlToRemove) }));
  };

  if (initialLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-headline font-bold">Launch New Product</h1>
            <p className="text-muted-foreground text-sm">Fill in the details to list your product across the globe.</p>
          </div>
        </div>
        <Button onClick={() => handleSubmit()} className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20" disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          Publish Product
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
                    placeholder="E.g. Vintage Leather Bag"
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
                    placeholder="vintage-leather-bag"
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
                  placeholder="Brief summary for product cards..."
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

              <div className="space-y-2">
                <Label htmlFor="youtubeLink">YouTube Video Link</Label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="youtubeLink"
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.youtubeLink}
                    onChange={(e) => setFormData({ ...formData, youtubeLink: e.target.value })}
                    className="pl-10 rounded-xl h-11"
                  />
                </div>
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
                    step="0.01"
                    placeholder="49.99"
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
                    step="0.01"
                    placeholder="59.99"
                    value={formData.prevPrice}
                    onChange={(e) => setFormData({ ...formData, prevPrice: e.target.value })}
                    className="rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalInStock">Total in Stock</Label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="totalInStock"
                    type="number"
                    placeholder="100"
                    value={formData.totalInStock}
                    onChange={(e) => setFormData({ ...formData, totalInStock: e.target.value })}
                    required
                    className="pl-10 rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU Code</Label>
                <Input
                  id="sku"
                  placeholder="L-BAG-VINT-001"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="rounded-xl h-11"
                />
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
                <Label htmlFor="tags">Product Tags</Label>
                <Input
                  id="tags"
                  placeholder="tag1, tag2, tag3"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile-Friendly Bottom Action Button */}
      <div className="pt-6 sm:hidden">
        <Button 
          onClick={() => handleSubmit()} 
          className="w-full h-16 rounded-2xl text-xl font-black shadow-2xl shadow-primary/30 uppercase tracking-tight"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <CheckCircle2 className="mr-2 w-6 h-6" />}
          Launch Product
        </Button>
      </div>
    </div>
  );
}
