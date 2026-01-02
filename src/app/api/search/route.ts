import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Fuse from "fuse.js";

// Fuse.js configuration for fuzzy matching
// threshold: 0.4 allows for ~1-2 character mistakes
// distance: 100 allows matches even if the pattern is far from the expected location
const FUSE_OPTIONS = {
  threshold: 0.4,
  distance: 100,
  includeScore: true,
  minMatchCharLength: 2,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ facilities: [], cities: [], sports: [] });
    }

    const queryLower = query.toLowerCase();

    // Fetch all facilities for fuzzy matching (limited to reasonable amount)
    const allFacilities = await prisma.facility.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        description: true,
        imageUrl: true,
        sportCategories: {
          select: {
            name: true,
          },
          orderBy: { name: "asc" },
        },
      },
      take: 200, // Limit for performance
      orderBy: { name: "asc" },
    });

    // Get all unique cities
    const allCitiesResult = await prisma.facility.findMany({
      select: { city: true },
      distinct: ["city"],
    });
    const allCities = allCitiesResult.map((c) => c.city);

    // Get all sports
    const allSportsResult = await prisma.sportCategory.findMany({
      select: { name: true },
      distinct: ["name"],
    });
    const allSports = allSportsResult.map((s) => s.name);

    // Prepare facility data for fuzzy search (flatten sports into searchable string)
    const facilitiesForSearch = allFacilities.map((f) => ({
      ...f,
      sportsString: f.sportCategories.map((s) => s.name).join(" "),
    }));

    // Fuzzy search on facilities (search across name, city, description, and sports)
    const facilityFuse = new Fuse(facilitiesForSearch, {
      ...FUSE_OPTIONS,
      keys: [
        { name: "name", weight: 2 },      // Name is most important
        { name: "city", weight: 1.5 },     // City is important
        { name: "sportsString", weight: 1.5 }, // Sports are important
        { name: "description", weight: 0.5 }, // Description is less important
      ],
    });

    const facilityResults = facilityFuse.search(query);
    const matchedFacilities = facilityResults.slice(0, 6).map((result) => result.item);

    // Fuzzy search on cities
    const cityFuse = new Fuse(allCities, { ...FUSE_OPTIONS });
    const cityResults = cityFuse.search(query);
    const matchedCities = cityResults.slice(0, 5).map((result) => result.item);

    // Fuzzy search on sports
    const sportFuse = new Fuse(allSports, { ...FUSE_OPTIONS });
    const sportResults = sportFuse.search(query);
    const matchedSports = sportResults.slice(0, 5).map((result) => result.item);

    return NextResponse.json({
      facilities: matchedFacilities.map((f) => {
        const allSportsNames = f.sportCategories.map((s) => s.name);
        
        // Check if any sport fuzzy-matches the search query - put it first
        const sportFuseLocal = new Fuse(allSportsNames, { threshold: 0.4 });
        const sportMatch = sportFuseLocal.search(queryLower);
        const matchedSport = sportMatch.length > 0 ? sportMatch[0].item : null;
        
        let orderedSports = [...allSportsNames];
        if (matchedSport) {
          const idx = orderedSports.indexOf(matchedSport);
          if (idx > 0) {
            orderedSports.splice(idx, 1);
            orderedSports.unshift(matchedSport);
          }
        }

        return {
          id: f.id,
          name: f.name,
          slug: f.slug,
          city: f.city,
          imageUrl: f.imageUrl,
          sports: orderedSports,
          matchedSport,
        };
      }),
      cities: matchedCities,
      sports: matchedSports,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}

