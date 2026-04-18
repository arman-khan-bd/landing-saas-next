"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MoreHorizontal, User, Mail, Phone, MapPin, ExternalLink, ShieldAlert } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
        <p className="text-muted-foreground">Manage your customer relationships and view their purchase history.</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search customers..." 
            className="pl-10 rounded-2xl bg-white border-border/50 h-11 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="rounded-2xl h-11 px-6 shadow-lg shadow-primary/20">
          Add Customer
        </Button>
      </div>

      <Card className="rounded-3xl overflow-hidden border-border/50 bg-white shadow-xl shadow-slate-200/50">
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
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {customer.name[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{customer.name}</span>
                        <span className="text-xs text-muted-foreground">{customer.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" /> {customer.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" /> {customer.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-center">
                    <span className="font-medium bg-muted px-2.5 py-1 rounded-lg text-sm">{customer.orders}</span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className="font-bold text-foreground">${customer.spent.toFixed(2)}</span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      customer.status === 'VIP' ? 'bg-amber-100 text-amber-700' : 
                      customer.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {customer.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl">
                          <MoreHorizontal className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px] border-border/50 shadow-xl">
                        <DropdownMenuItem className="gap-3 rounded-xl py-2.5 cursor-pointer" onClick={() => router.push(`/${subdomain}/customers/${customer.id}`)}>
                          <ExternalLink className="w-4 h-4 text-muted-foreground" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 rounded-xl py-2.5 cursor-pointer">
                          <Mail className="w-4 h-4 text-muted-foreground" /> Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 rounded-xl py-2.5 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                          <ShieldAlert className="w-4 h-4" /> Flag as Fraud
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
