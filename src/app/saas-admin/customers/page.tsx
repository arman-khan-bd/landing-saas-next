"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Users, ShieldCheck, ShieldX, Globe, Mail, Phone, ExternalLink, MoreHorizontal, Store, BarChart3, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { updateCustomerStatus } from "@/app/actions/customers";
import { useToast } from "@/hooks/use-toast";

interface GlobalCustomer {
  id: string;
  phones: string[];
  emails: string[];
  ips: string[];
  status: {
    phoneBlocked: boolean;
    ipBlocked: boolean;
  };
  lastActive: any;
  storeId: string;
  storeName?: string;
  notes: string;
}

export default function GlobalCustomersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<GlobalCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, blocked: 0 });

  useEffect(() => {
    fetchGlobalCustomers();
  }, []);

  const fetchGlobalCustomers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "customers"), orderBy("lastActive", "desc"), limit(100));
      const snap = await getDocs(q);
      
      const list = await Promise.all(snap.docs.map(async (docSnap) => {
        const data = docSnap.data();
        // Try to get store name
        let storeName = "Unknown Store";
        try {
            const storeRef = doc(db, "stores", data.storeId);
            const sSnap = await getDoc(storeRef);
            if (sSnap.exists()) storeName = sSnap.data().name;
        } catch (e) {}

        return { 
            id: docSnap.id, 
            ...data, 
            storeName 
        } as GlobalCustomer;
      }));

      setCustomers(list);
      setStats({
        total: list.length,
        blocked: list.filter(c => c.status.phoneBlocked || c.status.ipBlocked).length
      });
    } catch (e) {
      console.error("Global Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (customerId: string, type: 'phoneBlocked' | 'ipBlocked', current: boolean) => {
    const res = await updateCustomerStatus(customerId, type, !current);
    if (res.success) {
      toast({ title: "Global Security Updated" });
      fetchGlobalCustomers();
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.phones.some(p => p.includes(searchTerm)) ||
      c.emails.some(e => e.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.storeName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-black tracking-tight text-white">Global Customer Intelligence</h1>
          <p className="text-slate-400">Monitoring identities across all platform storefronts.</p>
        </div>
        <div className="flex gap-4">
            <Card className="bg-slate-900 border-white/5 px-6 py-3 flex items-center gap-4">
                <Users className="w-5 h-5 text-indigo-400" />
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-500">Total Entities</p>
                    <p className="text-xl font-black text-white">{stats.total}</p>
                </div>
            </Card>
            <Card className="bg-slate-900 border-white/5 px-6 py-3 flex items-center gap-4">
                <ShieldX className="w-5 h-5 text-rose-400" />
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-500">Restricted</p>
                    <p className="text-xl font-black text-white">{stats.blocked}</p>
                </div>
            </Card>
        </div>
      </div>

      <Card className="bg-slate-900 border-white/5 overflow-hidden shadow-2xl">
        <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between bg-slate-900/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
                placeholder="Search phone, email or store..." 
                className="pl-12 bg-slate-950 border-white/10 text-white rounded-xl h-12"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="border-white/10 text-slate-400 hover:bg-white/5" onClick={fetchGlobalCustomers}>Refresh Data</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950/50">
              <TableRow className="border-white/5">
                <TableHead className="py-5 px-8 font-black uppercase text-[10px] text-slate-500">Identity</TableHead>
                <TableHead className="py-5 px-8 font-black uppercase text-[10px] text-slate-500">Origin Store</TableHead>
                <TableHead className="py-5 px-8 font-black uppercase text-[10px] text-slate-500 text-center">Status</TableHead>
                <TableHead className="py-5 px-8 font-black uppercase text-[10px] text-slate-500">Last Seen</TableHead>
                <TableHead className="py-5 px-8 font-black uppercase text-[10px] text-slate-500 text-right">Shield Control</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center text-slate-600 font-bold uppercase text-xs tracking-widest">No global data found</TableCell>
                </TableRow>
              ) : filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg">
                        {customer.phones[0]?.[0]}
                      </div>
                      <div>
                        <p className="text-white font-bold">{customer.phones[0]}</p>
                        <p className="text-xs text-slate-500">{customer.emails[0] || "Guest"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-2 text-slate-300 font-medium">
                      <Store className="w-4 h-4 opacity-40" />
                      {customer.storeName}
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8 text-center">
                    {customer.status.phoneBlocked || customer.status.ipBlocked ? (
                      <Badge className="bg-rose-500/10 text-rose-500 border-none rounded-lg text-[9px] font-black uppercase tracking-widest">Flagged</Badge>
                    ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-lg text-[9px] font-black uppercase tracking-widest">Clean</Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Clock className="w-3.5 h-3.5 opacity-40" />
                      {customer.lastActive?.toDate().toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8 text-right">
                    <div className="flex justify-end gap-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`rounded-xl font-bold h-9 px-4 ${customer.status.phoneBlocked ? 'text-emerald-500 bg-emerald-500/5' : 'text-rose-500 bg-rose-500/5'}`}
                            onClick={() => handleToggleBlock(customer.id, 'phoneBlocked', customer.status.phoneBlocked)}
                        >
                            {customer.status.phoneBlocked ? 'Unblock Phone' : 'Block Phone'}
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
  );
}
