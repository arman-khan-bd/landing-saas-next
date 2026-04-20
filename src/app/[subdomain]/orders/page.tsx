"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MoreHorizontal, Eye, Receipt, ShoppingCart, CheckCircle, Clock, XCircle, Filter, MoreVertical, Calendar, DollarSign } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function OrdersPage() {
  const { subdomain } = useParams();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ revenue: 0, count: 0 });

  useEffect(() => {
    fetchOrders();
  }, [subdomain]);

  const fetchOrders = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQ);
      if (storeSnap.empty) return;
      const storeId = storeSnap.docs[0].id;

      const q = query(
        collection(db, "orders"), 
        where("storeId", "==", storeId),
        where("ownerId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(items);

      const totalRevenue = items.reduce((acc, curr) => acc + (curr.total || 0), 0);
      setStats({ revenue: totalRevenue, count: items.length });

    } catch (error) {
      console.error("Fetch Orders Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none rounded-lg px-3 py-1 font-semibold flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Completed</Badge>;
      case 'shipped': return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-none rounded-lg px-3 py-1 font-semibold flex items-center gap-1.5"><ShoppingCart className="w-3.5 h-3.5" /> Shipped</Badge>;
      case 'processing': return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-none rounded-lg px-3 py-1 font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Processing</Badge>;
      case 'cancelled': return <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-none rounded-lg px-3 py-1 font-semibold flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Cancelled</Badge>;
      default: return <Badge className="bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 border-none rounded-lg px-3 py-1 font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Pending</Badge>;
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase font-headline">Order Management</h1>
        <p className="text-muted-foreground">Monitor real-time sales and fulfillment status.</p>
      </div>

      <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
        <Card className="rounded-2xl border-border/50 bg-white shadow-sm shrink-0 w-[280px] md:w-auto">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Revenue</p>
              <h3 className="text-2xl font-black mt-1">${stats.revenue.toFixed(2)}</h3>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><DollarSign className="w-5 h-5" /></div>
          </div>
        </Card>
        <Card className="rounded-2xl border-border/50 bg-white shadow-sm shrink-0 w-[280px] md:w-auto">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Orders</p>
              <h3 className="text-2xl font-black mt-1">{stats.count}</h3>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><ShoppingCart className="w-5 h-5" /></div>
          </div>
        </Card>
        <Card className="rounded-2xl border-border/50 bg-white shadow-sm shrink-0 w-[280px] md:w-auto">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Growth</p>
              <h3 className="text-2xl font-black mt-1">+100%</h3>
            </div>
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600"><Calendar className="w-5 h-5" /></div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search Order ID, Customer, Email..." 
            className="pl-10 rounded-2xl bg-white border-border/50 h-11 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="hidden md:block">
        <Card className="rounded-[32px] overflow-hidden border-border/50 bg-white shadow-xl shadow-slate-200/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Order Snapshot</TableHead>
                  <TableHead className="py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Customer Identification</TableHead>
                  <TableHead className="py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Financials</TableHead>
                  <TableHead className="py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Status</TableHead>
                  <TableHead className="py-4 px-6 text-right font-bold uppercase tracking-widest text-[10px]">Controls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-primary/5 transition-colors border-border/50 group">
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-primary">{order.id.slice(0, 8)}</span>
                        <span className="text-[10px] text-muted-foreground">{order.createdAt?.toDate()?.toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{order.customer?.fullName}</span>
                        <span className="text-xs text-muted-foreground">{order.customer?.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-black text-foreground">${order.total?.toFixed(2)}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{order.paymentMethod}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px] border-border/50 shadow-xl">
                          <DropdownMenuItem className="gap-3 py-2.5 rounded-xl cursor-pointer">
                            <Eye className="w-4 h-4 text-muted-foreground" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 py-2.5 rounded-xl cursor-pointer">
                            <Receipt className="w-4 h-4 text-muted-foreground" /> Export Invoice
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

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="rounded-3xl border-border/50 bg-white shadow-sm overflow-hidden p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">#{order.id.slice(0, 8)}</span>
                  <h4 className="text-lg font-bold text-foreground">{order.customer?.fullName}</h4>
                  <span className="text-xs text-muted-foreground">{order.customer?.phone}</span>
                </div>
                {getStatusBadge(order.status)}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                 <div className="text-right flex-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Amount Due</p>
                    <p className="text-xl font-black text-primary">${order.total?.toFixed(2)}</p>
                 </div>
                 <Button variant="outline" size="sm" className="rounded-xl ml-4">Manage</Button>
              </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
