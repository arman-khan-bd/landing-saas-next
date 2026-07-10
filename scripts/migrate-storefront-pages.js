const fs = require('fs');
const path = require('path');

// 1. Migrate [subdomain]/page.tsx
const subdomainPagePath = path.join(__dirname, '..', 'src', 'app', '[subdomain]', 'page.tsx');
const subdomainPageCode = `"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSupabaseClient } from "@/supabase";
import { getSubdomain } from "@/lib/subdomain";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { getTenantPath } from "@/lib/utils";
import { BlockRenderer } from "./builder/[pageId]/block-renderer";

export default function Storefront() {
  const { subdomain: paramsSubdomain } = useParams();
  const supabase = useSupabaseClient();
  const [subdomain, setSubdomain] = useState<string>("");

  useEffect(() => {
    let sub = typeof paramsSubdomain === 'string' ? paramsSubdomain.toLowerCase() : '';
    if (!sub && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ihut.shop";
      const extracted = getSubdomain(hostname, rootDomain);
      if (extracted) sub = extracted.toLowerCase();
    }
    setSubdomain(sub);
  }, [paramsSubdomain]);

  const [store, setStore] = useState<any>(null);
  const [page, setPage] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStoreAndPage = async () => {
    setLoading(true);
    try {
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("subdomain", subdomain)
        .single();

      if (!storeData) {
        setStore(null);
        setLoading(false);
        return;
      }
      setStore(storeData);

      // Fetch dynamic landing sections (pages)
      const { data: pageData } = await supabase
        .from("sections")
        .select("*")
        .eq("store_id", storeData.id)
        .eq("slug", "index")
        .maybeSingle();
      if (pageData) {
        setPage(pageData);
      }

      // Fetch products for order form components
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeData.id);
      setProducts(prods ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subdomain) {
      fetchStoreAndPage();
    }
  }, [subdomain]);

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-white"><Loader2 className="w-10 h-10 animate-spin text-primary mb-2" /><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Waking Up Business Matrix</p></div>;
  if (!store) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center"><h1 className="text-2xl font-black">Store Registry Not Found</h1><Link href="/"><Button className="mt-6">Return to Hub</Button></Link></div>;

  const config = page?.blocks || [];
  const pageStyle = page?.page_style || { backgroundColor: "#FFFFFF", paddingTop: 0, paddingBottom: 40 };

  return (
    <div 
      className="min-h-screen" 
      style={{ 
        backgroundColor: pageStyle.backgroundColor, 
        paddingTop: pageStyle.paddingTop ? (pageStyle.paddingTop + "px") : "0px", 
        paddingBottom: pageStyle.paddingBottom ? (pageStyle.paddingBottom + "px") : "0px",
        color: pageStyle.textColor 
      }}
    >
      {config.length > 0 ? (
        config.map((block: any) => (
          <BlockRenderer 
            key={block.id} 
            block={block} 
            products={products} 
            store={store} 
            isPreview 
            pageStyle={pageStyle} 
          />
        ))
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 text-center px-6">
           <Layers className="w-20 h-20 text-slate-100" />
           <div>
              <h1 className="text-3xl font-headline font-black text-slate-900 uppercase">Storefront Under Orchestration</h1>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">This merchant has not yet published their high-conversion section matrix.</p>
           </div>
           <Link href={getTenantPath(subdomain, "/sections")}><Button className="rounded-xl h-12 px-8 font-bold">Open Manager</Button></Link>
        </div>
      )}
    </div>
  );
}

const Layers = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m2.6 12.14 8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83l-8.58 3.9a2 2 0 0 1-1.66 0l-8.58-3.9a1 1 0 0 0 0 1.83Z"/><path d="m2.6 16.14 8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83l-8.58 3.9a2 2 0 0 1-1.66 0l-8.58-3.9a1 1 0 0 0 0 1.83Z"/></svg>
);
`;

fs.writeFileSync(subdomainPagePath, subdomainPageCode, 'utf8');
console.log("Migrated storefront index [subdomain]/page.tsx");

// 2. Migrate [subdomain]/product/[slug]/page.tsx
const productDetailPagePath = path.join(__dirname, '..', 'src', 'app', '[subdomain]', 'product', '[slug]', 'page.tsx');
if (fs.existsSync(productDetailPagePath)) {
  let content = fs.readFileSync(productDetailPagePath, 'utf8');
  content = content
    .replace(/import\s+[^;]*\s+from\s+["']firebase\/auth["'];?/g, '')
    .replace(/import\s+[^;]*\s+from\s+["']firebase\/firestore["'];?/g, '')
    .replace(/import\s*\{\s*db\s*\}\s*from\s*["']@\/lib\/firebase["'];?/g, 'import { useSupabaseClient } from "@/supabase";')
    .replace(/import\s*db\s*from\s*["']@\/lib\/firebase["'];?/g, 'import { useSupabaseClient } from "@/supabase";')
    .replace(/auth\.currentUser\?\.uid/g, '(await supabase.auth.getUser()).data.user?.id')
    // We can rewrite fetchProduct and handleSubmitLogic:
    .replace(/const\s+fetchProduct\s*=\s*async\s*\(\)\s*=>\s*\{[^}]+setLoading\(false\);\s*\};/s, `const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data: storeData } = await supabase
        .from("stores")
        .select("id")
        .eq("subdomain", subdomain)
        .single();
      if (!storeData) return;

      const { data: prodData } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeData.id)
        .eq("slug", slug)
        .single();

      if (prodData) {
        setProduct(prodData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };`)
    .replace(/const\s+handleSubmitOrder\s*=\s*async\s*\(e\?\s*:\s*React\.FormEvent\)\s*=>\s*\{[^}]+setSubmitting\(false\);\s*\};/s, `const handleSubmitOrder = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    try {
      const { data: storeData } = await supabase
        .from("stores")
        .select("id")
        .eq("subdomain", subdomain)
        .single();
      if (!storeData) return;

      await supabase.from("orders").insert({
        store_id: storeData.id,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_address: customerInfo.address,
        total_amount: product.currentPrice * quantity,
        status: "pending",
        items: [{
          id: product.id,
          name: product.name,
          price: product.currentPrice,
          quantity: quantity
        }]
      });

      toast({ title: "Order Placed Successfully!", description: "We will contact you shortly." });
      setCustomerInfo({ name: "", phone: "", address: "" });
      setQuantity(1);
    } catch (error) {
      toast({ variant: "destructive", title: "Error placing order" });
    } finally {
      setSubmitting(false);
    }
  };`);
  
  fs.writeFileSync(productDetailPagePath, content, 'utf8');
  console.log("Migrated product detail [subdomain]/product/[slug]/page.tsx");
}

// 3. Migrate [subdomain]/products/[id]/page.tsx (Edit product page)
const editProductPagePath = path.join(__dirname, '..', 'src', 'app', '[subdomain]', 'products', '[id]', 'page.tsx');
if (fs.existsSync(editProductPagePath)) {
  let content = fs.readFileSync(editProductPagePath, 'utf8');
  content = content
    .replace(/import\s+[^;]*\s+from\s+["']firebase\/auth["'];?/g, '')
    .replace(/import\s+[^;]*\s+from\s+["']firebase\/firestore["'];?/g, '')
    .replace(/import\s*\{\s*db\s*\}\s*from\s*["']@\/lib\/firebase["'];?/g, 'import { useSupabaseClient } from "@/supabase";')
    .replace(/import\s*db\s*from\s*["']@\/lib\/firebase["'];?/g, 'import { useSupabaseClient } from "@/supabase";')
    .replace(/auth\.currentUser\?\.uid/g, '(await supabase.auth.getUser()).data.user?.id')
    // Remove quillRef
    .replace(/ref=\{quillRef\}/g, '')
    .replace(/const\s+fetchData\s*=\s*async\s*\(\)\s*=>\s*\{[^}]+setInitialLoading\(false\);\s*\};/s, `const fetchData = async () => {
    try {
      const { data: storeData } = await supabase
        .from("stores")
        .select("id")
        .eq("subdomain", subdomain)
        .single();
      if (!storeData) return;
      const storeId = storeData.id;

      const [catRes, subRes, brandRes, prodRes] = await Promise.all([
        supabase.from("categories").select("*").eq("store_id", storeId),
        supabase.from("sub_categories").select("*").eq("store_id", storeId),
        supabase.from("brands").select("*").eq("store_id", storeId),
        supabase.from("products").select("*").eq("id", id).single()
      ]);

      setCategories(catRes.data ?? []);
      setSubCategories(subRes.data ?? []);
      setBrands(brandRes.data ?? []);

      if (prodRes.data) {
        const prod = prodRes.data;
        setFormData({
          name: prod.name || "",
          slug: prod.slug || "",
          shortDescription: prod.shortDescription || "",
          description: prod.description || "",
          featuredImage: prod.featuredImage || "",
          gallery: prod.gallery || [],
          tags: Array.isArray(prod.tags) ? prod.tags.join(', ') : "",
          metaKeywords: prod.metaKeywords || "",
          metaDescription: prod.metaDescription || "",
          currentPrice: String(prod.currentPrice || ""),
          prevPrice: String(prod.prevPrice || ""),
          category: prod.category || "",
          subCategory: prod.subCategory || "",
          brand: prod.brand || "",
          totalInStock: String(prod.totalInStock || ""),
          tax: prod.tax || "0",
          sku: prod.sku || "",
          youtubeLink: prod.youtubeLink || ""
        });
      }
    } catch (error) {
      console.error("Meta fetch error:", error);
    } finally {
      setInitialLoading(false);
    }
  };`)
    .replace(/const\s+handleSubmit\s*=\s*async\s*\(e\?\s*:\s*React\.FormEvent\)\s*=>\s*\{[^}]+setLoading\(false\);\s*\};/s, `const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const { data: storeData } = await supabase
        .from("stores")
        .select("id")
        .eq("subdomain", subdomain)
        .single();
      if (!storeData) return;

      const productData = {
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
        youtubeLink: formData.youtubeLink
      };

      await supabase
        .from("products")
        .update(productData)
        .eq("id", id);

      toast({ title: "Product Updated Successfully!" });
      router.push("/" + subdomain + "/products");
    } catch (error) {
      toast({ variant: "destructive", title: "Error processing request" });
    } finally {
      setLoading(false);
    }
  };`);

  fs.writeFileSync(editProductPagePath, content, 'utf8');
  console.log("Migrated edit product [subdomain]/products/[id]/page.tsx");
}
