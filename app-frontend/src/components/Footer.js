'use client';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-200 pt-14 pb-6 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 border-b border-gray-700 pb-10">
        {/* Brand & Social */}
        <div>
          <h3 className="text-2xl font-extrabold mb-4 text-blue-400 tracking-tight drop-shadow">CS308 Store</h3>
          <p className="text-gray-400 mb-8 leading-relaxed">Your one-stop shop for all your tech and lifestyle needs.</p>
          <div className="flex space-x-3">
            <a href="#" className="bg-blue-600 hover:bg-blue-700 transition-colors rounded-full p-3 shadow-lg flex items-center justify-center">
              <Facebook className="w-5 h-5 text-white" />
            </a>
            <a href="#" className="bg-pink-500 hover:bg-pink-600 transition-colors rounded-full p-3 shadow-lg flex items-center justify-center">
              <Instagram className="w-5 h-5 text-white" />
            </a>
            <a href="#" className="bg-blue-400 hover:bg-blue-500 transition-colors rounded-full p-3 shadow-lg flex items-center justify-center">
              <Twitter className="w-5 h-5 text-white" />
            </a>
          </div>
        </div>
        {/* Quick Links */}
        <div className="md:border-l md:border-gray-700 md:pl-8">
          <h3 className="text-lg font-bold mb-4 text-blue-300 uppercase tracking-wider">Quick Links</h3>
          <ul className="space-y-3">
            <li><Link href="/" className="hover:text-blue-400 transition font-medium">Home</Link></li>
            <li><Link href="/products" className="hover:text-blue-400 transition font-medium">Products</Link></li>
            <li><Link href="/cart" className="hover:text-blue-400 transition font-medium">Cart</Link></li>
            <li><Link href="/wishlist" className="hover:text-blue-400 transition font-medium">Wishlist</Link></li>
          </ul>
        </div>
        {/* Support */}
        <div className="md:border-l md:border-gray-700 md:pl-8">
          <h3 className="text-lg font-bold mb-4 text-blue-300 uppercase tracking-wider">Support</h3>
          <ul className="space-y-3">
            <li><a href="#" className="hover:text-blue-400 transition font-medium">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-blue-400 transition font-medium">Terms of Service</a></li>
            <li><a href="#" className="hover:text-blue-400 transition font-medium">FAQ</a></li>
            <li><a href="#" className="hover:text-blue-400 transition font-medium">Contact Us</a></li>
          </ul>
        </div>
        {/* Contact Info */}
        <div className="md:border-l md:border-gray-700 md:pl-8">
          <h3 className="text-lg font-bold mb-4 text-blue-300 uppercase tracking-wider">Contact Info</h3>
          <ul className="space-y-3 text-gray-400">
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-400" /> 123 Tech Street, Istanbul, Turkey</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-blue-400" /> +90 555 123 45 67</li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-blue-400" /> info@cs308store.com</li>
          </ul>
        </div>
      </div>
      <div className="pt-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} CS308 Online Store &mdash; All rights reserved.
      </div>
    </footer>
  );
}
  