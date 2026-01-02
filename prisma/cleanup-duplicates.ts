import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function cleanupDuplicateSports() {
  console.log("🧹 Starting duplicate sport categories cleanup...");

  try {
    // Get all facilities with their sport categories
    const facilities = await prisma.facility.findMany({
      include: {
        sportCategories: {
          include: {
            courts: true,
          },
        },
      },
    });

    let totalDuplicatesRemoved = 0;
    let totalCourtsRemoved = 0;

    for (const facility of facilities) {
      // Group sport categories by name
      const sportsByName = new Map<string, typeof facility.sportCategories>();
      
      for (const sportCat of facility.sportCategories) {
        const existing = sportsByName.get(sportCat.name) || [];
        existing.push(sportCat);
        sportsByName.set(sportCat.name, existing);
      }

      // Find and remove duplicates
      for (const [sportName, categories] of sportsByName) {
        if (categories.length > 1) {
          console.log(`\n📍 Facility: ${facility.name}`);
          console.log(`   Found ${categories.length} "${sportName}" categories (duplicate!)`);
          
          // Keep the first one, delete the rest
          const [keep, ...duplicates] = categories;
          console.log(`   ✅ Keeping: ${keep.name} (ID: ${keep.id}) with ${keep.courts.length} courts`);
          
          for (const duplicate of duplicates) {
            console.log(`   🗑️  Deleting duplicate: ${duplicate.name} (ID: ${duplicate.id}) with ${duplicate.courts.length} courts`);
            
            // Delete the duplicate sport category (courts will cascade delete)
            await prisma.sportCategory.delete({
              where: { id: duplicate.id },
            });
            
            totalDuplicatesRemoved++;
            totalCourtsRemoved += duplicate.courts.length;
          }
        }
      }
    }

    console.log("\n✅ Cleanup complete!");
    console.log(`   - Duplicate sport categories removed: ${totalDuplicatesRemoved}`);
    console.log(`   - Courts removed (cascade): ${totalCourtsRemoved}`);

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateSports()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

