import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageSliderProps {
  images: string[];
  title: string;
}

export default function ImageSlider({ images, title }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);

  const slideCount = images?.length || 1;

  // Setup auto-play
  useEffect(() => {
    if (slideCount > 1 && !isHovered) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % slideCount);
      }, 4000); // changes every 4 seconds
    }
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [slideCount, isHovered]);

  const handlePrev = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + slideCount) % slideCount);
  };

  const handleNext = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slideCount);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      // Swiped left -> show next
      handleNext(e);
    } else if (diff < -50) {
      // Swiped right -> show previous
      handlePrev(e);
    }
    touchStartX.current = null;
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
        Sem foto disponível
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full overflow-hidden select-none cursor-pointer group/slider animate-in fade-in duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      // Click on the image wrapper itself cycles to the next image
      onClick={handleNext}
      title="Clique na foto para avançar os slides"
    >
      {/* Slide Container */}
      <div 
        className="relative w-full h-full flex transition-transform duration-500 ease-out" 
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((img, i) => {
          const isVideo = img.startsWith('data:video/') || img.endsWith('.mp4') || img.endsWith('.mov') || img.endsWith('.webm') || img.includes('video');
          return (
            <div key={i} className="min-w-full h-full relative shrink-0">
              {isVideo ? (
                <video 
                  src={img} 
                  className="w-full h-full object-cover transition-all duration-350"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img 
                  src={img} 
                  alt={`${title} - ${i + 1}`} 
                  className="w-full h-full object-cover transition-all duration-350"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Manual buttons overlay - ALWAYS VISIBLE now for ultra clear discoverability */}
      {slideCount > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIndex((prev) => (prev - 1 + slideCount) % slideCount);
            }}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-all duration-150 border border-white/10 hover:scale-105 active:scale-95 cursor-pointer shadow-md z-20"
            title="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIndex((prev) => (prev + 1) % slideCount);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-all duration-150 border border-white/10 hover:scale-105 active:scale-95 cursor-pointer shadow-md z-20"
            title="Próximo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Info indicator in top-center to show interactive slides */}
      {slideCount > 1 && (
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full text-[8.5px] font-bold text-white/90 tracking-wide pointer-events-none z-10 font-sans uppercase">
          Slide {currentIndex + 1} de {slideCount} • Clique ou Deslize
        </div>
      )}

      {/* Slide Index Indicators (Micro dots) - ALWAYS VISIBLE with modern styling */}
      {slideCount > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 z-20">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => handleDotClick(e, i)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentIndex === i 
                  ? 'w-5 bg-emerald-500' 
                  : 'w-1.5 bg-white/70 hover:bg-white'
              }`}
              title={`Ir para imagem ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
