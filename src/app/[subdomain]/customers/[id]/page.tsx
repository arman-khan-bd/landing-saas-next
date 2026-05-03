"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
    ChevronLeft, Mail, Phone, MapPin, Calendar, 
    ShoppingBag, CreditCard, ShieldAlert, Loader2, 
    Globe, Fingerprint, History, DollarSign,
    Zap, AlertTriangle, ShieldCheck, TrendingUp,
    ExternalLink, ArrowRight, User, Ban, Lock, ShieldX, Filter,
    Save, Edit3, Trash2, Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Customer {
  id: string;
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
}

export default function CustomerDetailsPage() {
  const { subdomain, id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);

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
    });

    if (!isConfirmed) return;

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
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>;
  if (!customer) return <div className="p-20 text-center">Customer profile not found.</div>;

  const totalSpent = orders.reduce((acc, o) => acc + Number(o.total || 0), 0);

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl border border-border/50 h-10 w-10 bg-white shadow-sm hover:bg-slate-50 transition-all" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-headline font-black tracking-tight text-slate-900 uppercase">Profile: {customer.phones[0]}</h1>
            <p className="text-[10px] text-muted-foreground font-mono uppercase opacity-60">Customer ID: {customer.id}</p>
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
                <DollarSign className="w-6 h-6 mb-4 opacity-40 text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Lifetime Value</p>
                <h3 className="text-3xl font-black">${totalSpent.toFixed(2)}</h3>
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
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/30">
                  <TableRow className="border-border/50">
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
                  ) : orders.map((order) => (
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
                        ${Number(order.total || 0).toFixed(2)}
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
