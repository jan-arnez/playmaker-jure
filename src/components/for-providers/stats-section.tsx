"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Building2, CalendarCheck, TrendingUp, Activity } from "lucide-react";
import { premiumEase } from "@/components/motion";

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

export function StatsSection() {
  const t = useTranslations("platform.providers.stats");

  const stats = [
    {
      id: "facilities",
      value: "100+",
      label: t("facilities"),
      icon: Building2,
    },
    {
      id: "bookings",
      value: "50k+",
      label: t("bookings"),
      icon: CalendarCheck,
    },
    {
      id: "revenue",
      value: "€1M+",
      label: t("revenue"),
      icon: TrendingUp,
    },
    {
      id: "uptime",
      value: "99.9%",
      label: t("uptime"),
      icon: Activity,
    },
  ];

  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-6">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.id}
              variants={itemVariants}
              className="text-center"
            >
              <div className="flex justify-center mb-4 opacity-80">
                <stat.icon className="w-8 h-8" />
              </div>
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {stat.value}
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

