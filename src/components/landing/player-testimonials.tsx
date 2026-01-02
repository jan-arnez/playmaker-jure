"use client";

import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { FadeInSection, premiumEase, hoverSpring } from "@/components/motion";

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

export function PlayerTestimonials() {
  const t = useTranslations("landing.testimonials");

  const testimonials = [
    {
      id: 1,
      text: t("t1.text"),
      author: t("t1.author"),
      sport: t("t1.sport"),
      initials: "MK",
      rating: 5,
    },
    {
      id: 2,
      text: t("t2.text"),
      author: t("t2.author"),
      sport: t("t2.sport"),
      initials: "AJ",
      rating: 5,
    },
    {
      id: 3,
      text: t("t3.text"),
      author: t("t3.author"),
      sport: t("t3.sport"),
      initials: "TN",
      rating: 5,
    },
  ];

  return (
    <section className="py-10 bg-muted/30">
      <div className="container mx-auto px-6">
        <FadeInSection 
          className="text-center max-w-2xl mx-auto mb-6"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">
            {t("title")}
          </h2>
          <p className="text-base text-muted-foreground">
            {t("subtitle")}
          </p>
        </FadeInSection>

        {/* Horizontal scrollable on mobile, grid on desktop */}
        <motion.div 
          className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto pb-4 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none max-w-5xl md:mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              variants={itemVariants}
              whileHover={{ y: -3 }}
              transition={hoverSpring}
              className="flex-shrink-0 w-[280px] md:w-auto snap-center"
            >
              <div className="h-full bg-card rounded-xl p-4 border border-border shadow-sm hover:shadow-md transition-shadow relative">
                {/* Quote icon */}
                <Quote className="absolute top-3 right-3 w-6 h-6 text-primary/10" />
                
                {/* Rating */}
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-foreground/80 text-sm leading-relaxed mb-3 line-clamp-3">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Avatar className="h-8 w-8 border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {testimonial.author}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {testimonial.sport}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
