/**
 * Comprehensive city-to-region mapping for Slovenia
 * This function automatically determines the region for any city in Slovenia.
 * Used for filtering facilities by region and assigning regions to new facilities.
 */

/**
 * Normalizes a city name for matching (handles diacritics and case)
 */
function normalizeCityName(city: string): string {
  return city
    .toLowerCase()
    .trim()
    .replace(/š/g, "s")
    .replace(/č/g, "c")
    .replace(/ž/g, "z")
    .replace(/ć/g, "c")
    .replace(/đ/g, "d")
    .replace(/ć/g, "c");
}

/**
 * Maps a city name to its corresponding region in Slovenia
 * Handles variations in spelling, diacritics, and case
 * 
 * @param city - The city name (can be with or without diacritics, any case)
 * @returns The region name or "Osrednja Slovenija" as default
 */
export function getRegionFromCity(city: string): string {
  if (!city || typeof city !== "string") {
    return "Osrednja Slovenija";
  }

  const normalized = normalizeCityName(city);

  // Comprehensive mapping of all Slovenian cities to regions
  const cityToRegion: Record<string, string> = {
    // Osrednja Slovenija
    "ljubljana": "Osrednja Slovenija",
    "domzale": "Osrednja Slovenija",
    "domžale": "Osrednja Slovenija",
    "litija": "Osrednja Slovenija",
    "logatec": "Osrednja Slovenija",
    "preserje": "Osrednja Slovenija",
    "izlake": "Osrednja Slovenija",
    "vrhnika": "Osrednja Slovenija",
    "grosuplje": "Osrednja Slovenija",
    "ivancna gorica": "Osrednja Slovenija",
    "ivančna gorica": "Osrednja Slovenija",
    "kamnik": "Osrednja Slovenija",
    "naklo": "Osrednja Slovenija",
    "medvode": "Osrednja Slovenija",
    "trzin": "Osrednja Slovenija",
    "menges": "Osrednja Slovenija",
    "mengeš": "Osrednja Slovenija",
    "smartno pri litiji": "Osrednja Slovenija",
    "šmartno pri litiji": "Osrednja Slovenija",
    "cerklje na gorenjskem": "Osrednja Slovenija",
    "dobrepolje": "Osrednja Slovenija",

    // Gorenjska
    "kranj": "Gorenjska",
    "bled": "Gorenjska",
    "jesenice": "Gorenjska",
    "skofja loka": "Gorenjska",
    "škofja loka": "Gorenjska",
    "kranjska gora": "Gorenjska",
    "radovljica": "Gorenjska",
    "trzic": "Gorenjska",
    "tržič": "Gorenjska",
    "zirovnica": "Gorenjska",
    "žirovnica": "Gorenjska",
    "bohinjska bistrica": "Gorenjska",
    "bohinj": "Gorenjska",
    "mojstrana": "Gorenjska",
    "ratece": "Gorenjska",
    "rateče": "Gorenjska",
    "lesce": "Gorenjska",
    "lesče": "Gorenjska",
    "krize": "Gorenjska",
    "ziri": "Gorenjska",
    "žiri": "Gorenjska",

    // Podravska
    "maribor": "Podravska",
    "ptuj": "Podravska",
    "murska sobota": "Podravska",
    "lenart": "Podravska",
    "pesnica": "Podravska",
    "duplek": "Podravska",
    "race": "Podravska",
    "rače": "Podravska",
    "starse": "Podravska",
    "starše": "Podravska",
    "kidricevo": "Podravska",
    "kidričevo": "Podravska",
    "ormoz": "Podravska",
    "ormož": "Podravska",
    "ljutomer": "Podravska",
    "slovenska bistrica": "Podravska",
    "videm": "Podravska",

    // Savinjska
    "celje": "Savinjska",
    "velenje": "Savinjska",
    "slovenske konjice": "Savinjska",
    "rogaska slatina": "Savinjska",
    "rogaška slatina": "Savinjska",
    "lasko": "Savinjska",
    "laško": "Savinjska",
    "smarje pri jelsah": "Savinjska",
    "šmarje pri jelšah": "Savinjska",
    "zalec": "Savinjska",
    "žalec": "Savinjska",
    "vojnik": "Savinjska",
    "sentjur": "Savinjska",
    "šentjur": "Savinjska",
    "braslovce": "Savinjska",
    "braslovče": "Savinjska",
    "polzela": "Savinjska",
    "prebold": "Savinjska",
    "sempeter v savinjski dolini": "Savinjska",
    "šempeter v savinjski dolini": "Savinjska",
    "store": "Savinjska",
    "štore": "Savinjska",

    // Obalno-kraška
    "koper": "Obalno-kraška",
    "piran": "Obalno-kraška",
    "izola": "Obalno-kraška",
    "portoroz": "Obalno-kraška",
    "portorož": "Obalno-kraška",
    "ankaran": "Obalno-kraška",
    "divaca": "Obalno-kraška",
    "divača": "Obalno-kraška",
    "komen": "Obalno-kraška",
    "muggia": "Obalno-kraška",
    "skofije": "Obalno-kraška",
    "škofije": "Obalno-kraška",
    "dekani": "Obalno-kraška",

    // Goriška
    "nova gorica": "Goriška",
    "ajdovscina": "Goriška",
    "ajdovščina": "Goriška",
    "tolmin": "Goriška",
    "bovec": "Goriška",
    "kanal": "Goriška",
    "kobarid": "Goriška",
    "sempeter pri gorici": "Goriška",
    "šempeter pri gorici": "Goriška",
    "miren": "Goriška",
    "rence": "Goriška",
    "renče": "Goriška",
    "vipava": "Goriška",
    "deskle": "Goriška",
    "idrija": "Goriška",

    // Jugovzhodna Slovenija
    "novo mesto": "Jugovzhodna Slovenija",
    "crnomelj": "Jugovzhodna Slovenija",
    "metlika": "Jugovzhodna Slovenija",
    "semic": "Jugovzhodna Slovenija",
    "dolenjske toplice": "Jugovzhodna Slovenija",
    "kocevje": "Jugovzhodna Slovenija",
    "ribnica": "Jugovzhodna Slovenija",
    "zuzemberk": "Jugovzhodna Slovenija",
    "trebnje": "Jugovzhodna Slovenija",
    "mirna": "Jugovzhodna Slovenija",
    "bela krajina": "Jugovzhodna Slovenija",
    "otocec": "Jugovzhodna Slovenija",
    "krsko": "Jugovzhodna Slovenija", // Krško is in Jugovzhodna, not Posavska
    "brezice": "Jugovzhodna Slovenija", // Brežice is in Jugovzhodna, not Posavska

    // Zasavska
    "trbovlje": "Zasavska",
    "zagorje ob savi": "Zasavska",
    "hrastnik": "Zasavska",
    "rimske toplice": "Zasavska",

    // Posavska
    "sevnica": "Posavska",
    "bistrica ob sotli": "Posavska",
    "radece": "Posavska",
    "radeče": "Posavska",
    "kostanjevica na krki": "Posavska",
    "sveti jurij ob scavnici": "Posavska",

    // Primorsko-notranjska (also known as Notranjsko-kraška)
    "postojna": "Primorsko-notranjska",
    "ilirska bistrica": "Primorsko-notranjska",
    "cerknica": "Primorsko-notranjska",
    "pivka": "Primorsko-notranjska",
    "loska dolina": "Primorsko-notranjska",
    "bloke": "Primorsko-notranjska",
    "loski potok": "Primorsko-notranjska",
    "hrpelje-kozina": "Primorsko-notranjska",
    "sezana": "Primorsko-notranjska",

    // Koroška
    "ravne na koroskem": "Koroška",
    "dravograd": "Koroška",
    "mezica": "Koroška",
    "prevalje": "Koroška",
    "vuzenica": "Koroška",
    "muta": "Koroška",
    "radlje ob dravi": "Koroška",
    "slovenj gradec": "Koroška",
    "mislinja": "Koroška",

    // Pomurska
    "lendava": "Pomurska",
    "gornja radgona": "Pomurska",
    "radenci": "Pomurska",
    "beltinci": "Pomurska",
    "turnisce": "Pomurska",
    "puconci": "Pomurska",
    "tishina": "Pomurska",
    "hodos": "Pomurska",
    "moravske toplice": "Pomurska",
    "gornji petrovci": "Pomurska",
    "salovci": "Pomurska",
    "cankova": "Pomurska",
    "rogasovci": "Pomurska",
    "verzej": "Pomurska",
    "krizevci": "Pomurska",
    "velika polana": "Pomurska",
    "kobilje": "Pomurska",
    "odranci": "Pomurska",
    "dobrovnik": "Pomurska",
    "kuzma": "Pomurska",
  };

  return cityToRegion[normalized] || "Osrednja Slovenija";
}

/**
 * Gets all cities for a specific region
 * Useful for filtering facilities by region
 */
export function getCitiesInRegion(region: string): string[] {
  const regionToCities: Record<string, string[]> = {
    "Osrednja Slovenija": [
      "Ljubljana", "Domžale", "Kamnik", "Vrhnika", "Naklo", "Medvode",
      "Škofja Loka", "Cerklje na Gorenjskem", "Grosuplje", "Ivančna Gorica",
      "Litija", "Trzin", "Mengeš", "Šmartno pri Litiji", "Logatec",
      "Preserje", "Izlake", "Dobrepolje"
    ],
    "Gorenjska": [
      "Kranj", "Bled", "Jesenice", "Škofja Loka", "Kranjska Gora",
      "Radovljica", "Tržič", "Žirovnica", "Bohinjska Bistrica", "Bohinj",
      "Mojstrana", "Rateče", "Lesce", "Krize", "Žiri"
    ],
    "Podravska": [
      "Maribor", "Ptuj", "Slovenj Gradec", "Murska Sobota", "Lenart",
      "Pesnica", "Duplek", "Rače", "Starše", "Kidričevo", "Ormož",
      "Ljutomer", "Gornja Radgona", "Radenci", "Turnišče", "Slovenska Bistrica", "Videm"
    ],
    "Savinjska": [
      "Celje", "Velenje", "Slovenske Konjice", "Rogaška Slatina",
      "Laško", "Šmarje pri Jelšah", "Žalec", "Vojnik", "Šentjur",
      "Braslovče", "Polzela", "Prebold", "Radeče", "Šempeter v Savinjski dolini", "Štore"
    ],
    "Obalno-kraška": [
      "Koper", "Piran", "Izola", "Sežana", "Portorož", "Ankaran",
      "Hrpelje-Kozina", "Divača", "Komen", "Muggia", "Škofije", "Dekani"
    ],
    "Goriška": [
      "Nova Gorica", "Ajdovščina", "Tolmin", "Bovec", "Kanal",
      "Kobarid", "Šempeter pri Gorici", "Miren", "Renče", "Vipava",
      "Deskle", "Idrija"
    ],
    "Jugovzhodna Slovenija": [
      "Novo Mesto", "Krško", "Brežice", "Črnomelj", "Metlika",
      "Semič", "Dolenjske Toplice", "Kočevje", "Ribnica", "Žužemberk",
      "Trebnje", "Otočec", "Mirna", "Bela Krajina"
    ],
    "Zasavska": [
      "Trbovlje", "Zagorje ob Savi", "Hrastnik", "Litija", "Radeče",
      "Laško", "Sevnica", "Bistrica ob Sotli", "Rimske Toplice"
    ],
    "Posavska": [
      "Krško", "Brežice", "Sevnica", "Bistrica ob Sotli", "Radeče",
      "Kostanjevica na Krki", "Sveti Jurij ob Ščavnici"
    ],
    "Primorsko-notranjska": [
      "Postojna", "Ilirska Bistrica", "Cerknica", "Pivka",
      "Loška dolina", "Bloke", "Loški Potok", "Hrpelje-Kozina", "Sežana"
    ],
    "Koroška": [
      "Ravne na Koroškem", "Dravograd", "Mežica", "Prevalje",
      "Vuzenica", "Muta", "Radlje ob Dravi", "Slovenj Gradec", "Mislinja"
    ],
    "Pomurska": [
      "Murska Sobota", "Lendava", "Gornja Radgona", "Radenci",
      "Beltinci", "Turnišče", "Puconci", "Tišina", "Hodoš", "Moravske Toplice",
      "Gornji Petrovci", "Šalovci", "Cankova", "Rogašovci", "Sveti Jurij ob Ščavnici",
      "Veržej", "Križevci", "Velika Polana", "Kobilje", "Odranci", "Dobrovnik", "Kuzma"
    ]
  };

  return regionToCities[region] || [];
}

