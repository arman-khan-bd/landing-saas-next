<<<<<<< HEAD

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabaseClient } from "@/supabase";
import * as LucideIcons from "lucide-react";
import { 
  Plus, Save, Trash2, Image as ImageIcon,
  Type, Layout, List, CheckCircle, ShoppingCart,
  Loader2, Monitor, Smartphone,
  Square, Eye, X, Columns,
  ArrowLeft, Palette, Box, MousePointer2,
  Sparkles, PlusCircle, LayoutGrid,
  MoveVertical, ArrowUp, ArrowDown,
  Paintbrush, Layers,
  ChevronUp, ChevronDown, Truck, CreditCard,
  Star, Heart, Lightbulb, Info, Shield, Zap, Check, LayoutList,
  Flame, Leaf, Moon, Sun, Quote, Rocket, Menu, PlayCircle, Code, ShieldCheck, AlignLeft,
  Settings2, Wand2
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarProvider, 
  SidebarInset,
  SidebarFooter,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { cn, getTenantPath } from "@/lib/utils";
import { Block, BlockType, PageStyle } from "../../builder/[pageId]/types";
import { PropertySection, WidgetGridButton } from "../../builder/[pageId]/components";
import { PropertyEditor } from "../../builder/[pageId]/property-editor";
import { CanvasBlockWrapper, BlockRenderer } from "../../builder/[pageId]/block-renderer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";


import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

function sanitizeForFirestore(data: any): any {
  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore);
  }
  if (data !== null && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, sanitizeForFirestore(value)])
    );
  }
  return data;
}

export default function SectionManager() {
  return (
    <SidebarProvider defaultOpen={true}>
      <SectionEditorInner />
    </SidebarProvider>
  );
}

function SectionEditorInner() {
  const { subdomain, pageId } = useParams();
  const router = useRouter();
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const { setOpenMobile, isMobile } = useSidebar();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [store, setStore] = useState<any>(null);
  const [pageData, setPageData] = useState<any>(null);
  const [pageStyle, setPageStyle] = useState<PageStyle>({
    backgroundColor: "#fdf6e3",
    textColor: "#1a1a1a",
    primaryColor: "#1a4a1a",
    themeId: "laam",
    paddingTop: 40,
    paddingBottom: 40,
    backgroundTexture: "none",
    backgroundOpacity: 100,
    backgroundSize: "cover"
  });
  const [products, setProducts] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"structure" | "edit" | "advanced">("structure");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isComponentDialogOpen, setIsComponentDialogOpen] = useState(false);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [activeColumnIndex, setActiveColumnIndex] = useState<number | null>(null);
  const [insertInfo, setInsertInfo] = useState<{ id: string, position: 'before' | 'after' } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (subdomain && pageId) {
      fetchPageData();
    }
  }, [subdomain, pageId]);

  const fetchPageData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("subdomain", subdomain)
        .single();
      if (!storeData) {
        setLoading(false);
        return;
      }
      setStore(storeData);

      const { data: pageVal } = await supabase
        .from("sections")
        .select("*")
        .eq("id", pageId)
        .single();

      if (pageVal) {
        setPageData(pageVal);
        setBlocks(pageVal.blocks || []);
        if (pageVal.page_style) {
          setPageStyle({
            backgroundTexture: "none",
            backgroundOpacity: 100,
            backgroundSize: "cover",
            ...pageVal.page_style
          });
        }
      } else {
        toast({ variant: "destructive", title: "Page not found" });
        router.back();
      }

      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeData.id);
      setProducts(prods ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateBlock = (id: string | null, updates: any) => {
    if (!id) return;
    setBlocks(prev => updateNestedBlock(prev, id, updates));
  };

  const updateNestedBlock = (items: Block[], id: string, updates: any): Block[] => {
    return items.map(item => {
      if (item.id === id) {
        const newBlock = { ...item };
        if (updates.style) newBlock.style = { ...item.style, ...updates.style };
        if (updates.content) newBlock.content = { ...item.content, ...updates.content };
        if (updates.children) newBlock.children = updates.children;
        return newBlock;
      }
      if (item.children) return { ...item, children: updateNestedBlock(item.children, id, updates) };
      return item;
    });
  };

  const handleSave = async () => {
    if (!pageId) return;
    setSaving(true);
    try {
      const sanitizedBlocks = sanitizeForFirestore(blocks);
      const sanitizedPageStyle = sanitizeForFirestore(pageStyle);

      const { error } = await supabase
        .from("sections")
        .update({
          blocks: sanitizedBlocks,
          page_style: sanitizedPageStyle,
          updated_at: new Date().toISOString()
        })
        .eq("id", pageId);

      if (error) throw error;
      toast({ title: "Design Saved!", description: "High-conversion matrix is updated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: {},
      style: { textAlign: "left", animation: "none", columnIndex: activeColumnIndex ?? 0 },
    };
    
    if (type === "row") {
      newBlock.children = [];
    }

    if (insertInfo) {
      setBlocks(prev => insertBlockRecursively(prev, insertInfo.id, insertInfo.position, newBlock));
      setInsertInfo(null);
    } else if (activeParentId) {
      setBlocks(prev => addNestedBlock(prev, activeParentId, newBlock));
    } else {
      setBlocks([...blocks, newBlock]);
    }
    
    setSelectedBlockId(newBlock.id);
    setSidebarTab("edit");
    setIsComponentDialogOpen(false);
    setActiveParentId(null);
    setActiveColumnIndex(null);
    if (isMobile) setOpenMobile(true);
  };

  const insertBlockRecursively = (items: Block[], relativeId: string, position: 'before' | 'after', newBlock: Block): Block[] => {
    const index = items.findIndex(i => i.id === relativeId);
    if (index !== -1) {
      const newItems = [...items];
      newItems.splice(position === 'before' ? index : index + 1, 0, newBlock);
      return newItems;
    }
    return items.map(item => item.children ? { ...item, children: insertBlockRecursively(item.children, relativeId, position, newBlock) } : item);
  };

  const addNestedBlock = (items: Block[], parentId: string, newBlock: Block): Block[] => {
    return items.map(item => {
      if (item.id === parentId) return { ...item, children: [...(item.children || []), newBlock] };
      if (item.children) return { ...item, children: addNestedBlock(item.children, parentId, newBlock) };
      return item;
    });
  };

  const removeBlock = (id: string) => {
    if (selectedBlockId === id) setSelectedBlockId(null);
    setBlocks(prev => removeNestedBlock(prev, id));
  };

  const removeNestedBlock = (items: Block[], id: string): Block[] => {
    return items.filter(item => item.id !== id).map(item => item.children ? { ...item, children: removeNestedBlock(item.children, id) } : item);
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const moveInArray = (arr: Block[]): Block[] => {
      const index = arr.findIndex(b => b.id === id);
      if (index !== -1) {
        const newArr = [...arr];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < newArr.length) [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]];
        return newArr;
      }
      return arr.map(b => b.children ? { ...b, children: moveInArray(b.children) } : b);
    };
    setBlocks(prev => moveInArray(prev));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const reorderRecursive = (items: Block[]): Block[] => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) return arrayMove(items, oldIndex, newIndex);
      return items.map(item => item.children ? { ...item, children: reorderRecursive(item.children) } : item);
    };
    setBlocks(prev => reorderRecursive(prev));
  };

  const handleAddNested = useCallback((parentId: string, colIdx?: number) => {
    setActiveParentId(parentId);
    setActiveColumnIndex(colIdx ?? 0);
    setIsComponentDialogOpen(true);
  }, []);

  const selectedBlock = useMemo(() => findBlockById(blocks, selectedBlockId), [blocks, selectedBlockId]);

  function findBlockById(items: Block[], id: string | null): Block | undefined {
    if (!id) return undefined;
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findBlockById(item.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }

  const getBackgroundStyles = () => {
    const styles: any = {
      backgroundColor: pageStyle.backgroundColor,
      paddingTop: `${pageStyle.paddingTop}px`,
      paddingBottom: `${pageStyle.paddingBottom}px`,
      position: 'relative'
    };

    if (pageStyle.backgroundImage) {
      styles.backgroundImage = `url(${pageStyle.backgroundImage})`;
      styles.backgroundSize = pageStyle.backgroundSize || 'cover';
      styles.backgroundPosition = 'center';
    }

    return styles;
  };

  const getTextureOverlay = () => {
    if (pageStyle.backgroundTexture === "none" || !pageStyle.backgroundTexture) return null;
    
    let pattern = "";
    if (pageStyle.backgroundTexture === "dots") {
      pattern = "radial-gradient(circle, currentColor 1px, transparent 1px)";
    } else if (pageStyle.backgroundTexture === "grid") {
      pattern = "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)";
    } else if (pageStyle.backgroundTexture === "diagonal") {
      pattern = "repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)";
    }

    return (
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          backgroundImage: pattern, 
          backgroundSize: pageStyle.backgroundTexture === "grid" ? "20px 20px" : "15px 15px",
          opacity: (pageStyle.backgroundOpacity || 10) / 100,
          color: pageStyle.textColor || '#000'
        }} 
      />
    );
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-white w-12 h-12" /></div>;

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden text-slate-100 select-none">
      <Sidebar collapsible="offcanvas" className="border-r-0 bg-slate-900 text-white shadow-2xl">
        <SidebarHeader className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400" onClick={() => router.push(getTenantPath(subdomain as string, "/sections"))}>
                <ArrowLeft className="w-5 h-5" />
             </Button>
            <div>
              <span className="block font-headline font-black text-sm uppercase tracking-tight truncate max-w-[120px]">{pageData?.title}</span>
              <span className="text-[8px] text-white/40 font-bold uppercase tracking-widest block">Editor Console</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0">
          <Tabs value={sidebarTab} onValueChange={(v: any) => setSidebarTab(v)} className="flex-1 overflow-hidden flex flex-col h-full">
            <TabsList className="w-full bg-black/10 border-b border-white/10 rounded-none h-10 p-0 shrink-0">
              <TabsTrigger value="structure" className="flex-1 font-bold text-[9px] uppercase tracking-widest h-full">Page</TabsTrigger>
              <TabsTrigger value="edit" className="flex-1 font-bold text-[9px] uppercase tracking-widest h-full" disabled={!selectedBlockId}>Content</TabsTrigger>
              <TabsTrigger value="advanced" className="flex-1 font-bold text-[9px] uppercase tracking-widest h-full" disabled={!selectedBlockId}>Design</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6 pb-20">
                <TabsContent value="structure" className="mt-0 space-y-6">
                  <PropertySection label="Global Canvas" icon={Wand2}>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase font-bold text-white/40">Background Color</Label>
                        <Input type="color" value={pageStyle.backgroundColor || "#ffffff"} onChange={(e) => setPageStyle({ ...pageStyle, backgroundColor: e.target.value })} className="h-8 p-1 bg-black/20 border-none cursor-pointer" />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase font-bold text-white/40">Background Texture</Label>
                        <Select value={pageStyle.backgroundTexture || "none"} onValueChange={(v: any) => setPageStyle({ ...pageStyle, backgroundTexture: v })}>
                          <SelectTrigger className="h-8 rounded-lg border-none bg-black/20 text-white text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/10 text-white">
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="dots">Dots</SelectItem>
                            <SelectItem value="grid">Grid</SelectItem>
                            <SelectItem value="diagonal">Diagonal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {pageStyle.backgroundTexture !== "none" && (
                        <div className="space-y-2">
                           <div className="flex justify-between items-center">
                              <Label className="text-[9px] uppercase font-bold text-white/40">Texture Opacity</Label>
                              <span className="text-[9px] font-bold text-indigo-400">{pageStyle.backgroundOpacity}%</span>
                           </div>
                           <Slider value={[pageStyle.backgroundOpacity || 10]} max={100} step={1} onValueChange={(val) => setPageStyle({ ...pageStyle, backgroundOpacity: val[0] })} />
                        </div>
                      )}

                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase font-bold text-white/40">Background Image</Label>
                        <CloudinaryUpload 
                          value={pageStyle.backgroundImage || ""}
                          onUpload={(url) => setPageStyle({ ...pageStyle, backgroundImage: url })}
                          onRemove={() => setPageStyle({ ...pageStyle, backgroundImage: "" })}
                        />
                      </div>

                      {pageStyle.backgroundImage && (
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase font-bold text-white/40">Background Size</Label>
                          <Select value={pageStyle.backgroundSize || "cover"} onValueChange={(v: any) => setPageStyle({ ...pageStyle, backgroundSize: v })}>
                            <SelectTrigger className="h-8 rounded-lg border-none bg-black/20 text-white text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/10 text-white">
                              <SelectItem value="cover">Cover (Fill)</SelectItem>
                              <SelectItem value="contain">Contain (Fit)</SelectItem>
                              <SelectItem value="auto">Auto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </PropertySection>

                  <PropertySection label="Page Layers" icon={Layers}>
                    <Accordion type="multiple" className="w-full">
                       {blocks.map((block, idx) => (
                         <AccordionItem key={block.id} value={block.id} className="border-b-0 mb-1">
                            <AccordionTrigger 
                              className="px-4 py-3 rounded-xl bg-black/20 hover:no-underline font-bold text-[10px] uppercase tracking-wider text-slate-400 data-[state=open]:text-indigo-400"
                              onClick={(e) => { e.stopPropagation(); setSelectedBlockId(block.id); setSidebarTab("edit"); }}
                            >
                               <div className="flex items-center gap-3">
                                  <span className="opacity-30">#{idx + 1}</span>
                                  {block.type}
                               </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-2 space-y-1">
                               {block.children?.map((child, cIdx) => (
                                 <button 
                                   key={child.id}
                                   onClick={(e) => { e.stopPropagation(); setSelectedBlockId(child.id); setSidebarTab("edit"); }}
                                   className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/5 text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2"
                                 >
                                    <div className="w-1 h-1 rounded-full bg-indigo-500" />
                                    {child.type} (Col { (child.style?.columnIndex ?? 0) + 1 })
                                 </button>
                               ))}
                            </AccordionContent>
                         </AccordionItem>
                       ))}
                    </Accordion>
                    <Button variant="outline" className="w-full mt-4 h-10 border-dashed border-white/10 bg-transparent text-[9px] font-black uppercase tracking-widest gap-2" onClick={() => { setActiveParentId(null); setActiveColumnIndex(null); setIsComponentDialogOpen(true); }}>
                       <PlusCircle className="w-3 h-3" /> Insert Section
                    </Button>
                  </PropertySection>
                </TabsContent>

                <TabsContent value="edit" className="mt-0 space-y-6">
                  {selectedBlock && (
                    <PropertyEditor 
                      block={selectedBlock} 
                      products={products} 
                      onChange={(u: any) => updateBlock(selectedBlockId, u)} 
                    />
                  )}
                </TabsContent>

                <TabsContent value="advanced" className="mt-0 space-y-6">
                  {selectedBlock && (
                    <>
                      <PropertySection label="Motion Engine" icon={Zap}>
                        <div className="space-y-4">
                           <div className="space-y-1">
                              <Label className="text-[9px] uppercase font-bold text-white/40">Scroll Animation</Label>
                              <Select 
                                value={selectedBlock.style?.animation || "none"} 
                                onValueChange={(v) => updateBlock(selectedBlockId, { style: { animation: v } })}
                              >
                                 <SelectTrigger className="h-8 rounded-lg border-none bg-black/20 text-white text-[10px]">
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent className="bg-slate-800 border-white/10 text-white">
                                    <SelectItem value="none">Static (None)</SelectItem>
                                    <SelectItem value="fadeIn">Fade In</SelectItem>
                                    <SelectItem value="slideUp">Slide Up</SelectItem>
                                    <SelectItem value="zoomIn">Zoom In</SelectItem>
                                    <SelectItem value="bounce">Bounce</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                        </div>
                      </PropertySection>

                      <PropertySection label="Surface Design" icon={Palette}>
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                 <Label className="text-[9px] uppercase font-bold text-white/40">BG Color</Label>
                                 <Input type="color" value={selectedBlock.style?.backgroundColor || "#ffffff"} onChange={(e) => updateBlock(selectedBlockId, { style: { backgroundColor: e.target.value } })} className="h-8 p-1 bg-black/20 border-none cursor-pointer" />
                              </div>
                              <div className="space-y-1">
                                 <Label className="text-[9px] uppercase font-bold text-white/40">Text Color</Label>
                                 <Input type="color" value={selectedBlock.style?.textColor || "#000000"} onChange={(e) => updateBlock(selectedBlockId, { style: { textColor: e.target.value } })} className="h-8 p-1 bg-black/20 border-none cursor-pointer" />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[9px] uppercase font-bold text-white/40">Background Image</Label>
                              <CloudinaryUpload 
                                value={selectedBlock.style?.backgroundImage || ""}
                                onUpload={(url) => updateBlock(selectedBlockId, { style: { backgroundImage: url } })}
                                onRemove={() => updateBlock(selectedBlockId, { style: { backgroundImage: "" } })}
                              />
                           </div>
                           {selectedBlock.style?.backgroundImage && (
                              <div className="grid grid-cols-2 gap-2">
                                 <div className="space-y-1">
                                    <Label className="text-[9px] uppercase font-bold text-white/40">Size</Label>
                                    <Select value={selectedBlock.style?.backgroundSize || "cover"} onValueChange={(v) => updateBlock(selectedBlockId, { style: { backgroundSize: v } })}>
                                       <SelectTrigger className="h-8 bg-black/20 border-none text-[10px] text-white"><SelectValue /></SelectTrigger>
                                       <SelectContent>
                                          <SelectItem value="cover">Cover</SelectItem>
                                          <SelectItem value="contain">Contain</SelectItem>
                                          <SelectItem value="auto">Auto</SelectItem>
                                       </SelectContent>
                                    </Select>
                                 </div>
                                 <div className="space-y-1">
                                    <Label className="text-[9px] uppercase font-bold text-white/40">Repeat</Label>
                                    <Select value={selectedBlock.style?.backgroundRepeat || "no-repeat"} onValueChange={(v) => updateBlock(selectedBlockId, { style: { backgroundRepeat: v } })}>
                                       <SelectTrigger className="h-8 bg-black/20 border-none text-[10px] text-white"><SelectValue /></SelectTrigger>
                                       <SelectContent>
                                          <SelectItem value="no-repeat">No Repeat</SelectItem>
                                          <SelectItem value="repeat">Repeat</SelectItem>
                                          <SelectItem value="repeat-x">Repeat X</SelectItem>
                                          <SelectItem value="repeat-y">Repeat Y</SelectItem>
                                       </SelectContent>
                                    </Select>
                                 </div>
                              </div>
                           )}
                           <div className="space-y-1">
                              <Label className="text-[9px] uppercase font-bold text-white/40">Texture Pattern</Label>
                              <Select value={selectedBlock.style?.backgroundTexture || "none"} onValueChange={(v) => updateBlock(selectedBlockId, { style: { backgroundTexture: v } })}>
                                 <SelectTrigger className="h-8 bg-black/20 border-none text-[10px] text-white"><SelectValue /></SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="dots">Dots</SelectItem>
                                    <SelectItem value="grid">Grid</SelectItem>
                                    <SelectItem value="diagonal">Diagonal Lines</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                        </div>
                      </PropertySection>

                      <PropertySection label="Iconographic" icon={LucideIcons.Star}>
                        <div className="space-y-4">
                           <div className="space-y-1">
                              <Label className="text-[9px] uppercase font-bold text-white/40">Block Icon</Label>
                              <Select value={selectedBlock.style?.iconName || "none"} onValueChange={(v) => updateBlock(selectedBlockId, { style: { iconName: v } })}>
                                 <SelectTrigger className="h-8 bg-black/20 border-none text-[10px] text-white"><SelectValue /></SelectTrigger>
                                 <SelectContent className="max-h-[200px]">
                                    <SelectItem value="none">No Icon</SelectItem>
                                    <SelectItem value="Star">Star</SelectItem>
                                    <SelectItem value="Heart">Heart</SelectItem>
                                    <SelectItem value="Shield">Shield</SelectItem>
                                    <SelectItem value="Zap">Zap (Lightning)</SelectItem>
                                    <SelectItem value="CheckCircle">Check Circle</SelectItem>
                                    <SelectItem value="Info">Info</SelectItem>
                                    <SelectItem value="Globe">Globe</SelectItem>
                                    <SelectItem value="Sparkles">Sparkles</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                           {selectedBlock.style?.iconName && selectedBlock.style.iconName !== 'none' && (
                              <div className="grid grid-cols-2 gap-2">
                                 <div className="space-y-1">
                                    <Label className="text-[9px] uppercase font-bold text-white/40">Icon Color</Label>
                                    <Input type="color" value={selectedBlock.style?.iconColor || "#000000"} onChange={(e) => updateBlock(selectedBlockId, { style: { iconColor: e.target.value } })} className="h-8 p-1 bg-black/20 border-none cursor-pointer w-full" />
                                 </div>
                                 <div className="space-y-1">
                                    <Label className="text-[9px] uppercase font-bold text-white/40">Icon Size</Label>
                                    <Input type="number" value={selectedBlock.style?.iconSize || 24} onChange={(e) => updateBlock(selectedBlockId, { style: { iconSize: Number(e.target.value) } })} className="h-8 bg-black/20 border-none text-[10px] text-white" />
                                 </div>
                                 <div className="col-span-2 space-y-1">
                                    <Label className="text-[9px] uppercase font-bold text-white/40">Position</Label>
                                    <Select value={selectedBlock.style?.iconPosition || "top"} onValueChange={(v) => updateBlock(selectedBlockId, { style: { iconPosition: v } })}>
                                       <SelectTrigger className="h-8 bg-black/20 border-none text-[10px] text-white"><SelectValue /></SelectTrigger>
                                       <SelectContent>
                                          <SelectItem value="top">Top</SelectItem>
                                          <SelectItem value="left">Left</SelectItem>
                                          <SelectItem value="right">Right</SelectItem>
                                          <SelectItem value="bottom">Bottom</SelectItem>
                                       </SelectContent>
                                    </Select>
                                 </div>
                              </div>
                           )}
                        </div>
                      </PropertySection>
                      <PropertySection label="Border & Shape" icon={Square}>
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                 <Label className="text-[9px] uppercase font-bold text-white/40">Border Width</Label>
                                 <Input type="number" value={selectedBlock.style?.borderWidth || 0} onChange={(e) => updateBlock(selectedBlockId, { style: { borderWidth: Number(e.target.value) } })} className="h-8 bg-black/20 border-none text-[10px] text-white" />
                              </div>
                              <div className="space-y-1">
                                 <Label className="text-[9px] uppercase font-bold text-white/40">Corner Radius</Label>
                                 <Input type="number" value={selectedBlock.style?.borderRadius || 0} onChange={(e) => updateBlock(selectedBlockId, { style: { borderRadius: Number(e.target.value) } })} className="h-8 bg-black/20 border-none text-[10px] text-white" />
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                 <Label className="text-[9px] uppercase font-bold text-white/40">Border Color</Label>
                                 <Input type="color" value={selectedBlock.style?.borderColor || "#000000"} onChange={(e) => updateBlock(selectedBlockId, { style: { borderColor: e.target.value } })} className="h-8 p-1 bg-black/20 border-none cursor-pointer w-full" />
                              </div>
                              <div className="space-y-1">
                                 <Label className="text-[9px] uppercase font-bold text-white/40">Border Style</Label>
                                 <Select value={selectedBlock.style?.borderStyle || "solid"} onValueChange={(v) => updateBlock(selectedBlockId, { style: { borderStyle: v } })}>
                                    <SelectTrigger className="h-8 bg-black/20 border-none text-[10px] text-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="solid">Solid</SelectItem>
                                       <SelectItem value="dashed">Dashed</SelectItem>
                                       <SelectItem value="dotted">Dotted</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>
                           </div>
                        </div>
                      </PropertySection>
                      
                      <PropertySection label="Box Scale (Spacing)" icon={MoveVertical}>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-3">
                              <Label className="text-[8px] font-black uppercase text-indigo-400">Padding</Label>
                              <div className="space-y-2">
                                 <Input type="number" placeholder="Top" value={selectedBlock.style?.paddingTop ?? ""} onChange={(e) => updateBlock(selectedBlockId, { style: { paddingTop: Number(e.target.value) } })} className="h-8 bg-black/20 border-none text-[10px] text-white" />
                                 <Input type="number" placeholder="Bottom" value={selectedBlock.style?.paddingBottom ?? ""} onChange={(e) => updateBlock(selectedBlockId, { style: { paddingBottom: Number(e.target.value) } })} className="h-8 bg-black/20 border-none text-[10px] text-white" />
                              </div>
                           </div>
                           <div className="space-y-3">
                              <Label className="text-[8px] font-black uppercase text-amber-400">Margin</Label>
                              <div className="space-y-2">
                                 <Input type="number" placeholder="Top" value={selectedBlock.style?.marginTop ?? ""} onChange={(e) => updateBlock(selectedBlockId, { style: { marginTop: Number(e.target.value) } })} className="h-8 bg-black/20 border-none text-[10px] text-white" />
                                 <Input type="number" placeholder="Bottom" value={selectedBlock.style?.marginBottom ?? ""} onChange={(e) => updateBlock(selectedBlockId, { style: { marginBottom: Number(e.target.value) } })} className="h-8 bg-black/20 border-none text-[10px] text-white" />
                              </div>
                           </div>
                        </div>
                      </PropertySection>

                      <PropertySection label="Typography Control" icon={Type}>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <Label className="text-[9px] uppercase font-bold text-white/40">Font Size (px)</Label>
                              <Input type="number" value={selectedBlock.style?.fontSize ?? ""} onChange={(e) => updateBlock(selectedBlockId, { style: { fontSize: Number(e.target.value) } })} className="h-8 bg-black/20 border-none text-white text-xs" />
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[9px] uppercase font-bold text-white/40">Alignment</Label>
                              <div className="grid grid-cols-3 gap-1 bg-black/20 p-1 rounded-lg">
                                 <Button variant="ghost" size="icon" className={cn("h-6 w-full rounded-md", selectedBlock.style?.textAlign === 'left' ? 'bg-white text-primary' : 'text-white/40')} onClick={() => updateBlock(selectedBlockId, { style: { textAlign: 'left' } })}><AlignLeft className="w-3 h-3" /></Button>
                                 <Button variant="ghost" size="icon" className={cn("h-6 w-full rounded-md", selectedBlock.style?.textAlign === 'center' ? 'bg-white text-primary' : 'text-white/40')} onClick={() => updateBlock(selectedBlockId, { style: { textAlign: 'center' } })}><LucideIcons.AlignCenter className="w-3 h-3" /></Button>
                                 <Button variant="ghost" size="icon" className={cn("h-6 w-full rounded-md", selectedBlock.style?.textAlign === 'right' ? 'bg-white text-primary' : 'text-white/40')} onClick={() => updateBlock(selectedBlockId, { style: { textAlign: 'right' } })}><LucideIcons.AlignRight className="w-3 h-3" /></Button>
                              </div>
                           </div>
                        </div>
                      </PropertySection>
                    </>
                  )}
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-white/5 bg-black/10">
          <Button className="w-full h-12 rounded-2xl font-black text-xs bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />} Deploy Changes
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-slate-950 flex flex-col overflow-hidden">
         <header className="h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-8 z-30 shrink-0">
            <div className="flex items-center gap-4">
               <SidebarTrigger className="text-slate-400" />
               <div className="h-5 w-px bg-white/5" />
               <div className="flex items-center gap-2">
                  <Button variant={viewMode === 'desktop' ? 'secondary' : 'ghost'} size="sm" className="h-8 rounded-lg font-bold text-[10px] uppercase" onClick={() => setViewMode('desktop')}><Monitor className="w-3.5 h-3.5 mr-1.5" /> Desktop</Button>
                  <Button variant={viewMode === 'mobile' ? 'secondary' : 'ghost'} size="sm" className="h-8 rounded-lg font-bold text-[10px] uppercase" onClick={() => setViewMode('mobile')}><Smartphone className="w-3.5 h-3.5 mr-1.5" /> Mobile</Button>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <Button variant="ghost" size="sm" className="text-slate-400 font-bold text-[10px] uppercase tracking-widest px-4" onClick={() => router.push(getTenantPath(subdomain as string, "/sections"))}>Exit Editor</Button>
               <Button variant="outline" size="sm" className="bg-white/5 border-white/10 rounded-lg text-white font-bold text-[10px] uppercase tracking-widest" onClick={() => setIsPreviewOpen(true)}><Eye className="w-3.5 h-3.5 mr-1.5" /> Live Preview</Button>
            </div>
         </header>

         <div className="flex-1 overflow-y-auto p-4 sm:p-10 flex justify-center items-start" onClick={() => setSelectedBlockId(null)}>
            <div 
               className={cn(
                  "transition-all duration-700 shadow-2xl relative min-h-[90vh]",
                  viewMode === 'mobile' ? "w-[375px] rounded-[48px] border-[12px] border-slate-900 ring-[16px] ring-white/5" : "w-full max-w-5xl rounded-3xl"
               )}
               style={getBackgroundStyles()}
            >
               {getTextureOverlay()}
               <div className="py-0 relative z-10">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                     <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                        {blocks.map(block => (
                           <CanvasBlockWrapper 
                              key={block.id} 
                              block={block} 
                              products={products} 
                              store={store} 
                              isSelected={selectedBlockId === block.id}
                              onSelect={(id: string) => { setSelectedBlockId(id); setSidebarTab("edit"); }}
                              onRemove={removeBlock}
                              onMoveUp={() => moveBlock(block.id, 'up')}
                              onMoveDown={() => moveBlock(block.id, 'down')}
                              onInsertRequest={(id: string, pos: 'before' | 'after') => { setInsertInfo({ id, position: pos }); setIsComponentDialogOpen(true); }}
                              viewMode={viewMode}
                              pageStyle={pageStyle}
                              isBuilder
                              onAddNested={handleAddNested}
                           />
                        ))}
                     </SortableContext>
                  </DndContext>

                  <div className="flex justify-center py-12 border-t border-dashed border-slate-100/10 mt-8">
                     <Dialog open={isComponentDialogOpen} onOpenChange={setIsComponentDialogOpen}>
                        <DialogTrigger asChild>
                           <Button variant="outline" className="h-14 w-14 rounded-full border-2 border-indigo-600/20 text-indigo-600 shadow-2xl hover:scale-110 active:scale-95 bg-white"><Plus className="w-8 h-8" /></Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl rounded-[40px] p-0 border-none overflow-hidden bg-slate-950 shadow-2xl text-slate-100">
                           <DialogHeader className="p-8 bg-indigo-600 text-white">
                              <DialogTitle className="text-2xl font-headline font-black uppercase tracking-tight">Section Repository</DialogTitle>
                              <DialogDescription className="text-indigo-100 font-bold text-xs uppercase tracking-widest opacity-80">Select a high-conversion component to insert into your landing page.</DialogDescription>
                           </DialogHeader>
                           <div className="p-8 grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
                              <SectionSelectorCard 
                                icon={Menu} 
                                label="Universal Navbar" 
                                description="Global navigation with custom logo and CTA link."
                                onClick={() => handleAddBlock("navbar")} 
                                highlight 
                              />
                              <SectionSelectorCard 
                                icon={Rocket} 
                                label="Ultra-Hero" 
                                description="Deep-green high-conversion hero with Bengali trust badges."
                                onClick={() => handleAddBlock("ultra-hero")} 
                                highlight 
                              />
                              <SectionSelectorCard 
                                icon={ShoppingCart} 
                                label="Order Form" 
                                description="Direct checkout console with shipping and payment selectors."
                                onClick={() => handleAddBlock("product-order-form")} 
                                highlight 
                              />
                              <SectionSelectorCard 
                                icon={Zap} 
                                label="Trust Marquee" 
                                description="Auto-scrolling banner for delivery alerts and benefits."
                                onClick={() => handleAddBlock("marquee")} 
                              />
                              <SectionSelectorCard 
                                icon={LayoutGrid} 
                                label="Benefit Card" 
                                description="Horizontal or vertical feature cards with icons."
                                onClick={() => handleAddBlock("card")} 
                              />
                              <SectionSelectorCard 
                                icon={Type} 
                                label="Rich Heading" 
                                description="Animated highlights and custom background pill styles."
                                onClick={() => handleAddBlock("header")} 
                              />
                              <SectionSelectorCard 
                                icon={CheckCircle} 
                                label="Checked List" 
                                description="Bullet points for ingredients or guarantee items."
                                onClick={() => handleAddBlock("checked-list")} 
                              />
                              <SectionSelectorCard 
                                icon={PlayCircle} 
                                label="Video Player" 
                                description="Embedded YouTube or Vimeo player in a premium frame."
                                onClick={() => handleAddBlock("video")} 
                              />
                              <SectionSelectorCard 
                                icon={List} 
                                label="Accordion / FAQ" 
                                description="Expandable rows for FAQs or detailed lists."
                                onClick={() => handleAddBlock("accordion")} 
                              />
                              <SectionSelectorCard 
                                icon={Columns} 
                                label="Grid Layout" 
                                description="Multi-column container for complex side-by-side components."
                                onClick={() => handleAddBlock("row")} 
                              />
                              <SectionSelectorCard 
                                icon={Code} 
                                label="Custom Code" 
                                description="Inject HTML/JS or tracking pixels into your page."
                                onClick={() => handleAddBlock("code")} 
                              />
                              <SectionSelectorCard 
                                icon={ShieldCheck} 
                                label="Brand Footer" 
                                description="Contact info, address, and legal document links."
                                onClick={() => handleAddBlock("footer")} 
                              />
                           </div>
                        </DialogContent>
                     </Dialog>
                  </div>
               </div>
            </div>
         </div>
      </SidebarInset>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
         <DialogContent className="max-w-[100vw] w-full h-[100vh] p-0 bg-slate-100 flex flex-col border-none">
            <header className="h-16 bg-white border-b px-8 flex items-center justify-between shrink-0">
               <h2 className="font-headline font-black uppercase text-sm tracking-widest">Production Environment Preview</h2>
               <Button variant="ghost" size="icon" onClick={() => setIsPreviewOpen(false)}><X className="w-6 h-6" /></Button>
            </header>
            <div className="flex-1 overflow-y-auto flex justify-center p-4 sm:p-10">
               <div 
                  className={cn("bg-white shadow-2xl min-h-full", viewMode === 'mobile' ? "w-[375px] rounded-[48px] border-[12px] border-slate-900" : "w-full max-w-5xl rounded-3xl")}
                  style={getBackgroundStyles()}
               >
                  {getTextureOverlay()}
                  <div className="relative z-10">
                    {blocks.map(block => <BlockRenderer key={block.id} block={block} products={products} store={store} isPreview viewMode={viewMode} pageStyle={pageStyle} />)}
                  </div>
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionSelectorCard({ icon: Icon, label, description, onClick, highlight = false }: { icon: any; label: string; description: string; onClick: () => void; highlight?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col text-left p-6 rounded-[24px] border-2 transition-all group relative",
        highlight ? "border-indigo-600/20 shadow-sm" : "border-slate-100 hover:border-indigo-600/10"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm",
        highlight ? "bg-indigo-600 text-white" : "bg-indigo-600 text-white group-hover:text-white"
      )}>
        <Icon className="w-6 h-6" />
      </div>
      <h4 className={cn("font-bold text-sm mb-1 uppercase tracking-tight", highlight ? "text-white" : "text-slate-600")}>{label}</h4>
      <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{description}</p>
      {highlight && <Badge className="absolute top-4 right-4 bg-indigo-600 text-white border-none text-[7px] font-black uppercase h-4 px-1.5 rounded-full">Core</Badge>}
    </button>
  );
}
=======

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore } from "@/firebase/provider";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { Loader2, AlertCircle, Save, ArrowLeft, Plus, Smartphone, Monitor, Trash2, Layout, Settings, Sparkles, ChevronLeft, ChevronRight, Layers, Eye, Smartphone as MobileIcon, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getTenantPath } from "@/lib/utils";
import { BlockRenderer, CanvasBlockWrapper } from "../../builder/[pageId]/block-renderer";
import { PropertyEditor } from "../../builder/[pageId]/property-editor";
import { FloatingTextToolbar } from "../../builder/[pageId]/floating-toolbar";
import { Block, BlockType, PageStyle } from "../../builder/[pageId]/types";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { WidgetGridButton } from "../../builder/[pageId]/components";
import * as LucideIcons from "lucide-react";
import { Palette } from "lucide-react";

export default function SectionBuilderPage() {
  const { subdomain, pageId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageData, setPageData] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [config, setConfig] = useState<Block[]>([]);
  const [pageStyle, setPageStyle] = useState<PageStyle>({ backgroundColor: "#FFFFFF" });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [isWidgetDialogOpen, setIsWidgetDialogOpen] = useState(false);
  const [isPageSettingsOpen, setIsPageSettingsOpen] = useState(false);
  const [insertTarget, setInsertTarget] = useState<{ id?: string, position?: "before" | "after", parentId?: string, colIdx?: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  // Mobile responsiveness: check for screen size and close sidebar
  useEffect(() => {
    const checkScreen = () => {
      const isMobile = window.innerWidth < 1024;
      setIsMobileScreen(isMobile);
      if (isMobile) setSidebarOpen(false);
    };
    
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (firestore && subdomain && pageId) {
      fetchData();
    }

    const handleFormatCanvas = (e: any) => {
      const { blockId, selectedText, format, value } = e.detail;
      
      setConfig(prev => {
        if (!prev) return prev;
        const newBlocks = prev.map((b: any) => {
          if (b.id === blockId) {
            const newContent = { ...b.content };
            let replaced = false;
            
            const formattedText = format === "remove" ? selectedText : (value ? `[${format}=${value}:${selectedText}]` : `[${format}:${selectedText}]`);

            // If we are removing formatting, we need to find the existing tag and strip it.
            // But since the DOM selection gives us the raw text, the text in the string might already have tags!
            // Wait, if it's "remove", we just remove tags around the selected text.
            // A simple naive approach: if we find `[tag:selectedText]`, replace it with `selectedText`.
            const regex = new RegExp(`\\[[a-zA-Z0-9-]+(?:=[^\\]:]+)?:(${selectedText.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&')})\\]`, 'g');

            // Try to find the text in common string fields
            for (const key in newContent) {
              if (typeof newContent[key] === 'string') {
                if (format === "remove" && regex.test(newContent[key])) {
                  newContent[key] = newContent[key].replace(regex, '$1');
                  replaced = true;
                  break;
                } else if (format !== "remove" && newContent[key].includes(selectedText)) {
                  newContent[key] = newContent[key].replace(selectedText, formattedText);
                  replaced = true;
                  break;
                }
              }
            }
            
            // Look deeply if not found in root string properties
            if (!replaced && Array.isArray(newContent.items)) {
              newContent.items = newContent.items.map((item: any) => {
                if (typeof item === 'string' && item.includes(selectedText)) {
                  replaced = true;
                  return item.replace(selectedText, formattedText);
                } else if (typeof item === 'object') {
                  const newItem = { ...item };
                  for (const k in newItem) {
                    if (typeof newItem[k] === 'string' && newItem[k].includes(selectedText)) {
                      newItem[k] = newItem[k].replace(selectedText, formattedText);
                      replaced = true;
                      break;
                    }
                  }
                  return newItem;
                }
                return item;
              });
            }

            if (replaced) {
              return { ...b, content: newContent };
            }
          }
          return b;
        });
        return newBlocks;
      });
    };

    document.addEventListener("format-canvas-text", handleFormatCanvas);
    return () => document.removeEventListener("format-canvas-text", handleFormatCanvas);
  }, [subdomain, pageId, firestore]);

  const fetchData = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      // Fetch Page
      const pageRef = doc(firestore, "pages", pageId as string);
      const pageSnap = await getDoc(pageRef);

      if (pageSnap.exists()) {
        const data = pageSnap.data();
        setPageData({ id: pageSnap.id, ...data });
        setConfig(data.config || []);
        setPageStyle(data.pageStyle || { backgroundColor: "#FFFFFF" });

        // Fetch Store
        const storeQ = query(collection(firestore, "stores"), where("subdomain", "==", subdomain));
        const storeSnap = await getDocs(storeQ);
        if (!storeSnap.empty) {
          const storeData = { id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() };
          setStore(storeData);

          // Fetch Products
          const prodQ = query(collection(firestore, "products"), where("storeId", "==", storeData.id));
          const prodSnap = await getDocs(prodQ);
          setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } else {
        toast({ variant: "destructive", title: "Page not found" });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!firestore || !pageId) return;
    setSaving(true);
    try {
      // Firebase does not allow 'undefined' values. 
      // This strips them out while preserving the data structure.
      const sanitizedConfig = JSON.parse(JSON.stringify(config));
      const sanitizedPageStyle = JSON.parse(JSON.stringify(pageStyle));

      await updateDoc(doc(firestore, "pages", pageId as string), {
        config: sanitizedConfig,
        pageStyle: sanitizedPageStyle,
        editorType: "internal", // Mark as internal editor
        updatedAt: serverTimestamp()
      });
      toast({ title: "Page Saved", description: "Your changes are now live." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setConfig((prev) => {
      let activeItem: any = null;
      let activeParentId: string | null = null;
      let overItem: any = null;
      let overParentId: string | null = null;

      // Helper to find items
      const findItem = (items: any[], parentId: string | null = null) => {
        for (const item of items) {
          if (item.id === active.id) { activeItem = item; activeParentId = parentId; }
          if (item.id === over.id) { overItem = item; overParentId = parentId; }
          if (item.children) findItem(item.children, item.id);
        }
      };
      findItem(prev);

      if (!activeItem || !overItem) return prev;

      // If they are in the same container (same parent)
      if (activeParentId === overParentId) {
        if (activeParentId === null) {
          // Top level
          const oldIndex = prev.findIndex((i) => i.id === active.id);
          const newIndex = prev.findIndex((i) => i.id === over.id);
          return arrayMove(prev, oldIndex, newIndex);
        } else {
          // Nested level
          return prev.map(block => {
            if (block.id === activeParentId) {
              const children = [...(block.children || [])];
              const oldIndex = children.findIndex((i: any) => i.id === active.id);
              const newIndex = children.findIndex((i: any) => i.id === over.id);
              const movedChildren = arrayMove(children, oldIndex, newIndex);
              // ensure the colIdx matches if they dropped it on an item in a different column?
              // wait, if we arrayMove, we just reorder. 
              // If we want to change colIdx, we need to inherit the overItem's colIdx.
              movedChildren[newIndex] = { 
                ...movedChildren[newIndex], 
                colIdx: overItem.colIdx ?? movedChildren[newIndex].colIdx,
                style: { ...movedChildren[newIndex].style, columnIndex: overItem.style?.columnIndex ?? movedChildren[newIndex].style?.columnIndex }
              };
              return { ...block, children: movedChildren };
            }
            return block;
          });
        }
      } else {
        // Moving between different containers (e.g. from one column to another, or root to column)
        // For now, we simply remove from old parent and insert into new parent.
        const newConfig = JSON.parse(JSON.stringify(prev)); // deep copy
        
        // Remove from old
        let itemToMove = null;
        if (activeParentId === null) {
          const idx = newConfig.findIndex((i: any) => i.id === active.id);
          itemToMove = newConfig.splice(idx, 1)[0];
        } else {
          const parent = newConfig.find((b: any) => b.id === activeParentId);
          if (parent && parent.children) {
            const idx = parent.children.findIndex((i: any) => i.id === active.id);
            itemToMove = parent.children.splice(idx, 1)[0];
          }
        }

        if (!itemToMove) return prev;

        // Insert into new
        if (overParentId === null) {
          const idx = newConfig.findIndex((i: any) => i.id === over.id);
          newConfig.splice(idx, 0, itemToMove);
        } else {
          const parent = newConfig.find((b: any) => b.id === overParentId);
          if (parent && parent.children) {
            const idx = parent.children.findIndex((i: any) => i.id === over.id);
            // Inherit colIdx from overItem
            itemToMove.colIdx = overItem.colIdx;
            if (itemToMove.style) itemToMove.style.columnIndex = overItem.style?.columnIndex;
            parent.children.splice(idx, 0, itemToMove);
          }
        }
        return newConfig;
      }
    });
  };

  const updateBlock = (id: string, updates: any) => {
    setConfig(prev => {
      const deepUpdate = (items: Block[]): Block[] => {
        return items.map(item => {
          if (item.id === id) {
            return {
              ...item,
              content: updates.content ? { ...item.content, ...updates.content } : item.content,
              style: updates.style ? { ...item.style, ...updates.style } : item.style,
            };
          }
          if (item.children) {
            return { ...item, children: deepUpdate(item.children) };
          }
          return item;
        });
      };
      return deepUpdate(prev);
    });
  };

  const addBlock = (type: BlockType, target?: any) => {
    const newBlock: any = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: getDefaultContent(type),
      style: type === "row" ? getDefaultStyle(type) : { ...getDefaultStyle(type), columnIndex: target?.colIdx ?? 0 },
      children: type === "row" ? [] : undefined,
      colIdx: target?.colIdx ?? 0
    };

    if (target?.parentId) {
      setConfig(prev => {
        const deepAdd = (items: Block[]): Block[] => {
          return items.map(item => {
            if (item.id === target.parentId) {
              return { ...item, children: [...(item.children || []), newBlock] };
            }
            if (item.children) {
              return { ...item, children: deepAdd(item.children) };
            }
            return item;
          });
        };
        return deepAdd(prev);
      });
    } else if (target?.id) {
      const index = config.findIndex(b => b.id === target.id);
      const newConfig = [...config];
      newConfig.splice(target.position === "after" ? index + 1 : index, 0, newBlock);
      setConfig(newConfig);
    } else {
      setConfig([...config, newBlock]);
    }
    setSelectedBlockId(newBlock.id);
    setIsWidgetDialogOpen(false);
    setInsertTarget(null);
  };

  const removeBlock = (id: string) => {
    const filterBlocks = (items: Block[]): Block[] => {
      return items.filter(i => i.id !== id).map(i => i.children ? { ...i, children: filterBlocks(i.children) } : i);
    };
    setConfig(filterBlocks(config));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    const index = config.findIndex(b => b.id === id);
    if (index === -1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= config.length) return;
    setConfig(arrayMove(config, index, newIndex));
  };

  const onAddNested = (parentId: string, colIdx?: number) => {
    setInsertTarget({ parentId, colIdx });
    setIsWidgetDialogOpen(true);
  };

  const getDefaultContent = (type: BlockType) => {
    switch (type) {
      case "header": return { text: "New Headline", level: "h2" };
      case "paragraph": return { text: "Your content goes here..." };
      case "button": return { text: "Click Me", link: "#" };
      case "ultra-hero": return { title: "Main Headline", subtitle: "Compelling subtitle", ctaText: "Order Now", badgeText: "PREMIUM QUALITY" };
      case "marquee": return { items: ["Fast Delivery", "Secure Payment", "24/7 Support"] };
      case "navbar": return { logoText: "BRAND", items: [{ id: "1", label: "Home", link: "/" }], showLogo: true };
      case "card": return { title: "Feature Title", subtitle: "Description...", items: ["Point 1", "Point 2"], showIcon: true, iconName: "Star" };
      case "row": return { columns: 2 };
      case "carousel": return { 
        type: "image",
        items: [
          { id: "1", type: "image", header: "Explore Our Quality", paragraph: "Premium ingredients sourced locally.", buttonLabel: "Shop Now" },
          { id: "2", type: "image", header: "Fast Delivery", paragraph: "Get your orders within 24 hours.", buttonLabel: "Learn More" }
        ],
        settings: { showArrows: true, loop: true, autoplay: false, desktopItems: 1, gap: 16 }
      };
      case "package-card": return {
        packages: [
          { id: "1", header: "Starter", subtitle: "Best for individuals", price: "$19", buttonLabel: "Join Now", texture: "dots" },
          { id: "2", header: "Business", subtitle: "Powering small teams", price: "$49", buttonLabel: "Scale Up", texture: "grid", isFeatured: true },
          { id: "3", header: "Enterprise", subtitle: "Unlimited scale", price: "$99", buttonLabel: "Contact Us", texture: "diagonal" }
        ],
        settings: { desktopColumns: 3, gap: 20 }
      };
      case "score-cards": return {
        items: [
          { label: "Performance", score: 90, color: "#22c55e" },
          { label: "Accessibility", score: 85, color: "#3b82f6" },
          { label: "Best Practices", score: 95, color: "#a855f7" },
          { label: "SEO", score: 100, color: "#f97316" }
        ]
      };
      default: return {};
    }
  };

  const getDefaultStyle = (type: BlockType) => {
    const base = { paddingTop: 20, paddingBottom: 20, textAlign: "left" as const };
    if (type === "header") return { ...base, fontSize: 32, fontWeight: "bold" };
    if (type === "ultra-hero") return { ...base, paddingTop: 60, paddingBottom: 60 };
    return base;
  };

  const selectedBlock = (() => {
    const findBlock = (items: Block[]): Block | null => {
      for (const item of items) {
        if (item.id === selectedBlockId) return item;
        if (item.children) {
          const found = findBlock(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findBlock(config);
  })();

  if (isMobileScreen) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-[9999] flex flex-col items-center justify-center p-8 text-center space-y-6 overflow-hidden">
        <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 animate-pulse border border-indigo-500/20">
          <Monitor className="w-12 h-12" />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Desktop Required</h1>
          <p className="text-slate-400 text-sm max-w-[280px] font-medium leading-relaxed">You need a desktop screen to edit landing pages. Please switch to a larger device to continue building.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push(getTenantPath(subdomain as string, "/"))}
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all rounded-full px-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Return to Store
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-indigo-500 w-12 h-12 mx-auto" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Initializing Studio...</p>
        </div>
      </div>
    );
  }


  const renderSidebar = () => (
    <div className={cn(
      "w-80 border-r border-slate-200 bg-slate-50 flex flex-col shadow-sm z-50 transition-all duration-300 h-full",
      !sidebarOpen && "w-0 -ml-80 overflow-hidden lg:ml-0 lg:w-80"
    )}>
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Layout className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-headline font-black uppercase text-xs tracking-tighter text-slate-900">Visual Studio</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4 text-slate-500" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100" onClick={() => router.push(getTenantPath(subdomain as string, "/sections"))}>
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
        {selectedBlock ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest mb-1">Editing Component</p>
                <h3 className="text-sm font-bold capitalize text-slate-800">{selectedBlock.type}</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-500/10" onClick={() => removeBlock(selectedBlock.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <PropertyEditor
              block={selectedBlock}
              products={products}
              config={config}
              onChange={(updates) => updateBlock(selectedBlock.id, updates)}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-40">
            <div className="w-16 h-16 rounded-3xl bg-slate-200 flex items-center justify-center border border-slate-300">
              <Settings className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500">Selection Idle</p>
              <p className="text-xs text-slate-400 font-medium text-balance">Select a section on the canvas to configure its properties.</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-white shrink-0">
        <Button
          className="w-full h-12 rounded-xl font-black uppercase text-xs tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />}
          Commit Changes
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden text-slate-900">
      <FloatingTextToolbar />
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[45] lg:hidden animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Properties */}
      {renderSidebar()}

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative bg-slate-100 h-full overflow-hidden">
        {/* Top Bar */}
        <div className="h-14 border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 bg-white/80 backdrop-blur-md sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl lg:hidden hover:bg-slate-100" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="w-5 h-5 text-slate-600" />
            </Button>
            <div className="hidden sm:flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 rounded-lg text-[10px] font-bold uppercase px-3", viewMode === "desktop" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
                onClick={() => setViewMode("desktop")}
              >
                <Monitor className="w-3.5 h-3.5 mr-2" /> Desktop
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 rounded-lg text-[10px] font-bold uppercase px-3", viewMode === "mobile" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
                onClick={() => setViewMode("mobile")}
              >
                <Smartphone className="w-3.5 h-3.5 mr-2" /> Mobile
              </Button>
            </div>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[120px] sm:max-w-[200px]">
              {pageData?.title}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Page Settings Dialog */}
            <Dialog open={isPageSettingsOpen} onOpenChange={setIsPageSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-9 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-700 px-3">
                  <Palette className="w-3.5 h-3.5 sm:mr-2" /> <span className="hidden sm:inline">Page Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white border-slate-200 rounded-[32px] text-slate-900 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 pb-0">
                  <DialogTitle className="text-xl font-headline font-black uppercase italic text-slate-900">Page Global Design</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold text-slate-900">Sticky Navbar</Label>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Global header visibility</p>
                    </div>
                    <Switch checked={pageStyle.showNavbar !== false} onCheckedChange={(val) => setPageStyle(prev => ({ ...prev, showNavbar: val }))} />
                  </div>

                  {pageStyle.showNavbar !== false && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo Configuration</Label>
                        <div className="flex gap-2">
                          <Input placeholder="Logo Text" value={pageStyle.navbarSettings?.logoText || ""} onChange={(e) => setPageStyle(prev => ({ ...prev, navbarSettings: { ...prev.navbarSettings, logoText: e.target.value } }))} className="h-9 bg-white text-xs rounded-xl" />
                          <CloudinaryUpload value={pageStyle.navbarSettings?.logoUrl || ""} onUpload={(url) => setPageStyle(prev => ({ ...prev, navbarSettings: { ...prev.navbarSettings, logoUrl: url } }))} onRemove={() => setPageStyle(prev => ({ ...prev, navbarSettings: { ...prev.navbarSettings, logoUrl: "" } }))} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Button (CTA)</Label>
                        <div className="flex gap-2">
                          <Input placeholder="Button Text" value={pageStyle.navbarSettings?.ctaText || ""} onChange={(e) => setPageStyle(prev => ({ ...prev, navbarSettings: { ...prev.navbarSettings, ctaText: e.target.value } }))} className="h-9 bg-white text-xs rounded-xl" />
                          <Input placeholder="Link (#)" value={pageStyle.navbarSettings?.ctaLink || ""} onChange={(e) => setPageStyle(prev => ({ ...prev, navbarSettings: { ...prev.navbarSettings, ctaLink: e.target.value } }))} className="h-9 bg-white text-xs rounded-xl" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold text-slate-900">Page Footer</Label>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Global footer visibility</p>
                    </div>
                    <Switch checked={pageStyle.showFooter !== false} onCheckedChange={(val) => setPageStyle(prev => ({ ...prev, showFooter: val }))} />
                  </div>

                  {pageStyle.showFooter !== false && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Footer Content</Label>
                        <Input placeholder="Copyright Text" value={pageStyle.footerSettings?.copyright || ""} onChange={(e) => setPageStyle(prev => ({ ...prev, footerSettings: { ...prev.footerSettings, copyright: e.target.value } }))} className="h-9 bg-white text-xs rounded-xl" />
                        <Input placeholder="Footer Info Text" value={pageStyle.footerSettings?.text || ""} onChange={(e) => setPageStyle(prev => ({ ...prev, footerSettings: { ...prev.footerSettings, text: e.target.value } }))} className="h-9 bg-white text-xs rounded-xl" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Canvas BG</Label>
                        <Input type="color" value={pageStyle.backgroundColor || "#FFFFFF"} onChange={(e) => setPageStyle(prev => ({ ...prev, backgroundColor: e.target.value }))} className="h-10 p-1 bg-slate-50 border-slate-200 rounded-xl cursor-pointer" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Texture</Label>
                        <Select value={pageStyle.backgroundTexture || "none"} onValueChange={(val) => setPageStyle(prev => ({ ...prev, backgroundTexture: val }))}>
                          <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="dots">Dots</SelectItem>
                            <SelectItem value="grid">Grid</SelectItem>
                            <SelectItem value="diagonal">Diagonal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Background Image</Label>
                      <CloudinaryUpload value={pageStyle.backgroundImage || ""} onUpload={(url) => setPageStyle(prev => ({ ...prev, backgroundImage: url }))} onRemove={() => setPageStyle(prev => ({ ...prev, backgroundImage: "" }))} />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="space-y-1 mb-4">
                      <Label className="text-xs font-bold text-slate-900">SEO Meta Data</Label>
                      <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Search engine & social sharing preview</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta Title</Label>
                        <Input placeholder="Page Title (60 chars max)" value={pageStyle.seoSettings?.title || ""} onChange={(e) => setPageStyle(prev => ({ ...prev, seoSettings: { ...prev.seoSettings, title: e.target.value } }))} className="h-9 bg-slate-50 text-xs rounded-xl" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta Description</Label>
                        <Input placeholder="Brief description of the page..." value={pageStyle.seoSettings?.description || ""} onChange={(e) => setPageStyle(prev => ({ ...prev, seoSettings: { ...prev.seoSettings, description: e.target.value } }))} className="h-9 bg-slate-50 text-xs rounded-xl" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Keywords</Label>
                        <Input placeholder="comma, separated, keywords" value={pageStyle.seoSettings?.keywords || ""} onChange={(e) => setPageStyle(prev => ({ ...prev, seoSettings: { ...prev.seoSettings, keywords: e.target.value } }))} className="h-9 bg-slate-50 text-xs rounded-xl" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Social Share Image (OG:Image)</Label>
                        <CloudinaryUpload value={pageStyle.seoSettings?.ogImage || ""} onUpload={(url) => setPageStyle(prev => ({ ...prev, seoSettings: { ...prev.seoSettings, ogImage: url } }))} onRemove={() => setPageStyle(prev => ({ ...prev, seoSettings: { ...prev.seoSettings, ogImage: "" } }))} />
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isWidgetDialogOpen} onOpenChange={setIsWidgetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-9 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-700 px-3">
                  <Plus className="w-3.5 h-3.5 sm:mr-2" /> <span className="hidden sm:inline">Add Section</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white border-slate-200 rounded-[32px] text-slate-900 p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl sm:text-2xl font-headline font-black uppercase italic text-slate-900 text-center sm:text-left">Add Global Widget</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 py-4 sm:py-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                  <WidgetGridButton icon={LucideIcons.Layout} label="Hero" onClick={() => addBlock("ultra-hero", insertTarget || undefined)} highlight />
                  <WidgetGridButton icon={LucideIcons.Type} label="Headline" onClick={() => addBlock("header", insertTarget || undefined)} />
                  <WidgetGridButton icon={LucideIcons.AlignLeft} label="Paragraph" onClick={() => addBlock("paragraph", insertTarget || undefined)} />
                  <WidgetGridButton icon={LucideIcons.Columns} label="Layout Row" onClick={() => addBlock("row", insertTarget || undefined)} />
                  <WidgetGridButton icon={LucideIcons.CreditCard} label="Order Form" onClick={() => addBlock("product-order-form", insertTarget || undefined)} />
                  <WidgetGridButton icon={LucideIcons.Box} label="Feature Card" onClick={() => addBlock("card", insertTarget || undefined)} />
                  <WidgetGridButton icon={LucideIcons.Zap} label="Marquee" onClick={() => addBlock("marquee", insertTarget || undefined)} />
                  <WidgetGridButton icon={LucideIcons.List} label="Accordion" onClick={() => addBlock("accordion", insertTarget || undefined)} />
                  <WidgetGridButton icon={LucideIcons.Play} label="Video" onClick={() => addBlock("video", insertTarget || undefined)} />
                  <WidgetGridButton icon={LucideIcons.Image} label="Image" onClick={() => addBlock("image", insertTarget || undefined)} />
                  <WidgetGridButton icon={LucideIcons.MousePointer2} label="Button" onClick={() => addBlock("button", insertTarget || undefined)} />
                  <WidgetGridButton icon={LucideIcons.ListFilter} label="Selector" onClick={() => addBlock("selector", insertTarget || undefined)} />
                  <WidgetGridButton icon={LucideIcons.LayoutList} label="Carousel" onClick={() => addBlock("carousel", insertTarget || undefined)} highlight />
                  <WidgetGridButton icon={LucideIcons.Package} label="Packages" onClick={() => addBlock("package-card", insertTarget || undefined)} highlight />
                  <WidgetGridButton icon={LucideIcons.Activity} label="Scores" onClick={() => addBlock("score-cards", insertTarget || undefined)} />
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-500" asChild>
              <a href={getTenantPath(subdomain as string, `/p/${pageData?.slug}`)} target="_blank">
                <Eye className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-slate-50 flex justify-center items-start">
          <div
            className={cn(
              "bg-white shadow-[0_0_100px_rgba(0,0,0,0.05)] transition-all duration-500 relative origin-top",
              viewMode === "mobile" ? "w-[375px] min-h-[667px] rounded-[40px] border-[12px] border-slate-800" : "w-full max-w-6xl min-h-full rounded-2xl",
              pageStyle.backgroundTexture === 'dots' && "bg-dot-pattern",
              pageStyle.backgroundTexture === 'grid' && "bg-grid-pattern",
              pageStyle.backgroundTexture === 'diagonal' && "bg-diagonal-pattern"
            )}
            style={{
              backgroundColor: pageStyle.backgroundColor || "#FFFFFF",
              backgroundImage: pageStyle.backgroundImage ? `url(${pageStyle.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Global Navbar */}
            {pageStyle.showNavbar !== false && (
              <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {pageStyle.navbarSettings?.logoUrl ? (
                    <img src={pageStyle.navbarSettings.logoUrl} className="h-8 w-auto" />
                  ) : (
                    <span className="font-black text-xl tracking-tighter uppercase italic text-slate-900">{pageStyle.navbarSettings?.logoText || (store?.name || "BRAND")}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {pageStyle.navbarSettings?.ctaText && (
                    <Button className="h-10 rounded-full px-6 font-bold text-xs bg-slate-900 hover:bg-primary transition-all">
                      {pageStyle.navbarSettings.ctaText}
                    </Button>
                  )}
                </div>
              </nav>
            )}

            {viewMode === "mobile" && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-700" />
                <div className="w-12 h-1 rounded-full bg-slate-700" />
              </div>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={config.map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="min-h-full pb-32">
                  {config.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-48 text-slate-300 opacity-20">
                      <Plus className="w-12 h-12 mb-4" />
                      <p className="font-black uppercase tracking-widest text-sm">Empty Architecture</p>
                    </div>
                  ) : (
                    config.map((block) => (
                      <CanvasBlockWrapper
                        key={block.id}
                        block={block}
                        products={products}
                        store={store}
                        isSelected={selectedBlockId === block.id}
                        isMobile={viewMode === "mobile"}
                        onSelect={setSelectedBlockId}
                        onRemove={removeBlock}
                        onMoveUp={(id) => moveBlock(id, "up")}
                        onMoveDown={(id) => moveBlock(id, "down")}
                        onInsertRequest={(id, position) => {
                          setInsertTarget({ id, position });
                          setIsWidgetDialogOpen(true);
                        }}
                        onAddNested={onAddNested}
                        viewMode={viewMode}
                        isBuilder={true}
                        pageStyle={pageStyle}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>

            {/* Global Footer */}
            {pageStyle.showFooter !== false && (
              <footer className="border-t border-slate-100 p-12 bg-white/50 backdrop-blur-sm mt-32">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                  <h3 className="font-headline font-black text-2xl uppercase italic text-slate-900">{pageStyle.navbarSettings?.logoText || store?.name}</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto">{pageStyle.footerSettings?.text || "Creating amazing experiences."}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-4">{pageStyle.footerSettings?.copyright || `© ${new Date().getFullYear()} All rights reserved.`}</p>
                </div>
              </footer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
>>>>>>> bfa58f5699b72caf9444a186786e1692d2b46c58
