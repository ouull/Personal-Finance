import { Category } from "@/components/CategoryPicker";

export function getCategoryDisplayName(
  category: Category | { name: string; slug?: string | null },
  t: any,
): string {
  if (category.slug && t?.categories?.[category.slug]) {
    return t.categories[category.slug];
  }
  return category.name;
}

export function getAccountTypeLabel(type: string, t: any): string {
  const typeKey = type.toLowerCase();
  return t?.accountTypes?.[typeKey] || type;
}

export function getTransactionTypeLabel(type: string, t: any): string {
  const typeKey = type.toLowerCase();
  return t?.transactionTypes?.[typeKey] || type;
}

export function getStatusLabel(status: string, t: any): string {
  const statusKey = status.toLowerCase();
  return t?.statuses?.[statusKey] || status;
}
