
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
    // Advanced
    borderStyle?: "none" | "solid" | "dashed" | "dotted";
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
    boxShadow?: "none" | "sm" | "md" | "lg" | "xl";
    animation?: "none" | "fadeIn" | "slideUp" | "zoomIn";
    hideDesktop?: boolean;
    hideMobile?: boolean;
    // Specifics
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
  const [pageSlug, setPageSlug] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"elements" | "edit">("elements");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
        setPageSlug(data.slug || "");

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
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(prev => updateNestedBlock(prev, id, updates));
  };

  const updateNestedBlock = (items: Block[], id: string, updates: Partial<Block>): Block[] => {
    return items.map(item => {
      if (item.id === id) return { ...item, ...updates, style: { ...item.style, ...(updates.style || {}) }, content: { ...item.content, ...(updates.content || {}) } };
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

  const handleSave = () => {
    if (!pageId || !firestore) return;
    setSaving(true);
    const pageRef = doc(firestore, "pages", pageId as string);
    updateDoc(pageRef, { config: blocks, updatedAt: serverTimestamp() })
      .then(() => {
        toast({ title: "Page saved!", description: "Advanced configuration published." });
        setSaving(false);
      })
      .catch((error) => {
        console.error(error);
        toast({ variant: "destructive", title: "Save failed" });
        setSaving(false);
      });
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>;

  return (
    <div className="flex h-screen bg-white overflow-hidden text-slate-800 font-body select-none relative">
      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-6 right-6 z-[60] bg-primary text-white rounded-full shadow-2xl lg:hidden h-14 w-14 hover:bg-primary/90"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {/* --- ELEMENTOR ADVANCED SIDEBAR --- */}
      <aside className={cn(
        "w-[360px] h-full bg-white text-slate-800 z-50 flex flex-col shrink-0 shadow-[20px_0_40px_rgba(0,0,0,0.05)] transition-all duration-300 lg:static fixed top-0 left-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 overflow-hidden"
      )}>
        <div className="p-5 flex items-center justify-between bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="block font-headline font-bold text-slate-900 text-base leading-none tracking-tight">iHut Designer</span>
              <span className="text-[9px] text-primary font-bold uppercase tracking-widest mt-1 block">Pro Builder Mode</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => router.push(`/${subdomain}/builder`)} className="rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        <Tabs value={sidebarTab} onValueChange={(v: any) => setSidebarTab(v)} className="flex-1 flex flex-col overflow-hidden pt-2">
          <TabsList className="grid grid-cols-2 p-1 bg-slate-100 mx-4 rounded-xl shrink-0 h-11">
            <TabsTrigger value="elements" className="rounded-lg font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Widgets
            </TabsTrigger>
            <TabsTrigger value="edit" className="rounded-lg font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm" disabled={!selectedBlockId}>
              <Settings2 className="w-4 h-4 mr-2" /> Controls
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="px-1 mt-4 pb-20">
              <TabsContent value="elements" className="mt-0 px-4 space-y-6">
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest px-2">Basic Elements</p>
                  <div className="grid grid-cols-2 gap-2">
                    <WidgetButton icon={Type} label="Heading" onClick={() => handleAddBlock("header")} />
                    <WidgetButton icon={List} label="Text Block" onClick={() => handleAddBlock("paragraph")} />
                    <WidgetButton icon={ImageIcon} label="Image Box" onClick={() => handleAddBlock("image")} />
                    <WidgetButton icon={Monitor} label="CTA Button" onClick={() => handleAddBlock("button")} />
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest px-2">Layout & Commerce</p>
                  <div className="grid grid-cols-2 gap-2">
                    <WidgetButton icon={Columns} label="Grid Row" onClick={() => handleAddBlock("row")} />
                    <WidgetButton icon={ShoppingCart} label="Order Pro" onClick={() => handleAddBlock("product-order-form")} highlight />
                    <WidgetButton icon={Layout} label="Carousel" onClick={() => handleAddBlock("carousel")} />
                    <WidgetButton icon={ChevronDown} label="Accordion" onClick={() => handleAddBlock("accordion")} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="edit" className="mt-0">
                {selectedBlock ? (
                  <div className="flex flex-col animate-in fade-in duration-500">
                    <div className="px-5 py-4 bg-slate-50 border-y border-slate-100 flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary font-bold shadow-sm shadow-primary/5">
                          {getBlockIcon(selectedBlock.type)}
                        </div>
                        <span className="font-headline font-extrabold text-slate-800 text-xs uppercase tracking-tighter">Editing {selectedBlock.type}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded shadow-sm">ID: {selectedBlock.id}</span>
                    </div>

                    <Tabs defaultValue="content" className="w-full">
                      <TabsList className="w-full bg-slate-50 border-b border-slate-100 rounded-none h-12 px-0 gap-0">
                        <TabsTrigger value="content" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary font-bold text-[9px] uppercase tracking-widest py-4">Content</TabsTrigger>
                        <TabsTrigger value="style" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary font-bold text-[9px] uppercase tracking-widest py-4">Style</TabsTrigger>
                        <TabsTrigger value="advanced" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary font-bold text-[9px] uppercase tracking-widest py-4">Advanced</TabsTrigger>
                      </TabsList>

                      <div className="px-4 py-6">
                        <TabsContent value="content" className="mt-0 space-y-6 px-1">
                          <PropertySection label="Primary Settings" icon={Box}>
                            <PropertyEditor block={selectedBlock} products={products} onChange={(u) => updateBlock(selectedBlock.id, u)} />
                          </PropertySection>
                        </TabsContent>

                        <TabsContent value="style" className="mt-0 space-y-6 px-1">
                          <PropertySection label="Typography" icon={Type}>
                            <div className="space-y-6">
                              <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
                                <AlignButton active={selectedBlock.style?.textAlign === "left"} icon={AlignLeft} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "left" } })} />
                                <AlignButton active={selectedBlock.style?.textAlign === "center"} icon={AlignCenter} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "center" } })} />
                                <AlignButton active={selectedBlock.style?.textAlign === "right"} icon={AlignRight} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "right" } })} />
                                <AlignButton active={selectedBlock.style?.textAlign === "justify"} icon={AlignJustify} onClick={() => updateBlock(selectedBlock.id, { style: { textAlign: "justify" } })} />
                              </div>

                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <Label className="text-[10px] uppercase font-bold text-primary tracking-widest">Font Size</Label>
                                  <span className="text-[10px] font-mono text-primary font-bold">{selectedBlock.style?.fontSize || 16}px</span>
                                </div>
                                <Slider
                                  value={[selectedBlock.style?.fontSize || 16]}
                                  min={8}
                                  max={100}
                                  step={1}
                                  onValueChange={([v]) => updateBlock(selectedBlock.id, { style: { fontSize: v } })}
                                />
                              </div>

                              <div className="flex items-center gap-2">
                                <StyleToggle active={selectedBlock.style?.fontWeight === "bold"} icon={Bold} onClick={() => updateBlock(selectedBlock.id, { style: { fontWeight: selectedBlock.style?.fontWeight === "bold" ? "400" : "bold" } })} />
                                <StyleToggle active={selectedBlock.style?.fontStyle === "italic"} icon={Italic} onClick={() => updateBlock(selectedBlock.id, { style: { fontStyle: selectedBlock.style?.fontStyle === "italic" ? "normal" : "italic" } })} />
                                <StyleToggle active={selectedBlock.style?.textDecoration === "underline"} icon={Underline} onClick={() => updateBlock(selectedBlock.id, { style: { textDecoration: selectedBlock.style?.textDecoration === "underline" ? "none" : "underline" } })} />
                              </div>
                            </div>
                          </PropertySection>

                          <PropertySection label="Global Aesthetics" icon={Palette}>
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-[9px] uppercase font-bold text-primary">Text Color</Label>
                                  <div className="relative h-10 w-full rounded-xl overflow-hidden border border-slate-200 group/color">
                                    <input type="color" value={selectedBlock.style?.textColor || "#FFFFFF"} onChange={(e) => updateBlock(selectedBlock.id, { style: { textColor: e.target.value } })} className="absolute inset-0 w-[150%] h-[150%] cursor-pointer -translate-x-4 -translate-y-4" />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[9px] uppercase font-bold text-primary">Background</Label>
                                  <div className="relative h-10 w-full rounded-xl overflow-hidden border border-slate-200 group/color">
                                    <input type="color" value={selectedBlock.style?.backgroundColor || "#1F1F1F"} onChange={(e) => updateBlock(selectedBlock.id, { style: { backgroundColor: e.target.value } })} className="absolute inset-0 w-[150%] h-[150%] cursor-pointer -translate-x-4 -translate-y-4" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </PropertySection>
                        </TabsContent>

                        <TabsContent value="advanced" className="mt-0 space-y-6 px-1 animate-in slide-in-from-right-4 duration-300">
                          <PropertySection label="Motion Effects" icon={Star}>
                            <div className="space-y-3">
                              <Label className="text-[10px] uppercase font-bold text-primary tracking-widest">Entrance Animation</Label>
                              <Select value={selectedBlock.style?.animation || "none"} onValueChange={(v: any) => updateBlock(selectedBlock.id, { style: { animation: v } })}>
                                <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-11 text-xs text-slate-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white text-slate-700 border-slate-200">
                                  <SelectItem value="none">None</SelectItem>
                                  <SelectItem value="fadeIn">Fade In</SelectItem>
                                  <SelectItem value="slideUp">Slide Up</SelectItem>
                                  <SelectItem value="zoomIn">Zoom In</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </PropertySection>

                          <PropertySection label="Border & Shadow" icon={Settings}>
                            <div className="space-y-6">
                              <div className="space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-bold text-primary">
                                  <span>RADIUS</span>
                                  <span className="text-primary">{selectedBlock.style?.borderRadius || 0}px</span>
                                </div>
                                <Slider
                                  value={[selectedBlock.style?.borderRadius || 0]} max={50}
                                  onValueChange={([v]) => updateBlock(selectedBlock.id, { style: { borderRadius: v } })}
                                />
                              </div>
                              <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-bold text-primary tracking-widest">Box Shadow</Label>
                                <Select value={selectedBlock.style?.boxShadow || "none"} onValueChange={(v: any) => updateBlock(selectedBlock.id, { style: { boxShadow: v } })}>
                                  <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-11 text-xs text-slate-700"><SelectValue /></SelectTrigger>
                                  <SelectContent className="bg-white text-slate-700 border-slate-200">
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="sm">Soft Inner</SelectItem>
                                    <SelectItem value="md">Natural</SelectItem>
                                    <SelectItem value="lg">Elevated</SelectItem>
                                    <SelectItem value="xl">Float High</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </PropertySection>

                          <PropertySection label="Responsive" icon={Eye}>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                  <Monitor className="w-4 h-4 text-primary" />
                                  <span className="text-[11px] font-bold text-slate-700">Hide on Desktop</span>
                                </div>
                                <Switch checked={!!selectedBlock.style?.hideDesktop} onCheckedChange={(v) => updateBlock(selectedBlock.id, { style: { hideDesktop: v } })} />
                              </div>
                              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                  <Smartphone className="w-4 h-4 text-primary" />
                                  <span className="text-[11px] font-bold text-slate-700">Hide on Mobile</span>
                                </div>
                                <Switch checked={!!selectedBlock.style?.hideMobile} onCheckedChange={(v) => updateBlock(selectedBlock.id, { style: { hideMobile: v } })} />
                              </div>
                            </div>
                          </PropertySection>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 text-center opacity-20 filter grayscale">
                    <Layout className="w-16 h-16 mb-4 animate-pulse" />
                    <p className="font-headline font-bold text-sm tracking-widest uppercase">Select component<br />to activate pro panel</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
          <Button className="w-full h-14 rounded-2xl font-bold text-base bg-primary text-white shadow-xl shadow-primary/20 group relative overflow-hidden transition-all hover:scale-[1.02] hover:bg-primary/90" onClick={handleSave} disabled={saving}>
            <span className="relative z-10 flex items-center gap-3">
              {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
              Publish Project
            </span>
          </Button>
          <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-[0.2em]">Ready for Production</p>
        </div>
      </aside>

      {/* --- LIVE VISUAL CANVAS (FOCUS MODE) --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-white">
        {/* Designer Header Toolbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-8 shrink-0 z-20">
          <div className="flex items-center gap-6">
            <div className="h-6 w-px bg-white/10 hidden md:block" />
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setViewMode("desktop")}>
              <Monitor className={cn("w-5 h-5 transition-colors", viewMode === "desktop" ? "text-primary" : "text-slate-400")} />
              <span className={cn("text-[10px] font-bold uppercase tracking-widest hidden sm:block", viewMode === "desktop" ? "text-slate-900" : "text-slate-400")}>Desktop</span>
            </div>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setViewMode("mobile")}>
              <Smartphone className={cn("w-5 h-5 transition-colors", viewMode === "mobile" ? "text-primary" : "text-slate-400")} />
              <span className={cn("text-[10px] font-bold uppercase tracking-widest hidden sm:block", viewMode === "mobile" ? "text-slate-900" : "text-slate-400")}>Mobile</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-200 mr-4">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold text-slate-500 font-mono tracking-tighter capitalize">{subdomain}.host.live</span>
            </div>
            <Button variant="outline" className="rounded-2xl px-4 lg:px-6 h-11 font-bold text-xs bg-transparent border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-primary/50 transition-all" onClick={() => setIsPreviewOpen(true)}>
              <Eye className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Live Preview</span>
            </Button>
          </div>
        </header>

        {/* The Infinite Designer Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-12 custom-scrollbar-minimal scroll-smooth flex justify-center items-start bg-slate-50">
          <div className={cn(
            "transition-all duration-700 bg-white min-h-[100%] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] relative overflow-x-hidden",
            viewMode === "mobile" ? "w-full max-w-[420px] rounded-[60px] border-[14px] border-[#161625]" : "max-w-6xl w-full rounded-2xl"
          )}>
            {/* Canvas Status Bar (Mobile only) */}
            {viewMode === "mobile" && (
              <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-between px-10 pt-4 z-50 pointer-events-none">
                <span className="text-[10px] font-bold font-mono">9:41</span>
                <div className="flex gap-1.5 items-center">
                  <div className="w-3 h-3 rounded-full bg-slate-300/30" />
                  <div className="w-6 h-3 rounded-full bg-slate-300/30" />
                </div>
              </div>
            )}

            <div className="py-20 min-h-[800px] relative group/canvas select-none cursor-default">
              {blocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-60 gap-8 opacity-10 scale-150 rotate-1 transition-transform">
                  <MousePointer2 className="w-32 h-32" />
                  <h3 className="text-4xl font-headline font-black tracking-tighter">EMPTY CANVAS</h3>
                </div>
              ) : (
                <div className="space-y-0">
                  {blocks.map((block) => (
                    <CanvasBlockWrapper
                      key={block.id}
                      block={block}
                      products={products}
                      isSelected={selectedBlockId === block.id}
                      onSelect={() => { setSelectedBlockId(block.id); setSidebarTab("edit"); }}
                      onRemove={() => removeBlock(block.id)}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}

              {/* Advanced Add System */}
              <div className={cn(
                "flex flex-col items-center justify-center py-24 mt-20 transition-all duration-500",
                blocks.length > 0 ? "border-t border-dashed border-slate-100 bg-slate-50/30" : ""
              )}>
                <Button
                  variant="outline"
                  className="h-20 w-20 rounded-full border-2 border-primary/20 text-primary shadow-[0_20px_40px_-5px_rgba(59,130,246,0.3)] hover:scale-110 active:scale-95 transition-all bg-white group"
                  onClick={() => setSidebarTab("elements")}
                >
                  <Plus className="w-10 h-10 group-hover:rotate-90 transition-transform duration-500" />
                </Button>
                <p className="mt-6 text-[11px] font-bold text-slate-400 tracking-[0.3em] uppercase">Add New Section</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[100vw] w-full h-[100vh] p-0 rounded-none border-none bg-background flex flex-col overflow-hidden">
          <header className="flex h-16 items-center justify-between px-8 border-b bg-white z-50 shadow-sm shrink-0">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-headline font-bold tracking-tight">System Live Preview</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsPreviewOpen(false)} className="rounded-full hover:bg-slate-100 transition-colors"><X className="w-7 h-7" /></Button>
          </header>
          <div className="flex-1 overflow-y-auto bg-slate-100/30 p-8 md:p-16">
            <div className={cn(
              "mx-auto bg-white shadow-[0_50px_150px_-30px_rgba(0,0,0,0.1)] rounded-3xl min-h-screen py-20 transition-all duration-500",
              viewMode === "mobile" ? "max-w-[420px]" : "max-w-6xl w-full"
            )}>
              {blocks.map(block => <BlockRenderer key={block.id} block={block} products={products} isPreview viewMode={viewMode} />)}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function WidgetButton({ icon: Icon, label, onClick, highlight = false }: any) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-[110px] flex-col gap-3 rounded-[28px] border-slate-200 bg-white hover:bg-slate-50 hover:border-primary/50 transition-all group overflow-hidden shadow-sm",
        highlight ? "border-primary/20 bg-primary/5 shadow-primary/5" : ""
      )}
    >
      <div className={cn(
        "p-3 rounded-2xl bg-slate-50 transition-transform group-hover:scale-110 duration-300",
        highlight ? "text-primary bg-primary/10" : "text-slate-500 group-hover:text-primary"
      )}>
        <Icon className="w-7 h-7" />
      </div>
      <span className={cn(
        "text-[10px] font-extrabold uppercase tracking-widest transition-colors",
        highlight ? "text-primary" : "text-slate-500 group-hover:text-slate-900"
      )}>{label}</span>
    </Button>
  );
}

function AlignButton({ active, icon: Icon, onClick }: any) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn("h-10 rounded-xl px-0 translate-y-0 active:translate-y-0.5", active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100")}
    >
      <Icon className="w-4 h-4" />
    </Button>
  );
}

function StyleToggle({ active, icon: Icon, onClick }: any) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn("h-11 w-11 rounded-2xl border-slate-200 transition-all", active ? "bg-primary border-primary text-white shadow-lg" : "bg-white text-slate-400 hover:text-slate-900 hover:bg-slate-50")}
    >
      <Icon className="w-5 h-5" />
    </Button>
  );
}

function PropertySection({ label, icon: Icon, children }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-primary px-2 group">
        <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="font-headline font-bold text-[10px] uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-200/50 space-y-5 animate-in slide-in-from-top-2 duration-500">
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
        "relative group/block transition-all duration-500 cursor-pointer",
        isSelected ? "ring-2 ring-primary ring-inset z-40 bg-primary/5" : "hover:bg-slate-50/20",
        isHidden ? "opacity-20 pointer-events-none grayscale blur-[1px]" : ""
      )}
    >
      {/* Selection Panel */}
      {isSelected && (
        <div className="absolute -top-11 left-0 flex items-center gap-1 bg-primary text-white rounded-t-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-bottom-2 duration-300">
          <Layers className="w-3.5 h-3.5 mr-2" />
          {block.type}
          <div className="ml-4 flex gap-1 border-l border-white/20 pl-4">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      <div className={cn(
        "transition-all duration-700",
        block.style?.animation === "fadeIn" ? "animate-in fade-in" :
          block.style?.animation === "slideUp" ? "animate-in slide-in-from-bottom-10" :
            block.style?.animation === "zoomIn" ? "animate-in zoom-in-95" : ""
      )}>
        <BlockRenderer block={block} products={products} viewMode={viewMode} />
      </div>
    </div>
  );
}

function PropertyEditor({ block, products, onChange }: any) {
  switch (block.type) {
    case "header":
      return (
        <div className="space-y-5">
          <div className="space-y-3">
            <Label className="text-[10px] font-extrabold text-primary uppercase tracking-widest pl-1">Primary Title</Label>
            <Input value={block.content?.text || ""} onChange={(e) => onChange({ content: { ...block.content, text: e.target.value } })} className="rounded-xl bg-white border-slate-200 text-slate-900 h-12 focus:ring-primary focus:border-primary placeholder:text-slate-300 shadow-sm" />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-extrabold text-primary uppercase tracking-widest pl-1">Ranking</Label>
            <Select value={block.content?.level || "h2"} onValueChange={(v) => onChange({ content: { ...block.content, level: v } })}>
              <SelectTrigger className="rounded-xl h-12 bg-white border-slate-200 text-slate-900 shadow-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white text-slate-900 border-slate-200">
                <SelectItem value="h1">Level 1 Prestige</SelectItem>
                <SelectItem value="h2">Level 2 Hero</SelectItem>
                <SelectItem value="h3">Level 3 Sub-Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    case "paragraph":
      return (
        <div className="space-y-3">
          <Label className="text-[10px] font-extrabold text-primary uppercase tracking-widest pl-1">Text Narrative</Label>
          <Textarea value={block.content?.text || ""} onChange={(e) => onChange({ content: { ...block.content, text: e.target.value } })} className="rounded-2xl min-h-[160px] bg-white border-slate-200 text-slate-900 focus:ring-primary h-auto placeholder:text-slate-300 shadow-sm" />
        </div>
      );
    case "image":
      return (
        <div className="space-y-3">
          <Label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest pl-1">Visual Asset</Label>
          <CloudinaryUpload value={block.content?.url || ""} onUpload={(url) => onChange({ content: { ...block.content, url } })} onRemove={() => onChange({ content: { ...block.content, url: "" } })} />
        </div>
      );
    case "button":
      return (
        <div className="space-y-5">
          <div className="space-y-3">
            <Label className="text-[10px] font-extrabold text-primary uppercase tracking-widest pl-1">Action Label</Label>
            <Input value={block.content?.text || ""} onChange={(e) => onChange({ content: { ...block.content, text: e.target.value } })} className="rounded-xl h-12 bg-white border-slate-200 text-slate-900 shadow-sm" />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-extrabold text-primary uppercase tracking-widest pl-1">Gateway Link</Label>
            <Input value={block.content?.link || ""} onChange={(e) => onChange({ content: { ...block.content, link: e.target.value } })} className="rounded-xl h-12 bg-white border-slate-200 text-slate-900 shadow-sm" />
          </div>
        </div>
      );
    case "product-order-form":
      return (
        <div className="space-y-5">
          <div className="space-y-3">
            <Label className="text-[10px] font-extrabold text-primary uppercase tracking-widest pl-1">Featured Merchandise</Label>
            <Select value={block.content?.mainProductId || ""} onValueChange={(v) => onChange({ content: { ...block.content, mainProductId: v } })}>
              <SelectTrigger className="rounded-xl h-12 bg-white border-slate-200 text-slate-900 shadow-sm"><SelectValue placeholder="Select Product" /></SelectTrigger>
              <SelectContent className="bg-white text-slate-900 border-slate-200">
                {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-extrabold text-primary uppercase tracking-widest pl-1">Logistics</Label>
            <Select value={block.content?.shippingType || "free"} onValueChange={(v) => onChange({ content: { ...block.content, shippingType: v } })}>
              <SelectTrigger className="rounded-xl h-12 bg-white border-slate-200 text-slate-900 shadow-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white text-slate-900 border-slate-200">
                <SelectItem value="free">Complimentary (FREE)</SelectItem>
                <SelectItem value="paid">Premium Logistic Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    default:
      return <div className="text-[10px] text-slate-600 italic tracking-wider uppercase font-bold text-center py-4">Pro controls unavailable</div>;
  }
}

function BlockRenderer({ block, products, isPreview = false, viewMode = "desktop" }: any) {
  // Hide on restricted screen sizes
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
    fontStyle: block.style?.fontStyle,
    textDecoration: block.style?.textDecoration,
    borderStyle: block.style?.borderStyle,
    borderWidth: block.style?.borderWidth ? `${block.style.borderWidth}px` : undefined,
    borderColor: block.style?.borderColor,
    borderRadius: block.style?.borderRadius ? `${block.style.borderRadius}px` : undefined,
  };

  // Add Shadow Presets
  if (block.style?.boxShadow && block.style?.boxShadow !== "none") {
    const shadows = {
      sm: "0 2px 4px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,1)",
      md: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
      lg: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
      xl: "0 25px 50px -12px rgba(0,0,0,0.25)"
    };
    style.boxShadow = shadows[block.style.boxShadow as keyof typeof shadows];
  }

  // Animation handling for non-canvas view
  const animClass = block.style?.animation === "fadeIn" ? "animate-in fade-in" :
    block.style?.animation === "slideUp" ? "animate-in slide-in-from-bottom-10" :
      block.style?.animation === "zoomIn" ? "animate-in zoom-in-95" : "";

  switch (block.type) {
    case "header":
      const Tag = block.content?.level || 'h2';
      return <div style={style} className={cn("px-10 w-full font-headline font-bold", animClass)}><Tag>{block.content?.text}</Tag></div>;

    case "paragraph":
      return <div style={style} className={cn("px-10 w-full leading-relaxed whitespace-pre-wrap", animClass)}>{block.content?.text}</div>;

    case "image":
      return (
        <div style={style} className={cn("px-10 w-full", animClass)}>
          {block.content?.url && <img src={block.content.url} className="w-full h-auto shadow-2xl" style={{ borderRadius: style.borderRadius }} />}
        </div>
      );

    case "button":
      return (
        <div style={style} className={cn("px-10 w-full", animClass)}>
          <Button size="lg" className="rounded-2xl px-16 h-16 font-black uppercase tracking-widest text-sm shadow-2xl transition-transform hover:scale-105 active:scale-95">{block.content?.text}</Button>
        </div>
      );

    case "product-order-form":
      const mainProd = products.find((p: any) => p.id === block.content?.mainProductId);
      return (
        <div style={style} className={cn("px-10 w-full max-w-5xl mx-auto py-20 text-left", animClass)}>
          <Card className="rounded-[60px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border-none overflow-hidden group/order">
            <div className="bg-[#161625] text-white p-16 text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-6" />
              <h3 className="text-4xl font-headline font-black mb-4 tracking-tighter uppercase">Flash Checkout</h3>
              <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Secure & Encrypted Order Channel</p>
            </div>
            <div className="p-16 space-y-12">
              {mainProd && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-10 p-10 bg-slate-50 rounded-[40px] border border-slate-100 transition-colors group-hover/order:border-primary/20">
                  <div className="flex items-center gap-10">
                    <img src={mainProd.featuredImage} className="w-32 h-32 rounded-[32px] object-cover shadow-xl" />
                    <div className="space-y-2">
                      <h4 className="text-3xl font-black tracking-tight">{mainProd.name}</h4>
                      <p className="text-primary font-black text-4xl tracking-tighter">${mainProd.currentPrice}</p>
                    </div>
                  </div>
                  <CheckCircle className="text-primary w-16 h-16" />
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 pt-10 border-t border-slate-100">
                <div className="space-y-8 text-left">
                  <div className="flex items-center gap-4 text-slate-400">
                    <Box className="w-5 h-5" />
                    <h4 className="font-black text-xs uppercase tracking-[0.3em]">Logistic Center</h4>
                  </div>
                  <div className="space-y-4">
                    <Input placeholder="Recipient Name" className="rounded-2xl h-16 bg-slate-50 border-none px-6 font-bold" />
                    <Input placeholder="Tracking Phone" className="rounded-2xl h-16 bg-slate-50 border-none px-6 font-bold" />
                    <Textarea placeholder="Delivery Destination" className="rounded-[32px] min-h-[140px] bg-slate-50 border-none p-6 font-bold" />
                  </div>
                </div>
                <div className="space-y-8 text-left">
                  <div className="flex items-center gap-4 text-slate-400">
                    <ShoppingCart className="w-5 h-5" />
                    <h4 className="font-black text-xs uppercase tracking-[0.3em]">Order Bill</h4>
                  </div>
                  <div className="bg-slate-50 p-10 rounded-[60px] border border-slate-100 space-y-4">
                    <div className="flex justify-between text-4xl font-black text-primary border-t-4 border-slate-100/50 pt-10 mt-6">
                      <span className="tracking-tighter uppercase">TOTAL</span>
                      <span>${mainProd?.currentPrice || 0}</span>
                    </div>
                  </div>
                  <Button className="w-full h-20 rounded-[40px] text-xl font-black uppercase tracking-widest shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all">Submit Secure Order</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );

    case "row":
      return (
        <div style={style} className={cn("grid gap-12 px-10", `grid-cols-${block.content?.columns || 1}`, animClass)}>
          {block.children?.map((child: any) => <BlockRenderer key={child.id} block={child} products={products} isPreview={isPreview} viewMode={viewMode} />)}
        </div>
      );

    default:
      return null;
  }
}

function getBlockIcon(type: BlockType) {
  switch (type) {
    case "header": return <Type className="w-full h-full" />;
    case "paragraph": return <List className="w-full h-full" />;
    case "image": return <ImageIcon className="w-full h-full" />;
    case "row": return <Columns className="w-full h-full" />;
    case "button": return <Monitor className="w-full h-full" />;
    case "carousel": return <Layout className="w-full h-full" />;
    case "accordion": return <ChevronDown className="w-full h-full" />;
    case "checked-list": return <CheckCircle className="w-full h-full" />;
    case "product-order-form": return <ShoppingCart className="w-full h-full" />;
    default: return <Square className="w-full h-full" />;
  }
}
