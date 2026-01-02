"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Filter, ChevronDown, RefreshCw } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Reservation {
  id: string;
  facilityName: string;
  sport: string;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  price: number;
  location: string;
  canRebook: boolean;
}

type FilterStatus = "all" | "upcoming" | "completed" | "cancelled";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchReservations();
  }, [page]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/reservations?page=${page}&limit=10`);
      const data = await res.json();
      if (data.reservations) {
        setReservations(prev => page === 1 ? data.reservations : [...prev, ...data.reservations]);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Failed to fetch reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = reservations.filter((r) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return r.status === "confirmed" || r.status === "pending";
    if (filter === "completed") return r.status === "completed";
    if (filter === "cancelled") return r.status === "cancelled";
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "completed":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="My Reservations"
        description="View and manage your bookings"
      />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                <span className="capitalize">{filter === "all" ? "All Bookings" : filter}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setFilter("all")}>
                All Bookings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("upcoming")}>
                Upcoming
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("completed")}>
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("cancelled")}>
                Cancelled
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setPage(1);
              fetchReservations();
            }}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>

        {/* Reservations List */}
        {loading && reservations.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-border/50">
                <div className="flex gap-4">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredReservations.length > 0 ? (
          <div className="space-y-3">
            {filteredReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="group relative flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-transparent hover:border-primary/30 hover:shadow-md transition-all duration-300"
              >
                {/* Icon */}
                <div className="hidden sm:flex h-14 w-14 rounded-xl bg-primary/10 items-center justify-center flex-shrink-0">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                      {reservation.facilityName}
                    </h3>
                    <Badge
                      variant="outline"
                      className={cn("shrink-0 capitalize", getStatusColor(reservation.status))}
                    >
                      {reservation.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(reservation.date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {reservation.time}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {reservation.location}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-medium">
                      €{reservation.price.toFixed(2)}
                    </span>
                    {reservation.canRebook && (
                      <Button variant="ghost" size="sm" className="text-primary">
                        Rebook
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-dashed border-border/50 bg-muted/20">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Calendar className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-medium text-center text-lg mb-1">No reservations found</h3>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
              {filter !== "all"
                ? `You don't have any ${filter} bookings yet.`
                : "You haven't made any bookings yet. Start by exploring available facilities."}
            </p>
            <Button asChild>
              <Link href="/facilities">Browse Facilities</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
