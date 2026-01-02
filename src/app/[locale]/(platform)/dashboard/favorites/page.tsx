import { Heart, MapPin, ArrowRight, Star } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

// TODO: Implement favorites functionality with API
// For now, show empty state
export default async function FavoritesPage() {
  // Placeholder - in a real implementation, fetch from API
  const favorites: any[] = [];

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Favorites"
        description="Your saved facilities"
      />

      <main className="flex-1 p-4 md:p-6">
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Facility cards would go here */}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-dashed border-border/50 bg-muted/20">
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center">
                <Heart className="h-10 w-10 text-red-500" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-background flex items-center justify-center border border-border/50">
                <Star className="h-4 w-4 text-amber-500" />
              </div>
            </div>
            <h3 className="font-semibold text-xl text-center mb-2">No favorites yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
              Save your favorite facilities to quickly find and book them later. 
              Just tap the heart icon on any facility page to add it to your favorites.
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link href="/facilities">
                <MapPin className="h-4 w-4" />
                Explore Facilities
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
