# 🪑 Furniture.go - Platform E-Commerce Furnitur

Selamat datang di **Furniture.go**, platform e-commerce modern untuk penjualan produk furnitur. Proyek ini dibangun dengan stack teknologi modern, mendukung otentikasi pengguna, manajemen produk, checkout terintegrasi payment gateway, serta dasbor admin.

## ✨ Fitur Utama

* **Otentikasi Pengguna & Admin**: Registrasi dan login aman untuk pembeli dan admin, dengan peran terpisah.
* **Login Fleksibel**: Admin dapat login via email atau username, pembeli via email.
* **Pengecekan Real-time**: Validasi ketersediaan username/email saat pendaftaran.
* **Halaman Beranda Dinamis**:
    * Produk terbaru otomatis tampil.
    * Katalog produk dengan filter kategori.
    * Carousel testimoni pelanggan otomatis.
* **Manajemen Keranjang**: Tambah, hapus, dan ubah jumlah produk di keranjang.
* **Alur Checkout Lengkap**:
    * Pengisian alamat pengiriman.
    * Konfirmasi pesanan.
    * Integrasi pembayaran dengan **Midtrans Snap**.
* **Riwayat Pesanan**: Pengguna dapat melihat riwayat, status pembayaran real-time, dan membayar ulang pesanan gagal/kedaluwarsa.
* **Menu & Pengaturan Profil**:
    * Dropdown menu profil.
    * Halaman update profil (misal username).
* **Desain Responsif**: Optimal untuk desktop & mobile.

## 🛠️ Tumpukan Teknologi

### Frontend (Klien)
- **Framework**: React (Vite)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS
- **UI**: shadcn/ui, sonner (notifikasi)
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Animasi Scroll**: React Scroll
- **Carousel**: Embla Carousel

### Backend (Server)
- **Framework**: Node.js & Express.js
- **Payment Gateway**: Midtrans (Snap & Core API)
- **Otentikasi & Database**: Firebase (Authentication & Firestore)

### Deploy
- **Frontend**: Vercel
- **Backend**: Railway

## 🚀 Instalasi & Konfigurasi

### 1. Frontend (React)
**Prasyarat**: Node.js v18+

a. **Clone Repositori**
```bash
git clone https://github.com/jouyai/ecom-dik.git
cd ecom-dik
```

b. **Instal Dependensi**
```bash
npm install
```

c. **Konfigurasi Environment**
Buat file `.env` di root frontend:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-...
```

d. **Jalankan Proyek**
```bash
npm run dev
```
Akses di `http://localhost:5173`.

### 2. Backend (Node.js)
**Prasyarat**: Node.js v18+

a. **Pindah ke Direktori Backend**
```bash
cd be-ecomdik
```

b. **Instal Dependensi**
```bash
npm install
```

c. **Konfigurasi Environment**
Buat file `.env` di root backend:
```env
MIDTRANS_SERVER_KEY=SB-Mid-server-...
MIDTRANS_CLIENT_KEY=SB-Mid-client-...
GOOGLE_CREDENTIALS_JSON={"type": "service_account", ...}
PORT=5000
```

d. **Tambahkan `serviceAccountKey.json`**
Unduh dari Firebase Console, rename jadi `serviceAccountKey.json`, letakkan di root backend.

e. **Jalankan Server**
```bash
npm start
```
Server di `http://localhost:5000`.

## 📁 Struktur Proyek

```
src/
├── components/
│   ├── shared/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── ScrollToTop.tsx
│   │   └── AppLoader.tsx
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       └── ... (Komponen shadcn/ui)
├── context/
│   ├── auth.ts
│   └── cartStore.ts
├── data/
│   └── testimonials.ts
├── features/
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── RegisterAdmin.tsx
│   ├── checkout/
│   │   ├── Checkout.tsx
│   │   ├── Shipping.tsx
│   │   ├── Payment.tsx
│   │   └── TransactionResult.tsx
│   ├── products/
│   │   ├── Home.tsx
│   │   └── ProductDetail.tsx
│   ├── orders/
│   │   └── MyOrders.tsx
│   └── user/
│       └── ProfileSettings.tsx
├── hooks/
│   └── useMidtransSnap.ts
├── lib/
│   └── firebase.ts
├── routes/
│   ├── AppRoutes.tsx
│   ├── ProtectedRoute.tsx
│   └── GuestRoute.tsx
├── App.tsx
└── main.tsx
```

---

Terima kasih telah menggunakan dan berkontribusi pada proyek ini!
