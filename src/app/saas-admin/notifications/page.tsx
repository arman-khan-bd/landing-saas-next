
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, query, orderBy, onSnapshot, limit, 
  doc, updateDoc, writeBatch, where 
} from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, Check, Trash2, Clock, Loader2, AlertCircle, 
  ChevronRight, ArrowLeftRight, CreditCard, UserPlus, Info, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Transactions
    const qTx = query(collection(db, "saas_transactions"), where("status", "==", "pending"));
    const unsubTx = onSnapshot(qTx, (snap) => {
      const txNotifs = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: "transaction",
          title: "New Payment Request",
          description: `Store "${data.storeName}" requested the ${data.planName} plan for $${data.amount}.`,
          time: data.createdAt?.toDate?.() || new Date(),
          read: false, 
          link: "/saas-admin/transactions",
          createdAt: data.createdAt
        };
      });
      updateCombined(txNotifs, "tx");
    });

    // Listen for Domain Requests
    const qDom = query(collection(db, "custom_domain_requests"), where("status", "==", "pending"));
    const unsubDom = onSnapshot(qDom, (snap) => {
      const domNotifs = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: "domain",
          title: "New Custom Domain Request",
          description: `Store "${data.storeName}" requested to connect ${data.domain}.`,
          time: data.createdAt?.toDate?.() || new Date(),
          read: false,
          link: "/saas-admin/domains",
          createdAt: data.createdAt
        };
      });
      updateCombined(domNotifs, "dom");
    });

    return () => {
      unsubTx();
      unsubDom();
    };
  }, []);

  const [rawTx, setRawTx] = useState<any[]>([]);
  const [rawDom, setRawDom] = useState<any[]>([]);

  const updateCombined = (notifs: any[], key: string) => {
    if (key === 'tx') setRawTx(notifs);
    else setRawDom(notifs);
  };

  useEffect(() => {
    const combined = [...rawTx, ...rawDom].sort((a, b) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
    }).slice(0, 30);
    setNotifications(combined);
    setLoading(false);
  }, [rawTx, rawDom]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'transaction': return <ArrowLeftRight className="w-5 h-5 text-indigo-400" />;
      case 'domain': return <Globe className="w-5 h-5 text-indigo-400" />;
      case 'info': return <Info className="w-5 h-5 text-blue-400" />;
      case 'user': return <UserPlus className="w-5 h-5 text-emerald-400" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-600/5">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-headline font-black tracking-tight text-white uppercase">Admin Alerts</h1>
            <p className="text-slate-400 font-medium">Critical system notifications and pending actions.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card className="bg-slate-900 border-dashed border-2 border-white/5 py-24 text-center rounded-[40px]">
            <Bell className="w-16 h-16 mx-auto mb-4 text-slate-800" />
            <p className="text-xl font-bold uppercase tracking-widest text-slate-500">All caught up</p>
            <p className="text-sm text-slate-600">No pending administrative actions at the moment.</p>
          </Card>
        ) : (
          notifications.map((n) => (
            <Card 
              key={n.id} 
              className={cn(
                "group rounded-[32px] border-white/5 transition-all hover:bg-slate-900/80 cursor-pointer relative overflow-hidden bg-slate-900/40",
                !n.read ? 'border-l-4 border-l-indigo-500' : ''
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 border border-white/5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">{n.title}</h4>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1 tracking-widest">
                          <Clock className="w-3 h-3" /> {format(n.time, "HH:mm, MMM dd")}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-sm">{n.description}</p>
                    
                    <div className="flex items-center gap-6 pt-4">
                      <Link href={n.link} className="flex items-center text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:underline group-hover:translate-x-1 transition-transform">
                        Take Action <ChevronRight className="w-3 h-3 ml-1" />
                      </Link>
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
