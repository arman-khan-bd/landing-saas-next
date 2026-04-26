
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, doc, updateDoc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
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
  const firestore = useFirestore();
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
    if (firestore && subdomain && pageId) {
      fetchPageData();
    }
  }, [subdomain, pageId, firestore]);

  const fetchPageData = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const storeQ = query(collection(firestore, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQ);
      if (storeSnap.empty) {
        setLoading(false);
        return;
      }
      const storeData = { id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() };
      setStore(storeData);

      const pageRef = doc(firestore, "pages", pageId as string);
      const pageSnap = await getDoc(pageRef);

      if (pageSnap.exists()) {
        const data = pageSnap.data();
        setPageData(data);
        setBlocks(data.config || []);
        if (data.pageStyle) {
          setPageStyle({
            backgroundTexture: "none",
            backgroundOpacity: 100,
            backgroundSize: "cover",
            ...data.pageStyle
          });
        }
      } else {
        toast({ variant: "destructive", title: "Page not found" });
        router.back();
      }

      const prodQ = query(collection(firestore, "products"), where("storeId", "==", storeData.id));
      const prodSnap = await getDocs(prodQ);
      setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateBlock = (id: string, updates: any) => {
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

  const handleSave = () => {
    if (!pageId || !firestore) return;
    setSaving(true);
    const pageRef = doc(firestore, "pages", pageId as string);
    
    const sanitizedBlocks = sanitizeForFirestore(blocks);
    const sanitizedPageStyle = sanitizeForFirestore(pageStyle);

    updateDoc(pageRef, { 
      config: sanitizedBlocks, 
      pageStyle: sanitizedPageStyle,
      updatedAt: serverTimestamp() 
    })
      .then(() => {
        toast({ title: "Design Saved!", description: "High-conversion matrix is updated." });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: pageRef.path,
          operation: 'update',
          requestResourceData: { config: sanitizedBlocks, pageStyle: sanitizedPageStyle },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setSaving(false));
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
                           <div className="space-y-1">
                              <Label className="text-[9px] uppercase font-bold text-white/40">Border Color</Label>
                              <Input type="color" value={selectedBlock.style?.borderColor || "#000000"} onChange={(e) => updateBlock(selectedBlockId, { style: { borderColor: e.target.value } })} className="h-8 p-1 bg-black/20 border-none cursor-pointer" />
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
