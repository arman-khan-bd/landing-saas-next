
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Save, Trash2, Image as ImageIcon,
  Type, Layout, List, CheckCircle, ShoppingCart,
  Loader2, ChevronDown, Monitor, Smartphone,
  Square, Eye, X, Columns, Settings2,
  ArrowLeft, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline, Palette, Layers, Box, MousePointer2,
  Star, Settings, Sparkles, Menu
} from "lucide-react";
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
    padding?: string;
    margin?: string;
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

export default function PageBuilder() {
  const { subdomain, pageId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageTitle, setPageTitle] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"edit" | "advanced">("edit");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isComponentDialogOpen, setIsComponentDialogOpen] = useState(false);

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

  const selectedBlock = useMemo(() => {
    if (!selectedBlockId) return null;
    return findBlockById(blocks, selectedBlockId);
  }, [selectedBlockId, blocks]);

  function findBlockById(items: Block[], id: string): Block | null {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findBlockById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  const createBlock = (type: BlockType): Block => {
    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: getInitialContent(type),
      style: {
        padding: "10px",
        margin: "0px",
        textAlign: "left",
        fontSize: 16,
        fontWeight: "400",
        borderStyle: "none",
        borderWidth: 0,
        borderRadius: 0,
        boxShadow: "none",
        animation: "none",
        hideDesktop: false,
        hideMobile: false
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
      default: return {};
    }
  };

  const handleAddBlock = (type: BlockType) => {
    const newBlock = createBlock(type);
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setSidebarTab("edit");
    setIsComponentDialogOpen(false);
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

  // Deep sanitize to prevent Firestore serialization errors
  const sanitizeForFirestore = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
    if (obj !== null && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, sanitizeForFirestore(v)])
      );
    }
    return obj;
  };

  const handleSave = () => {
    if (!pageId || !firestore) return;
    setSaving(true);
    const pageRef = doc(firestore, "pages", pageId as string);
    const sanitizedConfig = sanitizeForFirestore(blocks);
    
    updateDoc(pageRef, { config: sanitizedConfig, updatedAt: serverTimestamp() })
      .then(() => {
        toast({ title: "Project Published!", description: "Changes are live on your store." });
      })
      .catch((error) => {
        console.error(error);
        toast({ variant: "destructive", title: "Save failed", description: "Database rejected the request." });
      })
      .finally(() => setSaving(false));
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50/50 overflow-hidden text-slate-800 select-none">
        
        {/* --- BRANDED SIDEBAR --- */}
        <Sidebar collapsible="offcanvas" className="border-r-0 bg-primary text-primary-foreground shadow-2xl">
          <SidebarHeader className="p-6 border-b border-white/10 bg-black/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="block font-headline font-bold text-white text-sm tracking-tight">Designer Pro</span>
                  <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-0.5 block">iHut System</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => router.push(`/${subdomain}/builder`)} className="rounded-full text-white/50 hover:text-white hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-0">
            {selectedBlock ? (
              <div className="flex flex-col h-full">
                <div className="px-6 py-5 bg-black/20 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl text-white font-bold">
                      {getBlockIcon(selectedBlock.type)}
                    </div>
                    <span className="font-headline font-extrabold text-[11px] uppercase tracking-tighter text-white">Editing {selectedBlock.type}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-red-400 hover:bg-red-400/10" onClick={() => removeBlock(selectedBlock.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <Tabs value={sidebarTab} onValueChange={(v: any) => setSidebarTab(v)} className="flex-1 overflow-hidden flex flex-col">
                  <TabsList className="w-full bg-black/10 border-b border-white/10 rounded-none h-12 p-0">
                    <TabsTrigger value="edit" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent text-white/60 data-[state=active]:text-white font-bold text-[10px] uppercase tracking-widest h-full">Content</TabsTrigger>
                    <TabsTrigger value="advanced" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent text-white/60 data-[state=active]:text-white font-bold text-[10px] uppercase tracking-widest h-full">Style</TabsTrigger>
                  </TabsList>

                  <ScrollArea className="flex-1 px-6 py-8">
                    <TabsContent value="edit" className="mt-0 space-y-8 pb-10">
                      <PropertySection label="Configuration" icon={Box}>
                        <PropertyEditor block={selectedBlock} products={products} onChange={(u: any) => updateBlock(selectedBlock.id, u)} />
                      </PropertySection>
                    </TabsContent>

                    <TabsContent value="advanced" className="mt-0 space-y-8 pb-10">
                       <PropertySection label="Typography" icon={Type}>
                          <div className="space-y-6">
                            <div className="grid grid-cols-4 gap-1 bg-black/20 p-1 rounded-xl">
                              <AlignButton active={selectedBlock.style?.textAlign === "left"} icon={AlignLeft} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "left" } })} />
                              <AlignButton active={selectedBlock.style?.textAlign === "center"} icon={AlignCenter} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "center" } })} />
                              <AlignButton active={selectedBlock.style?.textAlign === "right"} icon={AlignRight} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "right" } })} />
                              <AlignButton active={selectedBlock.style?.textAlign === "justify"} icon={AlignJustify} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "justify" } })} />
                            </div>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center text-[10px] font-bold text-white/70">
                                <Label>Font Size</Label>
                                <span>{selectedBlock.style?.fontSize || 16}px</span>
                              </div>
                              <Slider value={[selectedBlock.style?.fontSize || 16]} min={8} max={100} onValueChange={([v]) => updateBlock(selectedBlock.id, { style: { fontSize: v } })} className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-primary" />
                            </div>
                          </div>
                       </PropertySection>
                       
                       <PropertySection label="Aesthetics" icon={Palette}>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] uppercase font-bold text-white/70">Text</Label>
                              <Input type="color" value={selectedBlock.style?.textColor || "#000000"} onChange={(e) => updateBlock(selectedBlock.id, { style: { textColor: e.target.value } })} className="h-10 w-full p-1 rounded-xl cursor-pointer border-none bg-black/20" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] uppercase font-bold text-white/70">Background</Label>
                              <Input type="color" value={selectedBlock.style?.backgroundColor || "#FFFFFF"} onChange={(e) => updateBlock(selectedBlock.id, { style: { backgroundColor: e.target.value } })} className="h-10 w-full p-1 rounded-xl cursor-pointer border-none bg-black/20" />
                            </div>
                          </div>
                       </PropertySection>

                       <PropertySection label="Responsive" icon={Eye}>
                         <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-black/10 rounded-2xl border border-white/5">
                              <div className="flex items-center gap-3">
                                <Monitor className="w-4 h-4 text-white/70" />
                                <span className="text-xs font-bold text-white/90">Hide on Desktop</span>
                              </div>
                              <Switch checked={!!selectedBlock.style?.hideDesktop} onCheckedChange={(v) => updateBlock(selectedBlock.id, { style: { hideDesktop: v } })} className="data-[state=checked]:bg-white data-[state=checked]:[&_span]:bg-primary" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-black/10 rounded-2xl border border-white/5">
                              <div className="flex items-center gap-3">
                                <Smartphone className="w-4 h-4 text-white/70" />
                                <span className="text-xs font-bold text-white/90">Hide on Mobile</span>
                              </div>
                              <Switch checked={!!selectedBlock.style?.hideMobile} onCheckedChange={(v) => updateBlock(selectedBlock.id, { style: { hideMobile: v } })} className="data-[state=checked]:bg-white data-[state=checked]:[&_span]:bg-primary" />
                            </div>
                         </div>
                       </PropertySection>
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-6 opacity-30">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                  <MousePointer2 className="w-10 h-10 text-white animate-pulse" />
                </div>
                <div>
                  <h4 className="font-headline font-bold text-sm tracking-widest uppercase text-white">Canvas Focus Mode</h4>
                  <p className="text-xs text-white/70 mt-2">Select any component on the builder to see settings here.</p>
                </div>
              </div>
            )}
          </SidebarContent>

          <SidebarFooter className="p-6 border-t border-white/10 bg-black/10">
            <Button className="w-full h-14 rounded-2xl font-bold text-base bg-white text-primary hover:bg-white/90 transition-all hover:scale-[1.02] shadow-xl" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="animate-spin w-5 h-5 mr-3" /> : <Save className="w-5 h-5 mr-3" />}
              Publish Page
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* --- MAIN BUILDER INSET --- */}
        <SidebarInset className="flex flex-col h-full bg-slate-50/30">
          <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shrink-0 z-30 sticky top-0">
            <div className="flex items-center gap-6">
              <SidebarTrigger className="bg-primary text-white border-none shadow-lg shadow-primary/20" />
              <div className="h-6 w-px bg-slate-200 hidden md:block" />
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                <Button variant={viewMode === "desktop" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("desktop")} className="rounded-lg h-9 px-4 font-bold text-[10px] uppercase tracking-wider">
                  <Monitor className="w-4 h-4 mr-2" /> Desktop
                </Button>
                <Button variant={viewMode === "mobile" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("mobile")} className="rounded-lg h-9 px-4 font-bold text-[10px] uppercase tracking-wider">
                  <Smartphone className="w-4 h-4 mr-2" /> Mobile
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="outline" className="rounded-xl px-6 h-11 font-bold text-xs bg-white border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => setIsPreviewOpen(true)}>
                <Eye className="w-4 h-4 mr-2" /> Full Preview
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 lg:p-14 flex justify-center items-start custom-scrollbar-minimal">
            <div className={cn(
              "transition-all duration-700 bg-white min-h-[100%] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] relative rounded-3xl overflow-hidden",
              viewMode === "mobile" ? "w-full max-w-[420px] rounded-[60px] border-[14px] border-slate-900 ring-[20px] ring-white/10" : "max-w-6xl w-full"
            )}>
              <div className="py-20 group/canvas select-none">
                {blocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-60 gap-8 opacity-10 filter grayscale">
                    <Box className="w-32 h-32" />
                    <h3 className="text-5xl font-headline font-black tracking-tighter">EMPTY CANVAS</h3>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {blocks.map((block) => (
                      <CanvasBlockWrapper
                        key={block.id}
                        block={block}
                        products={products}
                        isSelected={selectedBlockId === block.id}
                        onSelect={() => setSelectedBlockId(block.id)}
                        onRemove={() => removeBlock(block.id)}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                )}

                {/* Unified Plus Button */}
                <div className="flex flex-col items-center justify-center py-20 mt-10 border-t border-dashed border-slate-100">
                  <Dialog open={isComponentDialogOpen} onOpenChange={setIsComponentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-20 w-20 rounded-full border-2 border-primary/20 text-primary shadow-2xl hover:scale-110 active:scale-95 transition-all bg-white group"
                      >
                        <Plus className="w-10 h-10 group-hover:rotate-90 transition-transform duration-500" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl rounded-[40px] p-0 border-none overflow-hidden shadow-2xl shadow-primary/20">
                      <DialogHeader className="p-8 bg-primary text-white">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <Plus className="w-7 h-7" />
                          </div>
                          <div>
                            <DialogTitle className="text-3xl font-headline font-bold">Add Component</DialogTitle>
                            <DialogDescription className="text-white/70">Transform your landing page with advanced widgets.</DialogDescription>
                          </div>
                        </div>
                      </DialogHeader>
                      <div className="p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-slate-50/50 max-h-[60vh] overflow-y-auto">
                        <WidgetGridButton icon={Type} label="Heading" onClick={() => handleAddBlock("header")} />
                        <WidgetGridButton icon={List} label="Text Block" onClick={() => handleAddBlock("paragraph")} />
                        <WidgetGridButton icon={ImageIcon} label="Visual Box" onClick={() => handleAddBlock("image")} />
                        <WidgetGridButton icon={Monitor} label="CTA Button" onClick={() => handleAddBlock("button")} />
                        <WidgetGridButton icon={Columns} label="Grid Row" onClick={() => handleAddBlock("row")} />
                        <WidgetGridButton icon={ShoppingCart} label="Order Pro" onClick={() => handleAddBlock("product-order-form")} highlight />
                        <WidgetGridButton icon={Layout} label="Carousel" onClick={() => handleAddBlock("carousel")} />
                        <WidgetGridButton icon={ChevronDown} label="Accordion" onClick={() => handleAddBlock("accordion")} />
                        <WidgetGridButton icon={CheckCircle} label="Checked List" onClick={() => handleAddBlock("checked-list")} />
                      </div>
                      <DialogFooter className="p-6 bg-white border-t border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center w-full">Select a widget to insert into canvas</p>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <p className="mt-6 text-[10px] font-bold text-slate-400 tracking-[0.4em] uppercase">Construct Section</p>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>

      {/* --- PREVIEW DIALOG --- */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[100vw] w-full h-[100vh] p-0 rounded-none border-none bg-slate-50 flex flex-col overflow-hidden">
          <header className="flex h-16 items-center justify-between px-10 border-b bg-white z-50 shadow-sm shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-headline font-bold tracking-tight">System High-Fidelity Preview</h2>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden sm:flex items-center gap-2 p-1 bg-slate-100 rounded-xl mr-6">
                <Button variant={viewMode === "desktop" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("desktop")} className="rounded-lg h-8 px-3 font-bold text-[9px] uppercase tracking-wider">Desktop</Button>
                <Button variant={viewMode === "mobile" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("mobile")} className="rounded-lg h-8 px-3 font-bold text-[9px] uppercase tracking-wider">Mobile</Button>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsPreviewOpen(false)} className="rounded-full hover:bg-slate-100"><X className="w-8 h-8" /></Button>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto bg-slate-100/30 flex justify-center p-4 md:p-12">
            <div className={cn(
              "bg-white shadow-[0_50px_150px_-30px_rgba(0,0,0,0.1)] transition-all duration-700 min-h-full py-10",
              viewMode === "mobile" ? "w-full max-w-[420px] rounded-[50px] border-[10px] border-slate-900" : "max-w-6xl w-full rounded-2xl"
            )}>
              {blocks.map(block => <BlockRenderer key={block.id} block={block} products={products} isPreview viewMode={viewMode} />)}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

// --- HELPER COMPONENTS ---

function WidgetGridButton({ icon: Icon, label, onClick, highlight = false }: any) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-[120px] flex-col gap-3 rounded-[32px] border-slate-200 bg-white hover:bg-primary/5 hover:border-primary/50 transition-all group overflow-hidden shadow-sm",
        highlight ? "border-primary/20 bg-primary/5 shadow-primary/5" : ""
      )}
    >
      <div className={cn(
        "p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300 shadow-inner",
        highlight ? "text-primary bg-white" : "text-slate-400 group-hover:text-primary bg-slate-50"
      )}>
        <Icon className="w-8 h-8" />
      </div>
      <span className={cn(
        "text-[10px] font-extrabold uppercase tracking-widest",
        highlight ? "text-primary" : "text-slate-500 group-hover:text-slate-900"
      )}>{label}</span>
    </Button>
  );
}

function AlignButton({ active, icon: Icon, onClick }: any) {
  return (
    <Button variant="ghost" onClick={onClick} className={cn("h-10 rounded-xl px-0", active ? "bg-white text-primary shadow-lg" : "text-white/40 hover:text-white")}>
      <Icon className="w-4 h-4" />
    </Button>
  );
}

function PropertySection({ label, icon: Icon, children }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-white group">
        <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="font-headline font-bold text-[10px] uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="bg-black/10 p-6 rounded-[32px] border border-white/5 space-y-6">
        {children}
      </div>
    </div>
  );
}

function CanvasBlockWrapper({ block, products, isSelected, onSelect, onRemove, viewMode }: any) {
  const isHidden = (viewMode === "desktop" && block.style?.hideDesktop) || (viewMode === "mobile" && block.style?.hideMobile);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={cn(
        "relative group/block transition-all duration-300 cursor-pointer min-h-[40px]",
        isSelected ? "ring-2 ring-primary ring-inset z-40 bg-primary/5" : "hover:bg-primary/5 border-b border-slate-50",
        isHidden ? "opacity-20 blur-[1px] grayscale" : ""
      )}
    >
      {isSelected && (
        <div className="absolute -top-10 left-0 flex items-center gap-2 bg-primary text-white rounded-t-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-bottom-2">
          <Layers className="w-3.5 h-3.5" />
          {block.type}
          <div className="ml-4 border-l border-white/20 pl-4">
            <Trash2 className="w-3.5 h-3.5 cursor-pointer hover:text-red-200" onClick={(e) => { e.stopPropagation(); onRemove(); }} />
          </div>
        </div>
      )}
      <BlockRenderer block={block} products={products} viewMode={viewMode} />
    </div>
  );
}

function PropertyEditor({ block, products, onChange }: any) {
  switch (block.type) {
    case "header":
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Header Text</Label>
            <Input value={block.content?.text || ""} onChange={(e) => onChange({ content: { text: e.target.value } })} className="rounded-xl h-11 border-none bg-black/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Scale</Label>
            <Select value={block.content?.level || "h2"} onValueChange={(v) => onChange({ content: { level: v } })}>
              <SelectTrigger className="rounded-xl h-11 border-none bg-black/20 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="h1">Level 1 Prestige</SelectItem>
                <SelectItem value="h2">Level 2 Hero</SelectItem>
                <SelectItem value="h3">Level 3 Subtitle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    case "paragraph":
      return (
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Narrative</Label>
          <Textarea value={block.content?.text || ""} onChange={(e) => onChange({ content: { text: e.target.value } })} className="rounded-2xl min-h-[150px] leading-relaxed border-none bg-black/20 text-white" />
        </div>
      );
    case "image":
      return (
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Visual Asset</Label>
          <CloudinaryUpload value={block.content?.url || ""} onUpload={(url) => onChange({ content: { url } })} onRemove={() => onChange({ content: { url: "" } })} />
        </div>
      );
    case "button":
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Action Label</Label>
            <Input value={block.content?.text || ""} onChange={(e) => onChange({ content: { text: e.target.value } })} className="rounded-xl h-11 border-none bg-black/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Target URL</Label>
            <Input value={block.content?.link || ""} onChange={(e) => onChange({ content: { link: e.target.value } })} className="rounded-xl h-11 border-none bg-black/20 text-white" />
          </div>
        </div>
      );
    case "product-order-form":
      return (
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Featured Product</Label>
          <Select value={block.content?.mainProductId || ""} onValueChange={(v) => onChange({ content: { mainProductId: v } })}>
            <SelectTrigger className="rounded-xl h-11 border-none bg-black/20 text-white"><SelectValue placeholder="Select Product" /></SelectTrigger>
            <SelectContent className="rounded-xl">
              {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    default:
      return <div className="text-[10px] text-white/40 italic text-center py-4 uppercase font-bold tracking-widest">Widget properties unavailable</div>;
  }
}

function BlockRenderer({ block, products, isPreview = false, viewMode = "desktop" }: any) {
  const isHidden = (viewMode === "desktop" && block.style?.hideDesktop) || (viewMode === "mobile" && block.style?.hideMobile);
  if (isHidden && isPreview) return null;

  const style: any = {
    padding: block.style?.padding || "0px",
    margin: block.style?.margin || "0px",
    textAlign: block.style?.textAlign as any,
    backgroundColor: block.style?.backgroundColor,
    color: block.style?.textColor,
    fontSize: block.style?.fontSize ? `${block.style.fontSize}px` : undefined,
    fontWeight: block.style?.fontWeight,
    borderRadius: block.style?.borderRadius ? `${block.style.borderRadius}px` : undefined,
  };

  switch (block.type) {
    case "row":
      return (
        <div style={style} className={cn("grid gap-8 px-10 max-w-6xl mx-auto py-10", `grid-cols-${block.content?.columns || 1}`)}>
          {block.children?.map((child: any) => <BlockRenderer key={child.id} block={child} products={products} isPreview={isPreview} viewMode={viewMode} />)}
        </div>
      );
    case "header":
      const Tag = block.content?.level || 'h2';
      const sizes: any = { h1: 'text-5xl md:text-7xl', h2: 'text-4xl md:text-5xl', h3: 'text-2xl md:text-3xl' };
      return <div style={style} className={cn("px-10 py-6 w-full font-headline font-bold leading-tight")}>
        <Tag className={sizes[Tag]}>{block.content?.text}</Tag>
      </div>;
    case "paragraph":
      return <div style={style} className="px-10 py-4 w-full leading-relaxed whitespace-pre-wrap text-lg opacity-80">{block.content?.text}</div>;
    case "image":
      return <div style={style} className="px-10 py-8 w-full">
        {block.content?.url && <img src={block.content.url} className="w-full h-auto shadow-2xl rounded-[40px]" alt="" />}
      </div>;
    case "button":
      return <div style={style} className="px-10 py-6 w-full">
        <Button size="lg" className="rounded-2xl px-16 h-16 font-black uppercase tracking-widest text-sm shadow-2xl transition-all hover:scale-105">{block.content?.text}</Button>
      </div>;
    case "product-order-form":
      const mainProd = products.find((p: any) => p.id === block.content?.mainProductId);
      return (
        <div style={style} className="px-10 w-full max-w-5xl mx-auto py-20 text-left">
          <Card className="rounded-[60px] shadow-2xl border-none overflow-hidden bg-white">
            <div className="bg-slate-900 text-white p-12 md:p-16 text-center">
              <h3 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tighter">SECURE ORDER</h3>
              <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-xs">Bank-Grade Encryption Channel</p>
            </div>
            <div className="p-10 md:p-16 space-y-12">
               {mainProd ? (
                 <div className="flex flex-col md:flex-row justify-between items-center p-8 bg-slate-50 rounded-[40px] border border-slate-100 gap-8">
                    <div className="flex items-center gap-8">
                      <img src={mainProd.featuredImage} className="w-24 h-24 rounded-3xl object-cover shadow-lg" />
                      <div>
                        <h4 className="text-2xl font-bold">{mainProd.name}</h4>
                        <p className="text-primary font-black text-4xl mt-1">${mainProd.currentPrice}</p>
                      </div>
                    </div>
                    <CheckCircle className="text-primary w-12 h-12" />
                 </div>
               ) : (
                 <div className="p-12 text-center border-2 border-dashed rounded-3xl opacity-20 font-bold tracking-widest">PRODUCT_UNSPECIFIED</div>
               )}
            </div>
          </Card>
        </div>
      );
    default: return null;
  }
}

function getBlockIcon(type: BlockType) {
  switch (type) {
    case "header": return <Type className="w-5 h-5" />;
    case "paragraph": return <List className="w-5 h-5" />;
    case "image": return <ImageIcon className="w-5 h-5" />;
    case "row": return <Columns className="w-5 h-5" />;
    case "button": return <Monitor className="w-5 h-5" />;
    case "product-order-form": return <ShoppingCart className="w-5 h-5" />;
    default: return <Square className="w-5 h-5" />;
  }
}
