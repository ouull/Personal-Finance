"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Download,
  Receipt,
  Coffee,
  Home,
  Banknote,
  Utensils,
  ChevronDown,
  Edit2,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { TransactionItem } from "./TransactionItem";
import { useTranslation } from "@/lib/TranslationContext";
import { useCurrency } from "@/lib/CurrencyContext";
import { TransactionDialog } from "./TransactionDialog";

interface Account {
  id: string;
  name: string;
  type: string;
  balance?: any;
}

interface Transaction {
  id: string;
  type: string;
  amount: any;
  description: string | null;
  date: Date;
  sourceAccount?: { id: string; name: string } | null;
  destinationAccount?: { id: string; name: string } | null;
  merchant?: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string | null;
}

export function TransactionList({
  transactions,
  accounts = [],
  categories = [],
  groupTranslations = {},
  hideHeader = false,
}: {
  transactions: Transaction[];
  accounts?: Account[];
  categories?: Category[];
  groupTranslations?: Record<string, string>;
  hideHeader?: boolean;
}) {
  const { t, language } = useTranslation();
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterAccount, setFilterAccount] = useState<string>("ALL");
  const [filterDate, setFilterDate] = useState<string>("ALL");

  const filteredTransactions = transactions.filter((t: any) => {
    if (filterType !== "ALL" && t.type !== filterType) return false;
    if (filterAccount !== "ALL") {
      const isSourceMatch = t.sourceAccount?.id === filterAccount;
      const isDestMatch = t.destinationAccount?.id === filterAccount;
      if (!isSourceMatch && !isDestMatch) return false;
    }
    if (filterDate !== "ALL") {
      const txDate = new Date(t.date);
      const now = new Date();
      if (filterDate === "THIS_MONTH") {
        if (
          txDate.getMonth() !== now.getMonth() ||
          txDate.getFullYear() !== now.getFullYear()
        )
          return false;
      } else if (filterDate === "LAST_MONTH") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        if (
          txDate.getMonth() !== lastMonth.getMonth() ||
          txDate.getFullYear() !== lastMonth.getFullYear()
        )
          return false;
      } else if (filterDate === "THIS_YEAR") {
        if (txDate.getFullYear() !== now.getFullYear()) return false;
      }
    }
    return true;
  });

  const { formatRupiah } = useCurrency();

  const groupedTransactions: Record<string, typeof filteredTransactions> = {};

  filteredTransactions.forEach((tx) => {
    const txDate = new Date(tx.date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateStr = "";
    if (txDate.toDateString() === today.toDateString()) {
      dateStr = ((t as any).dashboard?.today || "HARI INI").toUpperCase();
    } else if (txDate.toDateString() === yesterday.toDateString()) {
      dateStr = ((t as any).dashboard?.yesterday || "KEMARIN").toUpperCase();
    } else {
      dateStr = format(txDate, "dd MMM yyyy", { locale: id }).toUpperCase();
    }

    if (!groupedTransactions[dateStr]) groupedTransactions[dateStr] = [];
    groupedTransactions[dateStr].push(tx);
  });

  const activeAccounts = accounts.filter((a: any) => a.isActive !== false);

  return (
    <div className="space-y-8">
      {/* Header & Filters */}
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 pb-1">
              {t.transactionsPage?.title || "Transaksi"}
            </h1>
            <p className="text-muted-foreground mt-1 text-base">
              {t.transactionsPage?.description ||
                "Pantau setiap pergerakan uang Anda."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center w-full gap-4 sm:gap-2">
            {/* Pill Filters */}
            <div className="w-full sm:flex-1">
              <div className="flex flex-wrap gap-2 w-full">
                <div className="relative flex items-center bg-white rounded-full shadow-sm border border-slate-100 h-11">
                <select
                  className="appearance-none absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                >
                  <option value="ALL">Tanggal (Semua)</option>
                  <option value="THIS_MONTH">Bulan Ini</option>
                  <option value="LAST_MONTH">Bulan Lalu</option>
                  <option value="THIS_YEAR">Tahun Ini</option>
                </select>
                <div className="flex items-center px-4 hover:bg-slate-50 rounded-full cursor-pointer h-full transition-colors group">
                  <span className="text-[13px] font-bold text-slate-600 mr-2">
                    Tanggal
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </div>
                </div>

                <div className="relative flex items-center bg-white rounded-full shadow-sm border border-slate-100 h-11">
                <select
                  className="appearance-none absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="ALL">Kategori (Semua)</option>
                  <option value="INCOME">Pemasukan</option>
                  <option value="EXPENSE">Pengeluaran</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
                <div className="flex items-center px-4 hover:bg-slate-50 rounded-full cursor-pointer h-full transition-colors group">
                  <span className="text-[13px] font-bold text-slate-600 mr-2">
                    Kategori
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </div>
                </div>

                <div className="relative flex items-center bg-white rounded-full shadow-sm border border-slate-100 h-11">
                <select
                  className="appearance-none absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value={filterAccount}
                  onChange={(e) => setFilterAccount(e.target.value)}
                >
                  <option value="ALL">Rekening (Semua)</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center px-4 hover:bg-slate-50 rounded-full cursor-pointer h-full transition-colors group">
                  <span className="text-[13px] font-bold text-slate-600 mr-2">
                    Rekening
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </div>
              </div>
              </div>
            </div>

            <div className="w-full sm:w-auto shrink-0">
              <TransactionDialog
                accounts={activeAccounts}
                categories={categories}
                groupTranslations={groupTranslations}
              />
            </div>
          </div>
        </div>
      )}

      {/* List Container */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-slate-100/50">
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm">
              {t.transactionsPage?.emptyFiltered || "Belum ada transaksi."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTransactions).map(([dateStr, txs]) => (
              <div key={dateStr}>
                <h3 className="text-xs font-bold text-slate-500 mb-4 tracking-wide">
                  {dateStr}
                </h3>
                <div className="flex flex-col">
                  {txs.map((tx: any, idx) => (
                    <TransactionItem
                      key={tx.id}
                      tx={tx}
                      accounts={accounts}
                      categories={categories}
                      groupTranslations={groupTranslations}
                      isLast={idx === txs.length - 1}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
