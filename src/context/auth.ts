import { create } from "zustand"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

type Role = "admin" | "buyer" | null

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
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (email, username, role, displayName) =>
    set({ user: { email, username, role, displayName }, loading: false }),
  logout: () => {
    auth.signOut();
    document.getElementById("tawk-script")?.remove();
    const iframe = document.querySelector("iframe[src*='tawk']");
    if (iframe?.parentNode) iframe.parentNode.removeChild(iframe);
    set({ user: null, loading: false });
  }
}));

onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    const ref = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : { role: "buyer", username: "Unknown" };

    useAuth.getState().setUser(
      firebaseUser.email!,
      data.username,
      data.role,
      firebaseUser.displayName || "Guest"
    );
  } else {
    useAuth.setState({ user: null, loading: false });
  }
});
