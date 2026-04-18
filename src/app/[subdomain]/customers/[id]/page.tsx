"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Mail, Phone, MapPin, Calendar, ShoppingBag, CreditCard, ShieldAlert } from "lucide-react";

export default function CustomerDetailsPage() {
  const { subdomain, id } = useParams();
  const router = useRouter();

  // Mock data for the specific customer
  const customer = {
    id: id,
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 234 567 890",
    address: "123 Main St, New York, NY 10001",
    joined: "January 12, 2024",
    status: "Active",
    totalSpent: 1250.00,
    orders: [
      { id: "ORD-001", date: "2024-03-15", items: 3, total: 125.50, status: "Completed" },
      { id: "ORD-015", date: "2024-02-28", items: 1, total: 45.00, status: "Completed" },
      { id: "ORD-042", date: "2024-01-20", items: 5, total: 1079.50, status: "Completed" },
    ]
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-xl border border-border/50" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-muted-foreground">{customer.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle className="text-lg">Customer Profile</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-bold mb-4">
                  {customer.name[0]}
                </div>
                <h3 className="text-xl font-bold">{customer.name}</h3>
                <Badge className="mt-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-4 rounded-full">{customer.status}</Badge>
              </div>

              <div className="space-y-4 pt-6 border-t border-border/50">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{customer.email}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{customer.phone}</span>
                </div>
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span className="text-sm">{customer.address}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Joined {customer.joined}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6">
                <Button variant="outline" className="rounded-xl border-border/50 w-full">Edit</Button>
                <Button variant="destructive" className="rounded-xl w-full flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Flag
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Orders</span>
                <span className="font-bold">{customer.orders.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Spent</span>
                <span className="font-bold text-primary">${customer.totalSpent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Avg. Order Value</span>
                <span className="font-bold">${(customer.totalSpent / customer.orders.length).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="rounded-3xl border-border/50 bg-white shadow-sm overflow-hidden">
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Latest Order</p>
                      <h4 className="text-xl font-bold">{customer.orders[0].id}</h4>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none">{customer.orders[0].status}</Badge>
                </div>
             </Card>
             <Card className="rounded-3xl border-border/50 bg-white shadow-sm overflow-hidden">
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-600">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Payment Method</p>
                      <h4 className="text-xl font-bold">Visa **** 4242</h4>
                    </div>
                  </div>
                </div>
             </Card>
          </div>

          <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Order History</CardTitle>
              <Button variant="ghost" className="text-sm font-medium text-primary">View All</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 bg-muted/10">
                    <TableHead className="px-6 py-4">Order</TableHead>
                    <TableHead className="px-6 py-4">Date</TableHead>
                    <TableHead className="px-6 py-4">Items</TableHead>
                    <TableHead className="px-6 py-4">Status</TableHead>
                    <TableHead className="px-6 py-4 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.orders.map((order) => (
                    <TableRow key={order.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                      <TableCell className="px-6 py-4 font-mono text-sm">{order.id}</TableCell>
                      <TableCell className="px-6 py-4 text-muted-foreground">{order.date}</TableCell>
                      <TableCell className="px-6 py-4">{order.items} Items</TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 rounded-lg">{order.status}</Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-bold">${order.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
