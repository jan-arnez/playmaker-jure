"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { authClient } from "@/modules/auth/lib/auth-client";
import { useAuthModal } from "@/components/auth-modal";

interface FavoriteButtonProps {
  facilityId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function FavoriteButton({ 
  facilityId, 
  className,
  size = "md" 
}: FavoriteButtonProps) {
  const { data: session } = authClient.useSession();
  const { openLogin } = useAuthModal();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  // Check initial favorite status
  const checkFavoriteStatus = useCallback(async () => {
    if (!session?.user) {
      setIsChecking(false);
      return;
    }

    try {
      const response = await fetch(`/api/favorites/${facilityId}`);
      const data = await response.json();
      setIsFavorite(data.isFavorite);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    } finally {
      setIsChecking(false);
    }
  }, [facilityId, session?.user]);

  useEffect(() => {
    checkFavoriteStatus();
  }, [checkFavoriteStatus]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Show login prompt if not authenticated
    if (!session?.user) {
      openLogin();
      return;
    }

    setIsLoading(true);
    const previousState = isFavorite;
    
    // Optimistic update
    setIsFavorite(!isFavorite);

    try {
      if (previousState) {
        // Remove from favorites
        const response = await fetch(`/api/favorites/${facilityId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to remove from favorites");
        }
        toast.success("Removed from favorites");
      } else {
        // Add to favorites
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ facilityId }),
        });

        if (!response.ok) {
          throw new Error("Failed to add to favorites");
        }
        toast.success("Added to favorites");
      }
    } catch (error) {
      // Revert on error
      setIsFavorite(previousState);
      toast.error(previousState ? "Failed to remove favorite" : "Failed to add favorite");
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-lg cursor-pointer",
        sizeClasses[size],
        className
      )}>
        <Heart className={cn(iconSizes[size], "text-gray-300 animate-pulse")} />
      </div>
    );
  }

  return (
    <motion.button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-lg cursor-pointer transition-colors hover:bg-white",
        sizeClasses[size],
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isFavorite ? "filled" : "outline"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Heart 
            className={cn(
              iconSizes[size],
              "transition-colors",
              isFavorite 
                ? "fill-red-500 text-red-500" 
                : "text-gray-600 hover:text-red-400"
            )} 
          />
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
