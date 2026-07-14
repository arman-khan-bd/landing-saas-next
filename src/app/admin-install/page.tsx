"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldCheck, Loader2, AlertTriangle, KeyRound, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminInstallPage() {
  const [isAdminCreated, setIsAdminCreated] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseClient();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      // Check if there are any users in the public.users table with role = 'admin'
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin")
        .limit(1);

      if (data && data.length > 0) {
        setIsAdminCreated(true);
      } else {
        setIsAdminCreated(false);
      }
    } catch (e) {
      console.error("Checking admin status failed:", e);
      setIsAdminCreated(false);
    } finally {
      setChecking(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
      toast({ variant: "destructive", title: "Required Fields", description: "Please fill in all the details." });
      return;
    }
    if (formData.password.length < 6) {
      toast({ variant: "destructive", title: "Weak Password", description: "Password must be at least 6 characters." });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "Mismatch", description: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      // 1. Double check before creating if an admin was created in the meantime
      const { data: existingAdmins } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin")
        .limit(1);

      if (existingAdmins && existingAdmins.length > 0) {
        toast({ variant: "destructive", title: "Access Denied", description: "An administrator has already been registered." });
        setIsAdminCreated(true);
        setLoading(false);
        return;
      }

      // 2. Sign up the user in Supabase auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.fullName } },
      });

      if (signUpError || !authData.user) {
        throw new Error(signUpError?.message || "Could not create authenticated user.");
      }

      const userId = authData.user.id;

      // 3. Store the user in public.users table as admin using upsert (as DB trigger handles initial auth mapping)
      const { error: profileError } = await supabase.from("users").upsert({
        id: userId,
        email: formData.email,
        full_name: formData.fullName,
        phone: formData.phone,
        role: "admin",
      });

      if (profileError) {
        throw new Error(profileError.message);
      }

      toast({ title: "Super Admin Created", description: "Your global administrator account has been set up." });
      setIsAdminCreated(true);
      
      // Redirect to admin overview
      router.push("/saas-admin/overview");
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Setup Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Scanning System Parameters</p>
        </div>
      </div>
    );
  }

  if (isAdminCreated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-md bg-slate-900 border-white/5 rounded-[40px] shadow-2xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-indigo-600/10 border border-indigo-600/20 rounded-3xl flex items-center justify-center text-indigo-400 mx-auto">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Setup Completed</h1>
            <p className="text-sm text-slate-400">
              The platform administrator has already been registered. This setup page has been permanently disabled.
            </p>
          </div>
          <Button onClick={() => router.push("/auth")} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-base shadow-xl shadow-indigo-600/20">
            Proceed to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-lg bg-slate-900 border-white/5 rounded-[40px] shadow-2xl overflow-hidden">
        <CardHeader className="text-center bg-indigo-950/40 p-10 border-b border-white/5">
          <div className="mx-auto w-14 h-14 bg-indigo-600/10 border border-indigo-600/20 rounded-3xl flex items-center justify-center mb-4">
            <KeyRound className="text-indigo-400 w-7 h-7" />
          </div>
          <CardTitle className="text-3xl font-headline font-black text-white uppercase tracking-tight">Nexus Install</CardTitle>
          <CardDescription className="text-slate-400 mt-2">
            Register the first administrator account to bootstrap your platform.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 md:p-10">
          <form onSubmit={handleCreateAdmin} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-400">Full Name</Label>
                <Input id="fullName" placeholder="Super Admin" value={formData.fullName} onChange={handleInputChange} required className="bg-white/5 border-white/10 rounded-xl h-12 text-white focus:border-indigo-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-400">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+8801700000000" value={formData.phone} onChange={handleInputChange} required className="bg-white/5 border-white/10 rounded-xl h-12 text-white focus:border-indigo-500" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-400">Email Address</Label>
              <Input id="email" type="email" placeholder="admin@ihut.shop" value={formData.email} onChange={handleInputChange} required className="bg-white/5 border-white/10 rounded-xl h-12 text-white focus:border-indigo-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-400">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} required className="bg-white/5 border-white/10 rounded-xl h-12 text-white focus:border-indigo-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-400">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleInputChange} required className="bg-white/5 border-white/10 rounded-xl h-12 text-white focus:border-indigo-500" />
              </div>
            </div>

            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Important Security Note</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Only one global administrator can be created. Once you complete this step, the installation interface is permanently disabled.
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-base shadow-xl shadow-indigo-600/20" disabled={loading}>
              {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
              Complete Installation
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
