
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, Save, Trash2, GripVertical, Image as ImageIcon, 
  Type, Layout, List, CheckCircle, CreditCard, ShoppingCart, 
  Loader2, ChevronUp, ChevronDown, Monitor, Smartphone, 
  Square, Circle, ArrowRight, Eye, X, Columns, Settings2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

interface CarouselItemData {
  id: string;
  image?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
}

interface Block {
  id: string;
  type: BlockType;
  content: any;
  style: {
    padding?: string;
    margin?: string;
    textAlign?: "left" | "center" | "right";
    columns?: number;
    listType?: "rounded" | "box" | "arrow";
    backgroundColor?: string;
    textColor?: string;
    desktopColumns?: number;
  };
  children?: Block[];
}

export default function PageBuilder() {
  const { subdomain } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeId, setStoreId] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);

  useEffect(() => {
    fetchStoreData();
  }, [subdomain]);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const storeQ = query(collection(db, "stores"), where("subdomain", "==", subdomain));
      const storeSnap = await getDocs(storeQ);
      if (!storeSnap.empty) {
        const data = storeSnap.docs[0].data();
        setStoreId(storeSnap.docs[0].id);
        setBlocks(data.landingPageConfig || []);
        
        const prodQ = query(collection(db, "products"), where("storeId", "==", storeSnap.docs[0].id));
        const prodSnap = await getDocs(prodQ);
        setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createBlock = (type: BlockType): Block => {
    const block: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: getInitialContent(type),
      style: { 
        padding: "20px", 
        margin: "0px", 
        textAlign: "left", 
        columns: 2, 
        listType: "rounded",
      },
    };

    if (type === "carousel") {
      block.style.desktopColumns = 3;
    }

    if (type === "row") {
      block.children = [];
    }

    return block;
  };

  const getInitialContent = (type: BlockType) => {
    switch (type) {
      case "header": return { text: "Section Heading", level: "h2" };
      case "paragraph": return { text: "Add your text content here..." };
      case "image": return { url: "" };
      case "accordion": return { items: [{ title: "Item 1", content: "Content 1" }] };
      case "button": return { text: "Click Here", link: "#" };
      case "link": return { text: "Learn More", link: "#" };
      case "carousel": return { items: [] as CarouselItemData[] };
      case "checked-list": return { items: ["Item 1", "Item 2"] };
      case "product-order-form": return { mainProductId: "", subProductIds: [], shippingType: "free", shippingCost: 0 };
      case "row": return { columns: 2 };
      default: return {};
    }
  };

  const handleAddComponent = (type: BlockType) => {
    const newBlock = createBlock(type);
    if (activeParentId) {
      setBlocks(prev => addNestedBlock(prev, activeParentId, newBlock));
    } else {
      setBlocks([...blocks, newBlock]);
    }
    setIsAddDialogOpen(false);
    setActiveParentId(null);
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

  const removeBlock = (id: string) => {
    setBlocks(prev => removeNestedBlock(prev, id));
  };

  const removeNestedBlock = (items: Block[], id: string): Block[] => {
    return items.filter(item => item.id !== id).map(item => ({
      ...item,
      children: item.children ? removeNestedBlock(item.children, id) : undefined
    }));
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(prev => updateNestedBlock(prev, id, updates));
  };

  const updateNestedBlock = (items: Block[], id: string, updates: Partial<Block>): Block[] => {
    return items.map(item => {
      if (item.id === id) return { ...item, ...updates };
      if (item.children) return { ...item, children: updateNestedBlock(item.children, id, updates) };
      return item;
    });
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    setBlocks(prev => {
      const newBlocks = [...prev];
      const index = newBlocks.findIndex(b => b.id === id);
      if (index !== -1) {
        const target = direction === "up" ? index - 1 : index + 1;
        if (target >= 0 && target < newBlocks.length) {
          [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
        }
        return newBlocks;
      }
      return newBlocks;
    });
  };

  const handleSave = async () => {
    if (!storeId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "stores", storeId), { landingPageConfig: blocks });
      toast({ title: "Page saved!", description: "Your changes are now live." });
    } catch (error) {
      console.error("Firestore Save Error:", error);
      toast({ variant: "destructive", title: "Error saving", description: "Something went wrong while saving your design." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto space-y-4">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3 rounded-2xl border border-border/50 shadow-sm gap-3 sticky top-0 z-50">
        <div className="flex gap-2 bg-muted/50 p-1 rounded-full">
          <Button variant={viewMode === "desktop" ? "secondary" : "ghost"} size="sm" className="rounded-full h-8" onClick={() => setViewMode("desktop")}>
            <Monitor className="w-4 h-4 mr-2" /> Desktop
          </Button>
          <Button variant={viewMode === "mobile" ? "secondary" : "ghost"} size="sm" className="rounded-full h-8" onClick={() => setViewMode("mobile")}>
            <Smartphone className="w-4 h-4 mr-2" /> Mobile
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-full h-9 px-4" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="mr-2 w-4 h-4" /> Full Preview
          </Button>
          <Button size="sm" className="rounded-full h-9 px-6 shadow-lg shadow-primary/20" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Save className="mr-2 w-4 h-4" />}
            Save Page
          </Button>
        </div>
      </div>

      {/* Editor Surface */}
      <div className="flex-1">
        <div className={`mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden transition-all duration-500 min-h-[600px] border border-border/50 flex flex-col ${viewMode === "mobile" ? "max-w-[375px]" : "w-full"}`}>
          <div className="p-3 bg-muted/20 border-b flex items-center justify-between">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Canvas Editor</div>
            <div className="w-8" />
          </div>

          <div className="flex-1 p-3 md:p-4 space-y-2 overflow-y-auto">
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-3xl opacity-30 gap-4">
                <Layout className="w-12 h-12" />
                <p className="font-headline font-bold">Your canvas is empty</p>
                <Button variant="secondary" className="rounded-xl" onClick={() => { setActiveParentId(null); setIsAddDialogOpen(true); }}>
                  <Plus className="mr-2 w-4 h-4" /> Add your first component
                </Button>
              </div>
            ) : (
              <>
                {blocks.map((block, index) => (
                  <BlockEditorWrapper 
                    key={block.id} 
                    block={block} 
                    index={index}
                    products={products}
                    onUpdate={updateBlock}
                    onRemove={removeBlock}
                    onMove={moveBlock}
                    onOpenAddDialog={(parentId: string | null) => {
                      setActiveParentId(parentId);
                      setIsAddDialogOpen(true);
                    }}
                  />
                ))}
                
                <div className="flex justify-center pt-2 border-t">
                  <Button variant="outline" className="rounded-full border-dashed border-2 h-10 px-6 group hover:border-primary transition-all" onClick={() => { setActiveParentId(null); setIsAddDialogOpen(true); }}>
                    <Plus className="mr-2 w-4 h-4 group-hover:scale-110 transition-transform" /> Add New Section
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Component Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if(!open) setActiveParentId(null); }}>
        <DialogContent className="rounded-3xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold">Add Component</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-6">
            <ComponentSelectButton icon={Columns} label="Row / Section" onClick={() => handleAddComponent("row")} />
            <ComponentSelectButton icon={Type} label="Header" onClick={() => handleAddComponent("header")} />
            <ComponentSelectButton icon={List} label="Paragraph" onClick={() => handleAddComponent("paragraph")} />
            <ComponentSelectButton icon={ImageIcon} label="Image" onClick={() => handleAddComponent("image")} />
            <ComponentSelectButton icon={Layout} label="Carousel" onClick={() => handleAddComponent("carousel")} />
            <ComponentSelectButton icon={ChevronDown} label="Accordion" onClick={() => handleAddComponent("accordion")} />
            <ComponentSelectButton icon={CheckCircle} label="Checked List" onClick={() => handleAddComponent("checked-list")} />
            <ComponentSelectButton icon={Monitor} label="Button" onClick={() => handleAddComponent("button")} />
            <ComponentSelectButton icon={ShoppingCart} label="Order Form" onClick={() => handleAddComponent("product-order-form")} isPrimary />
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[100vw] w-full h-[100vh] p-0 rounded-none border-none bg-background flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-white shrink-0 z-20 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                  <Eye className="w-5 h-5" />
                </div>
                <DialogTitle className="text-lg font-headline font-bold">Live Preview</DialogTitle>
              </div>
              <div className="hidden sm:flex gap-2 ml-4 bg-muted/50 p-1 rounded-full">
                <Button variant={viewMode === "desktop" ? "secondary" : "ghost"} size="sm" className="rounded-full h-8" onClick={() => setViewMode("desktop")}>
                  <Monitor className="w-4 h-4 mr-2" /> Desktop
                </Button>
                <Button variant={viewMode === "mobile" ? "secondary" : "ghost"} size="sm" className="rounded-full h-8" onClick={() => setViewMode("mobile")}>
                  <Smartphone className="w-4 h-4 mr-2" /> Mobile
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsPreviewOpen(false)} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1 bg-muted/10">
            <div className="p-4 md:p-12 min-h-full">
              <div className={`mx-auto bg-white shadow-2xl transition-all duration-300 min-h-full overflow-hidden ${viewMode === "mobile" ? "max-w-[375px] rounded-[40px] border-[8px] border-slate-900" : "max-w-6xl w-full rounded-3xl"}`}>
                <div className="py-8">
                  {blocks.map((block) => (
                    <BlockRenderer key={block.id} block={block} products={products} />
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ComponentSelectButton({ icon: Icon, label, onClick, isPrimary = false }: any) {
  return (
    <Button 
      variant="outline" 
      className={`h-24 flex-col gap-2 rounded-2xl transition-all hover:scale-105 hover:border-primary hover:bg-primary/5 ${isPrimary ? 'border-primary/50 bg-primary/5 text-primary' : ''}`}
      onClick={onClick}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </Button>
  );
}

function BlockEditorWrapper({ block, index, products, onUpdate, onRemove, onMove, onOpenAddDialog }: any) {
  return (
    <div className="group relative border-2 border-transparent hover:border-primary/20 rounded-2xl transition-all bg-muted/5 p-1 mb-1">
      {/* Block Toolbar */}
      <div className="absolute -left-8 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button variant="outline" size="icon" className="h-6 w-6 rounded-full bg-white border-border/50 shadow-sm" onClick={() => onMove(block.id, "up")}>
          <ChevronUp className="w-3 h-3" />
        </Button>
        <Button variant="outline" size="icon" className="h-6 w-6 rounded-full bg-white border-border/50 shadow-sm" onClick={() => onMove(block.id, "down")}>
          <ChevronDown className="w-3 h-3" />
        </Button>
        <Button variant="destructive" size="icon" className="h-6 w-6 rounded-full shadow-lg" onClick={() => onRemove(block.id)}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      <div className="p-1">
        <BlockSettingsEditor 
          block={block} 
          products={products}
          onChange={(updates: any) => onUpdate(block.id, updates)}
          onUpdate={onUpdate}
        />
        
        {block.type === "row" && (
          <div className="mt-2 pl-3 border-l-2 border-primary/20 space-y-2 bg-white/50 rounded-r-2xl p-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Row Children</span>
              <Button size="sm" variant="ghost" className="h-5 text-[10px] rounded-full hover:bg-primary/10 text-primary" onClick={() => onOpenAddDialog(block.id)}>
                <Plus className="w-2.5 h-2.5 mr-1" /> Add to Row
              </Button>
            </div>
            <div className="space-y-2">
              {block.children?.map((child: any, idx: number) => (
                <BlockEditorWrapper 
                  key={child.id} 
                  block={child} 
                  index={idx}
                  products={products}
                  onUpdate={onUpdate}
                  onRemove={onRemove}
                  onMove={onMove}
                  onOpenAddDialog={onOpenAddDialog}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BlockRenderer({ block, products }: { block: Block, products: any[] }) {
  const style = {
    padding: block.style.padding,
    margin: block.style.margin,
    textAlign: block.style.textAlign as any,
    backgroundColor: block.style.backgroundColor,
    color: block.style.textColor,
  };

  switch (block.type) {
    case "row":
      return (
        <div style={style} className={`grid gap-6 grid-cols-1 md:grid-cols-${block.content.columns || 1} px-6`}>
          {block.children?.map(child => (
            <div key={child.id}>
              <BlockRenderer block={child} products={products} />
            </div>
          ))}
        </div>
      );

    case "header":
      const Tag = block.content.level || 'h2';
      const sizes = { h1: 'text-5xl', h2: 'text-4xl', h3: 'text-2xl' };
      return <div style={style} className="px-6"><Tag className={`${sizes[Tag as keyof typeof sizes]} font-headline font-bold mb-4`}>{block.content.text}</Tag></div>;
    
    case "paragraph":
      return <div style={style} className="px-6 text-muted-foreground leading-relaxed whitespace-pre-wrap">{block.content.text}</div>;
    
    case "image":
      return <div style={style} className="px-6">{block.content.url && <img src={block.content.url} className="w-full rounded-2xl shadow-lg" />}</div>;
    
    case "checked-list":
      return (
        <div style={style} className="px-6 space-y-3">
          {block.content.items.map((item: string, i: number) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-1 text-primary"><ListIcon type={block.style.listType} /></div>
              <span className="font-medium">{item}</span>
            </div>
          ))}
        </div>
      );

    case "button":
      return (
        <div style={style} className="px-6">
          <Button size="lg" className="rounded-xl px-8 h-12 font-bold shadow-lg shadow-primary/20">{block.content.text}</Button>
        </div>
      );

    case "carousel":
      const items = block.content.items || [];
      const desktopCols = block.style.desktopColumns || 3;
      return (
        <div style={style} className="px-6">
          <Carousel className="w-full">
            <CarouselContent>
              {items.map((item: CarouselItemData) => (
                <CarouselItem key={item.id} className={`basis-full md:basis-1/${desktopCols}`}>
                  <Card className="rounded-2xl border-none shadow-md overflow-hidden h-full flex flex-col">
                    {item.image && <img src={item.image} className="w-full aspect-video object-cover" />}
                    <div className="p-4 space-y-2 flex-1 flex flex-col">
                      {item.title && <h4 className="font-headline font-bold text-lg">{item.title}</h4>}
                      {item.subtitle && <p className="text-sm text-muted-foreground leading-snug">{item.subtitle}</p>}
                      {item.buttonText && (
                        <div className="mt-auto pt-4">
                          <Button size="sm" className="w-full rounded-lg">{item.buttonText}</Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            {items.length > 1 && (
              <>
                <CarouselPrevious className="-left-4 bg-white" />
                <CarouselNext className="-right-4 bg-white" />
              </>
            )}
          </Carousel>
        </div>
      );

    case "product-order-form":
      const mainProd = products.find(p => p.id === block.content.mainProductId);
      const subProds = products.filter(p => block.content.subProductIds.includes(p.id));
      
      return (
        <div style={style} className="px-6">
          <Card className="rounded-3xl shadow-xl border-primary/10 overflow-hidden max-w-4xl mx-auto">
            <CardHeader className="bg-primary text-white p-6">
              <CardTitle className="text-2xl font-headline font-bold">Checkout & Order</CardTitle>
              <CardDescription className="text-white/80">Complete your purchase in seconds.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {mainProd && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-primary/5 rounded-2xl border border-primary/20">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden">
                        <img src={mainProd.featuredImage} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold">{mainProd.name}</h4>
                        <p className="text-primary font-bold">${mainProd.currentPrice}</p>
                      </div>
                    </div>
                    <CheckCircle className="text-primary w-6 h-6" />
                  </div>

                  {subProds.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Limited Time Extras</p>
                      <div className="grid gap-2">
                        {subProds.map(p => (
                          <div key={p.id} className="flex justify-between items-center p-4 bg-muted/30 rounded-2xl border">
                            <div className="flex items-center gap-3">
                              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{p.name}</span>
                            </div>
                            <span className="font-bold text-sm">+${p.currentPrice}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-4">
                  <h4 className="font-bold text-lg">Shipping Information</h4>
                  <div className="space-y-2">
                    <Input placeholder="Full Name" className="rounded-xl h-11" />
                    <Input placeholder="Phone Number" className="rounded-xl h-11" />
                    <Textarea placeholder="Full Address" className="rounded-xl min-h-[80px]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-lg">Order Summary</h4>
                  <div className="bg-muted/30 p-5 rounded-2xl space-y-3 border">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${mainProd?.currentPrice || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping ({block.content.shippingType})</span>
                      <span>{block.content.shippingType === 'free' ? 'FREE' : `$${block.content.shippingCost}`}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t font-bold text-xl text-primary">
                      <span>Total</span>
                      <span>${(mainProd?.currentPrice || 0) + (block.content.shippingType === 'paid' ? block.content.shippingCost : 0)}</span>
                    </div>
                  </div>
                  <Button className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20">
                    Place Order Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    default:
      return null;
  }
}

function BlockSettingsEditor({ block, products, onChange }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <div className="bg-primary/10 text-primary p-1 rounded-lg">
            {getBlockIcon(block.type)}
          </div>
          <span className="font-headline font-bold uppercase text-[8px] tracking-widest">{block.type}</span>
        </div>
        {block.type === "row" && (
          <Select 
            value={String(block.content.columns)} 
            onValueChange={(val) => onChange({ content: { ...block.content, columns: Number(val) } })}
          >
            <SelectTrigger className="w-24 h-6 text-[9px] rounded-lg">
              <SelectValue placeholder="Cols" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Col</SelectItem>
              <SelectItem value="2">2 Cols</SelectItem>
              <SelectItem value="3">3 Cols</SelectItem>
              <SelectItem value="4">4 Cols</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {block.type === "header" && (
        <div className="space-y-2">
          <Input 
            value={block.content.text} 
            onChange={(e) => onChange({ content: { ...block.content, text: e.target.value } })} 
            className="text-lg font-bold font-headline border-none px-0 focus-visible:ring-0 bg-transparent h-auto"
          />
          <div className="flex gap-1">
            {["h1", "h2", "h3"].map(level => (
              <Button key={level} size="sm" variant={block.content.level === level ? "default" : "outline"} className="rounded-lg h-6 text-[9px]" onClick={() => onChange({ content: { ...block.content, level } })}>
                {level.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      )}

      {block.type === "paragraph" && (
        <Textarea 
          value={block.content.text} 
          onChange={(e) => onChange({ content: { ...block.content, text: e.target.value } })} 
          className="border-none px-0 focus-visible:ring-0 min-h-[60px] resize-none bg-transparent text-sm"
        />
      )}

      {block.type === "image" && (
        <CloudinaryUpload 
          value={block.content.url} 
          onUpload={(url) => onChange({ content: { ...block.content, url } })} 
          onRemove={() => onChange({ content: { ...block.content, url: "" } })} 
        />
      )}

      {block.type === "carousel" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label className="text-[10px] uppercase tracking-wider font-bold">Desktop Layout</Label>
            <Select 
              value={String(block.style.desktopColumns || 3)} 
              onValueChange={(val) => onChange({ style: { ...block.style, desktopColumns: Number(val) } })}
            >
              <SelectTrigger className="w-28 h-8 text-xs rounded-lg">
                <SelectValue placeholder="Cards per row" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Card</SelectItem>
                <SelectItem value="2">2 Cards</SelectItem>
                <SelectItem value="3">3 Cards</SelectItem>
                <SelectItem value="4">4 Cards</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider font-bold">Carousel Items</Label>
            <Accordion type="single" collapsible className="w-full space-y-2">
              {(block.content.items || []).map((item: CarouselItemData, idx: number) => (
                <AccordionItem key={item.id} value={item.id} className="border bg-white rounded-xl overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/30">
                    <div className="flex items-center justify-between w-full text-left">
                      <span className="text-[11px] font-bold text-muted-foreground truncate max-w-[150px]">
                        {item.title || `Item #${idx + 1}`}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-3 pt-1 space-y-3">
                    <div className="flex justify-end">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => {
                        e.stopPropagation();
                        const newItems = block.content.items.filter((i: any) => i.id !== item.id);
                        onChange({ content: { ...block.content, items: newItems } });
                      }}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                    <div className="grid gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Image</Label>
                        <CloudinaryUpload 
                          value={item.image} 
                          onUpload={(url) => {
                            const newItems = [...block.content.items];
                            newItems[idx] = { ...newItems[idx], image: url };
                            onChange({ content: { ...block.content, items: newItems } });
                          }}
                          onRemove={() => {
                            const newItems = [...block.content.items];
                            newItems[idx] = { ...newItems[idx], image: "" };
                            onChange({ content: { ...block.content, items: newItems } });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Title</Label>
                        <Input 
                          placeholder="Title (Optional)" 
                          value={item.title || ""} 
                          className="h-8 text-xs rounded-lg"
                          onChange={(e) => {
                            const newItems = [...block.content.items];
                            newItems[idx] = { ...newItems[idx], title: e.target.value };
                            onChange({ content: { ...block.content, items: newItems } });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Subtitle</Label>
                        <Textarea 
                          placeholder="Subtitle (Optional)" 
                          value={item.subtitle || ""} 
                          className="text-xs rounded-lg min-h-[50px]"
                          onChange={(e) => {
                            const newItems = [...block.content.items];
                            newItems[idx] = { ...newItems[idx], subtitle: e.target.value };
                            onChange({ content: { ...block.content, items: newItems } });
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Btn Text</Label>
                          <Input 
                            placeholder="e.g. Shop Now" 
                            value={item.buttonText || ""} 
                            className="h-8 text-xs rounded-lg"
                            onChange={(e) => {
                              const newItems = [...block.content.items];
                              newItems[idx] = { ...newItems[idx], buttonText: e.target.value };
                              onChange({ content: { ...block.content, items: newItems } });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Btn Link</Label>
                          <Input 
                            placeholder="e.g. /products/..." 
                            value={item.buttonLink || ""} 
                            className="h-8 text-xs rounded-lg"
                            onChange={(e) => {
                              const newItems = [...block.content.items];
                              newItems[idx] = { ...newItems[idx], buttonLink: e.target.value };
                              onChange({ content: { ...block.content, items: newItems } });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            <Button 
              variant="outline" 
              className="w-full h-10 border-dashed border-2 rounded-xl text-xs hover:bg-primary/5 hover:border-primary transition-all mt-2"
              onClick={() => {
                const newItem = { 
                  id: Math.random().toString(36).substr(2, 9), 
                  title: "New Item",
                  image: "",
                  subtitle: "",
                  buttonText: "",
                  buttonLink: ""
                };
                onChange({ content: { ...block.content, items: [...(block.content.items || []), newItem] } });
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Carousel Card
            </Button>
          </div>
        </div>
      )}

      {block.type === "checked-list" && (
        <div className="space-y-3">
          <div className="flex gap-1.5 mb-2">
            <Button size="sm" variant={block.style.listType === "rounded" ? "default" : "outline"} className="rounded-lg h-7 text-[9px]" onClick={() => onChange({ style: { ...block.style, listType: "rounded" } })}>
              <Circle className="w-2.5 h-2.5 mr-1" /> Rounded
            </Button>
            <Button size="sm" variant={block.style.listType === "box" ? "default" : "outline"} className="rounded-lg h-7 text-[9px]" onClick={() => onChange({ style: { ...block.style, listType: "box" } })}>
              <Square className="w-2.5 h-2.5 mr-1" /> Box
            </Button>
            <Button size="sm" variant={block.style.listType === "arrow" ? "default" : "outline"} className="rounded-lg h-7 text-[9px]" onClick={() => onChange({ style: { ...block.style, listType: "arrow" } })}>
              <ArrowRight className="w-2.5 h-2.5 mr-1" /> Arrow
            </Button>
          </div>
          {block.content.items.map((item: string, i: number) => (
            <div key={i} className="flex gap-2 items-center">
              <div className="text-primary"><ListIcon type={block.style.listType} /></div>
              <Input 
                value={item} 
                onChange={(e) => {
                  const newItems = [...block.content.items];
                  newItems[i] = e.target.value;
                  onChange({ content: { ...block.content, items: newItems } });
                }} 
                className="h-8 text-sm rounded-lg"
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                const newItems = block.content.items.filter((_: any, idx: number) => idx !== i);
                onChange({ content: { ...block.content, items: newItems } });
              }}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          ))}
          <Button variant="ghost" className="w-full border-dashed border-2 h-8 rounded-lg text-[10px]" onClick={() => onChange({ content: { ...block.content, items: [...block.content.items, "New item"] } })}>
            <Plus className="w-3 h-3 mr-2" /> Add Item
          </Button>
        </div>
      )}

      {block.type === "product-order-form" && (
        <Card className="bg-primary/5 border-primary/20 rounded-xl">
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px]">Main Product</Label>
              <Select value={block.content.mainProductId} onValueChange={(val) => onChange({ content: { ...block.content, mainProductId: val } })}>
                <SelectTrigger className="rounded-lg h-9 text-xs"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px]">Upsell / Sub Products</Label>
              <div className="grid grid-cols-1 gap-1.5">
                {products.filter(p => p.id !== block.content.mainProductId).map(p => (
                  <label key={p.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer hover:border-primary transition-colors">
                    <input 
                      type="checkbox" 
                      checked={block.content.subProductIds.includes(p.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked 
                          ? [...block.content.subProductIds, p.id]
                          : block.content.subProductIds.filter((id: string) => id !== p.id);
                        onChange({ content: { ...block.content, subProductIds: newIds } });
                      }}
                      className="w-3.5 h-3.5 accent-primary"
                    />
                    <span className="text-[11px] font-medium truncate">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px]">Shipping</Label>
                <Select value={block.content.shippingType} onValueChange={(val) => onChange({ content: { ...block.content, shippingType: val } })}>
                  <SelectTrigger className="rounded-lg h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {block.content.shippingType === "paid" && (
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Cost ($)</Label>
                  <Input 
                    type="number" 
                    value={block.content.shippingCost} 
                    onChange={(e) => onChange({ content: { ...block.content, shippingCost: Number(e.target.value) } })} 
                    className="rounded-lg h-9 text-xs"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spacing Controls */}
      <div className="pt-2 border-t mt-2 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between text-[8px] text-muted-foreground font-bold uppercase tracking-wider">
          <span>Block Styling</span>
          <Settings2 className="w-3 h-3" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[8px]">Padding ({block.style.padding})</Label>
            <Slider defaultValue={[parseInt(block.style.padding || "20")]} max={80} step={4} onValueChange={([v]) => onChange({ style: { ...block.style, padding: `${v}px` } })} />
          </div>
          <div className="space-y-1">
            <Label className="text-[8px]">Margin ({block.style.margin})</Label>
            <Slider defaultValue={[parseInt(block.style.margin || "0")]} max={80} step={4} onValueChange={([v]) => onChange({ style: { ...block.style, margin: `${v}px` } })} />
          </div>
        </div>
      </div>
    </div>
  );
}

function getBlockIcon(type: BlockType) {
  switch (type) {
    case "header": return <Type className="w-3 h-3" />;
    case "paragraph": return <List className="w-3 h-3" />;
    case "image": return <ImageIcon className="w-3 h-3" />;
    case "carousel": return <Layout className="w-3 h-3" />;
    case "accordion": return <ChevronDown className="w-3 h-3" />;
    case "checked-list": return <CheckCircle className="w-3 h-3" />;
    case "product-order-form": return <ShoppingCart className="w-3 h-3" />;
    case "row": return <Columns className="w-3 h-3" />;
    default: return <Plus className="w-3 h-3" />;
  }
}

function ListIcon({ type }: { type?: string }) {
  switch (type) {
    case "rounded": return <Circle className="w-3 h-3 fill-current" />;
    case "box": return <Square className="w-3 h-3 fill-current" />;
    case "arrow": return <ArrowRight className="w-3 h-3" />;
    default: return <CheckCircle className="w-3 h-3" />;
  }
}
