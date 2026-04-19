
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, ShieldCheck, Zap, Globe, 
  Settings, CheckCircle2, TrendingUp, Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminSubscriptions() {
  const plans = [
    { name: "Free Tier", price: "$0", users: 1250, color: "slate", icon: Globe },
    { name: "Pro Plan", price: "$29", users: 420, color: "indigo", icon: Zap },
    { name: "Enterprise", price: "$199", users: 15, color: "violet", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card key={plan.name} className="bg-slate-900 border-white/5 rounded-[40px] overflow-hidden hover:scale-[1.03] transition-transform duration-500 shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                plan.color === 'indigo' ? 'bg-indigo-600 text-white' : 
                plan.color === 'violet' ? 'bg-violet-600 text-white' : 
                'bg-slate-800 text-slate-400'
              }`}>
                <plan.icon className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-black">{plan.name}</CardTitle>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-black text-white">{plan.price}</span>
                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">/ month</span>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-slate-400 font-medium">Active Users</span>
                     <span className="font-black text-white">{plan.users}</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-slate-400 font-medium">Total MRR</span>
                     <span className="font-black text-indigo-400">${(plan.users * parseInt(plan.price.replace('$',''))).toLocaleString()}</span>
                  </div>
               </div>
               <Button className="w-full h-14 rounded-2xl font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10">
                  Manage Pricing
               </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <Card className="bg-slate-900 border-white/5 rounded-[40px] overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5">
               <div className="flex items-center gap-4">
                  <TrendingUp className="text-indigo-500 w-6 h-6" />
                  <CardTitle className="text-2xl font-black">Billing Metrics</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
               <MetricItem label="Average Revenue Per User (ARPU)" value="$18.40" />
               <MetricItem label="Customer Lifetime Value (LTV)" value="$540.00" />
               <MetricItem label="Churn Rate" value="2.4%" positive={false} />
               <MetricItem label="Net New Revenue" value="+$4,250.00" />
            </CardContent>
         </Card>

         <Card className="bg-indigo-600 rounded-[40px] border-none text-white shadow-indigo-600/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <CreditCard className="w-48 h-48" />
            </div>
            <CardContent className="p-10 space-y-6 relative z-10">
               <h3 className="text-3xl font-black leading-tight">Payout Configuration</h3>
               <p className="text-indigo-100/70 max-w-md">Connect your Stripe or PayPal account to receive platform processing fees and subscription revenue.</p>
               <div className="pt-6">
                  <Button className="h-16 px-10 rounded-[24px] bg-white text-indigo-600 font-black text-lg hover:bg-indigo-50 shadow-xl">
                     Connect Payout Account
                  </Button>
               </div>
               <div className="flex items-center gap-4 pt-4 text-indigo-200">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Next Payout: Dec 1</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Verified</div>
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
