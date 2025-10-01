"use client";

import { Building, Mail, MapPin, Phone, Star, Users } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFacilityContext } from "@/context/facility-context";

export function FacilityDetail() {
  const t = useTranslations("PlatformModule.facilityDetail");
  const { facility } = useFacilityContext();

  const rating = 4.5 + Math.random() * 0.5; // Random rating between 4.5-5.0

  return (
    <div className="space-y-8">
      {/* Gallery */}
      <div className="space-y-4">
        <div className="aspect-video w-full bg-muted rounded-2xl relative overflow-hidden">
          <Image
            src={
              facility.imageUrl ||
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop"
            }
            alt={facility.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square w-full bg-muted rounded-2xl relative overflow-hidden"
            >
              <Image
                src={
                  facility.imageUrl ||
                  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop"
                }
                alt={`${facility.name} gallery ${i}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 25vw, (max-width: 1200px) 20vw, 15vw"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Facility Info */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              {facility.name}
            </h1>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="size-5 fill-amber-500 text-amber-500" />
                <span className="font-medium">{rating.toFixed(1)}</span>
              </div>

              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="size-4" />
                <span>
                  {facility.bookings.length} {t("activeBookings")}
                </span>
              </div>
            </div>

            {facility.description && (
              <p className="text-lg text-muted-foreground leading-relaxed">
                {facility.description}
              </p>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{t("contactInformation")}</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="size-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{facility.address}</p>
                  <p className="text-muted-foreground">{facility.city}</p>
                </div>
              </div>

              {facility.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="size-5 text-muted-foreground" />
                  <a
                    href={`tel:${facility.phone}`}
                    className="text-primary hover:text-primary/80"
                  >
                    {facility.phone}
                  </a>
                </div>
              )}

              {facility.email && (
                <div className="flex items-center gap-3">
                  <Mail className="size-5 text-muted-foreground" />
                  <a
                    href={`mailto:${facility.email}`}
                    className="text-primary hover:text-primary/80"
                  >
                    {facility.email}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Building className="size-5 text-muted-foreground" />
                <span className="text-foreground">
                  {facility.organization.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Facility Features */}
        <Card>
          <CardHeader>
            <CardTitle>{t("facilityFeatures")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground">
                {t("professionalEquipment")}
              </span>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                ✓ {t("available")}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">{t("parkingAvailable")}</span>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                ✓ {t("available")}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">{t("changingRooms")}</span>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                ✓ {t("available")}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">{t("equipmentRental")}</span>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                ✓ {t("available")}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">{t("wifiAvailable")}</span>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                ✓ {t("available")}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground">{t("airConditioning")}</span>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                ✓ {t("available")}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
