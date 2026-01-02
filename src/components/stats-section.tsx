"use client";

import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";

interface StatItem {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  label: string;
}

interface StatsSectionProps {
  stats: StatItem[];
}

export function StatsSection({ stats }: StatsSectionProps) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="py-16 bg-gradient-to-r from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Our Impact in Numbers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of sports enthusiasts who trust Playmaker for their facility bookings
          </p>
        </div>
        
        <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="text-center p-6 rounded-2xl bg-white/80 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
            >
              <div className="text-4xl font-bold text-primary mb-2">
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
              <div className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
