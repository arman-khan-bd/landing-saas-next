"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MoreHorizontal, User, Mail, Phone, ExternalLink, ShieldAlert, MoreVertical, ShoppingBag, DollarSign, Fingerprint, Globe, ShieldCheck, ShieldX, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { updateCustomerStatus } from "@/app/actions/customers";
import { useToast } from "@/hooks/use-toast";

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
}

export default function CustomersPage() {
  const { subdomain } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

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
                <h1 className="text-3xl font-headline font-black tracking-tight uppercase">Customer Manager</h1>
                <p className="text-muted-foreground text-sm">Unified customer profiles with advanced security controls.</p>
            </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by phone, email or notes..." 
            className="pl-12 rounded-2xl bg-white border-border/50 h-12 shadow-sm focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="hidden lg:block">
        <Card className="rounded-[40px] overflow-hidden border-border/50 bg-white shadow-xl shadow-slate-200/40">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-border/50">
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px]">Identities</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px]">Security Status</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px]">Associated IPs</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px]">Last Active</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-widest text-[10px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="py-20 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">
                            No customers found matching your search.
                        </TableCell>
                    </TableRow>
                ) : filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-slate-50/80 transition-colors border-border/50 group">
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-lg font-black shadow-lg">
                          {customer.phones[0]?.[customer.phones[0].length - 1] || "C"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-base">{customer.phones[0]}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{customer.emails[0] || "No Email"}</span>
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
                        </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{customer.lastActive?.toDate().toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-black">{customer.lastActive?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl h-9 px-4 font-bold border-2 hover:bg-slate-50 gap-2"
                          onClick={() => router.push(`/${subdomain}/customers/${customer.id}`)}
                        >
                          Manage
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-2xl h-11 w-11 bg-slate-50 hover:bg-slate-100">
                              <MoreHorizontal className="w-5 h-5 text-slate-600" />
                            </Button>
                          </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-3xl p-2 min-w-[200px] border-border/50 shadow-2xl">
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
                          <DropdownMenuItem className="gap-3 py-3 rounded-2xl cursor-pointer" onClick={() => router.push(`/${subdomain}/customers/${customer.id}`)}>
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                <ExternalLink className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-sm">Full Profile</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:hidden pb-10">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="rounded-[32px] border-border/50 bg-white shadow-lg overflow-hidden border-2">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black shadow-lg">
                    {customer.phones[0]?.[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-xl leading-tight text-slate-900">{customer.phones[0]}</h4>
                    <div className="flex gap-1 mt-1">
                      {customer.status.phoneBlocked && <Badge className="bg-rose-500 text-white border-none rounded-lg text-[8px] font-black">BLOCKED</Badge>}
                      <Badge variant="secondary" className="rounded-lg text-[8px] font-black tracking-widest">CUSTOMER</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" /> <span className="truncate">{customer.emails[0] || "No Email"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <Globe className="w-4 h-4 text-slate-400" /> 
                  <span className="truncate">{customer.ips[0] || 'No IP Data'}</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-2 h-14 rounded-2xl font-black uppercase tracking-widest text-slate-600 border-2 hover:bg-slate-50"
                onClick={() => router.push(`/${subdomain}/customers/${customer.id}`)}
              >
                Manage Profile
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
