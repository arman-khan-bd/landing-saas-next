"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShoppingBag, Wallet, Package, TrendingUp, Clock, WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { getCurrencySymbol } from "@/lib/utils";

export default function StoreDashboard() {
  const { subdomain } = useParams();
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [currency, setCurrency] = useState("BDT");

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

      const [prodSnap, orderSnap] = await Promise.all([
        getDocs(query(collection(db, "products"), where("storeId", "==", storeId))),
        getDocs(query(
          collection(db, "orders"),
          where("storeId", "==", storeId),
          where("ownerId", "==", user.uid)
        ))
      ]);

      const allOrders = orderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      allOrders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      const totalRevenue = allOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);

      setStats({
        products: prodSnap.size,
        orders: orderSnap.size,
        revenue: totalRevenue
      });

      setRecentOrders(allOrders.slice(0, 5));
    } catch (error: any) {
      console.error("Dashboard Fetch Error:", error);
      // Detect offline error specifically
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        setIsOffline(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: "Week 1", total: stats.revenue * 0.2 },
    { name: "Week 2", total: stats.revenue * 0.3 },
    { name: "Week 3", total: stats.revenue * 0.1 },
    { name: "Week 4", total: stats.revenue * 0.4 },
  ];

  const chartConfig = {
    total: {
      label: "Revenue",
      color: "hsl(var(--primary))",
    },
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Syncing Intelligence</p>
      </div>
    </div>
  );

  if (isOffline) return (
    <div className="flex h-96 items-center justify-center p-6">
      <Card className="max-w-md w-full rounded-[32px] border-dashed border-2 p-10 text-center space-y-6">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
          <WifiOff className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Connectivity Issue</h3>
          <p className="text-sm text-slate-500 mt-1">We couldn't reach the server to fetch your latest data. Please check your internet connection.</p>
        </div>
        <Button onClick={fetchStats} className="w-full rounded-xl gap-2 font-bold h-12">
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </Button>
      </Card>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-3xl border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Gross Revenue</p>
                <h3 className="text-3xl font-headline font-black mt-1 text-primary">{getCurrencySymbol(currency)}{stats.revenue.toLocaleString()}</h3>
                <p className="text-[10px] text-accent font-black mt-2 flex items-center gap-1 uppercase tracking-widest">
                  <TrendingUp className="w-3 h-3" /> Live Sync
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Sales</p>
                <h3 className="text-3xl font-headline font-black mt-1 text-primary">{stats.orders}</h3>
                <p className="text-[10px] text-muted-foreground font-black mt-2 flex items-center gap-1 uppercase tracking-widest">
                  Confirmed Orders
                </p>
              </div>
              <div className="p-3 bg-accent/10 rounded-2xl">
                <ShoppingBag className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Inventory</p>
                <h3 className="text-3xl font-headline font-black mt-1 text-primary">{stats.products}</h3>
                <p className="text-[10px] text-muted-foreground font-black mt-2 uppercase tracking-widest">Active SKUs</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50 shadow-sm bg-slate-900 text-white">
          <CardContent className="p-6">
            <h3 className="text-xl font-headline font-bold mb-2">IHut.Shop Pro</h3>
            <p className="text-xs text-white/60 mb-4 font-medium uppercase tracking-widest">Unlock Advanced Tools</p>
            <button className="w-full bg-primary text-white rounded-xl py-3 font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              Upgrade Console
            </button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[40px] border-border/50 shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
            <CardTitle className="font-headline font-black text-xl uppercase tracking-tight">Performance Stream</CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly revenue distribution</CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} stroke="#888888" />
                <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#888888" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[40px] border-border/50 shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
            <CardTitle className="font-headline font-black text-xl uppercase tracking-tight">Recent Activity</CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Latest incoming orders</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentOrders.length === 0 ? (
                <div className="p-20 text-center text-slate-200">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-black uppercase tracking-widest">No Recent Activity</p>
                </div>
              ) : (
                recentOrders.map((o) => (
                  <div key={o.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900">{o.customer?.fullName}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{o.createdAt?.toDate()?.toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary">{getCurrencySymbol(currency)}{o.total?.toFixed(2)}</p>
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{o.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
