
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { 
  SidebarProvider, Sidebar, SidebarContent, SidebarHeader, 
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, 
  SidebarInset, SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { 
  ShieldCheck, Users, Store, CreditCard, LayoutDashboard, 
  ChevronLeft, Loader2, AlertCircle, LogOut, Settings, BarChart,
  Bell, ArrowLeftRight, Layout, Globe
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function SaasAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [pendingTransactions, setPendingTransactions] = useState(0);
  const [pendingDomains, setPendingDomains] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/auth");
      return;
    }

    if (user && firestore) {
      const checkAdmin = async () => {
        try {
          const userRef = doc(firestore, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && userSnap.data().role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            router.push("/dashboard");
          }
        } catch (error) {
          console.error(error);
          setIsAdmin(false);
          router.push("/dashboard");
        }
      };
      checkAdmin();
    }
  }, [user, isUserLoading, firestore, router]);

  useEffect(() => {
    if (!firestore || isAdmin !== true) return;

    // Listen for pending transactions
    const qTx = query(collection(firestore, "saas_transactions"), where("status", "==", "pending"));
    const unsubTx = onSnapshot(qTx, (snap) => {
      setPendingTransactions(snap.size);
    }, async (err) => {
      const permissionError = new FirestorePermissionError({
        path: "saas_transactions",
        operation: "list",
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    // Listen for pending domains
    const qDom = query(collection(firestore, "custom_domain_requests"), where("status", "==", "pending"));
    const unsubDom = onSnapshot(qDom, (snap) => {
      setPendingDomains(snap.size);
    }, async (err) => {
      const permissionError = new FirestorePermissionError({
        path: "custom_domain_requests",
        operation: "list",
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    return () => {
      unsubTx();
      unsubDom();
    };
  }, [firestore, isAdmin]);

  if (isUserLoading || isAdmin === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-white mx-auto" />
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Verifying Access</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) return null;

  const menuItems = [
    { title: "Overview", icon: BarChart, href: "/saas-admin/overview" },
    { title: "Landing Page", icon: Layout, href: "/saas-admin/landing-page" },
    { title: "Users", icon: Users, href: "/saas-admin/users" },
    { title: "Customers", icon: Users, href: "/saas-admin/customers" },
    { title: "Shops", icon: Store, href: "/saas-admin/shops" },
    { title: "Subscriptions", icon: CreditCard, href: "/saas-admin/subscriptions" },
    { title: "Transactions", icon: ArrowLeftRight, href: "/saas-admin/transactions", badge: pendingTransactions },
    { title: "Domain Requests", icon: Globe, href: "/saas-admin/domains", badge: pendingDomains },
    { title: "Notifications", icon: Bell, href: "/saas-admin/notifications", badge: pendingTransactions + pendingDomains },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-950 text-slate-100">
        <Sidebar className="border-r border-white/5 bg-slate-900 text-slate-100">
          <SidebarHeader className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-xl shadow-indigo-600/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-headline font-black text-lg tracking-tight">NexusAdmin</h3>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none">Super Control</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="mt-2 space-y-1">
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={pathname === item.href} className="rounded-xl h-11 px-4 text-slate-400 hover:text-white hover:bg-white/5 data-[active=true]:bg-indigo-600 data-[active=true]:text-white">
                        <Link href={item.href} className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.title}</span>
                          </div>
                          {item.badge !== undefined && item.badge > 0 && (
                            <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none h-5 min-w-[20px] flex items-center justify-center p-0 text-[10px] font-black rounded-full shadow-lg shadow-rose-500/20">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <div className="mt-auto p-4 border-t border-white/5">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl hover:bg-white/5 text-slate-400 h-11">
                <ChevronLeft className="w-4 h-4" /> Exit Admin
              </Button>
            </Link>
          </div>
        </Sidebar>

        <SidebarInset className="bg-transparent">
          <header className="flex h-20 shrink-0 items-center justify-between px-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-slate-400" />
              <h2 className="text-xl font-headline font-black tracking-tight capitalize">
                {pathname.split("/").pop()?.replace('-', ' ')}
              </h2>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-bold">{user?.email}</span>
                  <span className="text-[10px] text-indigo-400 uppercase font-black tracking-widest">Global Administrator</span>
               </div>
               <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black">A</div>
            </div>
          </header>
          <main className="p-6 md:p-10">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
