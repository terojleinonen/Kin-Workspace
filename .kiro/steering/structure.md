# Project Structure & Architecture

## App Router Structure
```
app/
├── components/          # Reusable UI components
│   ├── Navigation.tsx   # Sticky header with mobile menu
│   ├── Footer.tsx       # Site footer with newsletter
│   ├── Hero.tsx         # Homepage hero section
│   ├── ProductCard.tsx  # Individual product display
│   ├── ProductGrid.tsx  # Product listing with filters
│   ├── CartIcon.tsx     # Cart trigger button
│   └── CartSidebar.tsx  # Slide-out cart panel
├── contexts/            # React Context providers
│   └── CartContext.tsx  # Global cart state management
├── lib/                 # Utilities and data
│   ├── types.ts         # TypeScript interfaces
│   ├── product-data.ts  # Mock product database
│   ├── cart-utils.ts    # Cart helper functions
│   └── api-hooks.ts     # Data fetching hooks
├── api/                 # API routes
│   └── products/        # Product endpoints
├── [page-routes]/       # File-based routing
├── globals.css          # Global styles + Tailwind
├── layout.tsx           # Root layout with providers
└── page.tsx             # Homepage
```

## Design System
- **Colors:** Custom Tailwind palette (soft-white, warm-beige, slate-gray, matte-black)
- **Typography:** Satoshi (headings) + Inter (body) via Google Fonts
- **Spacing:** Custom section spacing (80px desktop, 40px mobile)
- **Max Width:** 1440px site container
- **Animations:** Custom keyframes for fade-in-up, zoom-in, float

## Component Patterns
- **Client Components:** Use 'use client' directive for interactivity
- **Server Components:** Default for static content and data fetching
- **Context Usage:** CartProvider wraps entire app in layout.tsx
- **Responsive Design:** Mobile-first with Tailwind breakpoints
- **Image Optimization:** Next.js Image component with remote patterns

## API Architecture
- **Route Handlers:** app/api/[endpoint]/route.ts pattern
- **Data Layer:** Mock database in lib/product-data.ts
- **Type Safety:** Shared interfaces in lib/types.ts
- **Error Handling:** Try-catch with proper HTTP status codes

## Naming Conventions
- **Files:** PascalCase for components, kebab-case for utilities
- **CSS Classes:** Tailwind utilities + custom classes in globals.css
- **TypeScript:** Interfaces with descriptive names (Product, CartItem, etc.)
- **API Routes:** RESTful patterns with proper HTTP methods