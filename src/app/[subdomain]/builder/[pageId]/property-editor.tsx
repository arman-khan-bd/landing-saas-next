
"use client";

import React, { useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Block } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import * as LucideIcons from "lucide-react";
import { 
  Trash2, Zap, Shield, Heart, ShoppingCart, Truck, CreditCard, 
  Lightbulb, Check, Info, Columns, LayoutList, ChevronRight, Search,
  CheckCircle, Star, User, Settings, Mail, Phone, MapPin, Globe,
  Box, Package, Play, Pause, Sun, Moon, Wind, Tree, Trash, Edit, RefreshCw,
  Droplets, Activity, BookOpen, Quote, Microscope, Banknote, RotateCcw, CheckSquare, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { 
  ssr: false, 
  loading: () => <div className="h-48 bg-black/20 animate-pulse rounded-lg" /> 
});

interface PropertyEditorProps {
  block: Block;
  products: any[];
  onChange: (updates: any) => void;
}

const COMMON_ICONS = [
  "Zap", "Shield", "Star", "Heart", "ShoppingCart", "Truck", "CreditCard", "Lightbulb", "Check", "Info",
  "User", "Settings", "Mail", "Phone", "MapPin", "Calendar", "Clock", "Camera", "Video", "Music",
  "Globe", "Layers", "Layout", "Box", "Package", "Tag", "Search", "Edit", "Trash", "Archive",
  "Bell", "Bookmark", "Award", "Badge", "Gift", "Coffee", "Utensils", "Briefcase", "Home", "Key",
  "Cloud", "CloudUpload", "Download", "Share", "Send", "Link", "Eye", "EyeOff", "Lock", "Unlock",
  "CheckCircle", "AlertCircle", "AlertTriangle", "HelpCircle", "MinusCircle", "PlusCircle", "XCircle", "ZapOff", "Smartphone", "Tablet",
  "Monitor", "Tv", "Watch", "Wifi", "Battery", "Bluetooth", "HardDrive", "Cpu", "Server", "Database",
  "Flag", "Filter", "Folder", "File", "FileText", "Image", "Paperclip", "Maximize", "Minimize", "Move",
  "Play", "Pause", "Stop", "SkipBack", "SkipForward", "Repeat", "Shuffle", "Volume", "VolumeX", "Mic",
  "Sun", "Moon", "Wind", "Umbrella", "Thermometer", "Droplets", "Sunrise", "Sunset", "Mountain", "Tree",
  "Circle", "Square", "Triangle", "Hexagon", "Pentagon", "Octagon", "Activity", "BookOpen", "Quote", "Microscope", "Banknote", "RotateCcw", "CheckSquare"
];

export function PropertyEditor({ block, products, onChange }: PropertyEditorProps) {
  const quillRef = useRef<any>(null);
  const [iconSearch, setIconSearch] = React.useState("");

  const filteredIcons = useMemo(() => {
    const uniqueIcons = Array.from(new Set(COMMON_ICONS));
    return uniqueIcons.filter(i => i.toLowerCase().includes(iconSearch.toLowerCase()));
  }, [iconSearch]);

  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("upload_preset", "krishi-bazar");

      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/dj7pg5slk/image/upload`, {
          method: "POST",
          body: uploadData,
        });
        const data = await res.json();
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, "image", data.secure_url);
        }
      } catch (error) {
        console.error("Editor image upload error:", error);
      }
    };
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  }), [imageHandler]);

  switch (block.type) {
    case "ultra-hero":
      return (
        <div className="space-y-6">
           <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Trust Badge Text</Label>
              <Input value={block.content?.badgeText || ""} onChange={(e) => onChange({ content: { badgeText: e.target.value } })} className="rounded-lg h-8 border-none bg-black/20 text-white text-xs" />
           </div>
           
           <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Main Title</Label>
              <Textarea value={block.content?.title || ""} onChange={(e) => onChange({ content: { title: e.target.value } })} className="rounded-lg min-h-[80px] border-none bg-black/20 text-white text-xs" />
           </div>

           <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Subtitle</Label>
              <Input value={block.content?.subtitle || ""} onChange={(e) => onChange({ content: { subtitle: e.target.value } })} className="rounded-lg h-8 border-none bg-black/20 text-white text-xs" />
           </div>

           <Separator className="bg-white/5" />

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Brand Name</Label>
                <Input value={block.content?.brandTitle || ""} onChange={(e) => onChange({ content: { brandTitle: e.target.value } })} className="rounded-lg h-8 border-none bg-black/20 text-white text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Brand Slogan</Label>
                <Input value={block.content?.brandSubtitle || ""} onChange={(e) => onChange({ content: { brandSubtitle: e.target.value } })} className="rounded-lg h-8 border-none bg-black/20 text-white text-xs" />
              </div>
           </div>

           <Separator className="bg-white/5" />

           <div className="space-y-4">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Action Buttons</Label>
              <div className="grid gap-3">
                 <div className="p-3 bg-black/20 rounded-xl space-y-3">
                    <Label className="text-[7px] font-black text-indigo-400 uppercase">Primary CTA</Label>
                    <Input placeholder="Button Text" value={block.content?.ctaText || ""} onChange={(e) => onChange({ content: { ctaText: e.target.value } })} className="h-7 text-[10px] bg-black/20 border-none text-white" />
                    <Input placeholder="Link (e.g. [checkout])" value={block.content?.ctaLink || ""} onChange={(e) => onChange({ content: { ctaLink: e.target.value } })} className="h-7 text-[10px] bg-black/20 border-none text-white" />
                 </div>
                 <div className="p-3 bg-black/20 rounded-xl space-y-3">
                    <Label className="text-[7px] font-black text-yellow-400 uppercase">Phone Button</Label>
                    <Input placeholder="Phone Number" value={block.content?.phoneText || ""} onChange={(e) => onChange({ content: { phoneText: e.target.value } })} className="h-7 text-[10px] bg-black/20 border-none text-white" />
                    <Input placeholder="Link (e.g. tel:016...)" value={block.content?.phoneLink || ""} onChange={(e) => onChange({ content: { phoneLink: e.target.value } })} className="h-7 text-[10px] bg-black/20 border-none text-white" />
                 </div>
              </div>
           </div>

           <Separator className="bg-white/5" />

           <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Trust ribbon</Label>
                <Button variant="ghost" size="sm" className="h-5 text-[8px] text-white/70 hover:text-white" onClick={() => {
                   const items = [...(block.content?.trustItems || []), { iconName: "CheckSquare", label: "New Item" }];
                   onChange({ content: { trustItems: items } });
                }}>+ Add Item</Button>
              </div>
              <div className="space-y-2">
                 {(block.content?.trustItems || []).map((item: any, idx: number) => (
                   <div key={idx} className="p-3 bg-black/20 rounded-xl space-y-2 relative group">
                      <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-5 w-5 text-rose-400 opacity-0 group-hover:opacity-100" onClick={() => {
                         const items = block.content.trustItems.filter((_:any, i:number) => i !== idx);
                         onChange({ content: { trustItems: items } });
                      }}><Trash2 className="w-2.5 h-2.5" /></Button>
                      <div className="grid grid-cols-2 gap-2">
                         <Select value={item.iconName} onValueChange={(val) => {
                            const items = [...block.content.trustItems];
                            items[idx].iconName = val;
                            onChange({ content: { trustItems: items } });
                         }}>
                            <SelectTrigger className="h-7 bg-black/20 border-none text-[9px] text-white"><SelectValue placeholder="Icon" /></SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                               {COMMON_ICONS.map(i => <SelectItem key={i} value={i} className="text-[9px]">{i}</SelectItem>)}
                            </SelectContent>
                         </Select>
                         <Input placeholder="Label" value={item.label} onChange={(e) => {
                            const items = [...block.content.trustItems];
                            items[idx].label = e.target.value;
                            onChange({ content: { trustItems: items } });
                         }} className="h-7 text-[9px] bg-black/20 border-none text-white" />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      );

    case "quote":
      return (
        <div className="space-y-4">
           <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Quote Title</Label>
              <Input value={block.content?.title || ""} onChange={(e) => onChange({ content: { title: e.target.value } })} className="rounded-lg h-8 border-none bg-black/20 text-white text-xs" />
           </div>
           <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Quote Text</Label>
              <Textarea value={block.content?.text || ""} onChange={(e) => onChange({ content: { text: e.target.value } })} className="rounded-lg min-h-[80px] border-none bg-black/20 text-white text-xs" />
           </div>
           <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Source Reference (Citation)</Label>
              <Input value={block.content?.reference || ""} onChange={(e) => onChange({ content: { reference: e.target.value } })} placeholder="e.g. Sunan Ibn Majah" className="rounded-lg h-8 border-none bg-black/20 text-white text-xs" />
           </div>
           
           <Separator className="bg-white/5" />

           <div className="space-y-2">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Decoration Icon</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
                <Input 
                  placeholder="Search icons..." 
                  value={iconSearch} 
                  onChange={(e) => setIconSearch(e.target.value)} 
                  className="h-7 text-[10px] pl-7 bg-black/20 border-none text-white" 
                />
              </div>
              <div className="grid grid-cols-6 gap-1 p-1 bg-black/20 rounded-lg max-h-[120px] overflow-y-auto custom-scrollbar">
                {filteredIcons.map(iconName => {
                  const Icon = (LucideIcons as any)[iconName];
                  return (
                    <button 
                      key={iconName}
                      onClick={() => onChange({ content: { iconName } })}
                      className={cn("p-2 rounded-md transition-all flex items-center justify-center", block.content?.iconName === iconName ? "bg-white text-primary" : "text-white/40 hover:bg-white/5")}
                      title={iconName}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="space-y-1">
                 <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Accent Color</Label>
                 <Input type="color" value={block.style?.accentColor || "#1a7c3e"} onChange={(e) => onChange({ style: { accentColor: e.target.value } })} className="h-7 w-full p-1 border-none bg-black/20 cursor-pointer" />
              </div>
              <div className="space-y-1">
                 <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Ref Bg Color</Label>
                 <Input type="color" value={block.style?.refBgColor || "#f0fdf4"} onChange={(e) => onChange({ style: { refBgColor: e.target.value } })} className="h-7 w-full p-1 border-none bg-black/20 cursor-pointer" />
              </div>
           </div>
        </div>
      );
    case "marquee":
       return (
         <div className="space-y-4">
            <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Points to Scroll</Label>
            <div className="space-y-2">
               {(block.content?.items || []).map((item: string, idx: number) => (
                 <div key={idx} className="flex gap-2">
                    <Input value={item} onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[idx] = e.target.value;
                      onChange({ content: { items: newItems } });
                    }} className="bg-black/20 border-none h-8 text-xs text-white" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400" onClick={() => {
                      onChange({ content: { items: block.content.items.filter((_:any, i:number) => i !== idx) } });
                    }}><Trash2 className="w-3.5 h-3.5" /></Button>
                 </div>
               ))}
               <Button variant="outline" className="w-full h-8 text-[9px] border-dashed border-white/10 bg-transparent text-white/40" onClick={() => {
                 onChange({ content: { items: [...(block.content?.items || []), "New Point"] } });
               }}>+ Add Point</Button>
            </div>
         </div>
       );
    case "header":
    case "paragraph":
      return (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Text Content</Label>
            <Textarea value={block.content?.text || ""} onChange={(e) => onChange({ content: { text: e.target.value } })} className="rounded-lg min-h-[80px] border-none bg-black/20 text-white text-xs" />
            <p className="text-[7px] text-white/30 italic">Tip: Use [brackets] for animated highlight.</p>
          </div>
          {block.type === 'header' && (
            <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Header Level</Label>
              <Select value={block.content?.level || "h2"} onValueChange={(v) => onChange({ content: { level: v } })}>
                <SelectTrigger className="h-8 rounded-lg border-none bg-black/20 text-white text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1">Display (H1)</SelectItem>
                  <SelectItem value="h2">Section (H2)</SelectItem>
                  <SelectItem value="h3">Sub (H3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
             <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Highlight Color</Label>
             <Input type="color" value={block.style?.highlightColor || "#FFD700"} onChange={(e) => onChange({ style: { highlightColor: e.target.value } })} className="h-8 p-1 border-none bg-black/20 cursor-pointer" />
          </div>
        </div>
      );
    case "accordion":
      return (
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Row Registry</Label>
              <Button variant="ghost" size="sm" className="h-5 text-[8px] text-white/70 hover:text-white" onClick={() => {
                const newItems = [...(block.content?.items || []), { id: Math.random().toString(36).substr(2, 9), title: `New Row`, content: "", iconName: "Zap", subtitle: "", imageUrl: "" }];
                onChange({ content: { items: newItems } });
              }}>+ Add Row</Button>
           </div>
           <div className="space-y-2">
              <Accordion type="single" collapsible className="w-full">
                {(block.content?.items || []).map((item: any, index: number) => (
                  <AccordionItem key={item.id} value={item.id} className="border-none mb-1">
                    <AccordionTrigger className="hover:no-underline py-2 bg-black/20 px-3 rounded-lg text-white">
                      <span className="text-[9px] font-bold truncate max-w-[150px]">{item.title}</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-2 space-y-3 px-3 bg-black/40 rounded-b-lg -mt-1">
                       <div className="grid gap-2">
                          <Input placeholder="Title" value={item.title} onChange={(e) => {
                             const newItems = [...block.content.items];
                             newItems[index].title = e.target.value;
                             onChange({ content: { items: newItems } });
                          }} className="h-7 text-[9px] bg-black/20 border-none text-white" />
                          <Input placeholder="Subtitle" value={item.subtitle} onChange={(e) => {
                             const newItems = [...block.content.items];
                             newItems[index].subtitle = e.target.value;
                             onChange({ content: { items: newItems } });
                          }} className="h-7 text-[9px] bg-black/20 border-none text-white" />
                          <Select value={item.iconName} onValueChange={(val) => {
                             const newItems = [...block.content.items];
                             newItems[index].iconName = val;
                             onChange({ content: { items: newItems } });
                          }}>
                             <SelectTrigger className="h-7 bg-black/20 border-none text-[9px] text-white"><SelectValue placeholder="Icon" /></SelectTrigger>
                             <SelectContent className="max-h-[200px]">
                                {COMMON_ICONS.map(i => <SelectItem key={i} value={i} className="text-[9px]">{i}</SelectItem>)}
                             </SelectContent>
                          </Select>
                          <CloudinaryUpload value={item.imageUrl} onUpload={(url) => {
                             const newItems = [...block.content.items];
                             newItems[index].imageUrl = url;
                             onChange({ content: { items: newItems } });
                          }} onRemove={() => {
                             const newItems = [...block.content.items];
                             newItems[index].imageUrl = "";
                             onChange({ content: { items: newItems } });
                          }} />
                       </div>
                       <Textarea 
                         placeholder="Content body..." 
                         value={item.content} 
                         onChange={(e) => {
                           const newItems = [...block.content.items];
                           newItems[index].content = e.target.value;
                           onChange({ content: { items: newItems } });
                         }}
                         className="h-24 text-[9px] bg-black/20 border-none text-white"
                       />
                       <Button variant="ghost" size="sm" className="w-full h-6 text-[8px] text-red-400 hover:text-red-300" onClick={() => {
                         onChange({ content: { items: block.content.items.filter((_:any, i:number) => i !== index) } });
                       }}>Delete Item</Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
           </div>
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
            <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Destination Routing</Label>
            <Select value={block.content?.link || ""} onValueChange={(v) => onChange({ content: { link: v } })}>
              <SelectTrigger className="rounded-lg h-8 border-none bg-black/20 text-white text-[10px]"><SelectValue placeholder="Select Route" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="/">Storefront Home</SelectItem>
                <SelectItem value="/all-products">All Products Catalog</SelectItem>
                <SelectItem value="[checkout]">Scroll to Checkout Form</SelectItem>
                <Separator className="my-1" />
                <SelectItem value="https://">Custom External URL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    case "card":
      return (
        <div className="space-y-4">
           <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Layout Orientation</Label>
              <Select value={block.content?.layout || "vertical"} onValueChange={(v) => onChange({ content: { layout: v } })}>
                <SelectTrigger className="rounded-lg h-8 border-none bg-black/20 text-white text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical (Stacked)</SelectItem>
                  <SelectItem value="horizontal">Horizontal (Inline)</SelectItem>
                </SelectContent>
              </Select>
           </div>

           <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Title</Label>
              <Input value={block.content?.title || ""} onChange={(e) => onChange({ content: { title: e.target.value } })} className="rounded-lg h-8 border-none bg-black/20 text-white text-xs" />
           </div>
           <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Subtitle</Label>
              <Textarea value={block.content?.subtitle || ""} onChange={(e) => onChange({ content: { subtitle: e.target.value } })} className="rounded-lg min-h-[60px] border-none bg-black/20 text-white text-xs" />
           </div>

           <div className="flex items-center justify-between p-2.5 bg-black/10 rounded-lg border border-white/5">
              <Label className="text-[9px] font-bold text-white/90 uppercase">Show Icon</Label>
              <Switch checked={!!block.content?.showIcon} onCheckedChange={(val) => onChange({ content: { showIcon: val } })} />
           </div>

           {block.content?.showIcon && (
             <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Pick Icon</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
                    <Input 
                      placeholder="Search icons..." 
                      value={iconSearch} 
                      onChange={(e) => setIconSearch(e.target.value)} 
                      className="h-7 text-[10px] pl-7 bg-black/20 border-none text-white" 
                    />
                  </div>
                  <div className="grid grid-cols-6 gap-1 p-1 bg-black/20 rounded-lg max-h-[120px] overflow-y-auto custom-scrollbar">
                    {filteredIcons.map(iconName => {
                      const Icon = (LucideIcons as any)[iconName];
                      return (
                        <button 
                          key={iconName}
                          onClick={() => onChange({ content: { iconName } })}
                          className={cn("p-2 rounded-md transition-all flex items-center justify-center", block.content?.iconName === iconName ? "bg-white text-primary" : "text-white/40 hover:bg-white/5")}
                          title={iconName}
                        >
                          {Icon && <Icon className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                   <div className="space-y-1">
                      <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Icon Color</Label>
                      <Input type="color" value={block.content?.iconColor || "#145DCC"} onChange={(e) => onChange({ content: { iconColor: e.target.value } })} className="h-7 w-full p-1 border-none bg-black/20 cursor-pointer" />
                   </div>
                   <div className="space-y-1">
                      <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Size ({block.content?.iconSize || 32}px)</Label>
                      <Slider value={[block.content?.iconSize || 32]} min={16} max={120} onValueChange={([v]) => onChange({ content: { iconSize: v } })} />
                   </div>
                </div>
             </div>
           )}

           <div className="space-y-2">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Card Points</Label>
              <div className="space-y-1.5">
                {(block.content?.items || []).map((item: string, idx: number) => (
                  <div key={idx} className="flex gap-1.5">
                    <Input value={item} onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[idx] = e.target.value;
                      onChange({ content: { items: newItems } });
                    }} className="h-7 text-[10px] bg-black/20 border-none text-white" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30 hover:text-rose-400" onClick={() => {
                      onChange({ content: { items: block.content.items.filter((_:any, i:number) => i !== idx) } });
                    }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full h-7 text-[8px] border-dashed border-white/20 text-white/40 bg-transparent" onClick={() => {
                  onChange({ content: { items: [...(block.content?.items || []), "New Feature Point"] } });
                }}>+ Add List Item</Button>
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
        <div className="space-y-4">
          <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Package Target</Label>
          <div className="space-y-2">
            {(block.content?.productIds || []).map((pId: string) => {
              const p = products.find(prod => prod.id === pId);
              return (
                <div key={pId} className="flex items-center gap-2 bg-black/20 p-2 rounded-lg">
                  <span className="text-[10px] text-white flex-1 truncate">{p?.name || "Deleted Product"}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-rose-400" onClick={() => {
                    const newIds = block.content.productIds.filter((id: string) => id !== pId);
                    onChange({ content: { productIds: newIds, mainProductId: newIds[0] || "" } });
                  }}><Trash2 className="w-3 h-3" /></Button>
                </div>
              );
            })}
          </div>
          <Select onValueChange={(v) => {
            const currentIds = block.content?.productIds || [];
            if (!currentIds.includes(v)) {
              const newIds = [...currentIds, v];
              onChange({ content: { productIds: newIds, mainProductId: newIds[0] } });
            }
          }}>
            <SelectTrigger className="rounded-lg h-8 border-none bg-black/20 text-white text-[10px]"><SelectValue placeholder="Link Product" /></SelectTrigger>
            <SelectContent>
              {products.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    default:
      return <div className="text-[8px] text-white/30 italic text-center py-2 uppercase font-bold tracking-widest">Advanced widget selected</div>;
  }
}
