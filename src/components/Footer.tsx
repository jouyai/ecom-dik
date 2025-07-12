import { Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm text-gray-700">
        {/* Brand */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Furniture.go</h3>
          <p className="leading-relaxed">
            Platform belanja online terpercaya. Temukan produk terbaik hanya di sini.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Navigasi</h3>
          <ul className="space-y-1">
            <li><a href="/" className="hover:underline">Beranda</a></li>
            <li><a href="/checkout" className="hover:underline">Keranjang</a></li>
            <li><a href="/orders" className="hover:underline">Pesanan Saya</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Hubungi Kami</h3>
          <ul className="space-y-1">
            <li>Email: support@furniture.go</li>
            <li>Telepon: +62 812-3456-7890</li>
            <li>Alamat: Jakarta, Indonesia</li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Ikuti Kami</h3>
          <div className="flex space-x-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:text-pink-600 transition"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="hover:text-blue-500 transition"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:text-blue-700 transition"
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 py-4 border-t">
        &copy; {new Date().getFullYear()} Furniture.go. All rights reserved.
      </div>
    </footer>
  );
}
