import { create } from "zustand"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

type Role = "admin" | "buyer" | null

interface User {
  email: string
  username: string
  role: Role
}

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (email: string, username: string, role: Role) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (email, username, role) =>
    set({ user: { email, username, role }, loading: false }),
  logout: () => {
    auth.signOut()
    set({ user: null, loading: false })
  },
}))

// Listen perubahan auth dari Firebase
onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    const ref = doc(db, "users", firebaseUser.uid)
    const snap = await getDoc(ref)

    const data = snap.exists() ? snap.data() : { role: "buyer", username: "Unknown" }

    useAuth.getState().setUser(firebaseUser.email!, data.username, data.role)
  } else {
    useAuth.setState({ user: null, loading: false })
  }
})
