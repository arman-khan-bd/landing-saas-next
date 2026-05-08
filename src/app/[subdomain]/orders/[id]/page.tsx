
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore, useAuth } from "@/firebase/provider";
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
   ChevronLeft, ShoppingCart, User, Phone, MapPin,
   Mail, Loader2, Package, Globe, ShieldAlert,
   ShieldCheck, AlertTriangle, Fingerprint, Lock,
   CreditCard, Smartphone, CheckCircle2, MoreVertical,
   Truck, Unlock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { cn, getCurrencySymbol } from "@/lib/utils";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OrderDetailPage() {
   const { subdomain, id } = useParams();
   const router = useRouter();
   const { toast } = useToast();
   const confirm = useConfirm();
   const db = useFirestore();
   const auth = useAuth();
   const [order, setOrder] = useState<any>(null);
   const [ipData, setIpData] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [blocking, setBlocking] = useState(false);
   const [updating, setUpdating] = useState(false);
   const [currency, setCurrency] = useState("BDT");
   const [activeBlocks, setActiveBlocks] = useState<Record<string, string>>({}); // { "ip:1.2.3.4": "docId", "phone:880...": "docId" }

   useEffect(() => {
      if (id && db) {
         fetchOrder();
      }
   }, [id, db]);

   const fetchOrder = async () => {
      setLoading(true);
      try {
         const docRef = doc(db, "orders", id as string);
         const docSnap = await getDoc(docRef);
         if (docSnap.exists()) {
            const data = docSnap.data();
            setOrder({ id: docSnap.id, ...data });

            // Fetch IP Metadata
            if (data.customer?.ip) {
               fetch(`https://ipapi.co/${data.customer.ip}/json/`)
                  .then(res => res.json())
                  .then(meta => setIpData(data.customer.ip === "127.0.0.1" ? { city: "Localhost", country_name: "System" } : meta))
                  .catch(e => console.error("IP Meta Error", e));
            }

            // Fetch Store Currency
            if (data.storeId) {
               const storeSnap = await getDoc(doc(db, "stores", data.storeId));
               if (storeSnap.exists()) {
                  setCurrency(storeSnap.data().currency || "BDT");
               }
            }

            // Check Active Blocks
            fetchActiveBlocks(data);
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

   const fetchActiveBlocks = async (orderData: any) => {
     if (!orderData.storeId) return;
     const valuesToCheck = [];
     if (orderData.customer?.ip) valuesToCheck.push(orderData.customer.ip);
     if (orderData.customer?.phone) valuesToCheck.push(orderData.customer.phone);
     
     if (valuesToCheck.length === 0) return;

     const q = query(
       collection(db, "fraud_blocks"),
       where("storeId", "==", orderData.storeId),
       where("value", "in", valuesToCheck)
     );
     const snap = await getDocs(q);
     const blocks: Record<string, string> = {};
     snap.docs.forEach(doc => {
       const data = doc.data();
       blocks[`${data.type}:${data.value}`] = doc.id;
     });
     setActiveBlocks(blocks);
   };

   const handleStatusUpdate = async (newStatus: string) => {
      setUpdating(true);
      try {
         await updateDoc(doc(db, "orders", order.id), {
            status: newStatus,
            updatedAt: serverTimestamp()
         });
         setOrder({ ...order, status: newStatus });
         toast({ title: "Fulfillment Updated" });
      } catch (e) {
         toast({ variant: "destructive", title: "Update Failed" });
      } finally {
         setUpdating(false);
      }
   };

   const handlePaymentStatusUpdate = async (newStatus: string) => {
      setUpdating(true);
      try {
         await updateDoc(doc(db, "orders", order.id), {
            paymentStatus: newStatus,
            updatedAt: serverTimestamp()
         });
         setOrder({ ...order, paymentStatus: newStatus });
         toast({ title: "Payment Status Updated" });
      } catch (e) {
         toast({ variant: "destructive", title: "Update Failed" });
      } finally {
         setUpdating(false);
      }
   };

   const handleBlockAction = async (type: 'ip' | 'phone' | 'customer') => {
      if (!order || !auth.currentUser) return;

      const val = type === 'ip' ? order.customer?.ip : type === 'phone' ? order.customer?.phone : null;
      const existingBlockId = type !== 'customer' && val ? activeBlocks[`${type}:${val}`] : null;

      if (existingBlockId) {
        // Unblock Action
        if (!(await confirm({
          title: `Unblock ${type.toUpperCase()}`,
          message: `Are you sure you want to restore access for this ${type.toUpperCase()}?`,
          confirmText: "Unblock Now",
          variant: "primary"
        }))) return;

        setBlocking(true);
        try {
          await deleteDoc(doc(db, "fraud_blocks", existingBlockId));
          setActiveBlocks(prev => {
            const next = { ...prev };
            delete next[`${type}:${val}`];
            return next;
          });
          toast({ title: "Access Restored" });
        } catch (e) {
          toast({ variant: "destructive", title: "Action Failed" });
        } finally {
          setBlocking(false);
        }
        return;
      }

      // Block Action
      const confirmOptions = type === 'customer'
         ? {
            title: "Block Total Identity?",
            message: "This will permanently flag this customer's Email, Phone, and IP address for all future checkout attempts. Are you sure?",
            confirmText: "Block Identity",
            variant: 'danger' as const
         }
         : {
            title: `Block ${type.toUpperCase()}?`,
            message: `Are you sure you want to restrict this ${type.toUpperCase()} from your store?`,
            confirmText: `Block ${type}`,
            variant: 'danger' as const
         };

      if (!(await confirm(confirmOptions))) return;

      setBlocking(true);
      try {
         const baseBlockData = {
            ownerId: auth.currentUser.uid,
            storeId: order.storeId,
            createdAt: serverTimestamp(),
            reason: `Manual block from order #${order.id}`,
            customerName: order.customer?.fullName || "Anonymous",
            metadata: { orderId: order.id }
         };

         const itemsToBlock: any[] = [];
         if ((type === 'ip' || type === 'customer') && order.customer?.ip) {
            itemsToBlock.push({ type: 'ip', value: order.customer.ip });
         }
         if ((type === 'phone' || type === 'customer') && order.customer?.phone) {
            itemsToBlock.push({ type: 'phone', value: order.customer.phone });
         }
         if (type === 'customer' && order.customer?.email) {
            itemsToBlock.push({ type: 'email', value: order.customer.email });
         }

         if (itemsToBlock.length === 0) {
            toast({ variant: "destructive", title: "No data to block" });
            setBlocking(false);
            return;
         }

         for (const item of itemsToBlock) {
            const docRef = await addDoc(collection(db, "fraud_blocks"), { ...baseBlockData, ...item });
            setActiveBlocks(prev => ({ ...prev, [`${item.type}:${item.value}`]: docRef.id }));
         }

         toast({ title: "Security Updated", description: "Identity markers successfully restricted." });
      } catch (error) {
         console.error(error);
         toast({ variant: "destructive", title: "Security Action Failed" });
      } finally {
         setBlocking(false);
      }
   };

   if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;
   if (!order) return null;

   const isIpBlocked = order.customer?.ip && activeBlocks[`ip:${order.customer.ip}`];
   const isPhoneBlocked = order.customer?.phone && activeBlocks[`phone:${order.customer.phone}`];

   return (
      <div className="max-w-5xl mx-auto pb-20 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 px-2 sm:px-0">
         {/* Header */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full border border-border/50 h-10 w-10">
                  <ChevronLeft className="w-5 h-5" />
               </Button>
               <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-headline font-black tracking-tight text-slate-900 uppercase">Order Details</h1>
                    {order.isSpam && (
                      <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none rounded px-2 py-0 h-5 text-[9px] font-black tracking-widest uppercase">SPAM</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-[10px] sm:text-xs font-mono">#{order.id}</p>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <Select value={order.status} onValueChange={handleStatusUpdate} disabled={updating}>
                  <SelectTrigger className="h-10 rounded-xl bg-primary text-white border-none font-black text-[10px] uppercase tracking-widest px-4 shadow-lg shadow-primary/20">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                     <SelectItem value="pending">Pending</SelectItem>
                     <SelectItem value="processing">Processing</SelectItem>
                     <SelectItem value="shipped">Shipped</SelectItem>
                     <SelectItem value="completed">Completed</SelectItem>
                     <SelectItem value="cancelled" className="text-rose-500">Cancelled</SelectItem>
                  </SelectContent>
               </Select>
               <Badge variant="outline" className="h-10 rounded-xl px-4 font-bold text-[10px]">{order.paymentMethod?.toUpperCase()}</Badge>
            </div>
         </div>

         {/* Spam Warning */}
         {order.isSpam && (
            <div className="bg-rose-50 border-2 border-rose-100 rounded-[24px] p-4 flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
               <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-200">
                  <ShieldAlert className="w-6 h-6" />
               </div>
               <div>
                  <h4 className="text-rose-900 font-black uppercase text-xs tracking-widest">Potential Fraud Detected</h4>
                  <p className="text-rose-600 text-[11px] font-medium leading-tight mt-0.5">This order originated from a restricted network (IP Block). Review carefully before shipping.</p>
               </div>
            </div>
         )}

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
               {/* Order Content */}
               <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
                  <CardHeader className="bg-muted/30 border-b p-6 sm:p-8">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Package className="w-5 h-5 text-primary" />
                           <CardTitle className="text-lg font-headline font-bold">Items Purchased</CardTitle>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground uppercase">{order.items?.length || 0} Products</span>
                     </div>
                  </CardHeader>
                  <CardContent className="p-0">
                     <div className="divide-y divide-border/50">
                        {order.items?.map((item: any, idx: number) => (
                           <div key={idx} className="p-5 sm:p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden border shrink-0">
                                    <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                                 </div>
                                 <div className="min-w-0">
                                    <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                                    <p className="text-[10px] text-muted-foreground font-medium">Qty: {item.quantity} × {getCurrencySymbol(currency)}{item.price}</p>
                                 </div>
                              </div>
                              <p className="font-black text-slate-900 text-sm">{getCurrencySymbol(currency)}{(item.price * item.quantity).toFixed(2)}</p>
                           </div>
                        ))}
                     </div>

                     <div className="p-6 sm:p-8 bg-slate-50/30 border-t flex flex-col items-end gap-2">
                        <div className="flex justify-between w-full max-w-[200px] text-sm font-medium text-slate-400">
                           <span>Subtotal</span>
                           <span>{getCurrencySymbol(currency)}{(order.subtotal || order.total)?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between w-full max-w-[200px] text-sm font-medium text-emerald-600">
                           <span className="truncate pr-2">Shipping ({order.shipping?.name || 'Free'})</span>
                           <span>{order.shippingCost > 0 ? `${getCurrencySymbol(currency)}${order.shippingCost.toFixed(2)}` : 'FREE'}</span>
                        </div>
                        <Separator className="w-full max-w-[200px] my-2" />
                        <div className="flex justify-between w-full max-w-[240px] text-2xl font-black text-primary">
                           <span className="text-sm pt-2 text-slate-900 uppercase">Grand Total</span>
                           <span>{getCurrencySymbol(currency)}{order.total?.toFixed(2)}</span>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               {/* Payment Intelligence Card */}
               <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
                  <CardHeader className="bg-emerald-50 border-b border-emerald-100 p-6 sm:p-8">
                     <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-emerald-600" />
                        <CardTitle className="text-lg font-headline font-bold uppercase tracking-tight text-emerald-900">Payment Evidence</CardTitle>
                     </div>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Payment Strategy</p>
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                    {order.paymentMethod === 'cod' ? <Truck className="w-5 h-5 text-slate-400" /> : <Smartphone className="w-5 h-5 text-indigo-600" />}
                                 </div>
                                 <p className="font-bold text-slate-900 uppercase text-sm">
                                    {order.paymentMethod === 'cod' ? "Cash on Delivery" : "Manual / Mobile Banking"}
                                 </p>
                              </div>
                           </div>

                           {order.paymentMethod === 'manual' && (
                              <div className="space-y-4 animate-in slide-in-from-top-2">
                                 <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Verification Transaction ID</p>
                                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between">
                                       <span className="font-mono text-lg font-black text-indigo-700 select-all">{order.transactionId || "NONE_PROVIDED"}</span>
                                       <Badge className="bg-indigo-600 text-white border-none uppercase text-[8px] font-black tracking-widest">TRANXID</Badge>
                                    </div>
                                 </div>
                              </div>
                           )}
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Payment Status</p>
                              <Select value={order.paymentStatus || "unpaid"} onValueChange={handlePaymentStatusUpdate} disabled={updating}>
                                 <SelectTrigger className={cn(
                                    "h-12 rounded-xl border-none font-bold text-sm px-4",
                                    order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                 )}>
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent className="rounded-xl border-none shadow-2xl">
                                    <SelectItem value="unpaid">Unpaid / Processing</SelectItem>
                                    <SelectItem value="paid" className="text-emerald-600">Verified & Paid</SelectItem>
                                    <SelectItem value="refunded" className="text-rose-500">Refunded</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>

                           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                              <ShieldCheck className="w-5 h-5 text-emerald-500" />
                              <p className="text-[11px] text-slate-500 leading-tight">Payments are recorded with client IP and timestamps for audit trails.</p>
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </div>

            <div className="space-y-6 sm:space-y-8">
               {/* Customer Card */}
               <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
                  <CardHeader className="bg-muted/30 border-b p-6 sm:p-8">
                     <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg font-headline font-bold">Customer Info</CardTitle>
                     </div>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8 space-y-6">
                     <div className="flex items-center justify-between">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Name</p>
                           <h3 className="text-xl font-bold text-slate-900">{order.customer?.fullName}</h3>
                        </div>
                        <Button
                           variant="ghost"
                           size="sm"
                           className="rounded-xl h-9 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 border border-primary/10"
                           onClick={() => router.push(`/${subdomain}/customers/${order.id}`)}
                        >
                           Analyze Profile
                        </Button>
                     </div>

                     <div className="space-y-4">
                        <div className="flex items-center justify-between group">
                           <div className="flex items-center gap-3">
                              <Phone className="w-4 h-4 text-primary" />
                              <div className="min-w-0">
                                 <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Phone</p>
                                 <p className="text-sm font-bold truncate">{order.customer?.phone}</p>
                              </div>
                           </div>
                           {order.customer?.phone && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary hover:bg-primary/10" asChild>
                                 <a href={`tel:${order.customer.phone}`}>
                                    <Phone className="w-3.5 h-3.5 fill-primary" />
                                 </a>
                              </Button>
                           )}
                        </div>
                        <div className="flex items-center justify-between group">
                           <div className="flex items-center gap-3">
                              <Mail className="w-4 h-4 text-primary" />
                              <div className="min-w-0">
                                 <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Email</p>
                                 <p className="text-sm font-bold truncate">{order.customer?.email || "No email provided"}</p>
                              </div>
                           </div>
                           {order.customer?.email && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary hover:bg-primary/10" asChild>
                                 <a href={`mailto:${order.customer.email}`}>
                                    <Mail className="w-3.5 h-3.5" />
                                 </a>
                              </Button>
                           )}
                        </div>
                        <div className="flex items-start gap-3 group">
                           <MapPin className="w-4 h-4 text-primary mt-0.5" />
                           <div className="min-w-0">
                              <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Shipping</p>
                              <p className="text-sm font-medium leading-relaxed">{order.customer?.address}</p>
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               {/* Technical Metadata */}
               <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-slate-900 text-white">
                  <CardHeader className="p-6 sm:p-8 border-b border-white/5">
                     <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-primary" />
                        <CardTitle className="text-sm font-black uppercase tracking-widest">Network Data</CardTitle>
                     </div>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8 space-y-4">
                     <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Source IP</p>
                        <p className="text-xs font-mono font-bold">{order.customer?.ip || "N/A"}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Est. Location</p>
                        <p className="text-xs font-bold text-slate-300">
                           {ipData?.city ? `${ipData.city}, ${ipData.country_name}` : "Resolving..."}
                        </p>
                     </div>
                  </CardContent>
               </Card>

               {/* Fraud/Block Actions */}
               <Card className="rounded-[32px] border-none bg-rose-50/50 shadow-sm overflow-hidden border-2 border-rose-100">
                  <CardHeader className="bg-rose-600 text-white p-6 sm:p-8">
                     <div className="flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5" />
                        <CardTitle className="text-lg font-headline font-bold uppercase tracking-tight leading-none">Security Vault</CardTitle>
                     </div>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8 space-y-4">
                     <p className="text-[11px] text-rose-700 font-medium leading-relaxed mb-2 italic">Flag suspicious activity instantly. Entities added here will be restricted from future checkout attempts.</p>

                     <div className="grid grid-cols-1 gap-2.5">
                        <Button
                           variant={isIpBlocked ? "secondary" : "outline"}
                           className={cn(
                             "rounded-xl h-12 justify-start font-bold text-xs",
                             isIpBlocked ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none" : "border-rose-200 text-rose-600 hover:bg-rose-100"
                           )}
                           onClick={() => handleBlockAction('ip')}
                           disabled={blocking || !order.customer?.ip}
                        >
                           {isIpBlocked ? <Unlock className="w-4 h-4 mr-2" /> : <Fingerprint className="w-4 h-4 mr-2" />}
                           {blocking ? "Processing..." : isIpBlocked ? "Unblock IP Address" : "Block IP Address"}
                        </Button>
                        <Button
                           variant={isPhoneBlocked ? "secondary" : "outline"}
                           className={cn(
                             "rounded-xl h-12 justify-start font-bold text-xs",
                             isPhoneBlocked ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none" : "border-rose-200 text-rose-600 hover:bg-rose-100"
                           )}
                           onClick={() => handleBlockAction('phone')}
                           disabled={blocking || !order.customer?.phone}
                        >
                           {isPhoneBlocked ? <Unlock className="w-4 h-4 mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
                           {blocking ? "Processing..." : isPhoneBlocked ? "Unblock Phone Number" : "Block Phone Number"}
                        </Button>
                        <Button
                           className="rounded-xl h-12 justify-start bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-lg shadow-rose-200"
                           onClick={() => handleBlockAction('customer')}
                           disabled={blocking}
                        >
                           <Lock className="w-4 h-4 mr-2" />
                           {blocking ? "Locking identity..." : "Block Total Identity"}
                        </Button>
                     </div>
                  </CardContent>
               </Card>
            </div>
         </div>
      </div>
   );
}
