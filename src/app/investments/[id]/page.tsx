import {
  getInvestmentById,
  getInvestmentTransactions,
} from "@/features/investments/actions";
import { getAccounts } from "@/features/accounts/actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FadeIn } from "@/components/MotionWrapper";
import {
  ArrowLeft,
  TrendingUp,
  BarChart3,
  LineChart,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id as localeId, enUS } from "date-fns/locale";
import { InvestmentTransactionDialog } from "@/features/investments/components/InvestmentTransactionDialog";
import { getTranslation } from "@/lib/i18n";

export default async function InvestmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { t, language } = await getTranslation();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const [investmentResult, transactionsResult, accountsResult] =
    await Promise.all([
      getInvestmentById(id),
      getInvestmentTransactions(id),
      getAccounts(),
    ]);

  if (!investmentResult.success || !investmentResult.data) {
    redirect("/investments");
  }

  const inv = investmentResult.data;
  const transactions = transactionsResult.success
    ? transactionsResult.data || []
    : [];
  const accounts = accountsResult.success ? accountsResult.data || [] : [];

  const returnPct =
    inv.totalInvested > 0 ? inv.unrealizedGain / inv.totalInvested : 0;
  const formatPercentage = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "BUY":
        return t.investmentsPage?.buy || "Beli";
      case "SELL":
        return t.investmentsPage?.sell || "Jual";
      case "DEPOSIT":
        return t.investmentsPage?.deposit || "Deposit";
      case "WITHDRAW":
        return t.investmentsPage?.withdraw || "Tarik Dana";
      case "DIVIDEND":
        return t.investmentsPage?.dividend || "Dividen";
      case "INTEREST":
        return t.investmentsPage?.interest || "Bunga";
      case "FEE":
        return t.investmentsPage?.fee || "Biaya";
      default:
        return type;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "BUY":
      case "DEPOSIT":
        return "bg-emerald-100 text-emerald-700";
      case "SELL":
      case "WITHDRAW":
      case "FEE":
        return "bg-red-100 text-red-700";
      case "DIVIDEND":
      case "INTEREST":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <FadeIn delay={0.1}>
        <header className="flex flex-col gap-4 border-b border-slate-200/50 pb-6 pt-4">
          <Link
            href="/investments"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> {t.investmentsPage?.backToInvestments || "Kembali ke Investasi"}
          </Link>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 pb-1">
                {inv.name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200 text-slate-700">
                  {(t.assetTypes as Record<string, string>)?.[inv.type] || inv.type.replace("_", " ")}
                </Badge>
                {inv.platform && (
                  <span className="text-sm font-medium text-slate-500">
                    {inv.platform}
                  </span>
                )}
                {inv.status === "SOLD" && (
                  <Badge variant="secondary">{t.investmentsPage?.sold || "Sold"}</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center mt-2 md:mt-0">
              <InvestmentTransactionDialog accounts={accounts} investment={inv as any} />
            </div>
          </div>
        </header>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-indigo-500" /> {t.investmentsPage?.invested || "Invested"}
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              <CurrencyDisplay amount={inv.totalInvested} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-500" /> {t.investmentsPage?.currentValue || "Current Value"}
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              <CurrencyDisplay amount={inv.currentValue} />
            </div>
          </div>

          <div
            className={`bg-white p-5 rounded-2xl border ${inv.unrealizedGain >= 0 ? "border-green-200" : "border-red-200"} shadow-sm flex flex-col justify-between`}
          >
            <div
              className={`text-sm font-medium flex items-center gap-2 ${inv.unrealizedGain >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              <LineChart className="w-4 h-4" /> {t.investmentsPage?.unrealizedReturn || "Unrealized Return"}
            </div>
            <div
              className={`text-2xl font-bold mt-2 ${inv.unrealizedGain >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {inv.unrealizedGain >= 0 ? "+" : ""}
              <CurrencyDisplay amount={inv.unrealizedGain} />
            </div>
          </div>

          <div
            className={`bg-white p-5 rounded-2xl border ${returnPct >= 0 ? "border-green-200" : "border-red-200"} shadow-sm flex flex-col justify-between`}
          >
            <div
              className={`text-sm font-medium flex items-center gap-2 ${returnPct >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              <TrendingUp className="w-4 h-4" /> {t.investmentsPage?.returnPct || "Return %"}
            </div>
            <div
              className={`text-2xl font-bold mt-2 ${returnPct >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {returnPct >= 0 ? "+" : ""}
              {formatPercentage(returnPct)}
            </div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">
              {t.investmentsPage?.transactionHistory || "Riwayat Transaksi"}
            </h3>
          </div>

          {transactions.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              {t.investmentsPage?.noTransactionHistory || "Belum ada riwayat transaksi."}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getTransactionColor(tx.type)}`}
                    >
                      <span className="font-bold text-xs uppercase">
                        {tx.type.substring(0, 3)}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-[15px]">
                        {getTransactionLabel(tx.type)}
                      </p>
                      <p className="text-[13px] text-slate-500 mt-0.5">
                        {format(new Date(tx.date), "dd MMM yyyy, HH:mm", {
                          locale: language === "EN" ? enUS : localeId,
                        })}
                        {tx.accountName && ` • via ${tx.accountName}`}
                      </p>
                      {tx.notes && (
                        <p className="text-[12px] text-slate-400 mt-1 italic">
                          {tx.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-black text-[17px] ${["BUY", "WITHDRAW", "FEE"].includes(tx.type) ? "text-red-700" : "text-emerald-700"}`}
                    >
                      {["BUY", "WITHDRAW", "FEE"].includes(tx.type) ? "-" : "+"}
                      <CurrencyDisplay amount={tx.amount} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
