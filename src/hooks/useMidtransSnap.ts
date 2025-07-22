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

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const handleLoad = () => {
      if (window.snap) {
        setIsSnapReady(true);
      }
    };

    if (script) {
      handleLoad();
    } else {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', clientKey);
      script.async = true;
      
      script.addEventListener('load', handleLoad);
      document.body.appendChild(script);
    }

    return () => {
      script?.removeEventListener('load', handleLoad);
    };
  }, []);

  return isSnapReady;
};

export default useMidtransSnap;
