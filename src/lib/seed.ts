import { db } from "@/lib/db"

export async function seedUserFinancialData(userId: string, transactionClient?: any) {
  const tx = transactionClient || db

  // 1. Create System Cash Account (Concurrency Safe)
  // We use a row-level lock on the User record to serialize concurrent requests,
  // completely eliminating the race condition that causes duplicate Cash accounts.
  const executeCashSeed = async (prismaTx: any) => {
    await prismaTx.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() }
    })
    const existingCash = await prismaTx.account.findFirst({
      where: { userId, type: "CASH" }
    })
    if (!existingCash) {
      await prismaTx.account.create({
        data: {
          userId,
          name: "Cash",
          type: "CASH",
          isSystem: true,
          isActive: true,
          balance: 0,
        }
      })
    }
  }

  if (transactionClient) {
    await executeCashSeed(transactionClient)
  } else {
    await db.$transaction(executeCashSeed)
  }

  // 2. Create Default Categories with Slugs
  const defaultCategories = [
    // FOOD & BEVERAGE
    { name: "Makanan", slug: "food", type: "EXPENSE", icon: "Utensils", color: "orange" },
    { name: "Minuman", slug: "beverage", type: "EXPENSE", icon: "Coffee", color: "orange" },
    { name: "Kopi", slug: "coffee", type: "EXPENSE", icon: "Coffee", color: "amber" },
    { name: "Restoran", slug: "restaurant", type: "EXPENSE", icon: "UtensilsCrossed", color: "orange" },
    { name: "Jajan", slug: "snack", type: "EXPENSE", icon: "Cookie", color: "yellow" },

    // TRANSPORTATION
    { name: "Bensin", slug: "fuel", type: "EXPENSE", icon: "Fuel", color: "slate" },
    { name: "Transportasi Online", slug: "online_transport", type: "EXPENSE", icon: "Car", color: "green" },
    { name: "Parkir", slug: "parking", type: "EXPENSE", icon: "CircleParking", color: "slate" },
    { name: "Tol", slug: "toll", type: "EXPENSE", icon: "Waypoints", color: "slate" },
    { name: "Servis Kendaraan", slug: "vehicle_service", type: "EXPENSE", icon: "Wrench", color: "slate" },

    // SHOPPING
    { name: "Belanja Online", slug: "online_shopping", type: "EXPENSE", icon: "ShoppingCart", color: "indigo" },
    { name: "Fashion", slug: "fashion", type: "EXPENSE", icon: "Shirt", color: "pink" },
    { name: "Elektronik", slug: "electronics", type: "EXPENSE", icon: "Laptop", color: "blue" },
    { name: "Kebutuhan Rumah", slug: "household", type: "EXPENSE", icon: "Home", color: "emerald" },
    { name: "Marketplace", slug: "marketplace", type: "EXPENSE", icon: "Store", color: "indigo" },

    // ENTERTAINMENT
    { name: "Game", slug: "game", type: "EXPENSE", icon: "Gamepad2", color: "purple" },
    { name: "Top Up Game", slug: "game_topup", type: "EXPENSE", icon: "Coins", color: "purple" },
    { name: "Streaming", slug: "streaming", type: "EXPENSE", icon: "PlaySquare", color: "red" },
    { name: "Film", slug: "movie", type: "EXPENSE", icon: "Film", color: "pink" },
    { name: "Hiburan", slug: "entertainment", type: "EXPENSE", icon: "Ticket", color: "pink" },

    // DIGITAL & SUBSCRIPTIONS
    { name: "Pulsa", slug: "phone_credit", type: "EXPENSE", icon: "Smartphone", color: "blue" },
    { name: "Paket Data", slug: "mobile_data", type: "EXPENSE", icon: "Signal", color: "blue" },
    { name: "Internet", slug: "internet", type: "EXPENSE", icon: "Wifi", color: "blue" },
    { name: "Cloud Storage", slug: "cloud_storage", type: "EXPENSE", icon: "Cloud", color: "sky" },
    { name: "Software", slug: "software", type: "EXPENSE", icon: "Code", color: "violet" },
    { name: "Subscription", slug: "subscription", type: "EXPENSE", icon: "RefreshCw", color: "violet" },

    // PERSONAL
    { name: "Rokok", slug: "cigarettes", type: "EXPENSE", icon: "Cigarette", color: "zinc" },
    { name: "Vape", slug: "vape", type: "EXPENSE", icon: "Wind", color: "zinc" },
    { name: "Liquid Vape", slug: "vape_liquid", type: "EXPENSE", icon: "Droplet", color: "zinc" },
    { name: "Cartridge Pod", slug: "pod_cartridge", type: "EXPENSE", icon: "Battery", color: "zinc" },
    { name: "Perawatan Diri", slug: "personal_care", type: "EXPENSE", icon: "Scissors", color: "pink" },

    // LIVING
    { name: "Kos", slug: "rent", type: "EXPENSE", icon: "Home", color: "emerald" },
    { name: "Listrik", slug: "electricity", type: "EXPENSE", icon: "Zap", color: "yellow" },
    { name: "Air", slug: "water", type: "EXPENSE", icon: "Droplet", color: "cyan" },
    { name: "Rumah Tangga", slug: "home_supplies", type: "EXPENSE", icon: "Sofa", color: "emerald" },

    // HEALTH
    { name: "Obat", slug: "medicine", type: "EXPENSE", icon: "Pill", color: "rose" },
    { name: "Dokter", slug: "doctor", type: "EXPENSE", icon: "Stethoscope", color: "rose" },
    { name: "Rumah Sakit", slug: "hospital", type: "EXPENSE", icon: "Cross", color: "rose" },
    { name: "Fitness", slug: "fitness", type: "EXPENSE", icon: "Dumbbell", color: "slate" },

    // EDUCATION
    { name: "Buku", slug: "books", type: "EXPENSE", icon: "BookOpen", color: "amber" },
    { name: "Course", slug: "course", type: "EXPENSE", icon: "GraduationCap", color: "blue" },
    { name: "Pendidikan", slug: "education", type: "EXPENSE", icon: "School", color: "blue" },
    { name: "Sertifikasi", slug: "certification", type: "EXPENSE", icon: "Award", color: "amber" },

    // FINANCIAL
    { name: "Biaya Admin", slug: "admin_fee", type: "EXPENSE", icon: "Receipt", color: "slate" },
    { name: "Biaya Bank", slug: "bank_fee", type: "EXPENSE", icon: "Landmark", color: "slate" },
    { name: "Biaya Transfer", slug: "transfer_fee", type: "EXPENSE", icon: "ArrowRightLeft", color: "slate" },
    { name: "Pajak", slug: "tax", type: "EXPENSE", icon: "FileText", color: "red" },

    // SOCIAL & OTHER
    { name: "Hadiah", slug: "gift", type: "EXPENSE", icon: "Gift", color: "pink" },
    { name: "Donasi", slug: "donation", type: "EXPENSE", icon: "Heart", color: "rose" },
    { name: "Keluarga", slug: "family", type: "EXPENSE", icon: "Users", color: "blue" },
    { name: "Lainnya", slug: "other", type: "EXPENSE", icon: "MoreHorizontal", color: "gray" },

    // DEFAULT INCOME
    { name: "Gaji", slug: "salary", type: "INCOME", icon: "Wallet", color: "emerald" },
  ]

  // Idempotent seeding: Only create categories that don't exist by slug
  const existingCategories = await tx.category.findMany({ where: { userId } })
  const existingSlugs = new Set(existingCategories.map((c: any) => c.slug).filter(Boolean))

  for (const cat of defaultCategories) {
    if (!existingSlugs.has(cat.slug)) {
      await tx.category.create({
        data: {
          userId,
          name: cat.name,
          slug: cat.slug,
          type: cat.type,
          icon: cat.icon,
          color: cat.color,
          isDefault: true,
          isActive: true
        }
      })
    }
  }
}
