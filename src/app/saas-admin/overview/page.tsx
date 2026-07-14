"use client";

import { useEffect, useState } from "react";
import { useSupabaseClient } from "@/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Store, CreditCard, TrendingUp, ShieldAlert, Globe, Clock } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Bar, BarChart, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { Loader2 } from "lucide-react";

export default function AdminOverview() {
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    stores: 0,
    mrr: 0,
    activeSubs: 0,
    pendingTransactions: 0,
    pendingDomains: 0,
    totalRevenue: 0,
  });
  const [recentStores, setRecentStores] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel("admin-overview-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "saas_transactions" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "stores" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, fetchAll)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [usersRes, storesRes, subsRes, pendingTxRes, pendingDomRes, approvedTxRes, recentStoresRes] =
        await Promise.all([
          supabase.from("users").select("id, created_at", { count: "exact" }),
          supabase.from("stores").select("id, created_at", { count: "exact" }),
          supabase.from("subscriptions").select("id", { count: "exact" }).eq("status", "active"),
          supabase.from("saas_transactions").select("id", { count: "exact" }).eq("status", "pending"),
          supabase.from("custom_domain_requests").select("id", { count: "exact" }).eq("status", "pending"),
          supabase.from("saas_transactions").select("amount").eq("status", "confirmed"),
          supabase.from("stores").select("id, name, subdomain, logo, created_at").order("created_at", { ascending: false }).limit(5),
        ]);

      const totalRevenue = (approvedTxRes.data ?? []).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

      // Build 7-day growth chart from stores and users created_at
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const day = subDays(new Date(), 6 - i);
        const label = format(day, "MMM dd");
        const dayStr = format(day, "yyyy-MM-dd");
        const usersCount = (usersRes.data ?? []).filter((u: any) =>
          u.created_at?.startsWith(dayStr)
        ).length;
        const storesCount = (storesRes.data ?? []).filter((s: any) =>
          s.created_at?.startsWith(dayStr)
        ).length;
        return { name: label, users: usersCount, stores: storesCount };
      });

      // Build monthly revenue chart
      const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
        const d = subDays(new Date(), (5 - i) * 30);
        const month = format(d, "MMM");
        const revenue = (approvedTxRes.data ?? []).filter((t: any) =>
          t.created_at?.startsWith(format(d, "yyyy-MM"))
        ).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
        return { name: month, revenue };
      });

      setStats({
        users: usersRes.count ?? 0,
        stores: storesRes.count ?? 0,
        mrr: totalRevenue,
        activeSubs: subsRes.count ?? 0,
        pendingTransactions: pendingTxRes.count ?? 0,
        pendingDomains: pendingDomRes.count ?? 0,
        totalRevenue,
      });
      setRecentStores(recentStoresRes.data ?? []);
      setGrowthData(last7);
      setRevenueData(monthlyRevenue);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Users" value={stats.users} icon={Users} trend={`${stats.users} registered`} color="indigo" />
        <StatCard label="Active Stores" value={stats.stores} icon={Store} trend={`${stats.stores} launched`} color="emerald" />
        <StatCard label="Total Revenue" value={`৳${stats.totalRevenue.toLocaleString()}`} icon={TrendingUp} trend={`${stats.activeSubs} active subs`} color="violet" />
        <StatCard label="Pending Reviews" value={stats.pendingTransactions + stats.pendingDomains} icon={ShieldAlert} trend={`${stats.pendingDomains} domains, ${stats.pendingTransactions} payments`} color="rose" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-slate-900 border-white/5 rounded-[40px] overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
            <CardTitle className="text-2xl font-black text-white">Platform Growth</CardTitle>
            <CardDescription className="text-slate-500">Daily user and store signups (last 7 days)</CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[300px]">
            <ChartContainer config={{ users: { label: "Users", color: "#6366f1" }, stores: { label: "Stores", color: "#10b981" } }}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="users" stroke="var(--color-users)" strokeWidth={3} dot={{ r: 5, fill: "var(--color-users)" }} />
                <Line type="monotone" dataKey="stores" stroke="var(--color-stores)" strokeWidth={3} dot={{ r: 5, fill: "var(--color-stores)" }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-white/5 rounded-[40px] overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
            <CardTitle className="text-2xl font-black text-white">Revenue (6mo)</CardTitle>
            <CardDescription className="text-slate-500">Confirmed transaction revenue</CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[300px]">
            <ChartContainer config={{ revenue: { label: "Revenue", color: "#8b5cf6" } }}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Stores */}
      <Card className="bg-slate-900 border-white/5 rounded-[40px] overflow-hidden">
        <CardHeader className="p-8 border-b border-white/5">
          <CardTitle className="text-xl font-black text-white">Recently Launched Stores</CardTitle>
          <CardDescription className="text-slate-500">Latest stores registered on the platform</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {recentStores.length === 0 ? (
            <div className="text-center py-12 text-slate-600 font-bold uppercase text-xs tracking-widest">No stores yet</div>
          ) : (
            <div className="space-y-4">
              {recentStores.map((store) => (
                <div key={store.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 shrink-0">
                      {store.logo ? (
                        <img src={store.logo} className="w-full h-full object-cover rounded-xl" alt="" />
                      ) : (
                        <Store className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">{store.name}</p>
                      <p className="text-[10px] text-indigo-400 font-mono">{store.subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'ihut.shop'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {store.created_at ? format(new Date(store.created_at), "MMM dd, yyyy") : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, color }: any) {
  const colors: any = {
    indigo: "bg-indigo-600/10 text-indigo-500",
    emerald: "bg-emerald-600/10 text-emerald-500",
    violet: "bg-violet-600/10 text-violet-500",
    rose: "bg-rose-600/10 text-rose-500",
  };
  return (
    <Card className="bg-slate-900 border-white/5 rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl ${colors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <h3 className="text-3xl font-black text-white">{value}</h3>
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">{trend}</p>
        </div>
      </CardContent>
    </Card>
  );
}
