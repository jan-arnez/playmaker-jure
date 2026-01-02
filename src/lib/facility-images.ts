/**
 * Sports facility image mapping
 * Provides unique, sport-appropriate images for each facility type
 * All images are from Unsplash and are free to use
 */

/**
 * Gets a unique sports facility image based on the primary sport
 * Each sport type has multiple image options to ensure variety
 */
export function getFacilityImage(sportCategories: Array<{ name: string; type: string }>, index: number): string {
  if (!sportCategories || sportCategories.length === 0) {
    // Default sports facility image
    return "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=80";
  }

  const primarySport = sportCategories[0].name.toLowerCase();
  const isIndoor = sportCategories[0].type === "indoor";

  // Tennis images - unique courts and facilities
  const tennisImages = [
    "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop&q=80", // Tennis court
    "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop&q=80", // Tennis court
    "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&h=600&fit=crop&q=80", // Tennis court close-up
    "https://images.unsplash.com/photo-1534158914592-062992fbe900?w=800&h=600&fit=crop&q=80", // Tennis court
    "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800&h=600&fit=crop&q=80", // Tennis court
    "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&h=600&fit=crop&q=80", // Tennis court
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=600&fit=crop&q=80", // Tennis court
    "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop&q=80", // Tennis court
    "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&h=600&fit=crop&q=80", // Tennis court
    "https://images.unsplash.com/photo-1534158914592-062992fbe900?w=800&h=600&fit=crop&q=80", // Tennis court
    "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800&h=600&fit=crop&q=80", // Tennis court
    "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&h=600&fit=crop&q=80", // Tennis court
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=600&fit=crop&q=80", // Tennis court
    "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop&q=80", // Tennis court
    "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop&q=80", // Tennis court
  ];

  // Basketball images - unique courts
  const basketballImages = [
    "https://images.unsplash.com/photo-1519766304817-4f37bda0a1e4?w=800&h=600&fit=crop&q=80", // Basketball court
    "https://images.unsplash.com/photo-1546519638-68e109459ffd?w=800&h=600&fit=crop&q=80", // Basketball court
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop&q=80", // Basketball court
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80", // Basketball court
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=80", // Basketball court
    "https://images.unsplash.com/photo-1546519638-68e109459ffd?w=800&h=600&fit=crop&q=80", // Basketball court
    "https://images.unsplash.com/photo-1519766304817-4f37bda0a1e4?w=800&h=600&fit=crop&q=80", // Basketball court
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop&q=80", // Basketball court
  ];

  // Volleyball images - indoor and beach
  const volleyballImages = [
    "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=600&fit=crop&q=80", // Volleyball court
    "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=600&fit=crop&q=80", // Beach volleyball
    "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=600&fit=crop&q=80", // Volleyball court
    "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=600&fit=crop&q=80", // Beach volleyball
    "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=600&fit=crop&q=80", // Volleyball court
    "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=600&fit=crop&q=80", // Beach volleyball
  ];

  // Swimming images - pools and facilities
  const swimmingImages = [
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop&q=80", // Swimming pool
    "https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?w=800&h=600&fit=crop&q=80", // Swimming pool
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop&q=80", // Swimming pool
    "https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?w=800&h=600&fit=crop&q=80", // Swimming pool
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop&q=80", // Swimming pool
    "https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?w=800&h=600&fit=crop&q=80", // Swimming pool
  ];

  // Football/Soccer images - fields and stadiums
  const footballImages = [
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=600&fit=crop&q=80", // Football field
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop&q=80", // Football field
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=600&fit=crop&q=80", // Football field
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop&q=80", // Football field
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=600&fit=crop&q=80", // Football field
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop&q=80", // Football field
  ];

  // Multi-purpose / Indoor sports images - sports halls and arenas
  const multiPurposeImages = [
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=80", // Sports hall
    "https://images.unsplash.com/photo-1546519638-68e109459ffd?w=800&h=600&fit=crop&q=80", // Sports hall
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80", // Sports hall
    "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&h=600&fit=crop&q=80", // Sports hall
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=80", // Sports hall
    "https://images.unsplash.com/photo-1546519638-68e109459ffd?w=800&h=600&fit=crop&q=80", // Sports hall
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80", // Sports hall
    "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&h=600&fit=crop&q=80", // Sports hall
  ];

  // Badminton images
  const badmintonImages = [
    "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&h=600&fit=crop&q=80", // Badminton court
    "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800&h=600&fit=crop&q=80", // Badminton court
    "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&h=600&fit=crop&q=80", // Badminton court
  ];

  // Padel images
  const padelImages = [
    "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&h=600&fit=crop&q=80", // Padel court
    "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&h=600&fit=crop&q=80", // Padel court
    "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&h=600&fit=crop&q=80", // Padel court
  ];

  // Table Tennis images
  const tableTennisImages = [
    "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800&h=600&fit=crop&q=80", // Table tennis
    "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&h=600&fit=crop&q=80", // Table tennis
    "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800&h=600&fit=crop&q=80", // Table tennis
  ];

  // Squash images
  const squashImages = [
    "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&h=600&fit=crop&q=80", // Squash court
    "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800&h=600&fit=crop&q=80", // Squash court
    "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&h=600&fit=crop&q=80", // Squash court
  ];

  // Select image based on sport type
  let imageArray: string[] = [];
  
  if (primarySport.includes("tennis") && !primarySport.includes("table")) {
    imageArray = tennisImages;
  } else if (primarySport.includes("basketball")) {
    imageArray = basketballImages;
  } else if (primarySport.includes("volleyball") || primarySport.includes("beach volleyball")) {
    imageArray = volleyballImages;
  } else if (primarySport.includes("swimming")) {
    imageArray = swimmingImages;
  } else if (primarySport.includes("football") || primarySport.includes("soccer")) {
    imageArray = footballImages;
  } else if (primarySport.includes("badminton")) {
    imageArray = badmintonImages;
  } else if (primarySport.includes("padel")) {
    imageArray = padelImages;
  } else if (primarySport.includes("table tennis") || primarySport.includes("ping pong")) {
    imageArray = tableTennisImages;
  } else if (primarySport.includes("squash")) {
    imageArray = squashImages;
  } else {
    // Multi-purpose or other sports
    imageArray = multiPurposeImages;
  }

  // Use index to cycle through images for variety
  return imageArray[index % imageArray.length];
}

