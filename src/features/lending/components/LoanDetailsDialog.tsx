"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/TranslationContext";
import { useCurrency } from "@/lib/CurrencyContext";

interface Repayment {
  id: string;
  amount: number;
  paidDate: string | Date;
  notes?: string;
}

interface Loan {
  id: string;
  borrowerName: string;
  amount: number;
  totalRepaid: number;
  remainingAmount: number;
  lentDate: string | Date;
  dueDate?: string | Date;
  status: string;
  type?: string;
  notes?: string;
  repayments?: Repayment[];
}

interface LoanDetailsDialogProps {
  loan: Loan;
  children: React.ReactNode;
}

export function LoanDetailsDialog({ loan, children }: LoanDetailsDialogProps) {
  const { t } = useTranslation();
  const { formatRupiah } = useCurrency();
  const [open, setOpen] = useState(false);

  const isBorrowed = (loan.type || "LENT") === "BORROWED";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OUTSTANDING":
        return (
          <Badge
            variant="destructive"
            className="bg-orange-100 text-orange-800 border-orange-200"
          >
            {t.lendingPage?.outstanding || "Outstanding"}
          </Badge>
        );
      case "PARTIALLY_PAID":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 border-blue-200"
          >
            {t.lendingPage?.partiallyPaid || "Partially Paid"}
          </Badge>
        );
      case "PAID":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 border-green-200"
          >
            {t.lendingPage?.paid || "Paid"}
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge variant="destructive">
            {t.lendingPage?.overdue || "Overdue"}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // The very first transaction is the loan creation itself
  const loanCreationTx = {
    id: "loan_creation",
    amount: loan.amount,
    date: loan.lentDate,
    isRepayment: false,
    notes: loan.notes,
  };

  const repaymentsList = loan.repayments || [];
  
  const repayments = repaymentsList.map((r) => ({
    id: r.id,
    amount: r.amount,
    date: r.paidDate,
    isRepayment: true,
    notes: r.notes,
  }));

  // Combine and sort by date descending
  const timeline = [loanCreationTx, ...repayments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={false}
        render={<div className="cursor-pointer h-full">{children}</div>}
      />
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 p-6 pb-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase tracking-wider ${isBorrowed ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}
                >
                  {isBorrowed
                    ? t.lendingPage?.iOwe || "Hutang"
                    : t.lendingPage?.owedToMe || "Piutang"}
                </Badge>
                {getStatusBadge(loan.status)}
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {loan.borrowerName}
              </DialogTitle>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1">
                {t.lendingPage?.remaining || "Remaining"}
              </p>
              <p className="text-lg font-bold text-slate-900">
                {formatRupiah(loan.remainingAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
          <div className="p-6">
            <h4 className="font-semibold text-slate-800 mb-4">
              {t.lendingPage?.transactionHistory || "Riwayat Transaksi"}
            </h4>
            
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {timeline.map((tx) => (
                <div key={tx.id} className="relative flex items-center gap-4 group is-active">
                  {/* Icon */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white bg-slate-100 shadow-sm shrink-0 z-10">
                    {tx.isRepayment ? (
                      <span className="text-emerald-500 text-lg">↓</span>
                    ) : (
                      <span className="text-rose-500 text-lg">↑</span>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold ${tx.isRepayment ? "text-emerald-600" : "text-rose-600"}`}>
                        {tx.isRepayment ? "+" : "-"}{formatRupiah(tx.amount)}
                      </span>
                      <time className="text-xs font-medium text-slate-400">
                        {format(new Date(tx.date), "d MMM yyyy, HH:mm")}
                      </time>
                    </div>
                    <p className="text-sm text-slate-600">
                      {tx.isRepayment 
                        ? (isBorrowed ? (t.lendingPage?.paidDebt || "Bayar cicilan") : (t.lendingPage?.receivedRepayment || "Terima cicilan"))
                        : (isBorrowed ? (t.lendingPage?.borrowedMoney || "Pinjam uang") : (t.lendingPage?.lentMoney || "Pinjamkan uang"))}
                    </p>
                    {tx.notes && (
                      <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-md">
                        {tx.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
