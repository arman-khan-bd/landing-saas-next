"use server";

import { db } from "@/lib/firebase-server";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, arrayUnion, setDoc } from "firebase/firestore";

export async function syncCustomerData(orderData: any) {
  const { storeId, ownerId, customer } = orderData;
  const { phone, email, address, ip } = customer;

  if (!phone) return;

  // Standardize phone number to match checkout logic
  let normalizedPhone = phone.replace(/\D/g, '');
  if (normalizedPhone.length === 11 && normalizedPhone.startsWith('0')) {
    normalizedPhone = '88' + normalizedPhone;
  } else if (normalizedPhone.length === 13 && normalizedPhone.startsWith('880')) {
    // Already normalized
  } else if (normalizedPhone.length === 10) {
    normalizedPhone = '880' + normalizedPhone;
  }

  try {
    // Search for customer by phone number or email in this store
    const customersRef = collection(db, "customers");
    const phoneQ = query(customersRef, where("storeId", "==", storeId), where("phones", "array-contains", normalizedPhone));
    const phoneSnap = await getDocs(phoneQ);
    
    let existingDoc = null;
    if (!phoneSnap.empty) {
      existingDoc = phoneSnap.docs[0];
    } else if (email) {
      const emailQ = query(customersRef, where("storeId", "==", storeId), where("emails", "array-contains", email));
      const emailSnap = await getDocs(emailQ);
      if (!emailSnap.empty) existingDoc = emailSnap.docs[0];
    }

    if (existingDoc) {
      // Update existing customer with latest data
      const updatePayload: any = {
        fullName: customer.fullName || existingDoc.data().fullName || "Anonymous",
        primaryPhone: normalizedPhone,
        primaryEmail: email || existingDoc.data().primaryEmail,
        primaryAddress: address || existingDoc.data().primaryAddress,
        phones: arrayUnion(normalizedPhone),
        lastActive: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (customer.fullName) updatePayload.names = arrayUnion(customer.fullName);
      
      if (email) updatePayload.emails = arrayUnion(email);
      if (address) updatePayload.addresses = arrayUnion(address);
      if (ip) updatePayload.ips = arrayUnion(ip);

      await updateDoc(doc(db, "customers", existingDoc.id), updatePayload);
      return existingDoc.id;
    } else {
      // Create new customer
      const newCustomer = {
        storeId,
        ownerId,
        fullName: customer.fullName || "Anonymous",
        names: customer.fullName ? [customer.fullName] : ["Anonymous"],
        primaryPhone: normalizedPhone,
        primaryEmail: email || "",
        primaryAddress: address || "",
        phones: [normalizedPhone],
        emails: email ? [email] : [],
        addresses: address ? [address] : [],
        ips: ip ? [ip] : [],
        status: {
          phoneBlocked: false,
          emailBlocked: false,
          ipBlocked: false
        },
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        updatedAt: serverTimestamp(),
        notes: ""
      };
      const docRef = await addDoc(collection(db, "customers"), newCustomer);
      return docRef.id;
    }
  } catch (error) {
    console.error("Error syncing customer data:", error);
  }
}

export async function getCustomerStats(storeId: string) {
  try {
    const q = query(collection(db, "customers"), where("storeId", "==", storeId));
    const snap = await getDocs(q);
    return snap.docs.length;
  } catch (error) {
    return 0;
  }
}

export async function updateCustomerStatus(customerId: string, statusType: 'phoneBlocked' | 'emailBlocked' | 'ipBlocked', value: boolean) {
  try {
    const customerRef = doc(db, "customers", customerId);
    await updateDoc(customerRef, {
      [`status.${statusType}`]: value,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update status" };
  }
}
