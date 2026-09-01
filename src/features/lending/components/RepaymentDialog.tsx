/* eslint-disable react-hooks/incompatible-library */

"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RepaymentFormValues, repaymentSchema } from "@/shared/schemas/lending";
import { addRepayment } from "../actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HandCoins } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/TranslationContext";
import { useCurrency } from "@/lib/CurrencyContext";

interface Account {
  id: string;
  name: string;
  balance?: any;
}

interface Loan {
  id: string;
  borrowerName: string;
  amount: number;
  totalRepaid: number;
  remainingAmount: number;
  type?: string;
}

interface RepaymentDialogProps {
  accounts: Account[];
  loan: Loan;
}

export function RepaymentDialog({ accounts, loan }: RepaymentDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    watch,
  } = useForm<RepaymentFormValues>({
    resolver: zodResolver(repaymentSchema) as any,
    defaultValues: {
      loanId: loan.id,
      amount: 0,
      paidDate: new Date(),
    },
  });

  const amountVal = watch("amount");

  async function onSubmit(data: RepaymentFormValues) {
    if (data.amount > loan.remainingAmount) {
      toast.error(t.lendingPage?.repaymentExceed || "Repayment amount cannot exceed remaining balance");
      return;
    }

    setIsPending(true);
    const result = await addRepayment(data);
    setIsPending(false);

    if (result.success) {
      toast.success(t.common?.success || "Repayment recorded successfully");
      reset();
      setOpen(false);
    } else {
      toast.error(result.error || t.common?.error || "An error occurred");
    }
  }

  const { formatRupiah } = useCurrency();
  const isBorrowed = (loan.type || "LENT") === "BORROWED";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className={`gap-2 ${isBorrowed ? "bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 border-orange-200" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border-emerald-200"}`}
          >
            <HandCoins className="h-4 w-4" />
            {isBorrowed
              ? t.lendingPage?.payDebt || "Bayar Hutang"
              : t.lendingPage?.receiveRepayment || "Terima Pembayaran"}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isBorrowed
              ? t.lendingPage?.payDebt || "Bayar Hutang"
              : t.lendingPage?.receiveRepayment || "Terima Pembayaran"}
          </DialogTitle>
          <DialogDescription>
            {isBorrowed
              ? t.lendingPage?.payDebtDescription || "Catat pembayaran hutang Anda kepada pemberi pinjaman."
              : t.lendingPage?.repaymentDescription ||
                "Record money paid back to you."}
          </DialogDescription>
        </DialogHeader>
        {accounts.length === 0 ? (
          <div className="text-center p-6 text-sm text-muted-foreground">
            You don&apos;t have any accounts yet. Please add an account first.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <Label htmlFor="amount">
                  {t.lendingPage?.amount || "Amount"} (Rp)
                </Label>
                <button
                  type="button"
                  onClick={() =>
                    setValue("amount", loan.remainingAmount, {
                      shouldValidate: true,
                    })
                  }
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {t.lendingPage?.payFull || "Pay in full"}
                </button>
              </div>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                placeholder="0"
                className="text-lg font-bold"
                value={
                  amountVal
                    ? new Intl.NumberFormat("id-ID").format(amountVal)
                    : ""
                }
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, "");
                  const numValue = rawValue ? Number(rawValue) : 0;
                  setValue("amount", numValue, { shouldValidate: true });
                }}
              />
              {amountVal > loan.remainingAmount && (
                <p className="text-sm text-red-500 font-medium">
                  Amount exceeds remaining balance (
                  {formatRupiah(loan.remainingAmount)})
                </p>
              )}
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountId">
                {isBorrowed
                  ? t.lendingPage?.withdrawFrom || "Ambil Dari Akun"
                  : t.lendingPage?.depositTo || "Deposit to Account"}
              </Label>
              <Select
                value={watch("accountId") || ""}
                onValueChange={(val) =>
                  setValue("accountId", val as any, { shouldValidate: true })
                }
              >
                <SelectTrigger id="accountId">
                  {watch("accountId") ? (
                    <span className="flex flex-1 text-left line-clamp-1">
                      {
                        accounts.find((a: any) => a.id === watch("accountId"))
                          ?.name
                      }
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
                      <div className="flex items-center justify-between flex-1 w-full gap-3 py-1">
                        <span className="font-medium text-slate-700 truncate">{acc.name}</span>
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100/80 ring-1 ring-slate-200/50 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap shadow-sm">
                          {formatRupiah(Number((acc as any).balance || 0))}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountId && (
                <p className="text-sm text-red-500">
                  {errors.accountId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidDate">
                {t.lendingPage?.paidDate || "Paid Date"}
              </Label>
              <Input
                id="paidDate"
                type="date"
                {...register("paidDate", { valueAsDate: true })}
                defaultValue={new Date().toISOString().split("T")[0]}
              />
              {errors.paidDate && (
                <p className="text-sm text-red-500">
                  {errors.paidDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                {t.lendingPage?.notes || "Notes (Optional)"}
              </Label>
              <Input
                id="notes"
                placeholder={
                  t.lendingPage?.notesPlaceholder || "Reason or terms"
                }
                {...register("notes")}
              />
              {errors.notes && (
                <p className="text-sm text-red-500">{errors.notes.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isPending}
            >
              {isPending
                ? t.common?.loading || "Saving..."
                : t.lendingPage?.recordRepayment || "Record Repayment"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
