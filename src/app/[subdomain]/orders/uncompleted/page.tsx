"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MoreHorizontal, Eye, ShoppingCart, Clock, MousePointerClick, Mail } from "lucide-react";
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
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Uncompleted Orders</h1>
        <p className="text-muted-foreground">Analyze abandoned carts and recover potential lost sales.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-border/50 bg-white shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Abandon Rate</p>
              <h3 className="text-2xl font-bold">24.5%</h3>
            </div>
          </div>
        </Card>
        <Card className="rounded-3xl border-border/50 bg-white shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Potential Revenue</p>
              <h3 className="text-2xl font-bold">$1,245.30</h3>
            </div>
          </div>
        </Card>
        <Card className="rounded-3xl border-border/50 bg-white shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
              <MousePointerClick className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Recovery Rate</p>
              <h3 className="text-2xl font-bold">8.2%</h3>
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

      <Card className="rounded-3xl overflow-hidden border-border/50 bg-white shadow-xl shadow-slate-200/50">
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
                  <TableCell className="py-4 px-6 font-bold">${item.total.toFixed(2)}</TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">{item.lastStep}</span>
                      {getRiskBadge(item.risk)}
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
                        <DropdownMenuItem className="gap-3 rounded-xl py-2.5 cursor-pointer">
                          <Mail className="w-4 h-4 text-primary" /> Send Recovery Email
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
  );
}
