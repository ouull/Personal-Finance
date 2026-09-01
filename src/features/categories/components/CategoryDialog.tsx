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
import { createCategory, updateCategory } from "../actions";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryDialogProps {
  category?: {
    id: string;
    name: string;
    type: string;
    icon?: string | null;
    color?: string | null;
  };
}

export function CategoryDialog({ category }: CategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const [name, setName] = useState(category?.name || "");
  const [type, setType] = useState<"EXPENSE" | "INCOME">(
    (category?.type as any) || "EXPENSE",
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    setIsPending(true);
    let result;
    if (category) {
      result = await updateCategory(category.id, { name });
    } else {
      result = await createCategory({ name, type });
    }

    setIsPending(false);

    if (result.success) {
      toast.success(category ? "Category updated" : "Category created");
      setOpen(false);
      if (!category) setName("");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to save category");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          category ? (
            <Button variant="outline" size="sm">
              Edit
            </Button>
          ) : (
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit Category" : "Add New Category"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="e.g. Shopping, Rent..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {!category && (
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(val: any) => setType(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !name}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {isPending ? "Saving..." : "Save Category"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
