import Link from 'next/link'
import Image from 'next/image'

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
          alt="Clean workspace setup"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-matte-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1 className="font-satoshi font-bold text-4xl md:text-6xl lg:text-7xl text-soft-white mb-6 animate-fade-in-up">
          Create Calm.
          <br />
          Work Better.
        </h1>
        <p className="text-lg md:text-xl text-warm-beige mb-8 max-w-2xl mx-auto animate-fade-in-up">
          Intentionally designed workspace tools that enhance focus, clarity, and calm for the modern professional.
        </p>
        <Link
          href="/shop"
          className="inline-block btn-primary text-lg px-12 py-4 animate-fade-in-up"
        >
          Shop Now
        </Link>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-soft-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-soft-white rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  )
}