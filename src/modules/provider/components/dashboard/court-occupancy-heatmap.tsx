"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  TrendingUp, 
  Filter, 
  ChevronDown,
  X,
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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
  subWeeks,
  isSameDay,
} from "date-fns";

interface CourtOccupancyData {
  courtId: string;
  courtName: string;
  facilityId: string;
  facilityName: string;
  sportCategoryId: string;
  sportCategoryName: string;
  dailyOccupancy: {
    date: string;
    occupancy: number;
    bookings: number;
    revenue: number;
    availableSlots: number;
    totalSlots: number;
  }[];
}

interface SportCategory {
  id: string;
  name: string;
}

interface CourtOccupancyHeatmapProps {
  organizationId: string;
  organizationSlug: string;
  facilities?: Array<{
    id: string;
    name: string;
    sportCategories?: SportCategory[];
  }>;
}

type DateRangeType = "thisWeek" | "lastWeek" | "thisMonth" | "thisYear" | "custom";
type ViewMode = "days" | "hours";

interface HourlyOccupancyData {
  hour: number;
  occupancy: number;
  bookings: number;
  revenue: number;
  availableSlots: number;
  totalSlots: number;
}

interface CourtHourlyData {
  courtId: string;
  courtName: string;
  facilityId: string;
  facilityName: string;
  sportCategoryId: string;
  sportCategoryName: string;
  hourlyOccupancy: HourlyOccupancyData[];
}

export function CourtOccupancyHeatmap({
  organizationId,
  organizationSlug,
  facilities = [],
}: CourtOccupancyHeatmapProps) {
  const router = useRouter();
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>("thisWeek");
  const [viewMode, setViewMode] = useState<ViewMode>("days");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [selectedSportIds, setSelectedSportIds] = useState<string[]>([]);
  const [sportFilterOpen, setSportFilterOpen] = useState(false);
  const [data, setData] = useState<CourtOccupancyData[]>([]);
interface CourtHourlyData {
  courtId: string;
  courtName: string;
  facilityId: string;
  facilityName: string;
  sportCategoryId: string;
  sportCategoryName: string;
  hourlyOccupancy: HourlyOccupancyData[];
}

// ... inside component ...
  const [hourlyData, setHourlyData] = useState<CourtHourlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{ courtId: string; date?: string; hour?: number } | null>(null);

  // Get all sport categories from facilities
  const allSportCategories = useMemo(() => {
    const sports: SportCategory[] = [];
    const seen = new Set<string>();
    
    facilities.forEach(facility => {
      facility.sportCategories?.forEach(sport => {
        if (!seen.has(sport.id)) {
          seen.add(sport.id);
          sports.push(sport);
        }
      });
    });
    
    return sports.sort((a, b) => a.name.localeCompare(b.name));
  }, [facilities]);

  // Calculate date range based on selected type
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (dateRangeType) {
      case "thisWeek":
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case "lastWeek":
        const lastWeekStart = subWeeks(now, 1);
        start = startOfWeek(lastWeekStart, { weekStartsOn: 1 });
        end = endOfWeek(lastWeekStart, { weekStartsOn: 1 });
        break;
      case "thisMonth":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "thisYear":
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          start = customStartDate;
          end = customEndDate;
        } else {
          // Default to this week if custom dates not set
          start = startOfWeek(now, { weekStartsOn: 1 });
          end = endOfWeek(now, { weekStartsOn: 1 });
        }
        break;
      default:
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
    }

    return { start, end };
  }, [dateRangeType, customStartDate, customEndDate]);

  // Generate array of dates in range
  const datesInRange = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  // Fetch occupancy data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          organizationId,
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
          viewMode: viewMode,
        });

        if (selectedSportIds.length > 0) {
          params.set("sportCategoryIds", selectedSportIds.join(","));
        }

        const response = await fetch(`/api/provider/court-occupancy?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch occupancy data");
        }

        const result = await response.json();
        if (viewMode === "hours") {
          setHourlyData(result.courts || []);
          setData([]);
        } else {
          setData(result.courts || []);
          setHourlyData([]);
        }
      } catch (error) {
        console.error("Error fetching occupancy data:", error);
        setData([]);
        setHourlyData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [organizationId, dateRange.start, dateRange.end, selectedSportIds, viewMode]);

  // Filter data by selected sports
  const filteredData = useMemo(() => {
    if (viewMode === "hours") {
      if (selectedSportIds.length === 0) {
        return hourlyData;
      }
      return hourlyData.filter(court => selectedSportIds.includes(court.sportCategoryId));
    } else {
      if (selectedSportIds.length === 0) {
        return data;
      }
      return data.filter(court => selectedSportIds.includes(court.sportCategoryId));
    }
  }, [data, hourlyData, selectedSportIds, viewMode]);

  // Get title based on date range
  const getTitle = () => {
    switch (dateRangeType) {
      case "thisWeek":
        return "Zasedenost ta teden";
      case "lastWeek":
        return "Zasedenost prejšnji teden";
      case "thisMonth":
        return "Zasedenost ta mesec";
      case "thisYear":
        return "Zasedenost to leto";
      case "custom":
        return "Zasedenost (izbrano obdobje)";
      default:
        return "Zasedenost ta teden";
    }
  };

  // Get color based on occupancy
  const getOccupancyColor = (occupancy: number) => {
    if (occupancy === 0) return "bg-gray-50";
    if (occupancy < 25) return "bg-green-100";
    if (occupancy < 50) return "bg-green-200";
    if (occupancy < 75) return "bg-yellow-200";
    if (occupancy < 90) return "bg-orange-200";
    return "bg-red-200";
  };

  // Get border color for intensity
  const getOccupancyBorderColor = (occupancy: number) => {
    if (occupancy === 0) return "border-gray-200";
    if (occupancy < 25) return "border-green-300";
    if (occupancy < 50) return "border-green-400";
    if (occupancy < 75) return "border-yellow-400";
    if (occupancy < 90) return "border-orange-400";
    return "border-red-400";
  };

  // Handle day click - navigate to calendar
  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    router.push(`/provider/${organizationSlug}/calendar?date=${dateStr}`);
  };

  // Toggle sport selection
  const toggleSport = (sportId: string) => {
    setSelectedSportIds(prev => {
      if (prev.includes(sportId)) {
        return prev.filter(id => id !== sportId);
      } else {
        return [...prev, sportId];
      }
    });
  };

  // Clear all sport selections
  const clearSports = () => {
    setSelectedSportIds([]);
  };

  // Get hover data for tooltip
  const hoverData = useMemo(() => {
    if (!hoveredCell) return null;
    
    if (viewMode === "hours") {
      const court = (filteredData as CourtHourlyData[]).find(c => c.courtId === hoveredCell.courtId);
      if (!court || hoveredCell.hour === undefined) return null;

      const hourData = court.hourlyOccupancy?.find(h => h.hour === hoveredCell.hour);
      if (!hourData) return null;

      return {
        courtName: court.courtName,
        facilityName: court.facilityName,
        sportName: court.sportCategoryName,
        time: `${hoveredCell.hour.toString().padStart(2, '0')}:00 - ${(hoveredCell.hour + 1).toString().padStart(2, '0')}:00`,
        occupancy: hourData.occupancy,
        bookings: hourData.bookings,
        revenue: hourData.revenue,
        availableSlots: hourData.availableSlots,
      };
    } else {
      const court = (filteredData as CourtOccupancyData[]).find(c => c.courtId === hoveredCell.courtId);
      if (!court || !hoveredCell.date) return null;

      const dayData = court.dailyOccupancy.find(d => {
        // Handle both date string formats
        const dayDateStr = d.date.includes('T') 
          ? format(new Date(d.date), "yyyy-MM-dd")
          : d.date;
        return dayDateStr === hoveredCell.date;
      });
      if (!dayData) return null;

      return {
        courtName: court.courtName,
        facilityName: court.facilityName,
        sportName: court.sportCategoryName,
        date: format(new Date(hoveredCell.date), "EEEE, MMMM d, yyyy"),
        occupancy: dayData.occupancy,
        bookings: dayData.bookings,
        revenue: dayData.revenue,
        availableSlots: dayData.availableSlots,
      };
    }
  }, [hoveredCell, filteredData, viewMode]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {getTitle()}
            </CardTitle>
            <CardDescription>
              {format(dateRange.start, "MMM d")} - {format(dateRange.end, "MMM d, yyyy")}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="h-9">
                <TabsTrigger value="days" className="text-xs px-3">Days</TabsTrigger>
                <TabsTrigger value="hours" className="text-xs px-3">Hours</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Sport Filter */}
            <Popover open={sportFilterOpen} onOpenChange={setSportFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="h-4 w-4 mr-2" />
                  Sports
                  {selectedSportIds.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedSportIds.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <div className="p-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Filter by Sport</span>
                    {selectedSportIds.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSports}
                        className="h-7 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {allSportCategories.length === 0 ? (
                      <div className="text-sm text-gray-500 p-2">No sports available</div>
                    ) : (
                      allSportCategories.map(sport => (
                        <div
                          key={sport.id}
                          className="flex items-center space-x-2 p-2 hover:bg-accent rounded cursor-pointer"
                          onClick={() => toggleSport(sport.id)}
                        >
                          <Checkbox
                            checked={selectedSportIds.includes(sport.id)}
                            onCheckedChange={() => toggleSport(sport.id)}
                          />
                          <span className="text-sm">{sport.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Date Range Switcher */}
        <Tabs value={dateRangeType} onValueChange={(v) => setDateRangeType(v as DateRangeType)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="thisWeek" className="text-xs">This Week</TabsTrigger>
            <TabsTrigger value="lastWeek" className="text-xs">Last Week</TabsTrigger>
            <TabsTrigger value="thisMonth" className="text-xs">This Month</TabsTrigger>
            <TabsTrigger value="thisYear" className="text-xs">This Year</TabsTrigger>
            <TabsTrigger value="custom" className="text-xs">Custom</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Custom Date Range Picker */}
        {dateRangeType === "custom" && (
          <div className="flex items-center gap-2 mt-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Calendar className="h-4 w-4 mr-2" />
                  {customStartDate ? format(customStartDate, "MMM d") : "Start"}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <CalendarComponent
                  mode="single"
                  selected={customStartDate}
                  onSelect={setCustomStartDate}
                />
              </PopoverContent>
            </Popover>
            <span className="text-sm text-gray-500">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Calendar className="h-4 w-4 mr-2" />
                  {customEndDate ? format(customEndDate, "MMM d") : "End"}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <CalendarComponent
                  mode="single"
                  selected={customEndDate}
                  onSelect={setCustomEndDate}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading occupancy data...</div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <div className="text-gray-500">No courts found</div>
            <div className="text-sm text-gray-400 mt-1">
              {selectedSportIds.length > 0 
                ? "Try adjusting your sport filters"
                : "No courts available for this date range"}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">Occupancy:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded"></div>
                  <span>0%</span>
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <span>Low</span>
                  <div className="w-3 h-3 bg-yellow-200 border border-yellow-400 rounded"></div>
                  <span>Medium</span>
                  <div className="w-3 h-3 bg-red-200 border border-red-400 rounded"></div>
                  <span>High</span>
                </div>
              </div>
            </div>

            {/* Heatmap Table */}
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {viewMode === "hours" ? (
                  <>
                    {/* Header with hours */}
                    <div className="flex border-b">
                      <div className="w-48 flex-shrink-0 p-2 font-medium text-sm text-gray-700 border-r">
                        Court
                      </div>
                      <div className="flex-1 flex">
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                          <div
                            key={hour}
                            className="flex-1 min-w-[60px] p-2 text-center text-xs font-medium text-gray-600 border-r last:border-r-0"
                          >
                            {hour.toString().padStart(2, '0')}:00
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Court rows - hourly view */}
                    <div className="divide-y">
                      {(filteredData as CourtHourlyData[]).map((court) => (
                        <div key={court.courtId} className="flex hover:bg-gray-50 transition-colors">
                          {/* Court name column */}
                          <div className="w-48 flex-shrink-0 p-2 border-r">
                            <div className="text-sm font-medium text-gray-900">
                              {court.courtName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {court.facilityName} • {court.sportCategoryName}
                            </div>
                          </div>

                          {/* Occupancy bars for each hour */}
                          <div className="flex-1 flex relative">
                            {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
                              const hourData = court.hourlyOccupancy?.find(h => h.hour === hour);
                              const occupancy = hourData?.occupancy || 0;
                              const isHovered = hoveredCell?.courtId === court.courtId && hoveredCell?.hour === hour;

                              return (
                                <div
                                  key={hour}
                                  className={cn(
                                    "flex-1 min-w-[60px] p-1 border-r last:border-r-0 cursor-pointer transition-all",
                                    isHovered && "ring-2 ring-blue-500 ring-opacity-50"
                                  )}
                                  onMouseEnter={() => setHoveredCell({ courtId: court.courtId, hour })}
                                  onMouseLeave={() => setHoveredCell(null)}
                                >
                                  <div className="relative h-12 w-full">
                                    {/* Occupancy bar */}
                                    <div
                                      className={cn(
                                        "absolute inset-0 rounded transition-all",
                                        getOccupancyColor(occupancy),
                                        getOccupancyBorderColor(occupancy),
                                        "border-2",
                                        isHovered && "scale-105 shadow-md"
                                      )}
                                      style={{
                                        width: `${Math.min(100, occupancy)}%`,
                                      }}
                                    >
                                      {occupancy > 0 && (
                                        <div className="flex items-center justify-center h-full text-xs font-medium">
                                          {Math.round(occupancy)}%
                                        </div>
                                      )}
                                    </div>
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
                  <>
                    {/* Header with dates */}
                    <div className="flex border-b">
                      <div className="w-48 flex-shrink-0 p-2 font-medium text-sm text-gray-700 border-r">
                        Court
                      </div>
                      <div className="flex-1 flex">
                        {datesInRange.map((date) => (
                          <div
                            key={date.toISOString()}
                            className="flex-1 min-w-[80px] p-2 text-center text-xs font-medium text-gray-600 border-r last:border-r-0"
                          >
                            <div>{format(date, "EEE")}</div>
                            <div className="text-xs text-gray-500">{format(date, "MMM d")}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Court rows - daily view */}
                    <div className="divide-y">
                      {(filteredData as CourtOccupancyData[]).map((court) => (
                        <div key={court.courtId} className="flex hover:bg-gray-50 transition-colors">
                          {/* Court name column */}
                          <div className="w-48 flex-shrink-0 p-2 border-r">
                            <div className="text-sm font-medium text-gray-900">
                              {court.courtName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {court.facilityName} • {court.sportCategoryName}
                            </div>
                          </div>

                          {/* Occupancy bars for each day */}
                          <div className="flex-1 flex relative">
                            {datesInRange.map((date) => {
                              const dateStr = format(date, "yyyy-MM-dd");
                              const dayData = court.dailyOccupancy.find(d => {
                                // Handle both date string formats
                                const dayDateStr = d.date.includes('T') 
                                  ? format(new Date(d.date), "yyyy-MM-dd")
                                  : d.date;
                                return dayDateStr === dateStr;
                              });
                              const occupancy = dayData?.occupancy || 0;
                              const isHovered = hoveredCell?.courtId === court.courtId && hoveredCell?.date === dateStr;

                              return (
                                <div
                                  key={dateStr}
                                  className={cn(
                                    "flex-1 min-w-[80px] p-1 border-r last:border-r-0 cursor-pointer transition-all",
                                    isHovered && "ring-2 ring-blue-500 ring-opacity-50"
                                  )}
                                  onMouseEnter={() => setHoveredCell({ courtId: court.courtId, date: dateStr })}
                                  onMouseLeave={() => setHoveredCell(null)}
                                  onClick={() => handleDayClick(date)}
                                >
                                  <div className="relative h-12 w-full">
                                    {/* Occupancy bar */}
                                    <div
                                      className={cn(
                                        "absolute inset-0 rounded transition-all",
                                        getOccupancyColor(occupancy),
                                        getOccupancyBorderColor(occupancy),
                                        "border-2",
                                        isHovered && "scale-105 shadow-md"
                                      )}
                                      style={{
                                        width: `${Math.min(100, occupancy)}%`,
                                      }}
                                    >
                                      {occupancy > 0 && (
                                        <div className="flex items-center justify-center h-full text-xs font-medium">
                                          {Math.round(occupancy)}%
                                        </div>
                                      )}
                                    </div>
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

            {/* Tooltip - positioned relative to mouse */}
            {hoverData && hoveredCell && (
              <div className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none"
                   style={{
                     left: typeof window !== 'undefined' ? `${window.innerWidth / 2}px` : '50%',
                     top: typeof window !== 'undefined' ? `${window.innerHeight / 2}px` : '50%',
                     transform: 'translate(-50%, -100%)',
                     marginTop: '-10px',
                   }}>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{hoverData.courtName}</div>
                  <div className="text-xs text-gray-500 mb-2">
                    {hoverData.facilityName} • {hoverData.sportName}
                  </div>
                  <div className="text-gray-600 space-y-1">
                    {viewMode === "hours" ? (
                      <>
                        <div><strong>Time:</strong> {hoverData.time}</div>
                        <div><strong>Occupancy:</strong> {hoverData.occupancy.toFixed(1)}%</div>
                        <div><strong>Bookings:</strong> {hoverData.bookings}</div>
                        <div><strong>Available Slots:</strong> {hoverData.availableSlots}</div>
                        {hoverData.revenue > 0 && (
                          <div><strong>Revenue:</strong> €{hoverData.revenue.toFixed(2)}</div>
                        )}
                      </>
                    ) : (
                      <>
                        <div><strong>Date:</strong> {hoverData.date}</div>
                        <div><strong>Occupancy:</strong> {hoverData.occupancy.toFixed(1)}%</div>
                        <div><strong>Bookings:</strong> {hoverData.bookings}</div>
                        <div><strong>Available Slots:</strong> {hoverData.availableSlots}</div>
                        {hoverData.revenue > 0 && (
                          <div><strong>Revenue:</strong> €{hoverData.revenue.toFixed(2)}</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

