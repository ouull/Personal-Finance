import { SettingsPanel } from "@/features/settings/components/SettingsPanel";
import { FadeIn } from "@/components/MotionWrapper";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { getTranslation } from "@/lib/i18n";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { language, t } = await getTranslation();

  return (
    <div className="space-y-8 pb-10">
      <FadeIn delay={0.1}>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hidden md:block">
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 pb-1">
                {t.settings.title}
              </h1>
              <p className="text-muted-foreground mt-1 text-base">
                {t.settings.description}
              </p>
            </div>
          </div>
        </header>
      </FadeIn>

      <FadeIn delay={0.2}>
        <SettingsPanel
          initialLanguage={language}
          t={{ ...t.settings, ...t.common }}
        />
      </FadeIn>
    </div>
  );
}
