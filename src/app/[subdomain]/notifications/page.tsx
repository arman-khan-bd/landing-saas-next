
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, ShoppingCart, User, ShieldAlert, Check, Trash2, Clock, Filter, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: "order" | "customer" | "fraud" | "draft";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export default function NotificationsPage() {
  const { subdomain } = useParams();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealNotifications();
  }, [subdomain]);

  const fetchRealNotifications = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQ);
      if (storeSnap.empty) return;
      const storeId = storeSnap.docs[0].id;

      // Fetch latest orders
      const ordersQ = query(
        collection(db, "orders"),
        where("storeId", "==", storeId),
        where("ownerId", "==", auth.currentUser.uid),
        limit(10)
      );
      
      // Fetch latest drafts
      const draftsQ = query(
        collection(db, "uncompleted_orders"),
        where("storeId", "==", storeId),
        where("ownerId", "==", auth.currentUser.uid),
        limit(10)
      );

      const [orderSnap, draftSnap] = await Promise.all([getDocs(ordersQ), getDocs(draftsQ)]);

      const orderNotifs: Notification[] = orderSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: "order",
          title: `New Order Received`,
          description: `${data.customer?.fullName || 'A customer'} placed an order for $${data.total?.toFixed(2)}`,
          time: data.createdAt?.toDate?.()?.toLocaleString() || "Recent",
          read: false
        };
      });

      const draftNotifs: Notification[] = draftSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: "draft",
          title: `Abandoned Checkout`,
          description: `${data.customer?.fullName || 'Someone'} started checking out with $${data.total?.toFixed(2)} worth of items.`,
          time: data.lastUpdated?.toDate?.()?.toLocaleString() || "Recent",
          read: false
        };
      });

      const combined = [...orderNotifs, ...draftNotifs].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(combined);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="w-5 h-5 text-blue-600" />;
      case 'draft': return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'customer': return <User className="w-5 h-5 text-emerald-600" />;
      case 'fraud': return <ShieldAlert className="w-5 h-5 text-rose-600" />;
      default: return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight uppercase font-headline">Store Stream</h1>
            <p className="text-muted-foreground text-sm">Real-time business activity and alerts.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="rounded-xl border-border/50 bg-white" onClick={markAllRead}>
             Mark all as read
           </Button>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card className="rounded-[40px] border-dashed border-2 py-24 text-center text-muted-foreground bg-muted/20">
            <Bell className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="text-xl font-bold uppercase tracking-widest">No activity yet</p>
            <p className="text-sm">New orders and checkout drafts will appear here.</p>
          </Card>
        ) : (
          notifications.map((n) => (
            <Card key={n.id} className={`rounded-[32px] border-border/50 transition-all hover:shadow-md ${!n.read ? 'bg-white border-primary/20 ring-1 ring-primary/5' : 'bg-white opacity-80'}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    n.type === 'draft' ? 'bg-amber-100' : 
                    n.type === 'order' ? 'bg-blue-100' : 'bg-primary/10'
                  }`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold text-lg ${!n.read ? 'text-primary' : 'text-foreground'}`}>{n.title}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1 tracking-widest">
                          <Clock className="w-3 h-3" /> {n.time}
                        </span>
                        {!n.read && <Badge className="bg-primary hover:bg-primary h-2 w-2 p-0 rounded-full border-none shadow-lg shadow-primary/50" />}
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-sm">{n.description}</p>
                    <div className="flex items-center gap-6 pt-4">
                      <Button variant="link" className="p-0 h-auto text-xs font-black uppercase tracking-widest text-primary hover:no-underline" onClick={() => window.location.href = n.type === 'order' ? `/${subdomain}/orders` : `/${subdomain}/orders/uncompleted`}>
                        Go to Details
                      </Button>
                      {!n.read && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2 hover:bg-primary/5"
                          onClick={() => setNotifications(notifications.map(notif => notif.id === n.id ? { ...notif, read: true } : notif))}
                        >
                          <Check className="w-3 h-3" /> Mark read
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => deleteNotification(n.id)}
                      >
                        <Trash2 className="w-3 h-3" /> Archive
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
