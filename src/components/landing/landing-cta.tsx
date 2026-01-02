"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { FadeInSection, premiumEase, hoverSpring } from "@/components/motion";

export function LandingCTA() {
  const t = useTranslations("landing.cta");

  return (
    <section className="py-16 bg-primary text-primary-foreground relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-white/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-black/10 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <FadeInSection
          className="max-w-4xl mx-auto text-center"
        >
          <motion.h2 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: premiumEase }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            {t("title")}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: premiumEase }}
            className="text-xl md:text-2xl text-primary-foreground/80 mb-12 max-w-2xl mx-auto"
          >
            {t("subtitle")}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: premiumEase }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={hoverSpring}
            >
              <Button 
                size="lg" 
                className="h-14 px-8 text-lg rounded-full bg-white text-primary hover:bg-white/90 shadow-lg"
                asChild
              >
                <Link href="/facilities">
                  {t("findFacility")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={hoverSpring}
            >
              <Button 
                variant="outline" 
                size="lg" 
                className="h-14 px-8 text-lg rounded-full border-white/30 text-white bg-white/10 hover:bg-white/20"
                asChild
              >
                <Link href="/providers">
                  {t("listFacility")}
                  <Building2 className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </FadeInSection>
      </div>
    </section>
  );
}
