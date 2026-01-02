"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PiCourtBasketball } from "react-icons/pi";
import { FadeInSection, premiumEase, hoverSpring } from "@/components/motion";

const sports = [
  { key: "tennis", icon: "/icons/tennis.svg", color: "from-green-500/20 to-green-600/20", hoverColor: "group-hover:from-green-500/30 group-hover:to-green-600/30" },
  { key: "multipurpose", icon: null, useLucide: true, color: "from-slate-500/20 to-slate-600/20", hoverColor: "group-hover:from-slate-500/30 group-hover:to-slate-600/30" },
  { key: "badminton", icon: "/icons/badminton.svg", color: "from-red-500/20 to-red-600/20", hoverColor: "group-hover:from-red-500/30 group-hover:to-red-600/30" },
  { key: "volleyball", icon: "/icons/volleyball.svg", color: "from-yellow-500/20 to-yellow-600/20", hoverColor: "group-hover:from-yellow-500/30 group-hover:to-yellow-600/30" },
  { key: "padel", icon: "/icons/padel.svg", color: "from-blue-500/20 to-blue-600/20", hoverColor: "group-hover:from-blue-500/30 group-hover:to-blue-600/30" },
  { key: "tableTennis", icon: "/icons/table tennis.svg", color: "from-orange-500/20 to-orange-600/20", hoverColor: "group-hover:from-orange-500/30 group-hover:to-orange-600/30" },
];

// Refined stagger variants
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

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: premiumEase,
    },
  },
};

export function PopularSports() {
  const t = useTranslations("landing.sports");

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6">
        <FadeInSection 
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            {t("title")}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t("subtitle")}
          </p>
        </FadeInSection>

        <motion.div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {sports.map((sport, index) => (
            <motion.div
              key={sport.key}
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={hoverSpring}
              className={cn(
                // Hide 5th and 6th items on mobile only (show first 4)
                index >= 4 && "hidden md:block"
              )}
            >
              <Link 
                href={`/facilities?sport=${t(`items.${sport.key}.name`)}`}
                className="block group"
              >
                <div className={cn(
                  "aspect-square rounded-2xl p-6 flex flex-col items-center justify-center",
                  "bg-gradient-to-br transition-colors duration-300",
                  "border border-border hover:border-primary/30",
                  "hover:shadow-lg",
                  sport.color,
                  sport.hoverColor
                )}>
                  <div className="w-12 h-12 md:w-16 md:h-16 mb-4 relative flex items-center justify-center">
                    {sport.useLucide ? (
                      <PiCourtBasketball className="w-12 h-12 md:w-16 md:h-16 opacity-80 group-hover:opacity-100 transition-opacity text-[#3d3d3d]" />
                    ) : (
                      <Image
                        src={sport.icon!}
                        alt={t(`items.${sport.key}.name`)}
                        fill
                        className="object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    )}
                  </div>
                  <span className="font-semibold text-foreground text-sm md:text-base text-center">
                    {t(`items.${sport.key}.name`)}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

