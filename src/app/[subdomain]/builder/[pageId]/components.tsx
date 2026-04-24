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
      <div className="flex items-center gap-2 text-white group px-1">
        <Icon className="w-3 h-3" />
        <span className="font-headline font-bold text-[8px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="bg-black/10 p-3 rounded-xl border border-white/5 space-y-3">
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
        "h-20 flex-col gap-1.5 rounded-xl border-slate-200 bg-white hover:bg-primary/5 hover:border-primary/50 transition-all group overflow-hidden shadow-sm",
        highlight ? "border-primary/20 bg-primary/5" : ""
      )}
    >
      <div className={cn(
        "p-1.5 rounded-lg transition-transform group-hover:scale-110",
        highlight ? "text-primary" : "text-slate-400 group-hover:text-primary"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={cn(
        "text-[8px] font-extrabold uppercase tracking-widest",
        highlight ? "text-primary" : "text-slate-500"
      )}>{label}</span>
    </Button>
  );
}

export function AlignButton({ active, icon: Icon, onClick }: { active: boolean; icon: LucideIcon; onClick: () => void }) {
  return (
    <Button variant="ghost" onClick={onClick} className={cn("h-7 rounded-md px-0", active ? "bg-white text-primary shadow-sm" : "text-white/40 hover:text-white")}>
      <Icon className="w-3 h-3" />
    </Button>
  );
}
