"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useCurrency } from "@/lib/CurrencyContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function TransactionDetailsDialog({
  transaction,
  children,
}: {
  transaction: any;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { formatRupiah } = useCurrency();

  const isIncome =
    transaction.type === "INCOME" || transaction.type === "INITIAL_BALANCE";
  const isTransfer = transaction.type === "TRANSFER";

  let title =
    transaction.merchant?.name ||
    transaction.description ||
    (isIncome ? "Pemasukan" : isTransfer ? "Transfer" : "Pengeluaran");

  if (!transaction.merchant?.name && transaction.description) {
    let merchantStr = transaction.description;
    merchantStr = merchantStr
      .replace("Beli aset ", "")
      .replace("Jual aset ", "")
      .replace("Tarik Dana dari ", "")
      .replace("Deposit Dana ke ", "")
      .replace("Jual Investasi: ", "")
      .replace("Beli Investasi: ", "");
    const diIndex = merchantStr.lastIndexOf(" di ");
    if (diIndex !== -1) {
      merchantStr = merchantStr.substring(0, diIndex);
    }
    title = merchantStr;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={false}
        render={<div className="cursor-pointer flex-1 min-w-0">{children}</div>}
      />
      <DialogContent className="sm:max-w-[425px] overflow-hidden p-0">
        <div
          className={`p-6 pb-8 ${isIncome ? "bg-teal-50" : isTransfer ? "bg-slate-50" : "bg-red-50"}`}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <span
              className={`text-sm font-bold tracking-widest uppercase mb-3 px-3 py-1 rounded-full ${isIncome ? "bg-teal-100 text-teal-800" : isTransfer ? "bg-slate-200 text-slate-800" : "bg-red-100 text-red-800"}`}
            >
              {isIncome ? "Pemasukan" : isTransfer ? "Transfer" : "Pengeluaran"}
            </span>
            <h2
              className={`text-3xl font-black mb-1 ${isIncome ? "text-teal-700" : isTransfer ? "text-slate-800" : "text-red-700"}`}
            >
              {isIncome ? "+" : isTransfer ? "" : "-"}
              {formatRupiah(Number(transaction.amount))}
            </h2>
            <p className="text-slate-600 font-medium">{title}</p>
          </div>
        </div>

        <div className="p-6 space-y-5 bg-white">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <span className="text-sm text-slate-500 font-medium">Tanggal</span>
            <span className="text-sm font-bold text-slate-900 text-right">
              {format(new Date(transaction.date), "dd MMM yyyy, HH:mm", {
                locale: localeId,
              })}
            </span>
          </div>

          {!isTransfer && transaction.category && (
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <span className="text-sm text-slate-500 font-medium">
                Kategori
              </span>
              <span className="text-sm font-bold text-slate-900 text-right">
                {transaction.category.name}
              </span>
            </div>
          )}

          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <span className="text-sm text-slate-500 font-medium">
              {isTransfer ? "Dari Rekening" : "Rekening"}
            </span>
            <span className="text-sm font-bold text-slate-900 text-right">
              {transaction.sourceAccount?.name || "-"}
            </span>
          </div>

          {isTransfer && (
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <span className="text-sm text-slate-500 font-medium">
                Ke Rekening
              </span>
              <span className="text-sm font-bold text-slate-900 text-right">
                {transaction.destinationAccount?.name || "-"}
              </span>
            </div>
          )}

          {transaction.description && transaction.description !== title && (
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <span className="text-sm text-slate-500 font-medium">
                Keterangan
              </span>
              <span className="text-sm font-bold text-slate-900 text-right max-w-[60%] text-wrap">
                {transaction.description}
              </span>
            </div>
          )}

          {transaction.notes && (
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-sm text-slate-500 font-medium">
                Catatan
              </span>
              <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl">
                {transaction.notes}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
