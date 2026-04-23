
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
  Info, Database, Server, Plus, Trash2, Edit3, Type
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DNSRecord {
  id: string;
  type: "CNAME" | "A" | "AAAA" | "TXT" | "MX" | "CUSTOM";
  host: string;
  value: string;
}

export default function DomainRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  
  // Advanced DNS State
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([
    { id: "1", type: "CNAME", host: "@", value: "host.ihut.shop" }
  ]);
  
  const [rejectionNote, setRejectionNote] = useState("");
  const [showConfigModal, setShowConfigModal] = useState(false);
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

  const addRecord = () => {
    setDnsRecords([...dnsRecords, { id: Math.random().toString(36).substr(2, 9), type: "A", host: "", value: "" }]);
  };

  const removeRecord = (id: string) => {
    setDnsRecords(dnsRecords.filter(r => r.id !== id));
  };

  const updateRecord = (id: string, field: keyof DNSRecord, value: string) => {
    setDnsRecords(dnsRecords.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleProcessConfiguration = async () => {
    if (!selectedReq) return;
    if (dnsRecords.length === 0) {
      toast({ variant: "destructive", title: "Missing Data", description: "Please add at least one DNS record." });
      return;
    }

    setProcessing(true);
    try {
      const isUpdating = selectedReq.status === 'approved';
      
      // 1. Update request status and data
      await updateDoc(doc(db, "custom_domain_requests", selectedReq.id), {
        status: "approved",
        dnsRecords: dnsRecords,
        updatedAt: serverTimestamp()
      });

      // 2. Update store record
      await updateDoc(doc(db, "stores", selectedReq.storeId), {
        customDomain: selectedReq.domain,
        customDomainStatus: "active",
        dnsRecords: dnsRecords,
        updatedAt: serverTimestamp()
      });

      // 3. Send notification
      await addDoc(collection(db, "system_notifications"), {
        userId: selectedReq.ownerId,
        storeId: selectedReq.storeId,
        type: isUpdating ? "domain_updated" : "domain_approved",
        title: isUpdating ? "DNS Configuration Updated" : "Custom Domain Approved",
        message: isUpdating 
          ? `The DNS settings for ${selectedReq.domain} have been updated. Please verify your records.` 
          : `Your request for ${selectedReq.domain} has been approved. Please follow the DNS instructions in settings.`,
        createdAt: serverTimestamp(),
        read: false
      });

      toast({ title: isUpdating ? "Configuration Updated" : "Approved Successfully" });
      setShowConfigModal(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed" });
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

  const openConfigModal = (req: any) => {
    setSelectedReq(req);
    if (req.dnsRecords && Array.isArray(req.dnsRecords)) {
      setDnsRecords(req.dnsRecords);
    } else {
      setDnsRecords([{ id: "1", type: "CNAME", host: "@", value: "host.ihut.shop" }]);
    }
    setShowConfigModal(true);
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-black text-white uppercase tracking-tight">Domain Logistics</h1>
          <p className="text-slate-400">Advanced DNS infrastructure management for multi-tenant routing.</p>
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
            <CardContent className="p-8 pt-0 space-y-6">
               <div className="p-4 bg-white/5 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Store Identity</p>
                  <p className="text-sm font-bold text-white truncate">{req.storeName}</p>
               </div>

               {req.status === 'approved' && req.dnsRecords && (
                 <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-2">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Active Config ({req.dnsRecords.length} Records)</p>
                    <div className="space-y-1 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
                       {req.dnsRecords.map((r: DNSRecord) => (
                         <div key={r.id} className="text-[10px] font-mono text-slate-400 flex justify-between bg-black/20 p-1.5 rounded">
                            <span className="text-emerald-400 font-bold">{r.type}</span>
                            <span className="truncate max-w-[120px]">{r.value}</span>
                         </div>
                       ))}
                    </div>
                 </div>
               )}

               <div className="flex gap-3 pt-4">
                  {req.status === 'pending' ? (
                    <>
                      <Button 
                        className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-black uppercase text-[10px] tracking-widest"
                        onClick={() => openConfigModal(req)}
                      >
                        Approve & Config
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 h-12 border-rose-500/20 text-rose-500 hover:bg-rose-500/10 rounded-xl font-black uppercase text-[10px] tracking-widest"
                        onClick={() => { setSelectedReq(req); setShowRejectModal(true); }}
                      >
                        Reject
                      </Button>
                    </>
                  ) : req.status === 'approved' ? (
                    <Button 
                      variant="outline"
                      className="w-full h-12 border-white/10 text-white hover:bg-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2"
                      onClick={() => openConfigModal(req)}
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Update DNS Data
                    </Button>
                  ) : null}
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Advanced Configuration Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="bg-slate-900 border-white/5 rounded-[40px] max-w-2xl text-white">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tight uppercase">Advanced DNS Manager</DialogTitle>
            <DialogDescription className="text-slate-400">Configure global records for {selectedReq?.domain}</DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
             <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-3 custom-scrollbar">
                {dnsRecords.map((record, index) => (
                  <div key={record.id} className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-4 animate-in slide-in-from-top-2">
                     <div className="flex justify-between items-center">
                        <Badge className="bg-indigo-600 text-white border-none rounded-lg px-2 py-0.5 font-bold text-[9px]">RECORD #{index + 1}</Badge>
                        {dnsRecords.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-500/10" onClick={() => removeRecord(record.id)}>
                             <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                        <div className="sm:col-span-3 space-y-2">
                           <Label className="text-[9px] font-black uppercase text-slate-500">Type</Label>
                           <Select value={record.type} onValueChange={(val: any) => updateRecord(record.id, "type", val)}>
                              <SelectTrigger className="bg-slate-800 border-none rounded-xl h-10 text-xs">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-white/10 text-white">
                                 <SelectItem value="CNAME">CNAME</SelectItem>
                                 <SelectItem value="A">A Record</SelectItem>
                                 <SelectItem value="AAAA">AAAA</SelectItem>
                                 <SelectItem value="TXT">TXT</SelectItem>
                                 <SelectItem value="MX">MX</SelectItem>
                                 <SelectItem value="CUSTOM">Custom</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="sm:col-span-3 space-y-2">
                           <Label className="text-[9px] font-black uppercase text-slate-500">Host / Name</Label>
                           <Input value={record.host} onChange={(e) => updateRecord(record.id, "host", e.target.value)} placeholder="@ or www" className="bg-slate-800 border-none rounded-xl h-10 text-xs" />
                        </div>
                        <div className="sm:col-span-6 space-y-2">
                           <Label className="text-[9px] font-black uppercase text-slate-500">Value / Target</Label>
                           <Input value={record.value} onChange={(e) => updateRecord(record.id, "value", e.target.value)} placeholder="Points to..." className="bg-slate-800 border-none rounded-xl h-10 text-xs" />
                        </div>
                     </div>
                  </div>
                ))}
             </div>
             
             <Button variant="outline" className="w-full h-12 border-dashed border-white/10 rounded-2xl text-indigo-400 font-bold gap-2 hover:bg-white/5" onClick={addRecord}>
                <Plus className="w-4 h-4" /> Add Another Record
             </Button>
          </div>

          <DialogFooter>
             <Button variant="ghost" onClick={() => setShowConfigModal(false)}>Cancel</Button>
             <Button onClick={handleProcessConfiguration} disabled={processing} className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-tighter shadow-xl shadow-indigo-600/20">
                {processing ? <Loader2 className="animate-spin" /> : selectedReq?.status === 'approved' ? "Update Config" : "Deploy & Approve"}
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

