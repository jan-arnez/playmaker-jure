"use client";

import { ArrowRight, Users, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-16 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
      <div className="container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Star className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Your Sports Journey?
          </h2>
          
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of sports enthusiasts who have already discovered
            their perfect facilities. Start booking today!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              variant="secondary" 
              className="bg-white text-primary hover:bg-gray-100 transition-all duration-200 hover:scale-105"
              asChild
            >
              <Link href="/facilities" className="flex items-center">
                Browse Facilities
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white bg-white/10 hover:bg-white hover:text-primary transition-all duration-200 hover:scale-105"
              asChild
            >
              <Link href="/signup" className="flex items-center">
                Register Now
                <Users className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
          
        </div>
      </div>
    </section>
  );
}
