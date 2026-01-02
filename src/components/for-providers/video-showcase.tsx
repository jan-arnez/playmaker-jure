"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PlayCircle, PauseCircle } from "lucide-react";
import { FadeInSection, premiumEase, hoverSpring } from "@/components/motion";

export function VideoShowcase() {
  const t = useTranslations("platform.providers.video");
  const [isPlaying, setIsPlaying] = useState(false);

  // This is a placeholder for where real video files would be loaded
  // In a real scenario, we'd have a <video> tag or an iframe
  
  return (
    <section className="py-16 bg-black text-white overflow-hidden relative">
      {/* Background gradient effects */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background to-transparent opacity-20 z-10"></div>
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/30 blur-[120px] rounded-full"></div>
      <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-600/30 blur-[120px] rounded-full"></div>

      <div className="container mx-auto px-6 relative z-20">
        <FadeInSection className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            {t("title")}
          </h2>
          <p className="text-xl text-white/60">
            {t("subtitle")}
          </p>
        </FadeInSection>

        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: premiumEase }}
            className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl group"
          >
            {!isPlaying ? (
              <motion.div 
                className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/50 backdrop-blur-sm group-hover:bg-neutral-900/40 transition-colors cursor-pointer" 
                onClick={() => setIsPlaying(true)}
                whileHover={{ scale: 1.01 }}
                transition={hoverSpring}
              >
                <motion.div 
                  className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 border border-white/20"
                  whileHover={{ scale: 1.1 }}
                  transition={hoverSpring}
                >
                  <PlayCircle className="w-10 h-10 text-white ml-1" />
                </motion.div>
                <p className="font-medium text-white/80 tracking-wide uppercase text-sm">Watch Demo</p>
              </motion.div>
            ) : (
              <div className="w-full h-full bg-neutral-800 flex items-center justify-center relative">
                {/* Placeholder for actual video element */}
                <p className="text-neutral-500 animate-pulse">Video Player Placeholder</p>
                
                {/* Close/Pause button overlay */}
                <Button 
                   variant="ghost" 
                   size="icon" 
                   className="absolute top-4 right-4 text-white hover:bg-white/20"
                   onClick={() => setIsPlaying(false)}
                >
                   <PauseCircle className="w-8 h-8" />
                </Button>
              </div>
            )}

            {/* Decorative UI Elements inside the "video" frame to make it look like the app */}
            {!isPlaying && (
               <div className="absolute inset-0 -z-10 opacity-40">
                  {/* Fake Dashboard UI */}
                  <div className="h-full w-full bg-neutral-900 p-4 flex gap-4">
                     <div className="w-16 h-full bg-neutral-800 rounded-lg"></div>
                     <div className="flex-1 h-full space-y-4">
                        <div className="h-8 w-1/3 bg-neutral-800 rounded-lg"></div>
                        <div className="grid grid-cols-3 gap-4">
                           <div className="h-32 bg-neutral-800 rounded-lg"></div>
                           <div className="h-32 bg-neutral-800 rounded-lg"></div>
                           <div className="h-32 bg-neutral-800 rounded-lg"></div>
                        </div>
                        <div className="h-64 bg-neutral-800 rounded-lg"></div>
                     </div>
                  </div>
               </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

