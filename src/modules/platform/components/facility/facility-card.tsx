"use client";

import { Building, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { OptimizedImage } from "@/components/optimized-image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const DEFAULT_FACILITY_IMAGE = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=80";

interface FacilityCardProps {
  variant?: "compact" | "detailed" | "landing";
  hideRegion?: boolean;
  data: {
    id?: string;
    slug?: string;
    title: string;
    location: string;
    rating?: number;
    description?: string;
    organization?: string;
    bookingCount?: number;
    sport?: string;
    imageUrl?: string;
    region?: string;
    address?: string;
    sports?: string[];
    priceFrom?: number;
    selectedTime?: string;
    selectedSport?: string;
    selectedDate?: string;
    slotsAvailableToday?: number;
    slotsForDate?: number;
    slotsForTimeRange?: string[];
  };
}

export function FacilityCard({
  variant = "compact",
  hideRegion = false,
  data: {
    id = "1",
    slug,
    title = "Sport Facility",
    location = "Ljubljana",
    description = "",
    sport: _sport = "",
    imageUrl = "",
    region = "Osrednja Slovenija",
    address = "Ulica heroja Staneta 1, 1000 Ljubljana",
    sports = ["Tennis", "Basketball", "Football"],
    priceFrom = 0,
    selectedTime = "",
    selectedSport = "",
    selectedDate = "",
    slotsAvailableToday,
    slotsForDate,
    slotsForTimeRange,
  },
}: FacilityCardProps) {
  const t = useTranslations("PlatformModule.facilityCard");

  const buildQueryString = (date?: string): string => {
    const params = new URLSearchParams();
    if (date) {
      params.set("date", date);
    }
    const query = params.toString();
    return query ? `?${query}` : "";
  };

  const baseUrl = slug ? `/facilities/${slug}` : (id ? `/facilities/${id}` : "/facilities/1");
  const facilityUrl = `${baseUrl}${buildQueryString(selectedDate)}`;

  const hasLocationOnly = !selectedSport && !selectedDate && !selectedTime;
  const hasSportFilter = !!selectedSport;
  const hasDateFilter = !!selectedDate;
  const hasTimeFilter = !!selectedTime && selectedTime !== "any";

  const displaySports = hasSportFilter
    ? sports.filter(sport => 
        sport.toLowerCase().includes(selectedSport.toLowerCase())
      )
    : sports;

  const getAvailableSlots = (): { type: "count" | "slots"; value: string | string[] } => {
    if (slotsForTimeRange && slotsForTimeRange.length > 0) {
      return { type: "slots", value: slotsForTimeRange };
    }

    if (hasTimeFilter) {
      const timeMatch = selectedTime.match(/(\d{2}):(\d{2})/);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        const startHour = Math.max(7, hour - 2);
        const endHour = Math.min(23, hour + 3);
        
        const slots: string[] = [];
        for (let h = startHour; h <= endHour; h++) {
          slots.push(`${h.toString().padStart(2, '0')}:00`);
        }
        return { type: "slots", value: slots };
      }

      switch (selectedTime) {
        case "morning":
          return { type: "slots", value: ["07:00", "08:00", "09:00", "10:00", "11:00"] };
        case "afternoon":
          return { type: "slots", value: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00"] };
        case "evening":
          return { type: "slots", value: ["18:00", "19:00", "20:00", "21:00", "22:00"] };
      }
    }

    if (hasDateFilter && slotsForDate !== undefined) {
      return { type: "count", value: `${slotsForDate} slots available` };
    }

    if (hasSportFilter) {
      const count = slotsAvailableToday !== undefined ? slotsAvailableToday : 0;
      return { type: "count", value: `${count} slots available today` };
    }

    return { type: "count", value: "" };
  };

  // Consistent emerald color for all sport tags
  const sportTagStyle = "from-emerald-500/90 to-emerald-600/90 border-emerald-400/30";

  // Hardcoded prices for demo (will be replaced with real data)
  const demoPrices = [15, 18, 20, 22, 25, 28, 30, 35];
  const displayPrice = priceFrom > 0 ? priceFrom : demoPrices[parseInt(id) % demoPrices.length] || 20;

  switch (variant) {
    case "landing":
      return (
        <Link
          href={facilityUrl}
          aria-label={`Book ${title} facility in ${location}`}
          className="block h-full"
        >
          <motion.div
            className={cn(
              "bg-card rounded-2xl overflow-hidden cursor-pointer group h-full flex flex-col",
              "border border-border/50 shadow-sm",
              "transition-all duration-300",
              "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20"
            )}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="article"
            aria-labelledby={`facility-title-${id}`}
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <OptimizedImage
                src={imageUrl || DEFAULT_FACILITY_IMAGE}
                fallbackSrc={DEFAULT_FACILITY_IMAGE}
                alt={`${title} sports facility`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
              
              {/* Gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0" />
              
              {/* Region tag - hidden on mobile and when location filter is active */}
              {!hideRegion && (
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 hidden md:flex items-center gap-1.5 text-xs font-medium text-foreground shadow-sm">
                <MapPin className="size-3 text-primary" />
                <span>{region}</span>
              </div>
              )}

              {/* Price badge */}
              <div className="absolute bottom-3 left-3 bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-sm font-semibold shadow-lg">
                From €{displayPrice}
                </div>
            </div>

            <div className="p-5 space-y-4 flex-1 flex flex-col">
              {/* Title */}
              <h3
                id={`facility-title-${id}`}
                className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 md:line-clamp-1"
              >
                {title}
              </h3>

              {/* Address - city on mobile, full address on desktop */}
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Building className="size-4 mt-0.5 shrink-0" />
                <span className="md:hidden">{location}</span>
                <span className="hidden md:inline line-clamp-2">{address}</span>
              </div>

              {/* Sports tags - max 2 rows */}
              <div className="mt-auto pt-2">
                {sports && sports.length > 0 && (
                  <div className="flex flex-wrap gap-2 max-h-[72px] overflow-hidden">
                    {sports.slice(0, 5).map((sport, index) => (
                      <span
                        key={index}
                        className={cn(
                          "px-3 py-1.5 text-white text-xs font-medium rounded-full",
                          "bg-gradient-to-r border shadow-sm",
                          "transition-colors duration-200",
                          sportTagStyle
                        )}
                      >
                        {sport}
                      </span>
                    ))}
                    {sports.length > 5 && (
                      <span className="px-3 py-1.5 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                        +{sports.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </Link>
      );

    case "detailed":
      return (
        <Link href={facilityUrl}>
          <motion.div
            className={cn(
              "bg-card flex xl:flex-row flex-col gap-6 p-6 rounded-2xl cursor-pointer",
              "border border-border/50 shadow-sm",
              "transition-all duration-300",
              "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20"
            )}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="article"
            aria-labelledby={`facility-title-${id}`}
          >
            <div className="aspect-square bg-muted rounded-xl h-[250px] relative overflow-hidden">
              <OptimizedImage
                src={imageUrl || DEFAULT_FACILITY_IMAGE}
                fallbackSrc={DEFAULT_FACILITY_IMAGE}
                alt={title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              
              {/* Price badge */}
              <div className="absolute bottom-3 left-3 bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-sm font-semibold shadow-lg">
                From €{displayPrice}
              </div>
            </div>

            <div className="flex flex-col gap-y-4 flex-1">
              <div className="space-y-3">
                <h2
                  id={`facility-title-${id}`}
                  className="font-bold text-xl text-foreground"
                >
                  {title}
                </h2>

                {address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" />
                    <span>{address}</span>
                  </div>
                )}

                {sports && sports.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap max-h-[72px] overflow-hidden">
                    {sports.slice(0, 5).map((sport, index) => (
                      <span
                        key={index}
                        className={cn(
                          "px-3 py-1 text-white text-xs font-medium rounded-full",
                          "bg-gradient-to-r border shadow-sm",
                          sportTagStyle
                        )}
                      >
                        {sport}
                      </span>
                    ))}
                    {sports.length > 5 && (
                      <span className="px-3 py-1.5 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                        +{sports.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {description && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {description}
                </p>
              )}

              <div className="mt-auto">
                <div className="border border-border rounded-xl text-sm text-center bg-muted/30 flex items-center justify-center text-muted-foreground py-8 min-h-[120px]">
                  {t("booking")}
                </div>
              </div>
            </div>
          </motion.div>
        </Link>
      );

    case "compact":
      return (
        <Link href={facilityUrl} aria-label={`Book ${title} facility`} className="block h-full">
          <motion.div
            className={cn(
              "bg-card rounded-2xl overflow-hidden cursor-pointer group h-full flex flex-col",
              "border border-border/50 shadow-sm",
              "transition-all duration-300",
              "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20"
            )}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="article"
            aria-labelledby={`facility-title-${id}`}
          >
            <div className="relative">
              <div className="aspect-[4/3] bg-muted rounded-t-2xl relative overflow-hidden">
                <OptimizedImage
                  src={imageUrl || DEFAULT_FACILITY_IMAGE}
                  fallbackSrc={DEFAULT_FACILITY_IMAGE}
                  alt={`${title} sports facility`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0" />
              </div>
              
              {/* Region badge - hidden on mobile and when location filter is active */}
              {!hideRegion && (
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 hidden md:flex items-center gap-1.5 text-xs font-medium text-foreground shadow-sm">
                <MapPin className="size-3 text-primary" />
                <span>{region}</span>
              </div>
              )}

              {/* Price badge */}
              <div className="absolute bottom-3 left-3 bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-sm font-semibold shadow-lg">
                From €{displayPrice}
                </div>
            </div>

            <div className="p-5 flex flex-col gap-y-4 flex-1">
              <div className="space-y-3">
                <h2
                  id={`facility-title-${id}`}
                  className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 md:line-clamp-1"
                >
                  {title}
                </h2>

                {address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4 mt-0.5 shrink-0" />
                    <span className="md:hidden">{location}</span>
                    <span className="hidden md:inline line-clamp-2">{address}</span>
                  </div>
                )}

                {/* Show sports when only location is selected, or show slots when filters are applied */}
                {hasLocationOnly ? (
                  <div className="pt-2">
                    {displaySports && displaySports.length > 0 && (
                      <div className="flex flex-wrap gap-2 max-h-[72px] overflow-hidden">
                        {displaySports.slice(0, 5).map((sport, index) => (
                          <span
                            key={index}
                            className={cn(
                              "px-3 py-1.5 text-white text-xs font-medium rounded-full",
                              "bg-gradient-to-r border shadow-sm",
                              "transition-all duration-200 hover:scale-105",
                              sportTagStyle
                            )}
                          >
                            {sport}
                          </span>
                        ))}
                        {displaySports.length > 5 && (
                          <span className="px-3 py-1.5 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                            +{displaySports.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2">
                    {(() => {
                      const slotsData = getAvailableSlots();
                      if (slotsData.type === "slots" && Array.isArray(slotsData.value)) {
                        // Max 6 slots (3 per row, 2 rows max)
                        const maxSlots = 6;
                        const displaySlots = slotsData.value.slice(0, maxSlots);
                        const remainingCount = slotsData.value.length - maxSlots;
                        
                        return (
                          <div className="grid grid-cols-3 gap-2 justify-items-center">
                            {displaySlots.map((slot: string, index: number) => (
                              <span
                                key={index}
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium border border-emerald-200 hover:bg-emerald-100 transition-colors text-center whitespace-nowrap"
                              >
                                {slot}
                              </span>
                            ))}
                            {remainingCount > 0 && (
                              <span className="px-3 py-1.5 bg-muted text-muted-foreground text-xs rounded-full font-medium text-center whitespace-nowrap">
                                +{remainingCount}
                              </span>
                            )}
                          </div>
                        );
                      } else if (slotsData.value) {
                        return (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium border border-emerald-200">
                              {slotsData.value as string}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>

              {description && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mt-auto">
                  {description}
                </p>
              )}
            </div>
          </motion.div>
        </Link>
      );
  }
}
