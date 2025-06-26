import Image from "next/image";
import Link from "next/link";
import { Leaf, ShoppingBag, Star, Truck, Shield, Heart } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-eco-50 flex flex-col items-center">
  {/* Decorative minimalist divider */}
  <div className="w-full h-2 bg-gradient-to-r from-eco-200 via-ocean-100 to-earth-100 mb-8" />
      {/* Hero Section */}
      <section className="relative bg-eco-50 py-24 flex flex-col items-center w-full border-b border-eco-100">
  {/* Globe background accent */}
  <div className="absolute inset-0 flex justify-center items-center pointer-events-none opacity-20">
    <Image src="/globe.svg" alt="Eco Globe" width={320} height={320} className="mx-auto" />
  </div>
  <div className="relative z-10 max-w-2xl w-full text-center mx-auto px-4">
    <span className="inline-block h-1 w-24 rounded bg-eco-300 mb-8" />
    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-eco-700 font-sans tracking-tight leading-tight">
      Shop Sustainably,<br />
      <span className="text-ocean-500 font-light">Live Responsibly</span>
    </h1>
    <p className="text-xl md:text-2xl text-eco-700 mb-10 font-light max-w-xl mx-auto">
      Discover eco-friendly products that make a difference for you and the planet.<br />
      Every purchase supports sustainable practices and reduces your carbon footprint.
    </p>
    <div className="flex flex-col sm:flex-row gap-6 justify-center mt-8">
      <Link
        href="/products"
        className="px-10 py-4 text-lg rounded-full bg-eco-600 shadow-md hover:bg-eco-700 transition-colors font-bold focus:outline-none focus:ring-2 focus:ring-eco-300"
      >
        Shop Now
      </Link>
      <Link
        href="/about"
        className="px-10 py-4 text-lg rounded-full border-2 border-eco-600 text-eco-600 bg-white hover:bg-eco-100 transition-colors font-bold focus:outline-none focus:ring-2 focus:ring-eco-300"
      >
        Learn More
      </Link>
    </div>
  </div>
</section>

      {/* Features Section */}
      <section className="py-20 w-full bg-white border-b border-eco-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-eco-700 mb-4 tracking-tight">Why Choose EcoMarket?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We&apos;re committed to making sustainable shopping easy, affordable, and impactful.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
  <div className="flex flex-col items-center">
    <div className="border border-eco-200 rounded-full w-14 h-14 flex items-center justify-center mb-3">
      <Leaf className="h-7 w-7 text-eco-600" />
    </div>
    <h3 className="text-lg font-medium text-eco-700 mb-2 text-lg font-semibold tracking-tight">100% Sustainable</h3>
    <p className="text-eco-600 text-sm text-center">Every product is carefully vetted for environmental impact and sustainability standards.</p>
  </div>
  <div className="flex flex-col items-center">
    <div className="border border-ocean-200 rounded-full w-14 h-14 flex items-center justify-center mb-3">
      <Truck className="h-7 w-7 text-ocean-600" />
    </div>
    <h3 className="text-lg font-medium text-ocean-700 mb-2 text-lg font-semibold tracking-tight">Carbon-Neutral Shipping</h3>
    <p className="text-ocean-600 text-sm text-center">All deliveries are carbon-neutral with eco-friendly packaging materials.</p>
  </div>
  <div className="flex flex-col items-center">
    <div className="border border-earth-200 rounded-full w-14 h-14 flex items-center justify-center mb-3">
      <Shield className="h-7 w-7 text-earth-600" />
    </div>
    <h3 className="text-lg font-medium text-earth-700 mb-2 text-lg font-semibold tracking-tight">Quality Guaranteed</h3>
    <p className="text-earth-600 text-sm text-center">Premium quality products that last longer and perform better than conventional alternatives.</p>
  </div>
</div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 w-full bg-gradient-to-b from-eco-50 to-ocean-50 border-b border-eco-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-lg text-gray-600">
              Discover our most popular sustainable products
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
  {/* Product Card 1 */}
  <div className="flex flex-col border border-eco-100 rounded-2xl p-8 bg-white items-center shadow-sm hover:shadow-lg transition-all duration-200">
    <ShoppingBag className="h-10 w-10 text-eco-600 mb-4" />
    <span className="text-xs text-eco-600 mb-2">Organic</span>
    <h3 className="text-lg font-medium text-eco-700 mb-2 text-lg font-semibold tracking-tight">Organic Cotton T-Shirt</h3>
    <p className="text-eco-600 text-sm text-center mb-4">Soft, breathable, and ethically made from 100% organic cotton.</p>
    <div className="flex items-center gap-2 mb-2">
      <Star className="h-4 w-4 text-yellow-400 fill-current" />
      <span className="text-sm text-eco-700">4.9</span>
    </div>
    <span className="text-xl font-bold text-eco-600 mb-3">$29.99</span>
    <button className="px-5 py-2 rounded-full bg-eco-600 text-white hover:bg-eco-700 transition-colors text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-eco-300">Add to Cart</button>
  </div>
  {/* Product Card 2 */}
  <div className="flex flex-col border border-ocean-100 rounded-2xl p-8 bg-white items-center shadow-sm hover:shadow-lg transition-all duration-200">
    <Heart className="h-10 w-10 text-ocean-600 mb-4" />
    <span className="text-xs text-ocean-600 mb-2">Eco-Friendly</span>
    <h3 className="text-lg font-medium text-ocean-700 mb-2 text-lg font-semibold tracking-tight">Bamboo Water Bottle</h3>
    <p className="text-ocean-600 text-sm text-center mb-4">Sustainable bamboo construction with leak-proof design.</p>
    <div className="flex items-center gap-2 mb-2">
      <Star className="h-4 w-4 text-yellow-400 fill-current" />
      <span className="text-sm text-ocean-700">4.8</span>
    </div>
    <span className="text-xl font-bold text-ocean-600 mb-3">$24.99</span>
    <button className="px-5 py-2 rounded-full bg-ocean-600 text-white hover:bg-ocean-700 transition-colors text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ocean-300">Add to Cart</button>
  </div>
  {/* Product Card 3 */}
  <div className="flex flex-col border border-earth-100 rounded-2xl p-8 bg-white items-center shadow-sm hover:shadow-lg transition-all duration-200">
    <Leaf className="h-10 w-10 text-earth-600 mb-4" />
    <span className="text-xs text-earth-600 mb-2">Recyclable</span>
    <h3 className="text-lg font-medium text-earth-700 mb-2 text-lg font-semibold tracking-tight">Solar Power Bank</h3>
    <p className="text-earth-600 text-sm text-center mb-4">Charge your devices with clean solar energy on the go.</p>
    <div className="flex items-center gap-2 mb-2">
      <Star className="h-4 w-4 text-yellow-400 fill-current" />
      <span className="text-sm text-earth-700">4.7</span>
    </div>
    <span className="text-xl font-bold text-earth-600 mb-3">$49.99</span>
    <button className="px-5 py-2 rounded-full bg-earth-600 text-white hover:bg-earth-700 transition-colors text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-earth-300">Add to Cart</button>
  </div>
</div>
          
          <div className="text-center mt-12">
            <Link
              href="/products"
              className="btn-primary px-8 py-3 text-lg"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 w-full bg-eco-50">
  <div className="max-w-xl mx-auto text-center px-4">
  <span className="inline-block h-1 w-16 rounded bg-eco-300 mb-6" />
    <h2 className="text-2xl md:text-3xl font-bold text-eco-700 mb-2">Join the Sustainable Revolution</h2>
    <p className="text-md md:text-lg text-eco-600 mb-6">Get exclusive access to new eco-friendly products and sustainability tips.</p>
    <form className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
      <input
        type="email"
        placeholder="Enter your email"
        className="flex-1 px-5 py-3 rounded-full border border-eco-200 text-eco-700 bg-white focus:outline-none focus:ring-2 focus:ring-eco-300 shadow-sm"
      />
      <button type="submit" className="px-8 py-3 rounded-full bg-eco-600 text-white hover:bg-eco-700 transition-colors font-bold focus:outline-none focus:ring-2 focus:ring-eco-300 shadow-md">
        Subscribe
      </button>
    </form>
  </div>
</section>
    </div>
  );
}
