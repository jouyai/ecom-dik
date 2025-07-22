import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function ProfileSettings() {
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser) {
      toast.error("Anda harus login untuk mengubah profil.");
      return;
    }

    if (username.length < 3) {
      toast.error("Username harus memiliki minimal 3 karakter.");
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, user.role === 'admin' ? "admins" : "users", auth.currentUser.uid);
      
      // Update Firestore
      await updateDoc(userRef, { username });
      
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, { displayName: username });

      // Update state lokal di Zustand/Context
      setUser(user.email, username, user.role, username);

      toast.success("Profil berhasil diperbarui!");
    } catch (error: any) {
      console.error("Gagal memperbarui profil:", error);
      toast.error(`Gagal memperbarui profil: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <h1 className="text-3xl font-bold text-stone-800 mb-8">Pengaturan Akun</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profil Anda</CardTitle>
          <CardDescription>
            Perbarui informasi profil Anda di sini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-stone-700">Email</label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-stone-100"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-stone-700">Username</label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda"
              />
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="bg-stone-800 hover:bg-stone-700">
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
