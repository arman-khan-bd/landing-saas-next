"use client";

import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase";
import { 
  collection, getDocs, query, addDoc, updateDoc, 
  deleteDoc, doc, serverTimestamp, orderBy 
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, ShieldCheck, Zap, Globe, 
  Plus, Loader2, Trash2, Edit, CheckCircle2, 
  TrendingUp, XCircle, Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminSubscriptions() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    currency: "USD",
    billingInterval: "month",
    features: "",
    isActive: true
  });

  useEffect(() => {
    if (firestore) fetchPlans();
  }, [firestore]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const q = query(collection(firestore!, "subscriptionPlans"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setPlans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.price) return;
    setProcessing(true);
    try {
      const planData = {
        ...formData,
        price: Number(formData.price),
        features: formData.features.split(',').map(f => f.trim()).filter(f => f),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(firestore!, "subscriptionPlans"), planData);
      toast({ title: "Plan Created", description: "The subscription tier is now available." });
      resetForm();
      setIsCreateOpen(false);
      fetchPlans();
    } catch (error) {
      toast({ variant: "destructive", title: "Creation Failed" });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingPlan?.id) return;
    setProcessing(true);
    try {
      const planRef = doc(firestore!, "subscriptionPlans", editingPlan.id);
      const updateData = {
        ...formData,
        price: Number(formData.price),
        features: formData.features.split(',').map(f => f.trim()).filter(f => f),
        updatedAt: serverTimestamp(),
      };
      await updateDoc(planRef, updateData);
      toast({ title: "Plan Updated", description: "Changes have been saved." });
      setEditingPlan(null);
      resetForm();
      fetchPlans();
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this plan? Existing subscribers might be affected.")) return;
    try {
      await deleteDoc(doc(firestore!, "subscriptionPlans", id));
      toast({ title: "Plan Removed" });
      fetchPlans();
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      currency: "USD",
      billingInterval: "month",
      features: "",
      isActive: true
    });
  };

  const openEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: plan.price.toString(),
      currency: plan.currency || "USD",
      billingInterval: plan.billingInterval || "month",
      features: (plan.features || []).join(", "),
      isActive: plan.isActive ?? true
    });
  };

  const toggleStatus = async (plan: any) => {
    try {
      const planRef = doc(firestore!, "subscriptionPlans", plan.id);
      await updateDoc(planRef, { isActive: !plan.isActive, updatedAt: serverTimestamp() });
      toast({ title: "Status Changed", description: `Plan is now ${!plan.isActive ? 'Active' : 'Inactive'}.` });
      fetchPlans();
    } catch (error) {
      toast({ variant: "destructive", title: "Toggle Failed" });
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
           <h1 className="text-3xl font-headline font-black tracking-tight">Tier Management</h1>
           <p className="text-slate-500">Configure and monitor platform subscription offerings.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-14 px-8 font-black shadow-xl shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 w-6 h-6" /> Create Subscription Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[40px] bg-slate-900 border-white/5 text-slate-100 max-w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-3xl font-headline font-black">New Tier Concept</DialogTitle>
              <DialogDescription className="text-slate-400">Define a new subscription package for platform users.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Plan Name</Label>
                  <Input 
                    placeholder="e.g. Enterprise" 
                    className="h-12 rounded-xl bg-slate-800 border-none px-4" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Price</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                    <Input 
                      type="number" 
                      placeholder="99" 
                      className="h-12 rounded-xl bg-slate-800 border-none pl-8 pr-4" 
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</Label>
                <Textarea 
                  placeholder="Short marketing hook..." 
                  className="rounded-xl bg-slate-800 border-none min-h-[80px]" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Features (Comma Separated)</Label>
                <Input 
                  placeholder="Custom Domain, 0% Fee, AI Tools" 
                  className="h-12 rounded-xl bg-slate-800 border-none px-4" 
                  value={formData.features}
                  onChange={(e) => setFormData({...formData, features: e.target.value})}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-2xl">
                 <div className="space-y-0.5">
                    <p className="text-sm font-bold">Public Listing</p>
                    <p className="text-[10px] text-slate-400">Enable this plan for new subscribers.</p>
                 </div>
                 <Switch 
                   checked={formData.isActive} 
                   onCheckedChange={(val) => setFormData({...formData, isActive: val})} 
                 />
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-lg" onClick={handleCreate} disabled={processing}>
                {processing ? <Loader2 className="animate-spin mr-2" /> : "Deploy Tier"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Syncing Catalog</p>
        </div>
      ) : plans.length === 0 ? (
        <Card className="bg-slate-900 border-white/5 border-dashed border-2 rounded-[40px] py-32 text-center text-slate-500">
           <Info className="w-16 h-16 mx-auto mb-4 opacity-10" />
           <h3 className="text-xl font-black">No Active Tiers</h3>
           <p>Start your business model by creating your first plan.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.id} className={`bg-slate-900 border-white/5 rounded-[40px] overflow-hidden transition-all duration-500 shadow-2xl relative ${!plan.isActive ? 'opacity-60 grayscale' : 'hover:scale-[1.03]'}`}>
              <div className="absolute top-6 right-6 flex gap-2">
                 <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 text-slate-400 hover:text-white" onClick={() => openEdit(plan)}>
                    <Edit className="w-4 h-4" />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 text-rose-500 hover:bg-rose-500 hover:text-white" onClick={() => handleDelete(plan.id)}>
                    <Trash2 className="w-4 h-4" />
                 </Button>
              </div>

              <CardHeader className="p-8 border-b border-white/5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-indigo-600 text-white`}>
                  <Zap className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  {plan.name}
                  {!plan.isActive && <Badge className="bg-rose-500/20 text-rose-500 border-none text-[8px] font-black tracking-widest">HIDDEN</Badge>}
                </CardTitle>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-black text-white">${plan.price}</span>
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">/ {plan.billingInterval}</span>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                 <p className="text-sm text-slate-400 leading-relaxed min-h-[40px]">{plan.description || "No description provided."}</p>
                 
                 <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em]">Tier Privileges</p>
                    <div className="grid gap-2">
                       {(plan.features || []).map((feature: string, i: number) => (
                         <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            {feature}
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="space-y-0.5">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Visibility</p>
                       <p className="text-xs font-bold text-slate-300">{plan.isActive ? 'Active for Users' : 'Archived'}</p>
                    </div>
                    <Switch checked={plan.isActive} onCheckedChange={() => toggleStatus(plan)} />
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editingPlan && (
        <Dialog open={!!editingPlan} onOpenChange={(open) => { if(!open) { setEditingPlan(null); resetForm(); } }}>
          <DialogContent className="rounded-[40px] bg-slate-900 border-white/5 text-slate-100 max-w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-3xl font-headline font-black">Edit Tier: {editingPlan.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
               {/* Reuse form fields from handleCreate */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Plan Name</Label>
                  <Input 
                    placeholder="e.g. Enterprise" 
                    className="h-12 rounded-xl bg-slate-800 border-none px-4 text-white" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Price</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                    <Input 
                      type="number" 
                      placeholder="99" 
                      className="h-12 rounded-xl bg-slate-800 border-none pl-8 pr-4 text-white" 
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</Label>
                <Textarea 
                  placeholder="Short marketing hook..." 
                  className="rounded-xl bg-slate-800 border-none min-h-[80px] text-white" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Features (Comma Separated)</Label>
                <Input 
                  placeholder="Custom Domain, 0% Fee, AI Tools" 
                  className="h-12 rounded-xl bg-slate-800 border-none px-4 text-white" 
                  value={formData.features}
                  onChange={(e) => setFormData({...formData, features: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-lg" onClick={handleUpdate} disabled={processing}>
                {processing ? <Loader2 className="animate-spin mr-2" /> : "Save Configuration"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <Card className="bg-slate-900 border-white/5 rounded-[40px] overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5">
               <div className="flex items-center gap-4">
                  <TrendingUp className="text-indigo-500 w-6 h-6" />
                  <CardTitle className="text-2xl font-black">Platform Billing Snapshot</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
               <MetricItem label="Active Tiers Available" value={plans.filter(p => p.isActive).length} />
               <MetricItem label="Archived Offers" value={plans.filter(p => p.isActive === false).length} />
               <MetricItem label="Lowest Barrier Entry" value={plans.length > 0 ? `$${Math.min(...plans.map(p => p.price))}` : 'N/A'} />
               <MetricItem label="Highest Tier Ceiling" value={plans.length > 0 ? `$${Math.max(...plans.map(p => p.price))}` : 'N/A'} />
            </CardContent>
         </Card>

         <Card className="bg-indigo-600 rounded-[40px] border-none text-white shadow-indigo-600/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <CreditCard className="w-48 h-48" />
            </div>
            <CardContent className="p-10 space-y-6 relative z-10">
               <h3 className="text-3xl font-black leading-tight">Payout Configuration</h3>
               <p className="text-indigo-100/70 max-w-md">Connect your Stripe or PayPal account to receive platform processing fees and subscription revenue from your merchants.</p>
               <div className="pt-6">
                  <Button className="h-16 px-10 rounded-[24px] bg-white text-indigo-600 font-black text-lg hover:bg-indigo-50 shadow-xl">
                     Connect Payout Account
                  </Button>
               </div>
               <div className="flex items-center gap-4 pt-4 text-indigo-200">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Real-time Settling</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Verified Admin</div>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

function MetricItem({ label, value, positive = true }: any) {
  return (
    <div className="flex items-center justify-between">
       <span className="text-slate-400 font-medium">{label}</span>
       <span className={`font-black text-xl ${positive ? 'text-indigo-400' : 'text-rose-500'}`}>{value}</span>
    </div>
  );
}
