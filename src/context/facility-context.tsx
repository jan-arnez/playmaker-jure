"use client";

import { createContext, useContext } from "react";

interface Facility {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  imageUrl?: string | null;
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
