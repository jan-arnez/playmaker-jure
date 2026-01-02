"use client";

import { X, ChevronLeft, ChevronRight, Images, ImageOff } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { premiumEase } from "@/components/motion";

// Filter out invalid image URLs (blob URLs, empty strings, etc.)
function isValidImageUrl(url: string): boolean {
  if (!url || url.trim() === "") return false;
  if (url.startsWith("blob:")) return false;
  if (url.startsWith("data:") && url.length < 100) return false; // Too short data URI
  return true;
}

const PLACEHOLDER_IMAGE = "/icons/placeholder-facility.svg";

interface FacilityGalleryClientProps {
  images: string[];
  facilityName: string;
}

export function FacilityGalleryClient({ images: rawImages, facilityName }: FacilityGalleryClientProps) {
  const t = useTranslations("PlatformModule.facilityDetailPage");
  
  // Filter out invalid image URLs (blob URLs, empty strings, etc.)
  const validImages = rawImages.filter(isValidImageUrl);
  const images = validImages.length > 0 ? validImages : [PLACEHOLDER_IMAGE];
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  
  // Touch handling state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const nextImage = useCallback(() => {
    setDirection(1);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setDirection(-1);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToImage = (index: number) => {
    setDirection(index > currentImageIndex ? 1 : -1);
    setCurrentImageIndex(index);
  };

  const openGallery = (index: number = 0) => {
    setCurrentImageIndex(index);
    setDirection(0);
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeGallery = () => {
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextImage();
          break;
        case 'Escape':
          closeGallery();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextImage, prevImage]);

  // Scroll thumbnail into view
  useEffect(() => {
    if (thumbnailContainerRef.current) {
      const activeThumb = thumbnailContainerRef.current.children[currentImageIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentImageIndex]);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }
  };

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const imageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95
    })
  };

  return (
    <>
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
      
      {/* Image Count Badge - Top Right */}
      {images.length > 1 && (
        <motion.div 
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg border border-white/50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: premiumEase }}
        >
          <Images className="h-4 w-4 text-primary" />
          <span>{images.length}</span>
        </motion.div>
      )}
      
      {/* Gallery Trigger Button */}
      <motion.button
        onClick={() => openGallery(0)}
        className="absolute bottom-4 right-4 h-[41px] bg-white/95 backdrop-blur-sm text-gray-700 px-3 rounded-full font-medium shadow-lg border border-white/50 ring-1 ring-black/5 hover:bg-white hover:scale-105 transition-all flex items-center gap-2 text-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4, ease: premiumEase }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        <Images className="h-4 w-4 text-primary" />
        <span>{t("showAllImages")}</span>
      </motion.button>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: premiumEase }}
          >
            {/* Backdrop - click to close */}
            <motion.div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={closeGallery}
            />

            {/* Content Container */}
            <div className="relative h-full flex flex-col">
              {/* Top Bar */}
              <motion.div 
                className="flex items-center justify-between px-4 sm:px-6 py-4 relative z-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: premiumEase }}
              >
                {/* Close Button */}
                <button
                  onClick={closeGallery}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all group"
                >
                  <X className="h-5 w-5" />
                  <span className="text-sm font-medium hidden sm:inline">Close</span>
                </button>

                {/* Image Counter */}
                <div className="px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </motion.div>

              {/* Main Image Area - click outside image to close */}
              <div 
                className="flex-1 relative flex items-center justify-center px-4 sm:px-16 overflow-hidden cursor-pointer"
                onClick={closeGallery}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {/* Navigation Buttons */}
                {images.length > 1 && (
                  <>
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all backdrop-blur-sm cursor-pointer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.4, ease: premiumEase }}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </motion.button>
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all backdrop-blur-sm cursor-pointer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.4, ease: premiumEase }}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </motion.button>
                  </>
                )}

                {/* Image with Animation - stop propagation so clicking image doesn't close */}
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    custom={direction}
                    variants={imageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: premiumEase }}
                    className="flex items-center justify-center cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={images[currentImageIndex]}
                      alt={`${facilityName} - Image ${currentImageIndex + 1}`}
                      className="max-w-full max-h-[calc(100vh-220px)] object-contain rounded-lg shadow-2xl select-none"
                      draggable={false}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Thumbnail Strip and Dot Navigation */}
              {images.length > 1 && (
                <motion.div 
                  className="py-4 px-4 sm:px-6 space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4, ease: premiumEase }}
                >
                  {/* Thumbnail Slider */}
                  <div 
                    ref={thumbnailContainerRef}
                    className="flex gap-2 sm:gap-3 justify-center overflow-x-auto pb-2 scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {images.map((image, index) => (
                      <motion.button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden transition-all duration-300 ${
                          index === currentImageIndex
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-gray-900 scale-100 opacity-100"
                            : "opacity-40 hover:opacity-70 hover:scale-105"
                        }`}
                        whileHover={{ scale: index === currentImageIndex ? 1 : 1.08 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                        {/* Active indicator overlay */}
                        {index === currentImageIndex && (
                          <motion.div
                            className="absolute inset-0 border-2 border-primary rounded-xl"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>

                  {/* Dot Navigation */}
                  <div className="flex items-center justify-center gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`transition-all duration-300 rounded-full ${
                          index === currentImageIndex
                            ? "w-8 h-2 bg-primary"
                            : "w-2 h-2 bg-white/30 hover:bg-white/50"
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
