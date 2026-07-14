"use client";

import { useEffect, useState } from "react";
import { useSupabaseClient } from "@/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard, ShieldCheck, Zap, Globe,
  Plus, Loader2, Trash2, Edit, CheckCircle2,
  TrendingUp, XCircle, Info, CalendarClock,
  Smartphone, PlusCircle, Check, X, ShieldAlert,
  ShoppingBag, Layers, Receipt, ShieldCheck as CustomDomainIcon
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
  const supabase = useSupabaseClient();
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
    features: [] as string[],
    isActive: true,
    smsLimit: "100",
    productsLimit: "-1",
    pagesLimit: "-1",
    ordersLimit: "-1",
    customDomainEnabled: false
  });

  const [customFeatureInput, setCustomFeatureInput] = useState("");

  const presetFeatures = [
    "AI Content Assistant",
    "Realtime Dashboard Alerts",
    "Themes Customization",
    "Google Analytics & Facebook Pixel",
    "Bulk Import/Export",
    "Premium Storefront Layouts",
    "Fraud Block Protection",
    "Abandoned Cart Recovery",
    "Priority Support"
  ];

  useEffect(() => {
    if (supabase) fetchPlans();
  }, [supabase]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("created_at", { ascending: false });
      setPlans(data ?? []);
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
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        currency: formData.currency,
        billing_interval: formData.billingInterval,
        features: formData.features,
        is_active: formData.isActive,
        sms_limit: Number(formData.smsLimit),
        products_limit: Number(formData.productsLimit),
        pages_limit: Number(formData.pagesLimit),
        orders_limit: Number(formData.ordersLimit),
        custom_domain_enabled: formData.customDomainEnabled
      };
      await supabase.from("subscription_plans").insert(planData);
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
      const updateData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        currency: formData.currency,
        billing_interval: formData.billingInterval,
        features: formData.features,
        is_active: formData.isActive,
        sms_limit: Number(formData.smsLimit),
        products_limit: Number(formData.productsLimit),
        pages_limit: Number(formData.pagesLimit),
        orders_limit: Number(formData.ordersLimit),
        custom_domain_enabled: formData.customDomainEnabled
      };
      await supabase.from("subscription_plans").update(updateData).eq("id", editingPlan.id);
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
      await supabase.from("subscription_plans").delete().eq("id", id);
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
      features: [],
      isActive: true,
      smsLimit: "100",
      productsLimit: "-1",
      pagesLimit: "-1",
      ordersLimit: "-1",
      customDomainEnabled: false
    });
    setCustomFeatureInput("");
  };

  const openEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: plan.price.toString(),
      currency: plan.currency || "USD",
      billingInterval: plan.billing_interval || "month",
      features: plan.features || [],
      isActive: plan.is_active ?? true,
      smsLimit: (plan.sms_limit || 0).toString(),
      productsLimit: (plan.products_limit ?? -1).toString(),
      pagesLimit: (plan.pages_limit ?? -1).toString(),
      ordersLimit: (plan.orders_limit ?? -1).toString(),
      customDomainEnabled: plan.custom_domain_enabled ?? false
    });
  };

  const toggleStatus = async (plan: any) => {
    try {
      await supabase.from("subscription_plans").update({ is_active: !plan.is_active }).eq("id", plan.id);
      toast({ title: "Status Changed", description: `Plan is now ${!plan.is_active ? 'Active' : 'Inactive'}.` });
      fetchPlans();
    } catch (error) {
      toast({ variant: "destructive", title: "Toggle Failed" });
    }
  };

  const handleAddFeature = (feature: string) => {
    const trimmed = feature.trim();
    if (!trimmed) return;
    if (formData.features.includes(trimmed)) {
      toast({ variant: "destructive", title: "Feature Exists", description: "This feature is already added." });
      return;
    }
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, trimmed]
    }));
  };

  const handleRemoveFeature = (featureToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== featureToRemove)
    }));
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-headline font-black tracking-tight text-white uppercase">Tier Management</h1>
          <p className="text-slate-400 font-medium">Configure and monitor platform subscription offerings.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-14 px-8 font-black shadow-xl shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="mr-2 w-6 h-6" /> Create Subscription Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[40px] bg-slate-900 border-white/5 text-slate-100 max-w-[95vw] sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-3xl font-headline font-black uppercase text-white">New Tier Concept</DialogTitle>
              <DialogDescription className="text-slate-400">Define subscription package configurations and limitations.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-6 overflow-y-auto max-h-[65vh] pr-2 custom-scrollbar">
              
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Plan Name</Label>
                  <Input
                    placeholder="e.g. Enterprise"
                    className="h-12 rounded-xl bg-slate-800 border-none px-4 text-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Interval</Label>
                  <Select value={formData.billingInterval} onValueChange={(val) => setFormData({ ...formData, billingInterval: val })}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-800 border-none px-4 text-white">
                      <SelectValue placeholder="Select Interval" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-slate-800 border-white/10 text-white">
                      <SelectItem value="week">Weekly</SelectItem>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="year">Yearly</SelectItem>
                      <SelectItem value="lifetime">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</Label>
                <Textarea
                  placeholder="Short marketing hook..."
                  className="rounded-xl bg-slate-800 border-none min-h-[70px] text-white"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Limitations Panel */}
              <div className="p-6 bg-slate-950/40 rounded-3xl border border-white/5 space-y-6">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Usage Limits (-1 for Unlimited)</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5 text-indigo-400" /> Products Create Limit</Label>
                    <Input
                      type="number"
                      className="h-12 rounded-xl bg-slate-800 border-none px-4 text-white"
                      value={formData.productsLimit}
                      onChange={(e) => setFormData({ ...formData, productsLimit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-indigo-400" /> Landing Pages Limit</Label>
                    <Input
                      type="number"
                      className="h-12 rounded-xl bg-slate-800 border-none px-4 text-white"
                      value={formData.pagesLimit}
                      onChange={(e) => setFormData({ ...formData, pagesLimit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5 text-indigo-400" /> Monthly Orders Limit</Label>
                    <Input
                      type="number"
                      className="h-12 rounded-xl bg-slate-800 border-none px-4 text-white"
                      value={formData.ordersLimit}
                      onChange={(e) => setFormData({ ...formData, ordersLimit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-indigo-400" /> SMS Verification Limit</Label>
                    <Input
                      type="number"
                      className="h-12 rounded-xl bg-slate-800 border-none px-4 text-white"
                      value={formData.smsLimit}
                      onChange={(e) => setFormData({ ...formData, smsLimit: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-white flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-400" /> Custom Domain Integration</p>
                    <p className="text-[10px] text-slate-400">Allow users to bind their own domain to the shop.</p>
                  </div>
                  <Switch
                    checked={formData.customDomainEnabled}
                    onCheckedChange={(val) => setFormData({ ...formData, customDomainEnabled: val })}
                  />
                </div>
              </div>

              {/* Feature Selection & Custom Addition */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Platform Features Selection</Label>
                
                {/* Custom feature adder */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Type custom feature..."
                    className="h-12 rounded-xl bg-slate-800 border-none px-4 text-white"
                    value={customFeatureInput}
                    onChange={(e) => setCustomFeatureInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(customFeatureInput); setCustomFeatureInput(""); } }}
                  />
                  <Button type="button" onClick={() => { handleAddFeature(customFeatureInput); setCustomFeatureInput(""); }} className="rounded-xl px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12">
                    Add
                  </Button>
                </div>

                {/* presets suggestion */}
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Presets Recommendation:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {presetFeatures.map((feat) => {
                      const added = formData.features.includes(feat);
                      return (
                        <button
                          key={feat}
                          type="button"
                          onClick={() => added ? handleRemoveFeature(feat) : handleAddFeature(feat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${added ? 'bg-indigo-600 text-white border-none' : 'bg-slate-850 hover:bg-slate-800 border-white/5 text-slate-400'}`}
                        >
                          {added ? <Check className="w-3.5 h-3.5 inline mr-1" /> : <Plus className="w-3.5 h-3.5 inline mr-1" />}
                          {feat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Display added features */}
                <div className="space-y-2 pt-2">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">Plan Content Features List ({formData.features.length}):</p>
                  {formData.features.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No features added to this tier yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-2 bg-slate-950/20 rounded-2xl border border-white/5">
                      {formData.features.map((feat) => (
                        <Badge key={feat} className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border-indigo-500/20 rounded-xl px-3 py-1 flex items-center gap-1.5 text-xs font-bold">
                          {feat}
                          <button type="button" onClick={() => handleRemoveFeature(feat)}>
                            <X className="w-3 h-3 text-indigo-400 hover:text-white" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Public Listing Status */}
              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-2xl">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-white">Public Offer Status</p>
                  <p className="text-[10px] text-slate-400">Enable this plan to be selected by storefronts.</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(val) => setFormData({ ...formData, isActive: val })}
                />
              </div>
            </div>
            
            <DialogFooter className="p-6 border-t border-white/5">
              <Button className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-lg text-white" onClick={handleCreate} disabled={processing}>
                {processing ? <Loader2 className="animate-spin mr-2" /> : "Deploy Tier Offer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Render plans grid */}
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
            <Card key={plan.id} className={`bg-slate-900 border-white/5 rounded-[40px] overflow-hidden transition-all duration-500 shadow-2xl relative ${!plan.is_active ? 'opacity-60 grayscale' : 'hover:scale-[1.03]'}`}>
              <div className="absolute top-6 right-6 flex gap-2 z-10">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 text-slate-400 hover:text-white" onClick={() => openEdit(plan)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 text-rose-500 hover:bg-rose-500 hover:text-white" onClick={() => handleDelete(plan.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <CardHeader className="p-8 border-b border-white/5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-indigo-600 text-white">
                  <Zap className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl font-black text-white flex items-center gap-3">
                  {plan.name}
                  {!plan.is_active && <Badge className="bg-rose-500/20 text-rose-500 border-none text-[8px] font-black tracking-widest">HIDDEN</Badge>}
                </CardTitle>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-black text-white">${plan.price}</span>
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                    / {plan.billing_interval === 'lifetime' ? 'Lifetime' : plan.billing_interval}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="p-8 space-y-6">
                <p className="text-sm text-slate-400 leading-relaxed min-h-[40px]">{plan.description || "No description provided."}</p>

                {/* Limitations section */}
                <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">Products:</span>
                    <span className="text-indigo-400 font-black">
                      {plan.products_limit === -1 ? "Unlimited" : plan.products_limit}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">Landing Pages:</span>
                    <span className="text-indigo-400 font-black">
                      {plan.pages_limit === -1 ? "Unlimited" : plan.pages_limit}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">Orders/Month:</span>
                    <span className="text-indigo-400 font-black">
                      {plan.orders_limit === -1 ? "Unlimited" : plan.orders_limit}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">SMS Limits:</span>
                    <span className="text-indigo-400 font-black">{plan.sms_limit || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">Custom Domain:</span>
                    <span className="text-indigo-400 font-black">
                      {plan.custom_domain_enabled ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                {/* Bullet Features list */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Included Features</p>
                  <div className="space-y-1.5">
                    {(plan.features || []).map((feat: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-xs font-medium text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Visibility</p>
                    <p className="text-xs font-bold text-slate-300">{plan.is_active ? 'Active' : 'Archived'}</p>
                  </div>
                  <Switch checked={plan.is_active} onCheckedChange={() => toggleStatus(plan)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editing Dialog */}
      {editingPlan && (
        <Dialog open={!!editingPlan} onOpenChange={(open) => { if (!open) { setEditingPlan(null); resetForm(); } }}>
          <DialogContent className="rounded-[40px] bg-slate-900 border-white/5 text-slate-100 max-w-[95vw] sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-3xl font-headline font-black uppercase text-white">Edit Tier Offer: {editingPlan.name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-6 overflow-y-auto max-h-[65vh] pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Plan Name</Label>
                  <Input
                    placeholder="e.g. Enterprise"
                    className="h-12 rounded-xl bg-slate-800 border-none px-4 text-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Interval</Label>
                  <Select value={formData.billingInterval} onValueChange={(val) => setFormData({ ...formData, billingInterval: val })}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-800 border-none px-4 text-white">
                      <SelectValue placeholder="Select Interval" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-slate-800 border-white/10 text-white">
                      <SelectItem value="week">Weekly</SelectItem>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="year">Yearly</SelectItem>
                      <SelectItem value="lifetime">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</Label>
                <Textarea
                  placeholder="Short marketing hook..."
                  className="rounded-xl bg-slate-800 border-none min-h-[70px] text-white"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Limitations Panel */}
              <div className="p-6 bg-slate-950/40 rounded-3xl border border-white/5 space-y-6">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Usage Limits (-1 for Unlimited)</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5 text-indigo-400" /> Products Create Limit</Label>
                    <Input
                      type="number"
                      className="h-12 rounded-xl bg-slate-800 border-none px-4 text-white"
                      value={formData.productsLimit}
                      onChange={(e) => setFormData({ ...formData, productsLimit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-indigo-400" /> Landing Pages Limit</Label>
                    <Input
                      type="number"
                      className="h-12 rounded-xl bg-slate-800 border-none px-4 text-white"
                      value={formData.pagesLimit}
                      onChange={(e) => setFormData({ ...formData, pagesLimit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5 text-indigo-400" /> Monthly Orders Limit</Label>
                    <Input
                      type="number"
                      className="h-12 rounded-xl bg-slate-800 border-none px-4 text-white"
                      value={formData.ordersLimit}
                      onChange={(e) => setFormData({ ...formData, ordersLimit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-indigo-400" /> SMS Verification Limit</Label>
                    <Input
                      type="number"
                      className="h-12 rounded-xl bg-slate-800 border-none px-4 text-white"
                      value={formData.smsLimit}
                      onChange={(e) => setFormData({ ...formData, smsLimit: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-white flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-400" /> Custom Domain Integration</p>
                    <p className="text-[10px] text-slate-400">Allow users to bind their own domain to the shop.</p>
                  </div>
                  <Switch
                    checked={formData.customDomainEnabled}
                    onCheckedChange={(val) => setFormData({ ...formData, customDomainEnabled: val })}
                  />
                </div>
              </div>

              {/* Feature Selection & Custom Addition */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Platform Features Selection</Label>
                
                {/* Custom feature adder */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Type custom feature..."
                    className="h-12 rounded-xl bg-slate-800 border-none px-4 text-white"
                    value={customFeatureInput}
                    onChange={(e) => setCustomFeatureInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(customFeatureInput); setCustomFeatureInput(""); } }}
                  />
                  <Button type="button" onClick={() => { handleAddFeature(customFeatureInput); setCustomFeatureInput(""); }} className="rounded-xl px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12">
                    Add
                  </Button>
                </div>

                {/* presets suggestion */}
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Presets Recommendation:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {presetFeatures.map((feat) => {
                      const added = formData.features.includes(feat);
                      return (
                        <button
                          key={feat}
                          type="button"
                          onClick={() => added ? handleRemoveFeature(feat) : handleAddFeature(feat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${added ? 'bg-indigo-600 text-white border-none' : 'bg-slate-850 hover:bg-slate-800 border-white/5 text-slate-400'}`}
                        >
                          {added ? <Check className="w-3.5 h-3.5 inline mr-1" /> : <Plus className="w-3.5 h-3.5 inline mr-1" />}
                          {feat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Display added features */}
                <div className="space-y-2 pt-2">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">Plan Content Features List ({formData.features.length}):</p>
                  {formData.features.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No features added to this tier yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-2 bg-slate-950/20 rounded-2xl border border-white/5">
                      {formData.features.map((feat) => (
                        <Badge key={feat} className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border-indigo-500/20 rounded-xl px-3 py-1 flex items-center gap-1.5 text-xs font-bold">
                          {feat}
                          <button type="button" onClick={() => handleRemoveFeature(feat)}>
                            <X className="w-3 h-3 text-indigo-400 hover:text-white" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="p-6 border-t border-white/5">
              <Button className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-lg text-white" onClick={handleUpdate} disabled={processing}>
                {processing ? <Loader2 className="animate-spin mr-2" /> : "Save Configuration"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Snapshot metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-slate-900 border-white/5 rounded-[40px] overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
            <div className="flex items-center gap-4">
              <TrendingUp className="text-indigo-500 w-6 h-6" />
              <CardTitle className="text-2xl font-black text-white">Platform Billing Snapshot</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <MetricItem label="Active Tiers Available" value={plans.filter(p => p.is_active).length} />
            <MetricItem label="Archived Offers" value={plans.filter(p => p.is_active === false).length} />
            <MetricItem label="Lowest Barrier Entry" value={plans.length > 0 ? `$${Math.min(...plans.map(p => p.price))}` : 'N/A'} />
            <MetricItem label="Highest Tier Ceiling" value={plans.length > 0 ? `$${Math.max(...plans.map(p => p.price))}` : 'N/A'} />
          </CardContent>
        </Card>

        <Card className="bg-indigo-600 rounded-[40px] border-none text-white shadow-indigo-600/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <CreditCard className="w-48 h-48" />
          </div>
          <CardContent className="p-10 space-y-6 relative z-10">
            <h3 className="text-3xl font-black leading-tight text-white">Payout Configuration</h3>
            <p className="text-indigo-100/70 max-w-md">Connect your Stripe or PayPal account to receive platform processing fees and subscription revenue from your merchants.</p>
            <div className="pt-6">
              <Button className="h-16 px-10 rounded-[24px] bg-white text-indigo-600 font-black text-lg hover:bg-indigo-50 shadow-xl border-none">
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

      <SaasPaymentMethods />
    </div>
  );
}

function SaasPaymentMethods() {
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [methods, setMethods] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newMethod, setNewMethod] = useState({ name: "", details: "", isActive: true });

  useEffect(() => {
    if (supabase) fetchMethods();
  }, [supabase]);

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("saas_payment_methods")
        .select("*")
        .order("created_at", { ascending: false });
      setMethods(data ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newMethod.name || !newMethod.details) return;
    setSaving(true);
    try {
      await supabase.from("saas_payment_methods").insert({
        name: newMethod.name,
        details: newMethod.details,
        is_active: newMethod.isActive,
      });
      toast({ title: "Payment Method Added" });
      setNewMethod({ name: "", details: "", isActive: true });
      setIsAddOpen(false);
      fetchMethods();
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to add method" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from("saas_payment_methods").delete().eq("id", id);
      toast({ title: "Method Removed" });
      fetchMethods();
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to delete" });
    }
  };

  const toggleMethod = async (id: string, current: boolean) => {
    try {
      await supabase.from("saas_payment_methods").update({ is_active: !current }).eq("id", id);
      fetchMethods();
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  return (
    <Card className="bg-slate-900 border-white/5 rounded-[40px] overflow-hidden">
      <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <CreditCard className="text-indigo-500 w-6 h-6" />
            <CardTitle className="text-2xl font-black text-white">Subscription Payment Options</CardTitle>
          </div>
          <CardDescription className="text-slate-400 mt-1">Manage payment methods available for store managers to pay for their tiers.</CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 h-10 px-4 font-bold text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Method
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/5 text-white rounded-[32px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Add Payment Method</DialogTitle>
              <DialogDescription className="text-slate-400">Configure a manual payment option (e.g. Bank Transfer, bKash, etc.)</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Method Name</Label>
                <Input
                  placeholder="e.g. Bank Transfer"
                  className="h-12 rounded-xl bg-slate-800 border-none text-white"
                  value={newMethod.name}
                  onChange={e => setNewMethod({ ...newMethod, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Payment Details / Instructions</Label>
                <Textarea
                  placeholder="Enter account numbers, contact details, or instructions..."
                  className="rounded-xl bg-slate-800 border-none min-h-[120px] text-white"
                  value={newMethod.details}
                  onChange={e => setNewMethod({ ...newMethod, details: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white" onClick={handleAdd} disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : "Save Payment Method"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-8">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : methods.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No payment methods configured yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {methods.map(method => (
              <div key={method.id} className="p-6 bg-slate-800/50 rounded-3xl border border-white/5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-lg text-white">{method.name}</h4>
                  <div className="flex items-center gap-2">
                    <Switch checked={method.is_active} onCheckedChange={() => toggleMethod(method.id, method.is_active)} />
                    <Button variant="ghost" size="icon" className="text-rose-500 hover:bg-rose-500/10" onClick={() => handleDelete(method.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-slate-400 whitespace-pre-wrap bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                  {method.details}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
