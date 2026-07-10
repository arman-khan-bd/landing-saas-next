import { db } from "@/lib/firebase-server";
import { collection, query, where, getDocs, limit, Timestamp, orderBy } from "firebase/firestore";

export function sanitizeData(data: any): any {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const clean: any = { ...data };
    for (const key in clean) {
      if (clean[key] instanceof Timestamp) {
        clean[key] = clean[key].toDate().toISOString();
      } else {
        clean[key] = sanitizeData(clean[key]);
      }
    }
    return clean;
  }
  
  return data;
}

export async function getStoreBySubdomain(subdomain: string) {
  try {
    const q = query(collection(db, "stores"), where("subdomain", "==", subdomain), limit(1));
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    
    const data = { id: snap.docs[0].id, ...snap.docs[0].data() };
    return sanitizeData(data);
  } catch (error) {
    console.error("Error fetching store on server:", error);
    return null;
  }
}

export async function getProductBySlug(storeId: string, slug: string) {
  try {
    const q = query(
      collection(db, "products"), 
      where("storeId", "==", storeId), 
      where("slug", "==", slug), 
      limit(1)
    );
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    
    const data = { id: snap.docs[0].id, ...snap.docs[0].data() };
    return sanitizeData(data);
  } catch (error) {
    console.error("Error fetching product on server:", error);
    return null;
  }
}
export async function getPageBySlug(storeId: string, slug: string) {
  try {
    let snap;
    try {
      const q = query(
        collection(db, "pages"), 
        where("storeId", "==", storeId), 
        where("slug", "==", slug), 
        orderBy("updatedAt", "desc"),
        limit(1)
      );
      snap = await getDocs(q);
    } catch (e) {
      const q = query(
        collection(db, "pages"), 
        where("storeId", "==", storeId), 
        where("slug", "==", slug), 
        limit(1)
      );
      snap = await getDocs(q);
    }
    
    if (snap.empty) return null;
    
    const data = { id: snap.docs[0].id, ...snap.docs[0].data() };
    return sanitizeData(data);
  } catch (error) {
    console.error("Error fetching page on server:", error);
    return null;
  }
}

export async function getProductsByStore(storeId: string) {
  try {
    let snap;
    try {
      const q = query(
        collection(db, "products"), 
        where("storeId", "==", storeId), 
        orderBy("createdAt", "desc")
      );
      snap = await getDocs(q);
    } catch (e) {
      const q = query(
        collection(db, "products"), 
        where("storeId", "==", storeId)
      );
      snap = await getDocs(q);
    }
    
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return sanitizeData(data);
  } catch (error) {
    console.error("Error fetching products on server:", error);
    return [];
  }
}

export async function getCategoriesByStore(storeId: string) {
  try {
    const [catSnap, subCatSnap] = await Promise.all([
      getDocs(query(collection(db, "categories"), where("storeId", "==", storeId))),
      getDocs(query(collection(db, "sub-categories"), where("storeId", "==", storeId))).catch(() => ({ docs: [] }))
    ]);
    
    const mainCats = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const subCats = subCatSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), isSub: true }));
    
    return sanitizeData([...mainCats, ...subCats]);
  } catch (error) {
    console.error("Error fetching categories on server:", error);
    return [];
  }
}

