import Hero from './components/Hero'
import ProductGrid from './components/ProductGrid'

export default function Home() {
  return (
    <div className="pt-16">
      <Hero />
      <ProductGrid />
      
      {/* About Section */}
      <section className="py-section md:py-section px-6 bg-warm-beige/30">
        <div className="max-w-site mx-auto text-center">
          <h2 className="font-satoshi font-bold text-3xl md:text-4xl text-matte-black mb-6">
            Why Kin Workspace?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="p-6">
              <div className="w-16 h-16 bg-matte-black rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-soft-white text-2xl">🎯</span>
              </div>
              <h3 className="font-satoshi font-semibold text-xl mb-3">Enhanced Focus</h3>
              <p className="text-slate-gray">
                Thoughtfully designed tools that minimize distractions and maximize your ability to concentrate on what matters most.
              </p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-matte-black rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-soft-white text-2xl">✨</span>
              </div>
              <h3 className="font-satoshi font-semibold text-xl mb-3">Intentional Design</h3>
              <p className="text-slate-gray">
                Every product is carefully crafted with purpose, combining aesthetic beauty with functional excellence.
              </p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-matte-black rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-soft-white text-2xl">🌱</span>
              </div>
              <h3 className="font-satoshi font-semibold text-xl mb-3">Sustainable Materials</h3>
              <p className="text-slate-gray">
                We prioritize eco-friendly materials and sustainable manufacturing processes for a better tomorrow.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}