
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
  Star, Heart, Lightbulb, Info, Shield, Zap, Check, LayoutList,
  Flame, Leaf, Moon, Sun, Quote, Rocket, Menu
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const THEMES = [
  {
    id: "default",
    name: "Classic Light",
    icon: Sun,
    style: { backgroundColor: "#FFFFFF", primaryColor: "#145DCC", accentColor: "#26D87F", textColor: "#1a1a1a" }
  },
  {
    id: "organic",
    name: "Natural Organic",
    icon: Leaf,
    style: { backgroundColor: "#fdf8f0", primaryColor: "#2d7a3a", accentColor: "#c9941a", textColor: "#1a1a1a" }
  },
  {
    id: "laam",
    name: "Traditional Green",
    icon: Zap,
    style: { backgroundColor: "#fdf6e3", primaryColor: "#1a7c3e", accentColor: "#c9920a", textColor: "#1a1a1a" }
  },
  {
    id: "midnight",
    name: "Midnight Pro",
    icon: Moon,
    style: { backgroundColor: "#0f172a", primaryColor: "#6366f1", accentColor: "#f43f5e", textColor: "#f8fafc" }
  }
];

export default function PageBuilder() {
  return (
    <SidebarProvider defaultOpen={true}>
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
    textColor: "#0F172A",
    primaryColor: "#145DCC",
    paddingTop: 40,
    paddingBottom: 40,
    themeId: "default",
    accentColor: "#26D87F",
  });
  const [products, setProducts] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"edit" | "advanced">("edit");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isComponentDialogOpen, setIsComponentDialogOpen] = useState(false);
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [activeColumnIndex, setActiveColumnIndex] = useState<number | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
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
          setPageStyle({
            ...pageStyle,
            ...data.pageStyle
          });
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

  const handleApplyTheme = (theme: any) => {
    setPageStyle({
      ...pageStyle,
      themeId: theme.id,
      backgroundColor: theme.style.backgroundColor,
      primaryColor: theme.style.primaryColor,
      accentColor: theme.style.accentColor,
      textColor: theme.style.textColor,
    });
  };

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
        columnSpan: 1,
        textColor: pageStyle.textColor,
      },
      children: type === "row" ? [] : undefined
    };
  };

  const getInitialContent = (type: BlockType) => {
    switch (type) {
      case "navbar": return {
        logoType: "text",
        logoText: "My Store",
        logoUrl: "",
        logoIcon: "ShoppingBag",
        logoPosition: "left",
        position: "normal",
        transparent: false,
        backgroundColor: "#ffffff",
        textColor: "#1a1a1a",
        items: [
          { id: "1", label: "Home", link: "/", position: "center" },
          { id: "2", label: "Shop", link: "/all-products", position: "center" }
        ],
        showCta: true,
        ctaText: "Order Now",
        ctaLink: "[checkout]",
        ctaPosition: "right"
      };
      case "ultra-hero": return { 
        badgeText: "BSTI অনুমোদিত • BCSIR ল্যাব টেস্টেড", 
        title: "অসুস্থ ব্যক্তি ছাড়া সুস্থতার মূল্য কেউ বোঝে না", 
        subtitle: "শক্তি ও সুস্বাস্থ্যের নির্ভরযোগ্য উপহার",
        brandTitle: "সাম",
        brandSubtitle: "প্রাকৃতিক স্বাস্থ্য সুরক্ষা",
        ctaText: "এখানে অর্ডার করুন",
        ctaLink: "[checkout]",
        phoneText: "01621-611589",
        phoneLink: "tel:01621611589",
        badgeColor: "#facc15",
        titleColor: "#ffffff",
        subtitleColor: "#fde047",
        brandTitleColor: "#1a7c3e",
        brandSubtitleColor: "#64748b",
        phoneTextColor: "#ffffff",
        trustItems: [
          { iconName: "CheckSquare", label: "BSTI অনুমোদিত" },
          { iconName: "Microscope", label: "ল্যাব টেস্টেড" },
          { iconName: "Truck", label: "ফ্রি ডেলিভারি" },
          { iconName: "Banknote", label: "ক্যাশ অন ডেলিভারি" },
          { iconName: "RotateCcw", label: "সহজ রিফান্ড" }
        ]
      };
      case "quote": return { title: "Reference Headline", text: "Text content goes here...", reference: "Source Citation", iconName: "Quote" };
      case "header": return { text: "Section Heading", level: "h2" };
      case "paragraph": return { text: "Add your text content here..." };
      case "rich-text": return { html: "<h2>Pro Storytelling Section</h2><p>Use the editor to create beautiful multi-line content with <strong>formatting</strong>.</p>" };
      case "image": return { url: "" };
      case "accordion": return { items: [{ id: "1", title: "Why choose our service?", content: "We offer 100% money back guarantee and 24/7 support." }] };
      case "button": return { text: "Click Here", link: "/" };
      case "product-order-form": return { productIds: [], mainProductId: "", shippingType: "free" };
      case "row": return { columns: 2 };
      case "carousel": return { items: [{ id: "1", title: "Slide 1", subtitle: "", imageUrl: "", buttonText: "" }], desktopColumns: 3 };
      case "checked-list": return { items: ["Fast Delivery", "Secure Payments", "Premium Quality"], listStyle: "check" };
      case "card": return { 
        title: "Feature Title", 
        subtitle: "A short description goes here.", 
        iconName: "Zap", 
        iconSize: 32, 
        iconColor: pageStyle.primaryColor || "#145DCC",
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
    if (!pageId || !firestore || !store) return;
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
    
    // Explicitly update based on existing fields
    updateDoc(pageRef, { 
      config: sanitizedConfig, 
      pageStyle: sanitizedStyle,
      updatedAt: serverTimestamp() 
    })
      .then(() => {
        toast({ title: "Project Published!", description: "Changes are live on your store." });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: pageRef.path,
          operation: 'update',
          requestResourceData: { 
            config: sanitizedConfig, 
            pageStyle: sanitizedStyle,
            updatedAt: 'SERVER_TIMESTAMP'
          },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
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
      
      <Sidebar collapsible="offcanvas" className="border-r-0 bg-slate-900 text-white shadow-2xl">
        <SidebarHeader className="p-4 border-b border-white/5 bg-black/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="block font-headline font-bold text-white text-xs tracking-tight">Nexus Designer</span>
                <span className="text-[8px] text-white/40 font-bold uppercase tracking-widest block">v2.4 Pro</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => router.push(`/${subdomain}/builder`)} className="h-8 w-8 rounded-full text-white/30 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0 bg-slate-900 h-full">
          {selectedBlock ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-4 py-3 bg-black/20 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-headline font-bold text-[10px] uppercase tracking-wider text-indigo-400">{selectedBlock.type} Node</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-red-400 hover:bg-red-400/10" onClick={() => removeBlock(selectedBlock.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <Tabs value={sidebarTab} onValueChange={(v: any) => setSidebarTab(v)} className="flex-1 flex flex-col min-h-0">
                <TabsList className="w-full bg-black/10 border-b border-white/10 rounded-none h-10 p-0 shrink-0">
                  <TabsTrigger value="edit" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent text-white/40 data-[state=active]:text-white font-bold text-[9px] uppercase tracking-widest h-full">Config</TabsTrigger>
                  <TabsTrigger value="advanced" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent text-white/40 data-[state=active]:text-white font-bold text-[9px] uppercase tracking-widest h-full">Style</TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-4 space-y-6 pb-20">
                    <TabsContent value="edit" className="mt-0 space-y-6">
                      <PropertySection label="Component Data" icon={Box}>
                        <PropertyEditor block={selectedBlock} products={products} onChange={(u: any) => updateBlock(selectedBlock.id, u)} />
                      </PropertySection>
                    </TabsContent>

                    <TabsContent value="advanced" className="mt-0 space-y-6">
                       {selectedBlockParent?.type === "row" && (
                         <PropertySection label="Grid Logic" icon={Columns}>
                            <div className="space-y-4">
                               <div className="space-y-1">
                                  <Label className="text-[9px] uppercase font-bold text-white/40">Active Column</Label>
                                  <Select 
                                    value={(selectedBlock.style?.columnIndex ?? 0).toString()} 
                                    onValueChange={(v) => updateBlock(selectedBlock.id, { style: { columnIndex: Number(v) } })}
                                  >
                                     <SelectTrigger className="h-8 rounded-lg border-none bg-black/20 text-white text-[10px]">
                                        <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent className="bg-slate-800 border-white/10 text-white">
                                        {Array.from({ length: selectedBlockParent.content?.columns || 1 }).map((_, i) => (
                                          <SelectItem key={i} value={i.toString()}>Column {i + 1}</SelectItem>
                                        ))}
                                     </SelectContent>
                                  </Select>
                               </div>
                               <div className="space-y-3">
                                  <div className="flex justify-between items-center text-[9px] font-bold text-white/50 uppercase">
                                    <Label>Column Span</Label>
                                    <span>{selectedBlock.style?.columnSpan || 1} units</span>
                                  </div>
                                  <Slider value={[selectedBlock.style?.columnSpan || 1]} min={1} max={selectedBlockParent.content?.columns || 4} onValueChange={([v]) => updateBlock(selectedBlock.id, { style: { columnSpan: v } })} className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-indigo-600" />
                               </div>
                            </div>
                         </PropertySection>
                       )}

                       <PropertySection label="Typography" icon={Type}>
                          <div className="space-y-4">
                            <div className="grid grid-cols-4 gap-1 bg-black/20 p-1 rounded-lg">
                              <AlignButton active={selectedBlock.style?.textAlign === "left"} icon={LucideIcons.AlignLeft} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "left" } })} />
                              <AlignButton active={selectedBlock.style?.textAlign === "center"} icon={LucideIcons.AlignCenter} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "center" } })} />
                              <AlignButton active={selectedBlock.style?.textAlign === "right"} icon={LucideIcons.AlignRight} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "right" } })} />
                              <AlignButton active={selectedBlock.style?.textAlign === "justify"} icon={LucideIcons.AlignJustify} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "justify" } })} />
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center text-[9px] font-bold text-white/50 uppercase">
                                <Label>Base Scale</Label>
                                <span>{selectedBlock.style?.fontSize || 16}px</span>
                              </div>
                              <Slider value={[selectedBlock.style?.fontSize || 16]} min={8} max={100} onValueChange={([v]) => updateBlock(selectedBlock.id, { style: { fontSize: v } })} className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-indigo-600" />
                            </div>
                          </div>
                       </PropertySection>

                       <PropertySection label="Box Model" icon={MoveVertical}>
                         <div className="space-y-4">
                           <div className="space-y-2">
                             <Label className="text-[9px] uppercase font-bold text-white/40">Padding Overrides</Label>
                             <div className="grid grid-cols-2 gap-2">
                               <div className="flex items-center bg-black/20 rounded-lg px-2 py-1 gap-2 border border-white/5">
                                 <ArrowUp className="w-2.5 h-2.5 text-white/20" />
                                 <Input type="number" placeholder="0" value={selectedBlock.style?.paddingTop ?? ""} onChange={(e) => updateBlock(selectedBlock.id, { style: { paddingTop: e.target.value === "" ? undefined : Number(e.target.value) } })} className="h-6 bg-transparent border-none p-0 text-[10px] text-white focus-visible:ring-0" />
                               </div>
                               <div className="flex items-center bg-black/20 rounded-lg px-2 py-1 gap-2 border border-white/5">
                                 <ArrowDown className="w-2.5 h-2.5 text-white/20" />
                                 <Input type="number" placeholder="0" value={selectedBlock.style?.paddingBottom ?? ""} onChange={(e) => updateBlock(selectedBlock.id, { style: { paddingBottom: e.target.value === "" ? undefined : Number(e.target.value) } })} className="h-6 bg-transparent border-none p-0 text-[10px] text-white focus-visible:ring-0" />
                               </div>
                               <div className="flex items-center bg-black/20 rounded-lg px-2 py-1 gap-2 border border-white/5">
                                 <ArrowLeftIcon className="w-2.5 h-2.5 text-white/20" />
                                 <Input type="number" placeholder="0" value={selectedBlock.style?.paddingLeft ?? ""} onChange={(e) => updateBlock(selectedBlock.id, { style: { paddingLeft: e.target.value === "" ? undefined : Number(e.target.value) } })} className="h-6 bg-transparent border-none p-0 text-[10px] text-white focus-visible:ring-0" />
                               </div>
                               <div className="flex items-center bg-black/20 rounded-lg px-2 py-1 gap-2 border border-white/5">
                                 <ArrowRightIcon className="w-2.5 h-2.5 text-white/20" />
                                 <Input type="number" placeholder="0" value={selectedBlock.style?.paddingRight ?? ""} onChange={(e) => updateBlock(selectedBlock.id, { style: { paddingRight: e.target.value === "" ? undefined : Number(e.target.value) } })} className="h-6 bg-transparent border-none p-0 text-[10px] text-white focus-visible:ring-0" />
                               </div>
                             </div>
                           </div>
                         </div>
                       </PropertySection>
                       
                       <PropertySection label="Visuals" icon={Palette}>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-[9px] uppercase font-bold text-white/40">Ink Color</Label>
                              <Input type="color" value={selectedBlock.style?.textColor || pageStyle.textColor} onChange={(e) => updateBlock(selectedBlock.id, { style: { textColor: e.target.value } })} className="h-8 w-full p-1 rounded-lg cursor-pointer border-none bg-black/20" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[9px] uppercase font-bold text-white/40">Paper Color</Label>
                              <Input type="color" value={selectedBlock.style?.backgroundColor || "#FFFFFF"} onChange={(e) => updateBlock(selectedBlock.id, { style: { backgroundColor: e.target.value } })} className="h-8 w-full p-1 rounded-lg cursor-pointer border-none bg-black/20" />
                            </div>
                          </div>
                       </PropertySection>

                       <PropertySection label="Runtime State" icon={Eye}>
                         <div className="space-y-2">
                            <div className="flex items-center justify-between p-2.5 bg-black/10 rounded-lg border border-white/5">
                              <div className="flex items-center gap-2">
                                <Monitor className="w-3 h-3 text-white/40" />
                                <span className="text-[10px] font-bold text-white/70 uppercase">Disable Desktop</span>
                              </div>
                              <input type="checkbox" checked={!!selectedBlock.style?.hideDesktop} onChange={(e) => updateBlock(selectedBlock.id, { style: { hideDesktop: e.target.checked } })} />
                            </div>
                            <div className="flex items-center justify-between p-2.5 bg-black/10 rounded-lg border border-white/5">
                              <div className="flex items-center gap-2">
                                <Smartphone className="w-3 h-3 text-white/40" />
                                <span className="text-[10px] font-bold text-white/70 uppercase">Disable Mobile</span>
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
               <div className="px-4 py-3 bg-black/20 border-b border-white/5 flex items-center gap-2 shrink-0">
                  <Paintbrush className="w-4 h-4 text-indigo-400" />
                  <span className="font-headline font-bold text-[10px] uppercase tracking-wider text-white">Global Aesthetic</span>
               </div>
               <ScrollArea className="flex-1 min-h-0">
                  <div className="p-4 space-y-6 pb-20">
                     <PropertySection label="Identity Tiers" icon={Layers}>
                        <div className="space-y-3">
                           <div className="grid grid-cols-4 gap-1.5">
                              {THEMES.map(t => (
                                <button 
                                  key={t.id} 
                                  onClick={() => handleApplyTheme(t)}
                                  className={cn(
                                    "flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all",
                                    pageStyle.themeId === t.id ? "bg-indigo-600 text-white border-indigo-500 shadow-xl" : "bg-black/20 text-white/30 border-transparent hover:bg-black/30"
                                  )}
                                >
                                   <t.icon className="w-3.5 h-3.5" />
                                   <span className="text-[7px] font-black uppercase truncate w-full text-center">{t.name.split(' ')[0]}</span>
                                </button>
                              ))}
                           </div>
                           <p className="text-[8px] text-white/30 leading-relaxed text-center px-1">Applying an identity tier resets core layout colors.</p>
                        </div>
                     </PropertySection>

                     <PropertySection label="Core Swatches" icon={Palette}>
                        <div className="space-y-4">
                           <div className="space-y-1.5">
                              <Label className="text-[9px] uppercase font-bold text-white/40">Global Paper</Label>
                              <Input type="color" value={pageStyle.backgroundColor || "#FFFFFF"} onChange={(e) => setPageStyle({...pageStyle, backgroundColor: e.target.value})} className="h-8 w-full p-1 rounded-lg cursor-pointer border-none bg-black/20" />
                           </div>
                           <div className="space-y-1.5">
                              <Label className="text-[9px] uppercase font-bold text-white/40">Global Ink</Label>
                              <Input type="color" value={pageStyle.textColor || "#0F172A"} onChange={(e) => setPageStyle({...pageStyle, textColor: e.target.value})} className="h-8 w-full p-1 rounded-lg cursor-pointer border-none bg-black/20" />
                           </div>
                           <div className="space-y-1.5">
                              <Label className="text-[9px] uppercase font-bold text-white/40">Signature Tint</Label>
                              <Input type="color" value={pageStyle.primaryColor || "#145DCC"} onChange={(e) => setPageStyle({...pageStyle, primaryColor: e.target.value})} className="h-8 w-full p-1 rounded-lg cursor-pointer border-none bg-black/20" />
                           </div>
                           <div className="space-y-1.5">
                              <Label className="text-[9px] uppercase font-bold text-white/40">Wallpaper Asset</Label>
                              <CloudinaryUpload value={pageStyle.backgroundImage || ""} onUpload={(url) => setPageStyle({...pageStyle, backgroundImage: url})} onRemove={() => setPageStyle({...pageStyle, backgroundImage: ""})} />
                           </div>
                        </div>
                     </PropertySection>

                     <PropertySection label="Canvas Rhythm" icon={MoveVertical}>
                        <div className="space-y-6">
                           <div className="space-y-3">
                              <div className="flex justify-between items-center text-[9px] font-bold text-white/40 uppercase">
                                 <Label>Vertical Breathing</Label>
                                 <span>{pageStyle.paddingTop}px</span>
                              </div>
                              <Slider value={[pageStyle.paddingTop || 0]} min={0} max={200} step={4} onValueChange={([v]) => setPageStyle({...pageStyle, paddingTop: v, paddingBottom: v})} className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-indigo-600" />
                           </div>
                        </div>
                     </PropertySection>
                  </div>
               </ScrollArea>
            </div>
          )}
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-white/5 bg-black/10 shrink-0">
          <Button className="w-full h-12 rounded-2xl font-black text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition-all hover:scale-[1.02] shadow-xl shadow-indigo-600/20" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Publish Design
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col h-full bg-slate-50/50">
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="bg-slate-900 text-white border-none shadow-lg hover:bg-slate-800" />
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
              <Eye className="w-3.5 h-3.5 mr-1.5" /> Live Preview
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center items-start" onClick={() => setSelectedBlockId(null)}>
          <div 
            className={cn(
               "transition-all duration-700 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden",
               viewMode === "mobile" ? "w-full max-w-[375px] rounded-[48px] border-[12px] border-slate-900 ring-[16px] ring-white/20" : "max-w-6xl w-full rounded-2xl"
            )}
            style={{
               backgroundColor: pageStyle.backgroundColor || "#FFFFFF",
               backgroundImage: pageStyle.backgroundImage ? `url(${pageStyle.backgroundImage})` : 'none',
               backgroundSize: 'cover',
               backgroundPosition: 'center',
               paddingTop: `${pageStyle.paddingTop || 40}px`,
               paddingBottom: `${pageStyle.paddingBottom || 40}px`,
               minHeight: '100%',
               color: pageStyle.textColor
            }}
          >
            <div className="py-8 group/canvas">
              {blocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-48 gap-4 opacity-5 filter grayscale">
                  <LayoutGrid className="w-24 h-24" />
                  <h3 className="text-3xl font-headline font-black tracking-tighter uppercase">Canvas Ready</h3>
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
                          isBuilder={true}
                          onSelect={handleSelectBlock}
                          onRemove={removeBlock}
                          onMoveUp={(id?: string) => moveBlock(id || block.id, 'up')}
                          onMoveDown={(id?: string) => moveBlock(id || block.id, 'down')}
                          onInsertRequest={onInsertRequest}
                          viewMode={viewMode}
                          onAddNested={(parentId: string, colIdx?: number) => {
                            onAddNestedRequest(parentId, colIdx);
                          }}
                          pageStyle={pageStyle}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeDragId ? (
                      <div className="opacity-50 pointer-events-none scale-105 transition-transform bg-white rounded-xl p-6 shadow-2xl border-2 border-indigo-600">
                        <span className="font-black uppercase text-xs tracking-widest">{findBlockById(blocks, activeDragId)?.type} Node</span>
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
                      className="h-14 w-14 rounded-full border-2 border-indigo-600/20 text-indigo-600 shadow-2xl hover:scale-110 active:scale-95 transition-all bg-white group"
                      onClick={() => { setActiveParentId(null); setInsertInfo(null); setActiveColumnIndex(null); }}
                    >
                      <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-500" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent 
                    className="max-w-xl rounded-[40px] p-0 border-none overflow-hidden shadow-2xl"
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    <DialogHeader className="p-6 bg-slate-900 text-white">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20"><PlusCircle className="w-6 h-6" /></div>
                        <div>
                          <DialogTitle className="text-xl font-headline font-black uppercase tracking-tight">Widget Repository</DialogTitle>
                          <DialogDescription className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em]">
                            {insertInfo ? `Inserting ${insertInfo.position} node` : activeColumnIndex !== null ? `Injecting into Column ${activeColumnIndex + 1}` : "Deploying node to base layout"}
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>
                    <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/50 max-h-[60vh] overflow-y-auto">
                      <WidgetGridButton icon={Menu} label="Global Navbar" onClick={() => handleAddBlock("navbar")} highlight />
                      <WidgetGridButton icon={Rocket} label="Conversion Hero" onClick={() => handleAddBlock("ultra-hero")} highlight />
                      <WidgetGridButton icon={LayoutList} label="Rich Story" onClick={() => handleAddBlock("rich-text")} highlight />
                      <WidgetGridButton icon={ShoppingCart} label="Direct Checkout" onClick={() => handleAddBlock("product-order-form")} highlight />
                      <WidgetGridButton icon={Quote} label="Citation Node" onClick={() => handleAddBlock("quote")} highlight />
                      <WidgetGridButton icon={Square} label="Sticker Card" onClick={() => handleAddBlock("card")} highlight />
                      <WidgetGridButton icon={Type} label="Main Header" onClick={() => handleAddBlock("header")} />
                      <WidgetGridButton icon={List} label="Base Text" onClick={() => handleAddBlock("paragraph")} />
                      <WidgetGridButton icon={ImageIcon} label="Asset Box" onClick={() => handleAddBlock("image")} />
                      <WidgetGridButton icon={Monitor} label="Global Button" onClick={() => handleAddBlock("button")} />
                      {(!activeParentId || findBlockById(blocks, activeParentId)?.type !== "row") && (
                        <WidgetGridButton icon={Columns} label="Grid Scaffold" onClick={() => handleAddBlock("row")} />
                      )}
                      <WidgetGridButton icon={Layout} label="Asset Slider" onClick={() => handleAddBlock("carousel")} />
                      <WidgetGridButton icon={CheckCircle} label="Checked Registry" onClick={() => handleAddBlock("checked-list")} />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[100vw] w-full h-[100vh] p-0 rounded-none border-none bg-slate-50 flex flex-col overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Page Preview</DialogTitle>
            <DialogDescription>Visualizing the landing page as seen by customers.</DialogDescription>
          </DialogHeader>
          <header className="flex h-16 items-center justify-between px-8 border-b bg-white z-50 shadow-sm shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/10">
                <Eye className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-headline font-black uppercase tracking-widest">Global Production Preview</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsPreviewOpen(false)} className="rounded-full h-10 w-10 hover:bg-slate-100"><X className="w-6 h-6" /></Button>
          </header>
          
          <div className="flex-1 overflow-y-auto bg-slate-100/30 flex justify-center p-4 sm:p-10">
            <div 
               className={cn(
                  "shadow-2xl transition-all duration-700 min-h-full py-0 bg-white",
                  viewMode === "mobile" ? "w-full max-w-[375px] rounded-[48px] border-[12px] border-slate-900" : "max-w-6xl w-full rounded-2xl"
               )}
               style={{
                  backgroundColor: pageStyle.backgroundColor || "#FFFFFF",
                  backgroundImage: pageStyle.backgroundImage ? `url(${pageStyle.backgroundImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  paddingTop: `${pageStyle.paddingTop || 40}px`,
                  paddingBottom: `${pageStyle.paddingBottom || 40}px`,
                  color: pageStyle.textColor
               }}
            >
              <div className="h-full">
                {blocks.map(block => <BlockRenderer key={block.id} block={block} products={products} store={store} isPreview viewMode={viewMode} selectedBlockId={selectedBlockId} pageStyle={pageStyle} />)}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
