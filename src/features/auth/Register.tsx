import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { FirebaseError } from "firebase/app";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      const userData = {
        email,
        username,
        role: "buyer", // default role
      };

      await setDoc(doc(db, "users", uid), userData);

      toast.success("Registrasi berhasil! Silakan login.");
      navigate("/login");
    } catch (err) {
      let errorMessage = "Terjadi kesalahan saat registrasi.";

      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/email-already-in-use":
            errorMessage = "Email sudah digunakan.";
            break;
          case "auth/invalid-email":
            errorMessage = "Format email tidak valid.";
            break;
          case "auth/weak-password":
            errorMessage = "Password terlalu lemah (min 6 karakter).";
            break;
          default:
            errorMessage = "Registrasi gagal: " + err.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900">
              Buat Akun Baru
            </h1>
            <p className="mt-2 text-stone-600">
              Daftar untuk mulai menemukan furnitur impian Anda.
            </p>
          </div>
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <Input
                id="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                placeholder="Password (min. 6 karakter)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-stone-800 hover:bg-stone-700 text-base"
              disabled={loading}
            >
              {loading ? "Mendaftarkan..." : "Register"}
            </Button>
            <p className="text-center text-sm text-stone-600">
              Sudah punya akun?{" "}
              <Link
                to="/login"
                className="font-medium text-amber-700 hover:underline"
              >
                Login di sini
              </Link>
            </p>
          </form>
        </div>
      </div>
      <div className="hidden bg-stone-100 lg:block">
        <img
          src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2158&auto=format&fit=crop"
          alt="Minimalist interior design"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
