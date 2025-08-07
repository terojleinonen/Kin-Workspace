import './globals.css'
import { Inter } from 'next/font/google'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider } from './contexts/AuthContext'
import { WishlistProvider } from './contexts/WishlistContext'
import CartSidebar from './components/CartSidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Kin Workspace - Create Calm. Work Better.',
  description: 'Intentionally designed workspace tools that enhance focus, clarity, and calm for the modern professional.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-soft-white text-slate-gray`}>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <Navigation />
              <main>{children}</main>
              <Footer />
              <CartSidebar />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  )
}