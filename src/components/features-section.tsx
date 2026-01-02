"use client";

import { Search, Calendar } from "lucide-react";
import { BsFillLightningChargeFill } from "react-icons/bs";

interface FeatureItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export function FeaturesSection() {
  const features: FeatureItem[] = [
    {
      icon: Search,
      title: "Find Sports Facilities",
      description: "Easily search and discover sports facilities near you with our advanced filtering system."
    },
    {
      icon: Calendar,
      title: "Book Online or Enquire",
      description: "Book your preferred facility online instantly or send an enquiry for custom arrangements."
    },
    {
      icon: BsFillLightningChargeFill,
      title: "Play Your Game",
      description: "Enjoy your game at premium facilities with all the amenities you need for the perfect experience."
    }
  ];
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto hidden md:block">
            Simple steps to find and book your perfect sports facility
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="text-center p-8 rounded-2xl bg-white/60 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <feature.icon className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed hidden md:block">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
