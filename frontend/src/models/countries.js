function countryCodeToFlag(code) {
  return String.fromCodePoint(...code.split('').map((x) => 127397 + x.charCodeAt()));
}

export const COUNTRY_OPTIONS = [
  { code: 'CO', locale: 'es-CO', lang: 'es', labelKey: 'countryColombia', flag: countryCodeToFlag('CO') },
  { code: 'MX', locale: 'es-MX', lang: 'es', labelKey: 'countryMexico', flag: countryCodeToFlag('MX') },
  { code: 'US', locale: 'en-US', lang: 'en', labelKey: 'countryUnitedStates', flag: countryCodeToFlag('US') },
];

export function getCountryFromStorage() {
  const saved = localStorage.getItem('fitness-country') || 'CO';
  return COUNTRY_OPTIONS.find((country) => country.code === saved)?.code || COUNTRY_OPTIONS[0].code;
}
