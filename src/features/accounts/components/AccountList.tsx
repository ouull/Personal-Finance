"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Building2, Smartphone, TrendingUp } from "lucide-react";
import { AddCashDialog } from "./AddCashDialog";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { useTranslation } from "@/lib/TranslationContext";
import { useCurrency } from "@/lib/CurrencyContext";

// Gunakan tipe dari Prisma atau custom interface
interface Account {
  id: string;
  name: string;
  type: string;
  balance: any;
  currency: string;
}

const icons: Record<
  string,
  { icon: React.ReactNode; bg: string; text: string }
> = {
  CASH: {
    icon: <Wallet className="h-5 w-5" />,
    bg: "bg-emerald-50 text-emerald-600",
    text: "Uang Tunai",
  },
  BANK: {
    icon: <Building2 className="h-5 w-5" />,
    bg: "bg-blue-50 text-blue-600",
    text: "Rekening Bank",
  },
  EWALLET: {
    icon: <Smartphone className="h-5 w-5" />,
    bg: "bg-slate-100 text-slate-700",
    text: "Dompet Digital",
  },
  INVESTMENT: {
    icon: <TrendingUp className="h-5 w-5" />,
    bg: "bg-orange-50 text-orange-600",
    text: "Investasi",
  },
};

export function AccountList({ accounts }: { accounts: Account[] }) {
  const { t } = useTranslation();
  const { formatRupiah } = useCurrency();

  if (accounts.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-white/50 border-dashed">
        <p className="text-muted-foreground text-sm">
          {t.accountsPage?.empty || "No accounts yet."}
        </p>
      </div>
    );
  }



  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1">
      {accounts.map((account) => {
        const typeStyle = icons[account.type] || {
          icon: <Wallet className="h-5 w-5" />,
          bg: "bg-slate-50 text-slate-500",
          text: account.type,
        };

        return (
          <div
            key={account.id}
            className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col relative group"
          >
            {account.type !== "CASH" && (
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <DeleteAccountDialog
                  accountId={account.id}
                  accountName={account.name}
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${typeStyle.bg}`}
              >
                {typeStyle.icon}
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-slate-900 text-lg">
                  {account.name}
                </h3>
                <span className="text-xs font-medium text-slate-500">
                  {typeStyle.text}
                </span>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-[28px] font-black text-slate-900 tracking-tight">
                {formatRupiah(Number(account.balance))}
              </div>
            </div>

            {account.type === "CASH" && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <AddCashDialog accountId={account.id} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
