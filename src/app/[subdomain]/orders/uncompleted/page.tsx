"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MoreHorizontal, Eye, ShoppingCart, Clock, MousePointerClick, Mail, MoreVertical, Calendar } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const MOCK_UNCOMPLETED = [
  { id: "CART-001", customer: "Anonymous", date: "2024-03-20 14:30", items: 3, total: 45.90, lastStep: "Checkout Info", risk: "Low" },
  { id: "CART-002", customer: "Sarah Wilson", date: "2024-03-20 15:15", items: 1, total: 12.00, lastStep: "Payment Method", risk: "Medium" },
  { id: "CART-003", customer: "David Brown", date: "2024-03-21 09:45", items: 5, total: 299.00, lastStep: "Address", risk: "Low" },
  { id: "CART-004", customer: "Emily Davis", date: "2024-03-21 11:20", items: 2, total: 88.50, lastStep: "Payment Method", risk: "High" },
];

export default function UncompletedOrdersPage() {
  const { subdomain } = useParams();
  const router = useRouter();
  const [items, setItems] = useState(MOCK_UNCOMPLETED);
  const [searchTerm, setSearchTerm] = useState("");

  const getRiskBadge = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return <Badge className="bg-rose-500/10 text-rose-600 border-none rounded-lg px-2 py-0.5">High Risk</Badge>;
      case 'medium': return <Badge className="bg-amber-500/10 text-amber-600 border-none rounded-lg px-2 py-0.5">Medium Risk</Badge>;
      default: return <Badge className="bg-emerald-500/10 text-emerald-600 border-none rounded-lg px-2 py-0.5">Low Risk</Badge>;
    }
  };

  const filteredItems = items.filter(i => 
    i.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-amber-600">Uncompleted Orders</h1>
        <p className="text-muted-foreground">Analyze abandoned carts and recover potential lost sales.</p>
      </div>

      <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
        <Card className="rounded-3xl border-border/50 bg-white shadow-sm p-6 shrink-0 w-[280px] md:w-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Abandon Rate</p>
              <h3 className="text-2xl font-black">24.5%</h3>
            </div>
          </div>
        </Card>
        <Card className="rounded-3xl border-border/50 bg-white shadow-sm p-6 shrink-0 w-[280px] md:w-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Potential Revenue</p>
              <h3 className="text-2xl font-black">$1,245.30</h3>
            </div>
          </div>
        </Card>
        <Card className="rounded-3xl border-border/50 bg-white shadow-sm p-6 shrink-0 w-[280px] md:w-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
              <MousePointerClick className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recovery Rate</p>
              <h3 className="text-2xl font-black">8.2%</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search carts..." 
            className="pl-10 rounded-2xl bg-white border-border/50 h-11 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <Card className="rounded-[32px] overflow-hidden border-border/50 bg-white shadow-xl shadow-slate-200/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50">
                  <TableHead className="py-4 px-6">Cart ID</TableHead>
                  <TableHead className="py-4 px-6">Customer</TableHead>
                  <TableHead className="py-4 px-6">Date</TableHead>
                  <TableHead className="py-4 px-6">Items</TableHead>
                  <TableHead className="py-4 px-6">Total</TableHead>
                  <TableHead className="py-4 px-6">Drop-off Point</TableHead>
                  <TableHead className="py-4 px-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-primary/5 transition-colors border-border/50">
                    <TableCell className="py-4 px-6 font-mono text-sm">{item.id}</TableCell>
                    <TableCell className="py-4 px-6 font-medium">{item.customer}</TableCell>
                    <TableCell className="py-4 px-6 text-muted-foreground">{item.date}</TableCell>
                    <TableCell className="py-4 px-6">{item.items} items</TableCell>
                    <TableCell className="py-4 px-6 font-bold text-primary">${item.total.toFixed(2)}</TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">{item.lastStep}</span>
                        <div className="flex">{getRiskBadge(item.risk)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl">
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px] border-border/50 shadow-xl">
                          <DropdownMenuItem className="gap-3 rounded-xl py-2.5 cursor-pointer font-medium text-primary">
                            <Mail className="w-4 h-4" /> Send Recovery Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 rounded-xl py-2.5 cursor-pointer">
                            <Eye className="w-4 h-4 text-muted-foreground" /> View Items
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

      {/* Mobile View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredItems.map((item) => (
          <Card key={item.id} className="rounded-3xl border-border/50 bg-white shadow-sm overflow-hidden active:scale-[0.98] transition-transform">
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{item.id}</span>
                  <h4 className="text-lg font-bold text-foreground">{item.customer}</h4>
                  <div className="mt-1">{getRiskBadge(item.risk)}</div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[200px]">
                    <DropdownMenuItem className="gap-3 py-3 rounded-xl text-primary font-bold">
                      <Mail className="w-4 h-4" /> Recover Cart
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-3 py-3 rounded-xl">
                      <Eye className="w-4 h-4" /> View Contents
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between py-3 border-y border-border/50">
                 <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Drop-off Point</span>
                    <span className="text-xs font-bold">{item.lastStep}</span>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Potential Total</p>
                    <p className="text-xl font-black text-amber-600">${item.total.toFixed(2)}</p>
                 </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-medium">{item.date}</span>
                 </div>
                 <span className="text-xs font-bold text-slate-500">{item.items} Items in Cart</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
