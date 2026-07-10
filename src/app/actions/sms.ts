"use server";

import { db } from "@/lib/firebase-server";
import { collection, query, where, getDocs, Timestamp, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } from "firebase/firestore";

export async function sendSMS(phone: string, storeName: string, storeId: string) {
  // Check if phone is blocked
  try {
    const customerQ = query(
      collection(db, "customers"),
      where("storeId", "==", storeId),
      where("phones", "array-contains", phone),
      where("status.phoneBlocked", "==", true)
    );
    const customerSnap = await getDocs(customerQ);
    
    if (!customerSnap.empty) {
      // Send warning SMS even if blocked? User said: "get a warning sms you are blocked from admin"
      // But we should probably only do this once or handle it carefully.
      // For now, let's return the error and send the warning if they try to verify.
      
      const apiKey = (process.env.SMS_API_KEY || process.env.NEXT_PUBLIC_SMS_API_KEY || "").trim();
      const warningMsg = encodeURIComponent("You are blocked from admin.");
      const warningUrl = `https://xlahr.pro.bd/api.php?type=sms&key=${apiKey}&number=${phone}&msg=${warningMsg}&message=${warningMsg}`;
      
      await fetch(warningUrl, { cache: 'no-store' }); // Send warning
      
      return { success: false, error: "You are blocked from this store. Please contact support." };
    }
  } catch (error) {
    console.error("Block check error:", error);
  }

  // Package-based SMS Limit Check
  try {
    const storeRef = doc(db, "stores", storeId);
    const storeSnap = await getDoc(storeRef);
    
    if (storeSnap.exists()) {
      const storeData = storeSnap.data();
      const smsCount = storeData.smsCount || 0;
      
      // Fetch current active/pending subscription plan
      const subQ = query(
        collection(db, "stores", storeId, "subscription"),
        where("status", "in", ["active", "pending"])
      );
      const subSnap = await getDocs(subQ);
      
      if (!subSnap.empty) {
        const subData = subSnap.docs[0].data();
        const planId = subData.planId;
        const planSnap = await getDoc(doc(db, "subscriptionPlans", planId));
        
        if (planSnap.exists()) {
          const planData = planSnap.data();
          const smsLimit = planData.smsLimit || 0;
          
          if (smsCount >= smsLimit) {
            // Auto deactivate OTP verification
            await updateDoc(storeRef, { otpVerification: false });
            return { 
              success: false, 
              error: "SMS limit reached for your current plan. OTP verification has been disabled." 
            };
          }
        }
      } else {
        // No active subscription? Maybe allow a small default or block.
        // For now, let's assume no subscription means 0 limit or they shouldn't send SMS.
        return { success: false, error: "No active subscription found. Please upgrade to send SMS." };
      }
    }
  } catch (error) {
    console.error("SMS Limit check error:", error);
  }

  // Rate limiting check
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    const q = query(
      collection(db, "verification_codes"),
      where("phone", "==", phone),
      where("createdAt", ">=", Timestamp.fromDate(twentyFourHoursAgo))
    );
    
    const snap = await getDocs(q);
    const codes = snap.docs.map(d => d.data());
    
    const count24h = codes.length;
    const count1h = codes.filter(c => c.createdAt.toDate() >= oneHourAgo).length;

    if (count1h >= 2) {
      return { success: false, error: "Too many requests. Please try again after an hour." };
    }
    if (count24h >= 5) {
      return { success: false, error: "Daily limit reached for this phone number." };
    }
  } catch (error) {
    console.error("Rate limit check error:", error);
  }

  // Generate Code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const message = `আপনার ${storeName} একাউন্ট ভেরিফিকেশন কোড: ${code}। নিরাপত্তার স্বার্থে কোডটি গোপন রাখুন।`;

  const apiKey = (process.env.SMS_API_KEY || process.env.NEXT_PUBLIC_SMS_API_KEY || "").trim();
  
  if (!apiKey) {
    console.error("SMS Error: API Key is missing in .env");
    return { success: false, error: "SMS configuration error" };
  }

  const type = "sms";
  const encodedMsg = encodeURIComponent(message);
  const url = `https://xlahr.pro.bd/api.php?type=${type}&key=${apiKey}&number=${phone}&msg=${encodedMsg}&message=${encodedMsg}`;
  
  try {
    const response = await fetch(url, { cache: 'no-store', redirect: 'follow' });
    const responseText = await response.text();
    
    const isSuccess = responseText.includes("success") || responseText.includes("sent") || responseText.includes("1000");
    
    if (isSuccess) {
      // Store in database on success
      await addDoc(collection(db, "verification_codes"), {
        phone,
        code,
        storeId,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
      });

      // Increment SMS count for store
      try {
        await updateDoc(doc(db, "stores", storeId), {
          smsCount: increment(1)
        });
      } catch (e) {
        console.error("Increment SMS count error:", e);
      }

      return { success: true };
    }
    
    return { success: false, error: responseText };
  } catch (error) {
    console.error("SMS Error:", error);
    return { success: false, error: "Failed to send SMS" };
  }
}
