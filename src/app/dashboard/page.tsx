"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, Plus, Store, ExternalLink, LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStoreUrl } from "@/lib/utils";

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newStore, setNewStore] = useState({ name: "", subdomain: "" });
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        fetchStores(user.uid);
      } else {
        router.push("/auth");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchStores = async (uid: string) => {
    setLoading(true);
    try {
      const q = query(collection(db, "stores"), where("ownerId", "==", uid));
      const querySnapshot = await getDocs(q);
      const storesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStores(storesList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async () => {
    if (!newStore.name || !newStore.subdomain) {
      toast({ variant: "destructive", title: "Missing fields" });
      return;
    }
    setCreating(true);
    try {
      // Check if subdomain exists (basic check)
      const q = query(collection(db, "stores"), where("subdomain", "==", newStore.subdomain.toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast({ variant: "destructive", title: "Subdomain already taken" });
        setCreating(false);
        return;
      }

      await addDoc(collection(db, "stores"), {
        name: newStore.name,
        subdomain: newStore.subdomain.toLowerCase(),
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      toast({ title: "Store Created!", description: "Your store is now online." });
      setNewStore({ name: "", subdomain: "" });
      fetchStores(user.uid);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error creating store", description: error.message });
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/auth");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShoppingCart className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-headline font-bold text-primary">iHut</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground hidden xs:block truncate max-w-[150px]">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full h-9 w-9">
              <LogOut className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-headline font-bold text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground mt-1">Manage your e-commerce stores.</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full sm:w-auto rounded-xl shadow-lg shadow-primary/20 h-12">
                <Plus className="mr-2 w-5 h-5" /> Create Store
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl p-6 sm:p-8 max-w-[95vw] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline font-bold">New Store Concept</DialogTitle>
                <DialogDescription className="font-body">
                  Enter your store details. This will be the home of your brand.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Store Name</Label>
                  <Input
                    id="name"
                    placeholder="My Awesome Brand"
                    value={newStore.name}
                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <div className="flex items-center">
                    <Input
                      id="subdomain"
                      placeholder="mybrand"
                      value={newStore.subdomain}
                      onChange={(e) => setNewStore({ ...newStore, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                      className="rounded-l-xl rounded-r-none h-12"
                    />
                    <div className="h-12 bg-muted flex items-center px-3 sm:px-4 rounded-r-xl border border-l-0 border-input text-[10px] sm:text-sm font-medium text-muted-foreground shrink-0">
                      .ihut.shop
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full h-12 rounded-xl text-lg" onClick={handleCreateStore} disabled={creating}>
                  {creating ? <Loader2 className="animate-spin mr-2" /> : "Launch Store"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {stores.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-border/60 p-6">
            <Store className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-headline font-bold mb-2">No stores yet</h3>
            <p className="text-muted-foreground mb-6">Create your first store to start selling.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <Card key={store.id} className="hover:shadow-xl transition-all duration-300 border-border/50 rounded-3xl overflow-hidden group">
                <CardHeader className="bg-muted/30 pb-4 p-6">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <Store className="text-primary w-6 h-6" />
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary hover:text-white transition-colors h-9 w-9" asChild>
                      <a href={getStoreUrl(store.subdomain)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                  <CardTitle className="mt-4 text-2xl font-headline font-bold truncate">{store.name}</CardTitle>
                  <CardDescription className="text-sm font-medium text-primary truncate">
                    {getStoreUrl(store.subdomain).replace("https://", "").replace("http://", "")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Button className="w-full rounded-xl h-12 font-bold" onClick={() => router.push(`/${store.subdomain}/products`)}>
                    Manage Catalog
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
