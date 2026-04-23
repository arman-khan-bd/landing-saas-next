
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
  CheckCircle2, XCircle, Clock, Search, Globe, 
  MoreVertical, ShieldCheck, Loader2, Calendar, 
  Info, Database, Server
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function DomainRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedTx] = useState<any>(null);
  const [dnsData, setDnsData] = useState({ cname: "host.ihut.shop", a_record: "" });
  const [rejectionNote, setRejectionNote] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "custom_domain_requests"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApprove = async () => {
    if (!selectedReq) return;
    setProcessing(true);
    try {
      // 1. Update request status
      await updateDoc(doc(db, "custom_domain_requests", selectedReq.id), {
        status: "approved",
        dnsData: dnsData,
        updatedAt: serverTimestamp()
      });

      // 2. Update store record
      await updateDoc(doc(db, "stores", selectedReq.storeId), {
        customDomain: selectedReq.domain,
        customDomainStatus: "active",
        dnsData: dnsData,
        updatedAt: serverTimestamp()
      });

      // 3. Send notification
      await addDoc(collection(db, "system_notifications"), {
        userId: selectedReq.ownerId,
        storeId: selectedReq.storeId,
        type: "domain_approved",
        title: "Custom Domain Approved",
        message: `Your request for ${selectedReq.domain} has been approved. Please follow the DNS instructions in settings.`,
        createdAt: serverTimestamp(),
        read: false
      });

      toast({ title: "Approved Successfully" });
      setShowApproveModal(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Approval Failed" });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionNote.trim()) {
      toast({ variant: "destructive", title: "Note Required" });
      return;
    }
    setProcessing(true);
    try {
      await updateDoc(doc(db, "custom_domain_requests", selectedReq.id), {
        status: "rejected",
        rejectionNote,
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(db, "system_notifications"), {
        userId: selectedReq.ownerId,
        storeId: selectedReq.storeId,
        type: "domain_rejected",
        title: "Domain Request Rejected",
        message: `Your request for ${selectedReq.domain} was rejected. Reason: ${rejectionNote}`,
        createdAt: serverTimestamp(),
        read: false
      });

      toast({ title: "Request Rejected" });
      setShowRejectModal(false);
      setRejectionNote("");
    } catch (error) {
      toast({ variant: "destructive", title: "Rejection Failed" });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-black text-white uppercase tracking-tight">Domain Logistics</h1>
          <p className="text-slate-400">Validate and configure custom domain endpoints for Pro merchants.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {requests.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-slate-900/50 rounded-[48px] border-2 border-dashed border-white/5">
             <Globe className="w-16 h-16 mx-auto mb-4 text-slate-800" />
             <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No Pending Requests</p>
          </div>
        ) : requests.map((req) => (
          <Card key={req.id} className="bg-slate-900/40 border-white/5 rounded-[40px] overflow-hidden hover:bg-slate-900 transition-all border-l-4" style={{ borderLeftColor: req.status === 'pending' ? '#f59e0b' : req.status === 'approved' ? '#10b981' : '#f43f5e' }}>
            <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-start mb-6">
                 <Badge className={cn(
                    "border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                    req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                    req.status === 'rejected' ? 'bg-rose-500/10 text-rose-500' :
                    'bg-amber-500/10 text-amber-500'
                 )}>
                   {req.status}
                 </Badge>
                 <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                   <Clock className="w-3 h-3" />
                   {req.createdAt?.toDate ? format(req.createdAt.toDate(), "MMM dd, yyyy") : "Recent"}
                 </span>
              </div>
              <CardTitle className="text-2xl font-black text-white flex items-center gap-3">
                 <Globe className="w-6 h-6 text-indigo-400" />
                 {req.domain}
              </CardTitle>
              <CardDescription className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest mt-1">
                 {req.subdomain}.ihut.shop
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
               <div className="p-4 bg-white/5 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Store Identity</p>
                  <p className="text-sm font-bold text-white truncate">{req.storeName}</p>
               </div>

               {req.status === 'approved' && req.dnsData && (
                 <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-3">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active DNS Config</p>
                    <div className="grid gap-2">
                       {req.dnsData.cname && <div className="text-xs font-mono text-slate-300">CNAME: {req.dnsData.cname}</div>}
                       {req.dnsData.a_record && <div className="text-xs font-mono text-slate-300">A: {req.dnsData.a_record}</div>}
                    </div>
                 </div>
               )}

               {req.status === 'pending' && (
                 <div className="flex gap-3 pt-4">
                    <Button 
                      className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-black uppercase text-[10px] tracking-widest"
                      onClick={() => { setSelectedTx(req); setShowApproveModal(true); }}
                    >
                      Process & Approve
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-12 border-rose-500/20 text-rose-500 hover:bg-rose-500/10 rounded-xl font-black uppercase text-[10px] tracking-widest"
                      onClick={() => { setSelectedTx(req); setShowRejectModal(true); }}
                    >
                      Reject
                    </Button>
                 </div>
               )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent className="bg-slate-900 border-white/5 rounded-[40px] max-w-lg text-white">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tight uppercase">Configure DNS</DialogTitle>
            <DialogDescription className="text-slate-400">Specify the server endpoints for {selectedReq?.domain}</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">CNAME Host Target</Label>
                <div className="relative">
                   <Server className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                   <Input value={dnsData.cname} onChange={(e) => setDnsData({...dnsData, cname: e.target.value})} className="bg-slate-800 border-none rounded-xl h-12 pl-12" />
                </div>
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">A-Record (Optional IP)</Label>
                <div className="relative">
                   <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                   <Input value={dnsData.a_record} onChange={(e) => setDnsData({...dnsData, a_record: e.target.value})} placeholder="e.g. 76.76.21.21" className="bg-slate-800 border-none rounded-xl h-12 pl-12" />
                </div>
             </div>
          </div>
          <DialogFooter>
             <Button variant="ghost" onClick={() => setShowApproveModal(false)}>Cancel</Button>
             <Button onClick={handleApprove} disabled={processing} className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-tighter">
                {processing ? <Loader2 className="animate-spin" /> : "Deploy Configuration"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="bg-slate-900 border-white/5 rounded-[40px] max-w-md text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Decline Request</DialogTitle>
            <DialogDescription className="text-slate-400">Provide a specific reason for the merchant.</DialogDescription>
          </DialogHeader>
          <div className="py-6">
             <Textarea value={rejectionNote} onChange={(e) => setRejectionNote(e.target.value)} placeholder="e.g. Domain contains prohibited terms or is already registered..." className="bg-slate-800 border-none rounded-2xl min-h-[120px]" />
          </div>
          <DialogFooter>
             <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Button>
             <Button onClick={handleReject} disabled={processing} variant="destructive" className="h-12 rounded-xl font-black uppercase tracking-widest">
                Confirm Rejection
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
