"use server";

import { getSupabaseServerClient } from "@/supabase/server";

export async function syncCustomerData(orderData: any) {
  const { storeId, ownerId, customer } = orderData;
  const { phone, email, address, ip } = customer;

  if (!phone) return;

  // Standardize phone number
  let normalizedPhone = phone.replace(/\D/g, '');
  if (normalizedPhone.length === 11 && normalizedPhone.startsWith('0')) {
    normalizedPhone = '88' + normalizedPhone;
  } else if (normalizedPhone.length === 13 && normalizedPhone.startsWith('880')) {
    // Already normalized
  } else if (normalizedPhone.length === 10) {
    normalizedPhone = '880' + normalizedPhone;
  }

  try {
    const supabase = await getSupabaseServerClient();
    
    // Find customer by store_id and matching phone or email
    let existingCustomer = null;
    
    const { data: phoneMatch } = await supabase
      .from("customers")
      .select("*")
      .eq("store_id", storeId)
      .contains("phones", [normalizedPhone])
      .limit(1);

    if (phoneMatch && phoneMatch.length > 0) {
      existingCustomer = phoneMatch[0];
    } else if (email) {
      const { data: emailMatch } = await supabase
        .from("customers")
        .select("*")
        .eq("store_id", storeId)
        .contains("emails", [email])
        .limit(1);
      if (emailMatch && emailMatch.length > 0) {
        existingCustomer = emailMatch[0];
      }
    }

    if (existingCustomer) {
      // Update existing customer
      const phones = Array.from(new Set([...(existingCustomer.phones || []), normalizedPhone]));
      const emails = email ? Array.from(new Set([...(existingCustomer.emails || []), email])) : (existingCustomer.emails || []);
      const addresses = address ? Array.from(new Set([...(existingCustomer.addresses || []), address])) : (existingCustomer.addresses || []);
      const ips = ip ? Array.from(new Set([...(existingCustomer.ips || []), ip])) : (existingCustomer.ips || []);
      const names = customer.fullName ? Array.from(new Set([...(existingCustomer.names || []), customer.fullName])) : (existingCustomer.names || []);

      const updatePayload = {
        full_name: customer.fullName || existingCustomer.full_name || "Anonymous",
        primary_phone: normalizedPhone,
        primary_email: email || existingCustomer.primary_email,
        primary_address: address || existingCustomer.primary_address,
        phones,
        emails,
        addresses,
        ips,
        names,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: updatedRecord, error } = await supabase
        .from("customers")
        .update(updatePayload)
        .eq("id", existingCustomer.id)
        .select()
        .single();

      if (error) throw error;
      return updatedRecord.id;
    } else {
      // Create new customer
      const newCustomer = {
        store_id: storeId,
        owner_id: ownerId,
        full_name: customer.fullName || "Anonymous",
        names: customer.fullName ? [customer.fullName] : ["Anonymous"],
        primary_phone: normalizedPhone,
        primary_email: email || "",
        primary_address: address || "",
        phones: [normalizedPhone],
        emails: email ? [email] : [],
        addresses: address ? [address] : [],
        ips: ip ? [ip] : [],
        status: {
          phoneBlocked: false,
          emailBlocked: false,
          ipBlocked: false
        },
        notes: "",
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const { data: insertedRecord, error } = await supabase
        .from("customers")
        .insert(newCustomer)
        .select()
        .single();

      if (error) throw error;
      return insertedRecord.id;
    }
  } catch (error) {
    console.error("Error syncing customer data:", error);
  }
}

export async function getCustomerStats(storeId: string) {
  try {
    const supabase = await getSupabaseServerClient();
    const { count, error } = await supabase
      .from("customers")
      .select("*", { count: 'exact', head: true })
      .eq("store_id", storeId);
    if (error) throw error;
    return count || 0;
  } catch (error) {
    return 0;
  }
}

export async function updateCustomerStatus(customerId: string, statusType: 'phoneBlocked' | 'emailBlocked' | 'ipBlocked', value: boolean) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Fetch existing status first
    const { data: customer, error: fetchError } = await supabase
      .from("customers")
      .select("status")
      .eq("id", customerId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const currentStatus = customer?.status || {};
    const updatedStatus = { ...currentStatus, [statusType]: value };

    const { error } = await supabase
      .from("customers")
      .update({
        status: updatedStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", customerId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update status" };
  }
}
