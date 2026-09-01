"use client";

import { useState } from "react";
import { updateLanguage, resetAllFinancialData } from "../actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle, Globe } from "lucide-react";

interface SettingsPanelProps {
  initialLanguage: string;
  t: any; // simple translation object for settings
}

export function SettingsPanel({ initialLanguage, t }: SettingsPanelProps) {
  const [language, setLanguage] = useState(initialLanguage);
  const [isSavingLang, setIsSavingLang] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  async function handleLanguageChange(val: string) {
    setLanguage(val);
    setIsSavingLang(true);
    const res = await updateLanguage(val);
    setIsSavingLang(false);
    if (res.success) {
      toast.success(t.success);
      // Reload page to apply new language immediately across all server components
      window.location.reload();
    } else {
      toast.error(t.error);
    }
  }

  async function handleReset() {
    const confirm = window.confirm(t.resetConfirm);
    if (!confirm) return;

    setIsResetting(true);
    const res = await resetAllFinancialData();
    setIsResetting(false);

    if (res.success) {
      toast.success(t.resetSuccess);
      window.location.href = "/";
    } else {
      toast.error(t.error);
    }
  }

  return (
    <div className="space-y-8">
      {/* Language Preferences */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">
              {t.language}
            </h2>
            <p className="text-sm text-slate-500 mt-1">{t.languageDesc}</p>
          </div>
        </div>

        <div className="max-w-xs">
          <Select
            value={language}
            onValueChange={(val: any) => handleLanguageChange(val)}
            disabled={isSavingLang}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ID">Bahasa Indonesia</SelectItem>
              <SelectItem value="EN">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-red-50/50 p-6 rounded-2xl border border-red-200 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-red-800">
              {t.dangerZone}
            </h2>
            <p className="text-sm text-red-600/80 mt-1">{t.resetDesc}</p>
          </div>
        </div>

        <Button
          variant="destructive"
          onClick={handleReset}
          disabled={isResetting}
          className="font-bold shadow-sm"
        >
          {isResetting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <AlertTriangle className="w-4 h-4 mr-2" />
          )}
          {isResetting ? t.loading : t.resetData}
        </Button>
      </section>
    </div>
  );
}
