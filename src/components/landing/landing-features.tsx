"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { 
  Search, 
  Calendar, 
  Zap, 
  MapPin, 
  CreditCard, 
  Clock, 
  Users, 
  Shield 
} from "lucide-react";
import { cn } from "@/lib/utils";

const featureIcons = {
  search: Search,
  calendar: Calendar,
  instant: Zap,
  location: MapPin,
  payment: CreditCard,
  time: Clock,
  community: Users,
  verified: Shield,
};

const features = [
  { key: "search", icon: "search" },
  { key: "booking", icon: "calendar" },
  { key: "instant", icon: "instant" },
  { key: "location", icon: "location" },
  { key: "payment", icon: "payment" },
  { key: "time", icon: "time" },
  { key: "community", icon: "community" },
  { key: "verified", icon: "verified" },
];

export function LandingFeatures() {
  const t = useTranslations("landing.features");

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            {t("title")}
          </h2>
          <p className="text-xl text-muted-foreground text-balance">
            {t("subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = featureIcons[feature.icon as keyof typeof featureIcons];
            return (
              <motion.div
                key={feature.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className={cn(
                  "h-full p-6 md:p-8 rounded-2xl bg-card border transition-all duration-300",
                  "hover:shadow-xl hover:border-primary/20 hover:-translate-y-1"
                )}>
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 md:mb-6 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-foreground">
                    {t(`items.${feature.key}.title`)}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed hidden sm:block">
                    {t(`items.${feature.key}.description`)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

