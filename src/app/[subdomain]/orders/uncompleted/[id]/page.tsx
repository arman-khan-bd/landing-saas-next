"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ChevronLeft, ShoppingCart, User, Phone, MapPin, 
  Calendar, Trash2, Mail, MessageSquare, Loader2,
  Package, AlertTriangle, ArrowRight, DollarSign, Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function UncompletedOrderDetailPage() {
  const { subdomain, id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "uncompleted_orders", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setItem({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast({ variant: "destructive", title: "Order not found" });
        router.back();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;
  if (!item) return null;

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-4 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 px-2 sm:px-0">
      {/* App Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full border border-border/50 h-10 w-10 shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl sm:text-2xl font-headline font-black tracking-tight text-slate-900 uppercase truncate">Abandoned Draft</h1>
            </div>
            <p className="text-muted-foreground text-[10px] sm:text-xs font-mono flex items-center gap-1.5 whitespace-nowrap">
              <Clock className="w-3 h-3" /> Last Active: {item.lastUpdated?.toDate()?.toLocaleString()}
            </p>
          </div>
          <Badge className="ml-auto bg-amber-100 text-amber-700 border-none rounded-lg px-2 py-0.5 font-black text-[9px] tracking-widest uppercase shrink-0">DRAFT</Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="rounded-xl h-10 text-[10px] sm:text-xs font-bold border-rose-100 text-rose-500 hover:bg-rose-50">
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Discard
          </Button>
          <Button className="rounded-xl h-10 text-[10px] sm:text-xs font-black shadow-lg shadow-primary/20">
            <Mail className="w-3.5 h-3.5 mr-1.5" /> Send Reminder
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-8">
        <div className="lg:col-span-2 space-y-4 sm:space-y-8">
          {/* Items Card */}
          <Card className="rounded-[24px] sm:rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-muted/30 border-b border-border/50 p-4 sm:p-8">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg sm:rounded-xl"><Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /></div>
                    <CardTitle className="text-sm sm:text-xl font-headline font-bold">Shopping Bag</CardTitle>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.items?.length || 0} Items</span>
               </div>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-border/50">
                  {item.items?.map((prod: any) => (
                    <div key={prod.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                       <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-muted overflow-hidden border shrink-0">
                             <img src={prod.image} className="w-full h-full object-cover" alt={prod.name} />
                          </div>
                          <div className="min-w-0">
                             <h4 className="font-bold text-slate-900 text-xs sm:text-base truncate">{prod.name}</h4>
                             <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Qty: {prod.quantity} × ${prod.price}</p>
                          </div>
                       </div>
                       <div className="text-right shrink-0 ml-4">
                          <p className="font-black text-slate-900 text-sm sm:text-lg">${(prod.price * prod.quantity).toFixed(2)}</p>
                       </div>
                    </div>
                  ))}
               </div>
               
               <div className="p-4 sm:p-8 bg-slate-50/30 border-t flex flex-col items-end gap-1.5 sm:gap-2">
                  <div className="flex justify-between w-full max-w-[200px] text-[10px] sm:text-sm font-medium text-slate-400">
                     <span>Subtotal</span>
                     <span>${item.total?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-[200px] text-[10px] sm:text-sm font-medium text-emerald-600">
                     <span>Est. Shipping</span>
                     <span>FREE</span>
                  </div>
                  <Separator className="w-full max-w-[200px] my-1 sm:my-2 bg-border/40" />
                  <div className="flex justify-between w-full max-w-[240px] text-lg sm:text-2xl font-black text-primary">
                     <span className="text-[10px] sm:text-sm pt-1.5 sm:pt-2 text-slate-900">EST. TOTAL</span>
                     <span>${item.total?.toFixed(2)}</span>
                  </div>
               </div>
            </CardContent>
          </Card>

          {/* Recovery Tips - Compact for Mobile */}
          <div className="bg-primary/5 rounded-2xl sm:rounded-[32px] p-4 sm:p-8 border border-primary/10 flex items-start gap-3 sm:gap-4">
             <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-primary shadow-sm shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
             </div>
             <div className="space-y-0.5 sm:space-y-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-sm sm:text-lg">Recovery Insights</h4>
                <p className="text-[11px] sm:text-sm text-slate-600 leading-relaxed line-clamp-3 sm:line-clamp-none">
                  Abandoned at shipping stage. Offer a 5% coupon in your follow-up reminder to seal the deal.
                </p>
             </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-8">
           {/* Customer Profile Card - Compact Mobile Version */}
           <Card className="rounded-[24px] sm:rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-900 text-white p-5 sm:p-8">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                       <User className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <CardTitle className="text-base sm:text-xl font-headline font-bold uppercase tracking-tight">Customer Intel</CardTitle>
                 </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-8 space-y-6 sm:space-y-8">
                 <div className="space-y-1">
                    <p className="text-[8px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Legal Name</p>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{item.customer?.fullName || "Visitor"}</h3>
                 </div>

                 <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-3 sm:gap-4 group">
                       <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/5 rounded-lg sm:rounded-xl flex items-center justify-center text-primary shrink-0 transition-all group-hover:bg-primary group-hover:text-white">
                          <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                       </div>
                       <div className="min-w-0">
                          <p className="text-[8px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest">Mobile Reach</p>
                          <p className="text-xs sm:text-sm font-bold truncate">{item.customer?.phone || "Not provided"}</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 group">
                       <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/5 rounded-lg sm:rounded-xl flex items-center justify-center text-primary shrink-0 transition-all group-hover:bg-primary group-hover:text-white">
                          <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                       </div>
                       <div className="min-w-0">
                          <p className="text-[8px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Address</p>
                          <p className="text-xs sm:text-sm font-bold break-all truncate">{item.customer?.email || "Not provided"}</p>
                       </div>
                    </div>

                    <div className="flex items-start gap-3 sm:gap-4 group">
                       <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/5 rounded-lg sm:rounded-xl flex items-center justify-center text-primary shrink-0 transition-all group-hover:bg-primary group-hover:text-white mt-0.5">
                          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                       </div>
                       <div className="min-w-0">
                          <p className="text-[8px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest">Shipping Target</p>
                          <p className="text-xs sm:text-sm font-bold leading-relaxed line-clamp-2">{item.customer?.address || "Incomplete Address"}</p>
                       </div>
                    </div>
                 </div>

                 <Button variant="secondary" className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-xs uppercase tracking-widest gap-2 bg-slate-50 hover:bg-slate-100">
                    <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Contact Directly
                 </Button>
              </CardContent>
           </Card>

           {/* Quick Stats Card - Dynamic Tiering */}
           <Card className="rounded-[24px] sm:rounded-[40px] border-none bg-slate-900 text-white p-6 sm:p-8 space-y-4 sm:space-y-6 shadow-2xl shadow-slate-900/20">
              <div className="flex items-center gap-3">
                 <div className="p-1.5 sm:p-2 bg-indigo-500 rounded-lg sm:rounded-xl"><DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" /></div>
                 <h4 className="font-bold text-sm sm:text-lg uppercase tracking-tight">Recovery Value</h4>
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                 <h2 className="text-3xl sm:text-5xl font-black text-indigo-400 tracking-tighter">${item.total?.toFixed(2)}</h2>
                 <p className="text-slate-400 text-[10px] sm:text-xs font-medium">Potential revenue currently on hold.</p>
              </div>
              <Button className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-500 hover:bg-indigo-600 font-black text-sm sm:text-lg shadow-xl shadow-indigo-500/20">
                 Recover Order
              </Button>
           </Card>
        </div>
      </div>
    </div>
  );
}
