"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
<<<<<<< HEAD
import { useSupabaseClient } from "@/supabase";
=======
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
<<<<<<< HEAD
import { Search, MoreHorizontal, Mail, Phone, ExternalLink, ShieldAlert, MoreVertical, ShoppingBag, DollarSign, Globe } from "lucide-react";
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
=======
import { Search, MoreHorizontal, User, Mail, Phone, ExternalLink, ShieldAlert, MoreVertical, ShoppingBag, DollarSign, Fingerprint, Globe, ShieldCheck, ShieldX, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { updateCustomerStatus } from "@/app/actions/customers";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  fullName?: string;
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
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
}

export default function CustomersPage() {
  const { subdomain } = useParams();
  const router = useRouter();
<<<<<<< HEAD
  const supabase = useSupabaseClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<CustomerAggregated[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAndAggregateCustomers = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: storeData } = await supabase
        .from("stores")
        .select("id")
        .eq("subdomain", subdomain)
        .single();
      if (!storeData) return;
      const sId = storeData.id;

      const [ordersRes, uncompletedRes] = await Promise.all([
        supabase.from("orders").select("*").eq("store_id", sId).eq("owner_id", user.id),
        supabase.from("uncompleted_orders").select("*").eq("store_id", sId).eq("owner_id", user.id)
      ]);

      const ordersData = ordersRes.data || [];
      const uncompletedData = uncompletedRes.data || [];

      const customerMap: Record<string, CustomerAggregated> = {};

      const processDocs = (docs: any[], isOrder: boolean) => {
        docs.forEach(doc => {
          const cust = doc.customer;
          if (!cust?.email && !cust?.phone) return;

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
              lastActivity: doc.created_at || doc.updated_at,
              status: isOrder ? "Active" : "Lead"
            };
          }

          const entry = customerMap[key];
          entry.orders += 1;
          if (isOrder) {
            entry.spent += Number(doc.total || 0);
            entry.status = "Customer";
          }
          
          if (cust.ip && !entry.ips.includes(cust.ip)) {
            entry.ips.push(cust.ip);
          }
        });
      };

      processDocs(ordersData, true);
      processDocs(uncompletedData, false);

      setCustomers(Object.values(customerMap));
    } catch (e) {
      console.error("Aggregation Error:", e);
=======
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCustomers();
  }, [subdomain]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQ);
      if (storeSnap.empty) return;
      const sId = storeSnap.docs[0].id;

      const q = query(
        collection(db, "customers"),
        where("storeId", "==", sId),
        orderBy("lastActive", "desc")
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(list);
    } catch (e) {
      console.error("Fetch Error:", e);
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  useEffect(() => {
    fetchAndAggregateCustomers();
  }, [subdomain]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    );
  }, [customers, searchTerm]);

=======
  const handleToggleBlock = async (customerId: string, type: 'phoneBlocked' | 'emailBlocked' | 'ipBlocked', current: boolean) => {
    const res = await updateCustomerStatus(customerId, type, !current);
    if (res.success) {
      toast({ title: "Status Updated", description: "Customer restriction status has been updated." });
      fetchCustomers();
    } else {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.phones.some(p => p.includes(searchTerm)) ||
      c.emails.some(e => e.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [customers, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
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
<<<<<<< HEAD
                <h1 className="text-3xl font-headline font-black tracking-tight uppercase">Customer Directory</h1>
                <p className="text-muted-foreground text-sm">Aggregated activity from orders and checkout drafts.</p>
=======
                <h1 className="text-3xl font-headline font-black tracking-tight uppercase">Customer Manager</h1>
                <p className="text-muted-foreground text-sm">Unified customer profiles with advanced security controls.</p>
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
            </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
<<<<<<< HEAD
            placeholder="Search by name, email or phone..." 
=======
            placeholder="Search by phone, email or notes..." 
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
            className="pl-12 rounded-2xl bg-white border-border/50 h-12 shadow-sm focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

<<<<<<< HEAD
      {/* Desktop Table View */}
=======
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
      <div className="hidden lg:block">
        <Card className="rounded-[40px] overflow-hidden border-border/50 bg-white shadow-xl shadow-slate-200/40">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-border/50">
<<<<<<< HEAD
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px]">Customer</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px]">Contacts</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px]">Vault Data (IP)</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px] text-center">Activity</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px]">Total Spent</TableHead>
=======
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px]">Identities</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px]">Security Status</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px]">Associated IPs</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px]">Last Active</TableHead>
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                    <TableRow>
<<<<<<< HEAD
                        <TableCell colSpan={6} className="py-20 text-center text-muted-foreground">
                            No customers found matching your criteria.
                        </TableCell>
                    </TableRow>
                ) : filteredCustomers.map((customer) => (
=======
                        <TableCell colSpan={5} className="py-20 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">
                            No customers found matching your search.
                        </TableCell>
                    </TableRow>
                ) : paginatedCustomers.map((customer) => (
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
                  <TableRow key={customer.id} className="hover:bg-slate-50/80 transition-colors border-border/50 group">
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-lg font-black shadow-lg">
<<<<<<< HEAD
                          {customer.name[0]}
                        </div>
                        <Link 
                          href={`/${subdomain}/customers/${customer.id}`}
                          className="flex flex-col group/link"
                        >
                          <span className="font-bold text-slate-900 group-hover/link:text-primary transition-colors text-base flex items-center gap-2">
                            {customer.name}
                            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </span>
                          <Badge variant="outline" className="w-fit mt-1 rounded-lg text-[9px] font-black uppercase tracking-tighter px-1.5 opacity-60">
                             {customer.status}
                          </Badge>
                        </Link>
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
=======
                          {customer.phones[0]?.[customer.phones[0].length - 1] || "C"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-base">{customer.fullName || customer.phones[0]}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{customer.phones[0]} • {customer.emails[0] || "No Email"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <div className="flex gap-2">
                        {customer.status.phoneBlocked ? (
                          <Badge className="bg-rose-100 text-rose-600 border-none rounded-lg text-[9px] font-black flex items-center gap-1"><ShieldX className="w-3 h-3" /> Phone Blocked</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-600 border-none rounded-lg text-[9px] font-black flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Phone Safe</Badge>
                        )}
                        {customer.status.ipBlocked && (
                          <Badge className="bg-rose-100 text-rose-600 border-none rounded-lg text-[9px] font-black flex items-center gap-1"><Globe className="w-3 h-3" /> IP Restricted</Badge>
                        )}
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
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
<<<<<<< HEAD
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
=======
                        </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{customer.lastActive?.toDate().toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-black">{customer.lastActive?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
<<<<<<< HEAD
                          className="hidden xl:flex rounded-xl h-9 px-4 font-bold border-2 hover:bg-slate-50 gap-2"
                          onClick={() => router.push(`/${subdomain}/customers/${customer.id}`)}
                        >
                          View Details
=======
                          className="rounded-xl h-9 px-4 font-bold border-2 hover:bg-slate-50 gap-2"
                          onClick={() => router.push(`/${subdomain}/customers/${customer.id}`)}
                        >
                          Manage
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-2xl h-11 w-11 bg-slate-50 hover:bg-slate-100">
                              <MoreHorizontal className="w-5 h-5 text-slate-600" />
                            </Button>
                          </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-3xl p-2 min-w-[200px] border-border/50 shadow-2xl">
<<<<<<< HEAD
=======
                          <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">Security Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="gap-3 py-3 rounded-2xl cursor-pointer" onClick={() => handleToggleBlock(customer.id, 'phoneBlocked', customer.status.phoneBlocked)}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${customer.status.phoneBlocked ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                <ShieldAlert className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-sm">{customer.status.phoneBlocked ? 'Unblock Phone' : 'Block Phone'}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 py-3 rounded-2xl cursor-pointer" onClick={() => handleToggleBlock(customer.id, 'ipBlocked', customer.status.ipBlocked)}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${customer.status.ipBlocked ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                <Globe className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-sm">{customer.status.ipBlocked ? 'Unblock IP' : 'Block IP'}</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
                          <DropdownMenuItem className="gap-3 py-3 rounded-2xl cursor-pointer" onClick={() => router.push(`/${subdomain}/customers/${customer.id}`)}>
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                <ExternalLink className="w-4 h-4" />
                            </div>
<<<<<<< HEAD
                            <span className="font-bold text-sm">Analyze Profile</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 py-3 rounded-2xl cursor-pointer text-rose-600 hover:bg-rose-50 transition-colors">
                            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
                                <ShieldAlert className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-sm">Restrict Access</span>
=======
                            <span className="font-bold text-sm">Full Profile</span>
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                  </TableRow>
                ))}
              </TableBody>
<<<<<<< HEAD
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Card List View */}
      <div className="grid grid-cols-1 gap-4 lg:hidden pb-10">
        {filteredCustomers.map((customer) => (
=======
                </Table>
                {totalPages > 1 && (
                  <div className="p-4 border-t bg-muted/20 flex items-center justify-between gap-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Previous</Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                          <Button key={p} variant={currentPage === p ? "default" : "ghost"} size="sm" className="h-8 w-8 rounded-lg text-[10px] font-black" onClick={() => setCurrentPage(p)}>{p}</Button>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

      <div className="grid grid-cols-1 gap-4 lg:hidden pb-10">
        {paginatedCustomers.map((customer) => (
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
          <Card key={customer.id} className="rounded-[32px] border-border/50 bg-white shadow-lg overflow-hidden border-2">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black shadow-lg">
<<<<<<< HEAD
                    {customer.name[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-xl leading-tight text-slate-900">{customer.name}</h4>
                    <Badge variant="secondary" className="mt-1 rounded-lg text-[9px] font-black tracking-widest">{customer.status}</Badge>
                  </div>
                </div>
                <MoreVertical className="w-5 h-5 text-slate-300" />
=======
                    {customer.phones[0]?.[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-xl leading-tight text-slate-900">{customer.fullName || customer.phones[0]}</h4>
                    <p className="text-[10px] text-slate-400 font-bold">{customer.phones[0]}</p>
                    <div className="flex gap-1 mt-1">
                      {customer.status.phoneBlocked && <Badge className="bg-rose-500 text-white border-none rounded-lg text-[8px] font-black">BLOCKED</Badge>}
                      <Badge variant="secondary" className="rounded-lg text-[8px] font-black tracking-widest">CUSTOMER</Badge>
                    </div>
                  </div>
                </div>
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
              </div>

              <div className="space-y-3 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
<<<<<<< HEAD
                  <Mail className="w-4 h-4 text-slate-400" /> <span className="truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" /> {customer.phone}
=======
                  <Mail className="w-4 h-4 text-slate-400" /> <span className="truncate">{customer.emails[0] || "No Email"}</span>
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <Globe className="w-4 h-4 text-slate-400" /> 
                  <span className="truncate">{customer.ips[0] || 'No IP Data'}</span>
                </div>
              </div>

<<<<<<< HEAD
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
=======
              <Button 
                variant="outline" 
                className="w-full mt-2 h-14 rounded-2xl font-black uppercase tracking-widest text-slate-600 border-2 hover:bg-slate-50"
                onClick={() => router.push(`/${subdomain}/customers/${customer.id}`)}
              >
                Manage Profile
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
              </Button>
            </CardContent>
          </Card>
        ))}
<<<<<<< HEAD
=======

        {totalPages > 1 && (
          <div className="flex flex-col gap-3 py-4">
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" className="h-9 flex-1 rounded-xl text-[10px] font-black uppercase" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Prev</Button>
              <div className="bg-white border rounded-xl px-4 h-9 flex items-center justify-center font-black text-xs">{currentPage} / {totalPages}</div>
              <Button variant="outline" size="sm" className="h-9 flex-1 rounded-xl text-[10px] font-black uppercase" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</Button>
            </div>
            <p className="text-[9px] text-center font-bold text-muted-foreground uppercase tracking-widest">Total {filteredCustomers.length} Customers</p>
          </div>
        )}
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
      </div>
    </div>
  );
}
<<<<<<< HEAD

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
=======
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
