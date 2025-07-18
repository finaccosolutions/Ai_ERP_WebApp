// src/constants/geoData.ts

export const COUNTRIES = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    dialCode: '+91',
    taxConfig: {
      type: 'GST',
      rates: [0, 5, 12, 18, 28],
      registrationLabels: {
        main: 'GSTIN',
        secondary: 'PAN',
        tertiary: 'TAN',
      },
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    states: [
      { code: 'AP', name: 'Andhra Pradesh' },
      { code: 'AR', name: 'Arunachal Pradesh' },
      { code: 'AS', name: 'Assam' },
      { code: 'BR', name: 'Bihar' },
      { code: 'CT', name: 'Chhattisgarh' },
      { code: 'GA', name: 'Goa' },
      { code: 'GJ', name: 'Gujarat' },
      { code: 'HR', name: 'Haryana' },
      { code: 'HP', name: 'Himachal Pradesh' },
      { code: 'JH', name: 'Jharkhand' },
      { code: 'KA', name: 'Karnataka' },
      { code: 'KL', name: 'Kerala' },
      { code: 'MP', name: 'Madhya Pradesh' },
      { code: 'MH', name: 'Maharashtra' },
      { code: 'MN', name: 'Manipur' },
      { code: 'ML', name: 'Meghalaya' },
      { code: 'MZ', name: 'Mizoram' },
      { code: 'NL', name: 'Nagaland' },
      { code: 'OR', name: 'Odisha' },
      { code: 'PB', name: 'Punjab' },
      { code: 'RJ', name: 'Rajasthan' },
      { code: 'SK', name: 'Sikkim' },
      { code: 'TN', name: 'Tamil Nadu' },
      { code: 'TG', name: 'Telangana' },
      { code: 'TR', name: 'Tripura' },
      { code: 'UP', name: 'Uttar Pradesh' },
      { code: 'UK', name: 'Uttarakhand' },
      { code: 'WB', name: 'West Bengal' },
      { code: 'AN', name: 'Andaman and Nicobar Islands' },
      { code: 'CH', name: 'Chandigarh' },
      { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu' },
      { code: 'DL', name: 'Delhi' },
      { code: 'JK', name: 'Jammu and Kashmir' },
      { code: 'LA', name: 'Ladakh' },
      { code: 'LD', name: 'Lakshadweep' },
      { code: 'PY', name: 'Puducherry' },
    ],
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    dialCode: '+1',
    taxConfig: {
      type: 'Sales Tax',
      rates: [0, 2.9, 4, 4.5, 6, 7.25, 8.25], // Example rates
      registrationLabels: {
        main: 'Sales Tax ID',
        secondary: 'EIN',
      },
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    states: [
      { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
      { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
      { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
      { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
      { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
      { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
      { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
      { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
      { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
      { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
      { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
      { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
      { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
      { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
      { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
      { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
      { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    dialCode: '+44',
    taxConfig: {
      type: 'VAT',
      rates: [0, 5, 20],
      registrationLabels: {
        main: 'VAT No.',
        secondary: 'Company Reg. No.',
      },
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    states: [
      { code: 'ENG', name: 'England' },
      { code: 'SCT', name: 'Scotland' },
      { code: 'WLS', name: 'Wales' },
      { code: 'NIR', name: 'Northern Ireland' },
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    dialCode: '+1',
    taxConfig: {
      type: 'GST/PST/HST',
      rates: [5, 13, 15],
      registrationLabels: {
        main: 'GST/HST No.',
        secondary: 'Business No.',
      },
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    states: [
      { code: 'AB', name: 'Alberta' }, { code: 'BC', name: 'British Columbia' },
      { code: 'MB', name: 'Manitoba' }, { code: 'NB', name: 'New Brunswick' },
      { code: 'NL', name: 'Newfoundland and Labrador' }, { code: 'NS', name: 'Nova Scotia' },
      { code: 'ON', name: 'Ontario' }, { code: 'PE', name: 'Prince Edward Island' },
      { code: 'QC', name: 'Quebec' }, { code: 'SK', name: 'Saskatchewan' },
      { code: 'NT', name: 'Northwest Territories' }, { code: 'NU', name: 'Nunavut' },
      { code: 'YT', name: 'Yukon' },
    ],
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    dialCode: '+61',
    taxConfig: {
      type: 'GST',
      rates: [10],
      registrationLabels: {
        main: 'ABN',
        secondary: 'ACN',
      },
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    states: [
      { code: 'NSW', name: 'New South Wales' }, { code: 'VIC', name: 'Victoria' },
      { code: 'QLD', name: 'Queensland' }, { code: 'WA', name: 'Western Australia' },
      { code: 'SA', name: 'South Australia' }, { code: 'TAS', name: 'Tasmania' },
      { code: 'ACT', name: 'Australian Capital Territory' }, { code: 'NT', name: 'Northern Territory' },
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    dialCode: '+49',
    taxConfig: {
      type: 'VAT',
      rates: [7, 19],
      registrationLabels: {
        main: 'VAT ID',
        secondary: 'Tax No.',
      },
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    states: [
      { code: 'BW', name: 'Baden-Württemberg' }, { code: 'BY', name: 'Bavaria' },
      { code: 'BE', name: 'Berlin' }, { code: 'BB', name: 'Brandenburg' },
      { code: 'HB', name: 'Bremen' }, { code: 'HH', name: 'Hamburg' },
      { code: 'HE', name: 'Hesse' }, { code: 'MV', name: 'Mecklenburg-Vorpommern' },
      { code: 'NI', name: 'Lower Saxony' }, { code: 'NW', name: 'North Rhine-Westphalia' },
      { code: 'RP', name: 'Rhineland-Palatinate' }, { code: 'SL', name: 'Saarland' },
      { code: 'SN', name: 'Saxony' }, { code: 'ST', name: 'Saxony-Anhalt' },
      { code: 'SH', name: 'Schleswig-Holstein' }, { code: 'TH', name: 'Thuringia' },
    ],
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    dialCode: '+33',
    taxConfig: {
      type: 'VAT',
      rates: [2.1, 5.5, 10, 20],
      registrationLabels: {
        main: 'VAT No.',
        secondary: 'SIREN/SIRET',
      },
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    states: [
      { code: 'ARA', name: 'Auvergne-Rhône-Alpes' }, { code: 'BFC', name: 'Bourgogne-Franche-Comté' },
      { code: 'BRE', name: 'Brittany' }, { code: 'CVL', name: 'Centre-Val de Loire' },
      { code: 'COR', name: 'Corsica' }, { code: 'GES', name: 'Grand Est' },
      { code: 'HDF', name: 'Hauts-de-France' }, { code: 'IDF', name: 'Île-de-France' },
      { code: 'NOR', name: 'Normandy' }, { code: 'NAQ', name: 'Nouvelle-Aquitaine' },
      { code: 'OCC', name: 'Occitanie' }, { code: 'PDL', name: 'Pays de la Loire' },
      { code: 'PAC', name: 'Provence-Alpes-Côte d\'Azur' },
    ],
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    dialCode: '+81',
    taxConfig: {
      type: 'Consumption Tax',
      rates: [8, 10],
      registrationLabels: {
        main: 'Consumption Tax No.',
        secondary: 'Corporate No.',
      },
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    states: [
      { code: 'HKD', name: 'Hokkaido' }, { code: 'TJK', name: 'Tohoku' },
      { code: 'KTO', name: 'Kanto' }, { code: 'CBU', name: 'Chubu' },
      { code: 'KNS', name: 'Kansai' }, { code: 'CGK', name: 'Chugoku' },
      { code: 'SKK', name: 'Shikoku' }, { code: 'KYS', name: 'Kyushu' },
      { code: 'OKN', name: 'Okinawa' },
    ],
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    dialCode: '+65',
    taxConfig: {
      type: 'GST',
      rates: [9],
      registrationLabels: {
        main: 'GST Reg. No.',
        secondary: 'UEN',
      },
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    states: [
      { code: 'SG', name: 'Singapore' }, // Singapore is a city-state
    ],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    dialCode: '+971',
    taxConfig: {
      type: 'VAT',
      rates: [5],
      registrationLabels: {
        main: 'TRN',
        secondary: 'Trade License No.',
      },
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    states: [
      { code: 'AUH', name: 'Abu Dhabi' }, { code: 'DXB', name: 'Dubai' },
      { code: 'SHJ', name: 'Sharjah' }, { code: 'AJM', name: 'Ajman' },
      { code: 'UMM', name: 'Umm Al Quwain' }, { code: 'RAK', name: 'Ras Al Khaimah' },
      { code: 'FUJ', name: 'Fujairah' },
    ],
  },
];

export const getCountryByCode = (code: string) => {
  return COUNTRIES.find(country => country.code === code);
};

export const getStateByCode = (countryCode: string, stateCode: string) => {
  const country = getCountryByCode(countryCode);
  if (country) {
    return country.states.find(state => state.code === stateCode);
  }
  return undefined;
};

export const getPhoneCountryCodes = () => {
  return COUNTRIES.map(country => ({
    id: country.dialCode,
    name: `${country.flag} ${country.name} (${country.dialCode})`,
    dialCode: country.dialCode,
  }));
};
