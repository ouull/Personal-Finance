import { getGoals } from "@/features/goals/actions"
import { GoalList } from "@/features/goals/components/GoalList"
import { FadeIn } from "@/components/MotionWrapper"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Target } from "lucide-react"
import { GoalDialog } from "@/features/goals/components/GoalDialog"
import { getTranslation } from "@/lib/i18n"

export default async function GoalsPage() {
  const { t } = await getTranslation()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  const goalsResult = await getGoals()
  const goals = goalsResult.success ? goalsResult.data || [] : []

  return (
    <div className="space-y-8 pb-10">
      <FadeIn delay={0.1}>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hidden md:block">
              <Target className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 pb-1">{t.goalsPage?.title || "Financial Goals"}</h1>
              <p className="text-muted-foreground mt-1 text-base">
                {t.goalsPage?.description || "Set savings targets and track your progress towards them."}
              </p>
            </div>
          </div>
          <div className="flex gap-2"><GoalDialog /></div>
        </header>
      </FadeIn>

      <FadeIn delay={0.2}>
        <GoalList goals={goals} />
      </FadeIn>
    </div>
  )
}
