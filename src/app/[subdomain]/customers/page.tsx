"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MoreHorizontal, User, Mail, Phone, ExternalLink, ShieldAlert, MoreVertical, ShoppingBag, DollarSign, Fingerprint, Globe } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface CustomerAggregated {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  spent: number;
  ips: string[];
  lastActivity: any;
  status: string;
}

export default function CustomersPage() {
  const { subdomain } = useParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<CustomerAggregated[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAndAggregateCustomers();
  }, [subdomain]);

  const fetchAndAggregateCustomers = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      // 1. Get Store ID
      const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQ);
      if (storeSnap.empty) return;
      const sId = storeSnap.docs[0].id;

      // 2. Fetch Orders & Uncompleted Orders
      const qOrders = query(
        collection(db, "orders"), 
        where("storeId", "==", sId),
        where("ownerId", "==", auth.currentUser.uid)
      );
      const qUncompleted = query(
        collection(db, "uncompleted_orders"), 
        where("storeId", "==", sId),
        where("ownerId", "==", auth.currentUser.uid)
      );

      const [ordersSnap, uncompletedSnap] = await Promise.all([
        getDocs(qOrders),
        getDocs(qUncompleted)
      ]);

      const customerMap: Record<string, CustomerAggregated> = {};

      const processDocs = (docs: any[], isOrder: boolean) => {
        docs.forEach(doc => {
          const data = doc.data();
          const cust = data.customer;
          if (!cust?.email && !cust?.phone) return;

          // Unique Key based on Email and Phone
          const key = `${cust.email?.toLowerCase() || ""}|${cust.phone || ""}`;
          
          if (!customerMap[key]) {
            customerMap[key] = {
              id: doc.id,
              name: cust.fullName || "Guest Customer",
              email: cust.email || "No Email",
              phone: cust.phone || "No Phone",
              orders: 0,
              spent: 0,
              ips: [],
              lastActivity: data.createdAt || data.lastUpdated,
              status: isOrder ? "Active" : "Lead"
            };
          }

          const entry = customerMap[key];
          entry.orders += 1;
          if (isOrder) {
            entry.spent += Number(data.total || 0);
            entry.status = "Customer";
          }
          
          if (cust.ip && !entry.ips.includes(cust.ip)) {
            entry.ips.push(cust.ip);
          }
        });
      };

      processDocs(ordersSnap.docs, true);
      processDocs(uncompletedSnap.docs, false);

      setCustomers(Object.values(customerMap));
    } catch (e) {
      console.error("Aggregation Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Users className="w-7 h-7" />
            </div>
            <div>
                <h1 className="text-3xl font-headline font-black tracking-tight uppercase">Customer Directory</h1>
                <p className="text-muted-foreground text-sm">Aggregated activity from orders and checkout drafts.</p>
            </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email or phone..." 
            className="pl-12 rounded-2xl bg-white border-border/50 h-12 shadow-sm focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Card className="rounded-[40px] overflow-hidden border-border/50 bg-white shadow-xl shadow-slate-200/40">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-border/50">
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px]">Customer</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px]">Contacts</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px]">Vault Data (IP)</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px] text-center">Activity</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px]">Total Spent</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="py-20 text-center text-muted-foreground">
                            No customers found matching your criteria.
                        </TableCell>
                    </TableRow>
                ) : filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-slate-50/80 transition-colors border-border/50 group">
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-lg font-black shadow-lg">
                          {customer.name[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-primary transition-colors text-base">{customer.name}</span>
                          <Badge variant="outline" className="w-fit mt-1 rounded-lg text-[9px] font-black uppercase tracking-tighter px-1.5 opacity-60">
                             {customer.status}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                          <Mail className="w-3.5 h-3.5 opacity-50" /> {customer.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                          <Phone className="w-3.5 h-3.5 opacity-50" /> {customer.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                            {customer.ips.slice(0, 2).map((ip, idx) => (
                                <Badge key={idx} className="bg-slate-100 text-slate-600 border-none rounded-lg font-mono text-[10px] px-2 py-0.5">
                                    {ip}
                                </Badge>
                            ))}
                            {customer.ips.length > 2 && (
                                <span className="text-[10px] font-bold text-slate-400">+{customer.ips.length - 2} more</span>
                            )}
                            {customer.ips.length === 0 && <span className="text-[10px] text-slate-300">No IP recorded</span>}
                        </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-black text-slate-900 text-lg leading-none">{customer.orders}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Interactions</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                        <div className="flex flex-col">
                            <span className="font-black text-primary text-xl">${customer.spent.toFixed(2)}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-primary/40 leading-none">Net Revenue</span>
                        </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-2xl h-11 w-11 bg-slate-50 hover:bg-slate-100">
                            <MoreHorizontal className="w-5 h-5 text-slate-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-3xl p-2 min-w-[200px] border-border/50 shadow-2xl">
                          <DropdownMenuItem className="gap-3 py-3 rounded-2xl cursor-pointer" onClick={() => router.push(`/${subdomain}/customers/${customer.id}`)}>
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                <ExternalLink className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-sm">Analyze Profile</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 py-3 rounded-2xl cursor-pointer text-rose-600 hover:bg-rose-50 transition-colors">
                            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
                                <ShieldAlert className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-sm">Restrict Access</span>
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
      <div className="grid grid-cols-1 gap-4 lg:hidden pb-10">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="rounded-[32px] border-border/50 bg-white shadow-lg overflow-hidden border-2">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black shadow-lg">
                    {customer.name[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-xl leading-tight text-slate-900">{customer.name}</h4>
                    <Badge variant="secondary" className="mt-1 rounded-lg text-[9px] font-black tracking-widest">{customer.status}</Badge>
                  </div>
                </div>
                <MoreVertical className="w-5 h-5 text-slate-300" />
              </div>

              <div className="space-y-3 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" /> <span className="truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" /> {customer.phone}
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <Globe className="w-4 h-4 text-slate-400" /> 
                  <span className="truncate">{customer.ips[0] || 'No IP Data'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border-2 border-slate-100 p-4 rounded-3xl">
                  <div className="flex items-center gap-2 text-slate-400 mb-1 leading-none">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Growth</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{customer.orders}</p>
                </div>
                <div className="bg-primary/5 border-2 border-primary/10 p-4 rounded-3xl">
                  <div className="flex items-center gap-2 text-primary/40 mb-1 leading-none">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">LTV</span>
                  </div>
                  <p className="text-2xl font-black text-primary">${customer.spent.toFixed(0)}</p>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-6 h-14 rounded-2xl font-black uppercase tracking-widest text-slate-600 border-2 hover:bg-slate-50"
                onClick={() => router.push(`/${subdomain}/customers/${customer.id}`)}
              >
                Open Full Profile
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const Users = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
