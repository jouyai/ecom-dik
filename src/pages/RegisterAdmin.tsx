import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from "react-router-dom"
import { auth, db } from "@/lib/firebase"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { toast } from "sonner"
import { FirebaseError } from "firebase/app"

export default function RegisterAdmin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid

      await updateProfile(userCredential.user, { displayName: name })

      const adminData = {
        email,
        name,
        role: "admin",
      }

      await setDoc(doc(db, "admins", uid), adminData)

      toast.success("Registrasi admin berhasil!")
      navigate("/login")
    } catch (err) {
      let errorMessage = "Terjadi kesalahan saat registrasi."

      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/email-already-in-use":
            errorMessage = "Email sudah digunakan."
            break
          case "auth/invalid-email":
            errorMessage = "Format email tidak valid."
            break
          case "auth/weak-password":
            errorMessage = "Password terlalu lemah (min 6 karakter)."
            break
          default:
            errorMessage = "Registrasi gagal: " + err.message
        }
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-xl shadow space-y-4">
      <h1 className="text-2xl font-bold text-center">Daftar Admin</h1>
      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          placeholder="Nama Lengkap"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
          {loading ? "Mendaftarkan..." : "Register Admin"}
        </Button>
        <p className="text-sm text-center text-gray-600">
          Ingin daftar sebagai user biasa?{" "}
          <Link to="/register" className="text-green-600 hover:underline">
            Klik di sini
          </Link>
        </p>
      </form>
    </div>
  )
}
