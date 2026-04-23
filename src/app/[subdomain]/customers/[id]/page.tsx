"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
    ChevronLeft, Mail, Phone, MapPin, Calendar, 
    ShoppingBag, CreditCard, ShieldAlert, Loader2, 
    Globe, Fingerprint, History, DollarSign,
    Zap, AlertTriangle, ShieldCheck, TrendingUp,
    ExternalLink, ArrowRight, User, Ban, Lock, ShieldX, Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { serverTimestamp, addDoc, deleteDoc } from "firebase/firestore";

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
}

export default function CustomerDetailsPage() {
  const { subdomain, id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [customer, setCustomer] = useState<AggregatedCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    fetchAggregatedProfile();
  }, [id, subdomain]);

  const fetchAggregatedProfile = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
        // 1. Identify initial doc to get email/phone
        let initialData: any = null;
        const orderRef = doc(db, "orders", id as string);
        const draftRef = doc(db, "uncompleted_orders", id as string);
        
        const [orderSnap, draftSnap] = await Promise.all([
            getDoc(orderRef),
            getDoc(draftRef)
        ]);

        if (orderSnap.exists()) initialData = orderSnap.data();
        else if (draftSnap.exists()) initialData = draftSnap.data();

        if (!initialData) {
            setLoading(false);
            return;
        }

        const email = initialData.customer?.email;
        const phone = initialData.customer?.phone;

        // 2. Fetch all related documents
        const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain));
        const storeSnap = await getDocs(storeQ);
        if (storeSnap.empty) return;
        const sId = storeSnap.docs[0].id;

        const findRelated = async (colName: string) => {
            const matches: any[] = [];
            if (email) {
                const qEmail = query(
                    collection(db, colName), 
                    where("storeId", "==", sId), 
                    where("ownerId", "==", auth.currentUser?.uid),
                    where("customer.email", "==", email)
                );
                const snap = await getDocs(qEmail);
                matches.push(...snap.docs.map(d => ({ id: d.id, ...d.data(), colType: colName })));
            }
            if (phone) {
                const qPhone = query(
                    collection(db, colName), 
                    where("storeId", "==", sId), 
                    where("ownerId", "==", auth.currentUser?.uid),
                    where("customer.phone", "==", phone)
                );
                const snap = await getDocs(qPhone);
                const results = snap.docs.map(d => ({ id: d.id, ...d.data(), colType: colName }));
                // Avoid duplicates if email search already found it
                results.forEach(r => {
                    if (!matches.find(m => m.id === r.id)) matches.push(r);
                });
            }
            return matches;
        };

        const [relatedOrders, relatedDrafts] = await Promise.all([
            findRelated("orders"),
            findRelated("uncompleted_orders")
        ]);

        const allDocs = [...relatedOrders, ...relatedDrafts].sort((a, b) => {
            const dateA = (a.createdAt || a.lastUpdated)?.seconds || 0;
            const dateB = (b.createdAt || b.lastUpdated)?.seconds || 0;
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
                date: (d.createdAt || d.lastUpdated)?.toDate?.()?.toLocaleDateString() || "Recent",
                type: d.colType === 'orders' ? "Order" : "Draft",
                total: Number(d.total || 0),
                status: d.status || "abandoned",
                rawDate: d.createdAt || d.lastUpdated
            };
        });

        setCustomer({
            name: allDocs[0].customer?.fullName || "Guest Customer",
            email: email || "N/A",
            phone: phone || "N/A",
            address: allDocs[0].customer?.address || "N/A",
            joined: allDocs[allDocs.length - 1].createdAt?.toDate?.()?.toLocaleDateString() || "Unknown",
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

  const blockIdentifier = async (type: 'phone' | 'email' | 'ip' | 'address', value: string) => {
    if (!value || value === "N/A" || !auth.currentUser) {
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
        const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain));
        const storeSnap = await getDocs(storeQ);
        if (storeSnap.empty) return;
        const sId = storeSnap.docs[0].id;

        await addDoc(collection(db, "fraud_blocks"), {
            ownerId: auth.currentUser.uid,
            storeId: sId,
            createdAt: serverTimestamp(),
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
    if (!customer || !auth.currentUser) return;
    
    const isConfirmed = await confirm({
      title: "Confirm Security Block",
      message: `Are you sure you want to restrict this identity? This will flag ${customer.email} and ${customer.phone} as fraud.`,
      confirmText: "Restrict Access",
      variant: "danger"
    });

    if (!isConfirmed) return;

    setBlocking(true);
    try {
        const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain));
        const storeSnap = await getDocs(storeQ);
        if (storeSnap.empty) return;
        const sId = storeSnap.docs[0].id;

        const baseBlockData = {
            ownerId: auth.currentUser.uid,
            storeId: sId,
            createdAt: serverTimestamp(),
            reason: `Manual identity block from Consolidated Profile`,
            customerName: customer.name,
            metadata: { source: 'profile_view' }
        };

        const blocks = [];
        if (customer.email !== "N/A") blocks.push({ type: 'email', value: customer.email });
        if (customer.phone !== "N/A") blocks.push({ type: 'phone', value: customer.phone });
        
        await Promise.all(blocks.map(b => addDoc(collection(db, "fraud_blocks"), { ...baseBlockData, ...b })));

        toast({ title: "Identity Restricted", description: "All associated identifiers have been flagged." });
    } catch (e) {
        toast({ variant: "destructive", title: "Action Failed" });
    } finally {
        setBlocking(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>;
  if (!customer) return <div className="p-20 text-center">Customer profile not found.</div>;

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
                                const firstDate = orders[orders.length - 1].rawDate?.toDate?.() || new Date();
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
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/30">
                  <TableRow className="border-border/50">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
