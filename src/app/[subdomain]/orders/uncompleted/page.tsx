
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MoreHorizontal, Eye, ShoppingCart, Clock, Mail, Loader2, ArrowRight, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn, getCurrencySymbol } from "@/lib/utils";

export default function UncompletedOrdersPage() {
  const { subdomain } = useParams();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currency, setCurrency] = useState("BDT");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      const storeData = storeSnap.docs[0].data();
      setCurrency(storeData.currency || "BDT");
      const storeId = storeSnap.docs[0].id;

      const q = query(
        collection(db, "uncompleted_orders"),
        where("storeId", "==", storeId),
        where("ownerId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      docs.sort((a, b) => (b.lastUpdated?.seconds || 0) - (a.lastUpdated?.seconds || 0));

      setItems(docs);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col gap-1 sm:gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase font-headline">Abandoned Checkouts</h1>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 sm:hidden border border-slate-100" onClick={fetchUncompleted}>
            <Loader2 className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>
        <p className="text-[10px] sm:text-sm text-muted-foreground font-medium uppercase tracking-wider opacity-70">Monitor customers who started checkout but didn't complete the purchase.</p>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <ShoppingCart className="w-12 h-12 text-amber-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Active Drafts</p>
          <h3 className="text-2xl font-black text-slate-900">{items.length}</h3>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[9px] font-bold text-amber-600 uppercase">Recovery Opportunity</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Clock className="w-12 h-12 text-blue-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Potential Revenue</p>
          <h3 className="text-2xl font-black text-slate-900">{getCurrencySymbol(currency)}{items.reduce((acc, i) => acc + (i.total || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[9px] font-bold text-blue-600 uppercase">Estimated Value</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search customer name..."
            className="pl-11 rounded-2xl bg-white border-slate-100 h-12 shadow-sm text-sm font-medium focus:ring-2 focus:ring-amber-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <Card className="rounded-[40px] overflow-hidden border-none bg-white shadow-2xl shadow-slate-200/60">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="py-5 px-8 font-black uppercase tracking-[0.2em] text-[9px] text-slate-400">Draft Identifier</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-[0.2em] text-[9px] text-slate-400">Customer Intent</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-[0.2em] text-[9px] text-slate-400">Cart Value</TableHead>
                  <TableHead className="py-5 px-8 font-black uppercase tracking-[0.2em] text-[9px] text-slate-400">Contact</TableHead>
                  <TableHead className="py-5 px-8 text-right font-black uppercase tracking-[0.2em] text-[9px] text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-amber-50/50 transition-colors border-slate-100 group cursor-pointer" onClick={() => router.push(`/${subdomain}/orders/uncompleted/${item.id}`)}>
                    <TableCell className="py-5 px-8 font-mono text-[10px] text-slate-400 uppercase font-black group-hover:text-amber-600 transition-colors tracking-widest">{item.id.slice(0, 12)}</TableCell>
                    <TableCell className="py-5 px-8">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-sm">{item.customer?.fullName || "Anonymous Visitor"}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.items?.length || 0} items staged</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-8">
                      <span className="font-black text-amber-600 text-sm">{getCurrencySymbol(currency)}{item.total?.toFixed(2)}</span>
                    </TableCell>
                    <TableCell className="py-5 px-8 text-xs font-bold text-slate-500">{item.customer?.phone || "No record"}</TableCell>
                    <TableCell className="py-5 px-8 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-white hover:shadow-md transition-all" onClick={() => router.push(`/${subdomain}/orders/uncompleted/${item.id}`)}>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  PAGE {currentPage} OF {totalPages} • {filteredItems.length} DRAFTS
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
        {paginatedItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 flex flex-col gap-4 active:scale-[0.98] transition-all duration-200 relative overflow-hidden"
            onClick={() => router.push(`/${subdomain}/orders/uncompleted/${item.id}`)}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 -rotate-45 translate-x-12 -translate-y-12" />

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow-xl shadow-amber-500/20 shrink-0">
                  {item.customer?.fullName?.[0] || "?"}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-0.5">Abandoned Draft</span>
                  <h4 className="font-black text-slate-900 truncate text-sm">{item.customer?.fullName || "Anonymous Visitor"}</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">
                    {item.items?.length || 0} ITEMS • {item.customer?.phone || "NO PHONE"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Potential Sale</p>
                <p className="text-xl font-black text-slate-900">{getCurrencySymbol(currency)}{item.total?.toFixed(2)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400"
              >
                <ChevronRight className="w-5 h-5 text-amber-600" />
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
              Total {filteredItems.length} Abandoned Drafts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
