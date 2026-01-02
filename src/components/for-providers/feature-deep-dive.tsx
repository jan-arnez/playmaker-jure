"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, CalendarClock, Megaphone, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { premiumEase, hoverSpring } from "@/components/motion";

interface DeepDiveSectionProps {
  id: "analytics" | "seasonal" | "marketing";
  icon: React.ElementType;
  reversed?: boolean;
}

export function FeatureDeepDive() {
  return (
    <div className="space-y-16 py-16">
      <DeepDiveSection id="analytics" icon={BarChart3} />
      <DeepDiveSection id="seasonal" icon={CalendarClock} reversed />
      <DeepDiveSection id="marketing" icon={Megaphone} />
    </div>
  );
}

function DeepDiveSection({ id, icon: Icon, reversed }: DeepDiveSectionProps) {
  const t = useTranslations(`platform.providers.deepDive.${id}`);

  // Placeholder for feature points, assumed to be an array in translation file
  // Since we can't easily get array length from next-intl without knowing it,
  // we'll rely on the translation keys having a consistent structure or manually map known keys.
  // For this implementation, I'll use a fixed set of keys I added to the JSON.
  const points = ["0", "1", "2", "3"]; 

  return (
    <section className="container mx-auto px-6 overflow-hidden">
      <div className={cn(
        "flex flex-col gap-12 items-center",
        reversed ? "lg:flex-row-reverse" : "lg:flex-row"
      )}>
        {/* Content Side */}
        <motion.div 
          initial={{ opacity: 0, x: reversed ? 24 : -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: premiumEase }}
          className="flex-1 space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Icon className="w-4 h-4" />
            <span>{t("subtitle")}</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h2>
          
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t("description")}
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {points.map((point, idx) => (
              <motion.li 
                key={idx} 
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.3, ease: premiumEase }}
              >
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground/80">
                    {t(`points.${idx}`)}
                </span>
              </motion.li>
            ))}
          </ul>

          <motion.div
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            transition={hoverSpring}
          >
            <Button size="lg" className="group">
              {t("cta")}
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Visual Side */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15, ease: premiumEase }}
          className="flex-1 w-full"
        >
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 border shadow-2xl group">
            {/* Placeholder for the feature image/video */}
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
               {/* Interactive Mockup Placeholder */}
               <div className="w-[90%] h-[80%] bg-background/80 backdrop-blur rounded-xl shadow-inner border p-4 relative overflow-hidden">
                  <div className="w-full h-8 bg-muted/50 rounded mb-4 flex items-center px-3 gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-400/50"></div>
                     <div className="w-3 h-3 rounded-full bg-yellow-400/50"></div>
                     <div className="w-3 h-3 rounded-full bg-green-400/50"></div>
                  </div>
                  {/* Mock content depending on ID */}
                  {id === "analytics" && (
                     <div className="space-y-3">
                        <div className="flex gap-3">
                           <div className="flex-1 h-24 bg-primary/5 rounded-lg border border-primary/10"></div>
                           <div className="flex-1 h-24 bg-primary/5 rounded-lg border border-primary/10"></div>
                        </div>
                        <div className="h-32 bg-muted/30 rounded-lg w-full mt-4 relative">
                           <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-primary/20 to-transparent opacity-50"></div>
                           <svg className="w-full h-full absolute bottom-0" preserveAspectRatio="none">
                              <path d="M0,100 Q50,50 100,80 T200,40 T300,90 T400,20 V128 H0 Z" fill="currentColor" className="text-primary/10" />
                              <path d="M0,100 Q50,50 100,80 T200,40 T300,90 T400,20" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
                           </svg>
                        </div>
                     </div>
                  )}
                  {id === "seasonal" && (
                      <div className="grid grid-cols-7 gap-1 h-full">
                          {Array.from({ length: 28 }).map((_, i) => (
                              <div key={i} className={cn(
                                  "rounded-sm text-[10px] flex items-center justify-center",
                                  [3, 10, 17, 24].includes(i) ? "bg-primary text-primary-foreground" : "bg-muted/30"
                              )}>
                                  {[3, 10, 17, 24].includes(i) ? "Booked" : i + 1}
                              </div>
                          ))}
                      </div>
                  )}
                  {id === "marketing" && (
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                          <div className="bg-card shadow-lg p-4 rounded-lg border max-w-[200px] rotate-[-5deg]">
                              <div className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Special Offer</div>
                              <div className="text-2xl font-black">-20%</div>
                              <div className="text-xs text-muted-foreground mt-1">First Booking</div>
                          </div>
                          <div className="bg-card shadow-lg p-4 rounded-lg border max-w-[200px] rotate-[5deg] translate-x-4">
                               <div className="text-xs font-bold text-secondary-foreground uppercase tracking-widest mb-1">Summer Pass</div>
                               <div className="text-2xl font-black">99€</div>
                          </div>
                      </div>
                  )}
               </div>
            </div>
            
            {/* Floating Badge */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl z-0"></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

