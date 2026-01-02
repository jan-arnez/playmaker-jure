"use client";

import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Shield, Users, Award, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { FadeInSection, premiumEase, hoverSpring } from "@/components/motion";

const reasons = [
  { key: "instant", icon: Clock },
  { key: "verified", icon: Shield },
  { key: "community", icon: Users },
  { key: "quality", icon: Award },
];

// Refined stagger variants for desktop grid
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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

export function LandingWhyChoose() {
  const t = useTranslations("landing.whyChoose");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-cycle through reasons every 5 seconds (mobile only - controlled by JS)
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reasons.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const activeReason = reasons[activeIndex];
  const ActiveIcon = activeReason.icon;

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-6">
        {/* Header */}
        <FadeInSection 
          className="text-center max-w-3xl mx-auto mb-8 md:mb-10"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            {t("title")}
          </h2>
          <p className="text-xl text-muted-foreground hidden md:block">
            {t("subtitle")}
          </p>
        </FadeInSection>

        {/* ========================================== */}
        {/* MOBILE: Horizontal tabs with auto-cycling */}
        {/* ========================================== */}
        <div className="md:hidden">
          {/* Tabs */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex bg-muted rounded-lg p-1">
              {reasons.map((reason, index) => {
                const Icon = reason.icon;
                return (
                  <button
                    key={reason.key}
                    onClick={() => {
                      setActiveIndex(index);
                      setIsPaused(true);
                      setTimeout(() => setIsPaused(false), 10000);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all",
                      activeIndex === index 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Content Card */}
          <div 
            className="max-w-md mx-auto"
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setTimeout(() => setIsPaused(false), 5000)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeReason.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="border-none shadow-lg bg-gradient-to-br from-card to-card/50">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <ActiveIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base mb-1.5 text-foreground">
                          {t(`items.${activeReason.key}.title` as any)}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                          {t(`items.${activeReason.key}.description` as any)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[0, 1].map((i) => (
                            <span 
                              key={i} 
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full"
                            >
                              <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                              {t(`items.${activeReason.key}.benefits.${i}` as any)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Progress indicators */}
            <div className="flex justify-center gap-1.5 mt-4">
              {reasons.map((reason, index) => (
                <button
                  key={reason.key}
                  onClick={() => {
                    setActiveIndex(index);
                    setIsPaused(true);
                    setTimeout(() => setIsPaused(false), 10000);
                  }}
                  className="group relative h-1 rounded-full overflow-hidden transition-all duration-300"
                  style={{ width: activeIndex === index ? '1.5rem' : '0.5rem' }}
                >
                  <div className={cn(
                    "absolute inset-0 rounded-full transition-colors",
                    activeIndex === index ? "bg-primary/30" : "bg-muted"
                  )} />
                  {activeIndex === index && (
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-primary rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 5, ease: "linear" }}
                      key={`progress-${activeIndex}`}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* TABLET & DESKTOP: Original 4-column grid  */}
        {/* ========================================== */}
        <motion.div 
          className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {reasons.map((reason) => {
            const Icon = reason.icon;
            return (
              <motion.div
                key={reason.key}
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={hoverSpring}
              >
                <Card className={cn(
                  "h-full border-none shadow-md md:shadow-lg hover:shadow-xl transition-shadow duration-300",
                  "bg-gradient-to-br from-card to-card/50"
                )}>
                  <CardContent className="p-4 md:pt-8 md:pb-8 text-center">
                    <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 md:mb-6">
                      <Icon className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                    </div>
                    <h3 className="text-sm md:text-xl font-bold mb-0 md:mb-3 text-foreground">
                      {t(`items.${reason.key}.title` as any)}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-4 hidden md:block">
                      {t(`items.${reason.key}.description` as any)}
                    </p>
                    <ul className="space-y-2 text-left hidden md:block">
                      {[0, 1].map((i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span>{t(`items.${reason.key}.benefits.${i}` as any)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
