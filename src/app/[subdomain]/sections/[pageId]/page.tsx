
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

  // Mobile responsiveness: close sidebar by default on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (firestore && subdomain && pageId) {
      fetchData();
    }
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
    if (over && active.id !== over.id) {
      setConfig((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
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
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: getDefaultContent(type),
      style: type === "row" ? getDefaultStyle(type) : { ...getDefaultStyle(type), columnIndex: target?.colIdx ?? 0 },
      children: type === "row" ? [] : undefined
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
