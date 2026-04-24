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
  Trash2, Zap, Shield, Star, Heart, ShoppingCart, Truck, CreditCard, 
  Lightbulb, Check, Info, Columns, LayoutList, ChevronRight, Search 
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

// A larger set of 150+ unique common icons from Lucide
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
  "Circle", "Square", "Triangle", "Hexagon", "Pentagon", "Octagon", "Activity", "TrendUp", "TrendDown",
  "DollarSign", "Euro", "PoundSterling", "Bitcoin", "Hash", "Percent", "Divide", "Plus", "Minus", "Equal",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ChevronUp", "ChevronDown", "ChevronLeft", "ChevronRight", "ChevronsUp", "ChevronsDown",
  "RotateCcw", "RotateCw", "RefreshCcw", "RefreshCw", "DownloadCloud", "UploadCloud", "ShoppingBag", "Wallet", "Banknote",
  "PieChart", "BarChart", "LineChart", "Target", "Trophy", "Rocket", "Anchor", "Compass", "LifeBuoy", "Map"
];

export function PropertyEditor({ block, products, onChange }: PropertyEditorProps) {
  const quillRef = useRef<any>(null);
  const [iconSearch, setIconSearch] = React.useState("");

  const filteredIcons = useMemo(() => {
    return COMMON_ICONS.filter(i => i.toLowerCase().includes(iconSearch.toLowerCase()));
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
    case "rich-text":
      return (
        <div className="space-y-2">
          <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">HTML Content Builder</Label>
          <div className="rounded-lg overflow-hidden border border-white/5 bg-white">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={block.content?.html || ""}
              onChange={(val) => onChange({ content: { html: val } })}
              modules={modules}
              className="text-slate-900 h-48"
            />
          </div>
        </div>
      );
    case "accordion":
      return (
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Manage Items</Label>
              <Button variant="ghost" size="sm" className="h-5 text-[8px] text-white/70 hover:text-white" onClick={() => {
                const newItems = [...(block.content?.items || []), { id: Math.random().toString(36).substr(2, 9), title: `Question ${ (block.content?.items?.length || 0) + 1 }`, content: "" }];
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
                       <Input 
                         placeholder="Title / Question" 
                         value={item.title} 
                         onChange={(e) => {
                           const newItems = [...block.content.items];
                           newItems[index].title = e.target.value;
                           onChange({ content: { items: newItems } });
                         }}
                         className="h-7 text-[9px] bg-black/20 border-none text-white"
                       />
                       <Textarea 
                         placeholder="Description / Content" 
                         value={item.content} 
                         onChange={(e) => {
                           const newItems = [...block.content.items];
                           newItems[index].content = e.target.value;
                           onChange({ content: { items: newItems } });
                         }}
                         className="h-20 text-[9px] bg-black/20 border-none text-white"
                       />
                       <Button variant="ghost" size="sm" className="w-full h-6 text-[8px] text-red-400 hover:text-red-300" onClick={() => {
                         const newItems = block.content.items.filter((_: any, i: number) => i !== index);
                         onChange({ content: { items: newItems } });
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
              <SelectContent className="rounded-lg">
                <SelectItem value="/">Storefront Home</SelectItem>
                <SelectItem value="/all-products">All Products Catalog</SelectItem>
                <SelectItem value="[checkout]">Scroll to Checkout Form</SelectItem>
                <Separator className="my-1" />
                <SelectItem value="https://">Custom External URL</SelectItem>
              </SelectContent>
            </Select>
            {block.content?.link && block.content.link !== "/" && block.content.link !== "/all-products" && block.content.link !== "[checkout]" && (
               <Input 
                 placeholder="Enter full URL..." 
                 value={block.content.link === "https://" ? "" : block.content.link} 
                 onChange={(e) => onChange({ content: { link: e.target.value } })} 
                 className="mt-1.5 h-7 rounded-lg border-none bg-black/20 text-white text-[10px]" 
               />
            )}
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

           <div className="flex items-center justify-between p-2.5 bg-black/10 rounded-lg border border-white/5">
              <Label className="text-[9px] font-bold text-white/90 uppercase">Show Icon</Label>
              <Switch checked={!!block.content?.showIcon} onCheckedChange={(val) => onChange({ content: { showIcon: val } })} />
           </div>

           {block.content?.showIcon && (
             <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Pick Icon (150+ Library)</Label>
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
                      <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Icon Size ({block.content?.iconSize || 32}px)</Label>
                      <Slider value={[block.content?.iconSize || 32]} min={16} max={120} onValueChange={([v]) => onChange({ content: { iconSize: v } })} />
                   </div>
                </div>
             </div>
           )}

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
        <div className="space-y-6">
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
          
          <div className="space-y-2">
            <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Component Registry</Label>
            <div className="p-4 bg-black/20 rounded-2xl border border-white/5 text-center space-y-2">
               <Columns className="w-5 h-5 text-white/20 mx-auto" />
               <p className="text-[10px] text-white/40">Manage nested elements directly on the canvas slots.</p>
            </div>
          </div>
        </div>
      );
    case "product-order-form":
      return (
        <div className="space-y-4 max-w-[75%]">
          <Label className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Selected Products</Label>
          <div className="space-y-2">
            {(block.content?.productIds || []).map((pId: string) => {
              const p = products.find(prod => prod.id === pId);
              return (
                <div key={pId} className="flex items-center gap-2 bg-black/20 p-2 rounded-lg">
                  <span className="text-[10px] text-white flex-1 truncate">{p?.name || "Deleted Product"}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-rose-400" onClick={() => {
                    const newIds = block.content.productIds.filter((id: string) => id !== pId);
                    onChange({ content: { productIds: newIds, mainProductId: newIds[0] || "" } });
                  }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
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
            <SelectTrigger className="rounded-lg h-8 border-none bg-black/20 text-white text-[10px]">
              <SelectValue placeholder="Add Product" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {products.filter(p => !(block.content?.productIds || []).includes(p.id)).map(p => (
                <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    default:
      return <div className="text-[8px] text-white/30 italic text-center py-2 uppercase font-bold tracking-widest">Configuration restricted</div>;
  }
}
