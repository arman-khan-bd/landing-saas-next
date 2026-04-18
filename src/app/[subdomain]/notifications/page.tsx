"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, ShoppingCart, User, ShieldAlert, Check, Trash2, Clock, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MOCK_NOTIFICATIONS = [
  { id: 1, type: "order", title: "New Order #ORD-882", description: "John Doe placed a new order for $125.50", time: "2 minutes ago", read: false },
  { id: 2, type: "customer", title: "New Customer Registration", description: "Jane Smith joined your store", time: "1 hour ago", read: false },
  { id: 3, type: "fraud", title: "Suspicious Activity Detected", description: "Potential fraud order from IP 192.168.1.1", time: "3 hours ago", read: false },
  { id: 4, type: "order", title: "Order #ORD-881 Completed", description: "The payment for order #ORD-881 has been confirmed", time: "5 hours ago", read: true },
  { id: 5, type: "stock", title: "Low Stock Alert: T-Shirt XL", description: "Only 2 items remaining in stock", time: "Yesterday", read: true },
];

export default function NotificationsPage() {
  const { subdomain } = useParams();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="w-5 h-5 text-blue-600" />;
      case 'customer': return <User className="w-5 h-5 text-emerald-600" />;
      case 'fraud': return <ShieldAlert className="w-5 h-5 text-rose-600" />;
      default: return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with your store&apos;s latest activities.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="rounded-xl border-border/50 bg-white" onClick={markAllRead}>
             Mark all as read
           </Button>
           <Button variant="ghost" size="icon" className="rounded-xl border border-border/50 bg-white">
             <Filter className="w-4 h-4" />
           </Button>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card className="rounded-3xl border-dashed border-2 py-20 text-center text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm">You have no new notifications.</p>
          </Card>
        ) : (
          notifications.map((n) => (
            <Card key={n.id} className={`rounded-3xl border-border/50 transition-all hover:shadow-md ${!n.read ? 'bg-primary/5 border-primary/20' : 'bg-white'}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    n.type === 'fraud' ? 'bg-rose-100' : 
                    n.type === 'customer' ? 'bg-emerald-100' : 
                    n.type === 'order' ? 'bg-blue-100' : 'bg-primary/10'
                  }`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold text-lg ${!n.read ? 'text-primary' : 'text-foreground'}`}>{n.title}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {n.time}
                        </span>
                        {!n.read && <Badge className="bg-primary hover:bg-primary text-[10px] h-2 w-2 p-0 rounded-full" />}
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{n.description}</p>
                    <div className="flex items-center gap-4 pt-3">
                      <Button variant="link" className="p-0 h-auto text-sm font-semibold text-primary hover:no-underline">
                        View Details
                      </Button>
                      {!n.read && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 rounded-lg text-xs gap-1.5 hover:bg-white"
                          onClick={() => setNotifications(notifications.map(notif => notif.id === n.id ? { ...notif, read: true } : notif))}
                        >
                          <Check className="w-3.5 h-3.5" /> Mark read
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 rounded-lg text-xs gap-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => deleteNotification(n.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
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
