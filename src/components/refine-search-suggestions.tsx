"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, MapPin, Clock } from "lucide-react";

interface RefineSearchSuggestionsProps {
  currentFilters: {
    city?: string;
    sport?: string;
    date?: string;
    time?: string;
  };
}

export function RefineSearchSuggestions({ 
  currentFilters
}: RefineSearchSuggestionsProps) {
  const router = useRouter();
  const suggestions = [
    {
      icon: MapPin,
      text: "Try nearby in Maribor",
      description: "More facilities available",
      action: "maribor"
    },
    {
      icon: Clock,
      text: "Morning availability",
      description: "Better rates and availability",
      action: "morning"
    },
    {
      icon: Sparkles,
      text: "Popular this week",
      description: "Trending facilities",
      action: "popular"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6 border border-teal-200"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-teal-600" />
        <h3 className="font-semibold text-teal-800">Refine Your Search</h3>
      </div>
      
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-teal-100 hover:border-teal-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <suggestion.icon className="h-4 w-4 text-teal-600" />
              <div>
                <p className="font-medium text-gray-900">{suggestion.text}</p>
                <p className="text-sm text-gray-600">{suggestion.description}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Handle navigation based on suggestion
                const url = new URL(window.location.href);
                if (suggestion.action === "maribor") {
                  url.searchParams.set('city', 'Maribor');
                } else if (suggestion.action === "morning") {
                  url.searchParams.set('time', 'morning');
                } else if (suggestion.action === "popular") {
                  // Could add popularity sorting or other logic
                  url.searchParams.set('sort', 'popular');
                }
                router.push(url.toString());
              }}
              className="text-teal-600 border-teal-300 hover:bg-teal-50"
            >
              Try it
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
