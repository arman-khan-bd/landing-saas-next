import { getSupabaseServerClient } from "@/supabase/server";

export function sanitizeData(data: any): any {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const clean: any = { ...data };
    
    // Compatibility mapping: snake_case to camelCase
    if (clean.store_id !== undefined && clean.storeId === undefined) clean.storeId = clean.store_id;
    if (clean.owner_id !== undefined && clean.ownerId === undefined) clean.ownerId = clean.owner_id;
    if (clean.created_at !== undefined && clean.createdAt === undefined) clean.createdAt = clean.created_at;
    if (clean.updated_at !== undefined && clean.updatedAt === undefined) clean.updatedAt = clean.updated_at;
    if (clean.page_style !== undefined && clean.pageStyle === undefined) clean.pageStyle = clean.page_style;
    if (clean.config !== undefined && clean.blocks === undefined) clean.blocks = clean.config;
    if (clean.blocks !== undefined && clean.config === undefined) clean.config = clean.blocks;

    for (const key in clean) {
      clean[key] = sanitizeData(clean[key]);
    }
    return clean;
  }
  
  return data;
}

export async function getStoreBySubdomain(subdomain: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("subdomain", subdomain)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return sanitizeData(data);
  } catch (error) {
    console.error("Error fetching store on server:", error);
    return null;
  }
}

export async function getProductBySlug(storeId: string, slug: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();
    
    if (error || !data) return null;
    return sanitizeData(data);
  } catch (error) {
    console.error("Error fetching product on server:", error);
    return null;
  }
}

export async function getPageBySlug(storeId: string, slug: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("store_id", storeId)
      .eq("slug", slug)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error || !data) {
      // Try fallback without ordering
      const { data: fallbackData } = await supabase
        .from("pages")
        .select("*")
        .eq("store_id", storeId)
        .eq("slug", slug)
        .limit(1)
        .maybeSingle();
      if (fallbackData) return sanitizeData(fallbackData);
      return null;
    }
    
    return sanitizeData(data);
  } catch (error) {
    console.error("Error fetching page on server:", error);
    return null;
  }
}

export async function getProductsByStore(storeId: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      // Try fallback without ordering
      const { data: fallbackData } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId);
      return sanitizeData(fallbackData || []);
    }
    
    return sanitizeData(data || []);
  } catch (error) {
    console.error("Error fetching products on server:", error);
    return [];
  }
}

export async function getCategoriesByStore(storeId: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const [catRes, subCatRes] = await Promise.all([
      supabase.from("categories").select("*").eq("store_id", storeId),
      supabase.from("sub_categories").select("*").eq("store_id", storeId)
    ]);
    
    const mainCats = catRes.data || [];
    const subCats = (subCatRes.data || []).map((s: any) => ({ ...s, isSub: true }));
    
    return sanitizeData([...mainCats, ...subCats]);
  } catch (error) {
    console.error("Error fetching categories on server:", error);
    return [];
  }
}
