import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { toast } from "sonner";
import { FirebaseError } from "firebase/app";
import { fetchSignInMethodsForEmail } from "firebase/auth";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type Status = "idle" | "checking" | "available" | "taken";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [usernameStatus, setUsernameStatus] = useState<Status>("idle");
  const [emailStatus, setEmailStatus] = useState<Status>("idle");

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Furniture | Register";
  }, []);

  const checkUsernameAvailability = useCallback(async (uname: string) => {
    if (uname.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const userQuery = query(collection(db, "users"), where("username", "==", uname));
    const adminQuery = query(collection(db, "admins"), where("username", "==", uname));
    
    const [userSnapshot, adminSnapshot] = await Promise.all([
        getDocs(userQuery),
        getDocs(adminQuery)
    ]);

    if (!userSnapshot.empty || !adminSnapshot.empty) {
      setUsernameStatus("taken");
    } else {
      setUsernameStatus("available");
    }
  }, []);

  const checkEmailAvailability = useCallback(async (email: string) => {
    const isEmailValid = /\S+@\S+\.\S+/.test(email);
    if (!isEmailValid) {
        setEmailStatus("idle");
        return;
    }
    setEmailStatus("checking");
    try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
            setEmailStatus("taken");
            return;
        }

        const userQuery = query(collection(db, "users"), where("email", "==", email));
        const adminQuery = query(collection(db, "admins"), where("email", "==", email));
        
        const [userSnapshot, adminSnapshot] = await Promise.all([
            getDocs(userQuery),
            getDocs(adminQuery)
        ]);

        if (!userSnapshot.empty || !adminSnapshot.empty) {
            setEmailStatus("taken");
        } else {
            setEmailStatus("available");
        }
    } catch (error) {
        console.error("Gagal memeriksa ketersediaan email:", error);
        setEmailStatus("idle");
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (username) {
        checkUsernameAvailability(username);
      } else {
        setUsernameStatus("idle");
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [username, checkUsernameAvailability]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (email) {
        checkEmailAvailability(email);
      } else {
        setEmailStatus("idle");
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [email, checkEmailAvailability]);


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus !== 'available' || emailStatus !== 'available') {
        toast.error("Pastikan username dan email tersedia.");
        return;
    }
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
        role: "buyer",
      };

      await setDoc(doc(db, "users", uid), userData);

      toast.success("Registrasi berhasil! Selamat datang.");
      navigate("/");
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

  const isSubmitDisabled = loading || usernameStatus !== 'available' || emailStatus !== 'available';

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
              {usernameStatus === 'checking' && <p className="text-sm text-stone-500 flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memeriksa...</p>}
              {usernameStatus === 'taken' && <p className="text-sm text-red-600 flex items-center"><XCircle className="mr-2 h-4 w-4" /> Username sudah digunakan.</p>}
              {usernameStatus === 'available' && <p className="text-sm text-green-600 flex items-center"><CheckCircle2 className="mr-2 h-4 w-4" /> Username tersedia!</p>}
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
              {emailStatus === 'checking' && <p className="text-sm text-stone-500 flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memeriksa...</p>}
              {emailStatus === 'taken' && <p className="text-sm text-red-600 flex items-center"><XCircle className="mr-2 h-4 w-4" /> Email sudah terdaftar.</p>}
              {emailStatus === 'available' && <p className="text-sm text-green-600 flex items-center"><CheckCircle2 className="mr-2 h-4 w-4" /> Email tersedia!</p>}
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
              disabled={isSubmitDisabled}
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
