
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MoreHorizontal, Eye, Receipt, ShoppingCart, CheckCircle, Clock, XCircle, Calendar, DollarSign, Loader2, PackageCheck, Wallet, ChevronRight } from "lucide-react";
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
      <div className="flex flex-col gap-1 sm:gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase font-headline">Order Management</h1>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 sm:hidden border border-slate-100" onClick={fetchOrders}>
            <Loader2 className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>
        <p className="text-[10px] sm:text-sm text-muted-foreground font-medium uppercase tracking-wider opacity-70">Monitor real-time sales and fulfillment status.</p>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign className="w-12 h-12 text-emerald-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Revenue</p>
          <h3 className="text-2xl font-black text-slate-900">{getCurrencySymbol(currency)}{stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-600 uppercase">Live Metrics</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <ShoppingCart className="w-12 h-12 text-blue-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Orders</p>
          <h3 className="text-2xl font-black text-slate-900">{stats.count}</h3>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[9px] font-bold text-blue-600 uppercase">All Time</span>
          </div>
        </div>

        <div className="hidden lg:block bg-slate-900 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <PackageCheck className="w-12 h-12 text-white" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Platform Status</p>
          <h3 className="text-2xl font-black text-white uppercase font-headline italic">Premium</h3>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-bold text-primary uppercase">Secure & Verified</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search ID, Customer, Phone..."
              className="pl-11 rounded-2xl bg-white border-slate-100 h-12 shadow-sm text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'ruby' }} className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
              { id: "all", label: "All", count: counts.all },
              { id: "pending", label: "Pending", count: counts.pending },
              { id: "processing", label: "Process", count: counts.processing },
              { id: "shipped", label: "Shipped", count: counts.shipped },
              { id: "completed", label: "Done", count: counts.completed },
              { id: "spam", label: "Spam", count: counts.spam },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0",
                  activeFilter === tab.id
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-105"
                    : "bg-white text-slate-500 border border-slate-100 hover:border-slate-200"
                )}
              >
                {tab.label}
                <span className={cn(
                  "px-1.5 py-0.5 rounded-lg text-[8px] font-black",
                  activeFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-50 text-slate-400"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <Card className="rounded-[40px] overflow-hidden border-none bg-white shadow-2xl shadow-slate-200/60">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="py-5 px-8 font-black uppercase tracking-[0.2em] text-[9px] text-slate-400">Order Information</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-[0.2em] text-[9px] text-slate-400">Customer Details</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-[0.2em] text-[9px] text-slate-400">Transaction</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-[0.2em] text-[9px] text-slate-400">Fulfillment</TableHead>
                  <TableHead className="py-5 px-8 text-right font-black uppercase tracking-[0.2em] text-[9px] text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin mx-auto w-8 h-8 text-primary opacity-20" /></TableCell></TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <ShoppingCart className="w-16 h-16" />
                        <p className="font-black uppercase tracking-[0.3em] text-xs">Zero Orders Found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors border-slate-100 group cursor-pointer" onClick={() => router.push(`/${subdomain}/orders/${order.id}`)}>
                    <TableCell className="py-5 px-8">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg">#{order.id.slice(0, 8)}</span>
                          {order.isSpam && (
                            <Badge className="h-4 px-1.5 text-[8px] font-black uppercase tracking-widest bg-rose-500 text-white border-none rounded">SPAM</Badge>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{order.createdAt?.toDate()?.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-8">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-sm">{order.customer?.fullName}</span>
                        <span className="text-[10px] font-bold text-slate-400">{order.customer?.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-8">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-sm">{getCurrencySymbol(currency)}{order.total?.toFixed(2)}</span>
                        <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-1 mt-0.5">
                          <Wallet className="w-2.5 h-2.5" /> {order.paymentMethod}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-8" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        <Select
                          value={order.status}
                          onValueChange={(val) => handleStatusUpdate(order.id, val)}
                          disabled={updatingId === order.id}
                        >
                          <SelectTrigger className={cn(
                            "w-36 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest border-none shadow-sm",
                            order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                              order.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                order.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-2xl p-1">
                            <SelectItem value="pending" className="text-[10px] font-black uppercase rounded-lg">Pending</SelectItem>
                            <SelectItem value="processing" className="text-[10px] font-black uppercase rounded-lg">Processing</SelectItem>
                            <SelectItem value="shipped" className="text-[10px] font-black uppercase rounded-lg">Shipped</SelectItem>
                            <SelectItem value="completed" className="text-[10px] font-black uppercase rounded-lg text-emerald-600">Completed</SelectItem>
                            <SelectItem value="cancelled" className="text-[10px] font-black uppercase rounded-lg text-rose-500">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-8 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-white hover:shadow-md transition-all" onClick={() => router.push(`/${subdomain}/orders/${order.id}`)}>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  PAGE {currentPage} OF {totalPages} • {filteredOrders.length} TOTAL
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200"
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

      {/* Mobile View */}
      <div className="grid grid-cols-1 gap-4 md:hidden pb-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin w-10 h-10 text-primary opacity-30" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-30">
            <ShoppingCart className="w-16 h-16" />
            <p className="font-black text-xs uppercase tracking-widest">No activity found</p>
          </div>
        ) : paginatedOrders.map((order) => (
          <div
            key={order.id}
            className={cn(
              "bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 flex flex-col gap-4 active:scale-[0.98] transition-all duration-200 overflow-hidden relative",
              !order.isRead && "ring-2 ring-primary/10"
            )}
            onClick={() => router.push(`/${subdomain}/orders/${order.id}`)}
          >
            {!order.isRead && <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 -rotate-45 translate-x-10 -translate-y-10" />}

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-xl shadow-slate-900/20 shrink-0">
                  {order.customer?.fullName?.[0] || "?"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-mono text-[10px] font-black text-primary">#{order.id.slice(0, 8)}</span>
                    {order.isSpam && (
                      <span className="bg-rose-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase shrink-0">SPAM</span>
                    )}
                  </div>
                  <h4 className="font-black text-slate-900 truncate text-sm">{order.customer?.fullName || "Anonymous"}</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">
                    {order.createdAt?.toDate()?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {order.customer?.phone}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-black text-slate-900">{getCurrencySymbol(currency)}{order.total?.toFixed(2)}</span>
                <div className={cn(
                  "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest",
                  order.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                    order.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                      order.status === 'cancelled' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                )}>
                  {order.status}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
              <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                <Select
                  value={order.status}
                  onValueChange={(val) => handleStatusUpdate(order.id, val)}
                  disabled={updatingId === order.id}
                >
                  <SelectTrigger className="w-full h-10 rounded-2xl text-[9px] font-black uppercase tracking-widest border-none bg-slate-50 px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-3xl border-none shadow-2xl p-1">
                    <SelectItem value="pending" className="text-[10px] font-black uppercase rounded-xl">Pending</SelectItem>
                    <SelectItem value="processing" className="text-[10px] font-black uppercase rounded-xl">Processing</SelectItem>
                    <SelectItem value="shipped" className="text-[10px] font-black uppercase rounded-xl">Shipped</SelectItem>
                    <SelectItem value="completed" className="text-[10px] font-black uppercase rounded-xl text-emerald-600">Completed</SelectItem>
                    <SelectItem value="cancelled" className="text-[10px] font-black uppercase rounded-xl text-rose-500">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        ))}

        {totalPages > 1 && (
          <div className="flex flex-col gap-4 py-6">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-12 flex-1 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-slate-200"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Back
              </Button>
              <div className="bg-white border border-slate-100 rounded-2xl px-6 h-12 flex items-center justify-center font-black text-xs shadow-sm">
                {currentPage} <span className="mx-2 opacity-20">/</span> {totalPages}
              </div>
              <Button
                variant="outline"
                className="h-12 flex-1 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-slate-200"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
            <p className="text-[9px] text-center font-black text-slate-400 uppercase tracking-widest">
              Showing {paginatedOrders.length} of {filteredOrders.length} Records
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
