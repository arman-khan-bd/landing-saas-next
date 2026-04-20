
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, ShoppingCart, User, ShieldAlert, Check, Trash2, Clock, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const router = useRouter();
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

  const deleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleNotificationClick = (n: Notification) => {
    // Mark as read
    setNotifications(notifications.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
    
    // Navigate to appropriate detail page
    if (n.type === 'order') {
      router.push(`/${subdomain}/orders`);
    } else if (n.type === 'draft') {
      router.push(`/${subdomain}/orders/uncompleted/${n.id}`);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-2 sm:px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-primary shrink-0">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight uppercase font-headline">Store Stream</h1>
            <p className="text-muted-foreground text-[10px] sm:text-sm">Real-time business activity and alerts.</p>
          </div>
        </div>
        <Button variant="outline" className="rounded-xl border-border/50 bg-white h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto" onClick={markAllRead}>
          Mark all as read
        </Button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {notifications.length === 0 ? (
          <Card className="rounded-[32px] sm:rounded-[40px] border-dashed border-2 py-16 sm:py-24 text-center text-muted-foreground bg-muted/20">
            <Bell className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-10" />
            <p className="text-lg sm:text-xl font-bold uppercase tracking-widest">No activity yet</p>
            <p className="text-xs sm:text-sm">New orders and checkout drafts will appear here.</p>
          </Card>
        ) : (
          notifications.map((n) => (
            <Card 
              key={n.id} 
              onClick={() => handleNotificationClick(n)}
              className={cn(
                "group rounded-[24px] sm:rounded-[32px] border-border/50 transition-all hover:shadow-lg cursor-pointer relative overflow-hidden",
                !n.read ? 'bg-white border-primary/20 ring-1 ring-primary/5' : 'bg-white/60 opacity-80'
              )}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                    n.type === 'draft' ? 'bg-amber-100' : 
                    n.type === 'order' ? 'bg-blue-100' : 'bg-primary/10'
                  )}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={cn(
                        "font-bold text-sm sm:text-lg truncate",
                        !n.read ? 'text-primary' : 'text-foreground'
                      )}>{n.title}</h4>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span className="hidden xs:flex text-[8px] sm:text-[10px] font-black uppercase text-muted-foreground items-center gap-1 tracking-widest">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {n.time.split(',')[0]}
                        </span>
                        {!n.read && <Badge className="bg-primary hover:bg-primary h-2 w-2 p-0 rounded-full border-none shadow-lg shadow-primary/50" />}
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-xs sm:text-sm line-clamp-2">{n.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-3 sm:pt-4">
                      <div className="flex items-center text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary hover:underline group-hover:translate-x-1 transition-transform">
                        Go to Details <ChevronRight className="w-3 h-3 ml-1" />
                      </div>
                      
                      <div className="flex items-center gap-2 ml-auto">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 sm:h-8 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest gap-1 sm:gap-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          onClick={(e) => deleteNotification(e, n.id)}
                        >
                          <Trash2 className="w-3 h-3" /> <span className="hidden xs:inline">Archive</span>
                        </Button>
                      </div>
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
