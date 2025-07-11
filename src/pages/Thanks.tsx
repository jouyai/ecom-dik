import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "@/lib/cartStore"
import { CheckCircle } from "lucide-react"

export default function Thanks() {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)
  const { toggleRefresh } = useCart()

  // Refresh cart badge saat masuk halaman ini
  useEffect(() => {
    toggleRefresh()
  }, [toggleRefresh])

  // Countdown logic
  useEffect(() => {
    if (countdown === 0) {
      navigate("/") // aman sekarang karena di dalam useEffect
      return
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, navigate])

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
      <CheckCircle className="mx-auto text-green-500 w-16 h-16" />
      <h1 className="text-2xl font-bold">Terima kasih telah melakukan pemesanan! 🙌</h1>
      <p className="text-gray-600">Kami sedang memproses pesanan kamu...</p>
      <p className="text-sm text-gray-500">
        Kamu akan diarahkan kembali ke beranda dalam{" "}
        <span className="font-semibold">{countdown}</span> detik.
      </p>
    </div>
  )
}
