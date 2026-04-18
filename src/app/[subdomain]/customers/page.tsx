"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MoreHorizontal, User, Mail, Phone, MapPin, ExternalLink, ShieldAlert, MoreVertical, ShoppingBag, DollarSign } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const MOCK_CUSTOMERS = [
  { id: "CUST-001", name: "John Doe", email: "john@example.com", phone: "+1 234 567 890", orders: 12, spent: 1250.00, status: "Active", risk: "Low" },
  { id: "CUST-002", name: "Jane Smith", email: "jane@example.com", phone: "+1 987 654 321", orders: 5, spent: 450.50, status: "Active", risk: "Low" },
  { id: "CUST-003", name: "Mike Ross", email: "mike@example.com", phone: "+1 555 123 456", orders: 1, spent: 210.00, status: "Inactive", risk: "Medium" },
  { id: "CUST-004", name: "Harvey Specter", email: "harvey@example.com", phone: "+1 444 999 888", orders: 25, spent: 8900.00, status: "VIP", risk: "Low" },
  { id: "CUST-005", name: "Donna Paulsen", email: "donna@example.com", phone: "+1 222 333 444", orders: 8, spent: 1200.00, status: "Active", risk: "Low" },
];

export default function CustomersPage() {
  const { subdomain } = useParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = MOCK_CUSTOMERS.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">Manage your client relationships.</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or email..." 
            className="pl-10 rounded-2xl bg-white border-border/50 h-11 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20 font-bold">
          Add Customer
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card className="rounded-[32px] overflow-hidden border-border/50 bg-white shadow-xl shadow-slate-200/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50">
                  <TableHead className="py-4 px-6">Customer</TableHead>
                  <TableHead className="py-4 px-6">Contact</TableHead>
                  <TableHead className="py-4 px-6 text-center">Orders</TableHead>
                  <TableHead className="py-4 px-6">Total Spent</TableHead>
                  <TableHead className="py-4 px-6">Status</TableHead>
                  <TableHead className="py-4 px-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-primary/5 transition-colors border-border/50 group">
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">
                          {customer.name[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors">{customer.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{customer.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" /> {customer.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" /> {customer.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-center">
                      <span className="font-bold bg-muted px-3 py-1 rounded-lg text-xs">{customer.orders}</span>
                    </TableCell>
                    <TableCell className="py-4 px-6 font-black text-primary">${customer.spent.toFixed(2)}</TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge className={`border-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        customer.status === 'VIP' ? 'bg-amber-100 text-amber-700' : 
                        customer.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px] border-border/50 shadow-xl">
                          <DropdownMenuItem className="gap-3 py-2.5 rounded-xl cursor-pointer" onClick={() => router.push(`/${subdomain}/customers/${customer.id}`)}>
                            <ExternalLink className="w-4 h-4 text-muted-foreground" /> Full Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 py-2.5 rounded-xl cursor-pointer">
                            <Mail className="w-4 h-4 text-muted-foreground" /> Email Customer
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 py-2.5 rounded-xl cursor-pointer text-rose-600">
                            <ShieldAlert className="w-4 h-4" /> Flag for Fraud
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
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="rounded-3xl border-border/50 bg-white shadow-sm overflow-hidden active:scale-[0.98] transition-transform">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-lg font-black">
                    {customer.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg leading-tight">{customer.name}</h4>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{customer.id}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px]">
                    <DropdownMenuItem className="gap-3 py-3 rounded-xl" onClick={() => router.push(`/${subdomain}/customers/${customer.id}`)}>
                      <User className="w-4 h-4" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-3 py-3 rounded-xl">
                      <Mail className="w-4 h-4" /> Contact Customer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" /> {customer.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" /> {customer.phone}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                <div className="bg-muted/30 p-3 rounded-2xl">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ShoppingBag className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Orders</span>
                  </div>
                  <p className="text-xl font-black">{customer.orders}</p>
                </div>
                <div className="bg-primary/5 p-3 rounded-2xl border border-primary/10">
                  <div className="flex items-center gap-2 text-primary/70 mb-1">
                    <DollarSign className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Spent</span>
                  </div>
                  <p className="text-xl font-black text-primary">${customer.spent.toFixed(0)}</p>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center">
                 <Badge className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none ${
                    customer.status === 'VIP' ? 'bg-amber-100 text-amber-700' : 
                    customer.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                    'bg-slate-100 text-slate-600'
                 }`}>
                   {customer.status}
                 </Badge>
                 <Button variant="ghost" size="sm" className="text-xs font-bold text-primary px-0 h-auto" onClick={() => router.push(`/${subdomain}/customers/${customer.id}`)}>
                    Details <ExternalLink className="w-3 h-3 ml-1" />
                 </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
