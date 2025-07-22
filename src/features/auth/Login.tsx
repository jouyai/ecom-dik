import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/auth";
import { toast } from "sonner";
import { FirebaseError } from "firebase/app";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();

  useEffect(() => {
    if (user) {
      logout();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let emailToLogin = "";
      const isEmail = /\S+@\S+\.\S+/.test(identifier);

      if (isEmail) {
        emailToLogin = identifier;
      } else {
        
        const adminQuery = query(collection(db, "admins"), where("username", "==", identifier));
        const userQuery = query(collection(db, "users"), where("username", "==", identifier));

        const [adminSnapshot, userSnapshot] = await Promise.all([
          getDocs(adminQuery),
          getDocs(userQuery)
        ]);

        if (!adminSnapshot.empty) {
          const adminData = adminSnapshot.docs[0].data();
          emailToLogin = adminData.email;
        } else if (!userSnapshot.empty) {
          throw new Error("Pembeli harus login menggunakan email, bukan username.");
        } else {
          throw new Error("Username tidak ditemukan.");
        }
      }

      const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, password);
      const loggedInUser = userCredential.user;
      const uid = loggedInUser.uid;

      let userDoc = await getDoc(doc(db, "users", uid));
      let userData;

      if (userDoc.exists()) {
        userData = userDoc.data();
      } else {
        userDoc = await getDoc(doc(db, "admins", uid));
        if (!userDoc.exists()) {
          await logout();
          throw new Error("Data pengguna tidak ditemukan di database.");
        }
        userData = userDoc.data();
      }

      const { role, username } = userData;
      const displayName = loggedInUser.displayName || username || "Guest";

      setUser(emailToLogin, username, role, displayName);

      toast.success("Login berhasil!");
      navigate("/");
    } catch (err) {
      let errorMessage = "Terjadi kesalahan saat login.";

      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/invalid-credential":
          case "auth/user-not-found":
          case "auth/wrong-password":
            errorMessage = "Kombinasi kredensial dan password salah.";
            break;
          case "auth/invalid-email":
            errorMessage = "Format email tidak valid.";
            break;
          case "auth/too-many-requests":
            errorMessage = "Terlalu banyak percobaan. Coba lagi nanti.";
            break;
          default:
            errorMessage = "Login gagal: " + err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
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
              Selamat Datang Kembali
            </h1>
            <p className="mt-2 text-stone-600">
              Masuk untuk melanjutkan belanja dan melihat pesanan Anda.
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Input
                id="identifier"
                placeholder="Email atau Username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <Button type="submit" className="w-full h-12 bg-stone-800 hover:bg-stone-700 text-base" disabled={loading}>
              {loading ? "Memproses..." : "Login"}
            </Button>
            <p className="text-center text-sm text-stone-600">
              Belum punya akun?{" "}
              <Link to="/register" className="font-medium text-amber-700 hover:underline">
                Daftar di sini
              </Link>
            </p>
          </form>
        </div>
      </div>
      <div className="hidden bg-stone-100 lg:block">
        <img
          src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2070&auto=format&fit=crop"
          alt="Modern furniture"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
