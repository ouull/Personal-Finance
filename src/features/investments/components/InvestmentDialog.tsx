/* eslint-disable react-hooks/incompatible-library */

"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  InvestmentFormValues,
  investmentSchema,
} from "@/shared/schemas/investments";
import { createInvestment } from "../actions";
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
import { Plus } from "lucide-react";
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

export function InvestmentDialog({ accounts = [] }: { accounts?: Account[] }) {
  const { t } = useTranslation();
  const { formatRupiah } = useCurrency();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    watch,
  } = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema) as any,
    defaultValues: {
      name: "",
      type: "STOCK",
      platform: "",
      initialAmount: 0,
      accountId: "",
    },
  });

  async function onSubmit(data: InvestmentFormValues) {
    setIsPending(true);
    const result = await createInvestment(data);
    setIsPending(false);

    if (result.success) {
      toast.success(t.common?.success || "Investment portfolio created");
      reset();
      setOpen(false);
    } else {
      toast.error(
        result.error || t.common?.error || "Failed to create investment",
      );
    }
  }

  const types = ["STOCK", "MUTUAL_FUND", "BOND", "GOLD", "CRYPTO", "OTHER"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />{" "}
            {t.investmentsPage?.addInvestment || "Add Investment"}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t.investmentsPage?.addInvestment || "Add New Investment Portfolio"}
          </DialogTitle>
          <DialogDescription>
            {t.investmentsPage?.addInvestmentDesc ||
              "Create a new portfolio to track your assets."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">
              {t.investmentsPage?.portfolioName || "Portfolio Name"}
            </Label>
            <Input
              id="name"
              placeholder={t.investmentsPage?.portfolioNamePlaceholder || "e.g. S&P 500 ETF, Apple Stock"}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">
              {t.investmentsPage?.assetType || "Asset Type"}
            </Label>
            <Select
              value={watch("type")}
              onValueChange={(val) =>
                setValue("type", val as any, { shouldValidate: true })
              }
            >
              <SelectTrigger id="type">
                {watch("type") ? (
                  <span
                    data-slot="select-value"
                    className="flex flex-1 text-left line-clamp-1"
                  >
                    {(t.assetTypes as Record<string, string>)?.[watch("type")] || watch("type").replace("_", " ")}
                  </span>
                ) : (
                  <SelectValue placeholder="Select type" />
                )}
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {(t.assetTypes as Record<string, string>)?.[type] || type.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform">
              {t.investmentsPage?.platform || "Platform / Broker (Optional)"}
            </Label>
            <Input
              id="platform"
              placeholder={t.investmentsPage?.platformPlaceholder || "e.g. Ajaib, Bibit, Binance"}
              {...register("platform")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initialAmount">{t.investmentsPage?.initialAmount || "Initial Investment"} (Rp)</Label>
              <Input
                id="initialAmount"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={new Intl.NumberFormat("id-ID").format(
                  watch("initialAmount") || 0,
                )}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, "");
                  const numValue = rawValue ? Number(rawValue) : 0;
                  setValue("initialAmount", numValue, { shouldValidate: true });
                }}
              />
              {errors.initialAmount && (
                <p className="text-sm text-red-500">
                  {errors.initialAmount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountId">{t.investmentsPage?.sourceAccount || "Source Account"}</Label>
              <Select
                value={watch("accountId") || ""}
                onValueChange={(val) =>
                  setValue("accountId", val || "", { shouldValidate: true })
                }
              >
                <SelectTrigger id="accountId" className="w-full">
                  {watch("accountId") ? (
                    <span
                      data-slot="select-value"
                      className="flex flex-1 text-left line-clamp-1"
                    >
                      {
                        accounts.find((a: any) => a.id === watch("accountId"))
                          ?.name
                      }
                    </span>
                  ) : (
                    <SelectValue placeholder={t.investmentsPage?.selectAccount || "Select account"} />
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
                  {errors.accountId.message as string}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              {t.investmentsPage?.notes || "Notes (Optional)"}
            </Label>
            <Input
              id="notes"
              placeholder={
                t.investmentsPage?.notesPlaceholder || "e.g. Long term target"
              }
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-sm text-red-500">
                {errors.notes.message as string}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending
              ? t.common?.loading || "Saving..."
              : t.common?.save || "Create Portfolio"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
