"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MoreHorizontal, Eye, ShoppingCart, Clock, MousePointerClick, Mail, Calendar, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function UncompletedOrdersPage() {
  const { subdomain } = useParams();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUncompleted();
  }, [subdomain]);

  const fetchUncompleted = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQ);
      if (storeSnap.empty) return;
      const storeId = storeSnap.docs[0].id;

      const q = query(
        collection(db, "uncompleted_orders"),
        where("storeId", "==", storeId),
        where("ownerId", "==", user.uid),
        orderBy("lastUpdated", "desc")
      );
      const snap = await getDocs(q);
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Fetch Uncompleted Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(i => 
    i.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-amber-600 font-headline uppercase">Abandoned Checkouts</h1>
        <p className="text-muted-foreground">Monitor customers who started checkout but didn't complete the purchase.</p>
      </div>

      <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
        <Card className="rounded-3xl border-border/50 bg-white shadow-sm p-6 shrink-0 w-[280px] md:w-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Drafts</p>
              <h3 className="text-2xl font-black">{items.length}</h3>
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
              <h3 className="text-2xl font-black">${items.reduce((acc, i) => acc + (i.total || 0), 0).toFixed(2)}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search customer name..." 
            className="pl-10 rounded-2xl bg-white border-border/50 h-11 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="hidden md:block">
        <Card className="rounded-[32px] overflow-hidden border-border/50 bg-white shadow-xl shadow-slate-200/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50">
                  <TableHead className="py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Draft ID</TableHead>
                  <TableHead className="py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Customer Intent</TableHead>
                  <TableHead className="py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Cart Value</TableHead>
                  <TableHead className="py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Contact</TableHead>
                  <TableHead className="py-4 px-6 text-right font-bold uppercase tracking-widest text-[10px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-primary/5 transition-colors border-border/50">
                    <TableCell className="py-4 px-6 font-mono text-[10px] text-muted-foreground uppercase">{item.id.slice(0, 12)}</TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold">{item.customer?.fullName || "Anonymous"}</span>
                        <span className="text-[10px] text-slate-400">{item.items?.length || 0} items in cart</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 font-bold text-amber-600">${item.total?.toFixed(2)}</TableCell>
                    <TableCell className="py-4 px-6 text-xs text-muted-foreground">{item.customer?.phone || "No phone"}</TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl">
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px] border-border/50 shadow-xl">
                          <DropdownMenuItem className="gap-3 py-2.5 rounded-xl cursor-pointer font-medium text-primary">
                            <Mail className="w-4 h-4" /> Send Recovery Text
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 py-2.5 rounded-xl cursor-pointer">
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

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredItems.map((item) => (
          <Card key={item.id} className="rounded-3xl border-border/50 bg-white shadow-sm overflow-hidden p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Abandon Draft</span>
                  <h4 className="text-lg font-bold text-foreground">{item.customer?.fullName || "Anonymous Visitor"}</h4>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-none">Pending</Badge>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                 <div className="text-right flex-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Lost Sale Value</p>
                    <p className="text-xl font-black text-amber-600">${item.total?.toFixed(2)}</p>
                 </div>
                 <Button variant="outline" size="sm" className="rounded-xl ml-4 h-10 px-4 font-bold text-primary border-primary/20">Contact</Button>
              </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
