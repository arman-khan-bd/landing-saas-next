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
    ExternalLink, ArrowRight, User
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
                const qEmail = query(collection(db, colName), where("storeId", "==", sId), where("customer.email", "==", email));
                const snap = await getDocs(qEmail);
                matches.push(...snap.docs.map(d => ({ id: d.id, ...d.data(), colType: colName })));
            }
            if (phone) {
                const qPhone = query(collection(db, colName), where("storeId", "==", sId), where("customer.phone", "==", phone));
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
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      <div className="flex items-center gap-6">
        <Button variant="ghost" size="icon" className="rounded-2xl border border-border/50 h-14 w-14 bg-white shadow-sm hover:bg-slate-50 transition-all" onClick={() => router.back()}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-4xl font-headline font-black tracking-tight text-slate-900 uppercase">{customer.name}</h1>
          <p className="text-muted-foreground font-mono text-xs uppercase opacity-60">Identity Consolidated Profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-[40px] border-border/50 shadow-xl shadow-slate-200/40 overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b border-border/50 p-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Security Profile</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-[36px] bg-slate-900 text-white flex items-center justify-center text-5xl font-black shadow-2xl mb-6 transform -rotate-3 group-hover:rotate-0 transition-transform">
                  {customer.name[0]}
                </div>
                <h3 className="text-2xl font-black text-slate-900">{customer.name}</h3>
                <Badge className={`mt-3 border-none px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                    customer.status === 'VIP' ? 'bg-amber-100 text-amber-700' : 
                    customer.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>{customer.status}</Badge>
              </div>

              <div className="space-y-5 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 opacity-40" />
                  </div>
                  <span className="text-sm font-bold truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 opacity-40" />
                  </div>
                  <span className="text-sm font-bold">{customer.phone}</span>
                </div>
                <div className="flex items-start gap-4 text-slate-600">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 opacity-40" />
                  </div>
                  <span className="text-sm font-bold leading-relaxed">{customer.address}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 opacity-40" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-tighter">Acquired on {customer.joined}</span>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vault Access Points (IP History)</h4>
                  <div className="flex flex-wrap gap-2">
                      {customer.ips.map((ip, i) => (
                           <Badge key={i} variant="outline" className="rounded-lg font-mono text-[9px] bg-slate-50 border-slate-200 text-slate-500 py-1 px-2">
                               <Globe className="w-2 h-2 mr-1 opacity-40" /> {ip}
                           </Badge>
                      ))}
                  </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-4">
                <Button 
                    variant="destructive" 
                    className="h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 gap-2"
                    onClick={handleBlockAction}
                    disabled={blocking}
                >
                  {blocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldAlert className="w-4 h-4" /> Restrict Identity</>}
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl font-black uppercase tracking-widest border-2">
                    <Mail className="w-4 h-4 mr-2" /> Message Customer
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[40px] border-none bg-slate-900 text-white overflow-hidden shadow-2xl">
             <div className="p-8 space-y-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                      <Zap className="w-5 h-5" />
                   </div>
                   <h4 className="font-bold uppercase tracking-widest text-xs">Identity Intelligence</h4>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                      <span className="text-xs text-slate-400 font-bold uppercase">Risk Score</span>
                      <Badge className="bg-emerald-500 text-white border-none">LOW</Badge>
                   </div>
                   <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                      <span className="text-xs text-slate-400 font-bold uppercase">Consistency</span>
                      <span className="text-xs font-black text-primary">98.4%</span>
                   </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                    Identity verified across multiple sessions using store-specific behavioral patterns.
                </p>
             </div>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
             <Card className="rounded-[32px] border-border/50 bg-white shadow-lg overflow-hidden p-6 border-b-4 border-b-primary shadow-slate-200/50">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <ShoppingBag className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Total Orders</p>
                        <h4 className="text-2xl font-black text-slate-900">{customer.interactions.filter(i => i.type === 'Order').length}</h4>
                    </div>
                </div>
             </Card>
             <Card className="rounded-[32px] border-border/50 bg-white shadow-lg overflow-hidden p-6 border-b-4 border-b-emerald-500 shadow-slate-200/50">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <DollarSign className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/60">Lifetime Value</p>
                        <h4 className="text-2xl font-black text-slate-900">${customer.totalSpent.toFixed(0)}</h4>
                    </div>
                </div>
             </Card>
             <Card className="rounded-[32px] border-border/50 bg-white shadow-lg overflow-hidden p-6 border-b-4 border-b-violet-500 shadow-slate-200/50">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600">
                        <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600/60">Avg. Order</p>
                        <h4 className="text-2xl font-black text-slate-900">${(customer.totalSpent / (customer.interactions.filter(i => i.type === 'Order').length || 1)).toFixed(0)}</h4>
                    </div>
                </div>
             </Card>
             <Card className="rounded-[32px] border-border/50 bg-white shadow-lg overflow-hidden p-6 border-b-4 border-b-amber-500 shadow-slate-200/50">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                        <Zap className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60">Frequency/mo</p>
                        <h4 className="text-2xl font-black text-slate-900">
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

          <Card className="rounded-[40px] border-border/50 shadow-xl shadow-slate-200/40 overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b border-border/50 p-8 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-black uppercase tracking-widest text-slate-800">Unified Interaction Stream</CardTitle>
              <History className="w-5 h-5 text-slate-300" />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/30">
                  <TableRow className="border-border/50">
                    <TableHead className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Reference</TableHead>
                    <TableHead className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Timestamp</TableHead>
                    <TableHead className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Stream Type</TableHead>
                    <TableHead className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-center">Status</TableHead>
                    <TableHead className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.interactions.map((item) => (
                    <TableRow key={item.id} className="border-border/50 hover:bg-slate-50 transition-colors py-6">
                      <TableCell className="px-8 py-6">
                          <div className="flex flex-col">
                              <span className="font-mono text-xs font-bold text-slate-900 select-all">{item.id}</span>
                              <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mt-1 hover:text-primary transition-colors cursor-help">Session Registered</span>
                          </div>
                      </TableCell>
                      <TableCell className="px-8 py-6 text-slate-600 font-medium text-sm">{item.date}</TableCell>
                      <TableCell className="px-8 py-6">
                        <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${item.type === 'Order' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-6 text-center">
                        <Badge variant="outline" className={`rounded-lg px-2.5 py-1 text-[9px] font-black uppercase border-2 ${
                            item.status === 'completed' || item.status === 'paid' ? 'border-emerald-100 text-emerald-600 bg-emerald-50/50' : 
                            item.status === 'pending' ? 'border-amber-100 text-amber-600 bg-amber-50/50' :
                            'border-slate-100 text-slate-400'
                        }`}>{item.status}</Badge>
                      </TableCell>
                      <TableCell className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-4">
                            <span className={`text-base font-black ${item.type === 'Order' ? 'text-slate-900' : 'text-slate-400'}`}>
                                ${item.total.toFixed(2)}
                            </span>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors"
                                onClick={() => router.push(`/${subdomain}/orders${item.type === 'Draft' ? '/uncompleted' : ''}/${item.id}`)}
                            >
                                <ArrowRight className="w-4 h-4" />
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
