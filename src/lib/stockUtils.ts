// Stock management helper functions
import { db } from "./firebase";
import { doc, getDoc, runTransaction, Timestamp } from "firebase/firestore";

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

// Durasi kadaluarsa order dalam milidetik (24 jam)
export const ORDER_EXPIRY_DURATION = 24 * 60 * 60 * 1000;

/**
 * Cek apakah order sudah expired berdasarkan expiresAt
 */
export const isOrderExpired = (expiresAt: Timestamp | Date | null | undefined): boolean => {
    if (!expiresAt) return false;

    const expiryDate = expiresAt instanceof Timestamp
        ? expiresAt.toDate()
        : expiresAt;

    return new Date() > expiryDate;
};

/**
 * Hitung sisa waktu sampai kadaluarsa dalam detik
 */
export const getTimeRemaining = (expiresAt: Timestamp | Date | null | undefined): number => {
    if (!expiresAt) return 0;

    const expiryDate = expiresAt instanceof Timestamp
        ? expiresAt.toDate()
        : expiresAt;

    const remaining = expiryDate.getTime() - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
};

/**
 * Format sisa waktu ke format HH:MM:SS
 */
export const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return "00:00:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Reservasi stock (kurangi sementara) untuk items di keranjang
 * Menggunakan transaction untuk memastikan konsistensi
 */
export const reserveStock = async (items: CartItem[]): Promise<boolean> => {
    try {
        await runTransaction(db, async (transaction) => {
            // First, read all product stocks
            const productStocks: { [key: string]: number } = {};

            for (const item of items) {
                const productRef = doc(db, "products", item.id);
                const productSnap = await transaction.get(productRef);

                if (!productSnap.exists()) {
                    throw new Error(`Produk ${item.name} tidak ditemukan`);
                }

                const currentStock = productSnap.data().stock ?? 0;

                if (currentStock < item.quantity) {
                    throw new Error(`Stok ${item.name} tidak mencukupi. Tersedia: ${currentStock}`);
                }

                productStocks[item.id] = currentStock;
            }

            // Then, update all stocks
            for (const item of items) {
                const productRef = doc(db, "products", item.id);
                const newStock = productStocks[item.id] - item.quantity;
                transaction.update(productRef, { stock: newStock });
            }
        });

        return true;
    } catch (error) {
        console.error("Error reserving stock:", error);
        throw error;
    }
};

/**
 * Kembalikan stock yang sudah direservasi (untuk kasus gagal/expired)
 */
export const releaseStock = async (items: CartItem[]): Promise<boolean> => {
    try {
        await runTransaction(db, async (transaction) => {
            // First, read all current stocks
            const productStocks: { [key: string]: number } = {};

            for (const item of items) {
                const productRef = doc(db, "products", item.id);
                const productSnap = await transaction.get(productRef);

                if (productSnap.exists()) {
                    productStocks[item.id] = productSnap.data().stock ?? 0;
                }
            }

            // Then, update all stocks (add back)
            for (const item of items) {
                if (productStocks[item.id] !== undefined) {
                    const productRef = doc(db, "products", item.id);
                    const newStock = productStocks[item.id] + item.quantity;
                    transaction.update(productRef, { stock: newStock });
                }
            }
        });

        return true;
    } catch (error) {
        console.error("Error releasing stock:", error);
        return false;
    }
};

/**
 * Validasi apakah stock tersedia untuk semua items
 */
export const validateStock = async (items: CartItem[]): Promise<{ valid: boolean; message?: string }> => {
    try {
        for (const item of items) {
            const productRef = doc(db, "products", item.id);
            const productSnap = await getDoc(productRef);

            if (!productSnap.exists()) {
                return { valid: false, message: `Produk ${item.name} tidak ditemukan` };
            }

            const currentStock = productSnap.data().stock ?? 0;

            if (currentStock < item.quantity) {
                return {
                    valid: false,
                    message: `Stok ${item.name} tidak mencukupi. Tersedia: ${currentStock}, diminta: ${item.quantity}`
                };
            }
        }

        return { valid: true };
    } catch (error) {
        console.error("Error validating stock:", error);
        return { valid: false, message: "Gagal memvalidasi stok" };
    }
};
