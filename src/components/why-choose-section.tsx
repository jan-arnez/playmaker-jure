"use client";

import { Clock, Shield, Users, Award, MapPin, Star } from "lucide-react";

interface WhyChooseItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export function WhyChooseSection() {
  const features: WhyChooseItem[] = [
    {
      icon: Clock,
      title: "Instant Booking",
      description: "Book your favorite facilities in seconds with our streamlined booking process."
    },
    {
      icon: Shield,
      title: "Verified Facilities",
      description: "All facilities are verified and maintained to the highest standards for your safety."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Join thousands of sports enthusiasts in our growing community."
    },
    {
      icon: Award,
      title: "Premium Quality",
      description: "Access to top-tier facilities with professional-grade equipment and amenities."
    },
    {
      icon: MapPin,
      title: "Nationwide Coverage",
      description: "Find facilities across Slovenia with comprehensive location coverage."
    },
    {
      icon: Star,
      title: "Top Rated",
      description: "Consistently rated 4.8+ stars by our satisfied users and facility partners."
    }
  ];
  return (
    <section className="py-16 bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Playmaker?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We make finding and booking sports facilities simple, fast, and reliable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="text-center p-6 rounded-xl bg-white/60 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
