"use client";

import { Phone, Globe, ChevronRight, Home, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { premiumEase, durations } from "@/components/motion";

interface FacilityHeaderProps {
  name: string;
  address: string;
  city: string;
  phone?: string;
  website?: string;
}

export function FacilityHeader({ name, phone, website }: FacilityHeaderProps) {
  const t = useTranslations("PlatformModule.facilityDetailPage");

  return (
    <motion.div 
      className="mb-8"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durations.normal, ease: premiumEase }}
    >
      {/* Breadcrumb Navigation */}
      <motion.nav 
        className="flex items-center gap-2 text-sm text-muted-foreground mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4, ease: premiumEase }}
      >
        <Link 
          href="/" 
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>{t("breadcrumb.home")}</span>
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link 
          href="/facilities" 
          className="hover:text-primary transition-colors"
        >
          {t("breadcrumb.facilities")}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {name}
        </span>
      </motion.nav>

      {/* Header with gradient background */}
      <div className="relative -mx-6 px-6 py-6 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-xl">
        <div className="flex items-center justify-between">
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-foreground"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: durations.normal, ease: premiumEase }}
          >
            {name}
          </motion.h1>
          
          {/* Contact Info - Right side */}
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: durations.normal, ease: premiumEase }}
          >
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
            >
              <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium hidden md:inline">{phone}</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 text-amber-600">
              <div className="p-2 rounded-full bg-amber-100">
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-sm font-medium hidden md:inline">{t("phoneMissing")}</span>
            </div>
          )}
          {website && (
            <a
              href={website.startsWith('http') ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
            >
              <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium hidden md:inline">{t("website")}</span>
            </a>
          )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
