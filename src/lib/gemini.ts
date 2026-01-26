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
    if (querySnapshot.empty) return "TIDAK ADA PRODUK TERSEDIA.";

    const productList = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const price = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
      }).format(data.price || 0);
      const stock = data.stock ?? 0;

      return `[${data.name}] ID:${doc.id} | ${data.category || 'Furnitur'} | ${price} | Stok: ${stock > 0 ? stock + ' unit' : 'Habis'}`;
    }).join("\n");

    cachedProductContext = productList;
    lastFetchTime = now;
    return productList;
  } catch (error) {
    console.error("Error fetching products:", error);
    return "GAGAL MEMUAT DATA PRODUK.";
  }
}

export const sendMessageToAI = async (message: string, _history: any[]) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 512,
      }
    });

    const productData = await getProductContext();

    // Dapatkan waktu saat ini untuk sapaan yang tepat
    const now = new Date();
    const hours = now.getHours();
    let greeting = "Selamat malam";
    if (hours >= 5 && hours < 11) greeting = "Selamat pagi";
    else if (hours >= 11 && hours < 15) greeting = "Selamat siang";
    else if (hours >= 15 && hours < 18) greeting = "Selamat sore";

    const systemPrompt = `Kamu asisten toko furnitur "Furniture.go". Jam sekarang menunjukkan waktu ${greeting.toLowerCase().replace('selamat ', '')}.

PRODUK TERSEDIA:
${productData}

INFO TOKO:
- Pembayaran: BCA, BRI, Mandiri, QRIS, PayLater
- Pengiriman: JABODETABEK saja, gratis ongkir, 2-5 hari kerja

ATURAN KETAT:
1. HANYA sebutkan produk dari daftar di atas. JANGAN mengarang produk baru.
2. Sapaan: gunakan "${greeting}" di awal jika pelanggan menyapa.
3. Jawab singkat, maksimal 2-3 kalimat.
4. Saat sebut produk, tulis: [Nama Produk](/product/ID) - Harga
5. Jika ditanya produk yang tidak ada, bilang "belum tersedia" dan tawarkan yang ada.`;

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: `${greeting}! Saya siap membantu. Ada yang bisa saya bantu?` }] },
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error sending message to AI:", error);
    return "Maaf, ada gangguan. Silakan coba lagi.";
  }
};
