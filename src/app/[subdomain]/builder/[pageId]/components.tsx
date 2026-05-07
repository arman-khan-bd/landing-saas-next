"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LucideIcon, PlusCircle } from "lucide-react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function PropertySection({ label, icon: Icon, children }: { label: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 text-slate-900 group px-1">
        <Icon className="w-3 h-3 text-indigo-600" />
        <span className="font-headline font-bold text-[8px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="bg-slate-100/50 p-3 rounded-xl border border-slate-200 space-y-3">
        {children}
      </div>
    </div>
  );
}

export function WidgetGridButton({ icon: Icon, label, onClick, highlight = false }: { icon: LucideIcon; label: string; onClick: () => void; highlight?: boolean }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-20 flex-col gap-1.5 rounded-xl border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 transition-all group overflow-hidden shadow-sm",
        highlight ? "border-indigo-100 bg-indigo-50/50" : ""
      )}
    >
      <div className={cn(
        "p-1.5 rounded-lg transition-transform group-hover:scale-110",
        highlight ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={cn(
        "text-[8px] font-extrabold uppercase tracking-widest",
        highlight ? "text-indigo-600" : "text-slate-500"
      )}>{label}</span>
    </Button>
  );
}

export function AlignButton({ active, icon: Icon, onClick }: { active: boolean; icon: LucideIcon; onClick: () => void }) {
  return (
    <Button variant="ghost" onClick={onClick} className={cn("h-7 rounded-md px-0", active ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>
      <Icon className="w-3 h-3" />
    </Button>
  );
}
