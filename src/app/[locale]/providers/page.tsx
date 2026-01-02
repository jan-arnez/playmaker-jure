"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import PartnersPricing from "@/components/for-providers/partners-pricing";
import { Footer } from "@/components/layout/footer";
import { Navigation } from "@/components/layout/navigation";
import { StickyCTA } from "@/components/for-providers/sticky-cta";
import { FeatureDeepDive } from "@/components/for-providers/feature-deep-dive";
import { CompetitiveComparison } from "@/components/for-providers/competitive-comparison";
import { TestimonialsSection } from "@/components/for-providers/testimonials-section";
import { VideoShowcase } from "@/components/for-providers/video-showcase";
import { StatsSection } from "@/components/for-providers/stats-section";
import { motion } from "framer-motion";
import { ArrowDown, Play } from "lucide-react";
import { premiumEase, durations, hoverSpring } from "@/components/motion";

export default function PartnersPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-grow">
        <HeroSection />
        <StatsSection />
        <FeatureDeepDive />
        <VideoShowcase />
        <CompetitiveComparison />
        <TestimonialsSection />
        <div id="pricing">
          <PartnersPricing />
        </div>
      </main>

      <StickyCTA />
      <Footer />
    </div>
  );
}

function HeroSection() {
  const t = useTranslations("platform.providers.hero");
  
  const scrollToFeatures = () => {
    const element = document.getElementById("pricing");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div id="hero-section" className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-background">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 py-12 text-center relative z-10">
        <div className="max-w-5xl mx-auto space-y-8">
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
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto text-balance leading-relaxed"
          >
            {t("subtitle")}
          </motion.p>
          
          {/* CTA Buttons with micro-interactions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: durations.normal, delay: 0.2, ease: premiumEase }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
          >
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={hoverSpring}
            >
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/20">
                {t("try")}
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={hoverSpring}
            >
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full gap-2">
                <Play className="w-4 h-4" />
                {t("watchVideo")}
              </Button>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: durations.slow }}
            className="pt-16 flex justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={hoverSpring}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="animate-bounce rounded-full"
                onClick={scrollToFeatures}
              >
                <ArrowDown className="w-6 h-6 text-muted-foreground" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
