
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
    <div className="max-w-6xl mx-auto pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full border border-border/50 h-10 w-10">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-headline font-black tracking-tight text-slate-900 uppercase">Abandoned Draft</h1>
              <Badge className="bg-amber-100 text-amber-700 border-none rounded-full px-3 py-1 font-black text-[10px] tracking-widest uppercase">Uncompleted</Badge>
            </div>
            <p className="text-muted-foreground text-sm font-mono flex items-center gap-2">
              <Clock className="w-3 h-3" /> Last Active: {item.lastUpdated?.toDate()?.toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none rounded-xl h-11 px-6 font-bold border-rose-100 text-rose-500 hover:bg-rose-50">
            <Trash2 className="w-4 h-4 mr-2" /> Discard Draft
          </Button>
          <Button className="flex-1 sm:flex-none rounded-xl h-11 px-8 font-black shadow-lg shadow-primary/20">
            <Mail className="w-4 h-4 mr-2" /> Send Reminder
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Items Card */}
          <Card className="rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-muted/30 border-b border-border/50 p-8">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl"><Package className="w-5 h-5 text-primary" /></div>
                    <CardTitle className="text-xl font-headline font-bold">Shopping Bag Snapshot</CardTitle>
                  </div>
                  <Badge variant="secondary" className="font-bold px-3 py-1 rounded-lg bg-white border">{item.items?.length || 0} Items</Badge>
               </div>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-border/50">
                  {item.items?.map((prod: any) => (
                    <div key={prod.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden border">
                             <img src={prod.image} className="w-full h-full object-cover" alt={prod.name} />
                          </div>
                          <div>
                             <h4 className="font-bold text-slate-900">{prod.name}</h4>
                             <p className="text-xs text-muted-foreground font-medium">Quantity: {prod.quantity} × ${prod.price}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="font-black text-slate-900 text-lg">${(prod.price * prod.quantity).toFixed(2)}</p>
                       </div>
                    </div>
                  ))}
               </div>
               
               <div className="p-8 bg-slate-50/50 border-t flex flex-col items-end gap-2">
                  <div className="flex justify-between w-full max-w-[200px] text-sm font-medium text-slate-400">
                     <span>Subtotal</span>
                     <span>${item.total?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-[200px] text-sm font-medium text-emerald-600">
                     <span>Est. Shipping</span>
                     <span>FREE</span>
                  </div>
                  <Separator className="w-full max-w-[200px] my-2" />
                  <div className="flex justify-between w-full max-w-[240px] text-2xl font-black text-primary">
                     <span>EST. TOTAL</span>
                     <span>${item.total?.toFixed(2)}</span>
                  </div>
               </div>
            </CardContent>
          </Card>

          {/* Recovery Tips */}
          <div className="bg-primary/5 rounded-[32px] p-8 border border-primary/10 flex items-start gap-4">
             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm shrink-0">
                <AlertTriangle className="w-6 h-6" />
             </div>
             <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-lg">Recovery Insights</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  This checkout was abandoned at the shipping stage. Most customers leave here if shipping costs are unexpected or forms are too long. Consider offering a small 5% coupon code in your recovery text to seal the deal.
                </p>
             </div>
          </div>
        </div>

        <div className="space-y-8">
           {/* Customer Profile Card */}
           <Card className="rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-900 text-white p-8">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                       <User className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl font-headline font-bold uppercase tracking-tight">Customer Intel</CardTitle>
                 </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Legal Name</p>
                    <h3 className="text-2xl font-bold text-slate-900">{item.customer?.fullName || "Visitor"}</h3>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center gap-4 group">
                       <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <Phone className="w-4 h-4" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mobile Reach</p>
                          <p className="text-sm font-bold">{item.customer?.phone || "Not provided"}</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                       <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <Mail className="w-4 h-4" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Address</p>
                          <p className="text-sm font-bold break-all">{item.customer?.email || "Not provided"}</p>
                       </div>
                    </div>

                    <div className="flex items-start gap-4 group">
                       <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                          <MapPin className="w-4 h-4" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Shipping Target</p>
                          <p className="text-sm font-bold leading-relaxed">{item.customer?.address || "Incomplete Address"}</p>
                       </div>
                    </div>
                 </div>

                 <Button variant="secondary" className="w-full h-12 rounded-2xl font-bold text-xs uppercase tracking-widest gap-2 bg-slate-50 hover:bg-slate-100">
                    <MessageSquare className="w-4 h-4" /> Contact Directly
                 </Button>
              </CardContent>
           </Card>

           {/* Quick Stats Card */}
           <Card className="rounded-[40px] border-none bg-slate-900 text-white p-8 space-y-6 shadow-2xl shadow-slate-900/20">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-indigo-500 rounded-xl"><DollarSign className="w-5 h-5 text-white" /></div>
                 <h4 className="font-bold text-lg uppercase tracking-tight">Recovery Value</h4>
              </div>
              <div className="space-y-1">
                 <h2 className="text-5xl font-black text-indigo-400 tracking-tighter">${item.total?.toFixed(2)}</h2>
                 <p className="text-slate-400 text-xs font-medium">Potential revenue currently on hold.</p>
              </div>
              <Button className="w-full h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 font-black text-lg shadow-xl shadow-indigo-500/20">
                 Recover Order
              </Button>
           </Card>
        </div>
      </div>
    </div>
  );
}
