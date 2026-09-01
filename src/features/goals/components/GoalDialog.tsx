"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createGoal, updateGoal } from "../actions";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/TranslationContext";

interface GoalDialogProps {
  goal?: {
    id: string;
    name: string;
    targetAmount: any;
    currentAmount: any;
    deadline?: any;
  };
}

export function GoalDialog({ goal }: GoalDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const [name, setName] = useState(goal?.name || "");
  const [targetAmount, setTargetAmount] = useState<number>(
    goal ? Number(goal.targetAmount) : 0,
  );
  const [currentAmount, setCurrentAmount] = useState<number>(
    goal ? Number(goal.currentAmount) : 0,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || targetAmount <= 0) {
      toast.error(
        t.goalsPage?.fillRequired || "Please fill in name and target amount",
      );
      return;
    }

    setIsPending(true);
    let result;
    if (goal) {
      result = await updateGoal(goal.id, {
        name,
        targetAmount,
        currentAmount,
      });
    } else {
      result = await createGoal({
        name,
        targetAmount,
        currentAmount,
      });
    }

    setIsPending(false);

    if (result.success) {
      toast.success(
        goal
          ? t.common?.success || "Goal updated"
          : t.common?.success || "Goal created",
      );
      if (!goal) {
        setName("");
        setTargetAmount(0);
        setCurrentAmount(0);
      }
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || t.common?.error || "Failed to save goal");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          goal ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-4 rounded-full text-xs font-semibold"
            >
              {t.common?.edit || "Edit"}
            </Button>
          ) : (
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />{" "}
              {t.goalsPage?.addGoal || "New Goal"}
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {goal
              ? t.goalsPage?.editGoal || "Edit Goal"
              : t.goalsPage?.addGoal || "New Financial Goal"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.goalsPage?.goalName || "Goal Name"}</Label>
            <Input
              id="name"
              placeholder={
                t.goalsPage?.goalPlaceholder || "e.g. Emergency Fund"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAmount">
              {t.goalsPage?.targetAmount || "Target Amount"} (Rp)
            </Label>
            <Input
              id="targetAmount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={new Intl.NumberFormat("id-ID").format(targetAmount)}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setTargetAmount(val ? Number(val) : 0);
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentAmount">
              {t.goalsPage?.currentAmount || "Already Saved"} (Rp)
            </Label>
            <Input
              id="currentAmount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={new Intl.NumberFormat("id-ID").format(currentAmount)}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setCurrentAmount(val ? Number(val) : 0);
              }}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending
              ? t.common?.loading || "Saving..."
              : t.common?.save || "Save Goal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
