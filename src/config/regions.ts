export const cityToRegion: Record<string, string> = {
  Kranj: "Gorenjska",
  Koper: "Obalno-kraška",
  Ljubljana: "Osrednja Slovenija",
  Maribor: "Podravska",
  Celje: "Savinjska",
  "Novo Mesto": "Jugovzhodna Slovenija",
  "Murska Sobota": "Pomurska",
  "Nova Gorica": "Goriška",
  Ptuj: "Podravska",
  Velenje: "Savinjska",
  Trbovlje: "Zasavska",
  Jesenice: "Gorenjska",
  Domžale: "Osrednja Slovenija",
  "Škofja Loka": "Gorenjska",
  Izola: "Obalno-kraška",
  Piran: "Obalno-kraška",
  Postojna: "Primorsko-notranjska",
  Logatec: "Osrednja Slovenija",
  Vrhnika: "Osrednja Slovenija",
  Kočevje: "Jugovzhodna Slovenija",
  Brežice: "Posavska",
  Krško: "Posavska",
  Sevnica: "Posavska",
  "Zagorje ob Savi": "Zasavska",
  Hrastnik: "Zasavska",
  Tržič: "Gorenjska",
  Radovljica: "Gorenjska",
  Bled: "Gorenjska",
  Bohinj: "Gorenjska",
  Tolmin: "Goriška",
  Bovec: "Goriška",
  Kobarid: "Goriška",
  Idrija: "Goriška",
  Ajdovščina: "Goriška",
  Sežana: "Obalno-kraška",
  Divača: "Obalno-kraška",
  "Ilirska Bistrica": "Primorsko-notranjska",
  Cerknica: "Primorsko-notranjska",
  "Loški Potok": "Primorsko-notranjska",
  Ribnica: "Jugovzhodna Slovenija",
  Črnomelj: "Jugovzhodna Slovenija",
  Semič: "Jugovzhodna Slovenija",
  Metlika: "Jugovzhodna Slovenija",
  "Bela Krajina": "Jugovzhodna Slovenija",
  Žužemberk: "Jugovzhodna Slovenija",
  Trebnje: "Jugovzhodna Slovenija",
  Mirna: "Jugovzhodna Slovenija",
  Grosuplje: "Osrednja Slovenija",
  "Ivančna Gorica": "Osrednja Slovenija",
  Dobrepolje: "Osrednja Slovenija",
  Videm: "Podravska",
  Ormož: "Podravska",
  Ljutomer: "Podravska",
  "Gornja Radgona": "Pomurska",
  Beltinci: "Pomurska",
  Turnišče: "Pomurska",
  "Gornji Petrovci": "Pomurska",
  "Moravske Toplice": "Pomurska",
  Kuzma: "Pomurska",
  Radenci: "Pomurska",
  Puconci: "Pomurska",
  Lendava: "Pomurska",
  Dobrovnik: "Pomurska",
  Hodoš: "Pomurska",
  Šalovci: "Pomurska",
  Tišina: "Pomurska",
  Cankova: "Pomurska",
  Rogašovci: "Pomurska",
  "Sveti Jurij ob Ščavnici": "Pomurska",
  Veržej: "Pomurska",
  Križevci: "Pomurska",
  "Velika Polana": "Pomurska",
  Kobilje: "Pomurska",
  Odranci: "Pomurska",
  Grad: "Pomurska",
};

export const slovenianRegions = [
  "Gorenjska", "Goriška", "Jugovzhodna Slovenija", "Koroška",
  "Obalno-kraška", "Osrednja Slovenija", "Podravska", "Pomurska",
  "Posavska", "Primorsko-notranjska", "Savinjska", "Zasavska"
];

// Region names with English descriptions for bilingual support
export const regionTranslations: Record<string, { sl: string; en: string }> = {
  "Osrednja Slovenija": { sl: "Osrednja Slovenija", en: "Central Slovenia" },
  "Gorenjska": { sl: "Gorenjska", en: "Upper Carniola" },
  "Podravska": { sl: "Podravska", en: "Drava Region" },
  "Savinjska": { sl: "Savinjska", en: "Savinja Region" },
  "Obalno-kraška": { sl: "Obalno-kraška", en: "Coastal–Karst" },
  "Goriška": { sl: "Goriška", en: "Gorizia Region" },
  "Jugovzhodna Slovenija": { sl: "Jugovzhodna Slovenija", en: "Southeast Slovenia" },
  "Zasavska": { sl: "Zasavska", en: "Central Sava Region" },
  "Posavska": { sl: "Posavska", en: "Lower Sava Region" },
  "Primorsko-notranjska": { sl: "Primorsko-notranjska", en: "Littoral–Inner Carniola" },
  "Koroška": { sl: "Koroška", en: "Carinthia" },
  "Pomurska": { sl: "Pomurska", en: "Mura Region" }
};

export function getRegionFromCity(city: string): string {
  return cityToRegion[city] || "Osrednja Slovenija";
}

export function getCitiesFromRegion(region: string): string[] {
  return Object.keys(cityToRegion).filter(city => cityToRegion[city] === region);
}

export function getRegionDisplayName(region: string, locale: string = "sl"): string {
  const translation = regionTranslations[region];
  if (!translation) return region;
  return locale === "en" ? `${translation.sl} (${translation.en})` : translation.sl;
}
