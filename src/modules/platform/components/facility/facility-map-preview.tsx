"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Maximize2 } from "lucide-react";

// Dynamically import LeafletMap with no SSR
const LeafletMap = dynamic(
  () => import("./leaflet-map"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <MapPin className="h-6 w-6 text-gray-400 animate-pulse" />
      </div>
    )
  }
);

interface FacilityMapPreviewProps {
  address: string;
  city: string;
}

export function FacilityMapPreview({ address, city }: FacilityMapPreviewProps) {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCoords() {
      try {
        const query = encodeURIComponent(`${address}, ${city}`);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch (error) {
        console.error("Error fetching coordinates:", error);
      } finally {
        setLoading(false);
      }
    }

    if (address && city) {
      fetchCoords();
    }
  }, [address, city]);

  const googleMapsEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ""}&q=${encodeURIComponent(`${address}, ${city}`)}`;
  
  // Fallback if no API key (using iframe output=embed which is legacy but works for free without key usually, or simply rely on the Maps Embed API if key is there)
  // Since we might not have a key in env, use the direct search embed
  const iframeSrc = `https://maps.google.com/maps?q=${encodeURIComponent(`${address}, ${city}`)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div 
          className="relative h-24 rounded-lg overflow-hidden cursor-pointer group border border-gray-100 shadow-sm hover:shadow-md transition-all mt-3 z-0 isolate"
          role="button"
          aria-label={`View map for ${address}, ${city}`}
        >
          {coords ? (
            <LeafletMap center={coords} zoom={15} />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-gray-400" />
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-1.5 rounded-full shadow-sm text-xs font-medium text-gray-900 flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 duration-200">
              <Maximize2 className="h-3 w-3" />
              Expand Map
            </div>
          </div>
        </div>
      </DialogTrigger>
      
      <DialogContent className="max-w-[90vw] w-full h-[80vh] p-0 gap-0 overflow-hidden bg-white border-none shadow-2xl sm:max-w-none sm:w-[90vw] sm:h-[80vh] z-[9999]">
        <div className="sr-only">
            <DialogTitle>Map View - {address}, {city}</DialogTitle>
        </div>
        <div className="w-full h-full relative">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={iframeSrc}
            allowFullScreen
            title={`Map for ${address}, ${city}`}
            className="w-full h-full"
          />
          {/* Close button is provided by DialogContent usually, but user asked for NO padding. 
              Checking DialogContent implementation would be good, usually X is absolute.
          */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
