
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
      <div className="max-w-6xl mx-auto pb-20 space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 px-3 sm:px-6">
         {/* Header */}
         <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-2xl border border-slate-100 h-12 w-12 bg-white shadow-sm hover:shadow-md transition-all">
                     <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </Button>
                  <div>
                     <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-4xl font-black font-headline tracking-tighter text-slate-900 uppercase italic">Order Details</h1>
                        {order.isSpam && (
                          <Badge className="bg-rose-500 text-white border-none rounded-lg px-2.5 py-1 text-[10px] font-black tracking-widest uppercase shadow-lg shadow-rose-200">SPAM</Badge>
                        )}
                     </div>
                     <p className="text-slate-400 text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase mt-1">Ref: <span className="text-primary select-all">#{order.id}</span></p>
                  </div>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-[32px] border border-slate-100 shadow-sm sm:w-fit">
               <Select value={order.status} onValueChange={handleStatusUpdate} disabled={updating}>
                  <SelectTrigger className={cn(
                    "h-12 rounded-[24px] border-none font-black text-[10px] uppercase tracking-widest px-6 shadow-sm transition-all",
                    order.status === 'completed' ? 'bg-emerald-500 text-white' : 
                    order.status === 'pending' ? 'bg-amber-500 text-white' : 
                    order.status === 'cancelled' ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white'
                  )}>
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-3xl border-none shadow-2xl p-1">
                     <SelectItem value="pending" className="rounded-xl font-black uppercase text-[10px]">Pending</SelectItem>
                     <SelectItem value="processing" className="rounded-xl font-black uppercase text-[10px]">Processing</SelectItem>
                     <SelectItem value="shipped" className="rounded-xl font-black uppercase text-[10px]">Shipped</SelectItem>
                     <SelectItem value="completed" className="rounded-xl font-black uppercase text-[10px] text-emerald-600">Completed</SelectItem>
                     <SelectItem value="cancelled" className="rounded-xl font-black uppercase text-[10px] text-rose-500">Cancelled</SelectItem>
                  </SelectContent>
               </Select>
               
               <div className="flex items-center gap-2 px-4 h-12 bg-slate-50 rounded-[24px]">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{order.paymentMethod || 'COD'}</span>
               </div>
            </div>
         </div>

         {/* Spam Warning */}
         {order.isSpam && (
            <div className="bg-rose-50 border-2 border-rose-100 rounded-[40px] p-6 sm:p-8 flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 animate-in slide-in-from-top-6 duration-700">
               <div className="w-16 h-16 bg-rose-600 rounded-[24px] flex items-center justify-center text-white shrink-0 shadow-2xl shadow-rose-200 rotate-3">
                  <ShieldAlert className="w-8 h-8" />
               </div>
               <div>
                  <h4 className="text-rose-900 font-black uppercase text-sm tracking-[0.2em]">High Risk Activity Detected</h4>
                  <p className="text-rose-600/80 text-xs sm:text-sm font-medium leading-relaxed mt-2 max-w-2xl">This transaction originated from a restricted or blacklisted network identity. We strongly recommend verifying the customer's identity before processing shipment.</p>
               </div>
            </div>
         )}

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
            <div className="lg:col-span-2 space-y-8 sm:space-y-12">
               {/* Order Content */}
               <Card className="rounded-[48px] border-none shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8 sm:p-10">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                              <Package className="w-6 h-6 text-primary" />
                           </div>
                           <CardTitle className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tighter">Inventory Details</CardTitle>
                        </div>
                        <Badge variant="outline" className="rounded-full px-4 py-1 border-slate-200 font-black text-[10px] uppercase text-slate-400">{order.items?.length || 0} ITEMS</Badge>
                     </div>
                  </CardHeader>
                  <CardContent className="p-0">
                     <div className="divide-y divide-slate-50">
                        {order.items?.map((item: any, idx: number) => (
                           <div key={idx} className="p-6 sm:p-8 flex items-center justify-between hover:bg-slate-50/30 transition-all duration-300 group">
                              <div className="flex items-center gap-6">
                                 <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] bg-slate-100 overflow-hidden border border-slate-50 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                    <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                                 </div>
                                 <div className="min-w-0">
                                    <h4 className="font-black text-slate-900 text-base sm:text-lg truncate tracking-tight">{item.name}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md">Qty: {item.quantity}</span>
                                       <span className="text-[10px] font-black text-primary uppercase tracking-widest">{getCurrencySymbol(currency)}{item.price} EA</span>
                                    </div>
                                 </div>
                              </div>
                              <p className="font-black text-slate-900 text-lg sm:text-xl tracking-tighter">{getCurrencySymbol(currency)}{(item.price * item.quantity).toFixed(2)}</p>
                           </div>
                        ))}
                     </div>

                     <div className="p-8 sm:p-12 bg-slate-50/50 border-t border-slate-100 flex flex-col items-end gap-3">
                        <div className="flex justify-between w-full max-w-[280px] text-xs font-black uppercase tracking-widest text-slate-400">
                           <span>Base Subtotal</span>
                           <span className="text-slate-600">{getCurrencySymbol(currency)}{(order.subtotal || order.total)?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between w-full max-w-[280px] text-xs font-black uppercase tracking-widest text-emerald-600">
                           <span>Logistics ({order.shipping?.name || 'Standard'})</span>
                           <span>{order.shippingCost > 0 ? `${getCurrencySymbol(currency)}${order.shippingCost.toFixed(2)}` : 'COMPLIMENTARY'}</span>
                        </div>
                        <Separator className="w-full max-w-[320px] my-4 opacity-50" />
                        <div className="flex justify-between items-center w-full max-w-[320px]">
                           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Final Invoice</span>
                           <span className="text-3xl sm:text-5xl font-black text-primary tracking-tighter">{getCurrencySymbol(currency)}{order.total?.toFixed(2)}</span>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               {/* Payment Intelligence Card */}
               <Card className="rounded-[48px] border-none shadow-2xl shadow-emerald-100/30 overflow-hidden bg-white relative">
                  <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
                  <CardHeader className="bg-emerald-50/50 p-8 sm:p-10">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                           <CreditCard className="w-6 h-6 text-emerald-600" />
                        </div>
                        <CardTitle className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-emerald-900">Payment Forensic</CardTitle>
                     </div>
                  </CardHeader>
                  <CardContent className="p-8 sm:p-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16">
                        <div className="space-y-8">
                           <div className="space-y-3">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Settlement Method</p>
                              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                 <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                                    {order.paymentMethod === 'cod' ? <Truck className="w-6 h-6 text-slate-400" /> : <Smartphone className="w-6 h-6 text-indigo-600" />}
                                 </div>
                                 <p className="font-black text-slate-900 uppercase text-xs tracking-widest">
                                    {order.paymentMethod === 'cod' ? "Cash on Delivery" : "Manual / Mobile Banking"}
                                 </p>
                              </div>
                           </div>

                           {order.paymentMethod === 'manual' && (
                              <div className="space-y-3 animate-in slide-in-from-top-4">
                                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Transaction Registry</p>
                                 <div className="bg-indigo-900 p-6 rounded-[32px] flex items-center justify-between shadow-xl shadow-indigo-200">
                                    <span className="font-mono text-xl sm:text-2xl font-black text-white select-all tracking-tighter">{order.transactionId || "NO_DATA"}</span>
                                    <Badge className="bg-primary text-white border-none uppercase text-[8px] font-black tracking-widest px-2 py-1 rounded-lg">VERIFIED</Badge>
                                 </div>
                              </div>
                           )}
                        </div>

                        <div className="space-y-8">
                           <div className="space-y-3">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Status Update</p>
                              <Select value={order.paymentStatus || "unpaid"} onValueChange={handlePaymentStatusUpdate} disabled={updating}>
                                 <SelectTrigger className={cn(
                                    "h-14 rounded-[28px] border-none font-black text-sm px-6 shadow-sm transition-all",
                                    order.paymentStatus === 'paid' ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-amber-500 text-white shadow-amber-200'
                                 )}>
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent className="rounded-3xl border-none shadow-2xl p-1">
                                    <SelectItem value="unpaid" className="font-black uppercase text-[10px] rounded-xl">Unpaid / In-Progress</SelectItem>
                                    <SelectItem value="paid" className="font-black uppercase text-[10px] rounded-xl text-emerald-600">Verified & Settled</SelectItem>
                                    <SelectItem value="refunded" className="font-black uppercase text-[10px] rounded-xl text-rose-500">Refund Issued</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>

                           <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center gap-4">
                              <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
                              <p className="text-[11px] text-slate-500 leading-relaxed font-medium italic">Full digital footprint including network metadata is encrypted and stored for this transaction.</p>
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </div>

            <div className="space-y-8 sm:space-y-12">
               {/* Customer Card */}
               <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                           <User className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl font-headline font-black uppercase tracking-tight">Client Profile</CardTitle>
                     </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                     <div className="flex flex-col gap-6">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Verified Identity</p>
                           <h3 className="text-2xl font-black text-slate-900 tracking-tight">{order.customer?.fullName}</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                           <a href={`tel:${order.customer?.phone}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-primary hover:border-primary transition-all">
                              <div className="flex items-center gap-4">
                                 <Phone className="w-4 h-4 text-primary group-hover:text-white" />
                                 <span className="text-xs font-black text-slate-600 group-hover:text-white uppercase tracking-widest">{order.customer?.phone}</span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-white" />
                           </a>
                           
                           {order.customer?.email && (
                              <a href={`mailto:${order.customer.email}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-primary hover:border-primary transition-all">
                                 <div className="flex items-center gap-4">
                                    <Mail className="w-4 h-4 text-primary group-hover:text-white" />
                                    <span className="text-xs font-black text-slate-600 group-hover:text-white truncate max-w-[150px] uppercase tracking-widest">{order.customer.email}</span>
                                 </div>
                                 <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-white" />
                              </a>
                           )}
                        </div>

                        <div className="space-y-2">
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Fulfillment Destination</p>
                           <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                              <p className="text-sm font-bold text-slate-700 leading-relaxed">{order.customer?.address}</p>
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               {/* Technical Metadata */}
               <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-900/20 overflow-hidden bg-slate-900 text-white">
                  <CardHeader className="p-8 border-b border-white/5">
                     <div className="flex items-center gap-4">
                        <Globe className="w-6 h-6 text-primary" />
                        <CardTitle className="text-xs font-black uppercase tracking-[0.3em]">Network Intelligence</CardTitle>
                     </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                     <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Gateway IP</p>
                        <p className="text-lg font-mono font-black text-primary select-all">{order.customer?.ip || "RESTRICTED"}</p>
                     </div>
                     <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Geospatial Lock</p>
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                           <p className="text-xs font-black uppercase tracking-widest text-slate-300">
                              {ipData?.city ? `${ipData.city}, ${ipData.country_name}` : "COORDINATING..."}
                           </p>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               {/* Fraud/Block Actions */}
               <Card className="rounded-[40px] border-none shadow-2xl shadow-rose-200/50 overflow-hidden relative group">
                  <div className="absolute top-0 left-0 w-full h-full bg-rose-600 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity" />
                  <CardHeader className="bg-rose-600 text-white p-8">
                     <div className="flex items-center gap-4">
                        <ShieldAlert className="w-6 h-6" />
                        <CardTitle className="text-xl font-headline font-black uppercase tracking-tight leading-none">Security Vault</CardTitle>
                     </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                     <p className="text-[11px] text-rose-700 font-bold leading-relaxed italic">Instantly restrict entities from future interactions. Action will be propagated across the store firewall.</p>

                     <div className="grid grid-cols-1 gap-3">
                        <Button
                           variant={isIpBlocked ? "secondary" : "outline"}
                           className={cn(
                             "rounded-2xl h-14 justify-start font-black text-[10px] uppercase tracking-widest px-6 transition-all",
                             isIpBlocked ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" : "border-rose-100 text-rose-600 hover:bg-rose-50"
                           )}
                           onClick={() => handleBlockAction('ip')}
                           disabled={blocking || !order.customer?.ip}
                        >
                           {isIpBlocked ? <Unlock className="w-4 h-4 mr-3" /> : <Fingerprint className="w-4 h-4 mr-3" />}
                           {blocking ? "COORDINATING..." : isIpBlocked ? "RELEASE IP RESTRICTION" : "RESTRICT IP ADDRESS"}
                        </Button>
                        
                        <Button
                           variant={isPhoneBlocked ? "secondary" : "outline"}
                           className={cn(
                             "rounded-2xl h-14 justify-start font-black text-[10px] uppercase tracking-widest px-6 transition-all",
                             isPhoneBlocked ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" : "border-rose-100 text-rose-600 hover:bg-rose-50"
                           )}
                           onClick={() => handleBlockAction('phone')}
                           disabled={blocking || !order.customer?.phone}
                        >
                           {isPhoneBlocked ? <Unlock className="w-4 h-4 mr-3" /> : <Phone className="w-4 h-4 mr-3" />}
                           {blocking ? "COORDINATING..." : isPhoneBlocked ? "RELEASE PHONE IDENTITY" : "RESTRICT PHONE IDENTITY"}
                        </Button>
                        
                        <Button
                           className="rounded-2xl h-14 justify-start bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest px-6 shadow-xl shadow-rose-200 transition-all active:scale-95"
                           onClick={() => handleBlockAction('customer')}
                           disabled={blocking}
                        >
                           <Lock className="w-4 h-4 mr-3" />
                           {blocking ? "ENCRYPTING DATA..." : "RESTRICT TOTAL IDENTITY"}
                        </Button>
                     </div>
                  </CardContent>
               </Card>
            </div>
         </div>
      </div>
   );;
}
