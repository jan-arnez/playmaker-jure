import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en-SI", "sl-SI"],
  defaultLocale: "sl-SI", // Make Slovenian the default/root
  localePrefix: {
    mode: "as-needed",
    prefixes: {
      "sl-SI": "", // root: "/"
      "en-SI": "/en", // English under "/en"
    },
  },
});
