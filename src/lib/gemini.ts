import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

let cachedProductContext: string | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

async function getProductContext() {
  const now = Date.now();
  if (cachedProductContext && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedProductContext;
  }

  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    if (querySnapshot.empty) return "Belum ada produk.";

    const productList = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const price = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
      }).format(data.price || 0);
      
      return `- ${data.name} (${data.category || 'Umum'}): ${price}. \n  Desc: ${data.description || '-'}`;
    }).join("\n\n");

    cachedProductContext = productList;
    lastFetchTime = now;
    return productList;
  } catch (error) {
    console.error("Error fetching products:", error);
    return "Gagal memuat data produk.";
  }
}

export const sendMessageToAI = async (message: string, history: any[]) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    
    const productData = await getProductContext();

    const promptWithContext = `
Peran: Kamu adalah asisten toko "Furniture.go".
Tugas: Jawab pertanyaan user berdasarkan DATA PRODUK dan INFO OPERASIONAL berikut.

DATA PRODUK:
---
${productData}
---

INFO OPERASIONAL:
1. PEMBAYARAN: Kami mendukung berbagai metode pembayaran seperti BCA, BRI, MANDIRI, QRIS, dan PAYLATTER.
2. PENGIRIMAN: Kami hanya melayani pengiriman untuk wilayah JABODETABEK. Semua pesanan akan dikirimkan secara aman menggunakan kurir internal dari toko Furniture.go sendiri.

ATURAN:
1. Jawablah pertanyaan user hanya berdasarkan data produk dan info operasional di atas.
2. Gunakan Bahasa Indonesia yang sopan, ramah, dan membantu.
3. Jika produk yang ditanyakan tidak ada dalam daftar data produk, katakan bahwa stok sedang habis atau tidak tersedia.
4. Jangan menyebutkan kata "Midtrans" dalam penjelasan pembayaran kepada user.

Pertanyaan User: "${message}"
    `;

    const firstUserIndex = history.findIndex(msg => msg.sender === "user");
    const cleanHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : [];

    const formattedHistory = cleanHistory.map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(promptWithContext);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error sending message to AI:", error);
    return "Maaf, ada gangguan sistem (Model Error). Coba lagi nanti.";
  }
};