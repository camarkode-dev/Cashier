export type SupportedCountry = 'EG' | 'SA' | 'AE' | 'US';

type RegionalConfig = {
  country: SupportedCountry;
  label: string;
  currency: string;
  locale: string;
};

export const REGIONAL_CONFIG: Record<SupportedCountry, RegionalConfig> = {
  EG: { country: 'EG', label: 'مصر', currency: 'EGP', locale: 'ar-EG' },
  SA: { country: 'SA', label: 'السعودية', currency: 'SAR', locale: 'ar-SA' },
  AE: { country: 'AE', label: 'الإمارات', currency: 'AED', locale: 'ar-AE' },
  US: { country: 'US', label: 'الولايات المتحدة', currency: 'USD', locale: 'en-US' },
};

export const COUNTRY_OPTIONS = Object.values(REGIONAL_CONFIG);

export function getRegionalConfig(country: SupportedCountry = 'EG') {
  return REGIONAL_CONFIG[country] || REGIONAL_CONFIG.EG;
}

export function getCountryByCurrency(currency?: string | null): SupportedCountry {
  const found = COUNTRY_OPTIONS.find((option) => option.currency === currency);
  return found?.country || 'EG';
}

export function getLocaleForCurrency(currency?: string | null) {
  const found = COUNTRY_OPTIONS.find((option) => option.currency === currency);
  return found?.locale || REGIONAL_CONFIG.EG.locale;
}

export function resolveAppCurrency(
  tenantCurrency?: string | null,
  settingsCountry?: SupportedCountry | null,
  settingsCurrency?: string | null,
) {
  if (settingsCountry) return getRegionalConfig(settingsCountry).currency;
  if (settingsCurrency) return settingsCurrency;
  if (tenantCurrency) return tenantCurrency;
  return REGIONAL_CONFIG.EG.currency;
}
