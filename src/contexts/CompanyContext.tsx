// src/contexts/CompanyContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Company {
  id: string;
  name: string;
  country: string;
  currency: string;
  fiscalYearStart: string;
  fiscalYearEnd: string;
  timezone: string;
  logo?: string;
  taxConfig: {
    type: 'GST' | 'VAT' | 'Custom' | 'Sales Tax' | 'Consumption Tax' | 'GST/PST/HST'; // Added more types
    rates: number[];
    enabled: boolean;
    registrationNumber: string;
    gstDetails?: {
      pan?: string;
      tan?: string;
      registrationType?: string;
      filingFrequency?: string;
      tdsApplicable?: boolean;
      tcsApplicable?: boolean;
    };
    vatDetails?: {
      registrationNumber?: string;
      registrationType?: string;
      filingCycle?: string;
    };
  };
  address: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  contactInfo: {
    contactPersonName?: string;
    designation?: string;
    email?: string;
    mobile?: string;
    alternatePhone?: string;
    phoneCountry?: string;
  };
  settings: {
    displayName?: string;
    legalName?: string;
    industry?: string;
    businessType?: string;
    registrationNo?: string;
    languagePreference?: string;
    decimalPlaces?: number;
    multiCurrencySupport?: boolean;
    autoRounding?: boolean;
    dateFormat?: string;
    batchTracking?: boolean;
    costCenterAllocation?: boolean;
    multiUserAccess?: boolean;
    aiSuggestions?: boolean;
    enablePassword?: boolean;
    password?: string;
    splitByPeriod?: boolean;
    barcodeSupport?: boolean;
    autoVoucherCreationAI?: boolean;
    companyType?: string;
    employeeCount?: string;
    annualRevenue?: string;
    inventoryTracking?: boolean;
    companyUsername?: string;
  };
}

interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isClosedPeriod: boolean;
  periodType: 'fiscal_year' | 'quarter' | 'month';
}

interface CompanyContextType {
  currentCompany: Company | null;
  currentPeriod: Period | null;
  companies: Company[];
  periods: Period[];
  loadingCompanies: boolean;
  switchCompany: (companyId: string) => void;
  switchPeriod: (periodId: string) => void;
  addCompany: (company: Omit<Company, 'id'>) => void;
  refreshCompanies: () => void;
  refreshPeriods: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserCompanies();
    } else {
      setCompanies([]);
      setCurrentCompany(null);
      setPeriods([]);
      setCurrentPeriod(null);
      setLoadingCompanies(false);
    }
  }, [isAuthenticated, user]);

  const loadUserCompanies = async () => {
  setLoadingCompanies(true);
  try {
    const { data: userCompanies, error: companiesError } = await supabase
      .from('users_companies')
      .select(`
        company_id,
        companies (
          id,
          name,
          country,
          currency,
          fiscal_year_start,
          fiscal_year_end,
          timezone,
          logo,
          tax_config,
          address,
          contact_info,
          settings
        )
      `)
      .eq('user_id', user?.id)
      .eq('is_active', true);

    if (companiesError) {
      console.error('Error loading companies:', companiesError);
      setCompanies([]);
      setCurrentCompany(null);
      setPeriods([]);
      setCurrentPeriod(null);
      return;
    }

    const companiesData = userCompanies?.map(uc => ({
      id: uc.companies.id,
      name: uc.companies.name,
      country: uc.companies.country,
      currency: uc.companies.currency,
      fiscalYearStart: uc.companies.fiscal_year_start,
      fiscalYearEnd: uc.companies.fiscal_year_end,
      timezone: uc.companies.timezone,
      logo: uc.companies.logo,
      // Ensure these JSONB fields always default to a structured object if null from DB
      taxConfig: uc.companies.tax_config || {
        type: 'GST', rates: [0, 5, 12, 18, 28], enabled: true, registrationNumber: '',
        gstDetails: { pan: '', tan: '', registrationType: '', filingFrequency: '', tdsApplicable: false, tcsApplicable: false },
        vatDetails: { registrationNumber: '', registrationType: '', filingCycle: '' }
      },
      address: uc.companies.address || { street1: '', street2: '', city: '', state: '', country: '', zipCode: '' },
      contactInfo: uc.companies.contact_info || {
        contactPersonName: '', designation: '', email: '', mobile: '', alternatePhone: '', phoneCountry: ''
      },
      settings: uc.companies.settings || {
        displayName: '', legalName: '', industry: '', businessType: '', registrationNo: '',
        languagePreference: 'en', decimalPlaces: 2, multiCurrencySupport: false, autoRounding: false,
        dateFormat: 'DD-MM-YYYY', batchTracking: false, costCenterAllocation: false, multiUserAccess: false,
        aiSuggestions: false, enablePassword: false, password: '', splitByPeriod: false,
        barcodeSupport: false, autoVoucherCreationAI: false, companyType: '', employeeCount: '',
        annualRevenue: '', inventoryTracking: true, companyUsername: ''
      }
    })) || [];

    setCompanies(companiesData);

    const savedCompanyId = localStorage.getItem('erp-current-company');
    const currentComp = savedCompanyId
      ? companiesData.find(c => c.id === savedCompanyId)
      : companiesData[0];

    if (currentComp) {
      setCurrentCompany(currentComp);
      await loadCompanyPeriods(currentComp.id);
    } else {
      setCurrentCompany(null);
      setPeriods([]);
      setCurrentPeriod(null);
    }
  } catch (error) {
    console.error('Error loading user companies:', error);
    setCompanies([]);
    setCurrentCompany(null);
    setPeriods([]);
    setCurrentPeriod(null);
  } finally {
    setLoadingCompanies(false);
  }
}; 

  const loadCompanyPeriods = async (companyId: string) => {
    try {
      const { data: periodsData, error } = await supabase
        .from('periods')
        .select('*')
        .eq('company_id', companyId)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error loading periods:', error);
        return;
      }

      const periods = periodsData?.map(p => ({
        id: p.id,
        name: p.name,
        startDate: p.start_date,
        endDate: p.end_date,
        isActive: p.is_active,
        isClosedPeriod: p.is_closed || false,
        periodType: p.period_type || 'fiscal_year'
      })) || [];

      setPeriods(periods);

      const savedPeriodId = localStorage.getItem('erp-current-period');
      const currentPer = savedPeriodId
        ? periods.find(p => p.id === savedPeriodId)
        : periods.find(p => p.isActive) || periods[0];

      if (currentPer) {
        setCurrentPeriod(currentPer);
      }
    } catch (error) {
      console.error('Error loading periods:', error);
    }
  };

  const switchCompany = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setCurrentCompany(company);
      localStorage.setItem('erp-current-company', companyId);
      loadCompanyPeriods(companyId);
    }
  };

  const switchPeriod = (periodId: string) => {
    const period = periods.find(p => p.id === periodId);
    if (period) {
      setCurrentPeriod(period);
      localStorage.setItem('erp-current-period', periodId);
    }
  };

  const addCompany = (company: Omit<Company, 'id'>) => {
    console.log('Add company:', company);
  };

  const refreshCompanies = () => {
    loadUserCompanies();
  };

  const refreshPeriods = () => {
    if (currentCompany) {
      loadCompanyPeriods(currentCompany.id);
    }
  };

  return (
    <CompanyContext.Provider value={{
      currentCompany,
      currentPeriod,
      companies,
      periods,
      loadingCompanies,
      switchCompany,
      switchPeriod,
      addCompany,
      refreshCompanies,
      refreshPeriods
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
