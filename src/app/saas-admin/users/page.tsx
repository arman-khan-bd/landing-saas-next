
"use client";

import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, MoreHorizontal, User, Mail, Shield, 
  Filter, MoreVertical, BadgeCheck, Loader2
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsers() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (firestore) fetchUsers();
  }, [firestore]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(firestore, "users"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (userId: string, currentRole: string) => {
    if (!firestore) return;
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(firestore, "users", userId), { role: newRole });
      toast({ title: "Role Updated", description: `User is now a ${newRole}.` });
      fetchUsers();
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search platform users..." 
            className="pl-12 rounded-2xl bg-slate-900 border-white/5 h-12 text-slate-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl border-white/5 bg-slate-900 text-slate-400 h-12">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
          <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-12 font-bold px-6">
            Export Users
          </Button>
        </div>
      </div>

      <Card className="rounded-[40px] border-white/5 bg-slate-900 overflow-hidden shadow-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="py-5 px-8 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Identitiy</TableHead>
                <TableHead className="py-5 px-8 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Role</TableHead>
                <TableHead className="py-5 px-8 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Status</TableHead>
                <TableHead className="py-5 px-8 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Joined</TableHead>
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
              ) : filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                  <TableCell className="py-5 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-black text-indigo-400 border border-white/5">
                        {user.fullName?.[0] || user.email?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">{user.fullName || "Unnamed User"}</span>
                        <span className="text-xs text-slate-500">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-8">
                     <Badge className={`rounded-lg border-none px-3 py-1 font-bold text-[10px] uppercase tracking-widest ${
                       user.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                     }`}>
                       {user.role || 'user'}
                     </Badge>
                  </TableCell>
                  <TableCell className="py-5 px-8">
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-xs font-bold text-emerald-500">Active</span>
                     </div>
                  </TableCell>
                  <TableCell className="py-5 px-8 text-slate-400 text-sm">
                    {user.createdAt?.toDate?.()?.toLocaleDateString() || "New"}
                  </TableCell>
                  <TableCell className="py-5 px-8 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/10 text-slate-400">
                          <MoreHorizontal className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[200px] bg-slate-900 border-white/10 shadow-2xl text-slate-200">
                        <DropdownMenuItem className="gap-3 py-3 rounded-xl cursor-pointer" onClick={() => toggleAdmin(user.id, user.role)}>
                          <Shield className="w-4 h-4 text-indigo-400" /> {user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 py-3 rounded-xl cursor-pointer">
                          <Mail className="w-4 h-4 text-slate-400" /> Email User
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 py-3 rounded-xl cursor-pointer text-rose-500">
                          <BadgeCheck className="w-4 h-4" /> Suspend Account
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
