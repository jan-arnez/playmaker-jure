"use client";

import { ArrowRight, Calendar, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FacilityCard } from "@/modules/platform/components/facility/facility-card";
import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getRegionFromCity } from "@/config/regions";
import { useTranslations } from "next-intl";
import { FadeInSection, premiumEase, hoverSpring } from "@/components/motion";

interface FreeFacilitiesTabsProps {
  facilities: any[];
}

// Tab content animation variants
const tabContentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: premiumEase as any,
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: {
      duration: 0.2,
      ease: "easeIn" as any,
    }
  },
};

export function FreeFacilitiesTabs({ facilities }: FreeFacilitiesTabsProps) {
  const [activeTab, setActiveTab] = useState("today");
  const t = useTranslations("landing.freeFacilities");

  if (facilities.length === 0) return null;

  const renderFacilities = () => (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {facilities.slice(0, 4).map((facility) => (
        <FacilityCard
          key={facility.id}
          variant="landing"
          data={{
            id: facility.id,
            slug: facility.slug || undefined,
            title: facility.name,
            location: `${facility.city}`,
            description: "",
            organization: facility.organization.name,
            bookingCount: facility.bookings?.length || 0,
            sport: facility.sport || "",
            imageUrl: facility.imageUrl || "",
            region: getRegionFromCity(facility.city),
            address: facility.address,
            sports: facility.sports || [facility.sport || "Tennis"],
            priceFrom: facility.minPrice || 25,
          }}
        />
      ))}
    </div>
  );

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-6">
        <FadeInSection 
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>{t("badge")}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            {t("title")}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t("subtitle")}
          </p>
        </FadeInSection>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: premiumEase }}
            className="flex justify-center mb-10"
          >
            <TabsList className="grid grid-cols-2 h-14 p-1.5 bg-muted/50 rounded-full w-full max-w-md">
              <TabsTrigger 
                value="today" 
                className={cn(
                  "rounded-full text-base font-medium transition-all",
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                )}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {t("tabToday")}
              </TabsTrigger>
              <TabsTrigger 
                value="weekend"
                className={cn(
                  "rounded-full text-base font-medium transition-all",
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                )}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {t("tabWeekend")}
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <AnimatePresence mode="wait">
            <TabsContent value="today" className="space-y-8" asChild>
              <motion.div
                key="today"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {renderFacilities()}
                <div className="flex justify-center mt-8">
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={hoverSpring}
                  >
                    <Button size="lg" className="rounded-full" asChild>
                      <Link href="/facilities?date=today">
                        {t("viewAllToday")}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="weekend" className="space-y-8" asChild>
              <motion.div
                key="weekend"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {renderFacilities()}
                <div className="flex justify-center mt-8">
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={hoverSpring}
                  >
                    <Button size="lg" className="rounded-full" asChild>
                      <Link href="/facilities?date=weekend">
                        {t("viewAllWeekend")}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </section>
  );
}
