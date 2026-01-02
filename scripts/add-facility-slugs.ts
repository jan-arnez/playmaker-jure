/**
 * Script to add slugs to existing facilities that don't have them
 * Run with: npx tsx scripts/add-facility-slugs.ts
 */

import { prisma } from "../src/lib/prisma";
import { generateFacilitySlug } from "../src/lib/generate-slug";

async function main() {
  console.log("🔍 Finding facilities without slugs...");

  // Get all facilities without slugs
  const facilitiesWithoutSlugs = await prisma.facility.findMany({
    where: {
      slug: null,
    },
    select: {
      id: true,
      name: true,
    },
  });

  console.log(`📋 Found ${facilitiesWithoutSlugs.length} facilities without slugs`);

  if (facilitiesWithoutSlugs.length === 0) {
    console.log("✅ All facilities already have slugs!");
    return;
  }

  // Get all existing slugs
  const existingSlugs = await prisma.facility.findMany({
    where: { slug: { not: null } },
    select: { slug: true },
  }).then(facilities => facilities.map(f => f.slug!).filter(Boolean));

  console.log(`📝 Generating slugs for ${facilitiesWithoutSlugs.length} facilities...`);

  let updated = 0;
  let errors = 0;

  for (const facility of facilitiesWithoutSlugs) {
    try {
      const slug = generateFacilitySlug(facility.name, existingSlugs);
      existingSlugs.push(slug); // Add to existing slugs to avoid duplicates

      await prisma.facility.update({
        where: { id: facility.id },
        data: { slug },
      });

      updated++;
      console.log(`✅ ${facility.name} -> ${slug}`);
    } catch (error) {
      errors++;
      console.error(`❌ Error updating ${facility.name}:`, error);
    }
  }

  console.log(`\n✨ Done! Updated ${updated} facilities, ${errors} errors`);
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

