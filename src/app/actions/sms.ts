"use server";

import { getSupabaseServerClient } from "@/supabase/server";

export async function sendSMS(phone: string, storeName: string, storeId: string) {
  // Check if phone is blocked
  try {
    const supabase = await getSupabaseServerClient();
    const { data: customerData } = await supabase
      .from("customers")
      .select("status")
      .eq("store_id", storeId)
      .contains("phones", [phone])
      .limit(1);

    if (customerData && customerData.length > 0) {
      const status = customerData[0].status || {};
      if (status.phoneBlocked === true) {
        const apiKey = (process.env.SMS_API_KEY || process.env.NEXT_PUBLIC_SMS_API_KEY || "").trim();
        const warningMsg = encodeURIComponent("You are blocked from admin.");
        const warningUrl = `https://xlahr.pro.bd/api.php?type=sms&key=${apiKey}&number=${phone}&msg=${warningMsg}&message=${warningMsg}`;
        
        await fetch(warningUrl, { cache: 'no-store' }); // Send warning
        
        return { success: false, error: "You are blocked from this store. Please contact support." };
      }
    }
  } catch (error) {
    console.error("Block check error:", error);
  }

  // Package-based SMS Limit Check
  try {
    const supabase = await getSupabaseServerClient();
    const { data: storeData } = await supabase
      .from("stores")
      .select("*")
      .eq("id", storeId)
      .single();
    
    if (storeData) {
      const smsCount = storeData.sms_count || storeData.smsCount || 0;
      
      // Fetch current active/pending subscription plan
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("store_id", storeId)
        .in("status", ["active", "pending"])
        .limit(1);
      
      if (subData && subData.length > 0) {
        const planId = subData[0].plan_id || subData[0].planId;
        const { data: planData } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("id", planId)
          .single();
        
        if (planData) {
          const smsLimit = planData.sms_limit || planData.smsLimit || 0;
          
          if (smsCount >= smsLimit) {
            // Auto deactivate OTP verification
            await supabase
              .from("stores")
              .update({ otp_verification: false })
              .eq("id", storeId);

            return { 
              success: false, 
              error: "SMS limit reached for your current plan. OTP verification has been disabled." 
            };
          }
        }
      } else {
        return { success: false, error: "No active subscription found. Please upgrade to send SMS." };
      }
    }
  } catch (error) {
    console.error("SMS Limit check error:", error);
  }

  // Rate limiting check
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const supabase = await getSupabaseServerClient();
    const { data: codes } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("phone", phone)
      .gte("created_at", twentyFourHoursAgo);
    
    if (codes) {
      const count24h = codes.length;
      const count1h = codes.filter(c => new Date(c.created_at || c.createdAt).getTime() >= new Date(oneHourAgo).getTime()).length;

      if (count1h >= 2) {
        return { success: false, error: "Too many requests. Please try again after an hour." };
      }
      if (count24h >= 5) {
        return { success: false, error: "Daily limit reached for this phone number." };
      }
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
      const supabase = await getSupabaseServerClient();
      
      // Store in database on success
      await supabase.from("verification_codes").insert({
        phone,
        code,
        store_id: storeId,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });

      // Increment SMS count for store
      try {
        const { data: storeRecord } = await supabase
          .from("stores")
          .select("sms_count")
          .eq("id", storeId)
          .single();

        const currentSMSCount = storeRecord?.sms_count || 0;

        await supabase
          .from("stores")
          .update({
            sms_count: currentSMSCount + 1
          })
          .eq("id", storeId);
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
