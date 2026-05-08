
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
  MousePointer2, PlayCircle, Code, ShieldCheck, List, Layout, Sparkles, Smartphone, ArrowRight
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
  "Circle", "Square", "Triangle", "Hexagon", "Pentagon", "Octagon", "Activity", "BookOpen", "Quote", "Microscope", "Banknote", "RotateCcw", "CheckSquare", "ShoppingBag", "Menu", "MousePointer2", "CheckCircle2", "ShieldCheck"
];

export function PropertyEditor({ block, products, onChange, config }: PropertyEditorProps) {
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

  return (
    <div className="space-y-6">
      {(() => {
        switch (block.type) {
    case "navbar":
      return (
        <div className="space-y-6">
           <PropertySection label="Navigation Logic" icon={Settings}>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase tracking-widest">Bar Position</Label>
                    <Select value={block.content?.position || "normal"} onValueChange={(val) => onChange({ content: { position: val } })}>
                       <SelectTrigger className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="normal">Normal Flow</SelectItem>
                          <SelectItem value="sticky">Sticky (Scrolls)</SelectItem>
                          <SelectItem value="fixed">Fixed (Pins Top)</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="flex items-center justify-between p-2.5 bg-slate-200/50 rounded-lg">
                    <Label className="text-[10px] font-bold text-slate-900 font-black uppercase">Transparent</Label>
                    <Switch checked={!!block.content?.transparent} onCheckedChange={(val) => onChange({ content: { transparent: val } })} />
                 </div>
              </div>
           </PropertySection>

           <PropertySection label="Brand Logo" icon={Globe}>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold text-slate-900 font-black">Show Logo</Label>
                    <Switch checked={block.content?.showLogo !== false} onCheckedChange={(val) => onChange({ content: { showLogo: val } })} />
                 </div>
                 {block.content?.showLogo !== false && (
                    <>
                       <Select value={block.content?.logoType || "text"} onValueChange={(val) => onChange({ content: { logoType: val } })}>
                          <SelectTrigger className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                             <SelectItem value="text">Text Brand</SelectItem>
                             <SelectItem value="image">Image Logo</SelectItem>
                             <SelectItem value="icon">Icon Mark</SelectItem>
                          </SelectContent>
                       </Select>

                 {block.content?.logoType === "text" && (
                   <Input value={block.content?.logoText || ""} onChange={(e) => onChange({ content: { logoText: e.target.value } })} placeholder="Brand Name" className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-xs" />
                 )}

                 {block.content?.logoType === "image" && (
                   <CloudinaryUpload value={block.content?.logoUrl || ""} onUpload={(url) => onChange({ content: { logoUrl: url } })} onRemove={() => onChange({ content: { logoUrl: "" } })} />
                 )}

                 {block.content?.logoType === "icon" && (
                    <Select value={block.content?.logoIcon || "ShoppingBag"} onValueChange={(val) => onChange({ content: { logoIcon: val } })}>
                       <SelectTrigger className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                       <SelectContent className="max-h-[200px]">
                          {COMMON_ICONS.map(i => <SelectItem key={i} value={i} className="text-[10px]">{i}</SelectItem>)}
                       </SelectContent>
                    </Select>
                 )}
                 </>
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
                      }} className="h-7 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]" placeholder="Link Label" />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[7px] text-slate-500 uppercase font-black">Scroll Link</Label>
                          <Select 
                            value={item.targetId || "none"} 
                            onValueChange={(val) => {
                              const items = [...block.content.items];
                              items[idx].targetId = val === "none" ? undefined : val;
                              onChange({ content: { items } });
                            }}
                          >
                            <SelectTrigger className="h-7 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]">
                              <SelectValue placeholder="Jump..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-[10px]">None</SelectItem>
                              {(config || []).filter(b => b.id !== block.id).map(b => (
                                <SelectItem key={b.id} value={b.id} className="text-[10px]">
                                  {b.type.toUpperCase()} ({b.id.substr(0, 4)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[7px] text-slate-500 uppercase font-black">URL Link</Label>
                          <Input value={item.link} onChange={(e) => {
                             const items = [...block.content.items];
                             items[idx].link = e.target.value;
                             onChange({ content: { items } });
                          }} className="h-7 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]" placeholder="URL" />
                        </div>
                      </div>

                      <Select value={item.position || "center"} onValueChange={(val) => {
                         const items = [...block.content.items];
                         items[idx].position = val;
                         onChange({ content: { items } });
                      }}>
                         <SelectTrigger className="h-7 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                         <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                 ))}
                 <Button variant="outline" className="w-full h-8 text-[9px] border-dashed border-white/10 bg-transparent text-slate-600 font-medium" onClick={() => {
                   const items = [...(block.content?.items || []), { id: Math.random().toString(36).substr(2, 9), label: "New Link", link: "/", position: "center" }];
                   onChange({ content: { items } });
                 }}>+ Add Menu Link</Button>
              </div>
           </PropertySection>

           <PropertySection label="Action Buttons" icon={PlusCircle}>
              <div className="space-y-3">
                 {(block.content?.buttons || []).map((btn: any, idx: number) => (
                   <div key={idx} className="p-3 bg-black/20 rounded-xl space-y-2 relative group">
                      <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-5 w-5 text-rose-400 opacity-0 group-hover:opacity-100" onClick={() => {
                        const buttons = block.content.buttons.filter((_:any, i:number) => i !== idx);
                        onChange({ content: { buttons } });
                      }}><Trash2 className="w-2.5 h-2.5" /></Button>
                      <Input value={btn.label} onChange={(e) => {
                         const buttons = [...block.content.buttons];
                         buttons[idx].label = e.target.value;
                         onChange({ content: { buttons } });
                      }} className="h-7 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]" placeholder="Button Label" />
                      <Input value={btn.link} onChange={(e) => {
                         const buttons = [...block.content.buttons];
                         buttons[idx].link = e.target.value;
                         onChange({ content: { buttons } });
                      }} className="h-7 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]" placeholder="Link URL" />
                      <div className="grid grid-cols-2 gap-2">
                          <Select value={btn.position || "right"} onValueChange={(val) => {
                             const buttons = [...block.content.buttons];
                             buttons[idx].position = val;
                             onChange({ content: { buttons } });
                          }}>
                             <SelectTrigger className="h-7 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                             </SelectContent>
                          </Select>
                          <Select value={btn.type || "solid"} onValueChange={(val) => {
                             const buttons = [...block.content.buttons];
                             buttons[idx].type = val;
                             onChange({ content: { buttons } });
                          }}>
                             <SelectTrigger className="h-7 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="solid">Solid Color</SelectItem>
                                <SelectItem value="outline">Outline</SelectItem>
                                <SelectItem value="gradient">Gradient</SelectItem>
                                <SelectItem value="flat">Flat</SelectItem>
                                <SelectItem value="texture">Texture</SelectItem>
                                <SelectItem value="image">Image</SelectItem>
                             </SelectContent>
                          </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[8px] text-slate-600 font-medium">BG/Gradient Color</Label>
                          <Input type="color" value={btn.bgColor || "#145DCC"} onChange={(e) => {
                             const buttons = [...block.content.buttons];
                             buttons[idx].bgColor = e.target.value;
                             onChange({ content: { buttons } });
                          }} className="h-7 w-full p-1 border-none bg-black/20 cursor-pointer" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] text-slate-600 font-medium">Text Color</Label>
                          <Input type="color" value={btn.textColor || "#ffffff"} onChange={(e) => {
                             const buttons = [...block.content.buttons];
                             buttons[idx].textColor = e.target.value;
                             onChange({ content: { buttons } });
                          }} className="h-7 w-full p-1 border-none bg-black/20 cursor-pointer" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] text-slate-600 font-medium">Border Color</Label>
                          <Input type="color" value={btn.borderColor || "#ffffff"} onChange={(e) => {
                             const buttons = [...block.content.buttons];
                             buttons[idx].borderColor = e.target.value;
                             onChange({ content: { buttons } });
                          }} className="h-7 w-full p-1 border-none bg-black/20 cursor-pointer" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] text-slate-600 font-medium">Border Radius</Label>
                          <Input type="number" value={btn.borderRadius || 8} onChange={(e) => {
                             const buttons = [...block.content.buttons];
                             buttons[idx].borderRadius = Number(e.target.value);
                             onChange({ content: { buttons } });
                          }} className="h-7 w-full bg-slate-100 border-slate-200 text-slate-900 shadow-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] text-slate-600 font-medium">Border Size</Label>
                          <Input type="number" value={btn.borderSize || 0} onChange={(e) => {
                             const buttons = [...block.content.buttons];
                             buttons[idx].borderSize = Number(e.target.value);
                             onChange({ content: { buttons } });
                          }} className="h-7 w-full bg-slate-100 border-slate-200 text-slate-900 shadow-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] text-slate-600 font-medium">Font Size</Label>
                          <Input type="number" value={btn.fontSize || 14} onChange={(e) => {
                             const buttons = [...block.content.buttons];
                             buttons[idx].fontSize = Number(e.target.value);
                             onChange({ content: { buttons } });
                          }} className="h-7 w-full bg-slate-100 border-slate-200 text-slate-900 shadow-sm" />
                        </div>
                      </div>
                      {btn.type === 'image' && (
                         <CloudinaryUpload value={btn.bgImage || ""} onUpload={(url) => {
                             const buttons = [...block.content.buttons];
                             buttons[idx].bgImage = url;
                             onChange({ content: { buttons } });
                         }} onRemove={() => {
                             const buttons = [...block.content.buttons];
                             buttons[idx].bgImage = "";
                             onChange({ content: { buttons } });
                         }} />
                      )}
                   </div>
                 ))}
                 <Button variant="outline" className="w-full h-8 text-[9px] border-dashed border-white/10 bg-transparent text-slate-600 font-medium" onClick={() => {
                   const buttons = [...(block.content?.buttons || []), { id: Math.random().toString(36).substr(2, 9), label: "New Button", link: "/", position: "right", type: "solid", bgColor: "#145DCC", textColor: "#ffffff", borderRadius: 8, borderSize: 0, fontSize: 14 }];
                   onChange({ content: { buttons } });
                 }}>+ Add Button</Button>
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
                    <SelectTrigger className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
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
                    <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase tracking-widest">Badge Color</Label>
                    <Input type="color" value={block.content?.badgeColor || "#facc15"} onChange={(e) => onChange({ content: { badgeColor: e.target.value } })} className="h-8 w-full p-1 border-none bg-slate-50 border-slate-200 text-slate-900" />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase tracking-widest">Title Color</Label>
                    <Input type="color" value={block.content?.titleColor || "#ffffff"} onChange={(e) => onChange({ content: { titleColor: e.target.value } })} className="h-8 w-full p-1 border-none bg-slate-50 border-slate-200 text-slate-900" />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase tracking-widest">Subtitle Color</Label>
                    <Input type="color" value={block.content?.subtitleColor || "#facc15"} onChange={(e) => onChange({ content: { subtitleColor: e.target.value } })} className="h-8 w-full p-1 border-none bg-slate-50 border-slate-200 text-slate-900" />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase tracking-widest">Brand Color</Label>
                    <Input type="color" value={block.content?.brandTitleColor || "#1a7c3e"} onChange={(e) => onChange({ content: { brandTitleColor: e.target.value } })} className="h-8 w-full p-1 border-none bg-slate-50 border-slate-200 text-slate-900" />
                 </div>
              </div>
           </PropertySection>

           <PropertySection label="Hero Content" icon={Edit}>
              <div className="space-y-3">
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase tracking-widest">Trust Badge</Label>
                    <Input value={block.content?.badgeText || ""} onChange={(e) => onChange({ content: { badgeText: e.target.value } })} className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-xs" />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase tracking-widest">Headline</Label>
                    <Textarea value={block.content?.title || ""} onChange={(e) => onChange({ content: { title: e.target.value } })} className="min-h-[80px] bg-slate-100/80 border-slate-200 text-slate-900 text-xs" />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase tracking-widest">Subtitle</Label>
                    <Input value={block.content?.subtitle || ""} onChange={(e) => onChange({ content: { subtitle: e.target.value } })} className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-xs" />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase tracking-widest">Brand Name</Label>
                        <Input value={block.content?.brandTitle || ""} onChange={(e) => onChange({ content: { brandTitle: e.target.value } })} className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-xs" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase tracking-widest">Brand Slogan</Label>
                        <Input value={block.content?.brandSubtitle || ""} onChange={(e) => onChange({ content: { brandSubtitle: e.target.value } })} className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-xs" />
                    </div>
                 </div>
              </div>
           </PropertySection>

           <PropertySection label="Action Buttons" icon={ArrowRight}>
              <div className="space-y-6">
                 <div className="space-y-3 p-3 bg-black/20 rounded-xl border border-slate-200">
                    <Label className="text-[9px] font-black uppercase text-indigo-400">Order Button</Label>
                    <Input value={block.content?.ctaText || ""} onChange={(e) => onChange({ content: { ctaText: e.target.value } })} placeholder="Button Label" className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]" />
                    
                    <div className="grid grid-cols-2 gap-2 mt-2">
                       <div className="space-y-1">
                          <Label className="text-[7px] text-slate-400 uppercase">Action</Label>
                          <Select value={block.content?.ctaActionType || "link"} onValueChange={(val) => onChange({ content: { ctaActionType: val } })}>
                             <SelectTrigger className="h-7 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="link" className="text-[10px]">External Link</SelectItem>
                                <SelectItem value="scroll" className="text-[10px]">Scroll To</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>
                       <div className="space-y-1">
                          {block.content?.ctaActionType === "scroll" ? (
                             <>
                                <Label className="text-[7px] text-slate-400 uppercase">Target</Label>
                                <Select 
                                  value={block.content?.ctaTargetId || "none"} 
                                  onValueChange={(val) => onChange({ content: { ctaTargetId: val === "none" ? undefined : val } })}
                                >
                                  <SelectTrigger className="h-7 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]">
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none" className="text-[10px]">None</SelectItem>
                                    {(config || []).filter(b => b.id !== block.id).map(b => (
                                      <SelectItem key={b.id} value={b.id} className="text-[10px]">
                                        {b.type.toUpperCase()} ({b.id.substr(0, 4)})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                             </>
                          ) : (
                             <>
                                <Label className="text-[7px] text-slate-400 uppercase">Link</Label>
                                <Input value={block.content?.ctaLink || ""} onChange={(e) => onChange({ content: { ctaLink: e.target.value } })} placeholder="URL" className="h-7 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]" />
                             </>
                          )}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-[8px] font-bold text-slate-400 uppercase">BG Color</Label>
                            <Input type="color" value={block.content?.ctaBg || "#f9a825"} onChange={(e) => onChange({ content: { ctaBg: e.target.value, ctaType: 'solid' } })} className="h-7 w-full p-1 bg-black/20 border-none cursor-pointer" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[8px] font-bold text-slate-400 uppercase">Text Color</Label>
                            <Input type="color" value={block.content?.ctaTextColor || "#ffffff"} onChange={(e) => onChange({ content: { ctaTextColor: e.target.value } })} className="h-7 w-full p-1 bg-black/20 border-none cursor-pointer" />
                        </div>
                    </div>
                 </div>

                 <div className="space-y-3 p-3 bg-black/20 rounded-xl border border-slate-200">
                    <Label className="text-[9px] font-black uppercase text-emerald-400">Call Button</Label>
                    <Input value={block.content?.phoneText || ""} onChange={(e) => onChange({ content: { phoneText: e.target.value } })} placeholder="Phone Label" className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]" />
                    <Input value={block.content?.phoneLink || ""} onChange={(e) => onChange({ content: { phoneLink: e.target.value } })} placeholder="Link (tel:0123...)" className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]" />
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-[8px] font-bold text-slate-400 uppercase">Border Color</Label>
                            <Input type="color" value={block.content?.phoneBorderColor || "#ffffff4d"} onChange={(e) => onChange({ content: { phoneBorderColor: e.target.value, phoneType: 'outline' } })} className="h-7 w-full p-1 bg-black/20 border-none cursor-pointer" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[8px] font-bold text-slate-400 uppercase">Text Color</Label>
                            <Input type="color" value={block.content?.phoneTextColor || "#ffffff"} onChange={(e) => onChange({ content: { phoneTextColor: e.target.value } })} className="h-7 w-full p-1 bg-black/20 border-none cursor-pointer" />
                        </div>
                    </div>
                 </div>
              </div>
           </PropertySection>

           <PropertySection label="Trust Ribbon" icon={ShieldCheck}>
              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-2xl border border-slate-200">
                    <div className="space-y-1">
                       <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase">Icon BG</Label>
                       <Input type="color" value={block.content?.ribbonIconBg || "#ffffff1a"} onChange={(e) => onChange({ content: { ribbonIconBg: e.target.value } })} className="h-8 p-1 bg-black/20 border-none cursor-pointer rounded-lg" />
                    </div>
                    <div className="space-y-1">
                       <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase">Icon Color</Label>
                       <Input type="color" value={block.content?.ribbonIconColor || "#34d399"} onChange={(e) => onChange({ content: { ribbonIconColor: e.target.value } })} className="h-8 p-1 bg-black/20 border-none cursor-pointer rounded-lg" />
                    </div>
                    <div className="col-span-2 space-y-1">
                       <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase">Global Text Color</Label>
                       <Input type="color" value={block.content?.ribbonTextColor || "#ffffffb3"} onChange={(e) => onChange({ content: { ribbonTextColor: e.target.value } })} className="h-8 p-1 bg-black/20 border-none cursor-pointer rounded-lg" />
                    </div>
                 </div>

                 <div className="space-y-3">
                    {(block.content?.trustItems || []).map((item: any, idx: number) => (
                      <div key={idx} className="p-4 bg-black/20 rounded-2xl border border-slate-200 space-y-3 relative group">
                         <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                            const trustItems = block.content.trustItems.filter((_:any, i:number) => i !== idx);
                            onChange({ content: { trustItems } });
                         }}><Trash2 className="w-3.5 h-3.5" /></Button>
                         
                         <div className="flex items-center gap-3">
                            <Select value={item.iconName || "CheckCircle2"} onValueChange={(val) => {
                               const trustItems = [...block.content.trustItems];
                               trustItems[idx].iconName = val;
                               onChange({ content: { trustItems } });
                            }}>
                               <SelectTrigger className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 w-10 p-0 flex justify-center"><SelectValue /></SelectTrigger>
                               <SelectContent className="max-h-[200px]">
                                  {COMMON_ICONS.map(i => <SelectItem key={i} value={i} className="text-xs">{i}</SelectItem>)}
                               </SelectContent>
                            </Select>
                            <Input value={item.label} onChange={(e) => {
                               const trustItems = [...block.content.trustItems];
                               trustItems[idx].label = e.target.value;
                               onChange({ content: { trustItems } });
                            }} placeholder="Trust Label" className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-xs flex-1" />
                         </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full h-10 border-dashed border-white/10 bg-transparent text-[9px] font-black uppercase text-slate-600 font-medium" onClick={() => {
                      const trustItems = [...(block.content?.trustItems || []), { iconName: "CheckSquare", label: "New Trust Point" }];
                      onChange({ content: { trustItems } });
                    }}>+ Add Trust Point</Button>
                 </div>
              </div>
           </PropertySection>
        </div>
      );

    case "score-cards":
      return (
        <div className="space-y-6">
           <PropertySection label="Performance Metrics" icon={LucideIcons.Activity}>
              <div className="space-y-4">
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
                      }} className="h-7 text-[10px]" placeholder="Metric Label" />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[7px] uppercase font-black">Score (0-100)</Label>
                          <Input type="number" value={item.score} onChange={(e) => {
                             const items = [...block.content.items];
                             items[idx].score = Number(e.target.value);
                             onChange({ content: { items } });
                          }} className="h-7 text-[10px]" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[7px] uppercase font-black">Color</Label>
                          <Input type="color" value={item.color || "#3b82f6"} onChange={(e) => {
                             const items = [...block.content.items];
                             items[idx].color = e.target.value;
                             onChange({ content: { items } });
                          }} className="h-7 w-full p-1 border-none bg-black/20" />
                        </div>
                      </div>
                   </div>
                 ))}
                 <Button variant="outline" className="w-full h-8 text-[9px] border-dashed" onClick={() => {
                   const items = [...(block.content?.items || []), { label: "New Metric", score: 90, color: "#3b82f6" }];
                   onChange({ content: { items } });
                 }}>+ Add Metric</Button>
              </div>
           </PropertySection>
        </div>
      );

    case "accordion":
      return (
        <div className="space-y-6">
           <PropertySection label="FAQ Content" icon={LucideIcons.List}>
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
                      }} className="h-7 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]" placeholder="Question Title" />
                      <Textarea value={item.content} onChange={(e) => {
                         const items = [...block.content.items];
                         items[idx].content = e.target.value;
                         onChange({ content: { items } });
                      }} className="min-h-[60px] bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]" placeholder="Answer content" />
                   </div>
                 ))}
                 <Button variant="outline" className="w-full h-8 text-[9px] border-dashed border-white/10 bg-transparent text-slate-600 font-medium" onClick={() => {
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
                    <Label className="text-[9px] uppercase font-bold text-slate-600 font-medium">Orientation</Label>
                    <Select value={block.content?.layout || "vertical"} onValueChange={(v) => onChange({ content: { layout: v } })}>
                       <SelectTrigger className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="vertical">Vertical (Stacked)</SelectItem>
                          <SelectItem value="horizontal">Horizontal (Inline)</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-slate-600 font-medium">List Prefix</Label>
                    <Select value={block.content?.listStyle || "check"} onValueChange={(v) => onChange({ content: { listStyle: v } })}>
                       <SelectTrigger className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
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
                 <Input value={block.content?.title || ""} onChange={(e) => onChange({ content: { title: e.target.value } })} placeholder="Title" className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-xs" />
                 <Textarea value={block.content?.subtitle || ""} onChange={(e) => onChange({ content: { subtitle: e.target.value } })} placeholder="Description" className="min-h-[60px] bg-slate-100/80 border-slate-200 text-slate-900 text-xs" />
              </div>
           </PropertySection>

           <PropertySection label="Iconographic" icon={LucideIcons.PlusCircle}>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold text-slate-900 font-black">Visible Icon</Label>
                    <Switch checked={!!block.content?.showIcon} onCheckedChange={(v) => onChange({ content: { showIcon: v } })} />
                 </div>
                 {block.content?.showIcon && (
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[9px] text-slate-600 font-medium">Color</Label>
                          <Input type="color" value={block.content?.iconColor || "#145DCC"} onChange={(e) => onChange({ content: { iconColor: e.target.value } })} className="h-8 p-1 border-none bg-black/20 cursor-pointer" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] text-slate-600 font-medium">Size</Label>
                          <Input type="number" value={block.content?.iconSize || 32} onChange={(e) => onChange({ content: { iconSize: Number(e.target.value) } })} className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-xs" />
                        </div>
                      </div>
                      <Select value={block.content?.iconName || "Star"} onValueChange={(v) => onChange({ content: { iconName: v } })}>
                        <SelectTrigger className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {COMMON_ICONS.map(i => <SelectItem key={i} value={i} className="text-[10px]">{i}</SelectItem>)}
                        </SelectContent>
                      </Select>
                   </div>
                 )}
              </div>
           </PropertySection>

           <PropertySection label="Feature Items" icon={LucideIcons.CheckSquare}>
              <div className="space-y-3">
                 {(block.content?.items || []).map((item: string, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center group">
                       <Input 
                          value={item} 
                          onChange={(e) => {
                             const items = [...(block.content?.items || [])];
                             items[idx] = e.target.value;
                             onChange({ content: { items } });
                          }} 
                          placeholder="Feature text..." 
                          className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-xs flex-1" 
                       />
                       <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                             const items = block.content.items.filter((_:any, i:number) => i !== idx);
                             onChange({ content: { items } });
                          }}
                       >
                          <Trash2 className="w-3 h-3" />
                       </Button>
                    </div>
                 ))}
                 <Button 
                    variant="outline" 
                    className="w-full h-8 text-[9px] border-dashed border-slate-200 bg-transparent text-slate-600 font-medium" 
                    onClick={() => {
                       const items = [...(block.content?.items || []), "New feature point"];
                       onChange({ content: { items } });
                    }}
                 >
                    + Add Feature Item
                 </Button>
              </div>
           </PropertySection>

           <PropertySection label="Card Styling" icon={LucideIcons.Box}>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-slate-600 font-medium">Card Background Image</Label>
                    <CloudinaryUpload 
                       value={block.content?.bgImage || ""} 
                       onUpload={(url) => onChange({ content: { bgImage: url } })} 
                       onRemove={() => onChange({ content: { bgImage: "" } })} 
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                       <Label className="text-[9px] uppercase font-bold text-slate-600 font-medium">Border Size</Label>
                       <Input type="number" value={block.content?.cardBorderSize || 0} onChange={(e) => onChange({ content: { cardBorderSize: Number(e.target.value) } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 shadow-sm" />
                    </div>
                    <div className="space-y-1">
                       <Label className="text-[9px] uppercase font-bold text-slate-600 font-medium">Border Radius</Label>
                       <Input type="number" value={block.content?.cardBorderRadius || 12} onChange={(e) => onChange({ content: { cardBorderRadius: Number(e.target.value) } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 shadow-sm" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                       <Label className="text-[9px] uppercase font-bold text-slate-600 font-medium">Border Color</Label>
                       <Input type="color" value={block.content?.cardBorderColor || "#e2e8f0"} onChange={(e) => onChange({ content: { cardBorderColor: e.target.value } })} className="h-8 p-1 border-none bg-slate-50 border-slate-200 text-slate-900" />
                    </div>
                    <div className="space-y-1">
                       <Label className="text-[9px] uppercase font-bold text-slate-600 font-medium">BG Color</Label>
                       <Input type="color" value={block.content?.cardBgColor || "#ffffff"} onChange={(e) => onChange({ content: { cardBgColor: e.target.value } })} className="h-8 p-1 border-none bg-slate-50 border-slate-200 text-slate-900" />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-slate-600 font-medium">Border Style</Label>
                    <Select value={block.content?.cardBorderStyle || "solid"} onValueChange={(v) => onChange({ content: { cardBorderStyle: v } })}>
                       <SelectTrigger className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="solid">Solid</SelectItem>
                          <SelectItem value="dashed">Dashed</SelectItem>
                          <SelectItem value="dotted">Dotted</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </div>
           </PropertySection>
        </div>
      );

    case "button":
      return (
        <div className="space-y-6">
           <PropertySection label="Button Content" icon={LucideIcons.Type}>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-slate-800 uppercase tracking-widest">Button Text</Label>
                    <Input value={block.content?.text || ""} onChange={(e) => onChange({ content: { text: e.target.value } })} placeholder="Button Label" className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-xs" />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-slate-800 uppercase tracking-widest">Action Type</Label>
                    <Select value={block.content?.actionType || "link"} onValueChange={(val) => onChange({ content: { actionType: val } })}>
                       <SelectTrigger className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="link" className="text-[10px]">External / Custom Link</SelectItem>
                          <SelectItem value="scroll" className="text-[10px]">Scroll To Section</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>

                 {block.content?.actionType === "scroll" ? (
                   <div className="space-y-1">
                      <Label className="text-[8px] font-bold text-slate-800 uppercase tracking-widest">Target Section</Label>
                      <Select 
                        value={block.content?.targetId || "none"} 
                        onValueChange={(val) => onChange({ content: { targetId: val === "none" ? undefined : val } })}
                      >
                        <SelectTrigger className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]">
                          <SelectValue placeholder="Select section..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-[10px]">No section selected</SelectItem>
                          {(config || []).filter(b => b.id !== block.id).map(b => (
                            <SelectItem key={b.id} value={b.id} className="text-[10px]">
                              {b.type.toUpperCase()} ({b.id.substr(0, 4)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                   </div>
                 ) : (
                   <div className="space-y-1">
                      <Label className="text-[8px] font-bold text-slate-800 uppercase tracking-widest">Link URL</Label>
                      <Input value={block.content?.link || ""} onChange={(e) => onChange({ content: { link: e.target.value } })} placeholder="https://..." className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-xs" />
                   </div>
                 )}
              </div>
           </PropertySection>
           <PropertySection label="Button Design" icon={LucideIcons.Palette}>
              <div className="space-y-4">
                 <Select value={block.content?.type || "solid"} onValueChange={(val) => onChange({ content: { type: val } })}>
                    <SelectTrigger className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="solid">Solid Color</SelectItem>
                       <SelectItem value="outline">Outline</SelectItem>
                       <SelectItem value="gradient">Gradient</SelectItem>
                       <SelectItem value="flat">Flat</SelectItem>
                       <SelectItem value="texture">Texture</SelectItem>
                       <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                 </Select>
                 <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1">
                     <Label className="text-[8px] text-slate-600 font-medium">BG/Gradient Color</Label>
                     <Input type="color" value={block.content?.bgColor || "#145DCC"} onChange={(e) => onChange({ content: { bgColor: e.target.value } })} className="h-7 w-full p-1 border-none bg-black/20 cursor-pointer" />
                   </div>
                   <div className="space-y-1">
                     <Label className="text-[8px] text-slate-600 font-medium">Text Color</Label>
                     <Input type="color" value={block.content?.textColor || "#ffffff"} onChange={(e) => onChange({ content: { textColor: e.target.value } })} className="h-7 w-full p-1 border-none bg-black/20 cursor-pointer" />
                   </div>
                   <div className="space-y-1">
                     <Label className="text-[8px] text-slate-600 font-medium">Border Color</Label>
                     <Input type="color" value={block.content?.borderColor || "#ffffff"} onChange={(e) => onChange({ content: { borderColor: e.target.value } })} className="h-7 w-full p-1 border-none bg-black/20 cursor-pointer" />
                   </div>
                   <div className="space-y-1">
                     <Label className="text-[8px] text-slate-600 font-medium">Border Radius</Label>
                     <Input type="number" value={block.content?.borderRadius || 8} onChange={(e) => onChange({ content: { borderRadius: Number(e.target.value) } })} className="h-7 w-full bg-slate-100 border-slate-200 text-slate-900 shadow-sm" />
                   </div>
                   <div className="space-y-1">
                     <Label className="text-[8px] text-slate-600 font-medium">Border Size</Label>
                     <Input type="number" value={block.content?.borderSize || 0} onChange={(e) => onChange({ content: { borderSize: Number(e.target.value) } })} className="h-7 w-full bg-slate-100 border-slate-200 text-slate-900 shadow-sm" />
                   </div>
                 </div>
                 {block.content?.type === 'image' && (
                    <CloudinaryUpload value={block.content?.bgImage || ""} onUpload={(url) => onChange({ content: { bgImage: url } })} onRemove={() => onChange({ content: { bgImage: "" } })} />
                 )}
              </div>
           </PropertySection>
        </div>
      );

    case "selector":
      return (
        <div className="space-y-6">
           <PropertySection label="Selector Logic" icon={Settings}>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase tracking-widest">Selector Style</Label>
                    <Select value={block.content?.selectorType || "pills"} onValueChange={(val) => onChange({ content: { selectorType: val } })}>
                       <SelectTrigger className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="pills">Pill Buttons</SelectItem>
                          <SelectItem value="cards">Feature Cards</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase tracking-widest">Heading (Optional)</Label>
                    <Input value={block.content?.title || ""} onChange={(e) => onChange({ content: { title: e.target.value } })} placeholder="Select an option" className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-xs" />
                 </div>
              </div>
           </PropertySection>

           <PropertySection label="Options Architecture" icon={List}>
              <div className="space-y-3">
                 {(block.content?.options || []).map((opt: any, idx: number) => (
                   <div key={idx} className="p-3 bg-black/20 rounded-xl space-y-2 relative group">
                      <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-5 w-5 text-rose-400 opacity-0 group-hover:opacity-100" onClick={() => {
                        const options = block.content.options.filter((_:any, i:number) => i !== idx);
                        onChange({ content: { options } });
                      }}><Trash2 className="w-2.5 h-2.5" /></Button>
                      <Input value={opt.label} onChange={(e) => {
                         const options = [...block.content.options];
                         options[idx].label = e.target.value;
                         onChange({ content: { options } });
                      }} className="h-7 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]" placeholder="Option Label" />
                      {block.content?.selectorType === "cards" && (
                        <Textarea value={opt.description} onChange={(e) => {
                           const options = [...block.content.options];
                           options[idx].description = e.target.value;
                           onChange({ content: { options } });
                        }} className="min-h-[40px] bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]" placeholder="Short description" />
                      )}
                       <div className="grid grid-cols-2 gap-2">
                         <div className="space-y-1">
                           <Label className="text-[7px] text-slate-500 uppercase font-black">Scroll To Section</Label>
                           <Select 
                             value={opt.targetId || "none"} 
                             onValueChange={(val) => {
                               const options = [...block.content.options];
                               options[idx].targetId = val === "none" ? undefined : val;
                               onChange({ content: { options } });
                             }}
                           >
                             <SelectTrigger className="h-7 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px] w-full">
                               <SelectValue placeholder="No link" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="none" className="text-[10px]">No scroll link</SelectItem>
                               {(config || []).filter(b => b.id !== block.id).map(b => (
                                 <SelectItem key={b.id} value={b.id} className="text-[10px]">
                                   {b.type.toUpperCase()} ({b.id.substr(0, 4)})
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>
                         <div className="space-y-1">
                           <Label className="text-[7px] text-slate-500 uppercase font-black">Value</Label>
                           <Input value={opt.value} onChange={(e) => {
                              const options = [...block.content.options];
                              options[idx].value = e.target.value;
                              onChange({ content: { options } });
                           }} className="h-7 bg-slate-100/80 border-slate-200 text-slate-900 text-[10px]" placeholder="Value" />
                         </div>
                       </div>
                    </div>
                 ))}
                 <Button variant="outline" className="w-full h-8 text-[9px] border-dashed border-white/10 bg-transparent text-slate-600 font-medium" onClick={() => {
                   const options = [...(block.content?.options || []), { label: "New Option", value: Math.random().toString(36).substr(2, 5), description: "" }];
                   onChange({ content: { options } });
                 }}>+ Add Option</Button>
              </div>
           </PropertySection>
        </div>
      );

    case "row":
      return (
        <div className="space-y-6">
           <PropertySection label="Grid Architecture" icon={Columns}>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase tracking-widest">Column Configuration</Label>
                    <div className="grid grid-cols-5 gap-2">
                       {[1, 2, 3, 4, 5].map(num => (
                         <Button 
                           key={num}
                           variant={block.content?.columns === num ? "default" : "outline"}
                           className={cn("h-8 text-[10px] rounded-lg p-0", block.content?.columns === num ? "bg-indigo-600 border-none" : "border-slate-200 text-slate-600 font-medium")}
                           onClick={() => onChange({ content: { columns: num } })}
                         >
                           {num} Col
                         </Button>
                       ))}
                    </div>
                    <p className="text-[7px] text-slate-400 italic">Warning: Reducing columns may hide blocks in those columns until columns are increased back.</p>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase tracking-widest">Gap Size</Label>
                    <Slider 
                      value={[block.content?.gap || 24]} 
                      max={80} 
                      step={4} 
                      onValueChange={([val]) => onChange({ content: { gap: val } })}
                      className="py-4"
                    />
                 </div>
              </div>
           </PropertySection>
        </div>
      );

    case "header":
    case "paragraph":
      return (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase tracking-widest">Text Content</Label>
            <Textarea value={block.content?.text || ""} onChange={(e) => onChange({ content: { text: e.target.value } })} className="rounded-lg min-h-[80px] bg-slate-100 border border-slate-200 text-slate-900 text-xs shadow-sm" />
            <p className="text-[7px] text-slate-400 italic">Tip: Use [brackets] for animated highlight.</p>
          </div>
          {block.type === 'header' && (
            <div className="space-y-1">
              <Label className="text-[8px] font-bold text-slate-800 font-bold uppercase tracking-widest">Header Level</Label>
              <Select value={block.content?.level || "h2"} onValueChange={(v) => onChange({ content: { level: v } })}>
                <SelectTrigger className="h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-900 text-[10px] shadow-sm"><SelectValue /></SelectTrigger>
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


    case "product-order-form":
      return (
        <div className="space-y-6">
           <PropertySection label="Identity" icon={LucideIcons.Type}>
              <div className="space-y-3">
                 <Input value={block.content?.title || ""} onChange={(e) => onChange({ content: { title: e.target.value } })} placeholder="Title" className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-xs" />
                 <Textarea value={block.content?.subtitle || ""} onChange={(e) => onChange({ content: { subtitle: e.target.value } })} placeholder="Description" className="min-h-[60px] bg-slate-100/80 border-slate-200 text-slate-900 text-xs" />
              </div>
           </PropertySection>

           <PropertySection label="Select Products" icon={LucideIcons.Package}>
              <div className="space-y-2">
                 <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                    {products.length === 0 ? (
                       <p className="text-[10px] text-slate-400 italic text-center py-4">No products found in store</p>
                    ) : (
                       products.map((p) => {
                          const isSelected = (block.content?.productIds || []).includes(p.id);
                          return (
                             <div 
                                key={p.id} 
                                className={cn(
                                   "flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer group",
                                   isSelected ? "bg-indigo-50 border border-indigo-100" : "bg-slate-50 border border-slate-100 hover:bg-slate-100"
                                )}
                                onClick={() => {
                                   const productIds = block.content?.productIds || [];
                                   const newIds = isSelected 
                                      ? productIds.filter((id: string) => id !== p.id)
                                      : [...productIds, p.id];
                                   onChange({ content: { productIds: newIds } });
                                }}
                             >
                                <div className={cn(
                                   "w-4 h-4 rounded flex items-center justify-center border transition-all",
                                   isSelected ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300 group-hover:border-slate-400"
                                )}>
                                   {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <p className={cn("text-[10px] font-bold truncate", isSelected ? "text-indigo-900" : "text-slate-700")}>{p.name}</p>
                                   <p className="text-[9px] text-slate-400">৳{p.price}</p>
                                </div>
                             </div>
                          );
                       })
                    )}
                 </div>
              </div>
           </PropertySection>

           <PropertySection label="Form Options" icon={LucideIcons.Settings}>
              <div className="space-y-3">
                 <div className="flex items-center justify-between p-2.5 bg-slate-100/50 rounded-lg">
                    <Label className="text-[10px] font-bold text-slate-900">Show Delivery Area</Label>
                    <Switch 
                       checked={block.content?.showShipping !== false} 
                       onCheckedChange={(val) => onChange({ content: { showShipping: val } })} 
                    />
                 </div>
                 <p className="text-[8px] text-slate-400 italic px-1">If disabled, delivery will be marked as free for all orders.</p>
              </div>
           </PropertySection>
        </div>
      );

    case "checked-list":
    case "marquee":
      const isMarquee = block.type === "marquee";
      return (
        <div className="space-y-6">
           <PropertySection label={isMarquee ? "Marquee Items" : "List Items"} icon={isMarquee ? LucideIcons.Zap : LucideIcons.CheckSquare}>
              <div className="space-y-3">
                 {(block.content?.items || []).map((item: string, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center group">
                       <Input 
                          value={item} 
                          onChange={(e) => {
                             const items = [...(block.content?.items || [])];
                             items[idx] = e.target.value;
                             onChange({ content: { items } });
                          }} 
                          placeholder="List item text..." 
                          className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-xs flex-1" 
                       />
                       <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                             const items = block.content.items.filter((_:any, i:number) => i !== idx);
                             onChange({ content: { items } });
                          }}
                       >
                          <Trash2 className="w-3 h-3" />
                       </Button>
                    </div>
                 ))}
                 <Button 
                    variant="outline" 
                    className="w-full h-8 text-[9px] border-dashed border-slate-200 bg-transparent text-slate-600 font-medium" 
                    onClick={() => {
                       const items = [...(block.content?.items || []), "New Point Item"];
                       onChange({ content: { items } });
                    }}
                 >
                    + Add {isMarquee ? "Marquee" : "List"} Item
                 </Button>
              </div>
           </PropertySection>
        </div>
      );

    case "image":
      return (
        <div className="space-y-6">
           <PropertySection label="Image Asset" icon={LucideIcons.Image}>
              <div className="space-y-4">
                 <CloudinaryUpload 
                    value={block.content?.url || ""} 
                    onUpload={(url) => onChange({ content: { url } })} 
                    onRemove={() => onChange({ content: { url: "" } })} 
                 />
                 <Input 
                    value={block.content?.alt || ""} 
                    onChange={(e) => onChange({ content: { alt: e.target.value } })} 
                    placeholder="Alt text (for SEO)" 

                    className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-xs" 
                 />
                 <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="space-y-1">
                      <Label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Width (%)</Label>
                      <Input type="number" value={block.content?.width || 100} onChange={(e) => onChange({ content: { width: Number(e.target.value) } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px] px-2" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Border Radius</Label>
                      <div className="flex items-center gap-2">
                         <Slider 
                            value={[block.content?.borderRadius || 0]} 
                            max={100} 
                            step={1} 
                            onValueChange={([v]) => onChange({ content: { borderRadius: v } })} 
                            className="flex-1"
                         />
                         <span className="text-[10px] text-slate-500 min-w-[24px]">{block.content?.borderRadius || 0}px</span>
                      </div>
                    </div>
                 </div>
              </div>
           </PropertySection>
        </div>
      );

    case "video":
      return (
        <div className="space-y-6">
           <PropertySection label="Video Configuration" icon={LucideIcons.Play}>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <Label className="text-[8px] font-bold text-slate-800 uppercase">Video URL</Label>
                    <Input 
                        value={block.content?.url || ""} 
                        onChange={(e) => onChange({ content: { url: e.target.value } })} 
                        placeholder="YouTube/Vimeo URL" 
                        className="h-8 bg-slate-100/80 border-slate-200 text-slate-900 text-xs" 
                    />
                 </div>
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                       <Label className="text-[10px] font-bold text-slate-900">Border Radius</Label>
                       <span className="text-[8px] font-bold text-slate-400">{block.content?.borderRadius || 40}px</span>
                    </div>
                    <Slider 
                       value={[block.content?.borderRadius || 40]} 
                       max={100} 
                       step={1} 
                       onValueChange={([v]) => onChange({ content: { borderRadius: v } })} 
                    />
                 </div>
                 <div className="flex items-center justify-between p-2.5 bg-slate-100/50 rounded-lg">
                    <Label className="text-[10px] font-bold text-slate-900">Autoplay (Muted)</Label>
                    <Switch checked={!!block.content?.autoplay} onCheckedChange={(v) => onChange({ content: { autoplay: v } })} />
                 </div>
                 
                 <div className="space-y-2 pt-2">
                    <Label className="text-[8px] font-bold text-slate-800 uppercase">Custom Thumbnail (Optional)</Label>
                    <CloudinaryUpload 
                       value={block.content?.customThumbnail || ""} 
                       onUpload={(url) => onChange({ content: { customThumbnail: url } })} 
                       onRemove={() => onChange({ content: { customThumbnail: "" } })} 
                    />
                 </div>
              </div>
           </PropertySection>
        </div>
      );


    case "carousel":
      {
        const carouselItems = block.content?.items || [];
        const carouselSettings = block.content?.settings || {};
        return (
          <div className="space-y-6">
             <PropertySection label="Carousel Settings" icon={Settings}>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between p-2.5 bg-slate-200/50 rounded-lg">
                         <Label className="text-[10px] font-bold text-slate-900 font-black uppercase">Arrows</Label>
                         <Switch checked={carouselSettings.showArrows !== false} onCheckedChange={(val) => onChange({ content: { settings: { ...carouselSettings, showArrows: val } } })} />
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-slate-200/50 rounded-lg">
                         <Label className="text-[10px] font-bold text-slate-900 font-black uppercase">Loop</Label>
                         <Switch checked={carouselSettings.loop !== false} onCheckedChange={(val) => onChange({ content: { settings: { ...carouselSettings, loop: val } } })} />
                      </div>
                   </div>
                   <div className="flex items-center justify-between p-2.5 bg-slate-200/50 rounded-lg">
                      <Label className="text-[10px] font-bold text-slate-900 font-black uppercase">Autoplay</Label>
                      <Switch checked={!!carouselSettings.autoplay} onCheckedChange={(val) => onChange({ content: { settings: { ...carouselSettings, autoplay: val } } })} />
                   </div>
                   {carouselSettings.autoplay && (
                     <div className="space-y-1">
                        <Label className="text-[8px] font-bold text-slate-800 uppercase">Interval (ms)</Label>
                        <Input type="number" value={carouselSettings.autoplayInterval || 3000} onChange={(e) => onChange({ content: { settings: { ...carouselSettings, autoplayInterval: Number(e.target.value) } } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-xs" />
                     </div>
                   )}
                   <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                         <Label className="text-[8px] font-bold text-slate-800 uppercase">Desktop View</Label>
                         <Select value={String(carouselSettings.desktopItems || 1)} onValueChange={(val) => onChange({ content: { settings: { ...carouselSettings, desktopItems: Number(val) } } })}>
                            <SelectTrigger className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                               <SelectItem value="1">1 Item</SelectItem>
                               <SelectItem value="2">2 Items</SelectItem>
                               <SelectItem value="3">3 Items</SelectItem>
                               <SelectItem value="4">4 Items</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                      <div className="space-y-1">
                         <Label className="text-[8px] font-bold text-slate-800 uppercase">Gap (px)</Label>
                         <Input type="number" value={carouselSettings.gap || 16} onChange={(e) => onChange({ content: { settings: { ...carouselSettings, gap: Number(e.target.value) } } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-xs" />
                      </div>
                   </div>
                 </div>
             </PropertySection>
  
             <PropertySection label="Slides / Items" icon={LayoutList}>
                <div className="space-y-3">
                 {carouselItems.map((item: any, idx: number) => (
                   <div key={idx} className="p-4 bg-slate-100/50 rounded-2xl space-y-4 relative group border border-slate-200">
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-rose-500 bg-white/80 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={() => {
                        const items = carouselItems.filter((_:any, i:number) => i !== idx);
                        onChange({ content: { items } });
                      }}><Trash2 className="w-3 h-3" /></Button>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[8px] text-slate-500 uppercase font-black">Slide Type</Label>
                          <Select value={item.type || "image"} onValueChange={(val) => {
                            const items = [...carouselItems];
                            items[idx].type = val;
                            onChange({ content: { items } });
                          }}>
                             <SelectTrigger className="h-8 bg-white border-slate-200 text-slate-900 text-[10px] rounded-lg"><SelectValue /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="image">Image Slide</SelectItem>
                                <SelectItem value="box">Box (Color Only)</SelectItem>
                                <SelectItem value="video">Video Slide</SelectItem>
                             </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] text-slate-500 uppercase font-black">Text Position</Label>
                          <Select value={item.textPosition || "center"} onValueChange={(val) => {
                            const items = [...carouselItems];
                            items[idx].textPosition = val;
                            onChange({ content: { items } });
                          }}>
                             <SelectTrigger className="h-8 bg-white border-slate-200 text-slate-900 text-[10px] rounded-lg"><SelectValue /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="top-left">Top Left</SelectItem>
                                <SelectItem value="top-center">Top Center</SelectItem>
                                <SelectItem value="top-right">Top Right</SelectItem>
                                <SelectItem value="center-left">Center Left</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="center-right">Center Right</SelectItem>
                                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                <SelectItem value="bottom-center">Bottom Center</SelectItem>
                                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                             </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {item.type === "image" && (
                         <div className="space-y-3 p-3 bg-white rounded-xl border border-slate-100">
                            <CloudinaryUpload value={item.image || ""} onUpload={(url) => {
                              const items = [...carouselItems];
                              items[idx].image = url;
                              onChange({ content: { items } });
                            }} onRemove={() => {
                              const items = [...carouselItems];
                              items[idx].image = "";
                              onChange({ content: { items } });
                            }} />
                            <div className="grid grid-cols-2 gap-2">
                               <div className="space-y-1">
                                  <Label className="text-[7px] text-slate-400 uppercase font-bold">Width (%)</Label>
                                  <Input type="number" value={item.width || 100} onChange={(e) => {
                                     const items = [...carouselItems];
                                     items[idx].width = Number(e.target.value);
                                     onChange({ content: { items } });
                                  }} className="h-7 bg-slate-50 text-[10px]" />
                               </div>
                               <div className="space-y-1">
                                  <Label className="text-[7px] text-slate-400 uppercase font-bold">Overlay Opacity</Label>
                                  <Input type="number" step="0.1" min="0" max="1" value={item.overlayOpacity ?? 0.4} onChange={(e) => {
                                     const items = [...carouselItems];
                                     items[idx].overlayOpacity = Number(e.target.value);
                                     onChange({ content: { items } });
                                  }} className="h-7 bg-slate-50 text-[10px]" />
                               </div>
                            </div>
                         </div>
                      )}

                      {item.type === "video" && (
                         <div className="space-y-2">
                            <Input value={item.videoUrl || ""} onChange={(e) => {
                              const items = [...carouselItems];
                              items[idx].videoUrl = e.target.value;
                              onChange({ content: { items } });
                            }} placeholder="YouTube URL" className="h-8 bg-white border-slate-200 text-slate-900 text-[10px] rounded-lg" />
                            <div className="space-y-1">
                               <Label className="text-[7px] text-slate-400 uppercase font-bold">Overlay Opacity</Label>
                               <Input type="number" step="0.1" min="0" max="1" value={item.overlayOpacity ?? 0.4} onChange={(e) => {
                                  const items = [...carouselItems];
                                  items[idx].overlayOpacity = Number(e.target.value);
                                  onChange({ content: { items } });
                               }} className="h-7 bg-white text-[10px]" />
                            </div>
                         </div>
                      )}

                      {item.type === "box" && (
                         <div className="grid grid-cols-2 gap-2">
                           <div className="space-y-1">
                             <Label className="text-[8px] text-slate-500 uppercase font-black">Background</Label>
                             <Input type="color" value={item.bgColor || "#ffffff"} onChange={(e) => {
                               const items = [...carouselItems];
                               items[idx].bgColor = e.target.value;
                               onChange({ content: { items } });
                             }} className="h-8 w-full p-1 bg-white border border-slate-200 cursor-pointer rounded-lg" />
                           </div>
                           <div className="space-y-1">
                             <Label className="text-[8px] text-slate-500 uppercase font-black">Default Text</Label>
                             <Input type="color" value={item.textColor || "#1a1a1a"} onChange={(e) => {
                               const items = [...carouselItems];
                               items[idx].textColor = e.target.value;
                               onChange({ content: { items } });
                             }} className="h-8 w-full p-1 bg-white border border-slate-200 cursor-pointer rounded-lg" />
                           </div>
                         </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex gap-2">
                           <Input value={item.header || ""} onChange={(e) => {
                              const items = [...carouselItems];
                              items[idx].header = e.target.value;
                              onChange({ content: { items } });
                           }} placeholder="Header" className="h-8 flex-1 bg-white border-slate-200 text-slate-900 text-[10px] rounded-lg" />
                           <Input type="color" value={item.headerColor || "#ffffff"} onChange={(e) => {
                              const items = [...carouselItems];
                              items[idx].headerColor = e.target.value;
                              onChange({ content: { items } });
                           }} className="h-8 w-8 p-1 bg-white border border-slate-200 cursor-pointer rounded-lg shrink-0" title="Header Color" />
                        </div>
                        
                        <div className="flex gap-2">
                           <Textarea value={item.paragraph || ""} onChange={(e) => {
                              const items = [...carouselItems];
                              items[idx].paragraph = e.target.value;
                              onChange({ content: { items } });
                           }} placeholder="Description..." className="min-h-[50px] flex-1 bg-white border-slate-200 text-slate-900 text-[10px] rounded-lg" />
                           <Input type="color" value={item.paragraphColor || "#ffffff"} onChange={(e) => {
                              const items = [...carouselItems];
                              items[idx].paragraphColor = e.target.value;
                              onChange({ content: { items } });
                           }} className="h-8 w-8 p-1 bg-white border border-slate-200 cursor-pointer rounded-lg shrink-0" title="Paragraph Color" />
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-3">
                           <Label className="text-[8px] text-slate-500 uppercase font-black block border-b pb-1">Call to Action</Label>
                           <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                 <Label className="text-[7px] text-slate-400 font-bold uppercase">Label</Label>
                                 <Input value={item.buttonLabel || ""} onChange={(e) => {
                                    const items = [...carouselItems];
                                    items[idx].buttonLabel = e.target.value;
                                    onChange({ content: { items } });
                                 }} placeholder="Button Text" className="h-7 text-[10px]" />
                              </div>
                              <div className="space-y-1">
                                 <Label className="text-[7px] text-slate-400 font-bold uppercase">Custom Link</Label>
                                 <Input value={item.buttonLink || ""} onChange={(e) => {
                                    const items = [...carouselItems];
                                    items[idx].buttonLink = e.target.value;
                                    onChange({ content: { items } });
                                 }} placeholder="https://..." className="h-7 text-[10px]" />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[7px] text-slate-400 font-bold uppercase">Scroll To Section</Label>
                              <Select 
                                value={item.buttonTargetId || "none"} 
                                onValueChange={(val) => {
                                  const items = [...carouselItems];
                                  items[idx].buttonTargetId = val === "none" ? undefined : val;
                                  onChange({ content: { items } });
                                }}
                              >
                                <SelectTrigger className="h-7 bg-slate-50 border-slate-200 text-slate-900 text-[10px] rounded-lg">
                                  <SelectValue placeholder="Target Section" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none" className="text-[10px]">None</SelectItem>
                                  {(config || []).filter(b => b.id !== block.id).map(b => (
                                    <SelectItem key={b.id} value={b.id} className="text-[10px]">
                                      {b.type.toUpperCase()} ({b.id.substr(0, 4)})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                 <Label className="text-[7px] text-slate-400 font-bold uppercase">Btn BG</Label>
                                 <Input type="color" value={item.btnBg || "#ffffff"} onChange={(e) => {
                                    const items = [...carouselItems];
                                    items[idx].btnBg = e.target.value;
                                    onChange({ content: { items } });
                                 }} className="h-7 w-full p-1 bg-white border border-slate-200 cursor-pointer rounded-md" />
                              </div>
                              <div className="space-y-1">
                                 <Label className="text-[7px] text-slate-400 font-bold uppercase">Btn Text</Label>
                                 <Input type="color" value={item.btnTextColor || "#000000"} onChange={(e) => {
                                    const items = [...carouselItems];
                                    items[idx].btnTextColor = e.target.value;
                                    onChange({ content: { items } });
                                 }} className="h-7 w-full p-1 bg-white border border-slate-200 cursor-pointer rounded-md" />
                              </div>
                           </div>
                        </div>
                      </div>
                   </div>
                 ))}
                   <Button variant="outline" className="w-full h-8 text-[9px] border-dashed border-white/10 bg-transparent text-slate-600 font-medium" onClick={() => {
                     const items = [...carouselItems, { id: Math.random().toString(36).substr(2, 9), type: "image", header: "New Slide", paragraph: "Slide description goes here..." }];
                     onChange({ content: { items } });
                   }}>+ Add Slide</Button>
                </div>
             </PropertySection>
          </div>
        );
      }

      if (block.type === "package-card") {
        return (
          <div className="space-y-4">
            <PropertySection label="Grid Settings" icon={LayoutGrid}>
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <Label className="text-[8px] text-slate-500 uppercase font-black">Desktop Columns</Label>
                    <Input type="number" min="1" max="4" value={block.content?.settings?.desktopColumns || 3} onChange={(e) => onChange({ content: { settings: { ...(block.content?.settings || {}), desktopColumns: Number(e.target.value) } } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-xs" />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[8px] text-slate-500 uppercase font-black">Gap (px)</Label>
                    <Input type="number" value={block.content?.settings?.gap || 20} onChange={(e) => onChange({ content: { settings: { ...(block.content?.settings || {}), gap: Number(e.target.value) } } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-xs" />
                 </div>
              </div>
            </PropertySection>

            <PropertySection label="Packages" icon={Package}>
              <div className="space-y-4">
                {(block.content?.packages || []).map((pkg: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-100/50 rounded-2xl border border-slate-200 space-y-4 relative group">
                     <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-rose-500 bg-white/80 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={() => {
                       const packages = block.content.packages.filter((_:any, i:number) => i !== idx);
                       onChange({ content: { packages } });
                     }}><Trash2 className="w-3 h-3" /></Button>

                     <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                           <div className="space-y-1">
                              <Label className="text-[8px] text-slate-500 uppercase font-black">Header</Label>
                              <Input value={pkg.header || ""} onChange={(e) => {
                                 const packages = [...block.content.packages];
                                 packages[idx].header = e.target.value;
                                 onChange({ content: { packages } });
                              }} className="h-8 text-[10px]" />
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[8px] text-slate-500 uppercase font-black">Badge</Label>
                              <Input value={pkg.badge || ""} onChange={(e) => {
                                 const packages = [...block.content.packages];
                                 packages[idx].badge = e.target.value;
                                 onChange({ content: { packages } });
                              }} placeholder="e.g. Popular" className="h-8 text-[10px]" />
                           </div>
                        </div>
                        <div className="space-y-1">
                           <Label className="text-[8px] text-slate-500 uppercase font-black">Subtitle</Label>
                           <Textarea value={pkg.subtitle || ""} onChange={(e) => {
                              const packages = [...block.content.packages];
                              packages[idx].subtitle = e.target.value;
                              onChange({ content: { packages } });
                           }} className="min-h-[60px] text-[10px]" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <div className="space-y-1">
                              <Label className="text-[8px] text-slate-500 uppercase font-black">Price</Label>
                              <Input value={pkg.price || ""} onChange={(e) => {
                                 const packages = [...block.content.packages];
                                 packages[idx].price = e.target.value;
                                 onChange({ content: { packages } });
                              }} className="h-8 text-[10px]" />
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[8px] text-slate-500 uppercase font-black">Unit</Label>
                              <Input value={pkg.priceUnit || ""} onChange={(e) => {
                                 const packages = [...block.content.packages];
                                 packages[idx].priceUnit = e.target.value;
                                 onChange({ content: { packages } });
                              }} placeholder="mo / yr" className="h-8 text-[10px]" />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-3 p-3 bg-white rounded-xl border border-slate-100">
                        <Label className="text-[8px] text-slate-500 uppercase font-black block border-b pb-1">Visuals</Label>
                        <div className="grid grid-cols-2 gap-2">
                           <div className="space-y-1">
                              <Label className="text-[7px] text-slate-400 uppercase font-bold">Background</Label>
                              <Input type="color" value={pkg.bgColor || "#ffffff"} onChange={(e) => {
                                 const packages = [...block.content.packages];
                                 packages[idx].bgColor = e.target.value;
                                 onChange({ content: { packages } });
                              }} className="h-7 w-full p-1" />
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[7px] text-slate-400 uppercase font-bold">Text Color</Label>
                              <Input type="color" value={pkg.textColor || "#1a1a1a"} onChange={(e) => {
                                 const packages = [...block.content.packages];
                                 packages[idx].textColor = e.target.value;
                                 onChange({ content: { packages } });
                              }} className="h-7 w-full p-1" />
                           </div>
                        </div>
                        <div className="space-y-1">
                           <Label className="text-[8px] text-slate-500 uppercase font-black">Texture</Label>
                           <Select value={pkg.texture || "none"} onValueChange={(val) => {
                              const packages = [...block.content.packages];
                              packages[idx].texture = val;
                              onChange({ content: { packages } });
                           }}>
                              <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="none">None</SelectItem>
                                 <SelectItem value="dots">Dots</SelectItem>
                                 <SelectItem value="grid">Grid</SelectItem>
                                 <SelectItem value="diagonal">Diagonal</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                        <CloudinaryUpload value={pkg.bgImage || ""} onUpload={(url) => {
                           const packages = [...block.content.packages];
                           packages[idx].bgImage = url;
                           onChange({ content: { packages } });
                        }} onRemove={() => {
                           const packages = [...block.content.packages];
                           packages[idx].bgImage = "";
                           onChange({ content: { packages } });
                        }} />
                     </div>

                     <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-3">
                        <Label className="text-[8px] text-slate-500 uppercase font-black block border-b pb-1">Button / CTA</Label>
                        <Input value={pkg.buttonLabel || ""} onChange={(e) => {
                           const packages = [...block.content.packages];
                           packages[idx].buttonLabel = e.target.value;
                           onChange({ content: { packages } });
                        }} placeholder="Label" className="h-7 text-[10px]" />
                        <Input value={pkg.buttonLink || ""} onChange={(e) => {
                           const packages = [...block.content.packages];
                           packages[idx].buttonLink = e.target.value;
                           onChange({ content: { packages } });
                        }} placeholder="Link" className="h-7 text-[10px]" />
                        <Select 
                          value={pkg.buttonTargetId || "none"} 
                          onValueChange={(val) => {
                            const packages = [...block.content.packages];
                            packages[idx].buttonTargetId = val === "none" ? undefined : val;
                            onChange({ content: { packages } });
                          }}
                        >
                          <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Scroll to..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {(config || []).filter(b => b.id !== block.id).map(b => (
                              <SelectItem key={b.id} value={b.id} className="text-[10px]">{b.type} ({b.id.substr(0,4)})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-2">
                           <Input type="color" value={pkg.btnBg || "#1a1a1a"} onChange={(e) => {
                              const packages = [...block.content.packages];
                              packages[idx].btnBg = e.target.value;
                              onChange({ content: { packages } });
                           }} className="h-7 w-full p-1" title="Button BG" />
                           <Input type="color" value={pkg.btnTextColor || "#ffffff"} onChange={(e) => {
                              const packages = [...block.content.packages];
                              packages[idx].btnTextColor = e.target.value;
                              onChange({ content: { packages } });
                           }} className="h-7 w-full p-1" title="Button Text" />
                        </div>
                     </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full h-8 text-[9px] border-dashed" onClick={() => {
                  const packages = [...(block.content?.packages || []), { header: "New Package", subtitle: "Package details...", price: "$99", buttonLabel: "Get Started" }];
                  onChange({ content: { packages } });
                }}><Plus className="w-3 h-3 mr-1" /> Add Package</Button>
              </div>
            </PropertySection>
          </div>
        );
      }

    default:
      return <div className="text-[8px] text-slate-400 italic text-center py-2 uppercase font-bold tracking-widest">Advanced widget selected</div>;
    }
  })()}
  <GlobalStyleEditor block={block} onChange={onChange} />
</div>
);
}

export function GlobalStyleEditor({ block, onChange }: { block: Block; onChange: (updates: any) => void }) {
  return (
    <div className="space-y-6 pt-6 border-t border-slate-200">
        <PropertySection label="Layout & Display" icon={LucideIcons.Layout}>
           <div className="space-y-4">
              <div className="space-y-1">
                 <Label className="text-[8px] text-slate-600 font-semibold uppercase tracking-widest">Display Mode</Label>
                 <Select value={block.style?.display || "block"} onValueChange={(val) => onChange({ style: { display: val } })}>
                    <SelectTrigger className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="block">Block</SelectItem>
                       <SelectItem value="inline-block">Inline Block</SelectItem>
                       <SelectItem value="flex">Flex</SelectItem>
                       <SelectItem value="inline-flex">Inline Flex</SelectItem>
                       <SelectItem value="grid">Grid</SelectItem>
                       <SelectItem value="none">Hidden (None)</SelectItem>
                    </SelectContent>
                 </Select>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                 <div className="space-y-1">
                    <Label className="text-[8px] text-slate-600 font-semibold uppercase tracking-widest">Max Width</Label>
                    <Select value={block.style?.maxWidth || "none"} onValueChange={(val) => onChange({ style: { maxWidth: val === "none" ? undefined : val } })}>
                       <SelectTrigger className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px]"><SelectValue placeholder="Default" /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="none">Default</SelectItem>
                          <SelectItem value="100%">100% (Full)</SelectItem>
                          <SelectItem value="400px">400px (Extra Small)</SelectItem>
                          <SelectItem value="600px">600px (Small)</SelectItem>
                          <SelectItem value="800px">800px (Medium)</SelectItem>
                          <SelectItem value="1000px">1000px (Large)</SelectItem>
                          <SelectItem value="1200px">1200px (Extra Large)</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[8px] text-slate-600 font-semibold uppercase tracking-widest">Position</Label>
                    <Select value={block.style?.alignment || "center"} onValueChange={(val) => onChange({ style: { alignment: val } })}>
                       <SelectTrigger className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </div>
           </div>

        </PropertySection>

        <PropertySection label="Box Model (Padding & Margin)" icon={LucideIcons.BoxSelect}>
           <div className="space-y-6">
              <div className="space-y-3">
                 <Label className="text-[8px] font-black text-slate-800 font-bold uppercase tracking-widest">Global Padding</Label>
                 <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                       <Label className="text-[7px] text-slate-500 font-semibold">Top</Label>
                       <Input type="number" value={block.style?.paddingTop || 0} onChange={(e) => onChange({ style: { paddingTop: Number(e.target.value) } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px] px-1 text-center" />
                    </div>
                    <div className="space-y-1">
                       <Label className="text-[7px] text-slate-500 font-semibold">Bottom</Label>
                       <Input type="number" value={block.style?.paddingBottom || 0} onChange={(e) => onChange({ style: { paddingBottom: Number(e.target.value) } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px] px-1 text-center" />
                    </div>
                    <div className="space-y-1">
                       <Label className="text-[7px] text-slate-500 font-semibold">Left</Label>
                       <Input type="number" value={block.style?.paddingLeft || 0} onChange={(e) => onChange({ style: { paddingLeft: Number(e.target.value) } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px] px-1 text-center" />
                    </div>
                    <div className="space-y-1">
                       <Label className="text-[7px] text-slate-500 font-semibold">Right</Label>
                       <Input type="number" value={block.style?.paddingRight || 0} onChange={(e) => onChange({ style: { paddingRight: Number(e.target.value) } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px] px-1 text-center" />
                    </div>
                 </div>
              </div>
              <div className="space-y-3">
                 <Label className="text-[8px] font-black text-slate-900 font-bold uppercase tracking-widest">Global Margin</Label>
                 <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                       <Label className="text-[7px] text-slate-500 font-semibold">Top</Label>
                       <Input type="number" value={block.style?.marginTop || 0} onChange={(e) => onChange({ style: { marginTop: Number(e.target.value) } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px] px-1 text-center" />
                    </div>
                    <div className="space-y-1">
                       <Label className="text-[7px] text-slate-500 font-semibold">Bottom</Label>
                       <Input type="number" value={block.style?.marginBottom || 0} onChange={(e) => onChange({ style: { marginBottom: Number(e.target.value) } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px] px-1 text-center" />
                    </div>
                    <div className="space-y-1">
                       <Label className="text-[7px] text-slate-500 font-semibold">Left</Label>
                       <Input type="number" value={block.style?.marginLeft || 0} onChange={(e) => onChange({ style: { marginLeft: Number(e.target.value) } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px] px-1 text-center" />
                    </div>
                    <div className="space-y-1">
                       <Label className="text-[7px] text-slate-500 font-semibold">Right</Label>
                       <Input type="number" value={block.style?.marginRight || 0} onChange={(e) => onChange({ style: { marginRight: Number(e.target.value) } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px] px-1 text-center" />
                    </div>
                 </div>
              </div>
               <div className="space-y-3 pt-4 border-t border-slate-200/50">
                 <Label className="text-[8px] font-black text-slate-800 font-bold uppercase tracking-widest">Border & Radius</Label>
                 <div className="space-y-2">
                    <Label className="text-[7px] text-slate-500 font-semibold">Border Widths (px)</Label>
                    <div className="grid grid-cols-4 gap-2">
                       <div className="space-y-1">
                          <Label className="text-[6px] text-slate-400 text-center block uppercase">Top</Label>
                          <Input type="number" value={block.style?.borderTopWidth || 0} onChange={(e) => onChange({ style: { borderTopWidth: Number(e.target.value) } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px] px-1 text-center" />
                       </div>
                       <div className="space-y-1">
                          <Label className="text-[6px] text-slate-400 text-center block uppercase">Bottom</Label>
                          <Input type="number" value={block.style?.borderBottomWidth || 0} onChange={(e) => onChange({ style: { borderBottomWidth: Number(e.target.value) } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px] px-1 text-center" />
                       </div>
                       <div className="space-y-1">
                          <Label className="text-[6px] text-slate-400 text-center block uppercase">Left</Label>
                          <Input type="number" value={block.style?.borderLeftWidth || 0} onChange={(e) => onChange({ style: { borderLeftWidth: Number(e.target.value) } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px] px-1 text-center" />
                       </div>
                       <div className="space-y-1">
                          <Label className="text-[6px] text-slate-400 text-center block uppercase">Right</Label>
                          <Input type="number" value={block.style?.borderRightWidth || 0} onChange={(e) => onChange({ style: { borderRightWidth: Number(e.target.value) } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px] px-1 text-center" />
                       </div>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <Label className="text-[7px] text-slate-500 font-semibold uppercase">Style</Label>
                       <Select value={block.style?.borderStyle || "none"} onValueChange={(val) => onChange({ style: { borderStyle: val } })}>
                          <SelectTrigger className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                             <SelectItem value="none">None</SelectItem>
                             <SelectItem value="solid">Solid</SelectItem>
                             <SelectItem value="dashed">Dashed</SelectItem>
                             <SelectItem value="dotted">Dotted</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-1">
                       <Label className="text-[7px] text-slate-500 font-semibold uppercase">Radius</Label>
                       <Input type="number" value={block.style?.borderRadius || 0} onChange={(e) => onChange({ style: { borderRadius: Number(e.target.value) } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px]" />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[7px] text-slate-500 font-semibold uppercase">Border Color</Label>
                    <Input type="color" value={block.style?.borderColor || "#000000"} onChange={(e) => onChange({ style: { borderColor: e.target.value } })} className="h-8 w-full p-1 bg-black/20 border-none cursor-pointer rounded-lg" />
                 </div>
              </div>
           </div>
        </PropertySection>

       <PropertySection label="Typography & Color" icon={Palette}>
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <Label className="text-[8px] text-slate-600 font-semibold">Text Color</Label>
                   <Input type="color" value={block.style?.textColor || "#000000"} onChange={(e) => onChange({ style: { textColor: e.target.value } })} className="h-8 w-full p-1 bg-black/20 border-none cursor-pointer rounded-lg" />
                </div>
                <div className="space-y-1">
                   <Label className="text-[8px] text-slate-600 font-semibold">Font Size</Label>
                   <Input type="number" value={block.style?.fontSize || 16} onChange={(e) => onChange({ style: { fontSize: Number(e.target.value) } })} className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-xs" />
                </div>
             </div>
             
             <div className="space-y-1">
                <Label className="text-[8px] text-slate-600 font-semibold uppercase tracking-widest">Text Alignment</Label>
                <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                   {[
                      { id: 'left', icon: LucideIcons.AlignLeft },
                      { id: 'center', icon: LucideIcons.AlignCenter },
                      { id: 'right', icon: LucideIcons.AlignRight },
                      { id: 'justify', icon: LucideIcons.AlignJustify }
                   ].map((align) => {
                      const Icon = align.icon;
                      return (
                         <Button
                            key={align.id}
                            variant="ghost"
                            size="icon"
                            className={cn(
                               "h-7 flex-1 rounded-md transition-all",
                               block.style?.textAlign === align.id ? "bg-white shadow-sm text-primary" : "text-slate-400 hover:text-slate-600"
                            )}
                            onClick={() => onChange({ style: { textAlign: align.id } })}
                         >
                            <Icon className="w-3.5 h-3.5" />
                         </Button>
                      );
                   })}
                </div>
             </div>

             <div className="space-y-1">
                <Label className="text-[8px] text-slate-600 font-semibold">Background Color</Label>
                <Input type="color" value={block.style?.backgroundColor || "transparent"} onChange={(e) => onChange({ style: { backgroundColor: e.target.value } })} className="h-8 w-full p-1 bg-black/20 border-none cursor-pointer rounded-lg" />
             </div>
          </div>
       </PropertySection>


       <PropertySection label="Visual Texture" icon={ImageIcon}>
          <div className="space-y-4">
             <div className="space-y-1">
                <Label className="text-[8px] text-slate-600 font-semibold">Background Image</Label>
                <CloudinaryUpload value={block.style?.backgroundImage || ""} onUpload={(url) => onChange({ style: { backgroundImage: url } })} onRemove={() => onChange({ style: { backgroundImage: "" } })} />
             </div>
             <div className="space-y-1">
                <Label className="text-[8px] text-slate-600 font-semibold">Background Pattern</Label>
                <Select value={block.style?.backgroundTexture || "none"} onValueChange={(val) => onChange({ style: { backgroundTexture: val } })}>
                   <SelectTrigger className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="dots">Dots Pattern</SelectItem>
                      <SelectItem value="grid">Grid Pattern</SelectItem>
                      <SelectItem value="diagonal">Diagonal Lines</SelectItem>
                   </SelectContent>
                </Select>
             </div>
          </div>
       </PropertySection>

       <PropertySection label="Visual Effects" icon={Sparkles}>
          <div className="space-y-4">
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <Label className="text-[8px] text-slate-600 font-semibold uppercase tracking-widest">Opacity</Label>
                   <span className="text-[8px] font-black text-primary">{Math.round((block.style?.opacity ?? 1) * 100)}%</span>
                </div>
                <Slider 
                   value={[(block.style?.opacity ?? 1) * 100]} 
                   min={0} 
                   max={100} 
                   step={1} 
                   onValueChange={(val) => onChange({ style: { opacity: val[0] / 100 } })} 
                />
             </div>

             <div className="space-y-1">
                <Label className="text-[8px] text-slate-600 font-semibold uppercase tracking-widest">Entrance Animation</Label>
                <Select value={block.style?.animation || "none"} onValueChange={(val) => onChange({ style: { animation: val } })}>
                   <SelectTrigger className="h-8 bg-slate-100 border-slate-200 text-slate-900 text-[10px]"><SelectValue /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="fadeIn">Fade In</SelectItem>
                      <SelectItem value="slideUp">Slide Up</SelectItem>
                      <SelectItem value="zoomIn">Zoom In</SelectItem>
                      <SelectItem value="bounce">Bounce</SelectItem>
                      <SelectItem value="joy">Joy (Happy)</SelectItem>
                      <SelectItem value="celebrate">Celebrate</SelectItem>
                      <SelectItem value="scroll-down">Scroll Down</SelectItem>
                      <SelectItem value="cross-sign">Cross Sign (No)</SelectItem>
                      <SelectItem value="check-mark">Check Mark (Yes)</SelectItem>
                   </SelectContent>
                </Select>
                <p className="text-[7px] text-slate-400 mt-1 italic">Tip: Use [animate:text] in content fields for word-level effects.</p>
             </div>
          </div>
       </PropertySection>

       <PropertySection label="Visibility Architecture" icon={Smartphone}>
          <div className="grid grid-cols-2 gap-4">
             <div className="flex items-center justify-between p-2 bg-black/10 rounded-lg">
                <Label className="text-[8px] font-bold text-slate-900 font-black uppercase tracking-widest">Hide Mobile</Label>
                <Switch checked={!!block.style?.hideMobile} onCheckedChange={(val) => onChange({ style: { hideMobile: val } })} />
             </div>
             <div className="flex items-center justify-between p-2 bg-black/10 rounded-lg">
                <Label className="text-[8px] font-bold text-slate-900 font-black uppercase tracking-widest">Hide Desktop</Label>
                <Switch checked={!!block.style?.hideDesktop} onCheckedChange={(val) => onChange({ style: { hideDesktop: val } })} />
             </div>
          </div>
       </PropertySection>
    </div>
  );
}

