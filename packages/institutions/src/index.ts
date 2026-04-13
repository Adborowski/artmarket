// Generated from institution-emails.csv — edit that file to add/remove institutions.

export type Institution = {
  name: string
  shortName: string
  city: string
  domain: string
}

export const INSTITUTIONS: Institution[] = [
  { name: 'Akademia Sztuk Pięknych w Warszawie',                          shortName: 'ASP Warszawa',  city: 'Warszawa',      domain: 'asp.waw.pl' },
  { name: 'Akademia Sztuk Pięknych w Krakowie',                           shortName: 'ASP Kraków',    city: 'Kraków',        domain: 'asp.krakow.pl' },
  { name: 'Akademia Sztuk Pięknych w Łodzi',                              shortName: 'ASP Łódź',      city: 'Łódź',          domain: 'asp.lodz.pl' },
  { name: 'Akademia Sztuk Pięknych we Wrocławiu',                         shortName: 'ASP Wrocław',   city: 'Wrocław',       domain: 'asp.wroc.pl' },
  { name: 'Akademia Sztuk Pięknych w Gdańsku',                            shortName: 'ASP Gdańsk',    city: 'Gdańsk',        domain: 'asp.gda.pl' },
  { name: 'Akademia Sztuk Pięknych w Katowicach',                         shortName: 'ASP Katowice',  city: 'Katowice',      domain: 'asp.katowice.pl' },
  { name: 'Uniwersytet Artystyczny w Poznaniu',                           shortName: 'UAP Poznań',    city: 'Poznań',        domain: 'uap.edu.pl' },
  { name: 'Uniwersytet Muzyczny Fryderyka Chopina',                       shortName: 'UMFC',          city: 'Warszawa',      domain: 'chopin.edu.pl' },
  { name: 'Akademia Muzyczna w Krakowie',                                 shortName: 'AM Kraków',     city: 'Kraków',        domain: 'amuz.krakow.pl' },
  { name: 'Akademia Muzyczna w Katowicach',                               shortName: 'AM Katowice',   city: 'Katowice',      domain: 'am.katowice.pl' },
  { name: 'Akademia Muzyczna w Gdańsku',                                  shortName: 'AM Gdańsk',     city: 'Gdańsk',        domain: 'amuz.gda.pl' },
  { name: 'Akademia Muzyczna w Łodzi',                                    shortName: 'AM Łódź',       city: 'Łódź',          domain: 'amuz.lodz.pl' },
  { name: 'Akademia Muzyczna w Bydgoszczy',                               shortName: 'AM Bydgoszcz',  city: 'Bydgoszcz',     domain: 'amuz.bydgoszcz.pl' },
  { name: 'Akademia Muzyczna w Poznaniu',                                 shortName: 'AM Poznań',     city: 'Poznań',        domain: 'amuz.edu.pl' },
  { name: 'Państwowa Wyższa Szkoła Filmowa w Łodzi',                      shortName: 'PWSFTViT',      city: 'Łódź',          domain: 'pwsftviT.pl' },
  { name: 'Akademia Sztuki w Szczecinie',                                 shortName: 'AS Szczecin',   city: 'Szczecin',      domain: 'akademiasztuki.eu' },
  { name: 'Uniwersytet Mikołaja Kopernika (Wydział Sztuk Pięknych)',       shortName: 'UMK Toruń',     city: 'Toruń',         domain: 'umk.pl' },
  { name: 'Uniwersytet Śląski (Wydział Sztuki i Nauk o Edukacji)',         shortName: 'UŚ Katowice',   city: 'Katowice',      domain: 'us.edu.pl' },
  { name: 'Uniwersytet Marii Curie-Skłodowskiej (Instytut Sztuk Pięknych)', shortName: 'UMCS Lublin',  city: 'Lublin',        domain: 'umcs.pl' },
  { name: 'Uniwersytet Zielonogórski (Instytut Sztuk Wizualnych)',         shortName: 'UZ Zielona Góra', city: 'Zielona Góra', domain: 'uz.zgora.pl' },
  { name: 'Uniwersytet Jana Kochanowskiego (Instytut Sztuk Wizualnych)',   shortName: 'UJK Kielce',    city: 'Kielce',        domain: 'ujk.edu.pl' },
  { name: 'Uniwersytet Warmińsko-Mazurski (Wydział Sztuki)',               shortName: 'UWM Olsztyn',   city: 'Olsztyn',       domain: 'uwm.edu.pl' },
]

const domainMap = new Map(INSTITUTIONS.map((i) => [i.domain.toLowerCase(), i]))

export function getInstitutionByEmail(email: string): Institution | null {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null
  return domainMap.get(domain) ?? null
}
