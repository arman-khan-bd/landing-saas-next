
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
  MousePointer2, PlayCircle, Code, ShieldCheck, List
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
              </div>
           </PropertySection>

           <PropertySection label="Content" icon={Edit}>
              <div className="space-y-3">
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Trust Badge</Label>
                    <Input value={block.content?.badgeText || ""} onChange={(e) => onChange({ content: { badgeText: e.target.value } })} className="h-8 bg-black/20 border-none text-white text-xs" />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Headline</Label>
                    <Textarea value={block.content?.title || ""} onChange={(e) => onChange({ content: { title: e.target.value } })} className="min-h-[80px] bg-black/20 border-none text-white text-xs" />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Subtitle</Label>
                    <Input value={block.content?.subtitle || ""} onChange={(e) => onChange({ content: { subtitle: e.target.value } })} className="h-8 bg-black/20 border-none text-white text-xs" />
                 </div>
              </div>
           </PropertySection>
        </div>
      );

    case "accordion":
      return (
        <div className="space-y-6">
           <PropertySection label="FAQ Content" icon={List}>
              <div className="space-y-3">
                 {(block.content?.items || []).map((item: any, idx: number) => (
                   <div key={idx} className="p-3 bg-black/20 rounded-xl space-y-2 relative group">
                      <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-5 w-5 text-rose-400 opacity-0 group-hover:opacity-100" onClick={() => {
                         const items = block.content.items.filter((_:any, i:number) => i !== idx);
                         onChange({ content: { items } });
                      }}><Trash2 className="w-2.5 h-2.5" /></Button>
                      <Input value={item.title} onChange={(e) => {
                         const items = [...block.content.items];
                         items[idx].title = e.target.value;
                         onChange({ content: { items } });
                      }} className="h-7 bg-black/20 border-none text-white text-[10px]" placeholder="Question Title" />
                      <Textarea value={item.content} onChange={(e) => {
                         const items = [...block.content.items];
                         items[idx].content = e.target.value;
                         onChange({ content: { items } });
                      }} className="min-h-[60px] bg-black/20 border-none text-white text-[10px]" placeholder="Answer content" />
                   </div>
                 ))}
                 <Button variant="outline" className="w-full h-8 text-[9px] border-dashed border-white/10 bg-transparent text-white/40" onClick={() => {
                   const items = [...(block.content?.items || []), { id: Math.random().toString(36).substr(2, 9), title: "New Question", content: "Description goes here..." }];
                   onChange({ content: { items } });
                 }}>+ Add FAQ Row</Button>
              </div>
           </PropertySection>
        </div>
      );

    case "card":
       return (
        <div className="space-y-6">
           <PropertySection label="Appearance" icon={LucideIcons.LayoutGrid}>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-white/40">Orientation</Label>
                    <Select value={block.content?.layout || "vertical"} onValueChange={(v) => onChange({ content: { layout: v } })}>
                       <SelectTrigger className="h-8 bg-black/20 border-none text-white text-[10px]"><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="vertical">Vertical (Stacked)</SelectItem>
                          <SelectItem value="horizontal">Horizontal (Inline)</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-white/40">List Prefix</Label>
                    <Select value={block.content?.listStyle || "check"} onValueChange={(v) => onChange({ content: { listStyle: v } })}>
                       <SelectTrigger className="h-8 bg-black/20 border-none text-white text-[10px]"><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="check">Checkmarks</SelectItem>
                          <SelectItem value="bullet">Bullets</SelectItem>
                          <SelectItem value="number">Numbers</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </div>
           </PropertySection>

           <PropertySection label="Identity" icon={LucideIcons.Type}>
              <div className="space-y-3">
                 <Input value={block.content?.title || ""} onChange={(e) => onChange({ content: { title: e.target.value } })} placeholder="Title" className="h-8 bg-black/20 border-none text-white text-xs" />
                 <Textarea value={block.content?.subtitle || ""} onChange={(e) => onChange({ content: { subtitle: e.target.value } })} placeholder="Description" className="min-h-[60px] bg-black/20 border-none text-white text-xs" />
              </div>
           </PropertySection>

           <PropertySection label="Iconographic" icon={LucideIcons.PlusCircle}>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold text-white/90">Visible Icon</Label>
                    <Switch checked={!!block.content?.showIcon} onCheckedChange={(v) => onChange({ content: { showIcon: v } })} />
                 </div>
                 {block.content?.showIcon && (
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[9px] text-white/40">Color</Label>
                          <Input type="color" value={block.content?.iconColor || "#145DCC"} onChange={(e) => onChange({ content: { iconColor: e.target.value } })} className="h-8 p-1 border-none bg-black/20 cursor-pointer" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] text-white/40">Size</Label>
                          <Input type="number" value={block.content?.iconSize || 32} onChange={(e) => onChange({ content: { iconSize: Number(e.target.value) } })} className="h-8 bg-black/20 border-none text-white text-xs" />
                        </div>
                      </div>
                      <Select value={block.content?.iconName || "Star"} onValueChange={(v) => onChange({ content: { iconName: v } })}>
                        <SelectTrigger className="h-8 bg-black/20 border-none text-white text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {COMMON_ICONS.map(i => <SelectItem key={i} value={i} className="text-[10px]">{i}</SelectItem>)}
                        </SelectContent>
                      </Select>
                   </div>
                 )}
              </div>
           </PropertySection>
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
        </div>
      );

    default:
      return <div className="text-[8px] text-white/30 italic text-center py-2 uppercase font-bold tracking-widest">Advanced widget selected</div>;
  }
}
