"use client";

import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase/provider";
import {
  collection, query, orderBy, onSnapshot, doc, updateDoc,
  addDoc, deleteDoc, serverTimestamp
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Trash2, Edit, Loader2, Zap, ShieldCheck, Star,
  Smartphone, Globe, Sparkles, Rocket, Lock,
  CheckCircle2, TrendingUp, Search, MousePointer2,
  Layout
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const ICON_OPTIONS = [
  { name: "Zap", icon: Zap },
  { name: "ShieldCheck", icon: ShieldCheck },
  { name: "Star", icon: Star },
  { name: "Smartphone", icon: Smartphone },
  { name: "Globe", icon: Globe },
  { name: "Sparkles", icon: Sparkles },
  { name: "Rocket", icon: Rocket },
  { name: "Lock", icon: Lock },
  { name: "CheckCircle2", icon: CheckCircle2 },
  { name: "TrendingUp", icon: TrendingUp },
  { name: "MousePointer2", icon: MousePointer2 }
];

export default function LandingPageManager() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "Zap",
    accent: "primary",
    order: 0
  });

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, "platformFeatures"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setFeatures(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [firestore]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) return;
    setProcessing(true);
    try {
      if (editingId) {
        await updateDoc(doc(firestore!, "platformFeatures", editingId), {
          ...formData,
          order: Number(formData.order),
          updatedAt: serverTimestamp()
        });
        toast({ title: "Feature Updated" });
      } else {
        await addDoc(collection(firestore!, "platformFeatures"), {
          ...formData,
          order: Number(formData.order),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast({ title: "Feature Added" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This feature will be removed from the public landing page.")) return;
    try {
      await deleteDoc(doc(firestore!, "platformFeatures", id));
      toast({ title: "Feature Removed" });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", icon: "Zap", accent: "primary", order: 0 });
    setEditingId(null);
  };

  const openEdit = (feature: any) => {
    setEditingId(feature.id);
    setFormData({
      title: feature.title,
      description: feature.description,
      icon: feature.icon || "Zap",
      accent: feature.accent || "primary",
      order: feature.order || 0
    });
    setIsDialogOpen(true);
  };

  const getIconComponent = (name: string) => {
    const option = ICON_OPTIONS.find(o => o.name === name);
    const Icon = option ? option.icon : Zap;
    return <Icon className="w-5 h-5" />;
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-headline font-black text-white uppercase tracking-tight">Feature Engine</h1>
          <p className="text-slate-400">Manage the highlights displayed on your platform's public landing page.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-14 px-8 font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20">
              <Plus className="mr-2 w-6 h-6" /> Add New Feature
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/5 text-white rounded-[40px] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-black uppercase">{editingId ? 'Edit Feature' : 'New Feature'}</DialogTitle>
              <DialogDescription className="text-slate-400">This content will be immediately visible on the homepage.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Icon Component</Label>
                <div className="grid grid-cols-5 gap-2 p-2 bg-black/20 rounded-2xl border border-white/5">
                  {ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt.name}
                      onClick={() => setFormData({ ...formData, icon: opt.name })}
                      className={`p-3 rounded-xl flex items-center justify-center transition-all ${formData.icon === opt.name ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}
                    >
                      <opt.icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Display Order</Label>
                  <Input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })} className="bg-slate-800 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Accent Color</Label>
                  <Select value={formData.accent} onValueChange={(val) => setFormData({ ...formData, accent: val })}>
                    <SelectTrigger className="bg-slate-800 border-none rounded-xl text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/5 text-white">
                      <SelectItem value="primary">Indigo (Primary)</SelectItem>
                      <SelectItem value="accent">Emerald (Accent)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Headline</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. 100% Secure Payments" className="bg-slate-800 border-none rounded-xl h-12" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Summary</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Briefly describe the benefit..." className="bg-slate-800 border-none rounded-xl min-h-[100px]" />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button onClick={handleSubmit} disabled={processing} className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-lg">
                {processing ? <Loader2 className="animate-spin" /> : editingId ? 'Update Content' : 'Publish Feature'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.length === 0 ? (
          <Card className="col-span-full bg-slate-900 border-dashed border-2 border-white/5 py-32 rounded-[40px] text-center text-slate-600">
            <Rocket className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="font-bold uppercase tracking-widest text-sm">No Features Listed</p>
          </Card>
        ) : (
          features.map((feature) => (
            <Card key={feature.id} className="bg-slate-900 border-white/5 rounded-[40px] overflow-hidden hover:bg-slate-900/80 transition-all group">
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-2xl bg-white/5 ${feature.accent === 'accent' ? 'text-emerald-500' : 'text-indigo-400'}`}>
                    {getIconComponent(feature.icon)}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(feature)} className="h-10 w-10 rounded-xl bg-white/5 hover:bg-indigo-600 hover:text-white">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(feature.id)} className="h-10 w-10 rounded-xl bg-white/5 hover:bg-rose-600 hover:text-white">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-black/40 text-[10px] font-black border-white/10 px-2 py-0.5 rounded-lg text-slate-500">POS: {feature.order}</Badge>
                    <h3 className="text-2xl font-black text-white">{feature.title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="bg-indigo-600/10 border border-indigo-600/20 rounded-[40px] p-10 flex flex-col items-center text-center space-y-4">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
          <Layout className="w-7 h-7" />
        </div>
        <h4 className="text-2xl font-black text-white uppercase tracking-tight">Live Preview Synced</h4>
        <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
          Changes made here are applied instantly using Firebase Real-time listeners. Your landing page is always up to date with your platform's latest highlights.
        </p>
      </div>
    </div>
  );
}
