"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MoreHorizontal, Eye, Receipt, ShoppingCart, CheckCircle, Clock, XCircle, Filter } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Mock data for initial UI
const MOCK_ORDERS = [
  { id: "ORD-001", customer: "John Doe", email: "john@example.com", date: "2024-03-15", total: 125.50, status: "completed", payment: "paid" },
  { id: "ORD-002", customer: "Jane Smith", email: "jane@example.com", date: "2024-03-16", total: 89.00, status: "processing", payment: "paid" },
  { id: "ORD-003", customer: "Mike Ross", email: "mike@example.com", date: "2024-03-17", total: 210.00, status: "pending", payment: "unpaid" },
  { id: "ORD-004", customer: "Harvey Specter", email: "harvey@example.com", date: "2024-03-18", total: 540.20, status: "shipped", payment: "paid" },
  { id: "ORD-005", customer: "Donna Paulsen", email: "donna@example.com", date: "2024-03-19", total: 45.00, status: "cancelled", payment: "refunded" },
];

export default function OrdersPage() {
  const { subdomain } = useParams();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>(MOCK_ORDERS);
  const [loading, setLoading] = useState(false); // Set to false to show mock data
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // fetchOrders(); // Uncomment when real data is ready
  }, [subdomain]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const storeQuery = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQuery);
      if (storeSnap.empty) return;
      const storeId = storeSnap.docs[0].id;

      const q = query(collection(db, "orders"), where("storeId", "==", storeId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(items);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none rounded-lg px-3 py-1 font-semibold flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Completed</Badge>;
      case 'shipped': return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-none rounded-lg px-3 py-1 font-semibold flex items-center gap-1.5"><ShoppingCart className="w-3.5 h-3.5" /> Shipped</Badge>;
      case 'processing': return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-none rounded-lg px-3 py-1 font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Processing</Badge>;
      case 'cancelled': return <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-none rounded-lg px-3 py-1 font-semibold flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Cancelled</Badge>;
      default: return <Badge className="bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 border-none rounded-lg px-3 py-1 font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Pending</Badge>;
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Manage and track your store&apos;s orders and sales.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-border/50 bg-white/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-600">
              <Receipt className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,450.00</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border/50 bg-white/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground mt-1">+5% from last month</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border/50 bg-white/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
            <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center text-violet-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground mt-1">+2 new today</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by ID, customer or email..." 
            className="pl-10 rounded-2xl bg-white border-border/50 h-11 focus-visible:ring-primary shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" className="rounded-2xl h-11 px-5 border-border/50 bg-white shadow-sm flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
          <Button className="rounded-2xl h-11 px-5 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center gap-2">
             Export CSV
          </Button>
        </div>
      </div>

      <Card className="rounded-3xl overflow-hidden border-border/50 bg-white/50 backdrop-blur-sm shadow-xl shadow-slate-200/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="py-4 px-6 font-semibold">Order ID</TableHead>
                <TableHead className="py-4 px-6 font-semibold">Customer</TableHead>
                <TableHead className="py-4 px-6 font-semibold">Date</TableHead>
                <TableHead className="py-4 px-6 font-semibold">Total</TableHead>
                <TableHead className="py-4 px-6 font-semibold">Status</TableHead>
                <TableHead className="py-4 px-6 font-semibold">Payment</TableHead>
                <TableHead className="py-4 px-6 text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2">
                      <Clock className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-muted-foreground">Loading orders...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                    <Receipt className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No orders found</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-primary/5 transition-colors border-border/50 group">
                    <TableCell className="py-4 px-6 font-mono text-sm">{order.id}</TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{order.customer}</span>
                        <span className="text-xs text-muted-foreground">{order.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-muted-foreground">{new Date(order.date).toLocaleDateString()}</TableCell>
                    <TableCell className="py-4 px-6 font-bold text-foreground">${order.total.toFixed(2)}</TableCell>
                    <TableCell className="py-4 px-6">
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${order.payment === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {order.payment}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary">
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[160px] border-border/50 shadow-xl">
                          <DropdownMenuItem className="gap-3 rounded-xl py-2.5 cursor-pointer" onClick={() => router.push(`/${subdomain}/orders/${order.id}`)}>
                            <Eye className="w-4 h-4 text-muted-foreground" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 rounded-xl py-2.5 cursor-pointer">
                            <Receipt className="w-4 h-4 text-muted-foreground" /> Download Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 rounded-xl py-2.5 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                            <XCircle className="w-4 h-4" /> Cancel Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
