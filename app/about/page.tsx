import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="pt-24 pb-section">
      <div className="max-w-site mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="font-satoshi font-bold text-4xl md:text-5xl text-matte-black mb-6">
            About Kin Workspace
          </h1>
          <p className="text-xl text-slate-gray max-w-3xl mx-auto leading-relaxed">
            We believe that your workspace should be a sanctuary of calm and productivity. 
            Every product we create is thoughtfully designed to enhance focus, reduce stress, 
            and inspire creativity in your daily work.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="font-satoshi font-bold text-3xl text-matte-black mb-6">
              Our Story
            </h2>
            <p className="text-slate-gray mb-6 leading-relaxed">
              Founded in 2023, Kin Workspace emerged from a simple observation: the modern professional 
              spends countless hours at their desk, yet most workspaces are chaotic, uninspiring, and 
              counterproductive to deep work.
            </p>
            <p className="text-slate-gray mb-6 leading-relaxed">
              We set out to change that by creating products that don't just look beautiful, but actively 
              contribute to a sense of calm and focus. Every piece in our collection is designed with 
              intention, crafted with care, and built to last.
            </p>
            <p className="text-slate-gray leading-relaxed">
              Today, we're proud to help thousands of professionals create workspaces that truly work for them.
            </p>
          </div>
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="Our workspace philosophy"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-warm-beige/30 rounded-2xl p-8 md:p-12 mb-20">
          <h2 className="font-satoshi font-bold text-3xl text-matte-black text-center mb-12">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-matte-black rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-soft-white text-3xl">🎯</span>
              </div>
              <h3 className="font-satoshi font-semibold text-xl mb-4">Intentional Design</h3>
              <p className="text-slate-gray">
                Every element serves a purpose. We eliminate the unnecessary and amplify what matters.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-matte-black rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-soft-white text-3xl">🌱</span>
              </div>
              <h3 className="font-satoshi font-semibold text-xl mb-4">Sustainability</h3>
              <p className="text-slate-gray">
                We source responsibly and build products that last, reducing waste and environmental impact.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-matte-black rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-soft-white text-3xl">✨</span>
              </div>
              <h3 className="font-satoshi font-semibold text-xl mb-4">Quality Craftsmanship</h3>
              <p className="text-slate-gray">
                We partner with skilled artisans who share our commitment to excellence and attention to detail.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="text-center">
          <h2 className="font-satoshi font-bold text-3xl text-matte-black mb-6">
            Meet the Team
          </h2>
          <p className="text-slate-gray max-w-2xl mx-auto mb-12">
            We're a small but passionate team of designers, craftspeople, and workspace enthusiasts 
            dedicated to helping you create your perfect work environment.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((member) => (
              <div key={member} className="text-center">
                <div className="w-32 h-32 bg-warm-beige rounded-full mx-auto mb-4"></div>
                <h3 className="font-satoshi font-semibold text-lg mb-2">Team Member {member}</h3>
                <p className="text-slate-gray text-sm">Role & Department</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}