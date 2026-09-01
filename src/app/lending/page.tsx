import { getLoans } from "@/features/lending/actions";
import { getAccounts } from "@/features/accounts/actions";
import { LoanList } from "@/features/lending/components/LoanList";
import { FadeIn } from "@/components/MotionWrapper";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HandCoins, UserMinus, Clock } from "lucide-react";
import { getTranslation } from "@/lib/i18n";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";

export default async function LendingPage() {
  const { t } = await getTranslation();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const [loansResult, accountsResult] = await Promise.all([
    getLoans(),
    getAccounts(),
  ]);

  const loans = loansResult.success ? loansResult.data || [] : [];
  const accounts = accountsResult.success ? accountsResult.data || [] : [];

  const totalReceivables = loans
    .filter((l: any) => (l.type || "LENT") === "LENT")
    .reduce((sum: number, loan: any) => sum + loan.remainingAmount, 0);
  const totalPayables = loans
    .filter((l: any) => l.type === "BORROWED")
    .reduce((sum: number, loan: any) => sum + loan.remainingAmount, 0);
  const totalRepaidToUs = loans
    .filter((l: any) => (l.type || "LENT") === "LENT")
    .reduce((sum: number, loan: any) => sum + loan.totalRepaid, 0);
  const totalRepaidByUs = loans
    .filter((l: any) => l.type === "BORROWED")
    .reduce((sum: number, loan: any) => sum + loan.totalRepaid, 0);

  return (
    <div className="space-y-8 pb-10">
      <FadeIn delay={0.1}>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 pb-1">
              {t.lendingPage?.title || "Lending"}
            </h1>
            <p className="text-muted-foreground mt-1 text-base">
              {t.lendingPage?.description ||
                "Track money you've lent to friends, family, or others."}
            </p>
          </div>
        </header>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between overflow-hidden">
            <div className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1.5 sm:gap-2">
              <UserMinus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" /> <span className="truncate">Sisa Piutang</span>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mt-2 truncate">
              <CurrencyDisplay amount={totalReceivables} />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between overflow-hidden">
            <div className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1.5 sm:gap-2">
              <HandCoins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0" /> <span className="truncate">Sisa Hutang</span>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 mt-2 truncate">
              <CurrencyDisplay amount={totalPayables} />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between overflow-hidden">
            <div className="text-xs sm:text-sm font-medium text-slate-500 flex items-start gap-1.5 sm:gap-2">
              <HandCoins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0 mt-0.5" /> <span className="leading-tight">Pembayaran Diterima</span>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 mt-2 truncate">
              <CurrencyDisplay amount={totalRepaidToUs} />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between overflow-hidden">
            <div className="text-xs sm:text-sm font-medium text-slate-500 flex items-start gap-1.5 sm:gap-2">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0 mt-0.5" /> <span className="leading-tight">Pembayaran Dilakukan</span>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-600 mt-2 truncate">
              <CurrencyDisplay amount={totalRepaidByUs} />
            </div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <LoanList loans={loans} accounts={accounts} />
      </FadeIn>
    </div>
  );
}
