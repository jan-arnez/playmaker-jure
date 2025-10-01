import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en-SI", "sl-SI"],

  // Used when no locale matches
  defaultLocale: "en-SI",
  localePrefix: "always",
});
