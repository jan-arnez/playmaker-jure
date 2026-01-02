"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function LeafletMap({ center, zoom = 15 }: LeafletMapProps) {
  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      className="w-full h-full" 
      zoomControl={false} 
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      attributionControl={false}
    >
      {/* Google Maps Tiles */}
      <TileLayer
        url="https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
      />
      <Marker 
        position={center} 
        icon={new L.Icon({
          iconUrl: "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2.png",
          iconSize: [27, 43],
          iconAnchor: [13, 43],
          popupAnchor: [0, -43],
        })}
      />
      <MapUpdater center={center} />
    </MapContainer>
  );
}
