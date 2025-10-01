import { Calendar, Clock, Mail, User } from "lucide-react";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navigation } from "@/components/layout/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FacilityContextProvider } from "@/context/facility-context";
import { prisma } from "@/lib/prisma";
import { BookingCalendar } from "@/modules/platform/components/booking/booking-calendar";
import { FacilityDetail } from "@/modules/platform/components/facility/facility-detail";

interface FacilityPageProps {
  params: {
    facilitySlug: string;
  };
}

export default async function FacilityPage({ params }: FacilityPageProps) {
  // Find facility by ID (assuming facilitySlug is the facility ID)
  const facility = await prisma.facility.findUnique({
    where: {
      id: params.facilitySlug,
    },
    include: {
      organization: {
        select: {
          name: true,
          slug: true,
          logo: true,
        },
      },
      bookings: {
        where: {
          status: {
            in: ["confirmed", "pending"],
          },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          startTime: "asc",
        },
      },
    },
  });

  if (!facility) {
    notFound();
  }

  // Get upcoming bookings for this facility
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      facilityId: facility.id,
      startTime: {
        gte: new Date(),
      },
      status: {
        in: ["confirmed", "pending"],
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
    take: 10,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <div className="container mx-auto px-6 space-y-8 py-12">
          <FacilityContextProvider facility={facility}>
            <FacilityDetail />
          </FacilityContextProvider>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Booking Calendar */}
            <BookingCalendar
              facilityId={facility.id}
              facilityName={facility.name}
            />

            {/* Upcoming Bookings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex justify-between items-center p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{booking.user.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {booking.user.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {new Date(booking.startTime).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(booking.startTime).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}{" "}
                            -{" "}
                            {new Date(booking.endTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <Badge
                            variant={
                              booking.status === "confirmed"
                                ? "default"
                                : "secondary"
                            }
                            className="mt-1"
                          >
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No upcoming bookings
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
