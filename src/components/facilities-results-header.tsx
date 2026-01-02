"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQueryState, parseAsString } from 'nuqs';
import { useTranslations } from "next-intl";
import { ArrowUpDown, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { EnhancedFacilitiesFilters } from "@/components/enhanced-facilities-filters";

interface FacilitiesResultsHeaderProps {
  totalCount: number;
  hasFilters: boolean;
  filtersProps: {
    initialSearch?: string;
    initialCity?: string;
    initialRegion?: string;
    initialSport?: string;
    initialDate?: string;
    initialTime?: string;
    initialLocationType?: string;
    initialSurface?: string;
    initialFacilities?: string[];
    cities: string[];
  };
}

export function FacilitiesResultsHeader({
  totalCount,
  hasFilters,
  filtersProps,
}: FacilitiesResultsHeaderProps) {
  // const router = useRouter(); // nuqs handles this
  // const searchParams = useSearchParams(); // nuqs handles this
  const t = useTranslations("PlatformModule.facilitiesPage");
  const tSort = useTranslations("PlatformModule.facilitiesPage.sort");
  
  const [currentSort, setCurrentSort] = useQueryState("sort", parseAsString.withDefault("relevance"));

  const handleSortChange = (value: string) => {
    setCurrentSort(value);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
    >
      {/* Mobile: Filters + Sort in one row */}
      <div className="flex items-center justify-between w-full lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0">
              <Filter className="mr-2 h-4 w-4" />
              {t("filters")}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-[340px] p-0 overflow-y-auto">
            <div className="pt-6">
              <EnhancedFacilitiesFilters {...filtersProps} />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder={tSort("sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">{tSort("relevance")}</SelectItem>
              <SelectItem value="price-asc">{tSort("priceAsc")}</SelectItem>
              <SelectItem value="price-desc">{tSort("priceDesc")}</SelectItem>
              <SelectItem value="newest">{tSort("newest")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop: Title with count */}
      <h2 className="hidden lg:block text-xl font-semibold">
        {hasFilters
          ? `${t("searchResults")} (${totalCount})`
          : `${t("allFacilities")} (${totalCount})`}
      </h2>

      {/* Desktop: Sort dropdown */}
      <div className="hidden lg:flex items-center gap-2">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={tSort("sortBy")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">{tSort("relevance")}</SelectItem>
            <SelectItem value="price-asc">{tSort("priceAsc")}</SelectItem>
            <SelectItem value="price-desc">{tSort("priceDesc")}</SelectItem>
            <SelectItem value="newest">{tSort("newest")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  );
}

