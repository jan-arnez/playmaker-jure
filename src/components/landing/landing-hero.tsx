"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { SearchBar } from "@/modules/platform/components/search/search-bar";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { premiumEase, durations } from "@/components/motion";

interface LandingHeroProps {
  initialSearch: string;
  initialCity: string;
  initialSport: string;
  initialDate: string;
  initialTime: string;
  cities: string[];
  sports: string[];
}

export function LandingHero({
  initialSearch,
  initialCity,
  initialSport,
  initialDate,
  initialTime,
  cities,
  sports,
}: LandingHeroProps) {
  const t = useTranslations("landing.hero");

  const scrollToFacilities = () => {
    const element = document.getElementById("facilities");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-background">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[30%] h-[30%] bg-green-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-6 py-12 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Title with refined animation */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: durations.normal, ease: premiumEase }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-foreground text-balance"
          >
            {t("title")}
          </motion.h1>
          
          {/* Subtitle with slight delay */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: durations.normal, delay: 0.1, ease: premiumEase }}
            className="hidden md:block text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto text-balance leading-relaxed"
          >
            {t("subtitle")}
          </motion.p>
          
          {/* Search Bar Card - refined timing */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: durations.normal, delay: 0.2, ease: premiumEase }}
            className="w-full max-w-6xl mx-auto pt-8"
          >
            <div className="bg-card/80 backdrop-blur-md border rounded-2xl p-4 md:p-6 shadow-xl">
              <SearchBar
                initialSearch={initialSearch}
                initialCity={initialCity}
                initialSport={initialSport}
                initialDate={initialDate}
                initialTime={initialTime}
                cities={cities}
                sports={sports}
              />
            </div>
          </motion.div>

          {/* Scroll indicator with refined timing */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: durations.slow }}
            className="pt-8 md:pt-16 flex justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="animate-bounce rounded-full"
                onClick={scrollToFacilities}
              >
                <ArrowDown className="w-6 h-6 text-muted-foreground" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

