import { useState, useEffect } from "react";

/**
 * Hook untuk mendeteksi apakah viewport saat ini berada di ukuran mobile (< 768px).
 * Menggunakan matchMedia native dengan listener resize untuk performa nol overhead.
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Set nilai awal yang akurat
    setIsMobile(mediaQuery.matches);

    // Modern API dengan fallback untuk kompatibilitas peramban luas
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      const legacyMediaQuery = mediaQuery as unknown as {
        addListener: (fn: (e: MediaQueryList) => void) => void;
        removeListener: (fn: (e: MediaQueryList) => void) => void;
      };
      legacyMediaQuery.addListener(handleChange as (e: MediaQueryList) => void);
      return () => {
        legacyMediaQuery.removeListener(handleChange as (e: MediaQueryList) => void);
      };
    }
  }, [breakpoint]);

  return isMobile;
}
