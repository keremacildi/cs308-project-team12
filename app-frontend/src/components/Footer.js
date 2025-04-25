'use client';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">CS308 Store</h3>
            <p className="text-gray-300 mb-4">Your one-stop shop for all your tech and lifestyle needs.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-300 hover:text-white transition">Home</Link></li>
              <li><Link href="/products" className="text-gray-300 hover:text-white transition">Products</Link></li>
              <li><Link href="/cart" className="text-gray-300 hover:text-white transition">Cart</Link></li>
              <li><Link href="/wishlist" className="text-gray-300 hover:text-white transition">Wishlist</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-300 hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white transition">Terms of Service</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white transition">FAQ</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white transition">Contact Us</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Contact Info</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-300">
                <MapPin className="w-5 h-5 mr-2" />
                <span>123 Tech Street, Istanbul, Turkey</span>
              </li>
              <li className="flex items-center text-gray-300">
                <Phone className="w-5 h-5 mr-2" />
                <span>+90 555 123 45 67</span>
              </li>
              <li className="flex items-center text-gray-300">
                <Mail className="w-5 h-5 mr-2" />
                <span>info@cs308store.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 mb-4 md:mb-0">© 2025 CS308 Online Store - All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white transition">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
  