"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function FacilitiesEmptyState() {
  const t = useTranslations("PlatformModule.facilitiesPage");

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center py-16"
    >
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.5, 
          type: "spring",
          stiffness: 200,
          damping: 15
        }}
        className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <MapPin className="h-8 w-8 text-primary" />
      </motion.div>
      <motion.h3 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-xl font-medium mb-2"
      >
        {t("noFacilitiesFound")}
      </motion.h3>
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="text-muted-foreground mb-6"
      >
        {t("tryAdjusting")}
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Button 
          variant="default" 
          asChild
          className="hover:scale-105 transition-transform"
        >
          <Link href="/facilities">{t("clearFilters")}</Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}

