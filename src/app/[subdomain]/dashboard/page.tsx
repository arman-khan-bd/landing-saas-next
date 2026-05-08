"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy, onSnapshot } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  ShoppingBag, Wallet, Package, TrendingUp, Clock,
  WifiOff, RefreshCw, Loader2, Users, ArrowUpRight,
  ArrowDownRight, PieChart, Activity, ShoppingCart,
  CheckCircle2, XCircle, MoreVertical,
  Sparkles
} from "lucide-react";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from "@/components/ui/chart";
import {
  Bar, BarChart, XAxis, YAxis, ResponsiveContainer,
  Line, LineChart, CartesianGrid, Area, AreaChart,
  Pie, PieChart as RePieChart, Cell, Tooltip
} from "recharts";
import { Button } from "@/components/ui/button";
import { getCurrencySymbol, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

export default function StoreDashboard() {
  const { subdomain } = useParams();
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    customers: 0,
    aov: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [currency, setCurrency] = useState("BDT");
  const [orderDistribution, setOrderDistribution] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, [subdomain]);

  const fetchStats = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    setIsOffline(false);
    try {
      const storeQuery = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQuery);
      if (storeSnap.empty) {
        setLoading(false);
        return;
      }
      const storeData = storeSnap.docs[0].data();
      setCurrency(storeData.currency || "BDT");
      const storeId = storeSnap.docs[0].id;

      // Parallel data fetching
      const [prodSnap, orderSnap, customerSnap] = await Promise.all([
        getDocs(query(collection(db, "products"), where("storeId", "==", storeId))),
        getDocs(query(collection(db, "orders"), where("storeId", "==", storeId))),
        getDocs(query(collection(db, "customers"), where("storeId", "==", storeId)))
      ]);

      const allOrders = orderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      allOrders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      const totalRevenue = allOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
      const aov = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;

      // Status distribution
      const statusMap: any = {};
      allOrders.forEach(o => {
        const s = o.status || 'pending';
        statusMap[s] = (statusMap[s] || 0) + 1;
      });

      const distData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      setStats({
        products: prodSnap.size,
        orders: orderSnap.size,
        revenue: totalRevenue,
        customers: customerSnap.size,
        aov: aov
      });

      setOrderDistribution(distData);
      setRecentOrders(allOrders.slice(0, 10));
    } catch (error: any) {
      console.error("Dashboard Fetch Error:", error);
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        setIsOffline(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: "Mon", revenue: 4200, orders: 12 },
    { name: "Tue", revenue: 5800, orders: 18 },
    { name: "Wed", revenue: 3900, orders: 10 },
    { name: "Thu", revenue: 7200, orders: 24 },
    { name: "Fri", revenue: 6500, orders: 20 },
    { name: "Sat", revenue: 9100, orders: 32 },
    { name: "Sun", revenue: 8400, orders: 28 },
  ];

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Intelligence</p>
      </div>
    </div>
  );

  if (isOffline) return (
    <div className="flex h-screen items-center justify-center p-6 bg-slate-50">
      <Card className="max-w-md w-full rounded-[40px] border-none shadow-2xl p-10 text-center space-y-6 bg-white">
        <div className="w-20 h-20 bg-rose-50 rounded-[32px] flex items-center justify-center mx-auto text-rose-500 shadow-xl shadow-rose-500/10">
          <WifiOff className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Connectivity Lost</h3>
          <p className="text-sm text-slate-500 mt-2 font-medium">Your console is currently disconnected from the IHut networks. Real-time sync is paused.</p>
        </div>
        <Button onClick={fetchStats} className="w-full rounded-2xl gap-3 font-black h-14 bg-slate-950 text-white uppercase tracking-widest hover:scale-[1.02] transition-transform">
          <RefreshCw className="w-5 h-5" /> Reconnect Now
        </Button>
      </Card>
    </div>
  );

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'delivered') return <Badge className="bg-emerald-500/10 text-emerald-600 border-none rounded-lg text-[9px] font-black uppercase tracking-widest">Delivered</Badge>;
    if (s === 'processing' || s === 'shipped') return <Badge className="bg-indigo-500/10 text-indigo-600 border-none rounded-lg text-[9px] font-black uppercase tracking-widest">In Transit</Badge>;
    if (s === 'cancelled' || s === 'failed') return <Badge className="bg-rose-500/10 text-rose-600 border-none rounded-lg text-[9px] font-black uppercase tracking-widest">Failed</Badge>;
    return <Badge className="bg-amber-500/10 text-amber-600 border-none rounded-lg text-[9px] font-black uppercase tracking-widest">Pending</Badge>;
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Console Overview</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-500" /> Live analytics for {subdomain}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          <Button variant="outline" className="rounded-2xl h-10 sm:h-12 px-4 sm:px-6 border-slate-200 font-bold gap-2 text-slate-600 hover:bg-slate-50 shrink-0 text-xs">
            <Clock className="w-4 h-4" /> Last 30 Days
          </Button>
          <Button className="rounded-2xl h-10 sm:h-12 px-4 sm:px-6 bg-slate-950 text-white font-black uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-xl shadow-slate-950/20 shrink-0 text-xs">
            Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Total Revenue"
          value={`${getCurrencySymbol(currency)}${stats.revenue.toLocaleString()}`}
          trend="+12.5%"
          trendUp={true}
          icon={Wallet}
          color="indigo"
        />
        <MetricCard
          label="Orders"
          value={stats.orders}
          trend="+5.2%"
          trendUp={true}
          icon={ShoppingCart}
          color="emerald"
        />
        <MetricCard
          label="Active SKU"
          value={stats.products}
          trend="Stable"
          trendUp={true}
          icon={Package}
          color="amber"
        />
        <MetricCard
          label="Avg Order Value"
          value={`${getCurrencySymbol(currency)}${stats.aov.toFixed(0)}`}
          trend="-2.1%"
          trendUp={false}
          icon={TrendingUp}
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[48px] border-none shadow-2xl bg-white overflow-hidden group">
          <CardHeader className="p-6 sm:p-10 border-b border-slate-50 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="font-black text-lg sm:text-2xl text-slate-900 tracking-tight uppercase">Sales Trajectory</CardTitle>
              <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue Correlation</CardDescription>
            </div>
            <Badge className="bg-indigo-600 text-white border-none rounded-xl px-3 py-1 font-black text-[8px] sm:text-[10px] uppercase tracking-widest">Live</Badge>
          </CardHeader>
          <CardContent className="p-4 sm:p-10 h-[300px] sm:h-[450px]">
            <ChartContainer config={{
              revenue: { label: "Revenue", color: "#6366f1" },
              orders: { label: "Orders", color: "#10b981" }
            }}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} stroke="#64748b" dy={10} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#64748b" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981" }} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[48px] border-none shadow-2xl bg-white overflow-hidden">
          <CardHeader className="p-10 border-b border-slate-50">
            <CardTitle className="font-black text-2xl text-slate-900 tracking-tight uppercase">Status Mix</CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fulfillment Health Check</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={orderDistribution.length > 0 ? orderDistribution : [{ name: 'Empty', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {orderDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 space-y-4">
              {orderDistribution.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-xs font-bold text-slate-600 capitalize">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{((item.value / stats.orders) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[48px] border-none shadow-2xl bg-white overflow-hidden">
          <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="font-black text-2xl text-slate-900 tracking-tight uppercase">Active Logistics</CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Latest processing shipments</CardDescription>
            </div>
            <Button variant="ghost" className="rounded-xl font-bold text-indigo-600 hover:bg-indigo-50">View Registry</Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[450px]">
              <div className="p-10 space-y-4">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-20 opacity-20">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4" />
                    <p className="font-black uppercase tracking-widest text-xs">No Shipments Active</p>
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-slate-50 rounded-[24px] sm:rounded-3xl border border-slate-100 hover:scale-[1.01] transition-transform duration-300 gap-4">
                      <div className="flex items-center gap-4 sm:gap-5">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 text-slate-400 shrink-0">
                          <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 truncate text-sm sm:text-base">{order.customer?.fullName || "Verified Customer"}</p>
                          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            #{order.id.slice(0, 10)} <span className="w-1 h-1 bg-slate-300 rounded-full" /> {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), "MMM d") : "Live"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 border-t sm:border-none pt-3 sm:pt-0">
                        <div className="space-y-0.5 sm:space-y-1">
                          <p className="font-black text-lg sm:text-xl text-slate-900">{getCurrencySymbol(currency)}{order.total?.toFixed(2)}</p>
                          <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.paymentMethod || "Prepaid"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="hidden sm:block">
                            {getStatusBadge(order.status)}
                          </div>
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white text-slate-400">
                            <MoreVertical className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="rounded-[40px] border-none shadow-2xl bg-indigo-600 p-10 text-white space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-1000">
              <Sparkles className="w-32 h-32" />
            </div>
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-200">Growth Pulse</p>
              <h4 className="text-3xl font-black tracking-tight">{stats.customers} Customers</h4>
              <p className="text-sm text-indigo-100/70 font-medium">Your brand has acquired {stats.customers} unique customers to date.</p>
            </div>
            <Button className="w-full h-14 rounded-2xl bg-white text-indigo-600 font-black uppercase tracking-widest hover:bg-slate-50 shadow-xl shadow-indigo-900/20">
              Market Audience
            </Button>
          </Card>

          <Card className="rounded-[40px] border-none shadow-2xl bg-slate-900 p-10 text-white space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-black uppercase tracking-tight text-lg">System Health</h5>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Node Status</p>
              </div>
            </div>
            <div className="space-y-4">
              <HealthItem label="Storefront Sync" status="Optimal" />
              <HealthItem label="Database Latency" status="12ms" />
              <HealthItem label="Payment Gateway" status="Active" />
              <HealthItem label="CDN Propagation" status="Optimal" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend, trendUp, icon: Icon, color }: any) {
  const colors: any = {
    indigo: "bg-indigo-600/10 text-indigo-600 shadow-indigo-500/10",
    emerald: "bg-emerald-600/10 text-emerald-600 shadow-emerald-500/10",
    amber: "bg-amber-600/10 text-amber-600 shadow-amber-500/10",
    rose: "bg-rose-600/10 text-rose-600 shadow-rose-500/10"
  };

  return (
    <Card className="rounded-[32px] sm:rounded-[40px] border-none shadow-2xl bg-white p-6 sm:p-8 group hover:scale-[1.02] transition-all duration-500">
      <CardContent className="p-0 space-y-4 sm:space-y-6">
        <div className="flex justify-between items-start">
          <div className={cn("p-3 sm:p-4 rounded-2xl transition-transform group-hover:scale-110", colors[color])}>
            <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest",
            trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        </div>
        <div className="space-y-0.5 sm:space-y-1">
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthItem({ label, status }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{status}</span>
      </div>
    </div>
  );
}
