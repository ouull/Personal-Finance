import { db } from "@/lib/db"
import { seedUserFinancialData } from "@/lib/seed"

export class CategoryError extends Error {
  constructor(public code: string, message: string) {
    super(message)
    this.name = "CategoryError"
  }
}

export async function getCategories(userId: string, type?: "INCOME" | "EXPENSE", includeInactive = false) {
  // Lazy initialization for users created before seed logic or with incomplete seeds
  const defaultCount = await db.category.count({ where: { userId, isDefault: true } })
  if (defaultCount < 52) {
    await seedUserFinancialData(userId)
  }

  return await db.category.findMany({
    where: { 
      userId,
      ...(type ? { type } : {}),
      ...(!includeInactive ? { isActive: true } : {})
    },
    orderBy: { name: "asc" }
  })
}

export async function createCategory(userId: string, data: { name: string, type: "INCOME" | "EXPENSE", icon?: string, color?: string }) {
  return await db.category.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      icon: data.icon,
      color: data.color,
      isActive: true,
      isDefault: false
    }
  })
}

export async function updateCategory(userId: string, id: string, data: { name: string, type?: "INCOME" | "EXPENSE", icon?: string, color?: string }) {
  const category = await db.category.findUnique({ where: { id } })
  if (!category || category.userId !== userId) {
    throw new CategoryError("CATEGORY_NOT_FOUND", "not_found")
  }
  
  if (category.isDefault) {
    // Only allow updating icon/color for default categories, prevent changing name or type
    return await db.category.update({
      where: { id },
      data: {
        icon: data.icon !== undefined ? data.icon : category.icon,
        color: data.color !== undefined ? data.color : category.color,
      }
    })
  }

  return await db.category.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type || category.type,
      icon: data.icon !== undefined ? data.icon : category.icon,
      color: data.color !== undefined ? data.color : category.color,
    }
  })
}

export async function deleteCategory(userId: string, id: string) {
  const category = await db.category.findUnique({ 
    where: { id },
    include: {
      _count: {
        select: {
          transactions: true
        }
      }
    }
  })
  
  if (!category || category.userId !== userId) {
    throw new CategoryError("CATEGORY_NOT_FOUND", "not_found")
  }

  if (category.isDefault) {
    throw new CategoryError("SYSTEM_CATEGORY_DELETION_FORBIDDEN", "Cannot delete system default categories")
  }

  if (category._count.transactions > 0) {
    // Archive instead of delete
    await db.category.update({
      where: { id },
      data: { isActive: false }
    })
    return { archived: true }
  } else {
    // Safe to hard delete
    await db.category.delete({
      where: { id }
    })
    return { archived: false }
  }
}
