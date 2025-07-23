
# 🪑 Furniture.go - Platform E-Commerce Furnitur

Selamat datang di **Furniture.go**, sebuah platform e-commerce modern yang dirancang untuk menjual produk furnitur. Proyek ini dibangun dengan tumpukan teknologi kekinian, mencakup otentikasi pengguna, manajemen produk, alur checkout yang lengkap, serta integrasi payment gateway dan dasbor admin.

---

## ✨ Fitur Utama

- **🔐 Otentikasi Pengguna & Admin:** Sistem registrasi dan login yang aman, dengan peran terpisah antara pembeli dan admin.
- **🔍 Pengecekan Real-time:** Cek ketersediaan username dan email secara otomatis saat pendaftaran.
- **🛒 Katalog Produk:** Tampilan produk yang bisa difilter berdasarkan kategori.
- **📦 Detail Produk:** Halaman produk lengkap dengan rekomendasi produk terkait.
- **🧺 Manajemen Keranjang:** Tambah, hapus, dan ubah jumlah produk dalam keranjang.
- **🧾 Alur Checkout Lengkap:**
  - Pengisian alamat pengiriman
  - Konfirmasi pesanan
  - Integrasi pembayaran dengan Midtrans Snap
- **📜 Riwayat Pesanan:** Lihat status, histori pembelian, dan bayar ulang jika gagal.
- **👤 Pengaturan Profil:** Update informasi pengguna dengan mudah.
- **📱 Desain Responsif:** Optimal untuk desktop & mobile.

---

## 🛠️ Tumpukan Teknologi

### Frontend (Client)
- **Framework:** React + Vite
- **Bahasa:** TypeScript
- **Styling:** Tailwind CSS
- **Komponen UI:** [`shadcn/ui`](https://ui.shadcn.com/) & `sonner`
- **State Management:** Zustand
- **Routing:** React Router DOM
- **Animasi Scroll:** React Scroll

### Backend (Server)
- **Framework:** Node.js + Express.js
- **Database & Auth:** Firebase (Authentication & Firestore)
- **Payment Gateway:** Midtrans Snap & Core API

### Platform Deploy
- **Frontend:** Vercel
- **Backend:** Railway

---

## 🚀 Instalasi & Konfigurasi

### 1. Frontend (React)
**Prasyarat:** Node.js v18+

#### a. Clone Repositori
```bash
git clone [URL_REPOSITORI_ANDA]
cd [NAMA_FOLDER_FRONTEND]
```

#### b. Instal Dependensi
```bash
npm install
```

#### c. Konfigurasi `.env`
Buat file `.env` di root proyek dan isi:
```env
# Firebase
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Midtrans Sandbox
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-...
```

#### d. Jalankan Proyek
```bash
npm run dev
```
Akses di: [http://localhost:5173](http://localhost:5173)

---

### 2. Backend (Node.js)
**Prasyarat:** Node.js v18+

#### a. Pindah Direktori
```bash
cd [NAMA_FOLDER_BACKEND]
```

#### b. Instal Dependensi
```bash
npm install
```

#### c. Konfigurasi `.env`
```env
# Midtrans Sandbox
MIDTRANS_SERVER_KEY=SB-Mid-server-...
MIDTRANS_CLIENT_KEY=SB-Mid-client-...

# Firebase Admin SDK
GOOGLE_CREDENTIALS_JSON={"type": "service_account", ...}

PORT=5000
```

#### d. Tambah `serviceAccountKey.json`
Unduh dari Firebase Console → Project Settings → Service accounts  
Rename jadi `serviceAccountKey.json` dan letakkan di root backend.

#### e. Jalankan Server
```bash
npm start
```
Akses di: [http://localhost:5000](http://localhost:5000)

---

## ⚙️ Pengembangan Lanjutan (Vite + ESLint)

Template ini menggunakan Vite + ESLint dengan Hot Module Replacement (HMR).

### Konfigurasi `eslint.config.js` (Type-Aware Linting)

```ts
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      // atau lebih ketat:
      // ...tseslint.configs.strictTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
```

---

## 🙌 Kontribusi
Pull request, bug report, atau ide pengembangan sangat diterima!

---

## 🧾 Lisensi
Proyek ini dilisensikan di bawah [MIT License](LICENSE).