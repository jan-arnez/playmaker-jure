"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
  quality?: number;
  fallbackSrc?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  fill = false,
  quality = 80,
  fallbackSrc,
}: OptimizedImageProps) {
  // Determine the effective source - use fallback immediately if src is empty
  const effectiveSrc = (!src || src.trim() === "") && fallbackSrc ? fallbackSrc : src;
  
  // If priority is true, skip initial loading state to prevent hydration mismatch
  const [isLoading, setIsLoading] = useState(!priority);
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState(effectiveSrc);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const newEffectiveSrc = (!src || src.trim() === "") && fallbackSrc ? fallbackSrc : src;
    setImgSrc(newEffectiveSrc);
    setHasError(false);
    setIsLoading(!priority);
  }, [src, fallbackSrc, priority]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      setIsLoading(true); // Show loading while fallback loads
    } else {
      setHasError(true);
    }
  };

  // Show error placeholder if no valid source
  if (hasError || (!imgSrc || imgSrc.trim() === "")) {
    return (
      <div className={cn(
        "bg-muted flex items-center justify-center",
        fill ? "absolute inset-0" : "",
        className
      )}>
        <div className="text-muted-foreground text-sm text-center p-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-2">
            <span className="text-gray-400 text-xs">🏟️</span>
          </div>
          <div className="text-xs">Facility Image</div>
        </div>
      </div>
    );
  }

  // When using fill, don't wrap in additional div - return Image directly
  if (fill) {
    return (
      <>
        {isLoading && mounted && (
          <div 
            className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center z-10"
            suppressHydrationWarning
          >
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <Image
          src={imgSrc || fallbackSrc || src} // Ensure we have something to render
          alt={alt}
          fill={true}
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
          sizes={sizes}
          priority={priority}
          quality={quality}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
          unoptimized={src.startsWith('http://localhost') || src.includes('localhost')}
        />
      </>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && mounted && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center z-10"
          suppressHydrationWarning
        >
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <Image
        src={imgSrc || fallbackSrc || src}
        alt={alt}
        width={width}
        height={height}
        fill={false}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        sizes={sizes}
        priority={priority}
        quality={quality}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
        unoptimized={src.startsWith('http://localhost') || src.includes('localhost')}
      />
    </div>
  );
}
