
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
  Flame, Leaf, Moon, Sun, Quote, Rocket, Menu, PlayCircle, Code, ShieldCheck
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
import { cn } from "@/lib/utils";
import { Block, BlockType, PageStyle } from "../builder/[pageId]/types";
import { PropertySection, WidgetGridButton } from "../builder/[pageId]/components";
import { PropertyEditor } from "../builder/[pageId]/property-editor";
import { CanvasBlockWrapper, BlockRenderer } from "../builder/[pageId]/block-renderer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const SAM_NATURAL_TEMPLATE: Block[] = [
  {
    id: "marquee-top",
    type: "marquee",
    content: { items: ["🌿 সারাদেশে ফ্রি হোম ডেলিভারি", "✅ BSTI অনুমোদিত", "🔬 BCSIR ল্যাব টেস্টেড", "💰 ক্যাশ অন ডেলিভারি"] },
    style: { paddingTop: 10, paddingBottom: 10, backgroundColor: "#c9a227", textColor: "#1a1a1a" }
  },
  {
    id: "hero-sam",
    type: "ultra-hero",
    content: { 
      badgeText: "BSTI অনুমোদিত • BCSIR ল্যাব টেস্টেড", 
      title: "অসুস্থ ব্যক্তি ছাড়া [সুস্থতার মূল্য] কেউ বোঝে না", 
      subtitle: "শক্তি ও সুস্বাস্থ্যের নির্ভরযোগ্য উপহার",
      brandTitle: "সাম",
      brandSubtitle: "প্রাকৃতিক স্বাস্থ্য সুরক্ষা",
      ctaText: "⬇ এখানে অর্ডার করুন",
      ctaLink: "[checkout]",
      phoneText: "01621-611589",
      phoneLink: "tel:01621611589",
      badgeColor: "#c9a227",
      titleColor: "#f5e9c4",
      subtitleColor: "#e8c547",
      brandTitleColor: "#1a4a1a",
      brandSubtitleColor: "#6b3a1f",
      trustItems: [
        { iconName: "CheckCircle", label: "✅ BSTI অনুমোদিত" },
        { iconName: "Microscope", label: "🔬 ল্যাব টেস্টেড" },
        { iconName: "Truck", label: "🚚 ফ্রি ডেলিভারি" },
        { iconName: "RotateCcw", label: "↩️ সহজ রিফান্ড" }
      ]
    },
    style: { animation: "fadeIn" }
  },
  {
    id: "intro-pill",
    type: "header",
    content: { text: '"সাম" – প্রাকৃতিক স্বাস্থ্য সুরক্ষার অনন্য ফর্মুলা', level: "h3" },
    style: { textAlign: "center", backgroundColor: "#c9a227", textColor: "#1a1a1a", borderRadius: 40, paddingTop: 12, paddingBottom: 12, paddingLeft: 24, paddingRight: 24, fontSize: 14, marginTop: 40, marginBottom: 10, animation: "slideUp" }
  },
  {
    id: "benefits-grid",
    type: "row",
    content: { columns: 2 },
    children: [
      { id: "h-1", type: "card", content: { title: "হার্টের সমস্যা", subtitle: "হার্ট ব্লক বা হার্টের সমস্যায় মহাঔষধ", iconName: "Heart", showIcon: true, layout: "horizontal", iconColor: "#c0392b" }, style: { columnIndex: 0, backgroundColor: "#ffffff", borderRadius: 12, borderStyle: "solid", borderWidth: 4, borderColor: "#4a9c3f", animation: "slideUp" } },
      { id: "h-2", type: "card", content: { title: "উচ্চ রক্তচাপ", subtitle: "হাই প্রেশারের প্রাকৃতিক সমাধান", iconName: "Droplets", showIcon: true, layout: "horizontal", iconColor: "#c9a227" }, style: { columnIndex: 1, backgroundColor: "#ffffff", borderRadius: 12, borderStyle: "solid", borderWidth: 4, borderColor: "#4a9c3f", animation: "slideUp" } }
    ]
  },
  {
    id: "order-form",
    type: "product-order-form",
    content: { productIds: [] },
    style: { paddingTop: 60, paddingBottom: 60, animation: "fadeIn" }
  }
];

export default function SectionManager() {
  return (
    <SidebarProvider defaultOpen={true}>
      <SectionManagerInner />
    </SidebarProvider>
  );
}

function SectionManagerInner() {
  const { subdomain } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { setOpenMobile, isMobile } = useSidebar();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageId, setPageId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [store, setStore] = useState<any>(null);
  const [pageStyle, setPageStyle] = useState<PageStyle>({
    backgroundColor: "#fdf6e3",
    textColor: "#1a1a1a",
    primaryColor: "#1a4a1a",
    themeId: "laam",
    paddingTop: 0,
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
  const [insertInfo, setInsertInfo] = useState<{ id: string, position: 'before' | 'after' } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (firestore && subdomain) {
      fetchMainPage();
    }
  }, [subdomain, firestore]);

  const fetchMainPage = async () => {
    setLoading(true);
    try {
      const storeQ = query(collection(firestore!, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQ);
      if (storeSnap.empty) {
        setLoading(false);
        return;
      }
      const storeData = { id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() };
      setStore(storeData);

      // Find or create "index" page
      const pageQ = query(collection(firestore!, "pages"), where("storeId", "==", storeData.id), where("slug", "==", "index"));
      const pageSnap = await getDocs(pageQ);

      if (!pageSnap.empty) {
        const p = pageSnap.docs[0];
        setPageId(p.id);
        const data = p.data();
        setBlocks(data.config || []);
        if (data.pageStyle) setPageStyle(data.pageStyle);
      } else {
        // Create default page with template
        const newPageRef = doc(collection(firestore!, "pages"));
        const defaultData = {
          storeId: storeData.id,
          ownerId: storeData.ownerId,
          title: "Main Landing Page",
          slug: "index",
          config: SAM_NATURAL_TEMPLATE,
          pageStyle: pageStyle,
          createdAt: serverTimestamp()
        };
        await setDoc(newPageRef, defaultData);
        setPageId(newPageRef.id);
        setBlocks(SAM_NATURAL_TEMPLATE);
      }

      const prodQ = query(collection(firestore!, "products"), where("storeId", "==", storeData.id));
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
    const pageRef = doc(firestore!, "pages", pageId);
    
    updateDoc(pageRef, { 
      config: blocks, 
      pageStyle: pageStyle,
      updatedAt: serverTimestamp() 
    })
      .then(() => {
        toast({ title: "Section Matrix Saved!", description: "High-conversion structure is live." });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: pageRef.path,
          operation: 'update',
          requestResourceData: { config: blocks, pageStyle },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setSaving(false));
  };

  const handleAddBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: {}, // Initial content logic usually goes here
      style: { textAlign: "left", animation: "none", columnIndex: activeColumnIndex ?? 0 },
      children: type === "row" ? [] : undefined
    };

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
    setActiveDragId(null);
    if (!over || active.id === over.id) return;
    const reorderRecursive = (items: Block[]): Block[] => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) return arrayMove(items, oldIndex, newIndex);
      return items.map(item => item.children ? { ...item, children: reorderRecursive(item.children) } : item);
    };
    setBlocks(prev => reorderRecursive(prev));
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900"><Loader2 className="animate-spin text-white w-12 h-12" /></div>;

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden text-slate-100 select-none">
      <Sidebar collapsible="offcanvas" className="border-r-0 bg-slate-900 text-white shadow-2xl">
        <SidebarHeader className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><Layers className="w-6 h-6" /></div>
            <div>
              <span className="block font-headline font-black text-sm uppercase tracking-tight">Section Manager</span>
              <span className="text-[8px] text-white/40 font-bold uppercase tracking-widest block">v3.0 Ultra</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0">
          {selectedBlockId ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-4 py-3 bg-black/20 border-b border-white/5 flex items-center justify-between">
                <span className="font-headline font-bold text-[10px] uppercase tracking-wider text-indigo-400">Configure Section</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-rose-400" onClick={() => removeBlock(selectedBlockId)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
              <Tabs value={sidebarTab} onValueChange={(v: any) => setSidebarTab(v)} className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="w-full bg-black/10 border-b border-white/10 rounded-none h-10 p-0">
                  <TabsTrigger value="edit" className="flex-1 font-bold text-[9px] uppercase tracking-widest">Content</TabsTrigger>
                  <TabsTrigger value="advanced" className="flex-1 font-bold text-[9px] uppercase tracking-widest">Design</TabsTrigger>
                </TabsList>
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-6 pb-20">
                    <TabsContent value="edit" className="mt-0">
                      {blocks.find(b => b.id === selectedBlockId) && (
                        <PropertyEditor 
                          block={blocks.find(b => b.id === selectedBlockId)!} 
                          products={products} 
                          onChange={(u: any) => updateBlock(selectedBlockId, u)} 
                        />
                      )}
                    </TabsContent>
                    <TabsContent value="advanced" className="mt-0">
                       <PropertySection label="Motion Effects" icon={Zap}>
                          <PropertyEditor block={blocks.find(b => b.id === selectedBlockId)!} products={products} onChange={(u: any) => updateBlock(selectedBlockId, u)} />
                       </TabsContent>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>
            </div>
          ) : (
            <div className="p-6 text-center space-y-4 opacity-40 grayscale filter mt-20">
               <MousePointer2 className="w-12 h-12 mx-auto" />
               <p className="text-[10px] font-black uppercase tracking-widest">Select a section to begin orchestration</p>
            </div>
          )}
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-white/5 bg-black/10">
          <Button className="w-full h-12 rounded-2xl font-black text-xs bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />} Publish Landing Page
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-slate-950 flex flex-col overflow-hidden">
         <header className="h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-8 z-30">
            <div className="flex items-center gap-4">
               <SidebarTrigger className="text-slate-400" />
               <div className="h-5 w-px bg-white/5" />
               <div className="flex items-center gap-2">
                  <Button variant={viewMode === 'desktop' ? 'secondary' : 'ghost'} size="sm" className="h-8 rounded-lg font-bold text-[10px] uppercase" onClick={() => setViewMode('desktop')}><Monitor className="w-3.5 h-3.5 mr-1.5" /> Desktop</Button>
                  <Button variant={viewMode === 'mobile' ? 'secondary' : 'ghost'} size="sm" className="h-8 rounded-lg font-bold text-[10px] uppercase" onClick={() => setViewMode('mobile')}><Smartphone className="w-3.5 h-3.5 mr-1.5" /> Mobile</Button>
               </div>
            </div>
            <Button variant="outline" size="sm" className="bg-white/5 border-white/10 rounded-lg text-white font-bold text-[10px] uppercase tracking-widest" onClick={() => setIsPreviewOpen(true)}><Eye className="w-3.5 h-3.5 mr-1.5" /> Live Preview</Button>
         </header>

         <div className="flex-1 overflow-y-auto p-4 sm:p-10 flex justify-center items-start" onClick={() => setSelectedBlockId(null)}>
            <div 
               className={cn(
                  "transition-all duration-700 shadow-2xl relative bg-white min-h-[90vh]",
                  viewMode === 'mobile' ? 'w-[375px] rounded-[48px] border-[12px] border-slate-900 ring-[16px] ring-white/5' : 'w-full max-w-5xl rounded-3xl'
               )}
               style={{ backgroundColor: pageStyle.backgroundColor, color: pageStyle.textColor, paddingTop: pageStyle.paddingTop, paddingBottom: pageStyle.paddingBottom }}
            >
               <div className="py-0">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveDragId(e.active.id as string)} onDragEnd={handleDragEnd}>
                     <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                        {blocks.map(block => (
                           <CanvasBlockWrapper 
                              key={block.id} 
                              block={block} 
                              products={products} 
                              store={store} 
                              isSelected={selectedBlockId === block.id}
                              onSelect={(id: string) => setSelectedBlockId(id)}
                              onRemove={removeBlock}
                              onMoveUp={() => moveBlock(block.id, 'up')}
                              onMoveDown={() => moveBlock(block.id, 'down')}
                              onInsertRequest={(id: string, pos: 'before' | 'after') => { setInsertInfo({ id, position: pos }); setIsComponentDialogOpen(true); }}
                              viewMode={viewMode}
                              pageStyle={pageStyle}
                              isBuilder
                           />
                        ))}
                     </SortableContext>
                  </DndContext>

                  <div className="flex justify-center py-12 border-t border-dashed border-slate-100 mt-8">
                     <Dialog open={isComponentDialogOpen} onOpenChange={setIsComponentDialogOpen}>
                        <DialogTrigger asChild>
                           <Button variant="outline" className="h-14 w-14 rounded-full border-2 border-indigo-600/20 text-indigo-600 shadow-2xl hover:scale-110 active:scale-95 bg-white"><Plus className="w-8 h-8" /></Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl rounded-[40px] p-0 border-none overflow-hidden bg-slate-50 shadow-2xl">
                           <DialogHeader className="p-6 bg-slate-900 text-white">
                              <DialogTitle className="text-xl font-headline font-black uppercase">Section Repository</DialogTitle>
                           </DialogHeader>
                           <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
                              <WidgetGridButton icon={Menu} label="Global Navbar" onClick={() => handleAddBlock("navbar")} highlight />
                              <WidgetGridButton icon={Rocket} label="Conversion Hero" onClick={() => handleAddBlock("ultra-hero")} highlight />
                              <WidgetGridButton icon={ShoppingCart} label="Order Console" onClick={() => handleAddBlock("product-order-form")} highlight />
                              <WidgetGridButton icon={Zap} label="Trust Marquee" onClick={() => handleAddBlock("marquee")} />
                              <WidgetGridButton icon={LayoutGrid} label="Benefit Cards" onClick={() => handleAddBlock("card")} />
                              <WidgetGridButton icon={Type} label="Headline" onClick={() => handleAddBlock("header")} />
                              <WidgetGridButton icon={CheckCircle} label="Checked List" onClick={() => handleAddBlock("checked-list")} />
                              <WidgetGridButton icon={PlayCircle} label="Visual Player" onClick={() => handleAddBlock("video")} />
                              <WidgetGridButton icon={Code} label="Code Node" onClick={() => handleAddBlock("code")} />
                              <WidgetGridButton icon={ShieldCheck} label="Brand Footer" onClick={() => handleAddBlock("footer")} />
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
                  className={cn("bg-white shadow-2xl min-h-full", viewMode === 'mobile' ? 'w-[375px] rounded-[48px] border-[12px] border-slate-900' : 'w-full max-w-5xl rounded-3xl')}
                  style={{ backgroundColor: pageStyle.backgroundColor, color: pageStyle.textColor, paddingTop: pageStyle.paddingTop, paddingBottom: pageStyle.paddingBottom }}
               >
                  {blocks.map(block => <BlockRenderer key={block.id} block={block} products={products} store={store} isPreview viewMode={viewMode} pageStyle={pageStyle} />)}
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
