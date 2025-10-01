import { Building, MapPin, Star, Users } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface FacilityCardProps {
  variant?: "compact" | "detailed";
  data: {
    id?: string;
    title: string;
    location: string;
    rating: number;
    description?: string;
    organization?: string;
    bookingCount?: number;
    sport?: string;
    imageUrl?: string;
  };
}

export function FacilityCard({
  variant = "compact",
  data: {
    id = "1",
    title = "Sport Facility",
    location = "Ljubljana",
    rating = 4.6,
    description = "",
    organization = "",
    bookingCount = 0,
    sport: _sport = "",
    imageUrl = "",
  },
}: FacilityCardProps) {
  const t = useTranslations("PlatformModule.facilityCard");

  const facilityUrl = id ? `/facilities/${id}` : "/facilities/1";

  switch (variant) {
    case "detailed":
      return (
        <Link href={facilityUrl}>
          <div className="flex xl:flex-row flex-col gap-6 p-6 border rounded-2xl cursor-pointer">
            <div className="aspect-square bg-muted rounded-2xl h-[250px] relative overflow-hidden">
              <Image
                src={
                  imageUrl ||
                  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop"
                }
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            <div className="flex flex-col gap-y-3 flex-1">
              <div className="space-y-2">
                <h2 className="font-semibold text-xl">{title}</h2>

                {organization && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="size-4" />
                    <span>{organization}</span>
                  </div>
                )}

                {_sport && (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                      {_sport}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="text-amber-500 flex items-center gap-1">
                  <Star className="size-4 fill-amber-500" />
                  <span className="font-medium">{rating.toFixed(1)}</span>
                </div>

                <div className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-4" />
                  <span>{location}</span>
                </div>

                {bookingCount > 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="size-4" />
                    <span>{bookingCount} bookings</span>
                  </div>
                )}
              </div>

              {description && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {description}
                </p>
              )}

              <div className="mt-auto">
                <div className="border w-full rounded-lg text-xs text-center bg-muted/50 flex items-center justify-center text-muted-foreground py-8 min-h-[120px]">
                  {t("booking")}
                </div>
              </div>
            </div>
          </div>
        </Link>
      );
    case "compact":
      return (
        <Link href={facilityUrl}>
          <div className="flex flex-col gap-y-4 cursor-pointer">
            <div className="relative">
              <div className="aspect-square bg-muted rounded-2xl min-h-[200px] relative overflow-hidden">
                <Image
                  src={
                    imageUrl ||
                    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop"
                  }
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="text-muted-foreground flex items-center gap-1 bg-background absolute top-4 right-4 py-1 px-2 rounded-full border">
                <MapPin className="size-4" />
                <span className="text-xs">{location}</span>
              </div>
            </div>
            <div className="flex flex-col gap-y-3">
              <div className="space-y-2">
                <h2 className="font-semibold text-lg">{title}</h2>

                {organization && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="size-4" />
                    <span>{organization}</span>
                  </div>
                )}

                {_sport && (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                      {_sport}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="text-amber-500 flex items-center gap-1">
                  <Star className="size-4 fill-amber-500" />
                  <span className="font-medium">{rating.toFixed(1)}</span>
                </div>

                {bookingCount > 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="size-4" />
                    <span>{bookingCount} bookings</span>
                  </div>
                )}
              </div>

              {description && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
        </Link>
      );
  }
}
