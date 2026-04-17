# **App Name**: NexusCart

## Core Features:

- User Authentication & Profiles: Secure user registration, login, and profile management using Firebase Authentication, linking users to their owned stores.
- Store (Tenant) Management: Functionality for users to create, view, and manage their individual e-commerce stores, each uniquely identified by a store_id and subdomain, with data stored in Firestore collections.
- Product Catalog & Inventory: Tools for store owners to add, edit, list, and manage product details (name, price, stock) and associated store_id within a dedicated Firestore products collection.
- AI-Powered Product Descriptions: An integrated generative AI tool to assist store owners in crafting compelling and unique product descriptions based on provided attributes.
- Multi-tenant Subdomain Routing: Next.js Middleware logic to detect the tenant via subdomain (e.g., store1.nexuscart.com) and dynamically rewrite URLs to the corresponding store's dashboard.
- Cloud Image Management: Seamless integration with Cloudinary for robust product image uploads (using krishi-bazar preset and dj7pg5slk cloud) and optimized delivery for each store's catalog.
- Unified Store Dashboard: A responsive and component-rich dashboard layout using Shadcn UI (Sidebar, Navbar, Data Table) for store owners to manage their specific store's products and settings, with data filtered by the authenticated store_id.

## Style Guidelines:

- Primary color: A deep, professional blue (#145DCC) conveying trustworthiness and sophistication for core UI elements.
- Background color: A very subtle, cool light blue (#EEF3FC) providing a clean and expansive backdrop for content, derived from the primary hue but heavily desaturated and lightened.
- Accent color: A vibrant, clear green (#26D87F) to highlight key actions, growth-related metrics, and create visual interest without clashing with the primary blue.
- Headline font: 'Space Grotesk', a modern sans-serif with a tech-inspired edge, suitable for clear, impactful headings.
- Body font: 'Inter', a neutral and highly readable sans-serif, ensuring clarity and consistency across all text, particularly for data tables and detailed descriptions.
- Utilize icons consistently from the Lucide React library to maintain a clean, modern, and vector-based visual language across the application.
- Implement a flexible and responsive dashboard layout with a fixed sidebar for navigation and a top navbar for user-specific actions, as per Shadcn UI patterns.
- Incorporate subtle UI animations for state changes, loading indicators, and user interactions to provide a smooth and engaging user experience, particularly for Shadcn UI components.