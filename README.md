# Kin Workspace

*Create Calm. Work Better.*

A modern e-commerce website for workspace furniture and accessories, built with Next.js 15, TypeScript, and Tailwind CSS.

![Kin Workspace](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=Kin+Workspace)

## 🌟 Features

### Core Functionality
- **Product Catalog** - Browse workspace furniture and accessories
- **User Authentication** - Secure registration, login, and profile management
- **Shopping Cart** - Add, remove, and manage cart items with persistent storage
- **Wishlist** - Save products for later with heart icon interactions
- **Password Reset** - Secure password recovery flow
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices

### Technical Features
- **Server-Side Rendering** - Fast page loads with Next.js App Router
- **Database Integration** - SQLite with Prisma ORM for data persistence
- **Type Safety** - Full TypeScript implementation with strict mode
- **Testing** - Comprehensive test suite with Jest (27+ tests)
- **Modern UI** - Clean design with Tailwind CSS and custom design system

## 🚀 Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS with custom design system
- **Database:** SQLite with Prisma ORM
- **Authentication:** JWT tokens with bcrypt password hashing
- **UI Components:** Headless UI, Heroicons
- **Animations:** Framer Motion
- **Testing:** Jest with comprehensive test coverage

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/kin-workspace.git
   cd kin-workspace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration:
   ```
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- __tests__/auth-database.test.ts
```

**Test Coverage:**
- Authentication (registration, login, password reset)
- Database operations (user management, wishlist)
- API endpoints (auth, wishlist)
- UI components and interactions

## 🏗️ Project Structure

```
app/
├── api/                    # API routes
│   ├── auth/              # Authentication endpoints
│   └── wishlist/          # Wishlist endpoints
├── components/            # Reusable UI components
│   ├── auth/             # Authentication forms
│   ├── Navigation.tsx    # Site navigation
│   ├── ProductCard.tsx   # Product display
│   └── WishlistButton.tsx # Wishlist functionality
├── contexts/             # React Context providers
│   ├── AuthContext.tsx   # Authentication state
│   ├── CartContext.tsx   # Shopping cart state
│   └── WishlistContext.tsx # Wishlist state
├── lib/                  # Utilities and data
│   ├── auth-utils.ts     # Authentication helpers
│   ├── wishlist-utils.ts # Wishlist operations
│   ├── types.ts          # TypeScript interfaces
│   └── db.ts             # Database client
├── [pages]/              # File-based routing
└── globals.css           # Global styles
```

## 🎨 Design System

**Colors:**
- Soft White (`#FEFEFE`)
- Warm Beige (`#F5F1EB`)
- Slate Gray (`#64748B`)
- Matte Black (`#1A1A1A`)

**Typography:**
- Headings: Satoshi (custom font)
- Body: Inter (Google Fonts)

**Components:**
- Custom Tailwind utilities
- Consistent spacing and sizing
- Smooth animations and transitions

## 🔐 Authentication Features

- **User Registration** with email validation
- **Secure Login** with JWT tokens
- **Password Reset** with time-limited tokens
- **Profile Management** for user information
- **Protected Routes** for authenticated content
- **Session Management** with automatic token refresh

## 🛒 E-commerce Features

- **Product Catalog** with categories and filtering
- **Shopping Cart** with persistent storage
- **Wishlist** functionality with heart icons
- **Product Search** and navigation
- **Responsive Product Cards** with hover effects
- **Cart Management** (add, remove, update quantities)

## 📱 Responsive Design

- **Mobile-First** approach with Tailwind breakpoints
- **Touch-Friendly** interactions for mobile devices
- **Optimized Images** with Next.js Image component
- **Flexible Layouts** that adapt to screen sizes

## 🚀 Deployment

The project is ready for deployment on platforms like:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Heroku**

For production deployment:

1. Update environment variables
2. Configure database (PostgreSQL recommended for production)
3. Build the project: `npm run build`
4. Deploy using your preferred platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Design inspiration from modern workspace brands
- Next.js team for the excellent framework
- Tailwind CSS for the utility-first approach
- Prisma team for the excellent ORM

## 📞 Contact

- **Project Link:** [https://github.com/yourusername/kin-workspace](https://github.com/yourusername/kin-workspace)
- **Demo:** [https://kin-workspace.vercel.app](https://kin-workspace.vercel.app)

---

*Built with ❤️ for the modern workspace*