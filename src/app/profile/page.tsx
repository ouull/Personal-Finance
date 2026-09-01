import { getUserProfile } from "@/features/profile/actions";
import { ChangePasswordForm } from "@/features/profile/components/ChangePasswordForm";
import { FadeIn } from "@/components/MotionWrapper";
import { Card } from "@/components/ui/card";
import { getTranslation } from "@/lib/i18n";
import { format } from "date-fns";
import { id, enUS } from "date-fns/locale";

export default async function ProfilePage() {
  const profileRes = await getUserProfile();
  const { t, language } = await getTranslation();

  if (!profileRes.success || !profileRes.data) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">
          {t.common.error || "Failed to load profile"}
        </p>
      </div>
    );
  }

  const user = profileRes.data;
  const dateLocale = language === "ID" ? id : enUS;
  const memberSince = user.createdAt
    ? format(new Date(user.createdAt), "dd MMMM yyyy", { locale: dateLocale })
    : "-";

  const tProfile = (t as any).profile || {};

  return (
    <div className="space-y-8 pb-10 max-w-4xl mx-auto">
      <FadeIn delay={0.1}>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 pb-1">
              {tProfile.title || "Profil"}
            </h1>
            <p className="text-muted-foreground mt-1 text-base">
              {tProfile.description ||
                "Kelola informasi akun dan kata sandi Anda."}
            </p>
          </div>
        </header>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6 space-y-6">
            <h2 className="text-xl font-bold tracking-tight text-slate-800">
              {tProfile.infoTitle || "Informasi Akun"}
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {tProfile.name || "Nama"}
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {user.name || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  {tProfile.email || "Email"}
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {user.email}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  {tProfile.memberSince || "Bergabung Sejak"}
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {memberSince}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  {tProfile.language || "Bahasa Utama"}
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {user.language === "ID" ? "Bahasa Indonesia" : "English"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <h2 className="text-xl font-bold tracking-tight text-slate-800">
              {tProfile.passwordTitle || "Ubah Kata Sandi"}
            </h2>
            <ChangePasswordForm translations={tProfile} />
          </Card>
        </div>
      </FadeIn>
    </div>
  );
}
