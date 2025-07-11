import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { auth, db } from "@/lib/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { toast } from "sonner"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [role, setRole] = useState<"admin" | "buyer">("buyer")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid

      await setDoc(doc(db, "users", uid), {
        email,
        username,
        role,
      })

      toast.success("Registrasi berhasil!")
      navigate("/")
    } catch (err: any) {
      toast.error("Registrasi gagal: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-xl shadow space-y-4">
      <h1 className="text-2xl font-bold text-center">Register Akun</h1>
      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
        <select
          className="w-full border rounded p-2"
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "buyer")}
        >
          <option value="buyer">Pembeli</option>
          <option value="admin">Admin</option>
        </select>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Mendaftarkan..." : "Register"}
        </Button>
      </form>
    </div>
  )
}
