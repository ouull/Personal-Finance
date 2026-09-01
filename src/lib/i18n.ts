import { getUserSettings } from "@/features/settings/actions";
import { cookies } from "next/headers";
import idDict from "../../messages/id.json";
import enDict from "../../messages/en.json";

export async function getTranslation() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;

  let language = "ID";

  if (localeCookie) {
    language = localeCookie;
  } else {
    // Fallback to database
    const settingsResult = await getUserSettings();
    if (settingsResult.success && settingsResult.data) {
      language = settingsResult.data.language;
    }
  }

  const dict = language === "EN" ? enDict : idDict;

  return {
    language,
    t: dict,
  };
}
