import { randomBytes } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma";
import { auth } from "../src/modules/auth/lib/auth";
import { getRegionFromCity } from "../src/lib/region-mapping";
import { getFacilityImage } from "../src/lib/facility-images";
import slugify from "slugify";

const prisma = new PrismaClient();

// Generate a unique slug from facility name
function generateFacilitySlug(name: string, existingSlugs: string[]): string {
  let baseSlug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
    locale: "sl",
  });

  if (!baseSlug) {
    baseSlug = "facility";
  }

  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

// Generate a random ID similar to Better Auth format
function generateId(): string {
  return randomBytes(16).toString("base64url");
}

// ============================================================================
// DATA GENERATORS - Generate realistic data for facilities and courts
// ============================================================================

// Generate standard working hours
function generateWorkingHours(variant: "standard" | "extended" | "limited" = "standard") {
  const hours = {
    standard: {
      monday: "07:00 - 22:00",
      tuesday: "07:00 - 22:00",
      wednesday: "07:00 - 22:00",
      thursday: "07:00 - 22:00",
      friday: "07:00 - 23:00",
      saturday: "08:00 - 22:00",
      sunday: "08:00 - 20:00",
    },
    extended: {
      monday: "06:00 - 23:00",
      tuesday: "06:00 - 23:00",
      wednesday: "06:00 - 23:00",
      thursday: "06:00 - 23:00",
      friday: "06:00 - 24:00",
      saturday: "07:00 - 24:00",
      sunday: "07:00 - 22:00",
    },
    limited: {
      monday: "09:00 - 21:00",
      tuesday: "09:00 - 21:00",
      wednesday: "09:00 - 21:00",
      thursday: "09:00 - 21:00",
      friday: "09:00 - 22:00",
      saturday: "10:00 - 20:00",
      sunday: "10:00 - 18:00",
    },
  };
  return hours[variant];
}

// Generate Slovenian phone number
function generatePhone(index: number): string {
  const areaCodes = ["1", "2", "3", "4", "5", "7"];
  const areaCode = areaCodes[index % areaCodes.length];
  const num1 = String(100 + (index * 17) % 900).padStart(3, "0");
  const num2 = String(1000 + (index * 31) % 9000).padStart(4, "0");
  return `+386 ${areaCode} ${num1} ${num2}`;
}

// Generate email from facility name
function generateEmail(facilityName: string): string {
  const slug = slugify(facilityName, { lower: true, strict: true }).slice(0, 20);
  return `info@${slug}.si`;
}

// Generate website from facility name
function generateWebsite(facilityName: string): string {
  const slug = slugify(facilityName, { lower: true, strict: true }).slice(0, 25);
  return `https://www.${slug}.si`;
}

// Get random amenities for a facility
function generateAmenities(index: number): string[] {
  const allAmenities = ["parking", "showers", "lockers", "cafe", "lighting", "wifi", "proshop", "restrooms"];
  const count = 3 + (index % 5); // 3-7 amenities
  const shuffled = [...allAmenities].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Generate facility rules
function generateRules(sportType: string): string {
  const baseRules = `• Reservations must be cancelled at least 24 hours in advance
• Appropriate sports attire and footwear required
• No food or drinks on the playing area
• Please arrive 10 minutes before your reservation
• Respect other players and facility staff`;
  
  const sportSpecific: Record<string, string> = {
    tennis: "\n• Non-marking tennis shoes required\n• Tennis balls provided, rackets available for rent",
    padel: "\n• Padel-specific footwear recommended\n• Equipment available for rent",
    badminton: "\n• Non-marking indoor shoes required\n• Shuttlecocks available for purchase",
    volleyball: "\n• Team reservations recommended\n• Knee pads recommended",
    basketball: "\n• Non-marking basketball shoes required",
    swimming: "\n• Swim cap required\n• Shower before entering pool",
    football: "\n• Shin guards required\n• No metal studs on indoor courts",
    squash: "\n• Eye protection recommended\n• Non-marking squash shoes required",
  };

  return baseRules + (sportSpecific[sportType.toLowerCase()] || "");
}

// Get surface type for sport (only: clay, hard, grass, synthetic, wood, sand)
function getSurfaceForSport(sportName: string): string {
  const surfaces: Record<string, string> = {
    tennis: "clay",
    padel: "synthetic",
    badminton: "wood",
    volleyball: "sand",
    basketball: "wood",
    swimming: "synthetic",  // pool deck
    football: "grass",
    squash: "hard",
    "table tennis": "wood",
    "multi-purpose": "synthetic",
  };
  return surfaces[sportName.toLowerCase()] || "synthetic";
}

// Get capacity for sport court
function getCapacityForSport(sportName: string): number {
  const capacities: Record<string, number> = {
    tennis: 4,
    padel: 4,
    badminton: 4,
    volleyball: 12,
    basketball: 10,
    swimming: 6,
    football: 14,
    squash: 2,
    "table tennis": 4,
    "multi-purpose": 20,
  };
  return capacities[sportName.toLowerCase()] || 4;
}

// Generate pricing for a court based on sport
function generateCourtPricing(sportName: string, index: number): object {
  const basePrices: Record<string, number> = {
    tennis: 20,
    padel: 25,
    badminton: 15,
    volleyball: 30,
    basketball: 35,
    swimming: 10,
    football: 50,
    squash: 18,
    "table tennis": 12,
    "multi-purpose": 40,
  };
  const basePrice = basePrices[sportName.toLowerCase()] || 20;
  // Add variation based on index
  const price = basePrice + (index % 10);
  
  return {
    mode: "basic",
    basicPrice: price,
  };
}

// Get time slot for sport (returns single slot wrapped in array for DB compatibility)
// Courts can only have ONE time slot at a time
function getTimeSlotsForSport(sportName: string): string[] {
  const defaultSlots: Record<string, string> = {
    tennis: "60min",
    padel: "60min",
    badminton: "60min",
    volleyball: "60min",
    basketball: "60min",
    swimming: "45min",
    football: "90min",
    squash: "45min",
    "table tennis": "30min",
    "multi-purpose": "60min",
  };
  // Return as single-item array for DB compatibility
  return [defaultSlots[sportName.toLowerCase()] || "60min"];
}

// Generate description for facility
function generateDescription(facilityName: string, city: string, sportCategories: Array<{ name: string }>): string {
  const sports = sportCategories.map(s => s.name).join(", ");
  return `${facilityName} is a premier sports facility located in ${city}, Slovenia. We offer excellent ${sports} facilities with professional-grade courts and equipment. Our facility features modern amenities, professional lighting, and a welcoming atmosphere for players of all skill levels.`;
}

// ============================================================================
// DUMMY DATA - ALL USERS, ORGANIZATIONS, AND FACILITIES ARE FOR TESTING ONLY
// ============================================================================
// This seed file contains dummy/test data. All users, organizations, and
// facilities created by this script are marked as dummy data for testing purposes.
// ============================================================================

// ============================================================================
// TODO: EMAIL VERIFICATION
// ============================================================================
// Currently, users can sign up with any email address without verification.
// BEFORE PRODUCTION, we need to implement:
// 1. Send verification code/link to user's email on signup
// 2. Require email verification before allowing login
// 3. This prevents fake accounts and ensures users own their email addresses
// ============================================================================

// ============================================================================
// PLATFORM ADMIN - Created by seed (not dummy data)
// ============================================================================
// The platform admin is a real account created during seeding.
// This account has full access to the admin dashboard.
// ============================================================================
const platformAdmin = {
  name: "Jure Arnez",
  email: "jurearnez4@gmail.com",
  password: "MILetenice9!2025", // <-- REPLACE THIS WITH YOUR PASSWORD
  role: "admin",
};

// Sample user data with different roles and passwords - ALL DUMMY DATA
const users = [
  // Organization owners (5 users) - DUMMY DATA FOR TESTING
  {
    name: "John Doe",
    email: "john.doe@example.com",
    password: "password123",
    role: "owner",
  },
  {
    name: "Jane Smith",
    email: "jane.smith@example.com",
    password: "password123",
    role: "owner",
  },
  {
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    password: "password123",
    role: "owner",
  },
  {
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    password: "password123",
    role: "owner",
  },
  {
    name: "David Brown",
    email: "david.brown@example.com",
    password: "password123",
    role: "owner",
  },

  // Regular users (10 users)
  {
    name: "Lisa Davis",
    email: "lisa.davis@example.com",
    password: "password123",
    role: "user",
  },
  {
    name: "Tom Miller",
    email: "tom.miller@example.com",
    password: "password123",
    role: "user",
  },
  {
    name: "Emma Garcia",
    email: "emma.garcia@example.com",
    password: "password123",
    role: "user",
  },
  {
    name: "Chris Rodriguez",
    email: "chris.rodriguez@example.com",
    password: "password123",
    role: "user",
  },
  {
    name: "Anna Martinez",
    email: "anna.martinez@example.com",
    password: "password123",
    role: "user",
  },
  {
    name: "James Anderson",
    email: "james.anderson@example.com",
    password: "password123",
    role: "user",
  },
  {
    name: "Maria Taylor",
    email: "maria.taylor@example.com",
    password: "password123",
    role: "user",
  },
  {
    name: "Robert Thomas",
    email: "robert.thomas@example.com",
    password: "password123",
    role: "user",
  },
  {
    name: "Jennifer White",
    email: "jennifer.white@example.com",
    password: "password123",
    role: "user",
  },
  {
    name: "Michael Harris",
    email: "michael.harris@example.com",
    password: "password123",
    role: "user",
  },
];

// Sample organizations - ALL DUMMY DATA FOR TESTING
// First organization is John Doe's test organization with real facility names
const organizations = [
  {
    name: "John Doe Sports",
    slug: "john-doe-sports",
    logo: null,
    ownerEmail: "john.doe@example.com", // Explicitly assign to John Doe
  },
  {
    name: "Dummy Sports Organization 2",
    slug: "dummy-org-2",
    logo: null,
  },
  {
    name: "Dummy Sports Organization 3",
    slug: "dummy-org-3",
    logo: null,
  },
  {
    name: "Dummy Sports Organization 4",
    slug: "dummy-org-4",
    logo: null,
  },
  {
    name: "Dummy Sports Organization 5",
    slug: "dummy-org-5",
    logo: null,
  },
];

// John Doe's facilities - assigned to his organization
// These facilities have complete data including phone and working hours
const johnDoeFacilities = [
  {
    name: "Ludus Beach Park Ljubljana Odbojka",
    address: "Šlandrova ulica 11, 1000 Ljubljana",
    city: "Ljubljana",
    phone: "+386 1 234 5678",
    email: "info@ludusbeach.si",
    workingHours: {
      monday: "07:00 - 22:00",
      tuesday: "07:00 - 22:00",
      wednesday: "07:00 - 22:00",
      thursday: "07:00 - 22:00",
      friday: "07:00 - 23:00",
      saturday: "08:00 - 23:00",
      sunday: "08:00 - 21:00",
    },
    sportCategories: [
      { name: "Volleyball", type: "indoor", courtCount: 4 },
      { name: "Basketball", type: "indoor", courtCount: 1 },
    ],
    organizationSlug: "john-doe-sports",
  },
  {
    name: "Teniški klub Branik Maribor",
    address: "Kajuhova ulica 6a, 2000 Maribor",
    city: "Maribor",
    phone: "+386 2 876 5432",
    email: "info@tkbranik.si",
    workingHours: {
      monday: "06:00 - 22:00",
      tuesday: "06:00 - 22:00",
      wednesday: "06:00 - 22:00",
      thursday: "06:00 - 22:00",
      friday: "06:00 - 23:00",
      saturday: "07:00 - 22:00",
      sunday: "08:00 - 20:00",
    },
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 10 },
      { name: "Padel", type: "outdoor", courtCount: 4 },
      { name: "Squash", type: "indoor", courtCount: 4 },
      { name: "Table Tennis", type: "indoor", courtCount: 6 },
      { name: "Badminton", type: "indoor", courtCount: 4 },
    ],
    organizationSlug: "john-doe-sports",
  },
];

// Note: getRegionFromCity is now imported from @/lib/region-mapping
// This ensures consistent region mapping across the entire application
// All facilities will automatically be assigned to the correct region based on their city

// Sample facilities - ALL 79 FACILITIES ARE DUMMY DATA FOR TESTING
// Format: { name, address, city, sportCategories: [{ name, type, courtCount }], organizationSlug }
// NOTE: imageUrl is generated dynamically based on sport type - no need to include it in the array
// Sport name mapping: Tenis->Tennis, Odbojka->Volleyball, Večnamensko->Multi-purpose, Plavanje->Swimming,
// Košarka->Basketball, Nogomet->Football, Drugo->Other, Namizni tenis->Table Tennis
// NOTE: Removed invalid sports: Running Track, Handball, Group Fitness (not in allowed sports list)
// NOTE: All facilities, addresses, and data in this array are DUMMY DATA for testing purposes only
const facilities = [
  {
    name: "Arena Bonifika",
    address: "Cesta Zore Perello Godina 3, 6000 Koper",
    city: "Koper",
    sportCategories: [
      { name: "Multi-purpose", type: "indoor", courtCount: 8 },
    ],

    organizationSlug: "dummy-org-4",
  },
  {
    name: "AS Litija",
    address: "Valvazorjev trg 1, 1270 Litija",
    city: "Litija",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 7 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "Beach Volley OK Lubnik",
    address: "Poljane 143, 4228 Poljane nad Škofjo Loko",
    city: "Škofja Loka",
    sportCategories: [
      { name: "Volleyball", type: "outdoor", courtCount: 3 },
    ],

    organizationSlug: "dummy-org-5",
  },
  {
    name: "Bela dvorana - tenis",
    address: "Šaleška cesta 3, 3320 Velenje",
    city: "Velenje",
    sportCategories: [
      { name: "Tennis", type: "indoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "Bit center",
    address: "Litostrojska cesta 56, 1000 Ljubljana",
    city: "Ljubljana",
    sportCategories: [
      { name: "Badminton", type: "indoor", courtCount: 12 },
    ],

    organizationSlug: "dummy-org-1",
  },
  // Removed: Brina body&soul - only had "Group Fitness" which is not a valid sport
  {
    name: "Cokan Tennis Academy",
    address: "Parižlje 39, 3311 Šempeter v Savinjski dolini",
    city: "Šempeter v Savinjski dolini",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-3",
  },
  {
    name: "CTA - Parižlje Padel",
    address: "Parižlje 39, 3311 Žalec",
    city: "Žalec",
    sportCategories: [
      { name: "Padel", type: "outdoor", courtCount: 1 },
    ],

    organizationSlug: "dummy-org-3",
  },
  {
    name: "Deskle",
    address: "Srebrničeva ulica 18, 5210 Deskle",
    city: "Deskle",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-3",
  },
  {
    name: "Dvorana AMD Trbovlje",
    address: "Vodenska cesta 50, 1420 Trbovlje",
    city: "Trbovlje",
    sportCategories: [
      { name: "Badminton", type: "indoor", courtCount: 2 },
      { name: "Tennis", type: "indoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-3",
  },
  {
    name: "Dvorana arena Bonifika - klet",
    address: "Cesta Zore Perello Godina 3, 6000 Koper",
    city: "Koper",
    sportCategories: [
      { name: "Multi-purpose", type: "indoor", courtCount: 5 },
    ],

    organizationSlug: "dummy-org-4",
  },
  {
    name: "Dvorana Burja Škofije",
    address: "Spodnje Škofije 40e, 6281 Škofije",
    city: "Škofije",
    sportCategories: [
      { name: "Multi-purpose", type: "indoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-4",
  },
  {
    name: "Dvorana Krim-Namizni tenis",
    address: "Ob dolenjski železnici 50, 1000 Ljubljana",
    city: "Ljubljana",
    sportCategories: [
      { name: "Table Tennis", type: "indoor", courtCount: 7 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "FITPOINT Sostro",
    address: "Sostro 15, 1000 Ljubljana",
    city: "Ljubljana",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
      { name: "Squash", type: "indoor", courtCount: 1 },
      { name: "Other", type: "indoor", courtCount: 1 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "FitPlac",
    address: "Prušnikova ulica 12, 3212 Vojnik",
    city: "Vojnik",
    sportCategories: [
      { name: "Squash", type: "indoor", courtCount: 1 },
    ],

    organizationSlug: "dummy-org-2",
  },
  {
    name: "Gibišport center",
    address: "Avšičeva cesta 70, 1000 Ljubljana",
    city: "Ljubljana",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 5 },
      { name: "Multi-purpose", type: "indoor", courtCount: 3 },
      { name: "Volleyball", type: "indoor", courtCount: 3 },
      { name: "Other", type: "indoor", courtCount: 1 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "Kopališče Kodeljevo-Namizni tenis",
    address: "Ulica Carla Benza 11, 1000 Ljubljana",
    city: "Ljubljana",
    sportCategories: [
      { name: "Table Tennis", type: "indoor", courtCount: 6 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "Nova Gorica",
    address: "Cesta IX. korpusa 3, 5000 Nova Gorica",
    city: "Nova Gorica",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 6 },
    ],

    organizationSlug: "dummy-org-3",
  },
  {
    name: "Olimpijski Bazen Koper",
    address: "Kopališka ulica 5, 6000 Koper",
    city: "Koper",
    sportCategories: [
      { name: "Multi-purpose", type: "indoor", courtCount: 20 },
    ],

    organizationSlug: "dummy-org-4",
  },
  {
    name: "Olimpijski bazen Žusterna",
    address: "Ulica Dušana Žnideršiča 1, 6000 Koper",
    city: "Koper",
    sportCategories: [
      { name: "Swimming", type: "indoor", courtCount: 10 },
    ],

    organizationSlug: "dummy-org-4",
  },
  {
    name: "Padel Šmarje pri Jelšah",
    address: "Kolodvorska ulica 15, 3240 Šmarje pri Jelšah",
    city: "Šmarje pri Jelšah",
    sportCategories: [
      { name: "Padel", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-2",
  },
  {
    name: "Padel Tivoli",
    address: "Celovška cesta 25, 1000 Ljubljana",
    city: "Ljubljana",
    sportCategories: [
      { name: "Padel", type: "outdoor", courtCount: 3 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "Rdeča dvorana - velika dvorana",
    address: "Šaleška cesta 3, 3320 Velenje",
    city: "Velenje",
    sportCategories: [
      { name: "Multi-purpose", type: "indoor", courtCount: 1 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "ŠD LOKROVEC",
    address: "Lokrovec 43a, 3000 Celje",
    city: "Celje",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-2",
  },
  {
    name: "ŠD Partizan Vič",
    address: "Tržaška cesta 76, 1000 Ljubljana",
    city: "Ljubljana",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 5 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "Športna dvorana Tolmin, Zavod KŠM Tolmin",
    address: "Dijaška ulica 12, 5216 Tolmin",
    city: "Tolmin",
    sportCategories: [
      { name: "Multi-purpose", type: "indoor", courtCount: 4 },
    ],

    organizationSlug: "dummy-org-5",
  },
  {
    name: "Športna dvorana Zapolje Logatec",
    address: "IOC Zapolje III/5, 1370 Logatec",
    city: "Logatec",
    sportCategories: [
      { name: "Badminton", type: "indoor", courtCount: 5 },
    ],

    organizationSlug: "dummy-org-2",
  },
  {
    name: "Športni center Fontana",
    address: "Koresova ulica 7, 2000 Maribor",
    city: "Maribor",
    sportCategories: [
      { name: "Volleyball", type: "indoor", courtCount: 3 },
      { name: "Tennis", type: "outdoor", courtCount: 6 },
    ],

    organizationSlug: "dummy-org-2",
  },
  {
    name: "Športni center Protenex",
    address: "Planina 3, 4000 Kranj",
    city: "Kranj",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
      { name: "Volleyball", type: "indoor", courtCount: 3 },
      { name: "Badminton", type: "indoor", courtCount: 4 },
      { name: "Multi-purpose", type: "indoor", courtCount: 1 },
    ],

    organizationSlug: "dummy-org-5",
  },
  {
    name: "Športni park Bonifika",
    address: "Cesta Zore Perello Godina 3, 6000 Koper",
    city: "Koper",
    sportCategories: [
      { name: "Multi-purpose", type: "outdoor", courtCount: 11 },
    ],

    organizationSlug: "dummy-org-4",
  },
  {
    name: "Športni park Dekani",
    address: "Dekani 75k, 6271 Dekani",
    city: "Dekani",
    sportCategories: [
      { name: "Multi-purpose", type: "outdoor", courtCount: 3 },
    ],

    organizationSlug: "dummy-org-4",
  },
  {
    name: "Športni park Postojna",
    address: "Kolodvodvorska cesta 2, 6230 Postojna",
    city: "Postojna",
    sportCategories: [],

    organizationSlug: "dummy-org-4",
  },
  {
    name: "Športni park Rakovlje",
    address: "Rakovlje 15, 3341 Braslovče",
    city: "Braslovče",
    sportCategories: [
      { name: "Volleyball", type: "outdoor", courtCount: 1 },
      { name: "Basketball", type: "outdoor", courtCount: 2 },
      { name: "Football", type: "outdoor", courtCount: 1 },
      { name: "Other", type: "outdoor", courtCount: 1 },
    ],

    organizationSlug: "dummy-org-2",
  },
  {
    name: "Športni park Trebnje",
    address: "Kidričeva cesta 2a, 8210 Trebnje",
    city: "Trebnje",
    sportCategories: [
      { name: "Basketball", type: "outdoor", courtCount: 1 },
      { name: "Volleyball", type: "outdoor", courtCount: 1 },
      { name: "Football", type: "outdoor", courtCount: 1 },
      { name: "Tennis", type: "outdoor", courtCount: 1 },
      { name: "Multi-purpose", type: "outdoor", courtCount: 1 },
    ],

    organizationSlug: "dummy-org-3",
  },
  {
    name: "Športno rekreativni center Otočec",
    address: "Grajska cesta 2, 8222 Otočec",
    city: "Novo mesto",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 9 },
    ],

    organizationSlug: "dummy-org-3",
  },
  {
    name: "ŠRC ŠD Šentvid",
    address: "Bokalova ulica 14, 1000 Ljubljana",
    city: "Ljubljana",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 3 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "Šport Time - TC Ljubljana",
    address: "Litostrojska cesta 40, 1000 Ljubljana",
    city: "Ljubljana",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "TENIS KLUB GAMELDON",
    address: "Gameldonova 2, 1236 Trzin",
    city: "Domžale",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-3",
  },
  {
    name: "TEN-TOP slovenska bistrica",
    address: "Partizanska ulica 26, 2310 Slovenska Bistrica",
    city: "Slovenska Bistrica",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-2",
  },
  {
    name: "Tenis Center Jezernik",
    address: "Mariborska cesta 200, 3000 Celje",
    city: "Celje",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-2",
  },
  {
    name: "Tenis Center Tivoli",
    address: "Celovška cesta 25, 1000 Ljubljana",
    city: "Ljubljana",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 11 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "Tenis Center Zagorje",
    address: "Levstikova ulica 11b, 1410 Zagorje ob Savi",
    city: "Zagorje ob Savi",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-3",
  },
  {
    name: "Tenis Domžale",
    address: "Kopališka cesta 2, 1230 Domžale",
    city: "Domžale",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 11 },
    ],

    organizationSlug: "dummy-org-3",
  },
  {
    name: "Tenis Izlake",
    address: "Izlake 54, 1411 Izlake",
    city: "Izlake",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 3 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "Tenis Portorož - Portorose",
    address: "Obala 2, 6320 Portorož",
    city: "Portorož",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 11 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "Tenis Schweiger",
    address: "Cesta v Zgornji log 32, 1000 Ljubljana",
    city: "Ljubljana",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 3 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "Tenis Target",
    address: "Marinovševa cesta 8a, 1000 Ljubljana",
    city: "Ljubljana",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "Tenis Turnišče",
    address: "Cvetna ulica 1a, 9224 Turnišče",
    city: "Turnišče",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 1 },
    ],

    organizationSlug: "dummy-org-5",
  },
  {
    name: "Tenis center Benč Sport",
    address: "Brnčičeva ulica 31, 1000 Ljubljana",
    city: "Ljubljana",
    sportCategories: [
      { name: "Badminton", type: "indoor", courtCount: 2 },
      { name: "Tennis", type: "outdoor", courtCount: 4 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "Tenis center Bonifika",
    address: "Ulica 15. maja 3, 6000 Koper",
    city: "Koper",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 13 },
    ],

    organizationSlug: "dummy-org-4",
  },
  {
    name: "Tenis center Mare",
    address: "Poženelova ulica 26, 3270 Laško",
    city: "Laško",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 1 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "Tenis klub Bobi",
    address: "Kamnik pod Krimom 18, 1352 Preserje",
    city: "Preserje",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 1 },
    ],

    organizationSlug: "dummy-org-4",
  },
  {
    name: "Tenis klub Ravne",
    address: "Ob Suhi 2a, 2390 Ravne na Koroškem",
    city: "Ravne na Koroškem",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 3 },
    ],

    organizationSlug: "dummy-org-5",
  },
  {
    name: "Tenis klub Vojnik",
    address: "Ulica Stanka Kvedra 7, 3212 Vojnik",
    city: "Vojnik",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-2",
  },
  {
    name: "Tenis klub Zsport",
    address: "Nove Fužine 27, 1000 Ljubljana",
    city: "Ljubljana",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 6 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "Tenis klub Štore",
    address: "Udarniška ulica 10, 3220 Štore",
    city: "Štore",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-2",
  },
  {
    name: "Teniški klub Ajdovščina",
    address: "Cesta IV. prekomorske 61, 5270 Ajdovščina",
    city: "Ajdovščina",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "Teniški klub Celje",
    address: "Partizanska cesta 3a, 3000 Celje",
    city: "Celje",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 4 },
    ],

    organizationSlug: "dummy-org-2",
  },
  {
    name: "Teniški klub Kamšk",
    address: "Novovaška cesta 21, 4226 Žiri",
    city: "Žiri",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-3",
  },
  {
    name: "Teniški klub Kolektor",
    address: "Vodnikova ulica 25, 5280 Idrija",
    city: "Idrija",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 4 },
    ],

    organizationSlug: "dummy-org-5",
  },
  {
    name: "Teniški klub Murska Sobota",
    address: "Ulica ob igrišču 5, 9000 Murska Sobota",
    city: "Murska Sobota",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 8 },
      { name: "Badminton", type: "indoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-3",
  },
  {
    name: "Teniški klub Portovald",
    address: "Portovald 1, 8000 Novo mesto",
    city: "Novo mesto",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 6 },
    ],

    organizationSlug: "dummy-org-3",
  },
  {
    name: "Teniški klub Rival",
    address: "Bratov Babnik 10, 1000 Ljubljana",
    city: "Ljubljana",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "Teniški klub Terme Ptuj",
    address: "Pot v toplice 10, 2250 Ptuj",
    city: "Ptuj",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 8 },
    ],

    organizationSlug: "dummy-org-4",
  },
  {
    name: "Teniški klub Trbovlje",
    address: "Kopališka cesta 2, 1420 Trbovlje",
    city: "Trbovlje",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 4 },
    ],

    organizationSlug: "dummy-org-3",
  },
  {
    name: "Teniški klub Tržič",
    address: "Cesta Kokrškega odreda 17, 4294 Križe",
    city: "Križe",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 4 },
    ],

    organizationSlug: "dummy-org-5",
  },
  {
    name: "TK Ajdovščina",
    address: "Cesta IV. prekomorske 61, 5270 Ajdovščina",
    city: "Ajdovščina",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "TK Kočevje",
    address: "Trg zbora odposlancev 30, 1330 Kočevje",
    city: "Kočevje",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 4 },
    ],

    organizationSlug: "dummy-org-2",
  },
  {
    name: "TK Marija Gradec",
    address: "Marija Gradec 29, 3270 Laško",
    city: "Laško",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-1",
  },
  {
    name: "TK Radovljica",
    address: "Ulica Staneta Žagarja 2b, 4240 Radovljica",
    city: "Radovljica",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-5",
  },
  {
    name: "TK Šentjur",
    address: "Cesta Miloša Zidanška 28, 3230 Šentjur",
    city: "Šentjur",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 4 },
    ],

    organizationSlug: "dummy-org-2",
  },
  {
    name: "TK TİM Ribnica",
    address: "Ob železnici 1, 1310 Ribnica",
    city: "Ribnica",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-5",
  },
  {
    name: "TK Triglav Kranj",
    address: "Planina 3, 4000 Kranj",
    city: "Kranj",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 7 },
    ],

    organizationSlug: "dummy-org-5",
  },
  {
    name: "TC Vanganel",
    address: "Vanganel 22, 6000 Koper",
    city: "Koper",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 5 },
    ],

    organizationSlug: "dummy-org-4",
  },
  {
    name: "Vogu center",
    address: "Savska cesta 34, 4000 Kranj",
    city: "Kranj",
    sportCategories: [
      { name: "Squash", type: "indoor", courtCount: 2 },
      { name: "Tennis", type: "outdoor", courtCount: 3 },
      { name: "Badminton", type: "indoor", courtCount: 3 },
      { name: "Padel", type: "outdoor", courtCount: 2 },
    ],

    organizationSlug: "dummy-org-5",
  },
  {
    name: "Zdravilišče Radenci",
    address: "Zdraviliški trg 9, 9252 Radenci",
    city: "Radenci",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 5 },
    ],

    organizationSlug: "dummy-org-4",
  },
  {
    name: "ZZKG NM",
    address: "Ragovska ulica 12, 8000 Novo mesto",
    city: "Novo mesto",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 7 },
    ],

    organizationSlug: "dummy-org-3",
  },
  {
    name: "ŽTK Maribor",
    address: "Mladinska ulica 29, 2000 Maribor",
    city: "Maribor",
    sportCategories: [
      { name: "Tennis", type: "outdoor", courtCount: 18 },
    ],

    organizationSlug: "dummy-org-2",
  },
];

async function main() {
  console.log("🌱 Starting seed...");
  console.log("⚠️  WARNING: This will create DUMMY DATA for testing purposes only!");
  console.log("⚠️  All users, organizations, and facilities are marked as dummy/test data.");

  try {
    // Clear facilities, organizations, and related data - but KEEP existing users (especially owners)
    // Note: SportCategory and Court will be automatically deleted via CASCADE when facilities are deleted
    console.log("🧹 Clearing facilities and organizations (keeping existing users)...");
    console.log("   - Clearing bookings, waitlists, slot blocks, promotions...");
    await prisma.booking.deleteMany({});
    await prisma.waitlist.deleteMany({});
    await prisma.slotBlock.deleteMany({});
    await prisma.promotionUsage.deleteMany({});
    await prisma.promotion.deleteMany({});
    console.log("   - Clearing facilities (SportCategory and Court will cascade delete)...");
    await prisma.facilityMember.deleteMany({});
    await prisma.facility.deleteMany({});
    console.log("   - Clearing members, invitations, organizations...");
    await prisma.member.deleteMany({});
    await prisma.invitation.deleteMany({});
    await prisma.organization.deleteMany({});
    console.log("✅ Facilities and organizations cleared. Existing users are preserved.");

    // ========================================================================
    // CREATE PLATFORM ADMIN
    // ========================================================================
    console.log("👤 Creating platform admin account...");
    try {
      // Check if admin already exists
      const existingAdmin = await prisma.user.findUnique({
        where: { email: platformAdmin.email },
      });

      if (existingAdmin) {
        console.log(`   ℹ️  Admin ${platformAdmin.email} already exists, skipping creation`);
        // Ensure admin role is set
        if (existingAdmin.role !== "admin") {
          await prisma.user.update({
            where: { id: existingAdmin.id },
            data: { role: "admin" },
          });
          console.log(`   ✅ Updated ${platformAdmin.email} role to admin`);
        }
      } else {
        // Create admin using Better Auth API
        const result = await auth.api.signUpEmail({
          body: {
            email: platformAdmin.email,
            password: platformAdmin.password,
            name: platformAdmin.name,
          },
        });

        if (result.user) {
          // Set admin role
          await prisma.user.update({
            where: { id: result.user.id },
            data: {
              role: "admin",
              emailVerified: true,
              banned: false,
            },
          });
          console.log(`   ✅ Created platform admin: ${platformAdmin.name} (${platformAdmin.email})`);
        }
      }
    } catch (error) {
      console.error("   ❌ Error creating admin:", error);
    }

    // Fetch existing owner users from database (users who previously had facilities)
    console.log("👥 Fetching existing owner users from database...");
    const existingOwnerUsers = await prisma.user.findMany({
      where: {
        role: "owner",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log(`   Found ${existingOwnerUsers.length} existing owner(s) in database`);

    // If we don't have enough owners (need at least 5 for 5 organizations), create dummy ones
    let ownerUsers = existingOwnerUsers;
    if (existingOwnerUsers.length < 5) {
      console.log(`   ⚠️  Only ${existingOwnerUsers.length} owner(s) found. Creating additional dummy owners...`);
      const ownersToCreate = 5 - existingOwnerUsers.length;
      const dummyOwnerData = users.filter(u => u.role === "owner").slice(0, ownersToCreate);
      
      for (const userData of dummyOwnerData) {
        try {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: userData.email },
          });

          if (existingUser) {
            console.log(`   ℹ️  User ${userData.email} already exists, skipping creation`);
            continue;
          }

        // Use Better Auth API to create user with password
        const result = await auth.api.signUpEmail({
          body: {
            email: userData.email,
            password: userData.password,
            name: userData.name,
          },
        });

        if (result.user) {
          // Update the user's role in the database
          const user = await prisma.user.update({
            where: { id: result.user.id },
            data: {
              role: userData.role,
              emailVerified: true,
              banned: false,
            },
          });
            ownerUsers.push(user);
          console.log(
              `   ✅ Created DUMMY owner: ${userData.name} (${userData.email}) - FOR TESTING ONLY`
          );
        }
      } catch (error) {
          console.error(`   ❌ Error creating user ${userData.email}:`, error);
        }
      }
    }

    // Use existing owners (or created ones) for organizations
    console.log(`   Using ${ownerUsers.length} owner(s) for organizations`);

    // Create organizations
    console.log("🏢 Creating DUMMY organizations...");
    const createdOrganizations: Array<{
      id: string;
      name: string;
      slug: string | null;
      logo: string | null;
      createdAt: Date;
    }> = [];

    for (let i = 0; i < organizations.length; i++) {
      const orgData = organizations[i];
      
      // If ownerEmail is specified, find that specific owner; otherwise use round-robin
      let owner;
      if ('ownerEmail' in orgData && orgData.ownerEmail) {
        owner = ownerUsers.find(u => u.email === orgData.ownerEmail);
        if (!owner) {
          console.log(`   ⚠️  Owner ${orgData.ownerEmail} not found, using default`);
          owner = ownerUsers[i % ownerUsers.length];
        }
      } else {
        owner = ownerUsers[i % ownerUsers.length];
      }

      const organization = await prisma.organization.create({
        data: {
          id: generateId(),
          name: orgData.name,
          slug: orgData.slug,
          logo: orgData.logo,
          metadata: JSON.stringify({ isDummy: true, note: "Dummy organization for testing purposes" }),
          createdAt: new Date(),
        },
      });

      // Create member relationship
      await prisma.member.create({
        data: {
          id: generateId(),
          organizationId: organization.id,
          userId: owner.id,
          role: "owner",
          createdAt: new Date(),
        },
      });

      createdOrganizations.push(organization);
      const ownerType = existingOwnerUsers.some(u => u.id === owner.id) ? "EXISTING" : "DUMMY";
      console.log(`✅ Created organization: ${orgData.name} - Owner: ${owner.name} (${ownerType})`);
    }

    // Create a map of organization slug to owner
    const orgToOwnerMap = new Map<string, typeof ownerUsers[0]>();
    for (let i = 0; i < organizations.length; i++) {
      const orgData = organizations[i];
      let owner;
      if ('ownerEmail' in orgData && orgData.ownerEmail) {
        owner = ownerUsers.find(u => u.email === orgData.ownerEmail);
      }
      if (!owner) {
        owner = ownerUsers[i % ownerUsers.length];
      }
      orgToOwnerMap.set(orgData.slug, owner);
    }

    // Create facilities (combine regular facilities with John Doe's specific facilities)
    console.log("🏟️ Creating facilities...");
    const allFacilities = [...johnDoeFacilities, ...facilities];
    const createdFacilities: Array<{
      id: string;
      name: string;
      description: string | null;
      address: string;
      city: string;
      phone: string | null;
      email: string | null;
      organizationId: string;
      createdBy: string;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    // Track existing slugs to ensure uniqueness
    const existingSlugs: string[] = [];

    for (const facilityData of allFacilities) {
      const organization = createdOrganizations.find(
        (org) => org.slug === facilityData.organizationSlug
      );
      const owner = orgToOwnerMap.get(facilityData.organizationSlug);

      if (organization && owner) {
        const facilityIndex = createdFacilities.length;
        const primarySport = facilityData.sportCategories[0]?.name || "Multi-purpose";
        
        // Determine working hours variant based on facility index
        const hoursVariant = facilityIndex % 3 === 0 ? "extended" : facilityIndex % 3 === 1 ? "standard" : "limited";
        
        // Create sport categories with fully configured courts
        let courtIndex = 0;
        const sportCategoriesData = facilityData.sportCategories.map((sportCat) => {
          const courts = [];
          for (let i = 1; i <= sportCat.courtCount; i++) {
            courts.push({
              id: generateId(),
              name: `${sportCat.name} Court ${i}`,
              description: `${sportCat.name} court ${i} - Professional grade facility`,
              isActive: true,
              surface: getSurfaceForSport(sportCat.name),
              capacity: getCapacityForSport(sportCat.name),
              timeSlots: getTimeSlotsForSport(sportCat.name),
              locationType: sportCat.type,
              pricing: generateCourtPricing(sportCat.name, courtIndex),
            });
            courtIndex++;
          }

          return {
            id: generateId(),
            name: sportCat.name,
            description: `${sportCat.name} facility with ${sportCat.courtCount} court(s)`,
            type: sportCat.type,
            courts: courts.length > 0 ? { create: courts } : undefined,
          };
        });

        // Generate slug for facility
        const facilitySlug = generateFacilitySlug(facilityData.name, existingSlugs);
        existingSlugs.push(facilitySlug);

        // Use provided data or generate defaults
        const facilityPhone = 'phone' in facilityData ? (facilityData as any).phone : generatePhone(facilityIndex);
        const facilityEmail = 'email' in facilityData ? (facilityData as any).email : generateEmail(facilityData.name);
        const facilityWorkingHours = 'workingHours' in facilityData 
          ? (facilityData as any).workingHours 
          : generateWorkingHours(hoursVariant as "standard" | "extended" | "limited");

        const facility = await prisma.facility.create({
          data: {
            id: generateId(),
            name: facilityData.name,
            slug: facilitySlug,
            description: generateDescription(facilityData.name, facilityData.city, facilityData.sportCategories),
            address: facilityData.address,
            city: facilityData.city,
            phone: facilityPhone,
            email: facilityEmail,
            website: generateWebsite(facilityData.name),
            workingHours: facilityWorkingHours,
            imageUrl: getFacilityImage(facilityData.sportCategories, facilityIndex),
            // Note: locationType and surface are court-specific, not facility-level
            // A facility can have both indoor and outdoor courts with different surfaces
            facilities: generateAmenities(facilityIndex),
            rules: generateRules(primarySport),
            organizationId: organization.id,
            createdBy: owner.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            sportCategories: {
              create: sportCategoriesData,
            },
          },
        });

        createdFacilities.push(facility);
        const totalCourts = facilityData.sportCategories.reduce(
          (sum, cat) => sum + cat.courtCount,
          0
        );
        const ownerType = existingOwnerUsers.some(u => u.id === owner.id) ? "EXISTING" : "DUMMY";
        console.log(
          `✅ Created facility: ${facilityData.name} (${facilityData.sportCategories.length} sports, ${totalCourts} courts, ${(facilityWorkingHours as any).monday}) - Owner: ${owner.name} (${ownerType})`
        );
      }
    }

    // ========================================================================
    // CREATE SAMPLE BOOKINGS
    // ========================================================================
    console.log("📅 Creating sample bookings...");
    
    // Get some courts for bookings
    const allCourts = await prisma.court.findMany({
      take: 10,
      include: {
        sportCategory: {
          include: {
            facility: true,
          },
        },
      },
    });
    
    // Get regular users (not owners) for bookings
    const regularUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: "user" },
          { role: null },
        ],
      },
      take: 5,
    });
    
    if (allCourts.length > 0 && regularUsers.length > 0) {
      const now = new Date();
      const bookingsToCreate = [];
      
      // Create past bookings (7-14 days ago)
      for (let i = 0; i < 15; i++) {
        const court = allCourts[i % allCourts.length];
        const user = regularUsers[i % regularUsers.length];
        const daysAgo = 7 + (i % 7);
        const hour = 9 + (i % 10);
        
        const startTime = new Date(now);
        startTime.setDate(startTime.getDate() - daysAgo);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(hour + 1);
        
        bookingsToCreate.push({
          id: generateId(),
          facilityId: court.sportCategory.facilityId,
          courtId: court.id,
          userId: user.id,
          startTime,
          endTime,
          status: "confirmed",
          notes: `Booking ${i + 1} - Completed`,
          createdAt: new Date(startTime.getTime() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(startTime.getTime() - 2 * 24 * 60 * 60 * 1000),
        });
      }
      
      // Create upcoming bookings (1-7 days from now)
      for (let i = 0; i < 10; i++) {
        const court = allCourts[i % allCourts.length];
        const user = regularUsers[i % regularUsers.length];
        const daysAhead = 1 + (i % 7);
        const hour = 10 + (i % 8);
        
        const startTime = new Date(now);
        startTime.setDate(startTime.getDate() + daysAhead);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(hour + 1);
        
        bookingsToCreate.push({
          id: generateId(),
          facilityId: court.sportCategory.facilityId,
          courtId: court.id,
          userId: user.id,
          startTime,
          endTime,
          status: i % 5 === 0 ? "pending" : "confirmed",
          notes: `Upcoming booking ${i + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      for (const booking of bookingsToCreate) {
        await prisma.booking.create({ data: booking });
      }
      console.log(`   ✅ Created ${bookingsToCreate.length} sample bookings`);
    }

    // ========================================================================
    // CREATE SAMPLE PROMOTIONS
    // ========================================================================
    console.log("🎁 Creating sample promotions...");
    
    const firstOrg = createdOrganizations[0];
    const firstOwner = orgToOwnerMap.get(firstOrg?.slug || "");
    
    if (firstOrg && firstOwner) {
      const promotions = [
        {
          id: generateId(),
          name: "WELCOME10",
          description: "10% off your first booking! Welcome to our platform.",
          discountType: "percentage",
          discountValue: 10,
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          status: "active",
          maxUsage: 100,
          maxUsagePerUser: 1,
          firstTimeCustomerOnly: true,
          organizationId: firstOrg.id,
          createdBy: firstOwner.id,
        },
        {
          id: generateId(),
          name: "EARLYBIRD",
          description: "15% off for morning bookings (7-10 AM)",
          discountType: "percentage",
          discountValue: 15,
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          status: "active",
          maxUsage: 50,
          maxUsagePerUser: 5,
          timeRestrictions: {
            timeRange: { start: "07:00", end: "10:00" },
          },
          organizationId: firstOrg.id,
          createdBy: firstOwner.id,
        },
        {
          id: generateId(),
          name: "WEEKEND20",
          description: "20% off weekend bookings",
          discountType: "percentage",
          discountValue: 20,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          status: "active",
          maxUsage: 30,
          maxUsagePerUser: 2,
          timeRestrictions: {
            daysOfWeek: [0, 6], // Sunday, Saturday
          },
          organizationId: firstOrg.id,
          createdBy: firstOwner.id,
        },
      ];
      
      for (const promo of promotions) {
        await prisma.promotion.create({ data: promo });
      }
      console.log(`   ✅ Created ${promotions.length} sample promotions: ${promotions.map(p => p.name).join(", ")}`);
    }

    // ========================================================================
    // CREATE SAMPLE SLOT BLOCKS
    // ========================================================================
    console.log("🚫 Creating sample slot blocks...");
    
    if (allCourts.length > 0 && firstOwner) {
      const now = new Date();
      
      // Maintenance block (tomorrow 6-8 AM)
      const maintenanceStart = new Date(now);
      maintenanceStart.setDate(maintenanceStart.getDate() + 1);
      maintenanceStart.setHours(6, 0, 0, 0);
      const maintenanceEnd = new Date(maintenanceStart);
      maintenanceEnd.setHours(8, 0, 0, 0);
      
      await prisma.slotBlock.create({
        data: {
          id: generateId(),
          courtId: allCourts[0].id,
          startTime: maintenanceStart,
          endTime: maintenanceEnd,
          reason: "maintenance",
          notes: "Scheduled court maintenance",
          isRecurring: false,
          createdBy: firstOwner.id,
        },
      });
      
      // Weekly lessons block (next Monday 4-6 PM, recurring)
      const nextMonday = new Date(now);
      nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7));
      nextMonday.setHours(16, 0, 0, 0);
      const lessonsEnd = new Date(nextMonday);
      lessonsEnd.setHours(18, 0, 0, 0);
      
      await prisma.slotBlock.create({
        data: {
          id: generateId(),
          courtId: allCourts[1 % allCourts.length].id,
          startTime: nextMonday,
          endTime: lessonsEnd,
          reason: "lessons",
          notes: "Junior tennis lessons - weekly",
          isRecurring: true,
          recurringType: "weekly",
          dayOfWeek: 1, // Monday
          recurringEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          createdBy: firstOwner.id,
        },
      });
      
      console.log("   ✅ Created 2 sample slot blocks (maintenance + lessons)");
    }

    // ========================================================================
    // CREATE FACILITY MEMBER ASSIGNMENTS
    // ========================================================================
    console.log("👥 Creating facility member assignments...");
    
    // Assign owners to their facilities
    const members = await prisma.member.findMany({
      include: {
        organization: {
          include: {
            facilities: true,
          },
        },
      },
    });
    
    let facilityMemberCount = 0;
    for (const member of members) {
      for (const facility of member.organization.facilities) {
        await prisma.facilityMember.create({
          data: {
            id: generateId(),
            facilityId: facility.id,
            memberId: member.id,
          },
        });
        facilityMemberCount++;
      }
    }
    console.log(`   ✅ Created ${facilityMemberCount} facility member assignments`);

    console.log(`🎉 Successfully seeded database!`);
    console.log(`⚠️  REMINDER: All facilities and organizations are DUMMY/TEST DATA only!`);
    console.log(`📊 Summary:`);
    console.log(`   - Existing Owners Used: ${ownerUsers.length} (${existingOwnerUsers.length} from DB, ${ownerUsers.length - existingOwnerUsers.length} created)`);
    console.log(`   - DUMMY Organizations Created: ${createdOrganizations.length}`);
    console.log(`   - DUMMY Facilities Created: ${createdFacilities.length}`);
    console.log(`   - All existing facilities and organizations were cleared before seeding.`);
    console.log(`   - Existing owners were preserved and assigned to new dummy facilities.`);
    console.log(`   - Only the newly added dummy facilities are now in the database.`);
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

