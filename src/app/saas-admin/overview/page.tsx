
"use client";

import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Store, CreditCard, TrendingUp, Package, Globe, ShieldAlert } from "lucide-react";
import { 
  ChartContainer, ChartTooltip, ChartTooltipContent 
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Line, LineChart, CartesianGrid } from "recharts";

export default function AdminOverview() {
  const firestore = useFirestore();
  const [stats, setStats] = useState({
    users: 0,
    stores: 0,
    mrr: 12500, // Mocked for Saas admin
    activeSubs: 42
  });

  useEffect(() => {
    if (firestore) {
      const fetchData = async () => {
        const usersSnap = await getDocs(collection(firestore, "users"));
        const storesSnap = await getDocs(collection(firestore, "stores"));
        setStats(prev => ({
          ...prev,
          users: usersSnap.size,
          stores: storesSnap.size
        }));
      };
      fetchData();
    }
  }, [firestore]);

  const growthData = [
    { name: "Week 1", users: 120, shops: 40 },
    { name: "Week 2", users: 150, shops: 45 },
    { name: "Week 3", users: 200, shops: 52 },
    { name: "Week 4", users: 280, shops: 60 },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Users" 
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
          label="Platform MRR" 
          value={`$${stats.mrr.toLocaleString()}`} 
          icon={TrendingUp} 
          trend="+8% growth"
          color="violet"
        />
        <StatCard 
          label="Pro Subscriptions" 
          value={stats.activeSubs} 
          icon={ShieldAlert} 
          trend="+3 today"
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-slate-900 border-white/5 rounded-[40px] overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
            <CardTitle className="text-2xl font-black">Platform Growth</CardTitle>
            <CardDescription className="text-slate-500">Weekly user and store acquisition</CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
             <ChartContainer config={{ 
               users: { label: "Users", color: "#6366f1" },
               shops: { label: "Shops", color: "#10b981" }
             }}>
               <LineChart data={growthData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                 <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                 <ChartTooltip content={<ChartTooltipContent />} />
                 <Line type="monotone" dataKey="users" stroke="var(--color-users)" strokeWidth={4} dot={{ r: 6, fill: "var(--color-users)" }} />
                 <Line type="monotone" dataKey="shops" stroke="var(--color-shops)" strokeWidth={4} dot={{ r: 6, fill: "var(--color-shops)" }} />
               </LineChart>
             </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-white/5 rounded-[40px] overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
            <CardTitle className="text-2xl font-black">System Status</CardTitle>
            <CardDescription className="text-slate-500">Live platform performance</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
             <StatusItem label="API Infrastructure" status="Operational" />
             <StatusItem label="Database Clusters" status="Operational" />
             <StatusItem label="Search Indexing" status="Operational" />
             <StatusItem label="Cloudinary Assets" status="Operational" />
             <StatusItem label="Subdomain Routing" status="Degraded" warning />
             <div className="pt-6">
                <div className="bg-indigo-600/10 border border-indigo-600/20 rounded-2xl p-6 text-center">
                   <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Maintenance Window</p>
                   <p className="text-sm font-medium">Sunday, 02:00 AM UTC</p>
                </div>
             </div>
          </CardContent>
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
    <Card className="bg-slate-900 border-white/5 rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl ${colors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{trend}</span>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <h3 className="text-3xl font-black">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusItem({ label, status, warning = false }: any) {
  return (
    <div className="flex items-center justify-between">
       <span className="text-sm text-slate-400 font-medium">{label}</span>
       <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${warning ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${warning ? 'text-amber-500' : 'text-emerald-500'}`}>{status}</span>
       </div>
    </div>
  );
}
