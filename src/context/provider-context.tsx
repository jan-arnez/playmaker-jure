"use client";

import { createContext, useContext } from "react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
}

interface ProviderContextValue {
  organization: Organization;
  userRole: string;
}

const ProviderContext = createContext<ProviderContextValue | null>(null);

interface ProviderContextProviderProps {
  organization: Organization;
  userRole: string;
  children: React.ReactNode;
}

export function ProviderContextProvider({
  organization,
  userRole,
  children,
}: ProviderContextProviderProps) {
  return (
    <ProviderContext.Provider value={{ organization, userRole }}>
      {children}
    </ProviderContext.Provider>
  );
}

export function useProviderContext() {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error(
      "useProviderContext must be used within ProviderContextProvider"
    );
  }
  return context;
}
