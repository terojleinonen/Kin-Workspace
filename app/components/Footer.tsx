import Link from 'next/link'

export default function Footer() {
  const footerLinks = {
    Shop: [
      { href: '/shop/desks', label: 'Desks' },
      { href: '/shop/accessories', label: 'Accessories' },
      { href: '/shop/lighting', label: 'Lighting' },
      { href: '/shop/seating', label: 'Seating' },
    ],
    Company: [
      { href: '/about', label: 'About' },
      { href: '/journal', label: 'Journal' },
      { href: '/inspiration', label: 'Inspiration' },
      { href: '/support', label: 'Support' },
    ],
  }

  return (
    <footer className="bg-matte-black text-soft-white">
      <div className="max-w-site mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="font-satoshi font-bold text-2xl mb-4">Kin Workspace</h3>
            <p className="text-warm-beige mb-6 max-w-md">
              Create Calm. Work Better. Intentionally designed workspace tools for the modern professional.
            </p>
            
            {/* Newsletter */}
            <div className="mb-6">
              <h4 className="font-satoshi font-semibold mb-3">Stay Updated</h4>
              <div className="flex max-w-md">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-slate-gray text-soft-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-warm-beige"
                />
                <button className="px-6 py-2 bg-warm-beige text-matte-black rounded-r-lg font-medium hover:bg-opacity-90 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-satoshi font-semibold mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-warm-beige hover:text-soft-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-gray mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-warm-beige text-sm">
            © 2024 Kin Workspace. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-warm-beige hover:text-soft-white text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-warm-beige hover:text-soft-white text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}