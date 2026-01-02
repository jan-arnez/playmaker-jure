"use client";

import { createContext, useContext } from "react";

interface Court {
  id: string;
  name: string;
  isActive: boolean;
  locationType?: string | null;
  surface?: string | null;
  timeSlots?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pricing?: any; // Prisma returns Json type, runtime validation in availability-calendar
}

interface SportCategory {
  id: string;
  name: string;
  courts: Court[];
}

interface Facility {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  imageUrl?: string | null;
  workingHours?: unknown;
  sportCategories?: SportCategory[];
  organization: {
    name: string;
    slug: string | null;
    logo: string | null;
  };
  bookings: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
    status: string;
    notes: string | null;
    user: {
      name: string;
      email: string;
    };
  }>;
}

interface FacilityContextValue {
  facility: Facility;
}

const FacilityContext = createContext<FacilityContextValue | null>(null);

interface FacilityContextProviderProps {
  facility: Facility;
  children: React.ReactNode;
}

export function FacilityContextProvider({
  facility,
  children,
}: FacilityContextProviderProps) {
  return (
    <FacilityContext.Provider value={{ facility }}>
      {children}
    </FacilityContext.Provider>
  );
}

export function useFacilityContext() {
  const context = useContext(FacilityContext);
  if (!context) {
    throw new Error(
      "useFacilityContext must be used within FacilityContextProvider"
    );
  }
  return context;
}
