import { db } from "@/lib/firebase-server";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import LandingClient from "./LandingClient";
import { sanitizeData } from "@/lib/store-server";

// Force dynamic rendering to always fetch latest plans/features, or let Next.js handle it
export const revalidate = 60; // Cache for 60 seconds

async function getPlans() {
  try {
    const q = query(collection(db, "subscriptionPlans"), where("isActive", "==", true));
    const snap = await getDocs(q);
    const plans = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return sanitizeData(plans);
  } catch (e) {
    console.error("Error fetching plans on server:", e);
    return [];
  }
}

async function getFeatures() {
  try {
    const q = query(collection(db, "platformFeatures"), orderBy("order", "asc"));
    const snap = await getDocs(q);
    const features = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return sanitizeData(features);
  } catch (e) {
    console.error("Error fetching features on server:", e);
    return [];
  }
}

export default async function Home() {
  const [plans, features] = await Promise.all([getPlans(), getFeatures()]);

  return (
    <LandingClient
      initialPlans={plans}
      initialFeatures={features}
    />
  );
}
