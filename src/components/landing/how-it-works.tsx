"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Search, CalendarCheck, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { FadeInSection, premiumEase } from "@/components/motion";

const steps = [
  { key: "search", icon: Search },
  { key: "book", icon: CalendarCheck },
  { key: "play", icon: Play },
];

// Refined stagger variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: premiumEase,
    },
  },
};

export function HowItWorks() {
  const t = useTranslations("landing.howItWorks");

  return (
    <section className="py-12 md:py-16 bg-background relative overflow-hidden">
      
      <div className="container mx-auto px-6">
        <FadeInSection 
          className="text-center max-w-3xl mx-auto mb-10 md:mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            {t("title")}
          </h2>
          <p className="text-xl text-muted-foreground hidden md:block">
            {t("subtitle")}
          </p>
        </FadeInSection>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 lg:gap-8 max-w-5xl mx-auto relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.key}
                variants={itemVariants}
                className="relative flex flex-row md:flex-col items-center md:items-center text-left md:text-center gap-4 md:gap-0"
              >
                {/* Icon box with subtle hover effect */}
                <motion.div 
                  className={cn(
                    "w-14 h-14 md:w-20 md:h-20 shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center md:mb-6",
                    "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
                    "shadow-lg shadow-primary/20"
                  )}
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Icon className="w-7 h-7 md:w-10 md:h-10" />
                </motion.div>

                <div className="flex-1 md:flex-none">
                  <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-3 text-foreground">
                    {t(`steps.${step.key}.title` as any)}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-none md:max-w-xs md:mx-auto">
                    {t(`steps.${step.key}.description` as any)}
                  </p>
                </div>

                {/* Arrow connector for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 -right-4 xl:-right-8">
                    <svg width="40" height="20" viewBox="0 0 40 20" fill="none" className="text-primary/30">
                      <path d="M0 10H35M35 10L25 2M35 10L25 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
