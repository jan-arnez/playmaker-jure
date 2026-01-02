"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";
import { Building2, MapPin, CalendarCheck, Star } from "lucide-react";
import { premiumEase } from "@/components/motion";

interface StatItem {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  label: string;
  icon: React.ElementType;
}

interface LandingStatsProps {
  stats: {
    facilities: number;
    cities: number;
    bookings: number;
  };
}

// Refined stagger variants
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
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: premiumEase,
    },
  },
};

export function LandingStats({ stats }: LandingStatsProps) {
  const t = useTranslations("landing.stats");
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const statItems: StatItem[] = [
    {
      value: stats.facilities,
      suffix: "+",
      label: t("facilities"),
      icon: Building2,
    },
    {
      value: stats.cities,
      suffix: "+",
      label: t("cities"),
      icon: MapPin,
    },
    {
      value: stats.bookings,
      suffix: "+",
      label: t("bookings"),
      icon: CalendarCheck,
    },
    {
      value: 4.9,
      decimals: 1,
      label: t("rating"),
      icon: Star,
    },
  ];

  return (
    <section className="py-10 md:py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-6" ref={ref}>
        {/* Mobile: 2x2 Grid */}
        <motion.div 
          className="grid grid-cols-2 gap-6 md:hidden"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {statItems.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="text-center"
            >
              <div className="flex justify-center mb-2 opacity-80">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold mb-1">
                {inView && (
                  <CountUp
                    end={stat.value}
                    duration={2}
                    separator=","
                    decimals={stat.decimals || 0}
                    prefix={stat.prefix || ""}
                    suffix={stat.suffix || ""}
                  />
                )}
              </div>
              <div className="text-primary-foreground/80 text-sm font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tablet & Desktop: Horizontal Row */}
        <motion.div 
          className="hidden md:grid md:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {statItems.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="text-center"
            >
              <div className="flex justify-center mb-4 opacity-80">
                <stat.icon className="w-8 h-8" />
              </div>
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {inView && (
                  <CountUp
                    end={stat.value}
                    duration={2}
                    separator=","
                    decimals={stat.decimals || 0}
                    prefix={stat.prefix || ""}
                    suffix={stat.suffix || ""}
                  />
                )}
              </div>
              <div className="text-primary-foreground/80 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
