"use client"

import { useState } from "react"
import { deleteCategory } from "../actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CategoryDialog } from "./CategoryDialog"
import { Archive, Trash2, Folder, Loader2 } from "lucide-react"

interface CategoryListProps {
  categories: any[]
}

export function CategoryList({ categories }: CategoryListProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const expenses = categories.filter(c => c.type === "EXPENSE")
  const incomes = categories.filter(c => c.type === "INCOME")

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete or archive this category?")) return
    setIsDeleting(id)
    
    const result = await deleteCategory(id)
    setIsDeleting(null)

    if (result.success) {
      if (result.archived) {
        toast.success("Category archived (has historical data)")
      } else {
        toast.success("Category permanently deleted")
      }
      router.refresh()
    } else {
      toast.error(result.error || "Failed to delete category")
    }
  }

  const renderList = (items: any[], title: string) => (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-800">{title} ({items.length})</h3>
      {items.length === 0 ? (
        <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-sm">
          No categories found.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((cat) => (
            <div key={cat.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800">{cat.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    {cat.isDefault ? (
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium">DEFAULT</span>
                    ) : (
                      <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-medium">CUSTOM</span>
                    )}
                    {!cat.isActive && (
                      <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-medium">ARCHIVED</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!cat.isDefault && (
                  <CategoryDialog category={cat} />
                )}
                {!cat.isDefault && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(cat.id)}
                    disabled={isDeleting === cat.id}
                  >
                    {isDeleting === cat.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      cat.isActive ? <Archive className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-8">
      {renderList(expenses, "Expense Categories")}
      {renderList(incomes, "Income Categories")}
    </div>
  )
}
