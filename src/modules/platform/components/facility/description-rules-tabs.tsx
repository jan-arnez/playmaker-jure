"use client";

import { useState } from "react";
import { Info, ScrollText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { premiumEase } from "@/components/motion";

interface DescriptionRulesTabsProps {
  facilityName: string;
  facilityCity: string;
  description?: string;
  rules?: string[];
}

// Tab content animation variants
const tabContentVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.25,
      ease: premiumEase,
    }
  },
  exit: { 
    opacity: 0, 
    x: 8,
    transition: {
      duration: 0.15,
      ease: "easeIn",
    }
  },
};

export function DescriptionRulesTabs({ 
  facilityName, 
  facilityCity, 
  description,
  rules 
}: DescriptionRulesTabsProps) {
  const t = useTranslations("PlatformModule.facilityDetailPage");
  
  // Determine which tabs are available
  const hasDescription = !!description;
  const hasRules = rules && rules.length > 0;
  
  // If neither is available, don't render the component
  if (!hasDescription && !hasRules) {
    return null;
  }
  
  // Default to description tab, or rules if no description
  const [activeTab, setActiveTab] = useState<"description" | "rules">(
    hasDescription ? "description" : "rules"
  );

  return (
    <motion.div 
      className="w-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: premiumEase }}
    >
      {/* Tab Navigation - only show if both tabs have content */}
      {hasDescription && hasRules && (
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("description")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 text-sm font-medium transition-all relative ${
              activeTab === "description" 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
            }`}
          >
            <Info className="h-4 w-4" />
            {t("aboutFacility")}
            {activeTab === "description" && (
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                layoutId="activeTab"
                transition={{ duration: 0.3 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 text-sm font-medium transition-all relative ${
              activeTab === "rules" 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
            }`}
          >
            <ScrollText className="h-4 w-4" />
            {t("rulesGuidelines")}
            {activeTab === "rules" && (
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                layoutId="activeTab"
                transition={{ duration: 0.3 }}
              />
            )}
          </button>
        </div>
      )}

      {/* Single Tab Header - when only one tab has content */}
      {(hasDescription && !hasRules) && (
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <Info className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">{t("aboutFacility")}</span>
        </div>
      )}
      {(!hasDescription && hasRules) && (
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <ScrollText className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">{t("rulesGuidelines")}</span>
        </div>
      )}

      {/* Tab Content */}
      <div className="p-6 min-h-[160px]">
        <AnimatePresence mode="wait">
          {activeTab === "description" && hasDescription && (
            <motion.div
              key="description"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <p className="text-gray-700 leading-relaxed">
                {description}
              </p>
            </motion.div>
          )}

          {activeTab === "rules" && hasRules && (
            <motion.div
              key="rules"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <ul className="space-y-3">
                {rules.map((rule, index) => (
                  <motion.li 
                    key={index} 
                    className="flex items-start gap-3 text-gray-700"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.3, ease: premiumEase }}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary">{index + 1}</span>
                    </div>
                    <span className="text-sm">{rule}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

