import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingCart, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background">
      <header className="fixed top-0 w-full p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <ShoppingCart className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-headline font-bold text-primary">NexusCart</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium">
          <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          <Link href="/auth" className="hover:text-primary transition-colors">Login</Link>
        </nav>
        <Link href="/auth">
          <Button size="lg" className="rounded-full">Get Started</Button>
        </Link>
      </header>

      <main className="text-center mt-32 max-w-4xl">
        <h1 className="text-6xl md:text-7xl font-headline font-bold mb-6 leading-tight text-foreground">
          Launch Your <span className="text-primary italic">Dream Store</span> in Seconds
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-body">
          NexusCart is the most advanced multi-tenant e-commerce engine designed for high-performance brands. Fully customizable, AI-powered, and built to scale.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full">
              Create Your Store <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="#demo">
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full">
              View Demo
            </Button>
          </Link>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-8 text-left">
          <div className="p-8 bg-white rounded-3xl shadow-sm border border-border/50">
            <Zap className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-headline font-bold mb-2">Instant Setup</h3>
            <p className="text-muted-foreground font-body">No coding required. Just pick a name and start selling your products immediately.</p>
          </div>
          <div className="p-8 bg-white rounded-3xl shadow-sm border border-border/50">
            <ShieldCheck className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-headline font-bold mb-2">Secure & Scalable</h3>
            <p className="text-muted-foreground font-body">Bank-grade security and a multi-tenant architecture built on top of Google Cloud.</p>
          </div>
          <div className="p-8 bg-white rounded-3xl shadow-sm border border-border/50">
            <ShoppingCart className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-headline font-bold mb-2">AI Descriptions</h3>
            <p className="text-muted-foreground font-body">Let our integrated AI write compelling product descriptions that convert visitors into buyers.</p>
          </div>
        </div>
      </main>
    </div>
  );
}