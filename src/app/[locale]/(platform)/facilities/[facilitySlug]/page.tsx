import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navigation } from "@/components/layout/navigation";
import { FavoriteButton } from "@/components/favorite-button";
import { FacilityContextProvider } from "@/context/facility-context";
import { prisma } from "@/lib/prisma";
import { FacilityGalleryClient } from "@/modules/platform/components/facility/facility-gallery-client";
import { FacilitySportCalendarWrapper } from "@/modules/platform/components/facility/facility-sport-calendar-wrapper";
import { FacilityHeader } from "@/modules/platform/components/facility/facility-header";
import { DescriptionRulesTabs } from "@/modules/platform/components/facility/description-rules-tabs";
import { FacilityInfoCard } from "@/modules/platform/components/facility/facility-info-card";
import { RelatedFacilities } from "@/modules/platform/components/facility/related-facilities";
import { AmenitiesImageOverlay } from "@/modules/platform/components/facility/amenities-image-overlay";

interface FacilityPageProps {
  params: Promise<{
    facilitySlug: string;
  }>;
  searchParams: Promise<{
    date?: string;
  }>;
}

export default async function FacilityPage({ params, searchParams }: FacilityPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const facilitySlug = resolvedParams.facilitySlug;
  
  // Try to find by slug first, then by id (for backward compatibility)
  let facility = await prisma.facility.findUnique({
    where: {
      slug: facilitySlug,
    },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      description: true,
      imageUrl: true,
      images: true,
      phone: true,
      email: true,
      website: true,
      surface: true,
      locationType: true,
      facilities: true,
      workingHours: true,
      rules: true,
      capacity: true,
      pricePerHour: true,
      currency: true,
      status: true,
      organizationId: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      sportCategories: {
        select: {
          id: true,
          name: true,
          courts: {
            select: {
              id: true,
              name: true,
              isActive: true,
              locationType: true,
              surface: true,
              timeSlots: true,
              pricing: true,
            },
          },
        },
      },
      organization: {
        select: {
          name: true,
          slug: true,
          logo: true,
        },
      },
      bookings: {
        where: {
          status: {
            in: ["confirmed", "pending"],
          },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          startTime: "asc",
        },
      },
    },
  });

  // If not found by slug, try by id (backward compatibility)
  if (!facility) {
    facility = await prisma.facility.findUnique({
      where: {
        id: facilitySlug,
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        description: true,
        imageUrl: true,
        images: true,
        phone: true,
        email: true,
        website: true,
        surface: true,
        locationType: true,
        facilities: true,
      workingHours: true,
      rules: true,
      capacity: true,
      pricePerHour: true,
      currency: true,
      status: true,
      organizationId: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      sportCategories: {
        select: {
          id: true,
          name: true,
          courts: {
            select: {
              id: true,
              name: true,
              isActive: true,
              locationType: true,
              surface: true,
              timeSlots: true,
              pricing: true,
            },
          },
        },
      },
      organization: {
        select: {
          name: true,
          slug: true,
          logo: true,
        },
      },
        bookings: {
          where: {
            status: {
              in: ["confirmed", "pending"],
            },
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            startTime: "asc",
          },
        },
      },
    });
  }

  if (!facility) {
    notFound();
  }

  // Get sports from facility's sportCategories
  const facilitySports = facility.sportCategories?.map(cat => cat.name) || ["Tennis", "Basketball", "Football", "Swimming"];

  // Get initial date from URL params if provided
  const initialDate = resolvedSearchParams.date || undefined;

  // Pass working hours as-is, the component will handle parsing
  const workingHours = facility.workingHours;

  // Parse facilities/amenities if available
  const amenities = facility.facilities as string[] | null;

  // Helper function to check if image URL is valid (not blob URL, not empty)
  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url || url.trim() === "") return false;
    if (url.startsWith("blob:")) return false;
    return true;
  };

  // Filter and get valid images
  const validImages = (facility.images || []).filter(isValidImageUrl);
  const hasValidDefaultImage = isValidImageUrl(facility.imageUrl) && facility.imageUrl;
  
  // Main image: use imageUrl if valid, otherwise first valid image, otherwise placeholder
  const mainImageUrl: string = hasValidDefaultImage
    ? facility.imageUrl! 
    : (validImages[0] || "/icons/placeholder-facility.svg");
  
  // Gallery images: default image first, then other images (removing duplicates)
  const galleryImages: string[] = (() => {
    if (hasValidDefaultImage && facility.imageUrl) {
      // Put default image first, then add other images that aren't the default
      const otherImages = validImages.filter(img => img !== facility.imageUrl);
      return [facility.imageUrl, ...otherImages];
    } else if (validImages.length > 0) {
      return validImages;
    } else {
      return ["/icons/placeholder-facility.svg"];
    }
  })();



  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto px-6 py-12">
          <FacilityContextProvider facility={facility}>
            <FacilityHeader
              name={facility.name}
              address={facility.address}
              city={facility.city}
              phone={facility.phone ?? undefined}
              website={facility.website ?? undefined}
            />
            
            {/* Main Gallery and Info Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch">
              {/* Image Gallery - Main */}
              <div className="lg:col-span-2 relative rounded-xl overflow-hidden shadow-lg group min-h-[400px]">
                {/* Favorite Button - Top Right */}
                <FavoriteButton 
                  facilityId={facility.id} 
                  className="absolute top-4 right-4 z-20" 
                />
                
                <img
                  src={mainImageUrl}
                  alt={facility.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  fetchPriority="high"
                  loading="eager"
                />
                
                {/* Amenities Overlay */}
                {amenities && amenities.length > 0 && (
                  <AmenitiesImageOverlay amenities={amenities} />
                )}
                
                <FacilityGalleryClient
                  images={galleryImages}
                  facilityName={facility.name}
                />
              </div>

              
              {/* Side Info Card */}
              <div className="lg:col-span-1">
                <FacilityInfoCard 
                  address={facility.address} 
                  city={facility.city}
                  workingHours={workingHours}
                />
              </div>
            </div>
            
            {/* Calendar Section */}
            <FacilitySportCalendarWrapper
              facilityId={facility.id}
              facilityName={facility.name}
              sports={facilitySports}
              initialSelectedSport="all"
              initialDate={initialDate}
            />
            
            {/* Description & Rules Tabs */}
            <div className="mt-12 space-y-8">
              <DescriptionRulesTabs
                facilityName={facility.name}
                facilityCity={facility.city}
                description={facility.description || undefined}
              />
            </div>
            
            {/* Related Facilities Section */}
            <div className="mt-12">
              <RelatedFacilities 
                currentFacilityId={facility.id}
                city={facility.city}
                sportCategoryIds={facility.sportCategories?.map(cat => cat.id) || []}
              />
            </div>
          </FacilityContextProvider>
        </div>
      </main>
      <Footer />
    </div>
  );
}
