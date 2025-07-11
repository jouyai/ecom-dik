import { Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t mt-10">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-6 text-sm text-gray-700">
        <div>
          <h3 className="text-lg font-semibold mb-2">DikaCommerce</h3>
          <p>
            Platform belanja online terpercaya. Temukan produk terbaik hanya di
            sini.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Navigasi</h3>
          <ul className="space-y-1">
            <li>
              <a href="/" className="hover:underline">
                Beranda
              </a>
            </li>
            <li>
              <a href="/checkout" className="hover:underline">
                Keranjang
              </a>
            </li>
            <li>
              <a href="/my-orders" className="hover:underline">
                Pesanan Saya
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Hubungi Kami</h3>
          <ul className="space-y-1">
            <li>Email: support@dikacommerce.com</li>
            <li>Telepon: +62 812-3456-7890</li>
            <li>Alamat: Jakarta, Indonesia</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Ikuti Kami</h3>
          <ul className="flex space-x-4">
            <li>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-pink-600"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </li>
            <li>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="hover:text-blue-500"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </li>
            <li>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-blue-700"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 py-4 border-t">
        &copy; {new Date().getFullYear()} DikaCommerce. All rights reserved.
      </div>
    </footer>
  );
}
