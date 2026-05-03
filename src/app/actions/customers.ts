"use server";

import { db } from "@/lib/firebase-server";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, arrayUnion, setDoc } from "firebase/firestore";

export async function syncCustomerData(orderData: any) {
  const { storeId, ownerId, customer } = orderData;
  const { phone, email, address, ip } = customer;

  if (!phone) return;

  // Standardize phone number
  let normalizedPhone = phone.replace(/\D/g, '');
  if (normalizedPhone.length === 11 && normalizedPhone.startsWith('0')) {
    normalizedPhone = '88' + normalizedPhone;
  } else if (normalizedPhone.length === 10) {
    normalizedPhone = '880' + normalizedPhone;
  }

  try {
    // Search for customer by phone number in this store
    const customersRef = collection(db, "customers");
    const q = query(customersRef, where("storeId", "==", storeId), where("phones", "array-contains", normalizedPhone));
    const snap = await getDocs(q);

    if (!snap.empty) {
      // Update existing customer
      const customerDoc = snap.docs[0];
      const updatePayload: any = {
        phones: arrayUnion(normalizedPhone),
        lastActive: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      if (email) updatePayload.emails = arrayUnion(email);
      if (address) updatePayload.addresses = arrayUnion(address);
      if (ip) updatePayload.ips = arrayUnion(ip);

      await updateDoc(doc(db, "customers", customerDoc.id), updatePayload);
      return customerDoc.id;
    } else {
      // Create new customer
      const newCustomer = {
        storeId,
        ownerId,
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
