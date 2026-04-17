
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
  Square, Circle, ArrowRight, Eye, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type BlockType = 
  | "header" 
  | "paragraph" 
  | "image" 
  | "accordion" 
  | "button" 
  | "link" 
  | "carousel" 
  | "block-grid" 
  | "checked-list" 
  | "product-order-form";

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
  };
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

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: getInitialContent(type),
      style: { padding: "20px", margin: "0px", textAlign: "left", columns: 1, listType: "rounded" }
    };
    setBlocks([...blocks, newBlock]);
  };

  const getInitialContent = (type: BlockType) => {
    switch (type) {
      case "header": return { text: "Section Heading", level: "h2" };
      case "paragraph": return { text: "Add your text content here..." };
      case "image": return { url: "" };
      case "accordion": return { items: [{ title: "Item 1", content: "Content 1" }] };
      case "button": return { text: "Click Here", link: "#" };
      case "link": return { text: "Learn More", link: "#" };
      case "carousel": return { images: [] };
      case "block-grid": return { items: [{ title: "Feature 1", desc: "Description" }] };
      case "checked-list": return { items: ["Item 1", "Item 2"] };
      case "product-order-form": return { mainProductId: "", subProductIds: [], shippingType: "free", shippingCost: 0 };
      default: return {};
    }
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newBlocks = [...blocks];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newBlocks.length) return;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const handleSave = async () => {
    if (!storeId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "stores", storeId), { landingPageConfig: blocks });
      toast({ title: "Page saved!", description: "Your changes are now live." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error saving", description: "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex flex-col lg:flex-row h-full gap-8">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-80 space-y-6">
        <Card className="rounded-3xl border-border/50 sticky top-24">
          <CardHeader>
            <CardTitle className="text-lg">Components</CardTitle>
            <CardDescription>Click to add blocks to your page</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl" onClick={() => addBlock("header")}>
              <Type className="w-5 h-5" /> <span className="text-xs">Header</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl" onClick={() => addBlock("paragraph")}>
              <List className="w-5 h-5" /> <span className="text-xs">Paragraph</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl" onClick={() => addBlock("image")}>
              <ImageIcon className="w-5 h-5" /> <span className="text-xs">Image</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl" onClick={() => addBlock("carousel")}>
              <Layout className="w-5 h-5" /> <span className="text-xs">Carousel</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl" onClick={() => addBlock("accordion")}>
              <ChevronDown className="w-5 h-5" /> <span className="text-xs">Accordion</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl" onClick={() => addBlock("block-grid")}>
              <Layout className="w-5 h-5" /> <span className="text-xs">Blocks</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl" onClick={() => addBlock("checked-list")}>
              <CheckCircle className="w-5 h-5" /> <span className="text-xs">Checked List</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl" onClick={() => addBlock("button")}>
              <Monitor className="w-5 h-5" /> <span className="text-xs">Button</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl" onClick={() => addBlock("link")}>
              <Monitor className="w-5 h-5" /> <span className="text-xs">Link</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl bg-primary/10 border-primary/50 text-primary" onClick={() => addBlock("product-order-form")}>
              <ShoppingCart className="w-5 h-5" /> <span className="text-xs font-bold">Checkout</span>
            </Button>
          </CardContent>
          <div className="p-6 border-t space-y-3">
            <Button className="w-full rounded-xl" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
              Save Page
            </Button>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => setIsPreviewOpen(true)}>
              <Eye className="mr-2 w-4 h-4" /> Full Preview
            </Button>
          </div>
        </Card>
      </div>

      {/* Editor Surface */}
      <div className="flex-1 space-y-4">
        <div className="flex justify-between items-center bg-muted/50 p-2 rounded-full max-w-2xl mx-auto mb-4 px-4">
          <div className="flex gap-2">
            <Button variant={viewMode === "desktop" ? "secondary" : "ghost"} size="sm" className="rounded-full" onClick={() => setViewMode("desktop")}>
              <Monitor className="w-4 h-4 mr-2" /> Desktop
            </Button>
            <Button variant={viewMode === "mobile" ? "secondary" : "ghost"} size="sm" className="rounded-full" onClick={() => setViewMode("mobile")}>
              <Smartphone className="w-4 h-4 mr-2" /> Mobile
            </Button>
          </div>
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest hidden sm:block">Editor Mode</div>
        </div>

        <div className={`mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden transition-all duration-500 min-h-[600px] border-border/50 ${viewMode === "mobile" ? "max-w-[375px]" : "w-full"}`}>
          <div className="p-4 bg-muted/20 border-b flex items-center justify-between">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Live Editor Preview</div>
            <div className="w-10" />
          </div>

          <div className="p-8 space-y-8">
            {blocks.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed rounded-3xl opacity-20">
                <Plus className="mx-auto w-12 h-12 mb-2" />
                <p>Add components to build your page</p>
              </div>
            ) : (
              blocks.map((block, index) => (
                <div key={block.id} className="group relative border-2 border-transparent hover:border-primary/20 rounded-2xl transition-all">
                  {/* Block Toolbar */}
                  <div className="absolute -left-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => moveBlock(index, "up")}>
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => moveBlock(index, "down")}>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={() => removeBlock(block.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="p-6">
                    <BlockSettingsEditor 
                      block={block} 
                      products={products}
                      onChange={(updates) => updateBlock(block.id, updates)} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Full Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 rounded-3xl overflow-hidden bg-background">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <div className="flex items-center gap-4">
                <DialogTitle className="text-xl font-headline font-bold">Landing Page Preview</DialogTitle>
                <div className="flex gap-2 ml-4">
                  <Button variant={viewMode === "desktop" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("desktop")}>Desktop</Button>
                  <Button variant={viewMode === "mobile" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("mobile")}>Mobile</Button>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsPreviewOpen(false)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto bg-muted/10 p-4 md:p-8">
              <div className={`mx-auto bg-white shadow-xl transition-all duration-300 min-h-full ${viewMode === "mobile" ? "max-w-[375px]" : "max-w-6xl w-full"}`}>
                <div className="py-12">
                  {blocks.map((block) => (
                    <BlockRenderer key={block.id} block={block} products={products} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BlockRenderer({ block, products }: { block: Block, products: any[] }) {
  const style = {
    padding: block.style.padding,
    margin: block.style.margin,
    textAlign: block.style.textAlign as any,
  };

  switch (block.type) {
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

    case "product-order-form":
      const mainProd = products.find(p => p.id === block.content.mainProductId);
      const subProds = products.filter(p => block.content.subProductIds.includes(p.id));
      
      return (
        <div style={style} className="px-6">
          <Card className="rounded-3xl shadow-xl border-primary/10 overflow-hidden">
            <CardHeader className="bg-primary text-white p-8">
              <CardTitle className="text-2xl font-headline font-bold">Checkout & Order</CardTitle>
              <CardDescription className="text-white/80">Complete your purchase in seconds.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
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
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">Limited Time Extras</p>
                      <div className="grid gap-2">
                        {subProds.map(p => (
                          <div key={p.id} className="flex justify-between items-center p-4 bg-muted/30 rounded-2xl border">
                            <div className="flex items-center gap-3">
                              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{p.name}</span>
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
                    <Input placeholder="Full Name" className="rounded-xl h-12" />
                    <Input placeholder="Phone Number" className="rounded-xl h-12" />
                    <Textarea placeholder="Full Address" className="rounded-xl min-h-[100px]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-lg">Order Summary</h4>
                  <div className="bg-muted/30 p-6 rounded-3xl space-y-4 border">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${mainProd?.currentPrice || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping ({block.content.shippingType})</span>
                      <span>{block.content.shippingType === 'free' ? 'FREE' : `$${block.content.shippingCost}`}</span>
                    </div>
                    <div className="flex justify-between pt-4 border-t font-bold text-xl text-primary">
                      <span>Total</span>
                      <span>${(mainProd?.currentPrice || 0) + (block.content.shippingType === 'paid' ? block.content.shippingCost : 0)}</span>
                    </div>
                  </div>
                  <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">
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

function BlockSettingsEditor({ block, products, onChange }: { block: Block, products: any[], onChange: (updates: Partial<Block>) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-primary/10 text-primary p-1.5 rounded-lg">
          {getBlockIcon(block.type)}
        </div>
        <span className="font-headline font-bold uppercase text-xs tracking-widest">{block.type}</span>
      </div>

      {block.type === "header" && (
        <div className="space-y-4">
          <Input 
            value={block.content.text} 
            onChange={(e) => onChange({ content: { ...block.content, text: e.target.value } })} 
            className="text-2xl font-bold font-headline border-none px-0 focus-visible:ring-0"
          />
          <div className="flex gap-2">
            {["h1", "h2", "h3"].map(level => (
              <Button key={level} size="sm" variant={block.content.level === level ? "default" : "outline"} onClick={() => onChange({ content: { ...block.content, level } })}>
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
          className="border-none px-0 focus-visible:ring-0 min-h-[100px] resize-none"
        />
      )}

      {block.type === "image" && (
        <CloudinaryUpload 
          value={block.content.url} 
          onUpload={(url) => onChange({ content: { ...block.content, url } })} 
          onRemove={() => onChange({ content: { ...block.content, url: "" } })} 
        />
      )}

      {block.type === "checked-list" && (
        <div className="space-y-4">
          <div className="flex gap-2 mb-2">
            <Button size="sm" variant={block.style.listType === "rounded" ? "default" : "outline"} onClick={() => onChange({ style: { ...block.style, listType: "rounded" } })}>
              <Circle className="w-3 h-3 mr-2" /> Rounded
            </Button>
            <Button size="sm" variant={block.style.listType === "box" ? "default" : "outline"} onClick={() => onChange({ style: { ...block.style, listType: "box" } })}>
              <Square className="w-3 h-3 mr-2" /> Box
            </Button>
            <Button size="sm" variant={block.style.listType === "arrow" ? "default" : "outline"} onClick={() => onChange({ style: { ...block.style, listType: "arrow" } })}>
              <ArrowRight className="w-3 h-3 mr-2" /> Arrow
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
              />
              <Button variant="ghost" size="icon" onClick={() => {
                const newItems = block.content.items.filter((_: any, idx: number) => idx !== i);
                onChange({ content: { ...block.content, items: newItems } });
              }}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
          <Button variant="ghost" className="w-full border-dashed border-2" onClick={() => onChange({ content: { ...block.content, items: [...block.content.items, "New item"] } })}>
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>
      )}

      {block.type === "product-order-form" && (
        <Card className="bg-primary/5 border-primary/20 rounded-2xl">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label>Main Product (Required)</Label>
              <Select value={block.content.mainProductId} onValueChange={(val) => onChange({ content: { ...block.content, mainProductId: val } })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select primary product" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Upsell / Sub Products (Optional)</Label>
              <div className="grid grid-cols-1 gap-2">
                {products.filter(p => p.id !== block.content.mainProductId).map(p => (
                  <label key={p.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border cursor-pointer hover:border-primary transition-colors">
                    <input 
                      type="checkbox" 
                      checked={block.content.subProductIds.includes(p.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked 
                          ? [...block.content.subProductIds, p.id]
                          : block.content.subProductIds.filter((id: string) => id !== p.id);
                        onChange({ content: { ...block.content, subProductIds: newIds } });
                      }}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm font-medium">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Shipping</Label>
                <Select value={block.content.shippingType} onValueChange={(val) => onChange({ content: { ...block.content, shippingType: val } })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free Delivery</SelectItem>
                    <SelectItem value="paid">Paid Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {block.content.shippingType === "paid" && (
                <div className="space-y-2">
                  <Label>Cost ($)</Label>
                  <Input 
                    type="number" 
                    value={block.content.shippingCost} 
                    onChange={(e) => onChange({ content: { ...block.content, shippingCost: Number(e.target.value) } })} 
                  />
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-xl border border-primary/10 space-y-4">
              <h4 className="font-bold text-sm text-primary flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Order Form Preview
              </h4>
              <div className="space-y-2 opacity-50 pointer-events-none">
                <Input placeholder="Full Name" className="rounded-lg h-9" />
                <Input placeholder="Phone Number" className="rounded-lg h-9" />
                <Textarea placeholder="Full Address" className="rounded-lg h-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spacing Controls */}
      <div className="pt-4 border-t mt-8 space-y-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-bold uppercase tracking-wider">
          <span>Layout & Style</span>
          <GripVertical className="w-3 h-3" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-[10px]">Padding ({block.style.padding})</Label>
            <Slider defaultValue={[parseInt(block.style.padding || "20")]} max={100} step={4} onValueChange={([v]) => onChange({ style: { ...block.style, padding: `${v}px` } })} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Margin ({block.style.margin})</Label>
            <Slider defaultValue={[parseInt(block.style.margin || "0")]} max={100} step={4} onValueChange={([v]) => onChange({ style: { ...block.style, margin: `${v}px` } })} />
          </div>
        </div>
      </div>
    </div>
  );
}

function getBlockIcon(type: BlockType) {
  switch (type) {
    case "header": return <Type className="w-4 h-4" />;
    case "paragraph": return <List className="w-4 h-4" />;
    case "image": return <ImageIcon className="w-4 h-4" />;
    case "carousel": return <Layout className="w-4 h-4" />;
    case "accordion": return <ChevronDown className="w-4 h-4" />;
    case "checked-list": return <CheckCircle className="w-4 h-4" />;
    case "product-order-form": return <ShoppingCart className="w-4 h-4" />;
    default: return <Plus className="w-4 h-4" />;
  }
}

function ListIcon({ type }: { type?: string }) {
  switch (type) {
    case "rounded": return <Circle className="w-4 h-4 fill-current" />;
    case "box": return <Square className="w-4 h-4 fill-current" />;
    case "arrow": return <ArrowRight className="w-4 h-4" />;
    default: return <CheckCircle className="w-4 h-4" />;
  }
}
