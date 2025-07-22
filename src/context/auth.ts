import { create } from "zustand";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type Role = "admin" | "buyer" | null;

interface User {
  displayName: string;
  email: string;
  username: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (email: string, username: string, role: Role, displayName: string) => void;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (email, username, role, displayName) =>
    set({
      user: { email, username, role, displayName },
      loading: false,
    }),

  logout: async () => {
    try {
      await signOut(auth);
      document.getElementById("tawk-script")?.remove();
      const iframe = document.querySelector("iframe[src*='tawk']");
      if (iframe?.parentNode) iframe.parentNode.removeChild(iframe);

      set({ user: null, loading: false });
    } catch (err) {
      console.error("Gagal logout:", err);
    }
  },
}));

onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    try {
      let ref = doc(db, "users", firebaseUser.uid);
      let snap = await getDoc(ref);
      let data;

      if (snap.exists()) {
        data = snap.data();
      } else {
        ref = doc(db, "admins", firebaseUser.uid);
        snap = await getDoc(ref);
        data = snap.exists() ? snap.data() : { role: null, username: "Unknown" };
      }

      useAuth.getState().setUser(
        firebaseUser.email!,
        data.username,
        data.role,
        firebaseUser.displayName || "Guest"
      );
    } catch (err) {
      console.error("Gagal ambil user:", err);
    }
  } else {
    useAuth.setState({ user: null, loading: false });
  }
});
