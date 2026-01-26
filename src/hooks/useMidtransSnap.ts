import { useState, useEffect } from 'react';

/**
 * Custom hook untuk memuat skrip Midtrans Snap secara dinamis dan aman.
 * Ini memastikan skrip hanya dimuat sekali di seluruh aplikasi.
 */
const useMidtransSnap = () => {
  const [isSnapReady, setIsSnapReady] = useState(false);

  useEffect(() => {
    const scriptId = 'midtrans-snap-script';
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;

    const checkSnap = () => {
      if (window.snap) {
        setIsSnapReady(true);
        return true;
      }
      return false;
    };

    const isSandbox = clientKey && clientKey.startsWith('SB-');
    const scriptUrl = isSandbox
      ? 'https://app.sandbox.midtrans.com/snap/snap.js'
      : 'https://app.midtrans.com/snap/snap.js';

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    // Jika script sudah ada tapi URL-nya salah (mismatch environment), hapus dan buat baru
    if (script && script.src !== scriptUrl) {
      script.remove();
      script = null;
      window.snap = undefined;
      setIsSnapReady(false);
    }

    if (checkSnap()) return;

    if (script) {
      const interval = setInterval(() => {
        if (checkSnap()) clearInterval(interval);
      }, 500);
      setTimeout(() => clearInterval(interval), 10000);
    } else {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = scriptUrl;
      script.setAttribute('data-client-key', clientKey);
      script.async = true;
      script.onload = () => setTimeout(checkSnap, 100);
      document.body.appendChild(script);
    }
  }, []);

  return isSnapReady;
};

export default useMidtransSnap;
