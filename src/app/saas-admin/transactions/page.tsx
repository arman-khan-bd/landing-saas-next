"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, query, orderBy, onSnapshot, doc, updateDoc, 
  addDoc, serverTimestamp, getDocs, where, getDoc 
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, XCircle, Clock, Search, Filter, 
  MoreVertical, MessageSquare, ExternalLink, Loader2,
  Calendar, CreditCard, Store, User
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "saas_transactions"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (tx: any) => {
    setProcessing(true);
    try {
      // 1. Update transaction status
      await updateDoc(doc(db, "saas_transactions", tx.id), {
        status: "approved",
        updatedAt: serverTimestamp()
      });

      // 2. Find and update the store's subscription record
      const subQ = query(
        collection(db, "stores", tx.storeId, "subscription"),
        where("planId", "==", tx.planId),
        where("status", "==", "pending")
      );
      const subSnap = await getDocs(subQ);
      if (!subSnap.empty) {
        // Fetch plan to get billing interval
        const planSnap = await getDoc(doc(db, "subscriptionPlans", tx.planId));
        const planData = planSnap.exists() ? planSnap.data() : null;
        
        const now = new Date();
        const endDate = new Date();
        
        if (planData?.billingInterval === "year") {
          endDate.setFullYear(now.getFullYear() + 1);
        } else if (planData?.billingInterval === "week") {
          endDate.setDate(now.getDate() + 7);
        } else {
          // Default to monthly
          endDate.setMonth(now.getMonth() + 1);
        }

        await updateDoc(doc(db, "stores", tx.storeId, "subscription", subSnap.docs[0].id), {
          status: "active",
          currentPeriodStart: serverTimestamp(),
          currentPeriodEnd: endDate,
          updatedAt: serverTimestamp()
        });

        // Update main store doc for fast status check
        await updateDoc(doc(db, "stores", tx.storeId), {
          "subscription.status": "active",
          "subscription.currentPeriodEnd": endDate,
          "subscription.planId": tx.planId,
          "subscription.planName": tx.planName
        });
      }

      // 3. Send notification to owner
      await addDoc(collection(db, "system_notifications"), {
        userId: tx.ownerId,
        storeId: tx.storeId,
        type: "subscription_approved",
        title: "Subscription Approved",
        message: `Your payment for the ${tx.planName} plan has been verified. Your Pro features are now active!`,
        createdAt: serverTimestamp(),
        read: false
      });

      toast({ title: "Approved Successfully", description: "Store subscription is now active." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Approval Failed" });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionNote.trim()) {
      toast({ variant: "destructive", title: "Note Required", description: "Please provide a reason for rejection." });
      return;
    }
    setProcessing(true);
    try {
      // 1. Update transaction status
      await updateDoc(doc(db, "saas_transactions", selectedTx.id), {
        status: "rejected",
        rejectionNote,
        updatedAt: serverTimestamp()
      });

      // 2. Find and update the store's subscription record
      const subQ = query(
        collection(db, "stores", selectedTx.storeId, "subscription"),
        where("planId", "==", selectedTx.planId),
        where("status", "==", "pending")
      );
      const subSnap = await getDocs(subQ);
      if (!subSnap.empty) {
        await updateDoc(doc(db, "stores", selectedTx.storeId, "subscription", subSnap.docs[0].id), {
          status: "rejected",
          rejectionNote,
          updatedAt: serverTimestamp()
        });
      }

      // 3. Send notification to owner
      await addDoc(collection(db, "system_notifications"), {
        userId: selectedTx.ownerId,
        storeId: selectedTx.storeId,
        type: "subscription_rejected",
        title: "Subscription Rejected",
        message: `Your subscription request was rejected. Reason: ${rejectionNote}`,
        createdAt: serverTimestamp(),
        read: false
      });

      toast({ title: "Rejected successfully" });
      setShowRejectModal(false);
      setRejectionNote("");
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Rejection Failed" });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "rejected": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default: return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black tracking-tight text-white uppercase">Subscription Requests</h1>
          <p className="text-slate-400 font-medium">Verify and manage manual payment requests from store owners.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {transactions.length === 0 ? (
          <Card className="bg-slate-900 border-white/5 p-20 text-center rounded-[40px]">
            <Clock className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-300">No Transactions Found</h3>
            <p className="text-slate-500">All payment requests will appear here for verification.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {transactions.map((tx) => (
              <Card key={tx.id} className="bg-slate-900/50 border-white/5 rounded-[32px] overflow-hidden hover:bg-slate-900 transition-all duration-300 border-l-4 group" style={{ borderLeftColor: tx.status === 'pending' ? '#f59e0b' : tx.status === 'approved' ? '#10b981' : '#f43f5e' }}>
                <CardHeader className="p-6 pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <Badge className={getStatusColor(tx.status)}>
                      {tx.status.toUpperCase()}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-widest">
                      <Calendar className="w-3 h-3" />
                      {tx.createdAt?.toDate ? format(tx.createdAt.toDate(), "MMM dd, yyyy") : "Pending"}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-black text-white flex items-center gap-2">
                    <Store className="w-5 h-5 text-indigo-400" />
                    {tx.storeName}
                  </CardTitle>
                  <CardDescription className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">
                    {tx.subdomain}.ihut.shop
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Plan</p>
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        <CreditCard className="w-3 h-3 text-indigo-400" />
                        {tx.planName}
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Amount</p>
                      <p className="text-lg font-black text-indigo-400">${tx.amount}</p>
                    </div>
                  </div>

                  {(tx.paymentMethodName || tx.transactionId) && (
                    <div className="p-4 bg-white/5 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Payment Verification</p>
                      <div className="flex flex-col gap-1.5">
                        {tx.paymentMethodName && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-3 h-3 text-indigo-400" />
                            <p className="text-xs font-bold text-white uppercase tracking-tight">{tx.paymentMethodName}</p>
                          </div>
                        )}
                        {tx.transactionId && (
                          <div className="p-2 bg-black/20 rounded-lg border border-white/5">
                            <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Tranx ID</p>
                            <p className="text-xs font-mono text-indigo-300 break-all select-all">{tx.transactionId}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {tx.rejectionNote && (
                    <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Rejection Note</p>
                      <p className="text-xs text-slate-400">{tx.rejectionNote}</p>
                    </div>
                  )}

                  {tx.status === "pending" && (
                    <div className="flex gap-3 pt-2">
                      <Button 
                        onClick={() => handleApprove(tx)}
                        disabled={processing}
                        className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-black uppercase tracking-tight text-xs shadow-lg shadow-emerald-600/20"
                      >
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Approve</>}
                      </Button>
                      <Button 
                        onClick={() => {
                          setSelectedTx(tx);
                          setShowRejectModal(true);
                        }}
                        disabled={processing}
                        variant="outline"
                        className="flex-1 h-12 border-rose-500/20 hover:border-rose-500/40 text-rose-500 hover:bg-rose-500/10 rounded-xl font-black uppercase tracking-tight text-xs"
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="bg-slate-900 border-white/5 rounded-[40px] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white uppercase tracking-tight">Reject Request</DialogTitle>
            <DialogDescription className="text-slate-400">
              Please provide a reason why this payment verification failed.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Textarea 
              placeholder="e.g. Transaction ID not found or invalid amount..."
              className="bg-white/5 border-white/10 rounded-2xl min-h-[120px] text-white focus:border-indigo-500 transition-colors"
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-white">Cancel</Button>
            <Button 
              onClick={handleReject}
              disabled={processing}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
