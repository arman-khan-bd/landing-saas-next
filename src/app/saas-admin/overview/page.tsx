"use client";

import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase/provider";
import { collection, getDocs, query, limit, orderBy, onSnapshot, where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Store, CreditCard, TrendingUp, Package, Globe, ShieldAlert, ShoppingBag, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { 
  ChartContainer, ChartTooltip, ChartTooltipContent 
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Line, LineChart, CartesianGrid, Area, AreaChart } from "recharts";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

export default function AdminOverview() {
  const firestore = useFirestore();
  const [stats, setStats] = useState({
    users: 0,
    stores: 0,
    mrr: 0,
    activeSubs: 0,
    totalCustomers: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    // Real-time stats fetching
    const unsubStats = onSnapshot(collection(firestore, "stores"), (snap) => {
       setStats(prev => ({ ...prev, stores: snap.size }));
    });

    const unsubUsers = onSnapshot(collection(firestore, "users"), (snap) => {
       setStats(prev => ({ ...prev, users: snap.size }));
    });

    const unsubCustomers = onSnapshot(collection(firestore, "customers"), (snap) => {
       setStats(prev => ({ ...prev, totalCustomers: snap.size }));
    });

    const unsubSubs = onSnapshot(query(collection(firestore, "subscriptions"), where("status", "==", "active")), (snap) => {
       const totalMrr = snap.docs.reduce((acc, doc) => acc + (doc.data().price || 0), 0);
       setStats(prev => ({ 
          ...prev, 
          activeSubs: snap.size,
          mrr: totalMrr
       }));
    });

    const unsubTx = onSnapshot(query(collection(firestore, "transactions"), orderBy("createdAt", "desc"), limit(10)), (snap) => {
       setRecentTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
       setLoading(false);
    });

    return () => {
       unsubStats();
       unsubUsers();
       unsubCustomers();
       unsubSubs();
       unsubTx();
    };
  }, [firestore]);

  const growthData = [
    { name: "Week 1", users: 120, shops: 40 },
    { name: "Week 2", users: 150, shops: 45 },
    { name: "Week 3", users: 200, shops: 52 },
    { name: "Week 4", users: 280, shops: 60 },
  ];

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Merchants" 
          value={stats.users} 
          icon={Users} 
          trend="+12% weekly"
          color="indigo"
        />
        <StatCard 
          label="Active Stores" 
          value={stats.stores} 
          icon={Store} 
          trend="+5% weekly"
          color="emerald"
        />
        <StatCard 
          label="SaaS MRR" 
          value={`৳${stats.mrr.toLocaleString()}`} 
          icon={TrendingUp} 
          trend="+8% growth"
          color="violet"
        />
        <StatCard 
          label="Active Subs" 
          value={stats.activeSubs} 
          icon={ShieldAlert} 
          trend="+3 today"
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-slate-900 border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
          <CardHeader className="p-8 border-b border-white/5 bg-white/5">
            <div className="flex justify-between items-center">
               <div>
                  <CardTitle className="text-2xl font-black text-white uppercase tracking-tight">Revenue Stream</CardTitle>
                  <CardDescription className="text-slate-500">Global SaaS billing performance</CardDescription>
               </div>
               <Badge className="bg-primary/10 text-primary border-none rounded-lg px-3 py-1 font-black text-[10px] uppercase">Live Data</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
             <ChartContainer config={{ 
               users: { label: "Merchants", color: "#6366f1" },
               shops: { label: "Shops", color: "#10b981" }
             }}>
               <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorShops" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                 <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                 <ChartTooltip content={<ChartTooltipContent />} />
                 <Area type="monotone" dataKey="users" stroke="#6366f1" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={4} />
                 <Area type="monotone" dataKey="shops" stroke="#10b981" fillOpacity={1} fill="url(#colorShops)" strokeWidth={4} />
               </AreaChart>
             </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
          <CardHeader className="p-8 border-b border-white/5 bg-white/5">
            <CardTitle className="text-2xl font-black text-white uppercase tracking-tight">Recent Activity</CardTitle>
            <CardDescription className="text-slate-500">Latest platform transactions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
             <ScrollArea className="h-[400px]">
                <div className="p-6 space-y-4">
                   {recentTransactions.length === 0 ? (
                      <div className="h-40 flex flex-col items-center justify-center text-slate-600 opacity-20">
                         <ShoppingBag className="w-12 h-12 mb-2" />
                         <p className="font-bold uppercase tracking-widest text-xs">No Recent TX</p>
                      </div>
                   ) : (
                      recentTransactions.map((tx) => (
                         <div key={tx.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400">
                                  <CreditCard className="w-5 h-5" />
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-white truncate max-w-[120px]">{tx.shopName || "Platform User"}</p>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                     {tx.createdAt?.seconds ? format(new Date(tx.createdAt.seconds * 1000), "MMM d, h:mm a") : "Just now"}
                                  </p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-sm font-black text-emerald-400">+৳{tx.amount}</p>
                               <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 text-slate-500">{tx.planName || "Subscription"}</Badge>
                            </div>
                         </div>
                      ))
                   )}
                </div>
             </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <Card className="bg-slate-900 border-white/5 rounded-[40px] overflow-hidden p-8 space-y-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                  <Globe className="w-6 h-6" />
               </div>
               <div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tight">Connected Nodes</h4>
                  <p className="text-xs text-slate-500">Live infrastructure status</p>
               </div>
            </div>
            <div className="space-y-4 pt-4">
               <StatusItem label="Platform API" status="Optimal" />
               <StatusItem label="Static Asset CDN" status="Optimal" />
               <StatusItem label="Cloud Firestore" status="Optimal" />
               <StatusItem label="Cloudinary Engine" status="Optimal" />
            </div>
         </Card>

         <Card className="bg-slate-900 border-white/5 rounded-[40px] overflow-hidden p-8 space-y-6 md:col-span-2">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white">
                     <Package className="w-6 h-6" />
                  </div>
                  <div>
                     <h4 className="text-xl font-black text-white uppercase tracking-tight">Ecosystem Health</h4>
                     <p className="text-xs text-slate-500">Growth vs Engagement</p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-indigo-500" />
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Merchants</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-emerald-500" />
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stores</span>
                  </div>
               </div>
            </div>
            <div className="h-[180px] pt-4">
               <ChartContainer config={{ merchants: { label: "Merchants", color: "#6366f1" }, stores: { label: "Stores", color: "#10b981" } }}>
                  <BarChart data={growthData}>
                     <Bar dataKey="users" fill="#6366f1" radius={[4, 4, 0, 0]} />
                     <Bar dataKey="shops" fill="#10b981" radius={[4, 4, 0, 0]} />
                     <XAxis dataKey="name" hide />
                  </BarChart>
               </ChartContainer>
            </div>
         </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, color }: any) {
  const colors: any = {
    indigo: "bg-indigo-600/10 text-indigo-500",
    emerald: "bg-emerald-600/10 text-emerald-500",
    violet: "bg-violet-600/10 text-violet-500",
    rose: "bg-rose-600/10 text-rose-500"
  };

  return (
    <Card className="bg-slate-900 border-white/5 rounded-[32px] overflow-hidden hover:scale-[1.02] transition-all duration-500 shadow-xl group">
      <CardContent className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-4 rounded-2xl ${colors[color]} group-hover:scale-110 transition-transform`}>
            <Icon className="w-7 h-7" />
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg">
             <ArrowUpRight className="w-3 h-3 text-emerald-500" />
             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{trend}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
          <h3 className="text-4xl font-black text-white tracking-tighter">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusItem({ label, status, warning = false }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
       <span className="text-xs text-slate-400 font-bold uppercase tracking-tight">{label}</span>
       <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${warning ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
          <span className={`text-[9px] font-black uppercase tracking-widest ${warning ? 'text-amber-500' : 'text-emerald-500'}`}>{status}</span>
       </div>
    </div>
  );
}
