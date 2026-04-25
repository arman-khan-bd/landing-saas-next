
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
  Droplets, Activity, BookOpen, Quote, Microscope, Banknote, RotateCcw, CheckSquare, Plus, Menu, Palette, Image as ImageIcon,
  MousePointer2, PlayCircle, Code, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PropertySection } from "./components";
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
  "Circle", "Square", "Triangle", "Hexagon", "Pentagon", "Octagon", "Activity", "BookOpen", "Quote", "Microscope", "Banknote", "RotateCcw", "CheckSquare", "ShoppingBag", "Menu", "MousePointer2"
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
    case "navbar":
      return (
        <div className="space-y-6">
           <PropertySection label="Navigation Logic" icon={Settings}>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Bar Position</Label>
                    <Select value={block.content?.position || "normal"} onValueChange={(val) => onChange({ content: { position: val } })}>
                       <SelectTrigger className="h-8 bg-black/20 border-none text-white text-[10px]"><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="normal">Normal Flow</SelectItem>
                          <SelectItem value="sticky">Sticky (Scrolls)</SelectItem>
                          <SelectItem value="fixed">Fixed (Pins Top)</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="flex items-center justify-between p-2.5 bg-black/10 rounded-lg">
                    <Label className="text-[10px] font-bold text-white/90 uppercase">Sticky Header</Label>
                    <Switch checked={!!block.content?.sticky} onCheckedChange={(val) => onChange({ content: { sticky: val } })} />
                 </div>
                 <div className="flex items-center justify-between p-2.5 bg-black/10 rounded-lg">
                    <Label className="text-[10px] font-bold text-white/90 uppercase">Transparent</Label>
                    <Switch checked={!!block.content?.transparent} onCheckedChange={(val) => onChange({ content: { transparent: val } })} />
                 </div>
              </div>
           </PropertySection>

           <PropertySection label="Brand Logo" icon={Globe}>
              <div className="space-y-4">
                 <Select value={block.content?.logoType || "text"} onValueChange={(val) => onChange({ content: { logoType: val } })}>
                    <SelectTrigger className="h-8 bg-black/20 border-none text-white text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="text">Text Brand</SelectItem>
                       <SelectItem value="image">Image Logo</SelectItem>
                       <SelectItem value="icon">Icon Mark</SelectItem>
                    </SelectContent>
                 </Select>

                 {block.content?.logoType === "text" && (
                   <Input value={block.content?.logoText || ""} onChange={(e) => onChange({ content: { logoText: e.target.value } })} placeholder="Brand Name" className="h-8 bg-black/20 border-none text-white text-xs" />
                 )}

                 {block.content?.logoType === "image" && (
                   <CloudinaryUpload value={block.content?.logoUrl || ""} onUpload={(url) => onChange({ content: { logoUrl: url } })} onRemove={() => onChange({ content: { logoUrl: "" } })} />
                 )}

                 {block.content?.logoType === "icon" && (
                    <Select value={block.content?.logoIcon || "ShoppingBag"} onValueChange={(val) => onChange({ content: { logoIcon: val } })}>
                       <SelectTrigger className="h-8 bg-black/20 border-none text-white text-[10px]"><SelectValue /></SelectTrigger>
                       <SelectContent className="max-h-[200px]">
                          {COMMON_ICONS.map(i => <SelectItem key={i} value={i} className="text-[10px]">{i}</SelectItem>)}
                       </SelectContent>
                    </Select>
                 )}

                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Logo Position</Label>
                    <Select value={block.content?.logoPosition || "left"} onValueChange={(val) => onChange({ content: { logoPosition: val } })}>
                       <SelectTrigger className="h-8 bg-black/20 border-none text-white text-[10px]"><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </div>
           </PropertySection>

           <PropertySection label="Menu Items" icon={LayoutList}>
              <div className="space-y-3">
                 {(block.content?.items || []).map((item: any, idx: number) => (
                   <div key={idx} className="p-3 bg-black/20 rounded-xl space-y-2 relative group">
                      <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-5 w-5 text-rose-400 opacity-0 group-hover:opacity-100" onClick={() => {
                        const items = block.content.items.filter((_:any, i:number) => i !== idx);
                        onChange({ content: { items } });
                      }}><Trash2 className="w-2.5 h-2.5" /></Button>
                      <Input value={item.label} onChange={(e) => {
                         const items = [...block.content.items];
                         items[idx].label = e.target.value;
                         onChange({ content: { items } });
                      }} className="h-7 bg-black/20 border-none text-white text-[10px]" placeholder="Link Label" />
                      <Input value={item.link} onChange={(e) => {
                         const items = [...block.content.items];
                         items[idx].link = e.target.value;
                         onChange({ content: { items } });
                      }} className="h-7 bg-black/20 border-none text-white text-[10px]" placeholder="Link URL" />
                      <Select value={item.position || "center"} onValueChange={(val) => {
                         const items = [...block.content.items];
                         items[idx].position = val;
                         onChange({ content: { items } });
                      }}>
                         <SelectTrigger className="h-7 bg-black/20 border-none text-white text-[10px]"><SelectValue /></SelectTrigger>
                         <SelectContent>
                            <SelectItem value="left">Left Slot</SelectItem>
                            <SelectItem value="center">Center Slot</SelectItem>
                            <SelectItem value="right">Right Slot</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                 ))}
                 <Button variant="outline" className="w-full h-8 text-[9px] border-dashed border-white/10 bg-transparent text-white/40" onClick={() => {
                   const items = [...(block.content?.items || []), { id: Math.random().toString(36).substr(2, 9), label: "New Link", link: "/", position: "center" }];
                   onChange({ content: { items } });
                 }}>+ Add Menu Link</Button>
              </div>
           </PropertySection>
        </div>
      );

    case "ultra-hero":
      return (
        <div className="space-y-6">
           <PropertySection label="Background Design" icon={ImageIcon}>
              <div className="space-y-4">
                 <Select value={block.content?.bgType || "gradient"} onValueChange={(val) => onChange({ content: { bgType: val } })}>
                    <SelectTrigger className="h-8 bg-black/20 border-none text-white text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="gradient">Theme Gradient</SelectItem>
                       <SelectItem value="image">Custom Background Image</SelectItem>
                    </SelectContent>
                 </Select>
                 {block.content?.bgType === 'image' && (
                   <CloudinaryUpload 
                     value={block.content?.bgImage || ""}
                     onUpload={(url) => onChange({ content: { bgImage: url } })}
                     onRemove={() => onChange({ content: { bgImage: "" } })}
                   />
                 )}
              </div>
           </PropertySection>

           <PropertySection label="Typography Colors" icon={Palette}>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Badge Color</Label>
                    <Input type="color" value={block.content?.badgeColor || "#facc15"} onChange={(e) => onChange({ content: { badgeColor: e.target.value } })} className="h-8 w-full p-1 border-none bg-black/20 cursor-pointer rounded-lg" />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Title Color</Label>
                    <Input type="color" value={block.content?.titleColor || "#ffffff"} onChange={(e) => onChange({ content: { titleColor: e.target.value } })} className="h-8 w-full p-1 border-none bg-black/20 cursor-pointer rounded-lg" />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Subtitle Color</Label>
                    <Input type="color" value={block.content?.subtitleColor || "#fde047"} onChange={(e) => onChange({ content: { subtitleColor: e.target.value } })} className="h-8 w-full p-1 border-none bg-black/20 cursor-pointer rounded-lg" />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Phone Color</Label>
                    <Input type="color" value={block.content?.phoneTextColor || "#ffffff"} onChange={(e) => onChange({ content: { phoneTextColor: e.target.value } })} className="h-8 w-full p-1 border-none bg-black/20 cursor-pointer rounded-lg" />
                 </div>
              </div>
           </PropertySection>

           <PropertySection label="Button Design" icon={MousePointer2}>
              <div className="space-y-6">
                 {['cta', 'phone'].map((btn) => (
                   <div key={btn} className="p-3 bg-black/20 rounded-xl space-y-4">
                      <p className="text-[8px] font-black uppercase text-indigo-400">{btn === 'cta' ? 'Primary Button' : 'Secondary Button'}</p>
                      <div className="space-y-2">
                         <Label className="text-[7px] font-bold text-white/40 uppercase">Button Type</Label>
                         <Select value={block.content?.[`${btn}Type`] || (btn === 'cta' ? 'gradient' : 'outline')} onValueChange={(val) => onChange({ content: { [`${btn}Type`]: val } })}>
                            <SelectTrigger className="h-7 bg-black/20 border-none text-white text-[9px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                               <SelectItem value="gradient">Gradient</SelectItem>
                               <SelectItem value="solid">Solid</SelectItem>
                               <SelectItem value="outline">Outline</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <div className="space-y-1">
                            <Label className="text-[7px] font-bold text-white/40 uppercase">Bg Color</Label>
                            <Input type="color" value={block.content?.[`${btn}Bg`] || "#ffffff"} onChange={(e) => onChange({ content: { [`${btn}Bg`]: e.target.value } })} className="h-7 w-full p-1 border-none bg-black/20 rounded-md" />
                         </div>
                         <div className="space-y-1">
                            <Label className="text-[7px] font-bold text-white/40 uppercase">Font Color</Label>
                            <Input type="color" value={block.content?.[`${btn}TextColor`] || "#ffffff"} onChange={(e) => onChange({ content: { [`${btn}TextColor`]: e.target.value } })} className="h-7 w-full p-1 border-none bg-black/20 rounded-md" />
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </PropertySection>

           <PropertySection label="Ribbon Aesthetics" icon={LucideIcons.Sparkles}>
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Icon Color</Label>
                       <Input type="color" value={block.content?.ribbonIconColor || "#34d399"} onChange={(e) => onChange({ content: { ribbonIconColor: e.target.value } })} className="h-8 w-full p-1 border-none bg-black/20 rounded-lg" />
                    </div>
                    <div className="space-y-1">
                       <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Text Color</Label>
                       <Input type="color" value={block.content?.ribbonTextColor || "#ffffff"} onChange={(e) => onChange({ content: { ribbonTextColor: e.target.value } })} className="h-8 w-full p-1 border-none bg-black/20 rounded-lg" />
                    </div>
                 </div>
              </div>
           </PropertySection>

           <Separator className="bg-white/5" />

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
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Action Links</Label>
              <div className="grid gap-3">
                 <div className="p-3 bg-black/20 rounded-xl space-y-3">
                    <Label className="text-[7px] font-black text-indigo-400 uppercase">Primary CTA Text</Label>
                    <Input placeholder="Button Text" value={block.content?.ctaText || ""} onChange={(e) => onChange({ content: { ctaText: e.target.value } })} className="h-7 text-[10px] font-bold bg-black/20 border-none text-white" />
                    <Label className="text-[7px] font-black text-indigo-400 uppercase">Primary CTA Link</Label>
                    <Input placeholder="Link (e.g. [checkout])" value={block.content?.ctaLink || ""} onChange={(e) => onChange({ content: { ctaLink: e.target.value } })} className="h-7 text-[10px] font-bold bg-black/20 border-none text-white" />
                 </div>
                 <div className="p-3 bg-black/20 rounded-xl space-y-3">
                    <Label className="text-[7px] font-black text-yellow-400 uppercase">Phone Button Label</Label>
                    <Input placeholder="Phone Number" value={block.content?.phoneText || ""} onChange={(e) => onChange({ content: { phoneText: e.target.value } })} className="h-7 text-[10px] font-bold bg-black/20 border-none text-white" />
                    <Label className="text-[7px] font-black text-yellow-400 uppercase">Phone Button Link</Label>
                    <Input placeholder="Link (e.g. tel:016...)" value={block.content?.phoneLink || ""} onChange={(e) => onChange({ content: { phoneLink: e.target.value } })} className="h-7 text-[10px] font-bold bg-black/20 border-none text-white" />
                 </div>
              </div>
           </div>

           <Separator className="bg-white/5" />

           <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Trust ribbon items</Label>
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
        </div>
      );

    case "video":
      return (
        <div className="space-y-4">
           <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">YouTube / Vimeo URL</Label>
              <Input value={block.content?.url || ""} onChange={(e) => onChange({ content: { url: e.target.value } })} placeholder="https://..." className="rounded-lg h-8 border-none bg-black/20 text-white text-xs" />
           </div>
        </div>
      );

    case "code":
      return (
        <div className="space-y-4">
           <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Custom Script / Styles</Label>
              <Textarea 
                value={block.content?.code || ""} 
                onChange={(e) => onChange({ content: { code: e.target.value } })} 
                placeholder="<script>...</script>" 
                className="rounded-lg min-h-[200px] border-none bg-black/20 text-white text-xs font-mono" 
              />
           </div>
        </div>
      );

    case "footer":
      return (
        <div className="space-y-4">
           <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Brand Name</Label>
              <Input value={block.content?.brandName || ""} onChange={(e) => onChange({ content: { brandName: e.target.value } })} className="h-8 border-none bg-black/20 text-white text-xs" />
           </div>
           <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Business Summary</Label>
              <Textarea value={block.content?.description || ""} onChange={(e) => onChange({ content: { description: e.target.value } })} className="min-h-[60px] border-none bg-black/20 text-white text-xs" />
           </div>
           <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                 <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Phone</Label>
                 <Input value={block.content?.phone || ""} onChange={(e) => onChange({ content: { phone: e.target.value } })} className="h-8 border-none bg-black/20 text-white text-xs" />
              </div>
              <div className="space-y-1">
                 <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Email</Label>
                 <Input value={block.content?.email || ""} onChange={(e) => onChange({ content: { email: e.target.value } })} className="h-8 border-none bg-black/20 text-white text-xs" />
              </div>
           </div>
           <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Address</Label>
              <Input value={block.content?.address || ""} onChange={(e) => onChange({ content: { address: e.target.value } })} className="h-8 border-none bg-black/20 text-white text-xs" />
           </div>
           <div className="space-y-1">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Copyright Notice</Label>
              <Input value={block.content?.copyright || ""} onChange={(e) => onChange({ content: { copyright: e.target.value } })} className="h-8 border-none bg-black/20 text-white text-xs" />
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
                  }}><Trash2 className="w-3.5 h-3.5" /></Button>
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
