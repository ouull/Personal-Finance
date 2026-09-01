import { getAccounts } from "@/features/accounts/actions";
import { getTransactions } from "@/features/transactions/actions";
import { TransactionList } from "@/features/transactions/components/TransactionList";
import { TransactionDialog } from "@/features/transactions/components/TransactionDialog";
import { FadeIn } from "@/components/MotionWrapper";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import { getCategories } from "@/features/categories/actions";

import { getTranslation } from "@/lib/i18n";

export default async function TransactionsPage() {
  const { t } = await getTranslation();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const [txResult, allAccountsResult, categoriesResult] = await Promise.all([
    getTransactions(),
    getAccounts(true),
    getCategories(undefined, false),
  ]);

  const transactions = txResult.success ? txResult.data || [] : [];
  const allAccounts = allAccountsResult.success
    ? allAccountsResult.data || []
    : [];
  const activeAccounts = allAccounts.filter((a: any) => a.isActive);
  const categories = categoriesResult.success
    ? categoriesResult.data || []
    : [];

  return (
    <div className="space-y-8 pb-10 pt-4">
      <FadeIn delay={0.2}>
        <TransactionList
          transactions={transactions}
          accounts={allAccounts}
          categories={categories}
          groupTranslations={(t as any).groups || {}}
        />
      </FadeIn>
    </div>
  );
}
