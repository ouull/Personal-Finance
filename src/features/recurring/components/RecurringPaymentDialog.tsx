/* eslint-disable react-hooks/incompatible-library */

"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  RecurringPaymentFormValues,
  recurringPaymentSchema,
} from "@/shared/schemas/recurring";
import { createRecurringPayment, updateRecurringPayment } from "../actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/TranslationContext";
import { useCurrency } from "@/lib/CurrencyContext";

interface Account {
  id: string;
  name: string;
  balance?: any;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface RecurringPaymentDialogProps {
  accounts: Account[];
  categories: Category[];
  payment?: any;
}

export function RecurringPaymentDialog({
  accounts,
  categories,
  payment,
}: RecurringPaymentDialogProps) {
  const { t } = useTranslation();
  const { formatRupiah } = useCurrency();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    watch,
  } = useForm<RecurringPaymentFormValues>({
    resolver: zodResolver(recurringPaymentSchema) as any,
    defaultValues: payment
      ? {
          name: payment.name,
          type: payment.type,
          billingCycle: payment.billingCycle,
          amount: payment.amount,
          nextDueDate: new Date(payment.nextDueDate),
          reminderDays: payment.reminderDays,
          status: payment.status,
          accountId: payment.accountId,
          categoryId: payment.categoryId,
          notes: payment.notes || "",
        }
      : {
          name: "",
          type: "SUBSCRIPTION",
          billingCycle: "MONTHLY",
          amount: 0,
          nextDueDate: new Date(),
          reminderDays: 3,
          status: "ACTIVE",
        },
  });

  const accountIdVal = watch("accountId");
  const categoryIdVal = watch("categoryId");

  async function onSubmit(data: RecurringPaymentFormValues) {
    setIsPending(true);
    let result;
    if (payment) {
      result = await updateRecurringPayment(payment.id, data);
    } else {
      result = await createRecurringPayment(data as any);
    }
    setIsPending(false);

    if (result.success) {
      toast.success(
        t.common?.success ||
          (payment ? "Payment updated" : "Recurring payment scheduled"),
      );
      if (!payment) reset();
      setOpen(false);
    } else {
      toast.error(
        result.error || t.common?.error || "Failed to schedule payment",
      );
    }
  }

  const types = ["SUBSCRIPTION", "BILL", "RECURRING_EXPENSE"];
  const cycles = ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          payment ? (
            <Button variant="outline" size="sm" className="w-10 p-0">
              <Edit2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />{" "}
              {t.recurringPage?.addRecurring || "Add Recurring"}
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {payment
              ? t.common?.edit || "Edit"
              : t.recurringPage?.addRecurring || "Schedule Recurring Payment"}
          </DialogTitle>
          <DialogDescription>
            {payment
              ? t.common?.edit || "Update your recurring payment details."
              : t.recurringPage?.addRecurringDesc ||
                "Keep track of your subscriptions and regular bills."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.recurringPage?.name || "Name"}</Label>
            <Input id="name" placeholder={t.recurringPage?.namePlaceholder || "e.g. Netflix"} {...register("name")} />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">{t.recurringPage?.type || "Type"}</Label>
              <Select
                value={watch("type")}
                onValueChange={(val: any) =>
                  setValue("type", val as any, { shouldValidate: true })
                }
              >
                <SelectTrigger id="type">
                  {watch("type") ? (
                    <span className="flex flex-1 text-left line-clamp-1">
                      {(t.recurringTypes as Record<string, string>)?.[watch("type")] || watch("type").replace("_", " ")}
                    </span>
                  ) : (
                    <SelectValue placeholder={t.recurringPage?.selectType || "Select type"} />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {types.map((tType) => (
                    <SelectItem key={tType} value={tType}>
                      {(t.recurringTypes as Record<string, string>)?.[tType] || tType.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingCycle">
                {t.recurringPage?.billingCycle || "Billing Cycle"}
              </Label>
              <Select
                value={watch("billingCycle")}
                onValueChange={(val: any) =>
                  setValue("billingCycle", val as any, { shouldValidate: true })
                }
              >
                <SelectTrigger id="billingCycle">
                  {watch("billingCycle") ? (
                    <span className="flex flex-1 text-left line-clamp-1">
                      {(t.billingCycles as Record<string, string>)?.[watch("billingCycle")] || watch("billingCycle")}
                    </span>
                  ) : (
                    <SelectValue placeholder={t.recurringPage?.selectCycle || "Select cycle"} />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {cycles.map((cycle) => (
                    <SelectItem key={cycle} value={cycle}>
                      {(t.billingCycles as Record<string, string>)?.[cycle] || cycle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.billingCycle && (
                <p className="text-sm text-red-500">
                  {errors.billingCycle.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              {t.recurringPage?.amount || "Amount"} (Rp)
            </Label>
            <Input
              id="amount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={new Intl.NumberFormat("id-ID").format(
                watch("amount") || 0,
              )}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\D/g, "");
                const numValue = rawValue ? Number(rawValue) : 0;
                setValue("amount", numValue, { shouldValidate: true });
              }}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId">
              {t.recurringPage?.sourceAccount || "Auto-deduct from Account"}
            </Label>
            <Select
              value={accountIdVal || ""}
              onValueChange={(val: any) =>
                setValue("accountId", val, { shouldValidate: true })
              }
            >
              <SelectTrigger id="accountId">
                {accountIdVal ? (
                  <span className="flex flex-1 text-left line-clamp-1">
                    {accounts.find((a) => a.id === accountIdVal)?.name}
                  </span>
                ) : (
                  <SelectValue
                    placeholder={
                      t.transactionsPage?.selectAccount || "Select account"
                    }
                  />
                )}
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    <div className="flex items-center justify-between flex-1 w-full gap-2 pr-1">
                      <span className="truncate">{acc.name}</span>
                      <span className="text-xs text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded-md shrink-0 whitespace-nowrap">
                        {formatRupiah(Number((acc as any).balance || 0))}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountId && (
              <p className="text-sm text-red-500">{errors.accountId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nextDueDate">
                {t.recurringPage?.nextDueDate || "Next Due Date"}
              </Label>
              <Input
                id="nextDueDate"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setValue(
                    "nextDueDate",
                    e.target.value
                      ? new Date(e.target.value)
                      : (undefined as any),
                    { shouldValidate: true },
                  );
                }}
              />
              {errors.nextDueDate && (
                <p className="text-sm text-red-500">
                  {errors.nextDueDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderDays">
                {t.recurringPage?.reminderDays || "Remind me before (days)"}
              </Label>
              <Input
                id="reminderDays"
                type="number"
                min="0"
                max="30"
                {...register("reminderDays", { valueAsNumber: true })}
              />
              {errors.reminderDays && (
                <p className="text-sm text-red-500">
                  {errors.reminderDays.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              {t.recurringPage?.notes || "Notes (Optional)"}
            </Label>
            <Input
              id="notes"
              placeholder={
                t.recurringPage?.notesPlaceholder || "e.g. Shared with Andi"
              }
              {...register("notes")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t.recurringPage?.status || "Status"}</Label>
            <Select
              value={watch("status") || "ACTIVE"}
              onValueChange={(val: any) =>
                setValue("status", val, { shouldValidate: true })
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder={t.recurringPage?.status || "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">{(t.statuses as Record<string, string>)?.ACTIVE || "Active"}</SelectItem>
                <SelectItem value="PAUSED">{(t.statuses as Record<string, string>)?.PAUSED || "Paused"}</SelectItem>
                <SelectItem value="CANCELLED">{(t.statuses as Record<string, string>)?.CANCELLED || "Cancelled"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full font-bold"
            size="lg"
            disabled={isPending}
          >
            {isPending
              ? t.common?.loading || "Saving..."
              : t.common?.save || "Schedule Payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
