
"use client";

import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase/provider";
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, ExternalLink, Store, Trash2, 
  Globe, AlertTriangle, MoreHorizontal, Loader2
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getStoreUrl } from "@/lib/utils";

export default function AdminShops() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (firestore) fetchShops();
  }, [firestore]);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const q = query(collection(firestore, "stores"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setShops(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this shop permanently? All products and pages will be lost.")) return;
    try {
      await deleteDoc(doc(firestore!, "stores", id));
      toast({ title: "Shop Removed", description: "The store has been purged from the system." });
      fetchShops();
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const handleToggleSuspend = async (shop: any) => {
    const isSuspending = shop.status !== "suspended";
    const actionText = isSuspending ? "Suspend" : "Reactivate";
    if (!confirm(`Are you sure you want to ${actionText} this shop?`)) return;
    
    try {
      await updateDoc(doc(firestore!, "stores", shop.id), {
        status: isSuspending ? "suspended" : "active",
        suspendedAt: isSuspending ? new Date() : null
      });
      toast({ title: `Shop ${isSuspending ? 'Suspended' : 'Activated'}` });
      fetchShops();
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const filteredShops = shops.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.subdomain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search stores and domains..." 
            className="pl-12 rounded-2xl bg-slate-900 border-white/5 h-12 text-slate-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="rounded-[40px] border-white/5 bg-slate-900 overflow-hidden shadow-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="py-5 px-8 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Brand / Store</TableHead>
                <TableHead className="py-5 px-8 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Domain</TableHead>
                <TableHead className="py-5 px-8 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Owner ID</TableHead>
                <TableHead className="py-5 px-8 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Status</TableHead>
                <TableHead className="py-5 px-8 text-right text-slate-400 font-bold uppercase tracking-widest text-[10px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                  </TableCell>
                </TableRow>
              ) : filteredShops.map((shop) => (
                <TableRow key={shop.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                  <TableCell className="py-5 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/5">
                        {shop.logo ? <img src={shop.logo} className="w-full h-full object-cover rounded-2xl" /> : <Store className="w-6 h-6 text-indigo-400" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">{shop.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {shop.id.slice(0, 12)}...</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-8">
                     <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                        <Globe className="w-3.5 h-3.5" />
                        {shop.subdomain}.ihut.shop
                     </div>
                  </TableCell>
                  <TableCell className="py-5 px-8 font-mono text-xs text-slate-500">
                    {shop.ownerId?.slice(0, 10)}...
                  </TableCell>
                  <TableCell className="py-5 px-8">
                     {shop.status === "suspended" ? (
                       <Badge className="bg-rose-600/10 text-rose-500 border-none rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest">
                         Suspended
                       </Badge>
                     ) : (
                       <Badge className="bg-emerald-600/10 text-emerald-500 border-none rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest">
                         Active
                       </Badge>
                     )}
                  </TableCell>
                  <TableCell className="py-5 px-8 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/10 text-slate-400">
                          <MoreHorizontal className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[200px] bg-slate-900 border-white/10 shadow-2xl text-slate-200">
                        <DropdownMenuItem className="gap-3 py-3 rounded-xl cursor-pointer" asChild>
                          <a href={getStoreUrl(shop.subdomain)} target="_blank">
                             <ExternalLink className="w-4 h-4 text-indigo-400" /> View Live Site
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-3 py-3 rounded-xl cursor-pointer"
                          onClick={() => handleToggleSuspend(shop)}
                        >
                          <AlertTriangle className={shop.status === 'suspended' ? 'w-4 h-4 text-emerald-500' : 'w-4 h-4 text-amber-500'} /> 
                          {shop.status === 'suspended' ? 'Reactivate Shop' : 'Suspend Shop'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 py-3 rounded-xl cursor-pointer text-rose-500" onClick={() => handleDelete(shop.id)}>
                          <Trash2 className="w-4 h-4" /> Purge Store
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
