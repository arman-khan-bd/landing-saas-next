
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MoreHorizontal, ShieldAlert, AlertTriangle, Trash2, CheckCircle, Fingerprint, MoreVertical, Calendar, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";

export default function FraudListPage() {
  const { subdomain } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [searchTerm, setSearchTerm] = useState("");
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlocks();
  }, [subdomain]);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQ);
      if (storeSnap.empty) return;
      const sId = storeSnap.docs[0].id;

      const q = query(
        collection(db, "fraud_blocks"), 
        where("storeId", "==", sId),
        where("ownerId", "==", auth.currentUser?.uid)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Client-side sort while index builds
      data.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setBlocks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Confirm Unblock",
      message: "Are you sure you want to remove this entity from the fraud list? This customer will be able to place orders again.",
      confirmText: "Unblock Entity",
      variant: "danger"
    });

    if (!isConfirmed) return;
    try {
      await deleteDoc(doc(db, "fraud_blocks", id));
      toast({ title: "Entity Unblocked" });
      fetchBlocks();
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const getRiskBadge = (type: string) => {
    switch (type) {
      case 'ip': return <Badge className="bg-rose-600 text-white border-none rounded-lg px-3 py-1 font-bold">IP_BLOCK</Badge>;
      case 'email': return <Badge className="bg-amber-600 text-white border-none rounded-lg px-3 py-1 font-bold">EMAIL_BLOCK</Badge>;
      case 'phone': return <Badge className="bg-orange-600 text-white border-none rounded-lg px-3 py-1 font-bold">PHONE_BLOCK</Badge>;
      default: return <Badge className="bg-slate-600 text-white border-none rounded-lg px-3 py-1 font-bold">MANUAL</Badge>;
    }
  };

  const filtered = blocks.filter(b => 
    b.value?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
          <h1 className="text-3xl font-bold tracking-tight text-rose-500">Security Vault</h1>
        </div>
        <p className="text-muted-foreground">Monitor and manage restricted entities across your store.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-3xl border-rose-100 bg-rose-50/30 p-6 shadow-sm">
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Active Blocks</p>
             <h3 className="text-3xl font-black text-rose-700">{blocks.length}</h3>
          </div>
        </Card>
        <Card className="rounded-3xl border-border/50 bg-white p-6 shadow-sm">
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Protection Layer</p>
             <h3 className="text-3xl font-black text-emerald-600 uppercase">Enabled</h3>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search flagged values..." 
            className="pl-10 rounded-2xl bg-white border-border/50 h-11 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-[40px] border-dashed border-2 py-32 text-center text-muted-foreground bg-muted/10">
           <ShieldAlert className="w-16 h-16 mx-auto mb-4 opacity-10" />
           <p className="font-bold uppercase tracking-widest">Clear Security Records</p>
        </Card>
      ) : (
        <>
          <div className="hidden md:block">
            <Card className="rounded-[32px] overflow-hidden border-rose-100 bg-white shadow-xl shadow-rose-200/20">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-rose-50/50">
                    <TableRow className="border-rose-100">
                      <TableHead className="py-4 px-6 text-rose-900 font-bold">Flagged Value</TableHead>
                      <TableHead className="py-4 px-6 text-rose-900 font-bold">Type</TableHead>
                      <TableHead className="py-4 px-6 text-rose-900 font-bold">Reason & Date</TableHead>
                      <TableHead className="py-4 px-6 text-right text-rose-900 font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow key={item.id} className="hover:bg-rose-50 transition-colors border-rose-100 group">
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-mono text-sm font-bold text-rose-700">{item.value}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{item.customerName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">{getRiskBadge(item.type)}</TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-rose-900 line-clamp-1">{item.reason}</span>
                            <span className="text-[10px] text-muted-foreground">{item.createdAt?.toDate()?.toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <Button variant="ghost" size="icon" className="text-rose-500 hover:bg-rose-100" onClick={() => handleUnblock(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filtered.map((item) => (
              <Card key={item.id} className="rounded-3xl border-rose-100 bg-white p-5 space-y-4">
                <div className="flex justify-between items-start">
                   <div>
                      <h4 className="font-mono font-bold text-rose-700">{item.value}</h4>
                      <p className="text-[10px] font-black uppercase text-slate-400 mt-1">{item.customerName}</p>
                   </div>
                   {getRiskBadge(item.type)}
                </div>
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 text-[11px] text-rose-800">
                   {item.reason}
                </div>
                <div className="flex items-center justify-between pt-2">
                   <span className="text-[10px] text-slate-400 font-bold">{item.createdAt?.toDate()?.toLocaleDateString()}</span>
                   <Button variant="outline" size="sm" className="h-8 rounded-lg text-rose-600 border-rose-100" onClick={() => handleUnblock(item.id)}>Unblock</Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
      
      <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100 flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-1" />
        <div className="space-y-1">
          <h4 className="font-bold text-rose-800">Enforcement Notice</h4>
          <p className="text-sm text-rose-700/80 leading-relaxed">
            Flagging an entity restricts all future checkout attempts globally for this store. Use caution when blocking IP addresses as they can be shared across multiple legitimate users on the same network.
          </p>
        </div>
      </div>
    </div>
  );
}
