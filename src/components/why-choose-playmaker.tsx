"use client";

import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";
import { Clock, Shield, Users, Award } from "lucide-react";

interface StatItem {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  label: string;
}

interface WhyChooseItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

interface WhyChoosePlaymakerProps {
  stats: StatItem[];
}

export function WhyChoosePlaymaker({ stats }: WhyChoosePlaymakerProps) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const whyChooseFeatures: WhyChooseItem[] = [
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
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/15">
      <div className="container mx-auto px-6">
        {/* Why Choose Section */}
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Why Choose Playmaker?
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto font-medium">
            We make finding and booking sports facilities simple, fast, and reliable.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 max-w-7xl mx-auto mb-20">
          {whyChooseFeatures.map((feature, index) => (
            <div 
              key={index} 
              className="text-center p-8 rounded-2xl bg-white/80 border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="w-16 h-16 bg-primary/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                {feature.title}
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="text-center">
          <div ref={ref} className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 max-w-7xl mx-auto">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center p-8 rounded-2xl bg-white/80 border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="text-5xl font-bold text-primary mb-4">
                  {inView && (
                    <CountUp
                      end={stat.value}
                      duration={2.5}
                      separator=","
                      decimals={stat.decimals || 0}
                      prefix={stat.prefix || ""}
                      suffix={stat.suffix || ""}
                    />
                  )}
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
