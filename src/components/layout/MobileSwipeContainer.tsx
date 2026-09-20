import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ViewId } from "@/types/navigation";

interface MobileSwipeContainerProps {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
  views: {
    id: ViewId;
    component: React.ReactNode;
  }[];
}

export const MobileSwipeContainer: React.FC<MobileSwipeContainerProps> = ({
  activeView,
  onViewChange,
  views,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  const currentDragDeltaRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);

  const activeIndex = Math.max(
    0,
    views.findIndex((v) => v.id === activeView)
  );

  // Animasi transisi horizontal saat activeView berubah
  useEffect(() => {
    if (!trackRef.current || isAnimatingRef.current) return;

    gsap.to(trackRef.current, {
      xPercent: -activeIndex * 100,
      duration: 0.38,
      ease: "power2.out",
    });
  }, [activeIndex]);

  // Touch Start
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
    isHorizontalSwipeRef.current = null;
    currentDragDeltaRef.current = 0;
  };

  // Touch Move with Real-time Peek (Mengintip layar di samping)
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || !trackRef.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartRef.current.x;
    const deltaY = currentY - touchStartRef.current.y;

    // Tentukan intensitas gestur: apakah scroll vertikal atau swipe horizontal
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        isHorizontalSwipeRef.current = true;
      } else if (Math.abs(deltaY) > 8) {
        isHorizontalSwipeRef.current = false;
      }
    }

    // Jika swipe horizontal terkonfirmasi, geser track untuk efek mengintip (PEEK)
    if (isHorizontalSwipeRef.current) {
      // Resistance di ujung track (kiri paling awal atau kanan paling akhir)
      let dampenedDeltaX = deltaX;
      if (
        (activeIndex === 0 && deltaX > 0) ||
        (activeIndex === views.length - 1 && deltaX < 0)
      ) {
        dampenedDeltaX = deltaX * 0.28;
      }

      currentDragDeltaRef.current = dampenedDeltaX;

      // Hitung pergeseran persentase + pixel
      const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
      const dragPercent = (dampenedDeltaX / containerWidth) * 100;
      const targetPercent = -activeIndex * 100 + dragPercent;

      gsap.set(trackRef.current, {
        xPercent: targetPercent,
      });
    }
  };

  // Touch End: Snap ke tab baru atau kembali ke tab semula
  const handleTouchEnd = () => {
    if (!touchStartRef.current || !trackRef.current) return;

    if (isHorizontalSwipeRef.current) {
      const deltaX = currentDragDeltaRef.current;
      const deltaTime = Date.now() - touchStartRef.current.time;
      const velocity = Math.abs(deltaX) / Math.max(deltaTime, 1);

      // Ambang batas geser: jarak > 60px atau flick cepat (velocity > 0.4)
      const shouldSwitch = Math.abs(deltaX) > 60 || velocity > 0.4;

      let targetIndex = activeIndex;

      if (shouldSwitch) {
        if (deltaX < 0 && activeIndex < views.length - 1) {
          // Geser ke kanan (tampilkan tab berikutnya)
          targetIndex = activeIndex + 1;
        } else if (deltaX > 0 && activeIndex > 0) {
          // Geser ke kiri (tampilkan tab sebelumnya)
          targetIndex = activeIndex - 1;
        }
      }

      isAnimatingRef.current = true;

      // Animasi snap yang mulus dengan GSAP
      gsap.to(trackRef.current, {
        xPercent: -targetIndex * 100,
        duration: 0.32,
        ease: "power2.out",
        onComplete: () => {
          isAnimatingRef.current = false;
          if (targetIndex !== activeIndex) {
            onViewChange(views[targetIndex].id);
            try {
              if ("vibrate" in navigator) {
                navigator.vibrate(12);
              }
            } catch {}
          }
        },
      });
    }

    touchStartRef.current = null;
    isHorizontalSwipeRef.current = null;
    currentDragDeltaRef.current = 0;
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full h-full overflow-hidden relative select-none"
    >
      {/* Horizontal Sliding Track */}
      <div
        ref={trackRef}
        className="flex w-full h-full will-change-transform items-start"
        style={{
          transform: `translateX(-${activeIndex * 100}%)`,
        }}
      >
        {views.map((v) => (
          <div
            key={v.id}
            className="w-full shrink-0 h-full overflow-y-auto px-3 sm:px-4 pt-2 pb-24 touch-pan-y scrollbar-none"
          >
            {v.component}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileSwipeContainer;
