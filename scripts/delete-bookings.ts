import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function deleteAllBookings() {
  try {
    console.log("🗑️  Deleting all bookings...");
    
    const result = await prisma.booking.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.count} booking(s)`);
  } catch (error) {
    console.error("❌ Error deleting bookings:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllBookings()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

