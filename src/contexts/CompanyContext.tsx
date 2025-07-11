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
    type: 'GST' | 'VAT' | 'Custom';
    rates: number[];
  };
}

interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface CompanyContextType {
  currentCompany: Company | null;
  currentPeriod: Period | null;
  companies: Company[];
  periods: Period[];
  switchCompany: (companyId: string) => void;
  switchPeriod: (periodId: string) => void;
  addCompany: (company: Omit<Company, 'id'>) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserCompanies();
    }
  }, []);

  const loadUserCompanies = async () => {
    try {
      // Get companies user has access to
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
            tax_config
          )
        `)
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (companiesError) {
        console.error('Error loading companies:', companiesError);
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
        taxConfig: uc.companies.tax_config
      })) || [];

      setCompanies(companiesData);

      // Set current company (first one or from localStorage)
      const savedCompanyId = localStorage.getItem('erp-current-company');
      const currentComp = savedCompanyId 
        ? companiesData.find(c => c.id === savedCompanyId) 
        : companiesData[0];

      if (currentComp) {
        setCurrentCompany(currentComp);
        await loadCompanyPeriods(currentComp.id);
      }
    } catch (error) {
      console.error('Error loading user companies:', error);
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
        isActive: p.is_active
      })) || [];

      setPeriods(periods);

      // Set current period
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
    // This would create a new company in the database
    console.log('Add company:', company);
  };

  return (
    <CompanyContext.Provider value={{
      currentCompany,
      currentPeriod,
      companies,
      periods,
      switchCompany,
      switchPeriod,
      addCompany
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