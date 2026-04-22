
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs, serverTimestamp, addDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ShoppingCart, CheckCircle2, ChevronRight, ChevronLeft, Loader2, Store, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

import { Suspense } from "react";

function AuthPageContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    storeName: "",
    subdomain: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.push("/dashboard");
    });
    return () => unsubscribe();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const validateStep1 = () => {
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please fill in all personal details." });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.password.length < 6) {
      toast({ variant: "destructive", title: "Weak password", description: "Password must be at least 6 characters." });
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "Passwords mismatch", description: "Passwords do not match." });
      return false;
    }
    return true;
  };

  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain) return false;
    const q = query(collection(db, "stores"), where("subdomain", "==", subdomain.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const isAvailable = await checkSubdomainAvailability(formData.subdomain);
      if (!isAvailable) {
        toast({ variant: "destructive", title: "Subdomain taken", description: "Please choose another subdomain." });
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: formData.fullName });

      // Store User Data
      await setDoc(doc(db, "users", user.uid), {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        uid: user.uid,
        role: "user",
        createdAt: serverTimestamp(),
      });

      // Store Store Data
      const storeId = `store_${formData.subdomain.toLowerCase()}`;
      await setDoc(doc(db, "stores", storeId), {
        name: formData.storeName,
        subdomain: formData.subdomain.toLowerCase(),
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      // Create Initial Subscription
      if (planId) {
        await addDoc(collection(db, "stores", storeId, "subscription"), {
          planId,
          ownerId: user.uid,
          storeId: storeId,
          status: "pending",
          startDate: serverTimestamp(),
          currentPeriodStart: serverTimestamp(),
          currentPeriodEnd: serverTimestamp(), // Will be updated by billing logic
          createdAt: serverTimestamp(),
        });
      } else {
        // Fallback to Free Plan if no planId provided
        const freePlanQ = query(collection(db, "subscriptionPlans"), where("price", "==", 0), where("isActive", "==", true));
        const freePlanSnap = await getDocs(freePlanQ);
        if (!freePlanSnap.empty) {
          await addDoc(collection(db, "stores", storeId, "subscription"), {
            planId: freePlanSnap.docs[0].id,
            ownerId: user.uid,
            storeId: storeId,
            status: "active",
            startDate: serverTimestamp(),
            currentPeriodStart: serverTimestamp(),
            currentPeriodEnd: serverTimestamp(),
            createdAt: serverTimestamp(),
          });
        }
      }

      toast({ title: "Welcome to IHut.Shop!", description: "Your account and store have been created." });
      router.push("/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Signup Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      router.push("/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (isLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl border-border/50 rounded-3xl overflow-hidden">
          <CardHeader className="text-center bg-primary text-white p-8">
            <div className="mx-auto w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
              <ShoppingCart className="text-white w-7 h-7" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">IHut.Shop</CardTitle>
            <CardDescription className="text-white/80">Login to manage your empire.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={handleInputChange} required className="rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={formData.password} onChange={handleInputChange} required className="rounded-xl h-12" />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl text-lg font-medium" disabled={loading}>
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Login"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center p-6 bg-muted/30 border-t">
            <button onClick={() => setIsLogin(false)} className="text-sm font-medium text-primary hover:underline">
              New to IHut.Shop? Create an account
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-2xl border-border/50 rounded-3xl overflow-hidden">
        <CardHeader className="bg-primary text-white p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              <span className="font-headline font-bold text-xl">IHut.Shop</span>
            </div>
            <div className="text-xs font-medium bg-white/20 px-3 py-1 rounded-full">
              Step {step} of 3
            </div>
          </div>
          <Progress value={(step / 3) * 100} className="h-1 bg-white/20" />
        </CardHeader>

        <CardContent className="p-8">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-2xl font-headline font-bold">Personal Details</h2>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="John Doe" value={formData.fullName} onChange={handleInputChange} className="rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleInputChange} className="rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+880123456789" value={formData.phone} onChange={handleInputChange} className="rounded-xl h-12" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-2xl font-headline font-bold">Security</h2>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} className="rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleInputChange} className="rounded-xl h-12" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-2xl font-headline font-bold">Store Concept</h2>
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input id="storeName" placeholder="My Awesome Shop" value={formData.storeName} onChange={handleInputChange} className="rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex">
                  <Input id="subdomain" placeholder="myshop" value={formData.subdomain} onChange={handleInputChange} className="rounded-l-xl rounded-r-none h-12" />
                  <div className="h-12 bg-muted flex items-center px-4 rounded-r-xl border border-l-0 text-sm font-medium text-muted-foreground">
                    .ihut.shop
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">This will be your store's web address.</p>
              </div>
              {planId && (
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-3">
                  <Zap className="text-primary w-5 h-5" />
                  <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">Plan Selected</p>
                    <p className="text-sm font-medium text-slate-600">Your store will be launched on your selected tier.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between p-8 bg-muted/10 border-t">
          <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : setIsLogin(true)} className="rounded-xl h-12">
            <ChevronLeft className="mr-2 w-4 h-4" /> {step === 1 ? "Back to Login" : "Previous"}
          </Button>

          {step < 3 ? (
            <Button onClick={() => {
              if (step === 1 && validateStep1()) setStep(2);
              if (step === 2 && validateStep2()) setStep(3);
            }} className="rounded-xl h-12 px-8">
              Next <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSignup} className="rounded-xl h-12 px-8 bg-accent hover:bg-accent/90 text-white font-bold" disabled={loading}>
              {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <CheckCircle2 className="mr-2 w-5 h-5" />}
              Launch Store
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}
