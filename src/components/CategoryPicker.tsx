"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/TranslationContext";
import { getCategoryDisplayName } from "@/lib/display-helpers";

export interface Category {
  id: string;
  name: string;
  slug?: string | null;
  icon?: string | null;
}

interface CategoryPickerProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  groupTranslations?: Record<string, string>;
}

const CATEGORY_GROUPS = [
  {
    id: "food_and_beverage",
    slugs: ["food", "beverage", "coffee", "restaurant", "snack"],
  },
  {
    id: "transportation",
    slugs: ["fuel", "online_transport", "parking", "toll", "vehicle_service"],
  },
  {
    id: "shopping",
    slugs: [
      "online_shopping",
      "fashion",
      "electronics",
      "household",
      "marketplace",
    ],
  },
  {
    id: "entertainment",
    slugs: ["game", "game_topup", "streaming", "movie", "entertainment"],
  },
  {
    id: "digital_and_subscriptions",
    slugs: [
      "phone_credit",
      "mobile_data",
      "internet",
      "cloud_storage",
      "software",
      "subscription",
    ],
  },
  {
    id: "personal",
    slugs: [
      "cigarettes",
      "vape",
      "vape_liquid",
      "pod_cartridge",
      "personal_care",
    ],
  },
  { id: "living", slugs: ["rent", "electricity", "water", "home_supplies"] },
  { id: "health", slugs: ["medicine", "doctor", "hospital", "fitness"] },
  { id: "education", slugs: ["books", "course", "education", "certification"] },
  { id: "financial", slugs: ["admin_fee", "bank_fee", "transfer_fee", "tax"] },
  { id: "social_and_other", slugs: ["gift", "donation", "family", "other"] },
];

export function CategoryPicker({
  categories,
  value,
  onChange,
  placeholder = "Select category",
  error = false,
  groupTranslations = {},
}: CategoryPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const selectedCategory = categories.find((cat) => cat.id === value);

  const groupedCategories: Record<string, Category[]> = {};

  CATEGORY_GROUPS.forEach((group) => {
    const cats = categories.filter(
      (c) => c.slug && group.slugs.includes(c.slug),
    );
    if (cats.length > 0) {
      groupedCategories[group.id] = cats;
    }
  });

  // Find remaining custom categories
  const allGroupedSlugs = CATEGORY_GROUPS.flatMap((g) => g.slugs);
  const customCategories = categories.filter(
    (c) => !c.slug || !allGroupedSlugs.includes(c.slug),
  );

  if (customCategories.length > 0) {
    groupedCategories["my_categories"] = customCategories;
  }

  const allCategoriesLabel =
    groupTranslations["all_categories"] || "SEMUA KATEGORI";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground",
          error && "border-red-500 focus:ring-red-500",
        )}
      >
        <span className="truncate">
          {selectedCategory
            ? getCategoryDisplayName(selectedCategory, t)
            : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-[calc(100vw-32px)] sm:w-full min-w-[300px] p-0 shadow-xl border border-slate-200/60 rounded-lg bg-popover z-50 overflow-hidden">
          <div className="max-h-[350px] overflow-y-auto overscroll-contain">
            <div className="sticky top-0 bg-slate-50 border-b border-slate-100 p-2 z-10 shadow-sm">
              <span className="text-xs font-bold text-slate-500 tracking-wider pl-2">
                {allCategoriesLabel}
              </span>
            </div>
            {Object.entries(groupedCategories).map(([groupId, cats]) => {
              const groupName = groupTranslations[groupId] || groupId;
              return (
                <div
                  key={groupId}
                  className="border-b border-slate-50 last:border-0 pb-1"
                >
                  <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    {groupName}
                  </div>
                  {cats.map((category) => (
                    <div
                      key={category.id}
                      onClick={() => {
                        onChange(category.id);
                        setOpen(false);
                      }}
                      className="flex items-center py-2 px-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm rounded-sm mx-1"
                    >
                      <Check
                        className={cn(
                          "mr-3 h-4 w-4 text-indigo-600 shrink-0",
                          value === category.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="font-medium">
                        {getCategoryDisplayName(category, t)}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
