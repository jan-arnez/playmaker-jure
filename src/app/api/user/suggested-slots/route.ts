import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's favorite sports and facilities from booking history
    const userBookings = await prisma.booking.findMany({
      where: {
        userId,
        status: "completed",
      },
      include: {
        facility: {
          select: {
            locationType: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    // Get most frequent sports
    const sportCounts = new Map<string, number>();
    userBookings.forEach(booking => {
      if (booking.facility.sport) {
        sportCounts.set(booking.facility.sport, (sportCounts.get(booking.facility.sport) || 0) + 1);
      }
    });

    const favoriteSports = Array.from(sportCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([sport]) => sport);

    // Get most frequent facilities
    const facilityCounts = new Map<string, { count: number; facility: any }>();
    userBookings.forEach(booking => {
      const facilityId = booking.facilityId;
      if (facilityCounts.has(facilityId)) {
        facilityCounts.get(facilityId)!.count++;
      } else {
        facilityCounts.set(facilityId, {
          count: 1,
          facility: booking.facility,
        });
      }
    });

    const favoriteFacilities = Array.from(facilityCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.facility);

    // Generate suggested slots based on preferences
    const suggestedSlots: any[] = [];
    const now = new Date();
    
    // Get facilities for favorite sports
    const facilities = await prisma.facility.findMany({
      where: {
        sport: {
          in: favoriteSports,
        },
      },
      take: 10,
    });

    // Generate suggestions for next 7 days
    for (let i = 1; i <= 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      // Suggest slots for favorite sports
      favoriteSports.forEach((sport, index) => {
        if (suggestedSlots.length >= 6) return;
        
        const sportFacilities = facilities.filter(f => f.sport === sport);
        
        sportFacilities.slice(0, 2).forEach((facility, facilityIndex) => {
          if (suggestedSlots.length >= 6) return;
          
          // Generate random time slots
          const timeSlots = ["09:00", "14:00", "18:00", "20:00"];
          const randomTime = timeSlots[Math.floor(Math.random() * timeSlots.length)];
          
          suggestedSlots.push({
            id: `suggested-${i}-${index}-${facilityIndex}`,
            facilityName: facility.name,
            sport: facility.sport || "General",
            date: date.toISOString().split('T')[0],
            time: randomTime,
            price: 25 + Math.floor(Math.random() * 15), // Random price between 25-40
            location: `${facility.address}, ${facility.city}`,
            reason: index === 0 ? "Your favorite sport" : 
                   favoriteFacilities.some(f => f.name === facility.name) ? "Your favorite facility" :
                   "Based on your activity",
          });
        });
      });
    }

    // Shuffle and limit to 6 suggestions
    const shuffled = suggestedSlots.sort(() => Math.random() - 0.5).slice(0, 6);

    return NextResponse.json(shuffled);

  } catch (error) {
    console.error("Suggested slots fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
