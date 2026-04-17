"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShoppingBag, DollarSign, Package, TrendingUp } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts";

export default function StoreDashboard() {
  const { subdomain } = useParams();
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [recentProducts, setRecentProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, [subdomain]);

  const fetchStats = async () => {
    try {
      // 1. Get Store ID
      const storeQuery = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQuery);
      if (storeSnap.empty) return;
      const storeId = storeSnap.docs[0].id;

      // 2. Get Products Count
      const prodQuery = query(collection(db, "products"), where("storeId", "==", storeId));
      const prodSnap = await getDocs(prodQuery);
      
      setStats({
        products: prodSnap.size,
        orders: 12, // Mocked for demo
        revenue: 4500.50 // Mocked for demo
      });

      setRecentProducts(prodSnap.docs.slice(0, 5).map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    }
  };

  const chartData = [
    { name: "Jan", total: 400 },
    { name: "Feb", total: 1200 },
    { name: "Mar", total: 900 },
    { name: "Apr", total: 2400 },
    { name: "May", total: 1800 },
    { name: "Jun", total: 3200 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-3xl border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <h3 className="text-3xl font-headline font-bold mt-1 text-primary">${stats.revenue.toLocaleString()}</h3>
                <p className="text-xs text-accent font-medium mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +12% from last month
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-2xl">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <h3 className="text-3xl font-headline font-bold mt-1 text-primary">{stats.orders}</h3>
                <p className="text-xs text-accent font-medium mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +5% from last month
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
                <p className="text-sm font-medium text-muted-foreground">Products</p>
                <h3 className="text-3xl font-headline font-bold mt-1 text-primary">{stats.products}</h3>
                <p className="text-xs text-muted-foreground mt-2">Active in your catalog</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50 shadow-sm bg-primary text-white">
          <CardContent className="p-6">
            <h3 className="text-xl font-headline font-bold mb-2">Upgrade to Pro</h3>
            <p className="text-sm text-white/80 mb-4">Unlock advanced analytics, AI tools, and custom domains.</p>
            <button className="w-full bg-white text-primary rounded-xl py-2 font-bold hover:bg-white/90 transition-colors">
              Upgrade Now
            </button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-3xl border-border/50">
          <CardHeader>
            <CardTitle className="font-headline font-bold">Revenue Overview</CardTitle>
            <CardDescription>Monthly performance analytics</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} stroke="#888888" />
                <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#888888" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50">
          <CardHeader>
            <CardTitle className="font-headline font-bold">Recent Products</CardTitle>
            <CardDescription>Latest additions to your store</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No products found.</p>
              ) : (
                recentProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden flex items-center justify-center border border-border">
                        {p.images && p.images[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-muted-foreground/30" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{p.name}</p>
                        <p className="text-sm text-muted-foreground">${p.price}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{p.stock} in stock</p>
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