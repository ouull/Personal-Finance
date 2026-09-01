import { getAccounts } from "@/features/accounts/actions";
import {
  getCategories,
  getFrequentCategories,
} from "@/features/categories/actions";
import { getMerchants } from "@/features/merchants/actions";
import { QuickCapture } from "./QuickCapture";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { getTranslation } from "@/lib/i18n";

export async function QuickCaptureWrapper() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { t } = await getTranslation();

  const [accountsRes, categoriesRes, merchantsRes, frequentRes] =
    await Promise.all([
      getAccounts(),
      getCategories(),
      getMerchants(),
      getFrequentCategories(4),
    ]);

  const accounts = accountsRes.success ? accountsRes.data || [] : [];
  const categories = categoriesRes.success ? categoriesRes.data || [] : [];
  const merchants = merchantsRes.success ? merchantsRes.data || [] : [];
  const frequentCategories = frequentRes.success ? frequentRes.data || [] : [];

  return (
    <QuickCapture
      accounts={accounts}
      categories={categories}
      merchants={merchants}
      frequentCategories={frequentCategories}
      groupTranslations={(t as any).groups || {}}
    />
  );
}
