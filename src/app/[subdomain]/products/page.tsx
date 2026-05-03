"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Package, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";

export default function ProductsPage() {
  const { subdomain } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();
  }, [subdomain]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const storeQuery = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQuery);
      if (storeSnap.empty) return;
      const storeId = storeSnap.docs[0].id;

      const q = query(collection(db, "products"), where("storeId", "==", storeId));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Product",
      message: "Are you sure you want to permanently delete this product? This action cannot be undone.",
      confirmText: "Delete Permanently",
      variant: "danger"
    });

    if (!isConfirmed) return;

    try {
      await deleteDoc(doc(db, "products", id));
      toast({ title: "Product deleted" });
      fetchProducts();
    } catch (error) {
      toast({ variant: "destructive", title: "Error deleting product" });
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search products..." 
            className="pl-10 rounded-xl bg-white h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="rounded-xl h-11 shadow-lg shadow-primary/10 font-bold" onClick={() => router.push(`/${subdomain}/products/new`)}>
          <Plus className="mr-2 w-5 h-5" /> Add Product
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Package className="w-12 h-12 animate-pulse mb-4" />
          <p>Scanning inventory...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-[32px] border-2 border-dashed">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-10" />
          <h3 className="text-xl font-bold">No products found</h3>
          <p className="text-muted-foreground">Try a different search or add a new product.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card className="rounded-[32px] overflow-hidden border-border/50 shadow-xl shadow-primary/5">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-border/50">
                      <TableHead className="w-[80px] pl-6">Image</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Inventory</TableHead>
                      <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id} className="hover:bg-muted/30 border-border/50">
                        <TableCell className="pl-6">
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center border border-border overflow-hidden shadow-sm">
                            {(product.featuredImage || (product.gallery && product.gallery[0])) ? (
                              <img 
                                src={product.featuredImage || product.gallery[0]} 
                                alt={product.name} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <Package className="w-5 h-5 text-muted-foreground/30" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{product.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">{product.sku || 'No SKU'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${product.totalInStock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive'}`}>
                            {product.totalInStock > 0 ? 'Available' : 'Out of Stock'}
                          </span>
                        </TableCell>
                        <TableCell className="font-black text-primary">৳{Number(product.currentPrice || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className="font-bold text-sm bg-muted px-3 py-1 rounded-lg">
                            {product.totalInStock || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                                <MoreHorizontal className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl shadow-xl border-border/50 p-2 min-w-[160px]">
                              <DropdownMenuItem className="gap-3 rounded-xl py-2.5 cursor-pointer font-medium" onClick={() => router.push(`/${subdomain}/products/${product.id}`)}>
                                <Edit className="w-4 h-4 text-muted-foreground" /> Edit Product
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-3 rounded-xl py-2.5 text-destructive focus:bg-destructive focus:text-white cursor-pointer font-medium" onClick={() => handleDelete(product.id)}>
                                <Trash2 className="w-4 h-4" /> Delete Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Card List View */}
          <div className="grid grid-cols-1 gap-4 md:hidden pb-10">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="rounded-3xl border-border/50 overflow-hidden shadow-sm active:scale-[0.98] transition-transform">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-muted shrink-0 overflow-hidden border border-border">
                      {(product.featuredImage || (product.gallery && product.gallery[0])) ? (
                        <img src={product.featuredImage || product.gallery[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20"><Package /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-lg leading-tight truncate pr-2">{product.name}</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px]">
                            <DropdownMenuItem className="gap-3 py-3 rounded-xl" onClick={() => router.push(`/${subdomain}/products/${product.id}`)}>
                              <Edit className="w-4 h-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-3 py-3 rounded-xl text-destructive" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="w-4 h-4" /> Delete Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-primary">৳{Number(product.currentPrice || 0).toFixed(2)}</span>
                        {product.prevPrice && <span className="text-xs text-muted-foreground line-through">${product.prevPrice}</span>}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${product.totalInStock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive'}`}>
                          {product.totalInStock > 0 ? 'In Stock' : 'Out'}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground">Qty: {product.totalInStock || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
