import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-stone-100 border-t border-stone-200 mt-auto">
      <div className="container mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10 text-stone-700">
        {/* Brand & Tagline */}
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-2xl font-bold text-stone-800 tracking-wide mb-3">
            Furniture.go
          </h3>
          <p className="leading-relaxed max-w-sm">
            Menciptakan ruang yang nyaman dan bergaya, satu per satu. Temukan
            koleksi furnitur berkualitas kami yang dirancang untuk kehidupan
            Anda.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="text-lg font-semibold text-stone-800 mb-4">
            Navigasi
          </h4>
          <ul className="space-y-2">
            <li>
              <Link to="/" className="hover:text-amber-700 transition-colors">
                Beranda
              </Link>
            </li>
            <li>
              <Link
                to="/checkout"
                className="hover:text-amber-700 transition-colors"
              >
                Keranjang
              </Link>
            </li>
            <li>
              <Link
                to="/orders"
                className="hover:text-amber-700 transition-colors"
              >
                Pesanan Saya
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact & Social */}
        <div>
          <h4 className="text-lg font-semibold text-stone-800 mb-4">
            Hubungi Kami
          </h4>
          <ul className="space-y-2 mb-4">
            <li>Email: support@furniture.go</li>
            <li>Telepon: +62 812-3456-7890</li>
          </ul>
          <div className="flex space-x-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-stone-500 hover:text-amber-700 transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="text-stone-500 hover:text-amber-700 transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-stone-500 hover:text-amber-700 transition-colors"
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-200">
        <div className="container mx-auto px-6 py-4 text-center text-sm text-stone-500">
          &copy; {new Date().getFullYear()} Furniture.go. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
