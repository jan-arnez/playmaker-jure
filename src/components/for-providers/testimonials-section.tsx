"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from "lucide-react";
import { motion } from "framer-motion";
import { FadeInSection, premiumEase, hoverSpring } from "@/components/motion";

// Stagger variants for testimonial cards
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
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

export function TestimonialsSection() {
  const t = useTranslations("platform.providers.testimonials");

  const testimonials = [
    {
      id: 1,
      text: t("t1.text"),
      author: t("t1.author"),
      role: t("t1.role"),
      initials: "JD",
    },
    {
      id: 2,
      text: t("t2.text"),
      author: t("t2.author"),
      role: t("t2.role"),
      initials: "JS",
    },
    {
      id: 3,
      text: t("t3.text"),
      author: t("t3.author"),
      role: t("t3.role"),
      initials: "MJ",
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-6">
        <FadeInSection className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("title")}</h2>
          <p className="text-xl text-muted-foreground">{t("subtitle")}</p>
        </FadeInSection>

        <motion.div 
          className="grid md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              variants={cardVariants}
              whileHover={{ y: -4 }}
              transition={hoverSpring}
            >
              <Card className="h-full relative overflow-hidden border-none shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="absolute top-4 right-4 text-primary/10">
                  <Quote size={64} />
                </div>
                <CardContent className="pt-8 pb-8">
                  <p className="text-lg text-muted-foreground italic mb-6 relative z-10">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">
                        {testimonial.author}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

