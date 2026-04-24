"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import * as LucideIcons from "lucide-react";
import { 
  Plus, Save, Trash2, Image as ImageIcon,
  Type, Layout, List, CheckCircle, ShoppingCart,
  Loader2, Monitor, Smartphone,
  Square, Eye, X, Columns,
  ArrowLeft, Palette, Box, MousePointer2,
  Sparkles, PlusCircle, LayoutGrid,
  MoveVertical, ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon,
  Paintbrush, Layers,
  ChevronUp, ChevronDown as ChevronDownIcon, Truck, CreditCard,
  Star, Heart, Lightbulb, Info, Shield, Zap, Check
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
import { Slider } from "@/components/ui/slider";
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
import { cn } from "@/lib/utils";
import { Block, BlockType, PageStyle } from "./types";
import { PropertySection, WidgetGridButton, AlignButton } from "./components";
import { PropertyEditor } from "./property-editor";
import { BlockRenderer, CanvasBlockWrapper } from "./block-renderer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PageBuilder() {
  return (
    <SidebarProvider>
      <PageBuilderInner />
    </SidebarProvider>
  );
}

function PageBuilderInner() {
  const { subdomain, pageId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { setOpenMobile, isMobile } = useSidebar();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageTitle, setPageTitle] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [store, setStore] = useState<any>(null);
  const [pageStyle, setPageStyle] = useState<PageStyle>({
    backgroundColor: "#FFFFFF",
    backgroundImage: "",
    paddingTop: 40,
    paddingBottom: 40,
  });
  const [products, setProducts] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"edit" | "advanced">("edit");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isComponentDialogOpen, setIsComponentDialogOpen] = useState(false);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [activeColumnIndex, setActiveColumnIndex] = useState<number | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  // Insertion tracking
  const [insertInfo, setInsertInfo] = useState<{ id: string, position: 'before' | 'after' } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (firestore && pageId) {
      fetchPageData();
    }
  }, [pageId, firestore]);

  const fetchPageData = async () => {
    if (!firestore || !pageId) return;
    setLoading(true);
    try {
      const pageRef = doc(firestore, "pages", pageId as string);
      const pageSnap = await getDoc(pageRef);

      if (pageSnap.exists()) {
        const data = pageSnap.data();
        setBlocks(data.config || []);
        setPageTitle(data.title || "Untitled Page");
        if (data.pageStyle) {
          setPageStyle(data.pageStyle);
        }

        const storeQ = query(collection(firestore, "stores"), where("subdomain", "==", subdomain));
        const storeSnap = await getDocs(storeQ);
        if(!storeSnap.empty) {
            setStore({ id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() });
        }

        const prodQ = query(collection(firestore, "products"), where("storeId", "==", data.storeId));
        const prodSnap = await getDocs(prodQ);
        setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        toast({ variant: "destructive", title: "Page not found" });
        router.push(`/${subdomain}/builder`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const findBlockById = useCallback((items: Block[], id: string): Block | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findBlockById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const selectedBlock = useMemo(() => {
    if (!selectedBlockId) return null;
    return findBlockById(blocks, selectedBlockId);
  }, [selectedBlockId, blocks, findBlockById]);

  // Utility to check if a block is a child of a row
  const getParentBlock = useCallback((items: Block[], childId: string): Block | null => {
    for (const item of items) {
      if (item.children?.some(c => c.id === childId)) return item;
      if (item.children) {
        const found = getParentBlock(item.children, childId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const selectedBlockParent = useMemo(() => {
    if (!selectedBlockId) return null;
    return getParentBlock(blocks, selectedBlockId);
  }, [selectedBlockId, blocks, getParentBlock]);

  const createBlock = (type: BlockType): Block => {
    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: getInitialContent(type),
      style: {
        textAlign: "left",
        fontSize: 16,
        fontWeight: "400",
        borderStyle: "none",
        borderWidth: 0,
        borderRadius: 0,
        boxShadow: "none",
        animation: "none",
        hideDesktop: false,
        hideMobile: false,
        desktopColumns: type === "carousel" ? 3 : 1,
        columns: type === "row" ? 2 : 1,
        columnIndex: 0,
        columnSpan: 1
      },
      children: type === "row" ? [] : undefined
    };
  };

  const getInitialContent = (type: BlockType) => {
    switch (type) {
      case "header": return { text: "Section Heading", level: "h2" };
      case "paragraph": return { text: "Add your text content here..." };
      case "image": return { url: "" };
      case "accordion": return { items: [{ title: "Item 1", content: "Content 1" }] };
      case "button": return { text: "Click Here", link: "#" };
      case "product-order-form": return { productIds: [], mainProductId: "", shippingType: "free" };
      case "row": return { columns: 2 };
      case "carousel": return { items: [{ id: "1", title: "Slide 1", subtitle: "", imageUrl: "", buttonText: "" }], desktopColumns: 3 };
      case "checked-list": return { items: ["Fast Delivery", "Secure Payments", "Premium Quality"], listStyle: "check" };
      case "card": return { 
        title: "Feature Title", 
        subtitle: "A short description goes here.", 
        iconName: "Zap", 
        iconSize: 32, 
        iconColor: "#145DCC",
        items: ["Benefit One", "Benefit Two"],
        listStyle: "check",
        bgImage: ""
      };
      default: return {};
    }
  };

  const handleAddBlock = (type: BlockType) => {
    const newBlock = createBlock(type);
    
    if (activeColumnIndex !== null) {
      newBlock.style.columnIndex = activeColumnIndex;
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
      // Inherit the same column if inserted relative to a child
      newBlock.style.columnIndex = items[index].style.columnIndex;
      newItems.splice(position === 'before' ? index : index + 1, 0, newBlock);
      return newItems;
    }
    return items.map(item => {
      if (item.children) {
        return { ...item, children: insertBlockRecursively(item.children, relativeId, position, newBlock) };
      }
      return item;
    });
  };

  const addNestedBlock = (items: Block[], parentId: string, newBlock: Block): Block[] => {
    return items.map(item => {
      if (item.id === parentId) {
        return { ...item, children: [...(item.children || []), newBlock] };
      }
      if (item.children) {
        return { ...item, children: addNestedBlock(item.children, parentId, newBlock) };
      }
      return item;
    });
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

  const removeBlock = (id: string) => {
    if (selectedBlockId === id) setSelectedBlockId(null);
    setBlocks(prev => removeNestedBlock(prev, id));
  };

  const removeNestedBlock = (items: Block[], id: string): Block[] => {
    return items.filter(item => item.id !== id).map(item => ({
      ...item,
      children: item.children ? removeNestedBlock(item.children, id) : undefined
    }));
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const moveInArray = (arr: Block[]): Block[] => {
      const index = arr.findIndex(b => b.id === id);
      if (index !== -1) {
        const newArr = [...arr];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < newArr.length) {
          [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]];
        }
        return newArr;
      }
      return arr.map(b => b.children ? { ...b, children: moveInArray(b.children) } : b);
    };
    setBlocks(prev => moveInArray(prev));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over || active.id === over.id) return;

    const reorderRecursive = (items: Block[]): Block[] => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        return arrayMove(items, oldIndex, newIndex);
      }

      return items.map(item => {
        if (item.children && item.children.length > 0) {
          return { ...item, children: reorderRecursive(item.children) };
        }
        return item;
      });
    };

    setBlocks(prev => reorderRecursive(prev));
  };

  const handleSave = () => {
    if (!pageId || !firestore) return;
    setSaving(true);
    const pageRef = doc(firestore, "pages", pageId as string);
    
    const sanitizeForFirestore = (obj: any): any => {
      if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
      if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
          Object.entries(obj)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, sanitizeForFirestore(v)])
        );
      }
      return obj === undefined ? null : obj;
    };

    const sanitizedConfig = sanitizeForFirestore(blocks);
    const sanitizedStyle = sanitizeForFirestore(pageStyle);
    
    updateDoc(pageRef, { 
      config: sanitizedConfig, 
      pageStyle: sanitizedStyle,
      updatedAt: serverTimestamp() 
    })
      .then(() => {
        toast({ title: "Project Published!", description: "Changes are live on your store." });
      })
      .catch((error) => {
        console.error(error);
        toast({ variant: "destructive", title: "Save failed", description: "Database rejected the request." });
      })
      .finally(() => setSaving(false));
  };

  const onInsertRequest = (id: string, position: 'before' | 'after') => {
    setInsertInfo({ id, position });
    setActiveParentId(null);
    setActiveColumnIndex(null);
    setIsComponentDialogOpen(true);
  };

  const onAddNestedRequest = (parentId: string, colIdx?: number) => {
    setActiveParentId(parentId);
    setActiveColumnIndex(colIdx ?? null);
    setInsertInfo(null);
    setIsComponentDialogOpen(true);
  };

  const handleSelectBlock = (id: string) => {
    setSelectedBlockId(id);
    if (isMobile) setOpenMobile(true);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>;

  return (
    <div className="flex h-screen w-full bg-slate-50/50 overflow-hidden text-slate-800 select-none">
      
      {/* --- BRANDED SIDEBAR --- */}
      <Sidebar collapsible="offcanvas" className="border-r-0 bg-primary text-primary-foreground shadow-2xl">
        <SidebarHeader className="p-4 border-b border-white/10 bg-black/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="block font-headline font-bold text-white text-xs tracking-tight">Designer Pro</span>
                <span className="text-[8px] text-white/60 font-bold uppercase tracking-widest block">iHut Studio</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => router.push(`/${subdomain}/builder`)} className="h-8 w-8 rounded-full text-white/50 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0 bg-primary h-full">
          {selectedBlock ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-4 py-3 bg-black/20 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-headline font-bold text-[10px] uppercase tracking-wider text-white">Settings: {selectedBlock.type}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:text-red-400 hover:bg-red-400/10" onClick={() => removeBlock(selectedBlock.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <Tabs value={sidebarTab} onValueChange={(v: any) => setSidebarTab(v)} className="flex-1 flex flex-col min-h-0">
                <TabsList className="w-full bg-black/10 border-b border-white/10 rounded-none h-10 p-0 shrink-0">
                  <TabsTrigger value="edit" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent text-white/60 data-[state=active]:text-white font-bold text-[9px] uppercase tracking-widest h-full">Content</TabsTrigger>
                  <TabsTrigger value="advanced" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent text-white/60 data-[state=active]:text-white font-bold text-[9px] uppercase tracking-widest h-full">Appearance</TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-4 space-y-6 pb-20">
                    <TabsContent value="edit" className="mt-0 space-y-6">
                      <PropertySection label="Content config" icon={Box}>
                        <PropertyEditor block={selectedBlock} products={products} onChange={(u: any) => updateBlock(selectedBlock.id, u)} />
                      </PropertySection>
                    </TabsContent>

                    <TabsContent value="advanced" className="mt-0 space-y-6">
                       {selectedBlockParent?.type === "row" && (
                         <PropertySection label="Grid Placement" icon={Columns}>
                            <div className="space-y-4">
                               <div className="space-y-1">
                                  <Label className="text-[9px] uppercase font-bold text-white/60">Target Column</Label>
                                  <Select 
                                    value={(selectedBlock.style?.columnIndex ?? 0).toString()} 
                                    onValueChange={(v) => updateBlock(selectedBlock.id, { style: { columnIndex: Number(v) } })}
                                  >
                                     <SelectTrigger className="h-8 rounded-lg border-none bg-black/20 text-white text-[10px]">
                                        <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent>
                                        {Array.from({ length: selectedBlockParent.content?.columns || 1 }).map((_, i) => (
                                          <SelectItem key={i} value={i.toString()}>Column {i + 1}</SelectItem>
                                        ))}
                                     </SelectContent>
                                  </Select>
                               </div>
                               <div className="space-y-3">
                                  <div className="flex justify-between items-center text-[9px] font-bold text-white/70 uppercase">
                                    <Label>Column Span</Label>
                                    <span>{selectedBlock.style?.columnSpan || 1} cols</span>
                                  </div>
                                  <Slider value={[selectedBlock.style?.columnSpan || 1]} min={1} max={selectedBlockParent.content?.columns || 4} onValueChange={([v]) => updateBlock(selectedBlock.id, { style: { columnSpan: v } })} className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-primary" />
                               </div>
                            </div>
                         </PropertySection>
                       )}

                       <PropertySection label="Alignment & Text" icon={Type}>
                          <div className="space-y-4">
                            <div className="grid grid-cols-4 gap-1 bg-black/20 p-1 rounded-lg">
                              <AlignButton active={selectedBlock.style?.textAlign === "left"} icon={LucideIcons.AlignLeft} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "left" } })} />
                              <AlignButton active={selectedBlock.style?.textAlign === "center"} icon={LucideIcons.AlignCenter} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "center" } })} />
                              <AlignButton active={selectedBlock.style?.textAlign === "right"} icon={LucideIcons.AlignRight} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "right" } })} />
                              <AlignButton active={selectedBlock.style?.textAlign === "justify"} icon={LucideIcons.AlignJustify} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "justify" } })} />
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center text-[9px] font-bold text-white/70 uppercase">
                                <Label>Font Scale</Label>
                                <span>{selectedBlock.style?.fontSize || 16}px</span>
                              </div>
                              <Slider value={[selectedBlock.style?.fontSize || 16]} min={8} max={100} onValueChange={([v]) => updateBlock(selectedBlock.id, { style: { fontSize: v } })} className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-primary" />
                            </div>
                          </div>
                       </PropertySection>

                       <PropertySection label="Spacing (Padding & Margin)" icon={MoveVertical}>
                         <div className="space-y-4">
                           <div className="space-y-2">
                             <Label className="text-[9px] uppercase font-bold text-white/60">Padding (px)</Label>
                             <div className="grid grid-cols-2 gap-2">
                               <div className="flex items-center bg-black/20 rounded-lg px-2 py-1 gap-2">
                                 <ArrowUp className="w-2.5 h-2.5 text-white/40" />
                                 <Input type="number" placeholder="0" value={selectedBlock.style?.paddingTop ?? ""} onChange={(e) => updateBlock(selectedBlock.id, { style: { paddingTop: e.target.value === "" ? undefined : Number(e.target.value) } })} className="h-6 bg-transparent border-none p-0 text-[10px] text-white focus-visible:ring-0" />
                               </div>
                               <div className="flex items-center bg-black/20 rounded-lg px-2 py-1 gap-2">
                                 <ArrowDown className="w-2.5 h-2.5 text-white/40" />
                                 <Input type="number" placeholder="0" value={selectedBlock.style?.paddingBottom ?? ""} onChange={(e) => updateBlock(selectedBlock.id, { style: { paddingBottom: e.target.value === "" ? undefined : Number(e.target.value) } })} className="h-6 bg-transparent border-none p-0 text-[10px] text-white focus-visible:ring-0" />
                               </div>
                               <div className="flex items-center bg-black/20 rounded-lg px-2 py-1 gap-2">
                                 <ArrowLeftIcon className="w-2.5 h-2.5 text-white/40" />
                                 <Input type="number" placeholder="0" value={selectedBlock.style?.paddingLeft ?? ""} onChange={(e) => updateBlock(selectedBlock.id, { style: { paddingLeft: e.target.value === "" ? undefined : Number(e.target.value) } })} className="h-6 bg-transparent border-none p-0 text-[10px] text-white focus-visible:ring-0" />
                               </div>
                               <div className="flex items-center bg-black/20 rounded-lg px-2 py-1 gap-2">
                                 <ArrowRightIcon className="w-2.5 h-2.5 text-white/40" />
                                 <Input type="number" placeholder="0" value={selectedBlock.style?.paddingRight ?? ""} onChange={(e) => updateBlock(selectedBlock.id, { style: { paddingRight: e.target.value === "" ? undefined : Number(e.target.value) } })} className="h-6 bg-transparent border-none p-0 text-[10px] text-white focus-visible:ring-0" />
                               </div>
                             </div>
                           </div>

                           <div className="space-y-2">
                             <Label className="text-[9px] uppercase font-bold text-white/60">Margin (px)</Label>
                             <div className="grid grid-cols-2 gap-2">
                               <div className="flex items-center bg-black/20 rounded-lg px-2 py-1 gap-2">
                                 <ArrowUp className="w-2.5 h-2.5 text-white/40" />
                                 <Input type="number" placeholder="0" value={selectedBlock.style?.marginTop ?? ""} onChange={(e) => updateBlock(selectedBlock.id, { style: { marginTop: e.target.value === "" ? undefined : Number(e.target.value) } })} className="h-6 bg-transparent border-none p-0 text-[10px] text-white focus-visible:ring-0" />
                               </div>
                               <div className="flex items-center bg-black/20 rounded-lg px-2 py-1 gap-2">
                                 <ArrowDown className="w-2.5 h-2.5 text-white/40" />
                                 <Input type="number" placeholder="0" value={selectedBlock.style?.marginBottom ?? ""} onChange={(e) => updateBlock(selectedBlock.id, { style: { marginBottom: e.target.value === "" ? undefined : Number(e.target.value) } })} className="h-6 bg-transparent border-none p-0 text-[10px] text-white focus-visible:ring-0" />
                               </div>
                               <div className="flex items-center bg-black/20 rounded-lg px-2 py-1 gap-2">
                                 <ArrowLeftIcon className="w-2.5 h-2.5 text-white/40" />
                                 <Input type="number" placeholder="0" value={selectedBlock.style?.marginLeft ?? ""} onChange={(e) => updateBlock(selectedBlock.id, { style: { marginLeft: e.target.value === "" ? undefined : Number(e.target.value) } })} className="h-6 bg-transparent border-none p-0 text-[10px] text-white focus-visible:ring-0" />
                               </div>
                               <div className="flex items-center bg-black/20 rounded-lg px-2 py-1 gap-2">
                                 <ArrowRightIcon className="w-2.5 h-2.5 text-white/40" />
                                 <Input type="number" placeholder="0" value={selectedBlock.style?.marginRight ?? ""} onChange={(e) => updateBlock(selectedBlock.id, { style: { marginRight: e.target.value === "" ? undefined : Number(e.target.value) } })} className="h-6 bg-transparent border-none p-0 text-[10px] text-white focus-visible:ring-0" />
                               </div>
                             </div>
                           </div>
                         </div>
                       </PropertySection>
                       
                       <PropertySection label="Colors" icon={Palette}>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-[9px] uppercase font-bold text-white/70">Text Color</Label>
                              <Input type="color" value={selectedBlock.style?.textColor || "#000000"} onChange={(e) => updateBlock(selectedBlock.id, { style: { textColor: e.target.value } })} className="h-8 w-full p-1 rounded-lg cursor-pointer border-none bg-black/20" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[9px] uppercase font-bold text-white/70">Bg Color</Label>
                              <Input type="color" value={selectedBlock.style?.backgroundColor || "#FFFFFF"} onChange={(e) => updateBlock(selectedBlock.id, { style: { backgroundColor: e.target.value } })} className="h-8 w-full p-1 rounded-lg cursor-pointer border-none bg-black/20" />
                            </div>
                          </div>
                       </PropertySection>

                       <PropertySection label="Borders & Radius" icon={Layers}>
                          <div className="space-y-4">
                             <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                   <Label className="text-[9px] uppercase font-bold text-white/70">Style</Label>
                                   <Select value={selectedBlock.style?.borderStyle || "none"} onValueChange={(v) => updateBlock(selectedBlock.id, { style: { borderStyle: v } })}>
                                      <SelectTrigger className="h-8 rounded-lg border-none bg-black/20 text-white text-[10px]"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                         <SelectItem value="none">None</SelectItem>
                                         <SelectItem value="solid">Solid</SelectItem>
                                         <SelectItem value="dashed">Dashed</SelectItem>
                                         <SelectItem value="dotted">Dotted</SelectItem>
                                      </SelectContent>
                                   </Select>
                                </div>
                                <div className="space-y-1.5">
                                   <Label className="text-[9px] uppercase font-bold text-white/70">Color</Label>
                                   <Input type="color" value={selectedBlock.style?.borderColor || "#000000"} onChange={(e) => updateBlock(selectedBlock.id, { style: { borderColor: e.target.value } })} className="h-8 w-full p-1 rounded-lg cursor-pointer border-none bg-black/20" />
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                   <Label className="text-[9px] uppercase font-bold text-white/70">Width ({selectedBlock.style?.borderWidth || 0}px)</Label>
                                   <Slider value={[selectedBlock.style?.borderWidth || 0]} min={0} max={20} onValueChange={([v]) => updateBlock(selectedBlock.id, { style: { borderWidth: v } })} />
                                </div>
                                <div className="space-y-1.5">
                                   <Label className="text-[9px] uppercase font-bold text-white/70">Radius ({selectedBlock.style?.borderRadius || 0}px)</Label>
                                   <Slider value={[selectedBlock.style?.borderRadius || 0]} min={0} max={100} onValueChange={([v]) => updateBlock(selectedBlock.id, { style: { borderRadius: v } })} />
                                </div>
                             </div>
                          </div>
                       </PropertySection>

                       <PropertySection label="Visibility" icon={Eye}>
                         <div className="space-y-2">
                            <div className="flex items-center justify-between p-2.5 bg-black/10 rounded-lg border border-white/5">
                              <div className="flex items-center gap-2">
                                <Monitor className="w-3 h-3 text-white/70" />
                                <span className="text-[10px] font-bold text-white/90">Hide Desktop</span>
                              </div>
                              <input type="checkbox" checked={!!selectedBlock.style?.hideDesktop} onChange={(e) => updateBlock(selectedBlock.id, { style: { hideDesktop: e.target.checked } })} />
                            </div>
                            <div className="flex items-center justify-between p-2.5 bg-black/10 rounded-lg border border-white/5">
                              <div className="flex items-center gap-2">
                                <Smartphone className="w-3 h-3 text-white/70" />
                                <span className="text-[10px] font-bold text-white/90">Hide Mobile</span>
                              </div>
                              <input type="checkbox" checked={!!selectedBlock.style?.hideMobile} onChange={(e) => updateBlock(selectedBlock.id, { style: { hideMobile: e.target.checked } })} />
                            </div>
                         </div>
                       </PropertySection>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
               <div className="px-4 py-3 bg-black/20 border-b border-white/10 flex items-center gap-2 shrink-0">
                  <Paintbrush className="w-4 h-4 text-white" />
                  <span className="font-headline font-bold text-[10px] uppercase tracking-wider text-white">Page Design</span>
               </div>
               <ScrollArea className="flex-1 min-h-0">
                  <div className="p-4 space-y-6 pb-20">
                     <PropertySection label="Global Background" icon={Palette}>
                        <div className="space-y-4">
                           <div className="space-y-1.5">
                              <Label className="text-[9px] uppercase font-bold text-white/70">Page Color</Label>
                              <Input type="color" value={pageStyle.backgroundColor || "#FFFFFF"} onChange={(e) => setPageStyle({...pageStyle, backgroundColor: e.target.value})} className="h-8 w-full p-1 rounded-lg cursor-pointer border-none bg-black/20" />
                           </div>
                           <div className="space-y-1.5">
                              <Label className="text-[9px] uppercase font-bold text-white/70">Background Image</Label>
                              <CloudinaryUpload value={pageStyle.backgroundImage || ""} onUpload={(url) => setPageStyle({...pageStyle, backgroundImage: url})} onRemove={() => setPageStyle({...pageStyle, backgroundImage: ""})} />
                           </div>
                        </div>
                     </PropertySection>

                     <PropertySection label="Global Spacing" icon={MoveVertical}>
                        <div className="space-y-6">
                           <div className="space-y-3">
                              <div className="flex justify-between items-center text-[9px] font-bold text-white/70 uppercase">
                                 <Label>Vertical Padding (px)</Label>
                                 <span>{pageStyle.paddingTop}px</span>
                              </div>
                              <Slider value={[pageStyle.paddingTop || 0]} min={0} max={200} step={4} onValueChange={([v]) => setPageStyle({...pageStyle, paddingTop: v, paddingBottom: v})} className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-primary" />
                           </div>
                        </div>
                     </PropertySection>

                     <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center text-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                           <MousePointer2 className="w-5 h-5 text-white/40" />
                        </div>
                        <p className="text-[10px] text-white/40 font-medium leading-relaxed">Select any element on the canvas to edit its specific properties.</p>
                     </div>
                  </div>
               </ScrollArea>
            </div>
          )}
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-white/10 bg-black/10 shrink-0">
          <Button className="w-full h-10 rounded-xl font-bold text-xs bg-white text-primary hover:bg-white/90 transition-all hover:scale-[1.02] shadow-lg" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin w-3.5 h-3.5 mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
            Save Landing Page
          </Button>
        </SidebarFooter>
      </Sidebar>

      {/* --- MAIN BUILDER INSET --- */}
      <SidebarInset className="flex flex-col h-full bg-slate-50/30">
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="bg-primary text-white border-none shadow-lg shadow-primary/20 hover:bg-primary/90" />
            <div className="h-5 w-px bg-slate-200 hidden md:block" />
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
              <Button variant={viewMode === "desktop" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("desktop")} className="rounded-md h-7 px-2.5 font-bold text-[9px] uppercase tracking-wider">
                <Monitor className="w-3.5 h-3.5 mr-1.5" /> Desktop
              </Button>
              <Button variant={viewMode === "mobile" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("mobile")} className="rounded-md h-7 px-2.5 font-bold text-[9px] uppercase tracking-wider">
                <Smartphone className="w-3.5 h-3.5 mr-1.5" /> Mobile
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="rounded-lg px-4 h-9 font-bold text-[10px] bg-white border-slate-200 text-slate-600 shadow-sm" onClick={() => setIsPreviewOpen(true)}>
              <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview Site
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center items-start" onClick={() => setSelectedBlockId(null)}>
          <div 
            className={cn(
               "transition-all duration-700 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden",
               viewMode === "mobile" ? "w-full max-w-[375px] rounded-[40px] border-[10px] border-slate-900 ring-[12px] ring-white/10" : "max-w-6xl w-full rounded-xl"
            )}
            style={{
               backgroundColor: pageStyle.backgroundColor || "#FFFFFF",
               backgroundImage: pageStyle.backgroundImage ? `url(${pageStyle.backgroundImage})` : 'none',
               backgroundSize: 'cover',
               backgroundPosition: 'center',
               paddingTop: `${pageStyle.paddingTop || 40}px`,
               paddingBottom: `${pageStyle.paddingBottom || 40}px`,
               minHeight: '100%'
            }}
          >
            <div className="py-8 group/canvas">
              {blocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-10 filter grayscale">
                  <LayoutGrid className="w-20 h-20" />
                  <h3 className="text-2xl font-headline font-black tracking-tighter uppercase">Canvas is Empty</h3>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={(e) => setActiveDragId(e.active.id as string)}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-0">
                      {blocks.map((block) => (
                        <CanvasBlockWrapper
                          key={block.id}
                          block={block}
                          products={products}
                          store={store}
                          isSelected={selectedBlockId === block.id}
                          selectedBlockId={selectedBlockId}
                          isMobile={isMobile}
                          onSelect={handleSelectBlock}
                          onRemove={removeBlock}
                          onMoveUp={(id?: string) => moveBlock(id || block.id, 'up')}
                          onMoveDown={(id?: string) => moveBlock(id || block.id, 'down')}
                          onInsertRequest={onInsertRequest}
                          viewMode={viewMode}
                          onAddNested={(parentId: string, colIdx?: number) => {
                            onAddNestedRequest(parentId, colIdx);
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeDragId ? (
                      <div className="opacity-50 pointer-events-none scale-105 transition-transform bg-white rounded-lg p-4 shadow-2xl border border-primary/20">
                        {findBlockById(blocks, activeDragId)?.type}
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}

              <div className="flex flex-col items-center justify-center py-8 mt-6 border-t border-dashed border-slate-100/20">
                <Dialog open={isComponentDialogOpen} onOpenChange={setIsComponentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 w-12 rounded-full border-2 border-primary/20 text-primary shadow-xl hover:scale-110 active:scale-95 transition-all bg-white group"
                      onClick={() => { setActiveParentId(null); setInsertInfo(null); setActiveColumnIndex(null); }}
                    >
                      <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl rounded-[32px] p-0 border-none overflow-hidden shadow-2xl">
                    <DialogHeader className="p-5 bg-primary text-white">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl"><PlusCircle className="w-5 h-5" /></div>
                        <div>
                          <DialogTitle className="text-lg font-headline font-bold">Add New Widget</DialogTitle>
                          <DialogDescription className="text-white/70 text-[10px] uppercase font-bold tracking-widest">
                            {insertInfo ? `Inserting ${insertInfo.position} block` : activeColumnIndex !== null ? `Adding to Column ${activeColumnIndex + 1}` : "Adding component to page"}
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>
                    <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50/50 max-h-[60vh] overflow-y-auto">
                      <WidgetGridButton icon={Type} label="Large Heading" onClick={() => handleAddBlock("header")} />
                      <WidgetGridButton icon={List} label="Rich Text" onClick={() => handleAddBlock("paragraph")} />
                      <WidgetGridButton icon={ImageIcon} label="Image Box" onClick={() => handleAddBlock("image")} />
                      <WidgetGridButton icon={Monitor} label="Action Button" onClick={() => handleAddBlock("button")} />
                      <WidgetGridButton icon={Square} label="Styled Card" onClick={() => handleAddBlock("card")} highlight />
                      {!activeParentId && <WidgetGridButton icon={Columns} label="Grid Row" onClick={() => handleAddBlock("row")} />}
                      <WidgetGridButton icon={ShoppingCart} label="Order Form" onClick={() => handleAddBlock("product-order-form")} highlight />
                      <WidgetGridButton icon={Layout} label="Carousel" onClick={() => handleAddBlock("carousel")} />
                      <WidgetGridButton icon={CheckCircle} label="Checked List" onClick={() => handleAddBlock("checked-list")} />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* --- PREVIEW DIALOG --- */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[100vw] w-full h-[100vh] p-0 rounded-none border-none bg-slate-50 flex flex-col overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Page Preview</DialogTitle>
            <DialogDescription>Visualizing the landing page as seen by customers.</DialogDescription>
          </DialogHeader>
          <header className="flex h-14 items-center justify-between px-6 border-b bg-white z-50 shadow-sm shrink-0">
            <div className="flex items-center gap-3">
              <Eye className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-headline font-bold tracking-tight">Full Site Preview</h2>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setIsPreviewOpen(false)} className="rounded-full h-9 w-9 hover:bg-slate-100"><X className="w-5 h-5" /></Button>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto bg-slate-100/30 flex justify-center p-4">
            <div 
               className={cn(
                  "shadow-2xl transition-all duration-700 min-h-full py-0",
                  viewMode === "mobile" ? "w-full max-w-[375px] rounded-[40px] border-[10px] border-slate-900" : "max-w-6xl w-full rounded-xl"
               )}
               style={{
                  backgroundColor: pageStyle.backgroundColor || "#FFFFFF",
                  backgroundImage: pageStyle.backgroundImage ? `url(${pageStyle.backgroundImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  paddingTop: `${pageStyle.paddingTop || 40}px`,
                  paddingBottom: `${pageStyle.paddingBottom || 40}px`,
               }}
            >
              <div className="h-full">
                {blocks.map(block => <BlockRenderer key={block.id} block={block} products={products} store={store} isPreview viewMode={viewMode} selectedBlockId={selectedBlockId} />)}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
