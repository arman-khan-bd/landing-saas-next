
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Save, Trash2, Image as ImageIcon,
  Type, Layout, List, CheckCircle, ShoppingCart,
  Loader2, Monitor, Smartphone,
  Square, Eye, X, Columns,
  ArrowLeft, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Palette, Box, MousePointer2,
  Sparkles, PlusCircle, LayoutGrid,
  MoveVertical, ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon,
  Paintbrush, GripVertical, Copy, Layers,
  ChevronUp, ChevronDown as ChevronDownIcon, Truck, CreditCard
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

// --- Types ---
type BlockType =
  | "header"
  | "paragraph"
  | "image"
  | "accordion"
  | "button"
  | "link"
  | "carousel"
  | "checked-list"
  | "product-order-form"
  | "row";

interface Block {
  id: string;
  type: BlockType;
  content: any;
  style: {
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    textAlign?: "left" | "center" | "right" | "justify";
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: "normal" | "italic";
    textDecoration?: "none" | "underline";
    lineHeight?: number;
    borderStyle?: "none" | "solid" | "dashed" | "dotted";
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
    boxShadow?: "none" | "sm" | "md" | "lg" | "xl";
    animation?: "none" | "fadeIn" | "slideUp" | "zoomIn";
    hideDesktop?: boolean;
    hideMobile?: boolean;
    desktopColumns?: number;
    columns?: number;
  };
  children?: Block[];
}

interface PageStyle {
  backgroundColor?: string;
  backgroundImage?: string;
  paddingTop?: number;
  paddingBottom?: number;
}

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
        columns: type === "row" ? 2 : 1
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
      case "product-order-form": return { mainProductId: "", shippingType: "free" };
      case "row": return { columns: 2 };
      case "carousel": return { items: [{ id: "1", title: "Slide 1", subtitle: "", imageUrl: "", buttonText: "" }], desktopColumns: 3 };
      case "checked-list": return { items: ["Fast Delivery", "Secure Payments", "Premium Quality"], listStyle: "check" };
      default: return {};
    }
  };

  const handleAddBlock = (type: BlockType) => {
    const newBlock = createBlock(type);
    
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
    if (isMobile) setOpenMobile(true);
  };

  const insertBlockRecursively = (items: Block[], relativeId: string, position: 'before' | 'after', newBlock: Block): Block[] => {
    const index = items.findIndex(i => i.id === relativeId);
    if (index !== -1) {
      const newItems = [...items];
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

    setBlocks((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
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
    setIsComponentDialogOpen(true);
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
                  <div className="p-1.5 bg-white/10 rounded-lg text-white">
                    {getBlockIcon(selectedBlock.type)}
                  </div>
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
                       <PropertySection label="Alignment & Text" icon={Type}>
                          <div className="space-y-4">
                            <div className="grid grid-cols-4 gap-1 bg-black/20 p-1 rounded-lg">
                              <AlignButton active={selectedBlock.style?.textAlign === "left"} icon={AlignLeft} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "left" } })} />
                              <AlignButton active={selectedBlock.style?.textAlign === "center"} icon={AlignCenter} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "center" } })} />
                              <AlignButton active={selectedBlock.style?.textAlign === "right"} icon={AlignRight} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "right" } })} />
                              <AlignButton active={selectedBlock.style?.textAlign === "justify"} icon={AlignJustify} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "justify" } })} />
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

                       <PropertySection label="Visibility" icon={Eye}>
                         <div className="space-y-2">
                            <div className="flex items-center justify-between p-2.5 bg-black/10 rounded-lg border border-white/5">
                              <div className="flex items-center gap-2">
                                <Monitor className="w-3 h-3 text-white/70" />
                                <span className="text-[10px] font-bold text-white/90">Hide Desktop</span>
                              </div>
                              <Switch checked={!!selectedBlock.style?.hideDesktop} onCheckedChange={(v) => updateBlock(selectedBlock.id, { style: { hideDesktop: v } })} className="data-[state=checked]:bg-white data-[state=checked]:[&_span]:bg-primary h-5 w-9 [&_span]:h-4 [&_span]:w-4" />
                            </div>
                            <div className="flex items-center justify-between p-2.5 bg-black/10 rounded-lg border border-white/5">
                              <div className="flex items-center gap-2">
                                <Smartphone className="w-3 h-3 text-white/70" />
                                <span className="text-[10px] font-bold text-white/90">Hide Mobile</span>
                              </div>
                              <Switch checked={!!selectedBlock.style?.hideMobile} onCheckedChange={(v) => updateBlock(selectedBlock.id, { style: { hideMobile: v } })} className="data-[state=checked]:bg-white data-[state=checked]:[&_span]:bg-primary h-5 w-9 [&_span]:h-4 [&_span]:w-4" />
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
                          isMobile={isMobile}
                          onSelect={(id?: string) => {
                            setSelectedBlockId(id || block.id);
                            if (isMobile) setOpenMobile(true);
                          }}
                          onRemove={(id?: string) => removeBlock(id || block.id)}
                          onMoveUp={(id?: string) => moveBlock(id || block.id, 'up')}
                          onMoveDown={(id?: string) => moveBlock(id || block.id, 'down')}
                          onInsertRequest={onInsertRequest}
                          viewMode={viewMode}
                          onAddNested={(parentId: string) => {
                            setActiveParentId(parentId);
                            setInsertInfo(null);
                            setIsComponentDialogOpen(true);
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
                      onClick={() => { setActiveParentId(null); setInsertInfo(null); }}
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
                            {insertInfo ? `Inserting ${insertInfo.position} block` : activeParentId ? "Adding component to row" : "Adding component to page"}
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>
                    <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50/50 max-h-[60vh] overflow-y-auto">
                      <WidgetGridButton icon={Type} label="Large Heading" onClick={() => handleAddBlock("header")} />
                      <WidgetGridButton icon={List} label="Rich Text" onClick={() => handleAddBlock("paragraph")} />
                      <WidgetGridButton icon={ImageIcon} label="Image Box" onClick={() => handleAddBlock("image")} />
                      <WidgetGridButton icon={Monitor} label="Action Button" onClick={() => handleAddBlock("button")} />
                      {(!activeParentId && !insertInfo) && <WidgetGridButton icon={Columns} label="Grid Row" onClick={() => handleAddBlock("row")} />}
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
                {blocks.map(block => <BlockRenderer key={block.id} block={block} products={products} store={store} isPreview viewMode={viewMode} />)}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function WidgetGridButton({ icon: Icon, label, onClick, highlight = false }: any) {
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

function AlignButton({ active, icon: Icon, onClick }: any) {
  return (
    <Button variant="ghost" onClick={onClick} className={cn("h-7 rounded-md px-0", active ? "bg-white text-primary shadow-sm" : "text-white/40 hover:text-white")}>
      <Icon className="w-3 h-3" />
    </Button>
  );
}

function PropertySection({ label, icon: Icon, children }: any) {
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

function CanvasBlockWrapper({ block, products, store, isSelected, isMobile, onSelect, onRemove, onMoveUp, onMoveDown, onInsertRequest, viewMode, onAddNested }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id, disabled: isMobile });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.3 : 1,
  };

  const isHidden = (viewMode === "desktop" && block.style?.hideDesktop) || (viewMode === "mobile" && block.style?.hideMobile);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={cn(
        "relative group/block transition-all duration-300 cursor-pointer min-h-[20px]",
        isSelected ? "ring-2 ring-primary ring-offset-2 z-40 bg-primary/5 rounded-lg" : "hover:bg-primary/5",
        isHidden ? "opacity-20 blur-[0.5px] grayscale" : ""
      )}
    >
      {isSelected && (
        <div className="absolute -top-7 left-0 flex items-center gap-2 bg-primary text-white rounded-t-lg px-2.5 py-1 text-[8px] font-black uppercase tracking-widest z-50 shadow-lg">
          {!isMobile ? (
            <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing hover:bg-white/20 p-0.5 rounded mr-1">
              <GripVertical className="w-3 h-3" />
            </div>
          ) : (
            <div className="flex items-center gap-1 border-r border-white/20 pr-1 mr-1">
               <Button variant="ghost" size="icon" className="h-5 w-5 text-white hover:bg-white/20 p-0" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
                  <ChevronUp className="w-3 h-3" />
               </Button>
               <Button variant="ghost" size="icon" className="h-5 w-5 text-white hover:bg-white/20 p-0" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
                  <ChevronDownIcon className="w-3 h-3" />
               </Button>
            </div>
          )}
          <div className="flex items-center gap-1.5 border-r border-white/20 pr-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-4 w-4 text-white hover:bg-white/20 p-0"
              onClick={(e) => { e.stopPropagation(); onInsertRequest(block.id, 'before'); }}
            >
              <Plus className="w-2.5 h-2.5" />
            </Button>
            <span>{block.type}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-4 w-4 text-white hover:bg-white/20 p-0"
              onClick={(e) => { e.stopPropagation(); onInsertRequest(block.id, 'after'); }}
            >
              <Plus className="w-2.5 h-2.5" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Trash2 className="w-3 h-3 cursor-pointer hover:text-red-200" onClick={(e) => { e.stopPropagation(); onRemove(); }} />
          </div>
        </div>
      )}
      <div className="pointer-events-none">
        <BlockRenderer 
          block={block} 
          products={products} 
          store={store}
          viewMode={viewMode} 
          onAddNested={onAddNested}
          isBuilder
          isMobile={isMobile}
          onSelect={onSelect}
          onRemove={onRemove}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onInsertRequest={onInsertRequest}
        />
      </div>
    </div>
  );
}

function PropertyEditor({ block, products, onChange }: any) {
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
                     <AccordionTrigger className="hover:no-underline py-2 bg-black/20 px-3 rounded-lg">
                       <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded bg-black/40 overflow-hidden border border-white/10 shrink-0">
                           {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover" />}
                         </div>
                         <span className="text-[9px] text-white font-bold truncate max-w-[100px]">{item.title || `Slide ${index + 1}`}</span>
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

function BlockRenderer({ block, products, store, isPreview = false, viewMode = "desktop", onAddNested, isBuilder, isMobile, onSelect, onRemove, onMoveUp, onMoveDown, onInsertRequest }: any) {
  const isHidden = (viewMode === "desktop" && block.style?.hideDesktop) || (viewMode === "mobile" && block.style?.hideMobile);
  if (isHidden && isPreview) return null;

  const style: any = {
    ...(block.style?.paddingTop !== undefined && { paddingTop: `${block.style.paddingTop}px` }),
    ...(block.style?.paddingBottom !== undefined && { paddingBottom: `${block.style.paddingBottom}px` }),
    ...(block.style?.paddingLeft !== undefined && { paddingLeft: `${block.style.paddingLeft}px` }),
    ...(block.style?.paddingRight !== undefined && { paddingRight: `${block.style.paddingRight}px` }),
    ...(block.style?.marginTop !== undefined && { marginTop: `${block.style.marginTop}px` }),
    ...(block.style?.marginBottom !== undefined && { marginBottom: `${block.style.marginBottom}px` }),
    ...(block.style?.marginLeft !== undefined && { marginLeft: `${block.style.marginLeft}px` }),
    ...(block.style?.marginRight !== undefined && { marginRight: `${block.style.marginRight}px` }),
    textAlign: block.style?.textAlign,
    backgroundColor: block.style?.backgroundColor,
    color: block.style?.textColor,
    fontSize: block.style?.fontSize ? `${block.style.fontSize}px` : undefined,
    fontWeight: block.style?.fontWeight,
    borderRadius: block.style?.borderRadius ? `${block.style.borderRadius}px` : undefined,
  };

  const gridColsMap: Record<number, string> = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  switch (block.type) {
    case "row":
      const colsCount = block.content?.columns || 1;
      const gridClass = gridColsMap[colsCount] || "md:grid-cols-1";
      const children = block.children || [];

      return (
        <div 
          style={style} 
          className={cn(
            "grid gap-6 px-4 max-w-6xl mx-auto w-full", 
            "grid-cols-1", 
            gridClass,
            isBuilder && "border border-dashed border-primary/20 p-6 rounded-[32px] bg-slate-50/20"
          )}
        >
          {children.map((child: any) => (
            isBuilder ? (
              <CanvasBlockWrapper 
                key={child.id} 
                block={child} 
                products={products} 
                store={store}
                viewMode={viewMode} 
                isMobile={isMobile}
                onAddNested={onAddNested}
                onSelect={(id?: string) => onSelect(id || child.id)}
                onRemove={(id?: string) => onRemove(id || child.id)}
                onMoveUp={(id?: string) => onMoveUp(id || child.id)}
                onMoveDown={(id?: string) => onMoveDown(id || child.id)}
                onInsertRequest={onInsertRequest}
              />
            ) : (
              <BlockRenderer key={child.id} block={child} products={products} store={store} isPreview={isPreview} viewMode={viewMode} />
            )
          ))}

          {isBuilder && (
            Array.from({ length: Math.max(0, colsCount - children.length) }).map((_, i) => (
              <div 
                key={`empty-col-${i}`}
                className="min-h-[120px] border-2 border-dashed border-slate-200/40 rounded-2xl flex items-center justify-center bg-white/40 group/empty hover:border-primary/40 hover:bg-white transition-all duration-300"
              >
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10 rounded-full border-primary/20 text-primary bg-white shadow-sm hover:bg-primary hover:text-white transition-all pointer-events-auto group-hover/empty:scale-110"
                  onClick={(e) => { e.stopPropagation(); onAddNested(block.id); }}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            ))
          )}
          
          {isBuilder && children.length >= colsCount && (
             <div className="col-span-full flex justify-center py-4 border-t border-dashed border-slate-100/20 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="pointer-events-auto h-9 px-6 rounded-full bg-white text-primary border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm group"
                  onClick={(e) => { e.stopPropagation(); onAddNested(block.id); }}
                >
                  <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                  Add to Row
                </Button>
             </div>
          )}
        </div>
      );
    case "header":
      const HeaderTag = block.content?.level || 'h2';
      const headerSizes: any = { h1: 'text-2xl md:text-5xl', h2: 'text-xl md:text-4xl', h3: 'text-lg md:text-2xl' };
      return <div style={style} className={cn("px-4 w-full font-headline font-bold leading-tight")}>
        <HeaderTag className={headerSizes[HeaderTag]}>{block.content?.text}</HeaderTag>
      </div>;
    case "paragraph":
      return <div style={style} className="px-4 w-full leading-relaxed whitespace-pre-wrap text-sm opacity-80">{block.content?.text}</div>;
    case "image":
      return <div style={style} className="px-4 w-full">
        {block.content?.url && <img src={block.content.url} className="w-full h-auto shadow-md rounded-xl" alt="" />}
      </div>;
    case "button":
      return <div style={style} className="px-4 w-full">
        <Button size="lg" className="rounded-xl px-8 h-11 font-bold uppercase tracking-widest text-[10px] shadow-md transition-all hover:scale-105">{block.content?.text}</Button>
      </div>;
    case "carousel":
      const carouselCols = block.style?.desktopColumns || 3;
      const carouselColMapping: any = {
        1: "basis-full",
        2: "basis-full md:basis-1/2",
        3: "basis-full md:basis-1/3",
        4: "basis-full md:basis-1/4"
      };
      return (
        <div style={style} className="px-4 w-full max-w-6xl mx-auto">
          <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent>
              {(block.content?.items || []).map((item: any) => (
                <CarouselItem key={item.id} className={cn(carouselColMapping[carouselCols] || "basis-full", "px-1")}>
                  <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100 h-full flex flex-col">
                    {item.imageUrl && <img src={item.imageUrl} className="w-full aspect-square object-cover" />}
                    {(item.title || item.subtitle || item.buttonText) && (
                      <div className="p-3 space-y-1.5 flex-1">
                        {item.title && <h4 className="font-bold text-xs">{item.title}</h4>}
                        {item.subtitle && <p className="text-[10px] text-muted-foreground line-clamp-2">{item.subtitle}</p>}
                        {item.buttonText && <Button variant="secondary" className="w-full h-7 text-[8px] uppercase font-black rounded-lg mt-1">{item.buttonText}</Button>}
                      </div>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      );
    case "checked-list":
      const listStyle = block.content?.listStyle || "check";
      return (
        <div style={style} className="px-4 w-full max-w-6xl mx-auto space-y-2">
          {(block.content?.items || []).map((item: string, i: number) => {
            let prefix;
            if (listStyle === "check") {
              prefix = <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />;
            } else if (listStyle === "bullet") {
              prefix = <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mx-1" />;
            } else if (listStyle === "number") {
              prefix = <span className="text-[10px] font-bold text-primary w-4 shrink-0">{i + 1}.</span>;
            } else if (listStyle === "roman") {
              const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][i] || (i + 1);
              prefix = <span className="text-[10px] font-bold text-primary w-4 shrink-0">{roman}.</span>;
            } else if (listStyle === "bengali") {
              const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
              const bengali = (i + 1).toString().split('').map(d => bengaliDigits[parseInt(d)]).join('');
              prefix = <span className="text-[10px] font-bold text-primary w-4 shrink-0">{bengali}.</span>;
            }

            return (
              <div key={i} className="flex items-center gap-2">
                {prefix}
                <span className="text-xs font-medium">{item}</span>
              </div>
            );
          })}
        </div>
      );
    case "product-order-form":
      const mainProd = products.find((p: any) => p.id === block.content?.mainProductId);
      return (
        <div style={style} className="px-4 w-full max-w-5xl mx-auto text-left">
          <Card className="rounded-[32px] shadow-lg border-none overflow-hidden bg-white">
            <div className="bg-slate-900 text-white p-6 text-center">
              <h3 className="text-xl md:text-2xl font-headline font-bold mb-1 tracking-tighter uppercase">অর্ডার কনফার্ম করুন</h3>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[8px]">নিরাপদ পেমেন্ট ব্যবস্থা</p>
            </div>
            <div className="p-5 space-y-6">
               {mainProd ? (
                 <div className="flex flex-row justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                    <div className="flex items-center gap-4">
                      <img src={mainProd.featuredImage} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                      <div>
                        <h4 className="text-sm font-bold">{mainProd.name}</h4>
                        <p className="text-primary font-black text-lg">${mainProd.currentPrice}</p>
                      </div>
                    </div>
                    <CheckCircle className="text-primary w-6 h-6" />
                 </div>
               ) : (
                 <div className="p-6 text-center border-2 border-dashed rounded-xl opacity-20 font-bold tracking-widest text-[10px]">পণ্য নির্বাচন করুন</div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-3">
                    <Label className="text-[8px] font-black uppercase text-slate-400">আপনার তথ্য</Label>
                    <Input placeholder="নাম" className="h-10 rounded-xl bg-slate-50 border-none text-xs" />
                    <Input placeholder="মোবাইল" className="h-10 rounded-xl bg-slate-50 border-none text-xs" />
                    <Textarea placeholder="ঠিকানা" className="h-20 rounded-xl bg-slate-50 border-none text-xs" />
                  </div>
                  <div className="space-y-4">
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex justify-between text-[10px] font-bold">
                           <span>পণ্য মূল্য</span>
                           <span>${mainProd?.currentPrice || 0}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-emerald-600">
                           <span>ডেলিভারি</span>
                           <span>FREE</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-xl font-black text-primary">
                           <span className="text-[10px] pt-1.5 text-slate-900">মোট</span>
                           <span>${mainProd?.currentPrice || 0}</span>
                        </div>
                     </div>
                     <Button className="w-full h-12 rounded-2xl font-black uppercase text-xs">অর্ডার করুন</Button>
                  </div>
               </div>
            </div>
          </Card>
        </div>
      );
    default: return null;
  }
}

function getBlockIcon(type: BlockType) {
  switch (type) {
    case "header": return <Type className="w-4 h-4" />;
    case "paragraph": return <List className="w-4 h-4" />;
    case "image": return <ImageIcon className="w-4 h-4" />;
    case "row": return <Columns className="w-4 h-4" />;
    case "button": return <Monitor className="w-4 h-4" />;
    case "carousel": return <Layout className="w-4 h-4" />;
    case "checked-list": return <CheckCircle className="w-4 h-4" />;
    case "product-order-form": return <ShoppingCart className="w-4 h-4" />;
    default: return <Square className="w-4 h-4" />;
  }
}
