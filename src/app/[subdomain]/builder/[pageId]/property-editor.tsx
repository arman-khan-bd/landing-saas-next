"use client";

import React from "react";
import { Block } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Trash2, Zap, Shield, Star, Heart, ShoppingCart, Truck, CreditCard, Lightbulb, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyEditorProps {
  block: Block;
  products: any[];
  onChange: (updates: any) => void;
}

const ICON_LIST = [
  { name: "Zap", icon: Zap },
  { name: "Shield", icon: Shield },
  { name: "Star", icon: Star },
  { name: "Heart", icon: Heart },
  { name: "ShoppingCart", icon: ShoppingCart },
  { name: "Truck", icon: Truck },
  { name: "CreditCard", icon: CreditCard },
  { name: "Lightbulb", icon: Lightbulb },
  { name: "Check", icon: Check },
  { name: "Info", icon: Info }
];

export function PropertyEditor({ block, products, onChange }: PropertyEditorProps) {
  switch (block.type) {
    case "header":
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Text Content</Label>
            <Input value={block.content?.text || ""} onChange={(e) => onChange({ content: { text: e.target.value } })} className="rounded-lg h-8 border-none bg-black/20 text-white text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Type</Label>
            <Select value={block.content?.level || "h2"} onValueChange={(v) => onChange({ content: { level: v } })}>
              <SelectTrigger className="rounded-lg h-8 border-none bg-black/20 text-white text-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="h1">Display 1</SelectItem>
                <SelectItem value="h2">Heading 2</SelectItem>
                <SelectItem value="h3">Subtitle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    case "paragraph":
      return (
        <div className="space-y-1">
          <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Body Text</Label>
          <Textarea value={block.content?.text || ""} onChange={(e) => onChange({ content: { text: e.target.value } })} className="rounded-lg min-h-[80px] text-xs leading-relaxed border-none bg-black/20 text-white" />
        </div>
      );
    case "image":
      return (
        <div className="space-y-1">
          <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Visual Asset</Label>
          <CloudinaryUpload value={block.content?.url || ""} onUpload={(url) => onChange({ content: { url } })} onRemove={() => onChange({ content: { url: "" } })} />
        </div>
      );
    case "button":
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Label</Label>
            <Input value={block.content?.text || ""} onChange={(e) => onChange({ content: { text: e.target.value } })} className="rounded-lg h-8 border-none bg-black/20 text-white text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Link</Label>
            <Input value={block.content?.link || ""} onChange={(e) => onChange({ content: { link: e.target.value } })} className="rounded-lg h-8 border-none bg-black/20 text-white text-xs" />
          </div>
        </div>
      );
    case "card":
      return (
        <div className="space-y-4">
           <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Title</Label>
              <Input value={block.content?.title || ""} onChange={(e) => onChange({ content: { title: e.target.value } })} className="rounded-lg h-8 border-none bg-black/20 text-white text-xs" />
           </div>
           <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Subtitle</Label>
              <Textarea value={block.content?.subtitle || ""} onChange={(e) => onChange({ content: { subtitle: e.target.value } })} className="rounded-lg min-h-[60px] border-none bg-black/20 text-white text-xs" />
           </div>
           <div className="space-y-2">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Pick Icon</Label>
              <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-black/20 rounded-lg">
                 {ICON_LIST.map(item => (
                   <button 
                    key={item.name}
                    onClick={() => onChange({ content: { iconName: item.name } })}
                    className={cn("p-1.5 rounded-md transition-all flex items-center justify-center", block.content?.iconName === item.name ? "bg-white text-primary" : "text-white/40 hover:bg-white/5")}
                   >
                     <item.icon className="w-3.5 h-3.5" />
                   </button>
                 ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Icon Color</Label>
                    <Input type="color" value={block.content?.iconColor || "#145DCC"} onChange={(e) => onChange({ content: { iconColor: e.target.value } })} className="h-7 w-full p-1 border-none bg-black/20 cursor-pointer" />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Icon Size ({block.content?.iconSize || 32}px)</Label>
                    <Slider value={[block.content?.iconSize || 32]} min={16} max={80} onValueChange={([v]) => onChange({ content: { iconSize: v } })} />
                 </div>
              </div>
           </div>
           <Separator className="bg-white/5" />
           <div className="space-y-2">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Card List System</Label>
              <div className="space-y-1.5">
                {(block.content?.items || []).map((item: string, idx: number) => (
                  <div key={idx} className="flex gap-1.5">
                    <Input value={item} onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[idx] = e.target.value;
                      onChange({ content: { items: newItems } });
                    }} className="h-7 text-[10px] bg-black/20 border-none text-white" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30 hover:text-rose-400" onClick={() => {
                      const newItems = block.content.items.filter((_: any, i: number) => i !== idx);
                      onChange({ content: { items: newItems } });
                    }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full h-7 text-[8px] border-dashed border-white/20 text-white/40 bg-transparent" onClick={() => {
                  const newItems = [...(block.content?.items || []), "New Feature Point"];
                  onChange({ content: { items: newItems } });
                }}>+ Add List Item</Button>
              </div>
              <div className="mt-2 space-y-1">
                <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">List Bullet Style</Label>
                <Select value={block.content?.listStyle || "check"} onValueChange={(v) => onChange({ content: { listStyle: v } })}>
                   <SelectTrigger className="h-7 rounded-lg border-none bg-black/20 text-white text-[9px]"><SelectValue /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="check">Checkmarks</SelectItem>
                      <SelectItem value="bullet">Bullets</SelectItem>
                      <SelectItem value="number">Numeric</SelectItem>
                      <SelectItem value="roman">Roman</SelectItem>
                      <SelectItem value="bengali">Bengali</SelectItem>
                   </SelectContent>
                </Select>
              </div>
           </div>
           <Separator className="bg-white/5" />
           <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Card Background Image</Label>
              <CloudinaryUpload value={block.content?.bgImage || ""} onUpload={(url) => onChange({ content: { bgImage: url } })} onRemove={() => onChange({ content: { bgImage: "" } })} />
           </div>
        </div>
      );
    case "carousel":
      const cols = block.style?.desktopColumns || 3;
      return (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Column Density (Desktop)</Label>
            <Select value={cols.toString()} onValueChange={(v) => onChange({ style: { desktopColumns: Number(v) } })}>
              <SelectTrigger className="rounded-lg h-8 border-none bg-black/20 text-white text-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Column</SelectItem>
                <SelectItem value="2">2 Columns</SelectItem>
                <SelectItem value="3">3 Columns</SelectItem>
                <SelectItem value="4">4 Columns</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
             <div className="flex items-center justify-between">
               <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Items</Label>
               <Button variant="ghost" size="sm" className="h-5 text-[8px] text-white/70 hover:text-white" onClick={() => {
                 const newItems = [...(block.content?.items || []), { id: Math.random().toString(36).substr(2, 9), title: `New Slide`, subtitle: "", imageUrl: "", buttonText: "" }];
                 onChange({ content: { items: newItems } });
               }}>Add Card</Button>
             </div>
             
             <div className="space-y-2">
               <Accordion type="single" collapsible className="w-full">
                 {(block.content?.items || []).map((item: any, index: number) => (
                   <AccordionItem key={item.id} value={item.id} className="border-white/10 border-none mb-1">
                     <AccordionTrigger className="hover:no-underline py-2 bg-black/20 px-3 rounded-lg text-white">
                       <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded bg-black/40 overflow-hidden border border-white/10 shrink-0">
                           {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover" />}
                         </div>
                         <span className="text-[9px] font-bold truncate max-w-[100px]">{item.title || `Slide ${index + 1}`}</span>
                       </div>
                     </AccordionTrigger>
                     <AccordionContent className="pt-2 pb-2 space-y-3 px-3 bg-black/40 rounded-b-lg -mt-1">
                       <CloudinaryUpload 
                         value={item.imageUrl} 
                         onUpload={(url) => {
                           const newItems = [...block.content.items];
                           newItems[index].imageUrl = url;
                           onChange({ content: { items: newItems } });
                         }} 
                         onRemove={() => {
                           const newItems = [...block.content.items];
                           newItems[index].imageUrl = "";
                           onChange({ content: { items: newItems } });
                         }} 
                       />
                       <div className="grid gap-2">
                         <Input 
                           placeholder="Card Title" 
                           value={item.title || ""} 
                           onChange={(e) => {
                             const newItems = [...block.content.items];
                             newItems[index].title = e.target.value;
                             onChange({ content: { items: newItems } });
                           }}
                           className="h-7 text-[9px] bg-black/20 border-none text-white"
                         />
                         <Input 
                           placeholder="Subtitle" 
                           value={item.subtitle || ""} 
                           onChange={(e) => {
                             const newItems = [...block.content.items];
                             newItems[index].subtitle = e.target.value;
                             onChange({ content: { items: newItems } });
                           }}
                           className="h-7 text-[9px] bg-black/20 border-none text-white"
                         />
                         <Input 
                           placeholder="Button Label" 
                           value={item.buttonText || ""} 
                           onChange={(e) => {
                             const newItems = [...block.content.items];
                             newItems[index].buttonText = e.target.value;
                             onChange({ content: { items: newItems } });
                           }}
                           className="h-7 text-[9px] bg-black/20 border-none text-white"
                         />
                       </div>
                       <Button variant="ghost" size="sm" className="w-full h-6 text-[8px] text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => {
                         const newItems = block.content.items.filter((_: any, i: number) => i !== index);
                         onChange({ content: { items: newItems } });
                       }}>Remove Slide</Button>
                     </AccordionContent>
                   </AccordionItem>
                 ))}
               </Accordion>
             </div>
          </div>
        </div>
      );
    case "checked-list":
      return (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">List Style</Label>
            <Select value={block.content?.listStyle || "check"} onValueChange={(v) => onChange({ content: { listStyle: v } })}>
              <SelectTrigger className="rounded-lg h-8 border-none bg-black/20 text-white text-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="check">Checkmark</SelectItem>
                <SelectItem value="bullet">Bullet List</SelectItem>
                <SelectItem value="number">Numbered List</SelectItem>
                <SelectItem value="roman">Roman Numerals</SelectItem>
                <SelectItem value="bengali">Bengali Numbers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">List Items</Label>
            <div className="space-y-1.5">
              {(block.content?.items || []).map((item: string, index: number) => (
                <div key={index} className="flex gap-1.5">
                  <Input 
                    value={item} 
                    onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[index] = e.target.value;
                      onChange({ content: { items: newItems } });
                    }}
                    className="h-7 text-[10px] bg-black/20 border-none text-white"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-red-400" onClick={() => {
                    const newItems = block.content.items.filter((_: any, i: number) => i !== index);
                    onChange({ content: { items: newItems } });
                  }}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
              <Button variant="outline" className="w-full h-7 text-[8px] bg-transparent border-white/20 text-white/70" onClick={() => {
                const newItems = [...(block.content?.items || []), "New Point"];
                onChange({ content: { items: newItems } });
              }}>Add Entry</Button>
            </div>
          </div>
        </div>
      );
    case "row":
      return (
        <div className="space-y-1">
          <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Grid Columns</Label>
          <Select value={block.content?.columns?.toString() || "2"} onValueChange={(v) => onChange({ content: { columns: Number(v) } })}>
            <SelectTrigger className="rounded-lg h-8 border-none bg-black/20 text-white text-[10px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Column</SelectItem>
              <SelectItem value="2">2 Columns</SelectItem>
              <SelectItem value="3">3 Columns</SelectItem>
              <SelectItem value="4">4 Columns</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    case "product-order-form":
      return (
        <div className="space-y-1">
          <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Select Product</Label>
          <Select value={block.content?.mainProductId || ""} onValueChange={(v) => onChange({ content: { mainProductId: v } })}>
            <SelectTrigger className="rounded-lg h-8 border-none bg-black/20 text-white text-[10px]"><SelectValue placeholder="Pick Product" /></SelectTrigger>
            <SelectContent className="rounded-lg">
              {products.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    default:
      return <div className="text-[8px] text-white/30 italic text-center py-2 uppercase font-bold tracking-widest">Configuration restricted</div>;
  }
}
