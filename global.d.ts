import type { formats } from "@/i18n/request";
import type { routing } from "@/i18n/routing";
import type enSI from "./messages/en-SI.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof enSI;
    Formats: typeof formats;
  }
}
