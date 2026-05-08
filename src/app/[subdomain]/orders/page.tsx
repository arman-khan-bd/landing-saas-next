
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MoreHorizontal, Eye, Receipt, ShoppingCart, CheckCircle, Clock, XCircle, Calendar, DollarSign, Loader2, PackageCheck, Wallet } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn, getCurrencySymbol } from "@/lib/utils";

export default function OrdersPage() {
  const { subdomain } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ revenue: 0, count: 0 });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currency, setCurrency] = useState("BDT");
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      const storeData = storeSnap.docs[0].data();
      setCurrency(storeData.currency || "BDT");
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

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Status Updated", description: `Order #${orderId.slice(0, 8)} is now ${newStatus}.` });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeFilter === "all") return matchesSearch;
    if (activeFilter === "spam") return matchesSearch && o.isSpam;
    return matchesSearch && o.status === activeFilter;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed').length,
    spam: orders.filter(o => o.isSpam).length,
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase font-headline">Order Management</h1>
        <p className="text-[11px] sm:text-sm text-muted-foreground">Monitor real-time sales and fulfillment status.</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 sm:mx-0 px-4 sm:px-0 sm:grid sm:grid-cols-3 scrollbar-hide snap-x">
        <Card className="rounded-2xl border-border/50 bg-white shadow-sm overflow-hidden shrink-0 w-[240px] sm:w-auto snap-center">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Revenue</p>
              <h3 className="text-xl font-black mt-0.5">{getCurrencySymbol(currency)}{stats.revenue.toFixed(2)}</h3>
            </div>
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600"><Wallet className="w-4 h-4" /></div>
          </div>
        </Card>
        <Card className="rounded-2xl border-border/50 bg-white shadow-sm overflow-hidden shrink-0 w-[240px] sm:w-auto snap-center">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Orders</p>
              <h3 className="text-xl font-black mt-0.5">{stats.count}</h3>
            </div>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><ShoppingCart className="w-4 h-4" /></div>
          </div>
        </Card>
        <Card className="rounded-2xl border-border/50 bg-white shadow-sm overflow-hidden shrink-0 w-[240px] sm:w-auto snap-center">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Platform Tier</p>
              <h3 className="text-xl font-black mt-0.5">Premium</h3>
            </div>
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center text-violet-600"><Calendar className="w-4 h-4" /></div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search Order ID, Customer..."
              className="pl-9 rounded-xl bg-white border-border/50 h-10 shadow-sm text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
          {[
            { id: "all", label: "All Orders", count: counts.all },
            { id: "pending", label: "Pending", count: counts.pending },
            { id: "processing", label: "Processing", count: counts.processing },
            { id: "shipped", label: "Shipped", count: counts.shipped },
            { id: "completed", label: "Completed", count: counts.completed },
            { id: "spam", label: "Spam", count: counts.spam, color: "text-rose-500" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeFilter === tab.id ? "default" : "outline"}
              onClick={() => setActiveFilter(tab.id)}
              className={cn(
                "rounded-xl h-9 px-4 text-[10px] font-black uppercase tracking-widest gap-2 shrink-0 border-border/50",
                activeFilter !== tab.id && tab.color
              )}
            >
              {tab.label}
              <Badge variant="secondary" className="h-5 px-1.5 text-[9px] font-black bg-slate-100 text-slate-600 border-none">
                {tab.count}
              </Badge>
            </Button>
          ))}
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
                  <TableHead className="py-3 px-4 font-bold uppercase tracking-widest text-[9px]">Fulfillment Status</TableHead>
                  <TableHead className="py-3 px-4 text-right font-bold uppercase tracking-widest text-[9px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center"><Loader2 className="animate-spin mx-auto w-6 h-6 text-primary" /></TableCell></TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center text-muted-foreground opacity-50">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-4" />
                      <p className="font-bold uppercase tracking-widest text-xs">No orders found</p>
                    </TableCell>
                  </TableRow>
                ) : paginatedOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-primary/5 transition-colors border-border/50 group">
                    <TableCell className="py-3 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">#{order.id.slice(0, 8)}</span>
                          {order.isSpam && (
                            <Badge className="h-4 px-1.5 text-[8px] font-black uppercase tracking-widest bg-rose-500 hover:bg-rose-600 text-white border-none rounded">SPAM</Badge>
                          )}
                        </div>
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
                        <span className="font-black text-slate-900 text-xs">{getCurrencySymbol(currency)}{order.total?.toFixed(2)}</span>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-tight">{order.paymentMethod}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Select
                          value={order.status}
                          onValueChange={(val) => handleStatusUpdate(order.id, val)}
                          disabled={updatingId === order.id}
                        >
                          <SelectTrigger className="w-32 h-8 rounded-lg text-[10px] font-black uppercase tracking-tighter border-none bg-slate-50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                            <SelectItem value="pending" className="text-[10px] font-bold">Pending</SelectItem>
                            <SelectItem value="processing" className="text-[10px] font-bold">Processing</SelectItem>
                            <SelectItem value="shipped" className="text-[10px] font-bold">Shipped</SelectItem>
                            <SelectItem value="completed" className="text-[10px] font-bold">Completed</SelectItem>
                            <SelectItem value="cancelled" className="text-[10px] font-bold text-rose-500">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        {updatingId === order.id && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl p-1.5 min-w-[160px] border-border/50 shadow-xl">
                          <DropdownMenuItem className="gap-2 py-2 rounded-lg cursor-pointer text-xs" onClick={() => router.push(`/${subdomain}/orders/${order.id}`)}>
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
            {totalPages > 1 && (
              <div className="p-4 border-t bg-muted/20 flex items-center justify-between gap-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        variant={currentPage === p ? "default" : "ghost"}
                        size="sm"
                        className="h-8 w-8 rounded-lg text-[10px] font-black"
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 md:hidden pb-10">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin w-8 h-8 text-primary opacity-30" />
          </div>
        ) : paginatedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-40">
            <ShoppingCart className="w-12 h-12" />
            <p className="font-black text-xs uppercase tracking-widest">No orders found</p>
          </div>
        ) : paginatedOrders.map((order) => (
          <Card key={order.id} className="rounded-2xl border-border/50 bg-white shadow-sm overflow-hidden">
            <div className="p-4">
              {/* Top Row: ID + Date + Spam + Status */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-black text-primary"># {order.id.slice(0, 10)}</span>
                    {order.isSpam && (
                      <Badge className="h-4 px-1.5 text-[7px] font-black uppercase bg-rose-500 text-white border-none rounded shrink-0">SPAM</Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">{order.createdAt?.toDate()?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <Select
                  value={order.status}
                  onValueChange={(val) => handleStatusUpdate(order.id, val)}
                  disabled={updatingId === order.id}
                >
                  <SelectTrigger className="w-[110px] h-9 rounded-lg text-[10px] font-black uppercase border-none bg-slate-100 shrink-0 shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Info */}
              <div className="bg-slate-50 rounded-xl p-3 mb-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 font-black text-sm shrink-0">
                  {order.customer?.fullName?.[0] || "?"}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-900 truncate">{order.customer?.fullName || "Unknown"}</p>
                  <p className="text-[10px] text-slate-400 truncate">{order.customer?.phone}</p>
                </div>
              </div>

              {/* Bottom Row: Total + Payment + Details Button */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-tight">Total</p>
                  <p className="text-base font-black text-slate-900">{getCurrencySymbol(currency)}{order.total?.toFixed(2)}</p>
                  <p className="text-[9px] uppercase font-bold text-slate-400">{order.paymentMethod}</p>
                </div>
                <Button
                  size="sm"
                  className="h-9 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm"
                  onClick={() => router.push(`/${subdomain}/orders/${order.id}`)}
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" /> Details
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {totalPages > 1 && (
          <div className="flex flex-col gap-3 py-4">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex-1 rounded-xl text-[10px] font-black uppercase"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Prev
              </Button>
              <div className="bg-white border rounded-xl px-4 h-9 flex items-center justify-center font-black text-xs">
                {currentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex-1 rounded-xl text-[10px] font-black uppercase"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
            <p className="text-[9px] text-center font-bold text-muted-foreground uppercase tracking-widest">
              Total {filteredOrders.length} Orders
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
