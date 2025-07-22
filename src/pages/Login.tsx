import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useNavigate, Link } from "react-router-dom"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useAuth } from "@/context/auth"
import { toast } from "sonner"
import { FirebaseError } from "firebase/app"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser, logout } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      const uid = user.uid

      // Cari user di users, jika tidak ada cek di admins
      let userDoc = await getDoc(doc(db, "users", uid));
      let userData;
      if (userDoc.exists()) {
        userData = userDoc.data();
      } else {
        userDoc = await getDoc(doc(db, "admins", uid));
        if (!userDoc.exists()) {
          logout(); // Paksa logout jika tidak ditemukan di Firestore
          throw new Error("User tidak ditemukan di database.");
        }
        userData = userDoc.data();
      }

      const { role, username } = userData;
      const displayName = user.displayName || "Guest";

      setUser(email, username, role, displayName);

      toast.success("Login berhasil!")
      navigate("/")
    } catch (err) {
      let errorMessage = "Terjadi kesalahan saat login."

      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/invalid-credential":
          case "auth/user-not-found":
            errorMessage = "Akun tidak ditemukan."
            break
          case "auth/wrong-password":
            errorMessage = "Password salah."
            break
          case "auth/invalid-email":
            errorMessage = "Format email tidak valid."
            break
          case "auth/too-many-requests":
            errorMessage = "Terlalu banyak percobaan. Coba lagi nanti."
            break
          default:
            errorMessage = "Login gagal: " + err.message
        }
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-xl shadow space-y-4">
      <h1 className="text-2xl font-bold text-center">Masuk Akun</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Memproses..." : "Login"}
        </Button>
        <p className="text-sm text-center text-gray-600">
          Belum punya akun?{" "}
          <Link to="/register" className="text-green-600 hover:underline">
            Daftar di sini
          </Link>
        </p>
      </form>
    </div>
  )
}
