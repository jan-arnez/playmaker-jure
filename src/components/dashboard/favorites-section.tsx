"use client";

import { useState, useEffect } from "react";
import { Heart, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { FavoriteButton } from "@/components/favorite-button";
import { authClient } from "@/modules/auth/lib/auth-client";

interface Favorite {
  id: string;
  facility: {
    id: string;
    name: string;
    slug: string | null;
    city: string;
    address: string;
    imageUrl: string | null;
    images: string[];
    pricePerHour: number | null;
    currency: string;
  };
}

export function FavoritesSection() {
  const { data: session } = authClient.useSession();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFavorites() {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/favorites");
        if (response.ok) {
          const data = await response.json();
          setFavorites(data);
        }
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFavorites();
  }, [session?.user]);

  const getImageUrl = (facility: Favorite["facility"]) => {
    if (facility.imageUrl) return facility.imageUrl;
    if (facility.images && facility.images.length > 0) return facility.images[0];
    return "/icons/placeholder-facility.svg";
  };

  const handleFavoriteRemoved = (facilityId: string) => {
    setFavorites(prev => prev.filter(f => f.facility.id !== facilityId));
  };

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Favorites</h2>
        <div className="flex items-center justify-center py-12 rounded-xl border border-dashed border-border/50 bg-muted/20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (favorites.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Favorites</h2>
        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-dashed border-border/50 bg-muted/20">
          <div className="relative mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center">
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <h3 className="font-medium text-center mb-1">No favorites yet</h3>
          <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
            Save your favorite facilities by tapping the heart icon on any facility page
          </p>
          <Button variant="outline" asChild>
            <Link href="/facilities">
              <MapPin className="mr-2 h-4 w-4" />
              Explore Facilities
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Favorites ({favorites.length})</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/facilities" className="text-primary">
            Find more
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((favorite) => (
          <div
            key={favorite.id}
            className="group relative rounded-xl border border-border/50 overflow-hidden bg-gradient-to-br from-muted/30 to-transparent hover:border-primary/30 hover:shadow-md transition-all duration-300"
          >
            {/* Image - Clickable */}
            <Link 
              href={`/facilities/${favorite.facility.slug || favorite.facility.id}`}
              className="relative block h-36 overflow-hidden"
            >
              <img
                src={getImageUrl(favorite.facility)}
                alt={favorite.facility.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
            
            {/* Favorite Button - Positioned above image */}
            <FavoriteButton
              facilityId={favorite.facility.id}
              size="sm"
              className="absolute top-2 right-2 z-10"
            />
            
            {/* Content */}
            <div className="p-4">
              <Link 
                href={`/facilities/${favorite.facility.slug || favorite.facility.id}`}
                className="block"
              >
                <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                  {favorite.facility.name}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {favorite.facility.city}
                </p>
                {favorite.facility.pricePerHour && (
                  <p className="text-sm font-medium text-primary mt-2">
                    €{Number(favorite.facility.pricePerHour).toFixed(0)}/hour
                  </p>
                )}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
