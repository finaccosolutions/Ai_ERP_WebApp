// src/constants/geoData.ts

export const COUNTRIES = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    dialCode: '+91',
    defaultCurrency: 'INR',
    defaultFiscalYearStart: '04-01', // April 1st
    defaultFiscalYearEnd: '03-31',   // March 31st
    defaultDecimalPlaces: 2,
    taxConfig: {
      type: 'GST',
      rates: [0, 5, 12, 18, 28],
      registrationLabels: {
        main: 'GSTIN',
        secondary: 'PAN',
        tertiary: 'TAN',
      },
    },
    complianceModules: {
      gstr1Enabled: true,
      gstr3bEnabled: true,
      ewayBillEnabled: true,
      tdsEnabled: true,
      tcsEnabled: true,
    },
    chartOfAccountsTemplate: {
      // Simplified template for India-specific tax accounts
      taxAccounts: [
        { account_code: '21401', account_name: 'CGST Payable', account_type: 'liability', account_group: 'Duties & Taxes Payable', balance_type: 'credit' },
        { account_code: '21402', account_name: 'SGST Payable', account_type: 'liability', account_group: 'Duties & Taxes Payable', balance_type: 'credit' },
        { account_code: '21403', account_name: 'IGST Payable', account_type: 'liability', account_group: 'Duties & Taxes Payable', balance_type: 'credit' },
        { account_code: '21404', account_name: 'TDS Payable', account_type: 'liability', account_group: 'Duties & Taxes Payable', balance_type: 'credit' },
        { account_code: '21405', account_name: 'TCS Payable', account_type: 'liability', account_group: 'Duties & Taxes Payable', balance_type: 'credit' },
      ],
      // Other specific accounts can be added here
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    businessTypes: [
      { id: 'sole_proprietorship', name: 'Proprietorship' },
      { id: 'partnership', name: 'Partnership Firm' },
      { id: 'private_limited', name: 'Private Limited Company (Pvt Ltd)' },
      { id: 'public_limited', name: 'Public Limited Company (Ltd)' },
      { id: 'llp', name: 'Limited Liability Partnership (LLP)' },
      { id: 'opc', name: 'One Person Company (OPC)' },
      { id: 'section_8', name: 'Section 8 Company (Non-Profit)' },
      { id: 'cooperative', name: 'Cooperative' },
      { id: 'government', name: 'Government Organization' },
      { id: 'trust_society', name: 'Trust / Society' },
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
    defaultCurrency: 'USD',
    defaultFiscalYearStart: '01-01', // January 1st
    defaultFiscalYearEnd: '12-31',   // December 31st
    defaultDecimalPlaces: 2,
    taxConfig: {
      type: 'Sales Tax',
      rates: [0, 2.9, 4, 4.5, 6, 7.25, 8.25], // Example rates
      registrationLabels: {
        main: 'Sales Tax ID',
        secondary: 'EIN',
        tertiary: '', // No tertiary for US example
      },
    },
    complianceModules: {
      salesTaxReportsEnabled: true,
      federalTaxFormsEnabled: true,
    },
    chartOfAccountsTemplate: {
      taxAccounts: [
        { account_code: '21401', account_name: 'Sales Tax Payable', account_type: 'liability', account_group: 'Current Liabilities', balance_type: 'credit' },
      ],
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    businessTypes: [
      { id: 'sole_proprietorship', name: 'Sole Proprietorship' },
      { id: 'partnership', name: 'Partnership' },
      { id: 'llc', name: 'Limited Liability Company (LLC)' },
      { id: 's_corporation', name: 'S Corporation' },
      { id: 'c_corporation', name: 'C Corporation' },
      { id: 'non_profit_501c3', name: 'Non-Profit Organization (501(c)(3))' },
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
    defaultCurrency: 'GBP',
    defaultFiscalYearStart: '04-06', // April 6th
    defaultFiscalYearEnd: '04-05',   // April 5th
    defaultDecimalPlaces: 2,
    taxConfig: {
      type: 'VAT',
      rates: [0, 5, 20],
      registrationLabels: {
        main: 'VAT No.',
        secondary: 'Company Reg. No.',
        tertiary: '', // No tertiary for UK example
      },
    },
    complianceModules: {
      vatReturnsEnabled: true,
    },
    chartOfAccountsTemplate: {
      taxAccounts: [
        { account_code: '21401', account_name: 'VAT Payable', account_type: 'liability', account_group: 'Current Liabilities', balance_type: 'credit' },
      ],
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    businessTypes: [
      { id: 'sole_trader', name: 'Sole Trader' },
      { id: 'partnership', name: 'Partnership' },
      { id: 'llp', name: 'Limited Liability Partnership (LLP)' },
      { id: 'private_limited', name: 'Private Limited Company (Ltd)' },
      { id: 'public_limited', name: 'Public Limited Company (PLC)' },
      { id: 'charity', name: 'Charity / Non-profit' },
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
    defaultCurrency: 'CAD',
    defaultFiscalYearStart: '01-01',
    defaultFiscalYearEnd: '12-31',
    defaultDecimalPlaces: 2,
    taxConfig: {
      type: 'GST/PST/HST',
      rates: [5, 13, 15],
      registrationLabels: {
        main: 'GST/HST No.',
        secondary: 'Business No.',
        tertiary: '', // No tertiary for CA example
      },
    },
    complianceModules: {
      gstHstReturnsEnabled: true,
    },
    chartOfAccountsTemplate: {
      taxAccounts: [
        { account_code: '21401', account_name: 'GST/HST Payable', account_type: 'liability', account_group: 'Current Liabilities', balance_type: 'credit' },
      ],
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    businessTypes: [
      { id: 'sole_proprietorship', name: 'Sole Proprietorship' },
      { id: 'partnership', name: 'Partnership' },
      { id: 'corporation', name: 'Corporation' },
      { id: 'cooperative', name: 'Cooperative' },
      { id: 'non_profit', name: 'Non-Profit Organization' },
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
    defaultCurrency: 'AUD',
    defaultFiscalYearStart: '07-01', // July 1st
    defaultFiscalYearEnd: '06-30',   // June 30th
    defaultDecimalPlaces: 2,
    taxConfig: {
      type: 'GST',
      rates: [10],
      registrationLabels: {
        main: 'ABN',
        secondary: 'ACN',
        tertiary: '', // No tertiary for AU example
      },
    },
    complianceModules: {
      basLodgementEnabled: true,
    },
    chartOfAccountsTemplate: {
      taxAccounts: [
        { account_code: '21401', account_name: 'GST Payable', account_type: 'liability', account_group: 'Duties & Taxes Payable', balance_type: 'credit' },
      ],
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    businessTypes: [
      { id: 'sole_trader', name: 'Sole Trader' },
      { id: 'partnership', name: 'Partnership' },
      { id: 'company', name: 'Company' },
      { id: 'trust', name: 'Trust' },
      { id: 'super_fund', name: 'Superannuation Fund' },
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
    defaultCurrency: 'EUR',
    defaultFiscalYearStart: '01-01',
    defaultFiscalYearEnd: '12-31',
    defaultDecimalPlaces: 2,
    taxConfig: {
      type: 'VAT',
      rates: [7, 19],
      registrationLabels: {
        main: 'VAT ID',
        secondary: 'Tax No.',
        tertiary: '', // No tertiary for DE example
      },
    },
    complianceModules: {
      vatDeclarationEnabled: true,
    },
    chartOfAccountsTemplate: {
      taxAccounts: [
        { account_code: '21401', account_name: 'VAT Payable', account_type: 'liability', account_group: 'Current Liabilities', balance_type: 'credit' },
      ],
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    businessTypes: [
      { id: 'sole_proprietorship', name: 'Einzelunternehmen' }, // Sole Proprietorship
      { id: 'gbr', name: 'GbR (Gesellschaft bürgerlichen Rechts)' }, // Partnership under civil law
      { id: 'ohg', name: 'oHG (Offene Handelsgesellschaft)' }, // General Partnership
      { id: 'kg', name: 'KG (Kommanditgesellschaft)' }, // Limited Partnership
      { id: 'gmbh', name: 'GmbH (Gesellschaft mit beschränkter Haftung)' }, // Limited Liability Company
      { id: 'ag', name: 'AG (Aktiengesellschaft)' }, // Public Limited Company
      { id: 'ug', name: 'UG (haftungsbeschränkt)' }, // Entrepreneurial Company (haftungsbeschränkt)
      { id: 'ev', name: 'e.V. (Eingetragener Verein)' }, // Registered Association (Non-profit)
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
    defaultCurrency: 'EUR',
    defaultFiscalYearStart: '01-01',
    defaultFiscalYearEnd: '12-31',
    defaultDecimalPlaces: 2,
    taxConfig: {
      type: 'VAT',
      rates: [2.1, 5.5, 10, 20],
      registrationLabels: {
        main: 'VAT No.',
        secondary: 'SIREN/SIRET',
        tertiary: '', // No tertiary for FR example
      },
    },
    complianceModules: {
      vatDeclarationEnabled: true,
    },
    chartOfAccountsTemplate: {
      taxAccounts: [
        { account_code: '21401', account_name: 'TVA à payer', account_type: 'liability', account_group: 'Current Liabilities', balance_type: 'credit' },
      ],
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    businessTypes: [
      { id: 'ei', name: 'EI (Entrepreneur Individuel)' }, // Sole Proprietorship
      { id: 'eirl', name: 'EIRL (Entrepreneur Individuel à Responsabilité Limitée)' }, // Limited Liability Sole Proprietorship
      { id: 'sarl', name: 'SARL (Société à Responsabilité Limitée)' }, // Limited Liability Company
      { id: 'eurl', name: 'EURL (Entreprise Unipersonnelle à Responsabilité Limitée)' }, // Single-person Limited Liability Company
      { id: 'sa', name: 'SA (Société Anonyme)' }, // Public Limited Company
      { id: 'sas', name: 'SAS (Société par Actions Simplifiée)' }, // Simplified Joint Stock Company
      { id: 'sasu', name: 'SASU (Société par Actions Simplifiée Unipersonnelle)' }, // Single-person Simplified Joint Stock Company
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
    defaultCurrency: 'JPY',
    defaultFiscalYearStart: '04-01',
    defaultFiscalYearEnd: '03-31',
    defaultDecimalPlaces: 0, // Yen typically has no decimal places
    taxConfig: {
      type: 'Consumption Tax',
      rates: [8, 10],
      registrationLabels: {
        main: 'Consumption Tax No.',
        secondary: 'Corporate No.',
        tertiary: '', // No tertiary for JP example
      },
    },
    complianceModules: {
      consumptionTaxReturnsEnabled: true,
    },
    chartOfAccountsTemplate: {
      taxAccounts: [
        { account_code: '21401', account_name: 'Consumption Tax Payable', account_type: 'liability', account_group: 'Current Liabilities', balance_type: 'credit' },
      ],
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    businessTypes: [
      { id: 'sole_proprietorship', name: 'Sole Proprietorship' },
      { id: 'godo_kaisha', name: 'Godo Kaisha (LLC)' },
      { id: 'kabushiki_kaisha', name: 'Kabushiki Kaisha (Corporation)' },
      { id: 'npo', name: 'NPO (Non-Profit Organization)' },
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
    defaultCurrency: 'SGD',
    defaultFiscalYearStart: '01-01',
    defaultFiscalYearEnd: '12-31',
    defaultDecimalPlaces: 2,
    taxConfig: {
      type: 'GST',
      rates: [9],
      registrationLabels: {
        main: 'GST Reg. No.',
        secondary: 'UEN',
        tertiary: '', // No tertiary for SG example
      },
    },
    complianceModules: {
      gstReturnsEnabled: true,
    },
    chartOfAccountsTemplate: {
      taxAccounts: [
        { account_code: '21401', account_name: 'GST Payable', account_type: 'liability', account_group: 'Duties & Taxes Payable', balance_type: 'credit' },
      ],
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    businessTypes: [
      { id: 'sole_proprietorship', name: 'Sole Proprietorship' },
      { id: 'partnership', name: 'Partnership' },
      { id: 'private_limited', name: 'Private Limited Company' },
      { id: 'public_limited', name: 'Public Limited Company' },
      { id: 'llp', name: 'Limited Liability Partnership (LLP)' },
      { id: 'limited_partnership', name: 'Limited Partnership' },
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
    defaultCurrency: 'AED',
    defaultFiscalYearStart: '01-01',
    defaultFiscalYearEnd: '12-31',
    defaultDecimalPlaces: 2,
    taxConfig: {
      type: 'VAT',
      rates: [5],
      registrationLabels: {
        main: 'TRN',
        secondary: 'Trade License No.',
        tertiary: '', // No tertiary for AE example
      },
    },
    complianceModules: {
      vatReturnsEnabled: true,
    },
    chartOfAccountsTemplate: {
      taxAccounts: [
        { account_code: '21401', account_name: 'VAT Payable', account_type: 'liability', account_group: 'Current Liabilities', balance_type: 'credit' },
      ],
    },
    customerTypes: [
      { code: 'individual', name: 'Individual' },
      { code: 'company', name: 'Company' },
      { code: 'reseller', name: 'Reseller' },
      { code: 'government', name: 'Government' },
      { code: 'non_profit', name: 'Non-Profit' },
    ],
    businessTypes: [
      { id: 'sole_establishment', name: 'Sole Establishment' },
      { id: 'civil_company', name: 'Civil Company' },
      { id: 'llc', name: 'Limited Liability Company (LLC)' },
      { id: 'free_zone', name: 'Free Zone Company' },
      { id: 'public_shareholding', name: 'Public Shareholding Company' },
    ],
    states: [
      { code: 'AUH', name: 'Abu Dhabi' }, { code: 'DXB', name: 'Dubai' },
      { code: 'SHJ', name: 'Sharjah' }, { code: 'AJM', name: 'Ajman' },
      { code: 'UMM', name: 'Umm Al Quwain' }, { code: 'RAK', name: 'Ras Al Khaimah' },
      { code: 'FUJ', name: 'Fujairah' },
    ],
  },
];

export const globalBusinessTypes = [
  { id: 'sole_proprietorship', name: 'Sole Proprietorship' },
  { id: 'partnership', name: 'Partnership' },
  { id: 'private_limited', name: 'Private Limited Company' },
  { id: 'public_limited', name: 'Public Limited Company' },
  { id: 'llp', name: 'Limited Liability Partnership (LLP)' },
  { id: 'non_profit', name: 'Non-Profit / NGO' },
  { id: 'cooperative', name: 'Cooperative' },
  { id: 'government', name: 'Government Organization' },
  { id: 'trust_society', name: 'Trust / Society' },
  { id: 'other', name: 'Other' },
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
    name: `${country.flag} ${country.dialCode} ${country.name}`, // Display flag + dialCode + country name
    dialCode: country.dialCode, // Keep dialCode for selection
  }));
};

