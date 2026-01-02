"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React, { useState } from "react";
import NumberFlow from "@number-flow/react";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { cn } from "@/lib/utils";
import { ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import { FadeInSection, premiumEase, hoverSpring } from "@/components/motion";

const plans = [
  {
    id: "osnovno",
    nameKey: "plans.osnovno.name",
    price: {
      monthly: 10.0,
      yearly: 8.0,
    },
    descriptionKey: "plans.osnovno.description",
    features: ["feature1", "feature2", "feature3", "feature4", "feature5"],
    cta: "ctaStartNow",
  },
  {
    id: "napredno",
    nameKey: "plans.napredno.name",
    price: {
      monthly: 15.0,
      yearly: 12.0,
    },
    descriptionKey: "plans.napredno.description",
    features: ["includesBasic", "feature1", "feature2", "feature3", "feature4"],
    cta: "ctaSubscribe",
    popular: true,
  },
  {
    id: "napredno-plus",
    nameKey: "plans.naprednoPlus.name",
    price: {
      monthly: 20.0,
      yearly: 16.0,
    },
    descriptionKey: "plans.naprednoPlus.description",
    features: [
      "includesAdvanced",
      "feature1",
      "feature2",
      "feature3",
      "feature4",
    ],
    cta: "ctaContactUs",
  },
];

// Stagger variants for pricing cards
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: premiumEase,
    },
  },
};

export default function PartnersPricing() {
  const t = useTranslations("PartnersPricing");
  const [frequency, setFrequency] = useState<string>("monthly");

  const getPriceDisplay = (planPrice: number | string) => {
    if (typeof planPrice === "number") {
      return (
        <NumberFlow
          className="font-bold text-foreground"
          format={{
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 2,
          }}
          prefix=""
          suffix=""
          value={planPrice}
        />
      );
    }
    return planPrice;
  };

  return (
    <div className="container mx-auto px-6 py-16">
      <FadeInSection className="text-center max-w-3xl mx-auto mb-10">
        <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
          {t("title")}
        </h2>
        <p className="text-xl text-muted-foreground text-balance">
          {t("description")}
        </p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.4, ease: premiumEase }}
          className="mt-8"
        >
          <Tabs defaultValue={frequency} onValueChange={setFrequency} className="w-fit mx-auto">
            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 rounded-full">
              <TabsTrigger value="monthly" className="rounded-full px-8 text-base">
                {t("monthly")}
              </TabsTrigger>
              <TabsTrigger value="yearly" className="rounded-full px-8 text-base relative">
                {t("yearly")}
                <Badge 
                  variant="default" 
                  className="absolute -top-3 -right-3 bg-primary text-[10px] px-2 py-0.5 h-5 shadow-sm"
                >
                  {t("discount20")}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>
      </FadeInSection>

      <motion.div 
        className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            variants={cardVariants}
            whileHover={{ y: -4, scale: plan.popular ? 1.05 : 1.02 }}
            transition={hoverSpring}
            className="h-full"
          >
            <Card
              className={cn(
                "relative h-full flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl border",
                plan.popular 
                  ? "border-primary/50 shadow-lg ring-1 ring-primary/20 bg-card scale-105 z-10" 
                  : "border-border bg-card/50 hover:bg-card"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-primary/60" />
              )}
              
              {plan.popular && (
                <Badge className="absolute top-4 right-4 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                  {t("popular")}
                </Badge>
              )}

              <CardHeader className={cn("pb-8", plan.popular ? "pt-10" : "pt-8")}>
                <CardTitle className="font-bold text-2xl">
                  {t(plan.nameKey as any)}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {t(plan.descriptionKey as any)}
                </CardDescription>
                <div className="mt-6 flex items-baseline gap-1 text-4xl font-bold text-foreground">
                  {getPriceDisplay(
                    plan.price[frequency as keyof typeof plan.price]
                  )}
                  <span className="text-base font-normal text-muted-foreground">
                    {t("perMonth")}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="flex-grow">
                <div className="space-y-4">
                  {plan.features.map((featureKey, idx) => (
                    <div
                      className="flex items-start gap-3 text-sm"
                      key={idx}
                    >
                      <div className={cn(
                        "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                        plan.popular ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </div>
                      <span className="text-foreground/80">
                        {t(`features.${featureKey}` as any)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
              
              <CardFooter className="pt-8 pb-8">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={hoverSpring}
                  className="w-full"
                >
                  <Button
                    className={cn(
                      "w-full h-12 text-base font-medium shadow-sm transition-shadow",
                      plan.popular ? "shadow-primary/20 hover:shadow-primary/40" : ""
                    )}
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                  >
                    {t(plan.cta as any)}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.5, ease: premiumEase }}
        className="text-center mt-16"
      >
        <p className="text-muted-foreground">
          {t("contactUsForOptions")}{" "}
          <a
            href="mailto:support@playmaker.com"
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            support@playmaker.com
          </a>
        </p>
      </motion.div>
    </div>
  );
}
