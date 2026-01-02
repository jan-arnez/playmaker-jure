"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Building2, Dumbbell, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
  eachDayOfInterval,
} from "date-fns";

// Types
interface CourtOccupancyData {
  courtId: string;
  courtName: string;
  facilityId: string;
  facilityName: string;
  sportCategoryId: string;
  sportCategoryName: string;
  dailyOccupancy?: {
    date: string;
    occupancy: number;
    bookings: number;
  }[];
  hourlyOccupancy?: {
    hour: number;
    occupancy: number;
    bookings: number;
  }[];
}

interface AdvancedOccupancyHeatmapProps {
  organizationId: string;
  organizationSlug: string;
  facilities?: Array<{
    id: string;
    name: string;
    sportCategories?: Array<{ id: string; name: string }>;
  }>;
}

type ViewMode = "day" | "week";
type AggregationLevel = "courts" | "sport" | "facility";
type TimePeriod = "thisWeek" | "thisMonth" | "thisYear";

// Working hours (6am - 10pm)
const WORKING_HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6-22

export function AdvancedOccupancyHeatmap({
  organizationId,
  organizationSlug,
  facilities = [],
}: AdvancedOccupancyHeatmapProps) {
  // Inline text (translations not yet added)
  const text = {
    title: "Advanced Occupancy Heatmap",
    dayView: "Day View",
    weekView: "Week View",
    byCourts: "By Courts",
    bySport: "By Sport",
    byFacility: "By Facility",
    thisWeek: "This Week",
    thisMonth: "This Month",
    thisYear: "This Year",
    legend: "Occupancy",
    loading: "Loading occupancy data...",
    noData: "No courts found",
    court: "Court",
    sport: "Sport",
    facility: "Facility",
    occupancy: "Occupancy",
    bookings: "Bookings",
  };

  // State
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [aggregation, setAggregation] = useState<AggregationLevel>("courts");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("thisWeek");
  const [data, setData] = useState<CourtOccupancyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{
    row: string;
    col: string | number;
    occupancy: number;
    bookings: number;
  } | null>(null);

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (timePeriod) {
      case "thisWeek":
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case "thisMonth":
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
      case "thisYear":
        return {
          start: startOfYear(now),
          end: endOfYear(now),
        };
    }
  }, [timePeriod]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          organizationId,
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
          viewMode: viewMode === "day" ? "hours" : "days",
        });

        const response = await fetch(`/api/provider/court-occupancy?${params}`);
        if (!response.ok) throw new Error("Failed to fetch");

        const result = await response.json();
        setData(result.courts || []);
      } catch (error) {
        console.error("Error fetching occupancy data:", error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [organizationId, dateRange, viewMode]);

  // Aggregate data based on level
  const aggregatedData = useMemo(() => {
    if (aggregation === "courts") {
      return data.map((court) => ({
        id: court.courtId,
        name: court.courtName,
        subLabel: `${court.facilityName} • ${court.sportCategoryName}`,
        hourlyOccupancy: court.hourlyOccupancy,
        dailyOccupancy: court.dailyOccupancy,
      }));
    }

    if (aggregation === "sport") {
      // Group by sport category
      const sportMap = new Map<
        string,
        {
          id: string;
          name: string;
          courts: CourtOccupancyData[];
        }
      >();

      data.forEach((court) => {
        const key = court.sportCategoryId;
        if (!sportMap.has(key)) {
          sportMap.set(key, {
            id: key,
            name: court.sportCategoryName,
            courts: [],
          });
        }
        sportMap.get(key)!.courts.push(court);
      });

      return Array.from(sportMap.values()).map((sport) => {
        // Average hourly/daily occupancy across all courts
        const hourlyOccupancy = WORKING_HOURS.map((hour) => {
          const values = sport.courts
            .map((c) => c.hourlyOccupancy?.find((h) => h.hour === hour))
            .filter(Boolean);
          const avgOccupancy =
            values.length > 0
              ? values.reduce((sum, v) => sum + (v?.occupancy || 0), 0) /
                values.length
              : 0;
          const totalBookings = values.reduce(
            (sum, v) => sum + (v?.bookings || 0),
            0
          );
          return { hour, occupancy: avgOccupancy, bookings: totalBookings };
        });

        // For daily, we need to aggregate across all days
        const allDates = new Set<string>();
        sport.courts.forEach((c) =>
          c.dailyOccupancy?.forEach((d) => allDates.add(d.date))
        );
        const dailyOccupancy = Array.from(allDates)
          .sort()
          .map((date) => {
            const values = sport.courts
              .map((c) => c.dailyOccupancy?.find((d) => d.date === date))
              .filter(Boolean);
            const avgOccupancy =
              values.length > 0
                ? values.reduce((sum, v) => sum + (v?.occupancy || 0), 0) /
                  values.length
                : 0;
            const totalBookings = values.reduce(
              (sum, v) => sum + (v?.bookings || 0),
              0
            );
            return { date, occupancy: avgOccupancy, bookings: totalBookings };
          });

        return {
          id: sport.id,
          name: sport.name,
          subLabel: `${sport.courts.length} courts`,
          hourlyOccupancy,
          dailyOccupancy,
        };
      });
    }

    // Facility level
    const facilityMap = new Map<
      string,
      {
        id: string;
        name: string;
        courts: CourtOccupancyData[];
      }
    >();

    data.forEach((court) => {
      const key = court.facilityId;
      if (!facilityMap.has(key)) {
        facilityMap.set(key, {
          id: key,
          name: court.facilityName,
          courts: [],
        });
      }
      facilityMap.get(key)!.courts.push(court);
    });

    return Array.from(facilityMap.values()).map((facility) => {
      const hourlyOccupancy = WORKING_HOURS.map((hour) => {
        const values = facility.courts
          .map((c) => c.hourlyOccupancy?.find((h) => h.hour === hour))
          .filter(Boolean);
        const avgOccupancy =
          values.length > 0
            ? values.reduce((sum, v) => sum + (v?.occupancy || 0), 0) /
              values.length
            : 0;
        const totalBookings = values.reduce(
          (sum, v) => sum + (v?.bookings || 0),
          0
        );
        return { hour, occupancy: avgOccupancy, bookings: totalBookings };
      });

      const allDates = new Set<string>();
      facility.courts.forEach((c) =>
        c.dailyOccupancy?.forEach((d) => allDates.add(d.date))
      );
      const dailyOccupancy = Array.from(allDates)
        .sort()
        .map((date) => {
          const values = facility.courts
            .map((c) => c.dailyOccupancy?.find((d) => d.date === date))
            .filter(Boolean);
          const avgOccupancy =
            values.length > 0
              ? values.reduce((sum, v) => sum + (v?.occupancy || 0), 0) /
                values.length
              : 0;
          const totalBookings = values.reduce(
            (sum, v) => sum + (v?.bookings || 0),
            0
          );
          return { date, occupancy: avgOccupancy, bookings: totalBookings };
        });

      return {
        id: facility.id,
        name: facility.name,
        subLabel: `${facility.courts.length} courts`,
        hourlyOccupancy,
        dailyOccupancy,
      };
    });
  }, [data, aggregation]);

  // Color helper
  const getOccupancyColor = (pct: number) => {
    if (pct === 0) return "bg-gray-100 text-gray-400";
    if (pct < 25) return "bg-emerald-100 text-emerald-700";
    if (pct < 50) return "bg-emerald-200 text-emerald-800";
    if (pct < 75) return "bg-emerald-300 text-emerald-900";
    if (pct < 90) return "bg-emerald-400 text-white";
    return "bg-emerald-600 text-white";
  };

  // Days of week for week view header
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {text.title}
            </CardTitle>
            <CardDescription>
              {format(dateRange.start, "MMM d")} -{" "}
              {format(dateRange.end, "MMM d, yyyy")}
            </CardDescription>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as ViewMode)}
            >
              <TabsList className="h-9">
                <TabsTrigger value="day" className="text-xs px-3">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  {text.dayView}
                </TabsTrigger>
                <TabsTrigger value="week" className="text-xs px-3">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  {text.weekView}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Aggregation Level */}
            <Select
              value={aggregation}
              onValueChange={(v) => setAggregation(v as AggregationLevel)}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="courts">
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="h-3.5 w-3.5" />
                    {text.byCourts}
                  </div>
                </SelectItem>
                <SelectItem value="sport">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-3.5 w-3.5" />
                    {text.bySport}
                  </div>
                </SelectItem>
                <SelectItem value="facility">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    {text.byFacility}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Time Period */}
            <Select
              value={timePeriod}
              onValueChange={(v) => setTimePeriod(v as TimePeriod)}
            >
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisWeek">{text.thisWeek}</SelectItem>
                <SelectItem value="thisMonth">{text.thisMonth}</SelectItem>
                <SelectItem value="thisYear">{text.thisYear}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs mt-4 flex-wrap">
          <span className="text-gray-600">{text.legend}:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-100 rounded border" />
            <span>0%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-emerald-100 rounded" />
            <span>1-24%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-emerald-200 rounded" />
            <span>25-49%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-emerald-300 rounded" />
            <span>50-74%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-emerald-400 rounded" />
            <span>75-89%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-emerald-600 rounded" />
            <span>90-100%</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">{text.loading}</div>
          </div>
        ) : aggregatedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <div className="text-gray-500">{text.noData}</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {viewMode === "day" ? (
                // DAY VIEW - Hours on X-axis
                <>
                  {/* Header row with hours */}
                  <div className="flex border-b sticky top-0 bg-white z-10">
                    <div className="w-48 flex-shrink-0 p-2 font-medium text-sm text-gray-700 border-r">
                      {aggregation === "courts"
                        ? text.court
                        : aggregation === "sport"
                        ? text.sport
                        : text.facility}
                    </div>
                    <div className="flex-1 flex">
                      {WORKING_HOURS.map((hour) => (
                        <div
                          key={hour}
                          className="flex-1 min-w-[50px] p-2 text-center text-xs font-medium text-gray-600 border-r last:border-r-0"
                        >
                          {hour.toString().padStart(2, "0")}:00
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Data rows */}
                  <div className="divide-y">
                    {aggregatedData.map((row) => (
                      <div
                        key={row.id}
                        className="flex hover:bg-gray-50 transition-colors"
                      >
                        {/* Row label */}
                        <div className="w-48 flex-shrink-0 p-2 border-r">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {row.name}
                          </div>
                          {row.subLabel && (
                            <div className="text-xs text-gray-500 truncate">
                              {row.subLabel}
                            </div>
                          )}
                        </div>

                        {/* Hour cells */}
                        <div className="flex-1 flex">
                          {WORKING_HOURS.map((hour) => {
                            const cellData = row.hourlyOccupancy?.find(
                              (h) => h.hour === hour
                            );
                            const occupancy = cellData?.occupancy || 0;
                            const bookings = cellData?.bookings || 0;
                            const isHovered =
                              hoveredCell?.row === row.id &&
                              hoveredCell?.col === hour;

                            return (
                              <div
                                key={hour}
                                className={cn(
                                  "flex-1 min-w-[50px] p-1 border-r last:border-r-0 cursor-pointer transition-all",
                                  isHovered && "ring-2 ring-emerald-500"
                                )}
                                onMouseEnter={() =>
                                  setHoveredCell({
                                    row: row.id,
                                    col: hour,
                                    occupancy,
                                    bookings,
                                  })
                                }
                                onMouseLeave={() => setHoveredCell(null)}
                              >
                                <div
                                  className={cn(
                                    "h-10 rounded flex items-center justify-center text-xs font-medium transition-all",
                                    getOccupancyColor(occupancy),
                                    isHovered && "scale-105 shadow-md"
                                  )}
                                >
                                  {occupancy > 0 ? `${Math.round(occupancy)}%` : ""}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                // WEEK VIEW - Days on X-axis
                <>
                  {/* Header row with days */}
                  <div className="flex border-b sticky top-0 bg-white z-10">
                    <div className="w-48 flex-shrink-0 p-2 font-medium text-sm text-gray-700 border-r">
                      {aggregation === "courts"
                        ? text.court
                        : aggregation === "sport"
                        ? text.sport
                        : text.facility}
                    </div>
                    <div className="flex-1 flex">
                      {daysOfWeek.map((day) => (
                        <div
                          key={day}
                          className="flex-1 min-w-[80px] p-2 text-center text-xs font-medium text-gray-600 border-r last:border-r-0"
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Data rows */}
                  <div className="divide-y">
                    {aggregatedData.map((row) => (
                      <div
                        key={row.id}
                        className="flex hover:bg-gray-50 transition-colors"
                      >
                        {/* Row label */}
                        <div className="w-48 flex-shrink-0 p-2 border-r">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {row.name}
                          </div>
                          {row.subLabel && (
                            <div className="text-xs text-gray-500 truncate">
                              {row.subLabel}
                            </div>
                          )}
                        </div>

                        {/* Day cells - aggregate by day of week */}
                        <div className="flex-1 flex">
                          {daysOfWeek.map((day, dayIndex) => {
                            // Find all dates that match this day of week and average
                            const dayData = row.dailyOccupancy?.filter((d) => {
                              const date = new Date(d.date);
                              // getDay returns 0 for Sunday, adjust for Mon=0
                              const adjustedDay =
                                date.getDay() === 0 ? 6 : date.getDay() - 1;
                              return adjustedDay === dayIndex;
                            });

                            const avgOccupancy =
                              dayData && dayData.length > 0
                                ? dayData.reduce((sum, d) => sum + d.occupancy, 0) /
                                  dayData.length
                                : 0;
                            const totalBookings =
                              dayData?.reduce((sum, d) => sum + d.bookings, 0) || 0;

                            const isHovered =
                              hoveredCell?.row === row.id &&
                              hoveredCell?.col === day;

                            return (
                              <div
                                key={day}
                                className={cn(
                                  "flex-1 min-w-[80px] p-1 border-r last:border-r-0 cursor-pointer transition-all",
                                  isHovered && "ring-2 ring-emerald-500"
                                )}
                                onMouseEnter={() =>
                                  setHoveredCell({
                                    row: row.id,
                                    col: day,
                                    occupancy: avgOccupancy,
                                    bookings: totalBookings,
                                  })
                                }
                                onMouseLeave={() => setHoveredCell(null)}
                              >
                                <div
                                  className={cn(
                                    "h-12 rounded flex items-center justify-center text-xs font-medium transition-all",
                                    getOccupancyColor(avgOccupancy),
                                    isHovered && "scale-105 shadow-md"
                                  )}
                                >
                                  {avgOccupancy > 0
                                    ? `${Math.round(avgOccupancy)}%`
                                    : ""}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Hover Tooltip */}
        {hoveredCell && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-gray-600">{text.occupancy}:</span>{" "}
                <span className="font-medium">
                  {Math.round(hoveredCell.occupancy)}%
                </span>
              </div>
              <div>
                <span className="text-gray-600">{text.bookings}:</span>{" "}
                <span className="font-medium">{hoveredCell.bookings}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
