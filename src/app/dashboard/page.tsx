"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore, useUser } from "@/firebase/provider";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, getDoc, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShoppingCart, Plus, Store, ExternalLink, LogOut, Loader2,
  User, Settings, LayoutDashboard, ShieldCheck, Phone,
  Globe, Sparkles, ChevronRight, CheckCircle2, Shield,
  MoreVertical, Trash2, Lock, AlertTriangle, Hammer, Power, X, CreditCard, AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn, getStoreUrl } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from "@/components/ui/badge";
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

  // Custom Modal States
  const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [selectedStoreForVault, setSelectedStoreForVault] = useState<any>(null);
  const [vaultPIN, setVaultPIN] = useState("");
  const [currentVaultPIN, setCurrentVaultPIN] = useState("");
  const [savingVault, setSavingVault] = useState(false);

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
      const storeList = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        // Fetch subscription for each store with mandatory ownerId filter
        const subQ = query(
          collection(firestore, "stores", docSnapshot.id, "subscription"),
          where("ownerId", "==", uid),
          limit(1)
        );
        const subSnap = await getDocs(subQ);
        let subData = null;
        let planData = null;

        if (!subSnap.empty) {
          subData = subSnap.docs[0].data();
          const planRef = doc(firestore, "subscriptionPlans", subData.planId);
          const planSnap = await getDoc(planRef);
          if (planSnap.exists()) {
            planData = planSnap.data();
          }
        }

        return { id: docSnapshot.id, ...data, subscription: subData, plan: planData };
      }));
      setStores(storeList);
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
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
      status: "online",
      isMaintenance: false,
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

      const docRef = await addDoc(collection(firestore, "stores"), storeData);

      // Default to Free Plan for secondary stores
      const freePlanQ = query(collection(firestore, "subscriptionPlans"), where("price", "==", 0), where("isActive", "==", true));
      const freePlanSnap = await getDocs(freePlanQ);
      if (!freePlanSnap.empty) {
        await addDoc(collection(firestore, "stores", docRef.id, "subscription"), {
          planId: freePlanSnap.docs[0].id,
          ownerId: user.uid,
          storeId: docRef.id,
          status: "active",
          startDate: serverTimestamp(),
          currentPeriodStart: serverTimestamp(),
          currentPeriodEnd: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      }

      toast({ title: "Store Launched!", description: "Your new brand is now live." });
      setNewStore({ name: "", subdomain: "" });
      setIsCreateStoreOpen(false);
      fetchStores(user.uid);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error creating store" });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteStore = async (sId: string, sName: string) => {
    if (!user || !firestore) return;
    if (!confirm(`Are you absolutely sure you want to delete "${sName}"? This action is permanent and will destroy all data including orders and products.`)) return;

    try {
      await updateDoc(doc(firestore, "stores", sId), { status: "deleted", deletedAt: serverTimestamp() });
      toast({ title: "Store Deleted", description: `"${sName}" has been successfully removed.` });
      fetchStores(user.uid);
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed" });
    }
  };

  const handleToggleMaintenance = async (sId: string, current: boolean) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, "stores", sId), { isMaintenance: !current });
      toast({ title: !current ? "Maintenance Enabled" : "Maintenance Disabled" });
      fetchStores(user?.uid || "");
    } catch (error) {
      toast({ variant: "destructive", title: "Toggle Failed" });
    }
  };

  const handleToggleStatus = async (sId: string, status: string) => {
    if (!firestore) return;
    const newStatus = status === "online" ? "offline" : "online";
    try {
      await updateDoc(doc(firestore, "stores", sId), { status: newStatus });
      toast({ title: `Store ${newStatus === 'online' ? 'Activated' : 'Deactivated'}` });
      fetchStores(user?.uid || "");
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleSaveVaultPIN = async () => {
    if (!selectedStoreForVault || !vaultPIN || !firestore) return;

    // Verify old password if it exists
    if (selectedStoreForVault.managePassword && currentVaultPIN !== selectedStoreForVault.managePassword) {
      toast({ variant: "destructive", title: "Verification Failed", description: "The current Vault PIN you entered is incorrect." });
      return;
    }

    setSavingVault(true);
    try {
      await updateDoc(doc(firestore, "stores", selectedStoreForVault.id), {
        managePassword: vaultPIN
      });
      toast({ title: "Vault PIN Updated", description: "Your management password has been set." });
      setIsVaultModalOpen(false);
      setVaultPIN("");
      setCurrentVaultPIN("");
      fetchStores(user?.uid || "");
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setSavingVault(false);
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
              <span className="text-xl font-headline font-black text-slate-900 tracking-tighter">IHut.Shop</span>
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
                {profileData.role === 'admin' && (
                  <DropdownMenuItem className="gap-3 py-3 rounded-xl cursor-pointer text-indigo-600 focus:text-indigo-700 focus:bg-indigo-50" onClick={() => router.push("/saas-admin")}>
                    <ShieldCheck className="w-4 h-4" />
                    <span className="font-bold">SaaS Admin Panel</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="gap-3 py-3 rounded-xl cursor-pointer" onClick={() => setView("settings")}>
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Account Settings</span>
                </DropdownMenuItem>
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

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  {profileData.role === 'admin' && (
                    <Button size="lg" variant="outline" className="rounded-2xl border-2 border-indigo-600/20 text-indigo-600 hover:bg-indigo-50 h-14 px-8 text-lg font-bold shadow-xl shadow-indigo-600/5 group" onClick={() => router.push("/saas-admin")}>
                      <ShieldCheck className="mr-2 w-6 h-6" /> Admin Portal
                    </Button>
                  )}
                  <Button size="lg" className="rounded-2xl shadow-2xl shadow-primary/30 h-14 px-8 text-lg font-bold group" onClick={() => setIsCreateStoreOpen(true)}>
                    <Plus className="mr-2 w-6 h-6 group-hover:rotate-90 transition-transform duration-300" /> Create Store
                  </Button>
                </div>
              </div>
            </section>

            {/* Payment Warning Section */}
            {stores.some(s => s.subscription?.status === 'active' && s.subscription?.currentPeriodEnd && (
              (() => {
                const end = s.subscription.currentPeriodEnd.toDate ? s.subscription.currentPeriodEnd.toDate() : new Date(s.subscription.currentPeriodEnd);
                const diff = end.getTime() - new Date().getTime();
                const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                return days <= 10 && days > 0;
              })()
            )) && (
                <Card className="rounded-[32px] border-none bg-rose-50 shadow-sm overflow-hidden mb-6">
                  <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-rose-900">Subscription Expiring Soon</h4>
                        <p className="text-sm text-rose-700/80">One or more of your stores have subscriptions ending within 10 days. Please renew to avoid service interruption.</p>
                      </div>
                    </div>
                    <Button className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold h-11 px-6 shadow-lg shadow-rose-200" onClick={() => setView("stores")}>
                      Review Subscriptions
                    </Button>
                  </CardContent>
                </Card>
              )}

            {stores.some(s => s.plan?.price > 0 && s.subscription?.status === 'pending') && (
              <Card className="rounded-[32px] border-none bg-amber-50 shadow-sm overflow-hidden mb-6">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-900">Subscription Payment Pending</h4>
                      <p className="text-sm text-amber-700/80">You have active stores on premium tiers waiting for payment confirmation.</p>
                    </div>
                  </div>
                  <Button className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 px-6 shadow-lg shadow-amber-200">
                    Verify Status
                  </Button>
                </CardContent>
              </Card>
            )}

            {stores.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[48px] border-2 border-dashed border-slate-200">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 opacity-20">
                  <Store className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-headline font-black text-slate-900 mb-2">No Active Stores</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">Launch your first brand to start selling products across the globe.</p>
                <Button variant="outline" className="rounded-2xl h-12 px-8 border-2 font-black" onClick={() => setIsCreateStoreOpen(true)}>
                  Get Started
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {stores.map((store) => (
                  <Card key={store.id} className="group hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 border-none rounded-[40px] overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100 relative">
                      <div className="flex justify-between items-start">
                        <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                          <Store className="text-primary w-8 h-8" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 hover:bg-primary hover:text-white transition-colors shadow-sm bg-white" asChild>
                            <a href={getStoreUrl(store.subdomain)} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-5 h-5" />
                            </a>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 hover:bg-slate-100 transition-colors shadow-sm bg-white">
                                <MoreVertical className="w-5 h-5 text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-2xl border-border/50">
                              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Quick Actions</DropdownMenuLabel>
                              <DropdownMenuItem className="gap-2 rounded-xl py-2.5 cursor-pointer" onClick={() => router.push(`/${store.subdomain}/settings`)}>
                                <Settings className="w-4 h-4" />
                                <span className="font-medium">Store Settings</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 rounded-xl py-2.5 cursor-pointer" onClick={() => handleToggleMaintenance(store.id, store.isMaintenance)}>
                                <Hammer className={`w-4 h-4 ${store.isMaintenance ? 'text-primary' : ''}`} />
                                <span className="font-medium">Maintenance Mode: {store.isMaintenance ? 'ON' : 'OFF'}</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {!store.managePassword ? (
                                <DropdownMenuItem className="gap-2 rounded-xl py-2.5 cursor-pointer" onClick={() => {
                                  setSelectedStoreForVault(store);
                                  setVaultPIN("");
                                  setCurrentVaultPIN("");
                                  setIsVaultModalOpen(true);
                                }}>
                                  <Shield className="w-4 h-4" />
                                  <span className="font-medium">Vault Setup (PIN)</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="gap-2 rounded-xl py-2.5 cursor-pointer" onClick={() => {
                                  setSelectedStoreForVault(store);
                                  setVaultPIN("");
                                  setCurrentVaultPIN("");
                                  setIsVaultModalOpen(true);
                                }}>
                                  <Lock className="w-4 h-4" />
                                  <span className="font-medium">Change Vault PIN</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 rounded-xl py-2.5 cursor-pointer text-rose-500 focus:text-rose-600 focus:bg-rose-50" onClick={() => handleDeleteStore(store.id, store.name)}>
                                <Trash2 className="w-4 h-4" />
                                <span className="font-bold">Delete Store</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="mt-8">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-2xl font-headline font-black text-slate-900 truncate leading-none">{store.name}</h3>
                          {store.plan?.price > 0 ? (
                            <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase">PRO</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[8px] font-black uppercase">FREE</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-primary flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5" />
                            {getStoreUrl(store.subdomain).replace("https://", "").replace("http://", "")}
                          </p>
                          {store.isMaintenance && (
                            <Badge className="bg-amber-100 text-amber-700 border-none text-[8px] font-black uppercase flex items-center gap-1">
                              <Hammer className="w-2.5 h-2.5" /> Maintenance
                            </Badge>
                          )}
                          {store.status === 'offline' && (
                            <Badge className="bg-slate-100 text-slate-500 border-none text-[8px] font-black uppercase">Offline</Badge>
                          )}
                          {store.isSuspended && (
                            <Badge className="bg-rose-600 text-white border-none text-[8px] font-black uppercase flex items-center gap-1 shadow-lg shadow-rose-500/20">
                              <AlertTriangle className="w-2.5 h-2.5" /> Suspended
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Status</p>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${store.isSuspended ? 'bg-rose-500' : store.subscription?.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span className="text-xs font-bold capitalize">{store.isSuspended ? 'Suspended' : store.subscription?.status || 'active'}</span>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Tier</p>
                          <p className="text-xs font-bold truncate">{store.plan?.name || 'Free Plan'}</p>
                        </div>
                      </div>
                      <Button
                        className={cn(
                          "w-full rounded-[24px] h-14 font-black text-lg transition-all shadow-xl group",
                          store.isSuspended ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" : "bg-slate-900 hover:bg-primary shadow-slate-900/10 text-white"
                        )}
                        onClick={() => !store.isSuspended && router.push(`/${store.subdomain}/dashboard`)}
                        disabled={store.isSuspended}
                      >
                        {store.isSuspended ? "Access Restricted" : "Enter Manager"}
                        {!store.isSuspended && <ChevronRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
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
            <Card className="rounded-[48px] border-none shadow-xl bg-white overflow-hidden">
              <CardHeader className="bg-slate-900 text-white p-10">
                <CardTitle className="text-3xl font-headline font-black tracking-tight">Admin Profile</CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Full Legal Name</Label>
                    <Input
                      placeholder="Admin Full Name"
                      className="h-14 rounded-2xl bg-slate-50 border-none px-6 text-lg"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Contact Email</Label>
                    <Input
                      disabled
                      value={user?.email || ""}
                      className="h-14 rounded-2xl bg-slate-100 border-none px-6 text-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Phone</Label>
                  <Input
                    placeholder="+880 1234 567 890"
                    className="h-14 rounded-2xl bg-slate-50 border-none px-6 text-lg"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
                <Button className="h-16 rounded-[24px] px-12 text-xl font-black shadow-2xl shadow-primary/20" onClick={handleUpdateProfile} disabled={updating}>
                  {updating ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" />}
                  Update Global Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {view === "settings" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
            <Card className="rounded-[48px] border-none shadow-xl bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 p-10 border-b">
                <CardTitle className="text-3xl font-headline font-black tracking-tight text-slate-900">Account Preferences</CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-12">
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <h4 className="text-xl font-bold">Billing Management</h4>
                    <p className="text-slate-500 text-sm">View invoices and manage your active tiers.</p>
                  </div>
                  <Button variant="outline" className="rounded-2xl border-2 font-black">Open Billing</Button>
                </div>
                <div className="flex items-center justify-between gap-6 pt-10 border-t">
                  <div>
                    <h4 className="text-xl font-bold">Security Vault</h4>
                    <p className="text-slate-500 text-sm">Update your account login credentials and security PIN.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-2xl border-2 font-black">Change Password</Button>
                    <Button className="rounded-2xl font-black shadow-lg shadow-primary/20">Setup 2FA</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-6 pt-10 border-t">
                  <div>
                    <h4 className="text-xl font-bold text-rose-500">Danger Zone</h4>
                    <p className="text-slate-500 text-sm">Permanently delete your account and all associated stores.</p>
                  </div>
                  <Button variant="ghost" className="text-rose-500 font-bold">Purge Account</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* --- CREATE STORE MODAL --- */}
      {isCreateStoreOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsCreateStoreOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl border-none p-8 sm:p-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6">
              <Store className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-headline font-black tracking-tight text-slate-900">New Brand Identity</h2>
            <p className="text-slate-500 text-lg mt-2 leading-relaxed">Launch a new store instantly. Secondary stores are placed on the base tier by default.</p>

            <div className="space-y-6 py-8">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Brand Name</Label>
                <Input
                  placeholder="e.g. Modern Craft"
                  value={newStore.name}
                  onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                  className="rounded-2xl h-14 bg-slate-50 border-none text-lg px-6"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Subdomain</Label>
                <div className="flex items-center">
                  <Input
                    placeholder="modern"
                    value={newStore.subdomain}
                    onChange={(e) => setNewStore({ ...newStore, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    className="rounded-l-2xl rounded-r-none h-14 bg-slate-50 border-none text-lg px-6 flex-1"
                  />
                  <div className="h-14 bg-slate-200/50 flex items-center px-6 rounded-r-2xl text-sm font-black text-slate-400">
                    .ihut.shop
                  </div>
                </div>
              </div>
            </div>

            <Button className="w-full h-16 rounded-[24px] text-xl font-black shadow-xl shadow-primary/20" onClick={handleCreateStore} disabled={creating}>
              {creating ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
              Launch Brand
            </Button>
          </div>
        </div>
      )}
      {/* --- VAULT PIN MODAL --- */}
      {isVaultModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsVaultModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl border-none p-8 sm:p-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-headline font-black tracking-tight text-slate-900">
              {selectedStoreForVault?.managePassword ? "Update Vault PIN" : "Setup Manager Vault"}
            </h2>
            <p className="text-slate-500 text-lg mt-2 leading-relaxed">
              {selectedStoreForVault?.managePassword ? "Change your existing security PIN for this store." : "Set a secure PIN to protect your store's administrative settings."}
            </p>

            <div className="space-y-6 py-8">
              {selectedStoreForVault?.managePassword && (
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Current Security PIN</Label>
                  <Input
                    type="password"
                    placeholder="Enter Current PIN"
                    value={currentVaultPIN}
                    onChange={(e) => setCurrentVaultPIN(e.target.value)}
                    className="rounded-2xl h-14 bg-slate-50 border-none text-center text-2xl font-bold tracking-[0.5em] px-6 focus:ring-0"
                    autoFocus
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {selectedStoreForVault?.managePassword ? "New Security PIN" : "Security PIN"}
                </Label>
                <Input
                  type="password"
                  placeholder="4-8 digit PIN"
                  value={vaultPIN}
                  onChange={(e) => setVaultPIN(e.target.value)}
                  className="rounded-2xl h-14 bg-slate-50 border-none text-center text-2xl font-bold tracking-[0.5em] px-6 focus:ring-0"
                  autoFocus={!selectedStoreForVault?.managePassword}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setIsVaultModalOpen(false)}>Cancel</Button>
              <Button
                className="flex-[2] h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20"
                onClick={handleSaveVaultPIN}
                disabled={savingVault || !vaultPIN || (selectedStoreForVault?.managePassword && !currentVaultPIN)}
              >
                {savingVault ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" />}
                {selectedStoreForVault?.managePassword ? "Update Vault PIN" : "Save Vault PIN"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}