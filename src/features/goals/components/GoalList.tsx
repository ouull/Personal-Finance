"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

import { deleteGoal } from "../actions";
import { toast } from "sonner";
import { GoalDialog } from "./GoalDialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/TranslationContext";
import { useCurrency } from "@/lib/CurrencyContext";

interface Goal {
  id: string;
  name: string;
  targetAmount: any;
  currentAmount: any;
}

export function GoalList({ goals }: { goals: Goal[] }) {
  const { t } = useTranslation();
  const { formatRupiah } = useCurrency();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  if (goals.length === 0) {
    return (
      <div className="text-center p-6 border rounded-xl bg-slate-50/50 border-dashed">
        <p className="text-muted-foreground text-sm">
          {t.goalsPage?.emptyState || "No financial goals yet."}
        </p>
      </div>
    );
  }

  async function handleDelete(id: string) {
    if (
      !confirm(
        t.common?.confirmDelete || "Are you sure you want to delete this goal?",
      )
    )
      return;
    setIsDeleting(id);

    const result = await deleteGoal(id);
    setIsDeleting(null);

    if (result.success) {
      toast.success(t.common?.success || "Goal deleted");
      router.refresh();
    } else {
      toast.error(result.error || t.common?.error || "Failed to delete goal");
    }
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => {
        const target = Number(goal.targetAmount);
        const current = Number(goal.currentAmount);
        const percentage = Math.min(100, Math.round((current / target) * 100));

        return (
          <Card
            key={goal.id}
            className="bg-white/60 backdrop-blur-md border-white/50 hover:bg-white/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 shadow-sm group"
          >
            <CardHeader className="pb-2 flex flex-row justify-between items-start space-y-0 gap-2">
              <div className="space-y-1 flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-900 truncate">
                  <Target className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span className="truncate">{goal.name}</span>
                </CardTitle>
                <div className="text-sm font-medium text-slate-500">
                  {percentage}% Achieved
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <GoalDialog goal={goal} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(goal.id)}
                  disabled={isDeleting === goal.id}
                >
                  {isDeleting === goal.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Saved: {formatRupiah(current)}</span>
                <span>Target: {formatRupiah(target)}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
