
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ShoppingCart, Plus, Store, ExternalLink, LogOut, Loader2, 
  User, Settings, LayoutDashboard, ShieldCheck, Mail, Phone, 
  Globe, Sparkles, ChevronRight, CheckCircle2, Shield
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getStoreUrl } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from "next/link";

export default function RedesignedDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newStore, setNewStore] = useState({ name: "", subdomain: "" });
  const [profileData, setProfileData] = useState({ fullName: "", phone: "", role: "user" });
  const [view, setView] = useState<"stores" | "profile" | "settings">("stores");
  
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && firestore) {
      fetchStores(user.uid);
      fetchProfile(user.uid);
    }
  }, [user, firestore]);

  const fetchStores = async (uid: string) => {
    if (!firestore) return;
    try {
      const q = query(collection(firestore, "stores"), where("ownerId", "==", uid));
      const querySnapshot = await getDocs(q);
      setStores(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (uid: string) => {
    if (!firestore) return;
    try {
      const userRef = doc(firestore, "users", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setProfileData({
          fullName: data.fullName || "",
          phone: data.phone || "",
          role: data.role || "user"
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !firestore) return;
    setUpdating(true);
    
    const userRef = doc(firestore, "users", user.uid);
    const updateData = {
      fullName: profileData.fullName,
      phone: profileData.phone,
      updatedAt: serverTimestamp()
    };

    updateDoc(userRef, updateData)
      .then(() => {
        toast({ title: "Profile Updated", description: "Your changes have been saved successfully." });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setUpdating(false));
  };

  const handleCreateStore = async () => {
    if (!newStore.name || !newStore.subdomain || !firestore || !user) {
      toast({ variant: "destructive", title: "Missing fields" });
      return;
    }
    setCreating(true);
    
    const storeData = {
      name: newStore.name,
      subdomain: newStore.subdomain.toLowerCase(),
      ownerId: user.uid,
      createdAt: serverTimestamp(),
    };

    try {
      const q = query(collection(firestore, "stores"), where("subdomain", "==", newStore.subdomain.toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast({ variant: "destructive", title: "Subdomain already taken" });
        setCreating(false);
        return;
      }

      addDoc(collection(firestore, "stores"), storeData)
        .then(() => {
          toast({ title: "Store Launched!", description: "Your new brand is now live." });
          setNewStore({ name: "", subdomain: "" });
          fetchStores(user.uid);
        })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: 'stores',
            operation: 'create',
            requestResourceData: storeData,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setCreating(false));

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error creating store" });
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      router.push("/auth");
    }
  };

  if (isUserLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Initializing Portal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView("stores")}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-xl shadow-primary/20">
              <ShoppingCart className="text-white w-6 h-6" />
            </div>
            <div className="hidden xs:block">
              <span className="text-xl font-headline font-black text-slate-900 tracking-tighter">NexusCart</span>
              <span className="text-[10px] block font-bold text-primary uppercase tracking-widest leading-none">Console</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-bold text-slate-900">{profileData.fullName || user?.email}</span>
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                {profileData.role === 'admin' ? 'Super Admin' : 'Store Owner'}
              </span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-11 w-11 rounded-xl border-2 border-primary/10 p-0 hover:bg-primary/5 transition-all">
                  <Avatar className="h-full w-full rounded-xl">
                    <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full bg-primary/5 text-primary font-black uppercase">
                      {user?.email?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 rounded-2xl p-2 mt-2 shadow-2xl border-border/50" align="end">
                <DropdownMenuLabel className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold leading-none">{profileData.fullName || "Admin Account"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-3 py-3 rounded-xl cursor-pointer" onClick={() => setView("stores")}>
                  <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">My Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 py-3 rounded-xl cursor-pointer" onClick={() => setView("profile")}>
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Edit Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 py-3 rounded-xl cursor-pointer" onClick={() => setView("settings")}>
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Account Settings</span>
                </DropdownMenuItem>
                {profileData.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-3 py-3 rounded-xl cursor-pointer text-indigo-600 focus:text-indigo-700" asChild>
                      <Link href="/saas-admin">
                        <Shield className="w-4 h-4" />
                        <span className="font-bold">Admin Console</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-3 py-3 rounded-xl cursor-pointer text-rose-500 focus:text-rose-600" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                  <span className="font-bold">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-10 pb-32">
        {view === "stores" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
            <section>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                    <Sparkles className="w-3 h-3" /> System Ready
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-headline font-black text-slate-900 tracking-tight">Welcome Back</h1>
                  <p className="text-muted-foreground text-lg">Manage your digital commerce empire from a single dashboard.</p>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full sm:w-auto rounded-2xl shadow-2xl shadow-primary/30 h-14 px-8 text-lg font-bold group">
                      <Plus className="mr-2 w-6 h-6 group-hover:rotate-90 transition-transform duration-300" /> Create Store
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-[40px] p-8 border-none shadow-2xl max-w-[95vw] sm:max-w-lg">
                    <DialogHeader>
                      <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6">
                        <Store className="w-8 h-8" />
                      </div>
                      <DialogTitle className="text-3xl font-headline font-black tracking-tight">New Store Concept</DialogTitle>
                      <DialogDescription className="text-slate-500 text-lg">
                        Define the home of your brand. Pick a name and a custom subdomain.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Brand Name</Label>
                        <Input
                          placeholder="e.g. Urban Style"
                          value={newStore.name}
                          onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                          className="rounded-2xl h-14 bg-slate-50 border-none text-lg px-6"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Subdomain Access</Label>
                        <div className="flex items-center">
                          <Input
                            placeholder="urban"
                            value={newStore.subdomain}
                            onChange={(e) => setNewStore({ ...newStore, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                            className="rounded-l-2xl rounded-r-none h-14 bg-slate-50 border-none text-lg px-6 flex-1"
                          />
                          <div className="h-14 bg-slate-200/50 flex items-center px-6 rounded-r-2xl border-l border-white text-sm font-black text-slate-400">
                            .ihut.shop
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button className="w-full h-16 rounded-[24px] text-xl font-black shadow-xl shadow-primary/20" onClick={handleCreateStore} disabled={creating}>
                        {creating ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
                        Launch Brand
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </section>

            {stores.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[48px] border-2 border-dashed border-slate-200">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 opacity-20">
                  <Store className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-headline font-black text-slate-900 mb-2">No Active Stores</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">You haven&apos;t created any stores yet. Launch your first brand to start selling products across the globe.</p>
                <Button variant="outline" className="rounded-2xl h-12 px-8 border-2 font-black">
                  Learn How to Sell
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {stores.map((store) => (
                  <Card key={store.id} className="group hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 border-none rounded-[40px] overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
                      <div className="flex justify-between items-start">
                        <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                          <Store className="text-primary w-8 h-8" />
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 hover:bg-primary hover:text-white transition-colors shadow-sm bg-white" asChild>
                          <a href={getStoreUrl(store.subdomain)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        </Button>
                      </div>
                      <div className="mt-8">
                        <h3 className="text-2xl font-headline font-black text-slate-900 truncate leading-none mb-2">{store.name}</h3>
                        <p className="text-sm font-bold text-primary flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5" />
                          {getStoreUrl(store.subdomain).replace("https://", "").replace("http://", "")}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                       <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Status</p>
                             <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold">Online</span>
                             </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Created</p>
                             <p className="text-xs font-bold">2024</p>
                          </div>
                       </div>
                       <Button className="w-full rounded-[24px] h-14 font-black text-lg bg-slate-900 hover:bg-primary transition-all shadow-xl shadow-slate-900/10 group" onClick={() => router.push(`/${store.subdomain}/overview`)}>
                        Enter Manager <ChevronRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "profile" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="rounded-[48px] border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
                  <CardHeader className="bg-slate-900 text-white p-10">
                    <CardTitle className="text-3xl font-headline font-black tracking-tight">Admin Profile</CardTitle>
                    <CardDescription className="text-slate-400 text-lg">Update your identity across all stores.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Full Legal Name</Label>
                        <input 
                          placeholder="Admin Full Name" 
                          className="h-14 rounded-2xl bg-slate-50 border-none px-6 text-lg w-full focus:outline-none focus:ring-2 focus:ring-primary/20" 
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Contact Email</Label>
                        <Input 
                          disabled 
                          value={user?.email || ""} 
                          className="h-14 rounded-2xl bg-slate-100 border-none px-6 text-lg text-slate-400" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Phone Identification</Label>
                      <div className="relative">
                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input 
                          placeholder="+880 1234 567 890" 
                          className="h-14 rounded-2xl bg-slate-50 border-none pl-16 pr-6 text-lg w-full focus:outline-none focus:ring-2 focus:ring-primary/20" 
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100">
                      <Button className="w-full sm:w-auto h-16 rounded-[24px] px-12 text-xl font-black shadow-2xl shadow-primary/20" onClick={handleUpdateProfile} disabled={updating}>
                        {updating ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" />}
                        Save Profile Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1 space-y-8">
                <Card className="rounded-[40px] border-none shadow-lg bg-primary text-white p-8">
                   <div className="flex flex-col items-center text-center space-y-6">
                      <Avatar className="w-24 h-24 border-4 border-white/20 shadow-2xl">
                         <AvatarFallback className="bg-white/10 text-white text-4xl font-black uppercase">{user?.email?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-2xl font-black tracking-tight">{profileData.fullName || "Admin Account"}</h4>
                        <p className="text-white/60 font-bold uppercase tracking-widest text-[10px]">Verified Global Owner</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 w-full">
                         <div className="bg-white/10 rounded-[24px] p-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Stores</p>
                            <p className="text-2xl font-black">{stores.length}</p>
                         </div>
                         <div className="bg-white/10 rounded-[24px] p-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Since</p>
                            <p className="text-2xl font-black">2024</p>
                         </div>
                      </div>
                   </div>
                </Card>

                <div className="bg-slate-200/50 rounded-[32px] p-8 border border-white">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                         <ShieldCheck className="text-primary w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-900">Account Security</h4>
                   </div>
                   <p className="text-sm text-slate-500 leading-relaxed">Your account is protected by industry-standard encryption and Firebase Authentication. Always use a unique password.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "settings" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[48px] border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden max-w-4xl">
              <CardHeader className="bg-slate-50 p-10 border-b">
                 <div className="flex items-center gap-4 text-primary font-black uppercase tracking-widest text-[10px] mb-4">
                    <Settings className="w-4 h-4" /> Global Preferences
                 </div>
                 <CardTitle className="text-3xl font-headline font-black tracking-tight text-slate-900">Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-12">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                       <h4 className="text-xl font-bold">Email Notifications</h4>
                       <p className="text-slate-500 text-sm">Receive weekly performance reports for your stores.</p>
                    </div>
                    <Button variant="outline" className="rounded-2xl border-2 font-black">Configure Emails</Button>
                 </div>

                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-12 border-t border-slate-100">
                    <div className="space-y-1">
                       <h4 className="text-xl font-bold">Billing & Subscription</h4>
                       <p className="text-slate-500 text-sm">Manage your iHut pro plan and billing details.</p>
                    </div>
                    <Button className="rounded-2xl font-black h-12 px-8 bg-slate-900">Upgrade to Pro</Button>
                 </div>

                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-12 border-t border-slate-100">
                    <div className="space-y-1">
                       <h4 className="text-xl font-bold text-rose-500">Danger Zone</h4>
                       <p className="text-slate-500 text-sm">Permanently delete your account and all associated stores.</p>
                    </div>
                    <Button variant="ghost" className="rounded-2xl font-black text-rose-500 hover:bg-rose-50 hover:text-rose-600">Delete Account</Button>
                 </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 w-full bg-white/60 backdrop-blur-md border-t p-6 flex justify-center z-40 md:hidden">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">&copy; 2024 NEXUSCART SAAS ENGINE</p>
      </footer>
    </div>
  );
}

