"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MoreHorizontal, Eye, Receipt, ShoppingCart, CheckCircle, Clock, XCircle, Filter, MoreVertical, Calendar, DollarSign, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
        <p className="text-muted-foreground">Manage and track your store&apos;s sales.</p>
      </div>

      {/* Overview Cards (Scrollable on mobile) */}
      <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <Card className="rounded-2xl border-border/50 bg-white shadow-sm shrink-0 w-[280px] md:w-auto">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Revenue</p>
              <h3 className="text-2xl font-black mt-1">$12,450.00</h3>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><DollarSign className="w-5 h-5" /></div>
          </div>
        </Card>
        <Card className="rounded-2xl border-border/50 bg-white shadow-sm shrink-0 w-[280px] md:w-auto">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Orders</p>
              <h3 className="text-2xl font-black mt-1">156</h3>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><ShoppingCart className="w-5 h-5" /></div>
          </div>
        </Card>
        <Card className="rounded-2xl border-border/50 bg-white shadow-sm shrink-0 w-[280px] md:w-auto">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Sales</p>
              <h3 className="text-2xl font-black mt-1">42</h3>
            </div>
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600"><Clock className="w-5 h-5" /></div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Order #, Customer, Email..." 
            className="pl-10 rounded-2xl bg-white border-border/50 h-11 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex-1 sm:flex-none rounded-2xl h-11 px-5 bg-white shadow-sm border-border/50"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
          <Button className="flex-1 sm:flex-none rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20">Export</Button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card className="rounded-[32px] overflow-hidden border-border/50 bg-white/50 backdrop-blur-sm shadow-xl shadow-slate-200/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="py-4 px-6">Order ID</TableHead>
                  <TableHead className="py-4 px-6">Customer</TableHead>
                  <TableHead className="py-4 px-6">Date</TableHead>
                  <TableHead className="py-4 px-6">Total</TableHead>
                  <TableHead className="py-4 px-6">Status</TableHead>
                  <TableHead className="py-4 px-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-primary/5 transition-colors border-border/50 group">
                    <TableCell className="py-4 px-6 font-mono text-sm font-bold text-primary">{order.id}</TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{order.customer}</span>
                        <span className="text-xs text-muted-foreground">{order.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-muted-foreground">{order.date}</TableCell>
                    <TableCell className="py-4 px-6 font-black text-foreground">${order.total.toFixed(2)}</TableCell>
                    <TableCell className="py-4 px-6">{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px] border-border/50 shadow-xl">
                          <DropdownMenuItem className="gap-3 py-2.5 rounded-xl cursor-pointer" onClick={() => router.push(`/${subdomain}/orders/${order.id}`)}>
                            <Eye className="w-4 h-4 text-muted-foreground" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 py-2.5 rounded-xl cursor-pointer">
                            <Receipt className="w-4 h-4 text-muted-foreground" /> Invoice
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
      <div className="grid grid-cols-1 gap-4 md:hidden pb-10">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="rounded-3xl border-border/50 bg-white shadow-sm overflow-hidden active:scale-[0.98] transition-transform">
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{order.id}</span>
                  <h4 className="text-lg font-bold text-foreground">{order.customer}</h4>
                  <span className="text-xs text-muted-foreground">{order.email}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px]">
                    <DropdownMenuItem className="gap-3 py-3 rounded-xl" onClick={() => router.push(`/${subdomain}/orders/${order.id}`)}>
                      <Eye className="w-4 h-4" /> View Full Order
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-3 py-3 rounded-xl">
                      <Receipt className="w-4 h-4" /> Send Invoice
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between py-3 border-y border-border/50">
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">{order.date}</span>
                 </div>
                 <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Total Amount</p>
                    <p className="text-xl font-black text-primary">${order.total.toFixed(2)}</p>
                 </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                 <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      order.status === 'completed' ? 'bg-emerald-500' : 
                      order.status === 'processing' ? 'bg-amber-500' : 
                      'bg-slate-400'
                    }`} />
                    <span className="text-xs font-bold uppercase tracking-wider">{order.status}</span>
                 </div>
                 <Badge variant="outline" className={`rounded-lg border-none ${order.payment === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {order.payment.toUpperCase()}
                 </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
