import { getCategories } from "@/features/categories/actions";
import { CategoryList } from "@/features/categories/components/CategoryList";
import { CategoryDialog } from "@/features/categories/components/CategoryDialog";
import { FadeIn } from "@/components/MotionWrapper";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { getTranslation } from "@/lib/i18n";

export default async function CategoriesPage() {
  const { t } = await getTranslation();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // Pass includeInactive = true so we can see archived categories
  const categoriesResult = await getCategories(undefined, true);
  const categories = categoriesResult.success
    ? categoriesResult.data || []
    : [];

  return (
    <div className="space-y-8 pb-10">
      <FadeIn delay={0.1}>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hidden md:block">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 pb-1">
                {t.categoriesPage?.title || "Categories"}
              </h1>
              <p className="text-muted-foreground mt-1 text-base">
                {t.categoriesPage?.description ||
                  "Customize categories to organize your financial transactions."}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <CategoryDialog />
          </div>
        </header>
      </FadeIn>

      <FadeIn delay={0.2}>
        <CategoryList categories={categories} />
      </FadeIn>
    </div>
  );
}
