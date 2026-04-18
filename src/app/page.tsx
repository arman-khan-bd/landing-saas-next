import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingCart, ShieldCheck, Zap, LogIn } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background overflow-x-hidden">
      <header className="fixed top-0 w-full p-4 sm:p-6 flex justify-between items-center max-w-7xl mx-auto bg-background/80 backdrop-blur-sm z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <ShoppingCart className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="text-xl sm:text-2xl font-headline font-bold text-primary tracking-tight">NexusCart</span>
        </div>
        <nav className="hidden lg:flex gap-8 text-sm font-medium">
          <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/auth">
            <Button variant="ghost" size="sm" className="rounded-full px-4 h-9 font-bold flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Button>
          </Link>
          <Link href="/auth">
            <Button size="sm" className="rounded-full px-4 h-9 shadow-lg shadow-primary/20">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="text-center mt-24 sm:mt-32 max-w-4xl w-full">
        <h1 className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl font-headline font-bold mb-4 sm:mb-6 leading-[1.1] text-foreground tracking-tight">
          Launch Your <span className="text-primary italic">Dream Store</span> in Seconds
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto font-body px-2">
          NexusCart is the most advanced multi-tenant e-commerce engine designed for high-performance brands. Fully customizable and built to scale.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
          <Link href="/auth" className="w-full sm:w-auto">
            <Button size="lg" className="w-full h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg rounded-full shadow-lg shadow-primary/20">
              Create Your Store <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </Link>
          <Link href="#demo" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg rounded-full">
              View Demo
            </Button>
          </Link>
        </div>

        <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left px-2 sm:px-0">
          <div className="p-6 sm:p-8 bg-white rounded-3xl shadow-sm border border-border/50 hover:shadow-md transition-shadow">
            <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-accent mb-4" />
            <h3 className="text-lg sm:text-xl font-headline font-bold mb-2">Instant Setup</h3>
            <p className="text-sm sm:text-base text-muted-foreground font-body leading-relaxed">No coding required. Just pick a name and start selling your products immediately.</p>
          </div>
          <div className="p-6 sm:p-8 bg-white rounded-3xl shadow-sm border border-border/50 hover:shadow-md transition-shadow">
            <ShieldCheck className="w-10 h-10 sm:w-12 sm:h-12 text-primary mb-4" />
            <h3 className="text-lg sm:text-xl font-headline font-bold mb-2">Secure & Scalable</h3>
            <p className="text-sm sm:text-base text-muted-foreground font-body leading-relaxed">Bank-grade security and a multi-tenant architecture built on top of Google Cloud.</p>
          </div>
          <div className="p-6 sm:p-8 bg-white rounded-3xl shadow-sm border border-border/50 hover:shadow-md transition-shadow">
            <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-accent mb-4" />
            <h3 className="text-lg sm:text-xl font-headline font-bold mb-2">Modern Checkout</h3>
            <p className="text-sm sm:text-base text-muted-foreground font-body leading-relaxed">Provide a seamless purchasing experience for your customers with our optimized cart.</p>
          </div>
        </div>
      </main>

      <footer className="mt-20 py-10 w-full border-t border-border/50 text-center">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
          &copy; {new Date().getFullYear()} NexusCart Engine. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
