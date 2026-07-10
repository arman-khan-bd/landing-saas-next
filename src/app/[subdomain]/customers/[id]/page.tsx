"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
<<<<<<< HEAD
import { useSupabaseClient } from "@/supabase";
=======
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
    ChevronLeft, Mail, Phone, MapPin, Calendar, 
    ShoppingBag, CreditCard, ShieldAlert, Loader2, 
    Globe, Fingerprint, History, DollarSign,
<<<<<<< HEAD
    Zap, ShieldCheck, TrendingUp,
    ExternalLink, ArrowRight, ShieldX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";

interface AggregatedCustomer {
    name: string;
    email: string;
    phone: string;
    address: string;
    joined: string;
    status: string;
    totalSpent: number;
    ips: string[];
    interactions: {
        id: string;
        date: string;
        type: string;
        total: number;
        status: string;
        rawDate: any;
    }[];
=======
    Zap, AlertTriangle, ShieldCheck, TrendingUp,
    ExternalLink, ArrowRight, User, Ban, Lock, ShieldX, Filter,
    Save, Edit3, Trash2, Shield, Wallet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getCurrencySymbol } from "@/lib/utils";

interface Customer {
  id: string;
  fullName?: string;
  names: string[];
  phones: string[];
  emails: string[];
  ips: string[];
  addresses: string[];
  status: {
    phoneBlocked: boolean;
    emailBlocked: boolean;
    ipBlocked: boolean;
  };
  lastActive: any;
  createdAt: any;
  notes: string;
  storeId: string;
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
}

export default function CustomerDetailsPage() {
  const { subdomain, id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
<<<<<<< HEAD
  const supabase = useSupabaseClient();
  const [customer, setCustomer] = useState<AggregatedCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(false);

  const fetchAggregatedProfile = async () => {
    setLoading(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let initialData: any = null;
        
        const [orderRes, draftRes] = await Promise.all([
            supabase.from("orders").select("*").eq("id", id).maybeSingle(),
            supabase.from("uncompleted_orders").select("*").eq("id", id).maybeSingle()
        ]);

        if (orderRes.data) initialData = orderRes.data;
        else if (draftRes.data) initialData = draftRes.data;

        if (!initialData) {
            setLoading(false);
            return;
        }

        const email = initialData.customer?.email;
        const phone = initialData.customer?.phone;

        const { data: storeData } = await supabase
          .from("stores")
          .select("id")
          .eq("subdomain", subdomain)
          .single();
        if (!storeData) return;
        const sId = storeData.id;

        const findRelated = async (tableName: string) => {
            const matches: any[] = [];
            if (email) {
                const { data: emailData } = await supabase
                    .from(tableName)
                    .select("*")
                    .eq("store_id", sId)
                    .eq("owner_id", user.id);
                
                const filtered = (emailData || []).filter(item => item.customer?.email?.toLowerCase() === email.toLowerCase());
                matches.push(...filtered.map(d => ({ ...d, colType: tableName })));
            }
            if (phone) {
                const { data: phoneData } = await supabase
                    .from(tableName)
                    .select("*")
                    .eq("store_id", sId)
                    .eq("owner_id", user.id);
                
                const filtered = (phoneData || []).filter(item => item.customer?.phone === phone);
                filtered.forEach(r => {
                    if (!matches.find(m => m.id === r.id)) {
                        matches.push({ ...r, colType: tableName });
                    }
                });
            }
            return matches;
        };

        const [relatedOrders, relatedDrafts] = await Promise.all([
            findRelated("orders"),
            findRelated("uncompleted_orders")
        ]);

        const allDocs = [...relatedOrders, ...relatedDrafts].sort((a, b) => {
            const dateA = new Date(a.created_at || a.updated_at || 0).getTime();
            const dateB = new Date(b.created_at || b.updated_at || 0).getTime();
            return dateB - dateA;
        });

        // 3. Aggregate
        const ips = new Set<string>();
        let spent = 0;
        const interactions = allDocs.map(d => {
            if (d.customer?.ip) ips.add(d.customer.ip);
            if (d.colType === 'orders') spent += Number(d.total || 0);

            return {
                id: d.id,
                date: d.created_at ? new Date(d.created_at).toLocaleDateString() : "Recent",
                type: d.colType === 'orders' ? "Order" : "Draft",
                total: Number(d.total || 0),
                status: d.status || "abandoned",
                rawDate: d.created_at || d.updated_at
            };
        });

        setCustomer({
            name: allDocs[0]?.customer?.fullName || "Guest Customer",
            email: email || "N/A",
            phone: phone || "N/A",
            address: allDocs[0]?.customer?.address || "N/A",
            joined: allDocs[allDocs.length - 1]?.created_at ? new Date(allDocs[allDocs.length - 1].created_at).toLocaleDateString() : "Unknown",
            status: spent > 500 ? "VIP" : spent > 0 ? "Active" : "Lead",
            totalSpent: spent,
            ips: Array.from(ips),
            interactions
        });

    } catch (e) {
        console.error(e);
        toast({ variant: "destructive", title: "Error", description: "Failed to load consolidated profile." });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchAggregatedProfile();
  }, [id, subdomain]);

  const blockIdentifier = async (type: 'phone' | 'email' | 'ip' | 'address', value: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!value || value === "N/A" || !user) {
        toast({ title: "Invalid Action", description: `Cannot block unavailable ${type}.` });
        return;
    }
    
    const isConfirmed = await confirm({
      title: `Block ${type.toUpperCase()}`,
      message: `Restrict access for ${value}? This identifier will be added to your fraud shield list.`,
      confirmText: `Confirm Block`,
      variant: "danger"
    });

    if (!isConfirmed) return;

    setBlocking(true);
    try {
        const { data: storeData } = await supabase
          .from("stores")
          .select("id")
          .eq("subdomain", subdomain)
          .single();
        if (!storeData) return;
        const sId = storeData.id;

        await supabase.from("fraud_blocks").insert({
            owner_id: user.id,
            store_id: sId,
            type,
            value,
            reason: `Individual ${type} block from profile`,
            customerName: customer?.name || 'Unknown',
            metadata: { source: 'profile_view_individual' }
        });

        toast({ title: "Action Complete", description: `${value} is now restricted.` });
    } catch (e) {
        toast({ variant: "destructive", title: "Action Failed" });
    } finally {
        setBlocking(false);
    }
  };

  const handleBlockAction = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!customer || !user) return;
    
    const isConfirmed = await confirm({
      title: "Confirm Security Block",
      message: `Are you sure you want to restrict this identity? This will flag ${customer.email} and ${customer.phone} as fraud.`,
      confirmText: "Restrict Access",
      variant: "danger"
=======
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [currency, setCurrency] = useState("BDT");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  useEffect(() => {
    fetchCustomerData();
  }, [id, subdomain]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "customers", id as string);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Customer;
        setCustomer(data);
        setNotes(data.notes || "");
        
        // Fetch related orders
        const ordersQ = query(
            collection(db, "orders"),
            where("storeId", "==", data.storeId),
            where("customer.phone", "in", data.phones)
        );
        const ordersSnap = await getDocs(ordersQ);
        setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Fetch Store Currency
        if (data.storeId) {
          const storeSnap = await getDoc(doc(db, "stores", data.storeId));
          if (storeSnap.exists()) {
            setCurrency(storeSnap.data().currency || "BDT");
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "Failed to load customer profile." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (type: 'phoneBlocked' | 'emailBlocked' | 'ipBlocked', value: boolean) => {
    if (!customer) return;
    
    const isConfirmed = await confirm({
      title: `${value ? 'Restrict' : 'Allow'} Access`,
      message: `Are you sure you want to ${value ? 'block' : 'unblock'} this identifier?`,
      confirmText: `Confirm`,
      variant: value ? "danger" : "default"
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
    });

    if (!isConfirmed) return;

<<<<<<< HEAD
    setBlocking(true);
    try {
        const { data: storeData } = await supabase
          .from("stores")
          .select("id")
          .eq("subdomain", subdomain)
          .single();
        if (!storeData) return;
        const sId = storeData.id;

        const baseBlockData = {
            owner_id: user.id,
            store_id: sId,
            reason: `Manual identity block from Consolidated Profile`,
            customerName: customer.name,
            metadata: { source: 'profile_view' }
        };

        const blocks = [];
        if (customer.email !== "N/A") blocks.push({ type: 'email', value: customer.email });
        if (customer.phone !== "N/A") blocks.push({ type: 'phone', value: customer.phone });
        
        await Promise.all(blocks.map(b => supabase.from("fraud_blocks").insert({ ...baseBlockData, ...b })));

        toast({ title: "Identity Restricted", description: "All associated identifiers have been flagged." });
    } catch (e) {
        toast({ variant: "destructive", title: "Action Failed" });
    } finally {
        setBlocking(false);
=======
    try {
      const docRef = doc(db, "customers", customer.id);
      await updateDoc(docRef, {
        [`status.${type}`]: value,
        updatedAt: serverTimestamp()
      });
      setCustomer(prev => prev ? { ...prev, status: { ...prev.status, [type]: value } } : null);
      toast({ title: "Status Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleSaveNotes = async () => {
    if (!customer) return;
    setSaving(true);
    try {
      const docRef = doc(db, "customers", customer.id);
      await updateDoc(docRef, {
        notes,
        updatedAt: serverTimestamp()
      });
      setCustomer(prev => prev ? { ...prev, notes } : null);
      setIsEditingNotes(false);
      toast({ title: "Notes Saved" });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setSaving(false);
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>;
  if (!customer) return <div className="p-20 text-center">Customer profile not found.</div>;

<<<<<<< HEAD
  return (
    <div className="space-y-4 max-w-[1400px] mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-xl border border-border/50 h-10 w-10 bg-white shadow-sm hover:bg-slate-50 transition-all" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-headline font-black tracking-tight text-slate-900 uppercase">{customer.name}</h1>
          <p className="text-[10px] text-muted-foreground font-mono uppercase opacity-60">Consolidated Identity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-3 space-y-4">
          <Card className="rounded-[24px] border-border/50 shadow-lg shadow-slate-200/40 overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b border-border/50 p-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">Security Profile</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black shadow-lg mb-3">
                  {customer.name[0]}
                </div>
                <h3 className="text-lg font-black text-slate-900">{customer.name}</h3>
                <Badge className={`mt-2 border-none px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                    customer.status === 'VIP' ? 'bg-amber-100 text-amber-700' : 
                    customer.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>{customer.status}</Badge>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3 text-slate-600 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <Mail className="w-3.5 h-3.5 opacity-40" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate break-all">{customer.email}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <Phone className="w-3.5 h-3.5 opacity-40" />
                    </div>
                    <span className="text-xs font-bold">{customer.phone}</span>
                </div>
                <div className="flex items-start gap-3 text-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5 opacity-40" />
                  </div>
                  <span className="text-xs font-bold leading-tight">{customer.address}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5 opacity-40" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-tighter">Joined {customer.joined}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-3">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Vault History (IPs)</h4>
                  <div className="flex flex-wrap gap-1.5">
                      {customer.ips.map((ip, i) => (
                           <Badge key={i} variant="outline" className="rounded-lg font-mono text-[9px] bg-slate-50 border-slate-200 text-slate-500 py-1 px-2">
                               <Globe className="w-2 h-2 mr-1 opacity-40" /> {ip}
                           </Badge>
                      ))}
                  </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-2">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Identity Block Controls</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => blockIdentifier('email', customer.email)}
                        disabled={blocking || customer.email === 'N/A'}
                        className="h-8 rounded-lg text-[9px] font-bold border border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all justify-start px-3"
                    >
                        <Mail className="w-2.5 h-2.5 mr-2 opacity-50" /> Block Email
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => blockIdentifier('phone', customer.phone)}
                        disabled={blocking || customer.phone === 'N/A'}
                        className="h-8 rounded-lg text-[9px] font-bold border border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all justify-start px-3"
                    >
                        <Phone className="w-2.5 h-2.5 mr-2 opacity-50" /> Block Phone
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => customer.ips.forEach(ip => blockIdentifier('ip', ip))}
                        disabled={blocking || customer.ips.length === 0}
                        className="h-8 rounded-lg text-[9px] font-bold border border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all justify-start px-3"
                    >
                        <Globe className="w-2.5 h-2.5 mr-2 opacity-50" /> Block All IPs
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => blockIdentifier('address', customer.address)}
                        disabled={blocking || customer.address === 'N/A'}
                        className="h-8 rounded-lg text-[9px] font-bold border border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all justify-start px-3"
                    >
                        <MapPin className="w-2.5 h-2.5 mr-2 opacity-50" /> Block Address
                    </Button>
                  </div>
                  <Button 
                      variant="destructive" 
                      className="w-full mt-2 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/10 gap-2"
                      onClick={handleBlockAction}
                      disabled={blocking}
                  >
                    {blocking ? <Loader2 className="w-3 h-3 animate-spin" /> : <><ShieldX className="w-3 h-3" /> Block Identity</>}
                  </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-none bg-slate-900 text-white overflow-hidden shadow-xl">
             <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                      <Zap className="w-4 h-4" />
                   </div>
                   <h4 className="font-bold uppercase tracking-widest text-[10px]">Intelligence</h4>
                </div>
                <div className="space-y-3">
                   <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Risk</span>
                      <Badge className="bg-emerald-500 text-white border-none h-5 text-[9px]">LOW</Badge>
                   </div>
                   <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Auth</span>
                      <span className="text-[10px] font-black text-primary">98.4%</span>
                   </div>
                </div>
             </div>
          </Card>
        </div>

        <div className="xl:col-span-9 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <Card className="rounded-[24px] border-border/50 bg-white shadow-sm overflow-hidden p-4 border-b-4 border-b-primary">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">Orders</p>
                        <h4 className="text-lg font-black text-slate-900">{customer.interactions.filter(i => i.type === 'Order').length}</h4>
                    </div>
                </div>
             </Card>
             <Card className="rounded-[24px] border-border/50 bg-white shadow-sm overflow-hidden p-4 border-b-4 border-b-emerald-500">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600/60">LTV</p>
                        <h4 className="text-lg font-black text-slate-900">${customer.totalSpent.toFixed(0)}</h4>
                    </div>
                </div>
             </Card>
             <Card className="rounded-[24px] border-border/50 bg-white shadow-sm overflow-hidden p-4 border-b-4 border-b-violet-500">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-violet-600/60">AOV</p>
                        <h4 className="text-lg font-black text-slate-900">${(customer.totalSpent / (customer.interactions.filter(i => i.type === 'Order').length || 1)).toFixed(0)}</h4>
                    </div>
                </div>
             </Card>
             <Card className="rounded-[24px] border-border/50 bg-white shadow-sm overflow-hidden p-4 border-b-4 border-b-amber-500">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-500/60">Freq</p>
                        <h4 className="text-lg font-black text-slate-900">
                            {(() => {
                                const orders = customer.interactions.filter(i => i.type === 'Order');
                                if (orders.length === 0) return "0.0";
                                const firstDate = new Date(orders[orders.length - 1].rawDate || 0);
                                const months = Math.max(1, (new Date().getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
                                return (orders.length / months).toFixed(1);
                            })()}
                        </h4>
                    </div>
                </div>
             </Card>
          </div>

          <Card className="rounded-[24px] border-border/50 shadow-lg shadow-slate-200/40 overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b border-border/50 p-5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800">Interaction Stream</CardTitle>
              <History className="w-4 h-4 text-slate-300" />
=======
  const totalSpent = orders.reduce((acc, o) => acc + Number(o.total || 0), 0);

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl border border-border/50 h-10 w-10 bg-white shadow-sm hover:bg-slate-50 transition-all" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-headline font-black tracking-tight text-slate-900 uppercase">Profile: {customer.fullName || customer.phones[0]}</h1>
            <p className="text-[10px] text-muted-foreground font-mono uppercase opacity-60">Primary Identifier: {customer.phones[0]} • ID: {customer.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
            {customer.status.phoneBlocked || customer.status.ipBlocked ? (
                <Badge className="bg-rose-100 text-rose-600 border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"><Ban className="w-3 h-3 mr-1" /> RESTRICTED</Badge>
            ) : (
                <Badge className="bg-emerald-100 text-emerald-600 border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"><ShieldCheck className="w-3 h-3 mr-1" /> VERIFIED</Badge>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 space-y-6">
          <Card className="rounded-[32px] border-border/50 shadow-xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b border-border/50 p-6 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Global Identifiers</CardTitle>
              <Fingerprint className="w-4 h-4 text-slate-300" />
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><User className="w-3 h-3" /> Recorded Names</Label>
                    <div className="flex flex-wrap gap-2">
                        {customer.names?.length > 0 ? customer.names.map((n, i) => (
                            <Badge key={i} className="bg-slate-100 text-slate-700 border-none rounded-xl px-3 py-1 text-xs font-bold">{n}</Badge>
                        )) : <Badge className="bg-slate-100 text-slate-700 border-none rounded-xl px-3 py-1 text-xs font-bold">{customer.fullName || "Anonymous"}</Badge>}
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Phone className="w-3 h-3" /> Phone Numbers</Label>
                    <div className="flex flex-wrap gap-2">
                        {customer.phones.map((p, i) => (
                            <Badge key={i} className="bg-slate-100 text-slate-700 border-none rounded-xl px-3 py-1 text-xs font-bold">{p}</Badge>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Mail className="w-3 h-3" /> Emails</Label>
                    <div className="flex flex-wrap gap-2">
                        {customer.emails.length > 0 ? customer.emails.map((e, i) => (
                            <Badge key={i} className="bg-slate-100 text-slate-700 border-none rounded-xl px-3 py-1 text-xs font-bold">{e}</Badge>
                        )) : <span className="text-xs text-slate-300 italic">No emails recorded</span>}
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Globe className="w-3 h-3" /> IP History</Label>
                    <div className="flex flex-wrap gap-2">
                        {customer.ips.map((ip, i) => (
                            <Badge key={i} className="bg-slate-100 text-slate-700 border-none rounded-xl px-3 py-1 text-xs font-mono">{ip}</Badge>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><MapPin className="w-3 h-3" /> Addresses</Label>
                    <div className="space-y-2">
                        {customer.addresses.map((a, i) => (
                            <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-medium text-slate-600 leading-relaxed">{a}</div>
                        ))}
                    </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2"><Shield className="w-4 h-4 text-rose-500" /> Administrative Controls</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="space-y-0.5">
                            <p className="text-xs font-black uppercase">Phone Access</p>
                            <p className="text-[10px] text-slate-500">Enable/Disable SMS Verification</p>
                        </div>
                        <Button 
                            variant={customer.status.phoneBlocked ? "destructive" : "outline"} 
                            size="sm" 
                            className="rounded-xl font-bold h-9 px-4"
                            onClick={() => handleUpdateStatus('phoneBlocked', !customer.status.phoneBlocked)}
                        >
                            {customer.status.phoneBlocked ? 'Blocked' : 'Active'}
                        </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="space-y-0.5">
                            <p className="text-xs font-black uppercase">Network Access (IP)</p>
                            <p className="text-[10px] text-slate-500">Enable/Disable Storefront Access</p>
                        </div>
                        <Button 
                            variant={customer.status.ipBlocked ? "destructive" : "outline"} 
                            size="sm" 
                            className="rounded-xl font-bold h-9 px-4"
                            onClick={() => handleUpdateStatus('ipBlocked', !customer.status.ipBlocked)}
                        >
                            {customer.status.ipBlocked ? 'Blocked' : 'Active'}
                        </Button>
                    </div>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-[24px] border-none bg-primary text-white p-6 shadow-xl">
                <ShoppingBag className="w-6 h-6 mb-4 opacity-40" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Orders</p>
                <h3 className="text-3xl font-black">{orders.length}</h3>
            </Card>
            <Card className="rounded-[24px] border-none bg-slate-900 text-white p-6 shadow-xl">
                <Wallet className="w-6 h-6 mb-4 opacity-40 text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Lifetime Value</p>
                <h3 className="text-3xl font-black">{getCurrencySymbol(currency)}{totalSpent.toFixed(2)}</h3>
            </Card>
            <Card className="rounded-[24px] border-none bg-white p-6 shadow-lg border border-slate-100">
                <Calendar className="w-6 h-6 mb-4 text-slate-300" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">First Active</p>
                <h3 className="text-xl font-black text-slate-900">{customer.createdAt?.toDate().toLocaleDateString()}</h3>
            </Card>
          </div>

          <Card className="rounded-[32px] border-border/50 shadow-xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-border/50 p-6 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Customer Notes</CardTitle>
              {!isEditingNotes ? (
                <Button variant="ghost" size="sm" className="h-8 rounded-lg font-bold text-[10px] uppercase" onClick={() => setIsEditingNotes(true)}><Edit3 className="w-3 h-3 mr-2" /> Edit Notes</Button>
              ) : (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-8 rounded-lg font-bold text-[10px] uppercase" onClick={() => setIsEditingNotes(false)}>Cancel</Button>
                    <Button variant="default" size="sm" className="h-8 rounded-lg font-bold text-[10px] uppercase" onClick={handleSaveNotes} disabled={saving}>{saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-2" />} Save</Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {isEditingNotes ? (
                <Textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Enter internal notes about this customer..."
                    className="min-h-[120px] rounded-2xl bg-slate-50 border-none p-4"
                />
              ) : (
                <div className="min-h-[120px] p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm text-slate-600 leading-relaxed italic">
                    {customer.notes || "No internal notes recorded for this customer."}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border/50 shadow-xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-border/50 p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Order History</CardTitle>
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/30">
                  <TableRow className="border-border/50">
<<<<<<< HEAD
                    <TableHead className="px-6 py-3 font-black uppercase tracking-widest text-[9px]">ID</TableHead>
                    <TableHead className="px-6 py-3 font-black uppercase tracking-widest text-[9px]">Date</TableHead>
                    <TableHead className="px-6 py-3 font-black uppercase tracking-widest text-[9px]">Type</TableHead>
                    <TableHead className="px-6 py-3 font-black uppercase tracking-widest text-[9px] text-center">Status</TableHead>
                    <TableHead className="px-6 py-3 font-black uppercase tracking-widest text-[9px] text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.interactions.map((item) => (
                    <TableRow key={item.id} className="border-border/50 hover:bg-slate-50 transition-colors">
                      <TableCell className="px-6 py-3">
                        <button 
                            onClick={() => router.push(`/${subdomain}/orders${item.type === 'Draft' ? '/uncompleted' : ''}/${item.id}`)}
                            className="font-mono text-[10px] font-bold text-slate-900 select-all hover:text-primary hover:underline transition-all underline-offset-4"
                        >
                            {item.id.slice(0, 8)}...
                        </button>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-slate-600 font-medium text-xs">{item.date}</TableCell>
                      <TableCell className="px-6 py-3">
                        <div className="flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${item.type === 'Order' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                           <span className="text-[9px] font-black uppercase tracking-tighter text-slate-500">{item.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-center">
                        <Badge variant="outline" className={`rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase border ${
                            item.status === 'completed' || item.status === 'paid' ? 'border-emerald-100 text-emerald-600 bg-emerald-50/50' : 
                            item.status === 'pending' ? 'border-amber-100 text-amber-600 bg-amber-50/50' :
                            'border-slate-100 text-slate-400'
                        }`}>{item.status}</Badge>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`text-xs font-black ${item.type === 'Order' ? 'text-slate-900' : 'text-slate-400'}`}>
                                ${item.total.toFixed(0)}
                            </span>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 rounded-md hover:bg-slate-100 text-slate-400 hover:text-primary"
                                onClick={() => router.push(`/${subdomain}/orders${item.type === 'Draft' ? '/uncompleted' : ''}/${item.id}`)}
                            >
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
=======
                    <TableHead className="px-6 py-4 font-black uppercase tracking-widest text-[9px]">Order ID</TableHead>
                    <TableHead className="px-6 py-4 font-black uppercase tracking-widest text-[9px]">Date</TableHead>
                    <TableHead className="px-6 py-4 font-black uppercase tracking-widest text-[9px]">Status</TableHead>
                    <TableHead className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-right">Amount</TableHead>
                    <TableHead className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">No orders found for this identity</TableCell>
                    </TableRow>
                  ) : orders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage).map((order) => (
                    <TableRow key={order.id} className="border-border/50 hover:bg-slate-50 transition-colors">
                      <TableCell className="px-6 py-4">
                        <span className="font-mono text-[10px] font-bold text-slate-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-slate-600 font-medium text-xs">
                        {order.createdAt?.toDate().toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className={`rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase ${
                            order.status === 'completed' || order.status === 'paid' ? 'border-emerald-100 text-emerald-600 bg-emerald-50' : 
                            order.status === 'pending' ? 'border-amber-100 text-amber-600 bg-amber-50' :
                            'border-slate-100 text-slate-400'
                        }`}>{order.status}</Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-black text-slate-900">
                        {getCurrencySymbol(currency)}{Number(order.total || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary"
                            onClick={() => router.push(`/${subdomain}/orders/${order.id}`)}
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Button>
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
<<<<<<< HEAD
=======
              {orders.length > ordersPerPage && (
                <div className="p-4 border-t bg-slate-50/50 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Page {currentPage} of {Math.ceil(orders.length / ordersPerPage)}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 rounded-lg font-bold text-[10px] uppercase"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Prev
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 rounded-lg font-bold text-[10px] uppercase"
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(orders.length / ordersPerPage), prev + 1))}
                      disabled={currentPage === Math.ceil(orders.length / ordersPerPage)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
