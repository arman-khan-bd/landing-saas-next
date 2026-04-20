
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
        where("ownerId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      
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
      case 'completed': return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none rounded-lg px-2 py-0.5 font-bold flex items-center gap-1 text-[10px]"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      case 'shipped': return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-none rounded-lg px-2 py-0.5 font-bold flex items-center gap-1 text-[10px]"><ShoppingCart className="w-3 h-3" /> Shipped</Badge>;
      case 'processing': return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-none rounded-lg px-2 py-0.5 font-bold flex items-center gap-1 text-[10px]"><Clock className="w-3 h-3" /> Processing</Badge>;
      case 'cancelled': return <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-none rounded-lg px-2 py-0.5 font-bold flex items-center gap-1 text-[10px]"><XCircle className="w-3 h-3" /> Cancelled</Badge>;
      default: return <Badge className="bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 border-none rounded-lg px-2 py-0.5 font-bold flex items-center gap-1 text-[10px]"><Clock className="w-3 h-3" /> Pending</Badge>;
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase font-headline">Order Management</h1>
        <p className="text-sm text-muted-foreground">Monitor real-time sales and fulfillment status.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="rounded-2xl border-border/50 bg-white shadow-sm overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Revenue</p>
              <h3 className="text-xl font-black mt-0.5">${stats.revenue.toFixed(2)}</h3>
            </div>
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600"><DollarSign className="w-4 h-4" /></div>
          </div>
        </Card>
        <Card className="rounded-2xl border-border/50 bg-white shadow-sm overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Orders</p>
              <h3 className="text-xl font-black mt-0.5">{stats.count}</h3>
            </div>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><ShoppingCart className="w-4 h-4" /></div>
          </div>
        </Card>
        <Card className="rounded-2xl border-border/50 bg-white shadow-sm overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Growth</p>
              <h3 className="text-xl font-black mt-0.5">+100%</h3>
            </div>
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center text-violet-600"><Calendar className="w-4 h-4" /></div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search Order ID, Customer..." 
            className="pl-9 rounded-xl bg-white border-border/50 h-10 shadow-sm text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="hidden md:block">
        <Card className="rounded-3xl overflow-hidden border-border/50 bg-white shadow-lg shadow-slate-200/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="py-3 px-4 font-bold uppercase tracking-widest text-[9px]">ID & Date</TableHead>
                  <TableHead className="py-3 px-4 font-bold uppercase tracking-widest text-[9px]">Customer</TableHead>
                  <TableHead className="py-3 px-4 font-bold uppercase tracking-widest text-[9px]">Financials</TableHead>
                  <TableHead className="py-3 px-4 font-bold uppercase tracking-widest text-[9px]">Status</TableHead>
                  <TableHead className="py-3 px-4 text-right font-bold uppercase tracking-widest text-[9px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center text-muted-foreground opacity-50">
                       <ShoppingCart className="w-12 h-12 mx-auto mb-4" />
                       <p className="font-bold uppercase tracking-widest text-xs">No orders found</p>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-primary/5 transition-colors border-border/50 group">
                    <TableCell className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-primary">#{order.id.slice(0, 8)}</span>
                        <span className="text-[10px] text-muted-foreground">{order.createdAt?.toDate()?.toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-xs">{order.customer?.fullName}</span>
                        <span className="text-[10px] text-muted-foreground">{order.customer?.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-xs">${order.total?.toFixed(2)}</span>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-tight">{order.paymentMethod}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl p-1.5 min-w-[160px] border-border/50 shadow-xl">
                          <DropdownMenuItem className="gap-2 py-2 rounded-lg cursor-pointer text-xs">
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 py-2 rounded-lg cursor-pointer text-xs">
                            <Receipt className="w-3.5 h-3.5 text-muted-foreground" /> Export Invoice
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

      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="rounded-2xl border-border/50 bg-white shadow-sm overflow-hidden p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">#{order.id.slice(0, 8)}</span>
                  <h4 className="text-base font-bold text-slate-900 mt-1 leading-tight">{order.customer?.fullName}</h4>
                  <span className="text-[11px] text-muted-foreground">{order.customer?.phone}</span>
                </div>
                {getStatusBadge(order.status)}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                 <div className="flex flex-col">
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-tight leading-none">Order Total</p>
                    <p className="text-lg font-black text-slate-900">${order.total?.toFixed(2)}</p>
                 </div>
                 <Button variant="outline" size="sm" className="rounded-xl h-8 px-4 text-xs font-bold border-slate-200">Details</Button>
              </div>
          </Card>
        ))}
        {filteredOrders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100 opacity-50">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2" />
            <p className="font-bold uppercase tracking-widest text-[10px]">Empty Order Book</p>
          </div>
        )}
      </div>
    </div>
  );
}
