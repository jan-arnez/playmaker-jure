"use client";

import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FadeInSection, premiumEase } from "@/components/motion";

// Stagger variants for comparison rows
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.35,
      ease: premiumEase,
    },
  },
};

export function CompetitiveComparison() {
  const t = useTranslations("platform.providers.comparison");

  const features = [
    "realtime",
    "seasonal",
    "analytics",
    "marketing",
    "mobile",
    "support",
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6">
        <FadeInSection className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("title")}</h2>
          <p className="text-xl text-muted-foreground">{t("subtitle")}</p>
        </FadeInSection>

        <motion.div 
          className="max-w-4xl mx-auto rounded-2xl overflow-hidden border shadow-lg bg-card"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: premiumEase }}
        >
          <div className="grid grid-cols-3 bg-muted/50 p-6 border-b">
            <div className="col-span-1"></div>
            <div className="col-span-1 text-center font-bold text-xl text-primary">
              {t("us")}
            </div>
            <div className="col-span-1 text-center font-bold text-xl text-muted-foreground">
              {t("others")}
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((featureKey, index) => (
              <motion.div
                key={featureKey}
                variants={rowVariants}
                className={cn(
                  "grid grid-cols-3 p-6 items-center hover:bg-muted/20 transition-colors",
                  index !== features.length - 1 && "border-b"
                )}
              >
              <div className="col-span-1 font-medium text-foreground md:text-lg text-sm pr-4">
                {t(`features.${featureKey}` as any)}
              </div>
              <div className="col-span-1 flex justify-center">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-primary" strokeWidth={3} />
                </div>
              </div>
              <div className="col-span-1 flex justify-center">
                {index === 0 || index === 4 ? (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Check className="h-5 w-5 text-muted-foreground" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                     <X className="h-5 w-5 text-destructive" />
                  </div>
                )}
              </div>
            </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

