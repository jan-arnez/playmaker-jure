import { randomBytes } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma";
import { auth } from "../src/modules/auth/lib/auth";

const prisma = new PrismaClient();

// Generate a random ID similar to Better Auth format
function generateId(): string {
  return randomBytes(16).toString("base64url");
}

// Sample user data with different roles and passwords
const users = [
  // Admins (3 users)
  {
    name: "Admin User 1",
    email: "admin1@example.com",
    password: "admin123",
    role: "admin",
  },
  {
    name: "Admin User 2",
    email: "admin2@example.com",
    password: "admin123",
    role: "admin",
  },
  {
    name: "Admin User 3",
    email: "admin3@example.com",
    password: "admin123",
    role: "admin",
  },

  // Organization owners (5 users)
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

// Sample organizations
const organizations = [
  {
    name: "Ljubljana Sports Center",
    slug: "ljubljana-sports-center",
    logo: null,
  },
  {
    name: "Maribor Athletic Club",
    slug: "maribor-athletic-club",
    logo: null,
  },
  {
    name: "Celje Fitness Hub",
    slug: "celje-fitness-hub",
    logo: null,
  },
  {
    name: "Koper Recreation Center",
    slug: "koper-recreation-center",
    logo: null,
  },
  {
    name: "Kranj Sports Complex",
    slug: "kranj-sports-complex",
    logo: null,
  },
];

// Sample facilities
const facilities = [
  // Ljubljana Sports Center facilities
  {
    name: "Main Basketball Court",
    description:
      "Professional basketball court with wooden flooring and professional lighting",
    address: "Trubarjeva cesta 1",
    city: "Ljubljana",
    phone: "+386 1 234 5678",
    email: "basketball@ljubljana-sports.si",
    sport: "Basketball",
    imageUrl:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop",
    organizationSlug: "ljubljana-sports-center",
  },
  {
    name: "Swimming Pool",
    description:
      "Olympic-size swimming pool with diving boards and spectator area",
    address: "Trubarjeva cesta 1",
    city: "Ljubljana",
    phone: "+386 1 234 5679",
    email: "swimming@ljubljana-sports.si",
    sport: "Swimming",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    organizationSlug: "ljubljana-sports-center",
  },
  {
    name: "Tennis Courts",
    description: "4 outdoor tennis courts with clay surface",
    address: "Trubarjeva cesta 1",
    city: "Ljubljana",
    phone: "+386 1 234 5680",
    email: "tennis@ljubljana-sports.si",
    sport: "Tennis",
    imageUrl:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop",
    organizationSlug: "ljubljana-sports-center",
  },

  // Maribor Athletic Club facilities
  {
    name: "Running Track",
    description: "400m synthetic track with field events area",
    address: "Partizanska cesta 15",
    city: "Maribor",
    phone: "+386 2 345 6789",
    email: "track@maribor-athletic.si",
    sport: "Athletics",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    organizationSlug: "maribor-athletic-club",
  },
  {
    name: "Gymnasium",
    description: "Modern gym with cardio and weight training equipment",
    address: "Partizanska cesta 15",
    city: "Maribor",
    phone: "+386 2 345 6790",
    email: "gym@maribor-athletic.si",
    sport: "Fitness",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    organizationSlug: "maribor-athletic-club",
  },

  // Celje Fitness Hub facilities
  {
    name: "CrossFit Box",
    description: "Full CrossFit facility with all necessary equipment",
    address: "Prešernova ulica 8",
    city: "Celje",
    phone: "+386 3 456 7890",
    email: "crossfit@celje-fitness.si",
    sport: "CrossFit",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    organizationSlug: "celje-fitness-hub",
  },
  {
    name: "Yoga Studio",
    description: "Peaceful yoga studio with natural lighting and mats provided",
    address: "Prešernova ulica 8",
    city: "Celje",
    phone: "+386 3 456 7891",
    email: "yoga@celje-fitness.si",
    sport: "Yoga",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    organizationSlug: "celje-fitness-hub",
  },

  // Koper Recreation Center facilities
  {
    name: "Beach Volleyball Courts",
    description: "2 beach volleyball courts with sand surface",
    address: "Kopališka pot 1",
    city: "Koper",
    phone: "+386 5 567 8901",
    email: "volleyball@koper-recreation.si",
    sport: "Volleyball",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    organizationSlug: "koper-recreation-center",
  },
  {
    name: "Sailing Center",
    description: "Sailing equipment rental and lessons available",
    address: "Kopališka pot 1",
    city: "Koper",
    phone: "+386 5 567 8902",
    email: "sailing@koper-recreation.si",
    sport: "Sailing",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    organizationSlug: "koper-recreation-center",
  },

  // Kranj Sports Complex facilities
  {
    name: "Ice Hockey Rink",
    description: "Professional ice hockey rink with spectator seating",
    address: "Ulica heroja Staneta 1",
    city: "Kranj",
    phone: "+386 4 678 9012",
    email: "hockey@kranj-sports.si",
    sport: "Ice Hockey",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    organizationSlug: "kranj-sports-complex",
  },
  {
    name: "Climbing Wall",
    description: "Indoor climbing wall with various difficulty levels",
    address: "Ulica heroja Staneta 1",
    city: "Kranj",
    phone: "+386 4 678 9013",
    email: "climbing@kranj-sports.si",
    sport: "Climbing",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    organizationSlug: "kranj-sports-complex",
  },
];

async function main() {
  console.log("🌱 Starting seed...");

  try {
    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await prisma.booking.deleteMany({});
    await prisma.facility.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.user.deleteMany({});

    // Create users using Better Auth API
    console.log("👥 Creating users...");
    const createdUsers = [];

    for (const userData of users) {
      try {
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
          createdUsers.push(user);
          console.log(
            `✅ Created ${userData.role}: ${userData.name} (${userData.email})`
          );
        } else {
          console.error(`❌ Failed to create user: ${userData.email}`);
        }
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error);
      }
    }

    // Create organizations
    console.log("🏢 Creating organizations...");
    const createdOrganizations: Array<{
      id: string;
      name: string;
      slug: string | null;
      logo: string | null;
      createdAt: Date;
    }> = [];
    const ownerUsers = createdUsers.filter((u) => u.role === "owner");

    for (let i = 0; i < organizations.length; i++) {
      const orgData = organizations[i];
      const owner = ownerUsers[i % ownerUsers.length];

      const organization = await prisma.organization.create({
        data: {
          id: generateId(),
          name: orgData.name,
          slug: orgData.slug,
          logo: orgData.logo,
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
      console.log(`✅ Created organization: ${orgData.name}`);
    }

    // Create facilities
    console.log("🏟️ Creating facilities...");
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

    for (const facilityData of facilities) {
      const organization = createdOrganizations.find(
        (org) => org.slug === facilityData.organizationSlug
      );
      const owner = ownerUsers.find(() =>
        createdOrganizations.some(
          (org) => org.slug === facilityData.organizationSlug
        )
      );

      if (organization && owner) {
        const facility = await prisma.facility.create({
          data: {
            id: generateId(),
            name: facilityData.name,
            description: facilityData.description,
            address: facilityData.address,
            city: facilityData.city,
            phone: facilityData.phone,
            email: facilityData.email,
            sport: facilityData.sport,
            imageUrl: facilityData.imageUrl,
            organizationId: organization.id,
            createdBy: owner.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        createdFacilities.push(facility);
        console.log(`✅ Created facility: ${facilityData.name}`);
      }
    }

    // Create sample bookings
    console.log("📅 Creating sample bookings...");
    const regularUsers = createdUsers.filter((u) => u.role === "user");
    const bookingStatuses = ["pending", "confirmed", "completed", "cancelled"];

    for (let i = 0; i < 50; i++) {
      const facility =
        createdFacilities[Math.floor(Math.random() * createdFacilities.length)];
      const user =
        regularUsers[Math.floor(Math.random() * regularUsers.length)];
      const status =
        bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)];

      // Generate random dates in the future
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
      startDate.setHours(
        8 + Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 4) * 15,
        0,
        0
      );

      const endDate = new Date(startDate);
      endDate.setHours(
        startDate.getHours() + 1 + Math.floor(Math.random() * 3)
      );

      await prisma.booking.create({
        data: {
          id: generateId(),
          facilityId: facility.id,
          userId: user.id,
          startTime: startDate,
          endTime: endDate,
          status: status,
          notes: Math.random() > 0.7 ? "Special requirements noted" : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    console.log(`🎉 Successfully seeded database!`);
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Organizations: ${createdOrganizations.length}`);
    console.log(`   - Facilities: ${createdFacilities.length}`);
    console.log(`   - Bookings: 50`);
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
