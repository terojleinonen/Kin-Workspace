
# 📘 Kin Workspace — Design Documentation

## 1. 💡 Brand Overview
**Brand Name:** Kin Workspace  
**Tagline:** *Create Calm. Work Better.*  
**Mission:** To provide intentionally designed workspace tools that enhance focus, clarity, and calm for the modern professional.

## 2. 🎨 Visual Identity

### 2.1 Color Palette
| Name           | HEX      | Usage                        |
|----------------|----------|------------------------------|
| Soft White     | `#FAFAF8`| Background, cards            |
| Warm Beige     | `#E6E1D7`| Buttons, accents             |
| Slate Gray     | `#444444`| Body text, icons             |
| Matte Black    | `#141414`| Headlines, CTA, footer       |
| Dusty Sage     | `#EKB845`| Occasional highlights        |

### 2.2 Typography
- **Headings:** `Satoshi Bold` / `Satoshi SemiBold`
- **Body Text:** `Inter Regular`
- **Navigation/UI Text:** `Inter Medium`

## 3. 🧱 Layout & Structure

### 3.1 Spacing & Grid
- 12-column responsive grid  
- Max width: `1440px`  
- Gutters: `24px`  
- Section spacing: `80px` desktop, `40px` mobile

### 3.2 Responsive Breakpoints
| Device       | Width        |
|--------------|--------------|
| Mobile       | 320–767px    |
| Tablet       | 768–1023px   |
| Laptop       | 1024–1439px  |
| Desktop HD   | 1440px+      |

## 4. 🧩 UI Components

### 4.1 Navigation Bar
- Logo (left-aligned, text or minimal monogram)  
- Links: `shop / inspiration / journal / about / support`  
- Dark mode toggle (optional)  
- Sticky with subtle scroll animation

### 4.2 Hero Section
- Full-width clean product photo  
- Tagline overlay: *“Create Calm. Work Better.”*  
- CTA Button: `Shop Now`  
  - Style: Rounded, matte black or beige with hover transition

### 4.3 Product Cards
- Image container (1:1 or 3:2)  
- Title in `Satoshi SemiBold`, price in smaller `Inter`  
- On hover: subtle zoom-in + shadow lift  
- Filter/sort: color, material, function

### 4.4 Product Page
- Left: image gallery with zoom/scroll  
- Right:  
  - Title, price, material, shipping info  
  - CTA: `Add to Cart`  
  - Related products grid below

### 4.5 Footer
- Navigation links  
- Brand logo  
- Newsletter signup  
- Social icons (subtle, monochrome)

## 5. 📸 Photography Guidelines

- **Style:** Neutral tones, warm lighting  
- **Subject Focus:** Minimal clutter, 1–2 objects per image  
- **Use Cases:**  
  - Full setup shots (for hero/inspo)  
  - Detail close-ups (materials, finishes)  
  - Lifestyle in-use shots (hands, writing, typing)

## 6. 🔧 Technical Suggestions

### 6.1 Tech Stack
- **Frontend:** Next.js + Tailwind CSS  
- **CMS:** Sanity or Headless Shopify  
- **E-Commerce:** Shopify (custom storefront) or Snipcart  
- **Hosting:** Vercel  
- **Images:** Cloudinary (for lazy loading + optimization)

### 6.2 Accessibility
- WCAG 2.1 AA compliance  
- Alt text for all product and UI images  
- Clear focus states for keyboard navigation

## 7. 📱 Mobile UX Notes
- Sticky nav minimized on scroll  
- Touch-optimized filters and carousels  
- Fixed bottom `Add to Cart` CTA on product page  
- Performance budget <2s LCP (Largest Contentful Paint)

## 8. 🔁 Animations & Microinteractions
- **Button Hover:** soft fade or elevation  
- **Scroll Load:** fade in with slight upward motion  
- **Product Hover:** zoom 1.05x, 100ms ease-out  
- **Dark Mode Toggle:** animated transition (fade, not flash)

## 9. 🧭 Sitemap

```
/ (Home)
/shop
  /desks
  /accessories
  /lighting
  /seating
/product/[slug]
/journal
/inspiration
/about
/support
```
