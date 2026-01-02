import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/modules/auth/lib/get-session";
import { logAdminAction } from "@/lib/admin-audit";

// GET: Get all settings or filter by category
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where = category ? { category } : {};

    const settings = await prisma.platformSettings.findMany({
      where,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    // Group settings by category
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {} as Record<string, typeof settings>);

    return NextResponse.json({
      success: true,
      data: { settings, grouped },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT: Update a setting value
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { key, value, label, description, category } = body;

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    // Get old value for audit
    const oldSetting = await prisma.platformSettings.findUnique({
      where: { key },
    });

    // Upsert the setting
    const setting = await prisma.platformSettings.upsert({
      where: { key },
      update: {
        value,
        label,
        description,
        category,
        updatedBy: session.user.id,
      },
      create: {
        key,
        value,
        label,
        description,
        category: category || "general",
        updatedBy: session.user.id,
      },
    });

    // Log the action
    await logAdminAction({
      adminId: session.user.id,
      action: oldSetting ? "settings.update" : "settings.create",
      entityType: "settings",
      entityId: key,
      details: {
        key,
        oldValue: oldSetting?.value,
        newValue: value,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      data: setting,
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 }
    );
  }
}

// POST: Create or update multiple settings at once
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body as {
      settings: Array<{
        key: string;
        value: unknown;
        label?: string;
        description?: string;
        category?: string;
      }>;
    };

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { error: "Settings array is required" },
        { status: 400 }
      );
    }

    // Upsert all settings
    const results = await Promise.all(
      settings.map((s) =>
        prisma.platformSettings.upsert({
          where: { key: s.key },
          update: {
            value: s.value as object,
            label: s.label,
            description: s.description,
            category: s.category,
            updatedBy: session.user.id,
          },
          create: {
            key: s.key,
            value: s.value as object,
            label: s.label,
            description: s.description,
            category: s.category || "general",
            updatedBy: session.user.id,
          },
        })
      )
    );

    // Log the bulk action
    await logAdminAction({
      adminId: session.user.id,
      action: "settings.bulkUpdate",
      entityType: "settings",
      entityId: "bulk",
      details: { keys: settings.map((s) => s.key) },
      request,
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
