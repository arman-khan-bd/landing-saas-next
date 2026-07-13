-- Add home_sections configuration column to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS home_sections JSONB DEFAULT '[
  { "id": "announcement_bar", "title": "Announcement Bar", "enabled": true, "config": { "text": "নিত্যপ্রয়োজনীয় পণ্য নিয়ে আমরা আছি আপনার পাশে। দেশজুড়ে ক্যাশ অন ডেলিভারি!" } },
  { "id": "header", "title": "Header", "enabled": true, "config": { "logoTextBn": "ঘরোয়া বাজার", "logoTextEn": "PURE & TRUSTED" } },
  { "id": "category_nav", "title": "Category Pills Navigation", "enabled": true, "config": {} },
  { "id": "hero", "title": "Hero Banners", "enabled": true, "config": { "badgeText": "100% PURE & NATURAL", "title": "খাটি ও নিরাপদ পন্যের সমাহার", "subtitle": "সুস্বাস্থ্যই আমাদের মূল লক্ষ্য। সরাসরি খামার থেকে আপনাদের হাতে পৌঁছে দিচ্ছি বিশুদ্ধ খাবার।", "buttonText": "পণ্যসমূহ দেখুন", "buttonLink": "#products", "sideBanner1Label": "SPECIAL OFFER", "sideBanner1Title": "মধু ও অর্গানিক তেল সংগ্রহ করুন", "sideBanner1ButtonText": "অর্ডার করুন", "sideBanner1Link": "#", "sideBanner2Label": "POPULAR CATEGORY", "sideBanner2Title": "প্রাকৃতিক উপাদানে তৈরি হেলথ পাউডার", "sideBanner2ButtonText": "অর্ডার করুন", "sideBanner2Link": "#" } },
  { "id": "trust_strip", "title": "Trust Strip", "enabled": true, "config": {} },
  { "id": "category_grid", "title": "Category Icons Grid", "enabled": true, "config": {} },
  { "id": "flash_sale", "title": "Flash Sale Countdown", "enabled": true, "config": { "title": "ধামাকা ফ্ল্যাশ সেল!", "subtitle": "সীমিত সময়ের অফার, দ্রুত সংগ্রহ করুন!", "countdownDate": "2026-07-20T23:59:59", "buttonText": "অফার দেখুন" } },
  { "id": "products_grid", "title": "Featured Products Grid", "enabled": true, "config": { "title": "আমাদের জনপ্রিয় পণ্যসমূহ", "subtitle": "গ্রাহকদের পছন্দের তালিকার শীর্ষে থাকা সেরা পণ্যসমূহ সংগ্রহ করুন।" } },
  { "id": "promo_banners", "title": "Promo Banners Grid", "enabled": true, "config": { "banner1Title": "খাটি ঘি ও মধু কিনুন", "banner1Subtitle": "স্পেশাল ডিসকাউন্ট", "banner2Title": "ঘরোয়া মশলা সামগ্রী", "banner2Subtitle": "শতভাগ নিরাপদ", "banner3Title": "অর্গানিক স্কিন কেয়ার", "banner3Subtitle": "প্রাকৃতিক সৌন্দর্য" } },
  { "id": "app_download", "title": "App Download Banner", "enabled": true, "config": { "title": "ঘরোয়া বাজার অ্যাপ ডাউনলোড করুন", "subtitle": "সহজে অর্ডার করতে এবং নিয়মিত আপডেট পেতে আমাদের মোবাইল অ্যাপটি ডাউনলোড করুন।" } },
  { "id": "testimonials", "title": "Customer Testimonials", "enabled": true, "config": {} },
  { "id": "footer", "title": "Footer Settings", "enabled": true, "config": { "description": "ঘরোয়া বাজার আপনাদের জন্য নিয়ে এসেছে সম্পূর্ণ খাটি ও রাসায়নিক মুক্ত নিত্যপ্রয়োজনীয় খাদ্যপণ্য। আমাদের লক্ষ্য সবার কাছে ভেজালহীন খাদ্য পৌঁছে দেওয়া।" } }
]'::jsonb;
