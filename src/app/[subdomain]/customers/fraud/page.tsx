"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MoreHorizontal, ShieldAlert, AlertTriangle, Trash2, CheckCircle, Fingerprint, MoreVertical, Calendar } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const MOCK_FRAUD = [
  { id: "CUST-999", name: "Spammer Jack", email: "jack@bot.com", reason: "Multiple fake accounts", risk: "Critical", date: "2024-03-10", ip: "192.168.1.50" },
  { id: "CUST-888", name: "Carder Sam", email: "sam@burner.com", reason: "Payment chargeback history", risk: "High", date: "2024-03-12", ip: "45.2.19.22" },
  { id: "CUST-777", name: "Proxy User", email: "proxy@vpn.com", reason: "Order from high-risk country", risk: "Medium", date: "2024-03-14", ip: "103.11.23.5" },
];

export default function FraudListPage() {
  const { subdomain } = useParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const getRiskBadge = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'critical': return <Badge className="bg-rose-600 text-white border-none rounded-lg px-3 py-1 font-bold">CRITICAL</Badge>;
      case 'high': return <Badge className="bg-rose-100 text-rose-600 border-none rounded-lg px-3 py-1 font-bold">HIGH</Badge>;
      default: return <Badge className="bg-amber-100 text-amber-600 border-none rounded-lg px-3 py-1 font-bold">MEDIUM</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
          <h1 className="text-3xl font-bold tracking-tight text-rose-500">Fraud List</h1>
        </div>
        <p className="text-muted-foreground">Monitor and manage flagged customers and suspicious transactions.</p>
      </div>

      <div className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
        <Card className="rounded-3xl border-rose-100 bg-rose-50/30 p-6 shadow-sm shrink-0 w-[240px] md:w-auto">
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Flagged</p>
             <h3 className="text-3xl font-black text-rose-700">12</h3>
          </div>
        </Card>
        <Card className="rounded-3xl border-border/50 bg-white p-6 shadow-sm shrink-0 w-[240px] md:w-auto">
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Blocked IPs</p>
             <h3 className="text-3xl font-black">42</h3>
          </div>
        </Card>
        <Card className="rounded-3xl border-border/50 bg-white p-6 shadow-sm shrink-0 w-[240px] md:w-auto">
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stopped</p>
             <h3 className="text-3xl font-black">8</h3>
          </div>
        </Card>
        <Card className="rounded-3xl border-border/50 bg-white p-6 shadow-sm shrink-0 w-[240px] md:w-auto">
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Scrutiny</p>
             <h3 className="text-3xl font-black text-emerald-600">Active</h3>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search fraud list..." 
            className="pl-10 rounded-2xl bg-white border-border/50 h-11 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="rounded-2xl h-11 px-6 bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 font-bold shadow-lg shadow-rose-200/50">
          <AlertTriangle className="w-4 h-4" /> Block Entity
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card className="rounded-[32px] overflow-hidden border-rose-100 bg-white shadow-xl shadow-rose-200/20">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-rose-50/50">
                <TableRow className="border-rose-100">
                  <TableHead className="py-4 px-6 text-rose-900 font-bold">Customer</TableHead>
                  <TableHead className="py-4 px-6 text-rose-900 font-bold">Reason</TableHead>
                  <TableHead className="py-4 px-6 text-rose-900 font-bold">Risk Level</TableHead>
                  <TableHead className="py-4 px-6 text-rose-900 font-bold">Metadata</TableHead>
                  <TableHead className="py-4 px-6 text-right text-rose-900 font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_FRAUD.map((item) => (
                  <TableRow key={item.id} className="hover:bg-rose-50 transition-colors border-rose-100 group">
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-rose-700">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.email}</span>
                        <span className="text-[10px] font-mono mt-1 text-slate-400">{item.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 max-w-xs">
                      <p className="text-sm text-foreground leading-relaxed italic">&ldquo;{item.reason}&rdquo;</p>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      {getRiskBadge(item.risk)}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5"><Fingerprint className="w-3 h-3" /> {item.ip}</div>
                        <div className="flex items-center gap-1.5"><ShieldAlert className="w-3 h-3" /> {item.date}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-rose-100 hover:text-rose-600">
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px] border-rose-100 shadow-xl shadow-rose-200/40">
                          <DropdownMenuItem className="gap-3 rounded-xl py-2.5 cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50">
                            <CheckCircle className="w-4 h-4" /> Resolve & Clear
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 rounded-xl py-2.5 cursor-pointer font-bold text-rose-600 focus:text-rose-700 focus:bg-rose-50">
                            <Trash2 className="w-4 h-4" /> Purge Account
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

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {MOCK_FRAUD.map((item) => (
          <Card key={item.id} className="rounded-3xl border-rose-100 bg-white shadow-sm overflow-hidden">
            <CardContent className="p-5 space-y-4">
               <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">{item.id}</span>
                    <h4 className="text-lg font-bold text-rose-700">{item.name}</h4>
                    <span className="text-xs text-muted-foreground">{item.email}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px]">
                      <DropdownMenuItem className="gap-3 py-3 rounded-xl text-emerald-600">
                        <CheckCircle className="w-4 h-4" /> Clear Flag
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-3 py-3 rounded-xl text-rose-600 font-bold">
                        <Trash2 className="w-4 h-4" /> Purge
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
               </div>

               <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50">
                  <p className="text-[10px] text-rose-800/60 uppercase font-black tracking-widest mb-1">Reason for Flagging</p>
                  <p className="text-sm text-rose-900 leading-relaxed italic">&ldquo;{item.reason}&rdquo;</p>
               </div>

               <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-col gap-1">
                     <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Fingerprint className="w-3 h-3" /> {item.ip}
                     </div>
                     <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" /> {item.date}
                     </div>
                  </div>
                  {getRiskBadge(item.risk)}
               </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100 flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-1" />
        <div className="space-y-1">
          <h4 className="font-bold text-rose-800">Fraud Prevention Notice</h4>
          <p className="text-sm text-rose-700/80 leading-relaxed">
            Flagging a customer will restrict their ability to place new orders. Purging will delete all record of the identity while keeping transaction IDs for tax compliance. Use with caution.
          </p>
        </div>
      </div>
    </div>
  );
}
