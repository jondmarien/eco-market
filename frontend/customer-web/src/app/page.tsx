import Image from "next/image";
import Link from "next/link";
import { Leaf, ShoppingBag, Star, Truck, Shield, Heart } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-eco-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-eco-600 to-eco-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Shop Sustainably,
              <br />
              <span className="text-eco-200">Live Responsibly</span>
            </h1>
            <p className="text-xl md:text-2xl text-eco-100 mb-8 max-w-3xl mx-auto">
              Discover eco-friendly products that make a difference for you and the planet.
              Every purchase supports sustainable practices and reduces your carbon footprint.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="btn-primary bg-white text-eco-600 hover:bg-eco-50 px-8 py-3 text-lg font-semibold rounded-lg transition-colors"
              >
                Shop Now
              </Link>
              <Link
                href="/about"
                className="border-2 border-white text-white hover:bg-white hover:text-eco-600 px-8 py-3 text-lg font-semibold rounded-lg transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose EcoMarket?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're committed to making sustainable shopping easy, affordable, and impactful.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-eco-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Leaf className="h-8 w-8 text-eco-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">100% Sustainable</h3>
              <p className="text-gray-600">
                Every product is carefully vetted for environmental impact and sustainability standards.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-ocean-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-ocean-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Carbon-Neutral Shipping</h3>
              <p className="text-gray-600">
                All deliveries are carbon-neutral with eco-friendly packaging materials.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-earth-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-earth-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Guaranteed</h3>
              <p className="text-gray-600">
                Premium quality products that last longer and perform better than conventional alternatives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-lg text-gray-600">
              Discover our most popular sustainable products
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Product Card 1 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-eco-100 h-48 flex items-center justify-center">
                <ShoppingBag className="h-16 w-16 text-eco-600" />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-eco-100 text-eco-800 text-xs px-2 py-1 rounded-full">Organic</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">4.9</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Organic Cotton T-Shirt</h3>
                <p className="text-gray-600 text-sm mb-4">Soft, breathable, and ethically made from 100% organic cotton.</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-eco-600">$29.99</span>
                  <button className="btn-primary text-sm px-4 py-2">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>

            {/* Product Card 2 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-ocean-100 h-48 flex items-center justify-center">
                <Heart className="h-16 w-16 text-ocean-600" />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-ocean-100 text-ocean-800 text-xs px-2 py-1 rounded-full">Eco-Friendly</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">4.8</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bamboo Water Bottle</h3>
                <p className="text-gray-600 text-sm mb-4">Sustainable bamboo construction with leak-proof design.</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-eco-600">$24.99</span>
                  <button className="btn-primary text-sm px-4 py-2">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>

            {/* Product Card 3 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-earth-100 h-48 flex items-center justify-center">
                <Leaf className="h-16 w-16 text-earth-600" />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-earth-100 text-earth-800 text-xs px-2 py-1 rounded-full">Recyclable</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">4.7</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Solar Power Bank</h3>
                <p className="text-gray-600 text-sm mb-4">Charge your devices with clean solar energy on the go.</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-eco-600">$49.99</span>
                  <button className="btn-primary text-sm px-4 py-2">
                    Add to Cart
                  </button>
                </div>
              </div>
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
      <section className="py-16 bg-eco-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">
            Join the Sustainable Revolution
          </h2>
          <p className="text-xl text-eco-100 mb-8">
            Get exclusive access to new eco-friendly products and sustainability tips.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-eco-300"
            />
            <button className="bg-white text-eco-600 hover:bg-eco-50 px-6 py-3 rounded-lg font-semibold transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
