
# 🪑 Furniture.go - Platform E-Commerce Furnitur

Selamat datang di **Furniture.go**, sebuah platform e-commerce modern yang dirancang untuk menjual produk furnitur. Proyek ini dibangun dengan tumpukan teknologi modern, mencakup otentikasi pengguna, manajemen produk, alur checkout yang lengkap dengan integrasi payment gateway, serta dasbor admin.

## ✨ Fitur Utama

* **Otentikasi Pengguna & Admin**: Sistem registrasi dan login yang aman untuk pembeli dan admin, dengan peran yang terpisah.
* **Login Fleksibel**: Admin dapat login menggunakan email atau username, sementara pembeli menggunakan email.
* **Pengecekan Real-time**: Pengecekan ketersediaan username dan email secara otomatis saat pendaftaran untuk mencegah duplikasi.
* **Halaman Beranda Dinamis**:
    * Menampilkan produk terbaru secara otomatis.
    * Katalog semua produk dengan filter berdasarkan kategori.
    * Carousel testimoni pelanggan yang bergerak otomatis untuk membangun kepercayaan.
* **Manajemen Keranjang**: Fungsionalitas tambah, hapus, dan ubah jumlah produk di keranjang.
* **Alur Checkout Lengkap**:
    * Pengisian alamat pengiriman.
    * Konfirmasi pesanan.
    * Integrasi pembayaran dengan **Midtrans Snap**.
* **Riwayat Pesanan**: Pengguna dapat melihat riwayat pesanan mereka, memeriksa status pembayaran secara real-time, dan mencoba membayar ulang pesanan yang gagal atau kedaluwarsa.
* **Menu & Pengaturan Profil**:
    * Dropdown menu profil yang intuitif.
    * Halaman di mana pengguna dapat memperbarui informasi profil mereka seperti username.
* **Desain Responsif**: Tampilan yang dioptimalkan untuk perangkat desktop maupun mobile.

## 🛠️ Tumpukan Teknologi

### Frontend (Klien)
* **Framework**: React (dengan Vite)
* **Bahasa**: TypeScript
* **Styling**: Tailwind CSS
* **Komponen UI**: shadcn/ui & sonner (untuk notifikasi)
* **Manajemen State**: Zustand
* **Navigasi**: React Router DOM
* **Animasi Scroll**: React Scroll
* **Carousel**: Embla Carousel

### Backend (Server)
* **Framework**: Node.js & Express.js
* **Payment Gateway**: Midtrans (Snap & Core API)
* **Otentikasi & Database**: Firebase (Authentication & Firestore)

### Platform Deploy
* **Frontend**: Vercel
* **Backend**: Railway

## 🚀 Instalasi & Konfigurasi

Untuk menjalankan proyek ini di lingkungan lokal, ikuti langkah-langkah berikut untuk frontend dan backend.

### 1. Frontend (React)
**Prasyarat**: Node.js versi 18 atau lebih tinggi.

a. **Clone Repositori**
```bash
git clone https://github.com/jouyai/ecom-dik.git
cd ecom-dik
```

b. **Instal Dependensi**
```bash
npm install
```

c. **Konfigurasi Environment Variables**
Buat file `.env` di root direktori frontend dan isi dengan variabel berikut:
```env
# Kunci dari proyek Firebase Anda
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Kunci dari Dashboard Midtrans (Sandbox)
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-...
```

d. **Jalankan Proyek**
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:5173`.

### 2. Backend (Node.js)
**Prasyarat**: Node.js versi 18 atau lebih tinggi.

a. **Pindah ke Direktori Backend**
```bash
cd be-ecomdik
```

b. **Instal Dependensi**
```bash
npm install
```

c. **Konfigurasi Environment Variables**
Buat file `.env` di root direktori backend dan isi dengan variabel berikut:
```env
# Kunci dari Dashboard Midtrans (Sandbox)
MIDTRANS_SERVER_KEY=SB-Mid-server-...
MIDTRANS_CLIENT_KEY=SB-Mid-client-...

# Kredensial Firebase Admin SDK
GOOGLE_CREDENTIALS_JSON={"type": "service_account", ...}

PORT=5000
```

d. **Tambahkan `serviceAccountKey.json`**
Unduh file kunci service account dari **Firebase Console > Project Settings > Service accounts**, ganti namanya menjadi `serviceAccountKey.json`, dan letakkan di root direktori backend.

e. **Jalankan Server**
```bash
npm start
```
Server akan berjalan di `http://localhost:5000`.

## 📁 Struktur Proyek

Proyek ini menggunakan struktur folder berbasis fitur (*feature-based*) yang terorganisir untuk memudahkan pengelolaan dan pengembangan.

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
