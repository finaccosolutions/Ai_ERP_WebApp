// src/lib/coaSetup.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './supabase';
import { getCountryByCode } from '../constants/geoData';

export async function populateDefaultChartOfAccounts(supabase: SupabaseClient<Database>, companyId: string, countryCode: string) {
  console.log(`Populating Chart of Accounts for Company ID: ${companyId} and Country: ${countryCode}`);

  try {
    const accountsToInsert: Database['public']['Tables']['chart_of_accounts']['Insert'][] = [];
    const insertedAccountIds: { [key: string]: string } = {};

    // Helper function to add accounts with validation
    const addAccount = (key: string, account: Partial<Database['public']['Tables']['chart_of_accounts']['Insert']>) => {
      if (!account.account_code || !account.account_name) {
        throw new Error(`Account code and name are required for ${key}`);
      }
      
      const newAccount = {
        ...account,
        company_id: companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_default: account.is_default || false, // NEW: Set is_default, default to false
      };
      
      accountsToInsert.push(newAccount as Database['public']['Tables']['chart_of_accounts']['Insert']);
    };

    // Get country-specific configuration
    const countryConfig = getCountryByCode(countryCode);
    const taxAccountsTemplate = countryConfig?.chartOfAccountsTemplate?.taxAccounts || [];
    const countrySpecificGroups = countryConfig?.chartOfAccountsTemplate?.groups || [];

    // ======================================================================
    // 1. TOP-LEVEL GROUPS (Balance Sheet & Income Statement Categories)
    // ======================================================================
    
    // Assets (10000-19999)
    addAccount('asset_id', { 
      account_code: '10000', 
      account_name: 'Assets', 
      account_type: 'asset', 
      account_group: 'Assets', 
      is_group: true, 
      balance_type: 'debit',
      comment: 'All company assets including current, fixed, and intangible assets'
    });

    // Liabilities (20000-29999)
    addAccount('liability_id', { 
      account_code: '20000', 
      account_name: 'Liabilities', 
      account_type: 'liability', 
      account_group: 'Liabilities', 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Company obligations including current and long-term liabilities'
    });

    // Equity (30000-39999)
    addAccount('equity_id', { 
      account_code: '30000', 
      account_name: 'Equity', 
      account_type: 'equity', 
      account_group: 'Equity', 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Owner\'s equity including capital, retained earnings, and reserves'
    });

    // Income (40000-49999)
    addAccount('income_id', { 
      account_code: '40000', 
      account_name: 'Income', 
      account_type: 'income', 
      account_group: 'Income', 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Revenue from primary operations and other income sources'
    });

    // Expenses (50000-59999)
    addAccount('expense_id', { 
      account_code: '50000', 
      account_name: 'Expenses', 
      account_type: 'expense', 
      account_group: 'Expenses', 
      is_group: true, 
      balance_type: 'debit',
      comment: 'All business expenses including COGS, operating, and financial expenses'
    });

    // Insert top-level groups first
    const { data: topLevelData, error: topLevelError } = await supabase
      .from('chart_of_accounts')
      .insert(accountsToInsert)
      .select('id, account_code');
    
    if (topLevelError) throw topLevelError;

    // Store top-level account IDs
    topLevelData.forEach(acc => {
      if (acc.account_code === '10000') insertedAccountIds['asset_id'] = acc.id;
      if (acc.account_code === '20000') insertedAccountIds['liability_id'] = acc.id;
      if (acc.account_code === '30000') insertedAccountIds['equity_id'] = acc.id;
      if (acc.account_code === '40000') insertedAccountIds['income_id'] = acc.id;
      if (acc.account_code === '50000') insertedAccountIds['expense_id'] = acc.id;
    });

    accountsToInsert.length = 0; // Reset for next batch

    // ======================================================================
    // 2. SECOND-LEVEL GROUPS (Major Account Categories)
    // ======================================================================

    // ------------------------- ASSETS (10000-19999) -----------------------
    // Current Assets (11000-11999)
    addAccount('current_asset_id', { 
      account_code: '11000', 
      account_name: 'Current Assets', 
      account_type: 'asset', 
      account_group: 'Current Assets', 
      parent_account_id: insertedAccountIds['asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Assets expected to be converted to cash within one year'
    });

    // Fixed Assets (12000-12999)
    addAccount('fixed_asset_id', { 
      account_code: '12000', 
      account_name: 'Fixed Assets', 
      account_type: 'asset', 
      account_group: 'Fixed Assets', 
      parent_account_id: insertedAccountIds['asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Long-term tangible assets used in business operations'
    });

    // Intangible Assets (13000-13999)
    addAccount('intangible_asset_id', { 
      account_code: '13000', 
      account_name: 'Intangible Assets', 
      account_type: 'asset', 
      account_group: 'Intangible Assets', 
      parent_account_id: insertedAccountIds['asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Non-physical assets with long-term value'
    });

    // Investments (14000-14999)
    addAccount('investment_id', { 
      account_code: '14000', 
      account_name: 'Investments', 
      account_type: 'asset', 
      account_group: 'Investments', 
      parent_account_id: insertedAccountIds['asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Financial investments including stocks, bonds, and other securities'
    });

    // Other Assets (15000-15999)
    addAccount('other_asset_id', { 
      account_code: '15000', 
      account_name: 'Other Assets', 
      account_type: 'asset', 
      account_group: 'Other Assets', 
      parent_account_id: insertedAccountIds['asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Miscellaneous assets not fitting other categories'
    });

    // ---------------------- LIABILITIES (20000-29999) ---------------------
    // Current Liabilities (21000-21999)
    addAccount('current_liability_id', { 
      account_code: '21000', 
      account_name: 'Current Liabilities', 
      account_type: 'liability', 
      account_group: 'Current Liabilities', 
      parent_account_id: insertedAccountIds['liability_id'], 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Obligations due within one year'
    });

    // Long-term Liabilities (22000-22999)
    addAccount('long_term_liability_id', { 
      account_code: '22000', 
      account_name: 'Long-term Liabilities', 
      account_type: 'liability', 
      account_group: 'Long-term Liabilities', 
      parent_account_id: insertedAccountIds['liability_id'], 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Obligations due beyond one year'
    });

    // Provisions (23000-23999)
    addAccount('provisions_id', { 
      account_code: '23000', 
      account_name: 'Provisions', 
      account_type: 'liability', 
      account_group: 'Provisions', 
      parent_account_id: insertedAccountIds['liability_id'], 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Estimated liabilities for future obligations'
    });

    // ------------------------ EQUITY (30000-39999) -----------------------
    // Share Capital (31000-31999)
    addAccount('share_capital_id', { 
      account_code: '31000', 
      account_name: 'Share Capital', 
      account_type: 'equity', 
      account_group: 'Share Capital', 
      parent_account_id: insertedAccountIds['equity_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Capital contributed by shareholders'
    });

    // Retained Earnings (32000-32999)
    addAccount('retained_earnings_id', { 
      account_code: '32000', 
      account_name: 'Retained Earnings', 
      account_type: 'equity', 
      account_group: 'Retained Earnings', 
      parent_account_id: insertedAccountIds['equity_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Accumulated profits not distributed as dividends'
    });

    // Reserves (33000-33999)
    addAccount('reserves_id', { 
      account_code: '33000', 
      account_name: 'Reserves', 
      account_type: 'equity', 
      account_group: 'Reserves', 
      parent_account_id: insertedAccountIds['equity_id'], 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Various reserves including statutory and capital reserves'
    });

    // Drawings/Dividends (34000-34999)
    addAccount('drawings_id', { 
      account_code: '34000', 
      account_name: 'Drawings/Dividends', 
      account_type: 'equity', 
      account_group: 'Drawings/Dividends', 
      parent_account_id: insertedAccountIds['equity_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Owner withdrawals or dividends paid to shareholders'
    });

    // ------------------------ INCOME (40000-49999) -----------------------
    // Sales Revenue (41000-41999)
    addAccount('sales_revenue_id', { 
      account_code: '41000', 
      account_name: 'Sales Revenue', 
      account_type: 'income', 
      account_group: 'Sales Revenue', 
      parent_account_id: insertedAccountIds['income_id'], 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Revenue from primary business operations'
    });

    // Service Revenue (42000-42999)
    addAccount('service_revenue_id', { 
      account_code: '42000', 
      account_name: 'Service Revenue', 
      account_type: 'income', 
      account_group: 'Service Revenue', 
      parent_account_id: insertedAccountIds['income_id'], 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Revenue from service provision'
    });

    // Other Income (43000-43999)
    addAccount('other_income_id', { 
      account_code: '43000', 
      account_name: 'Other Income', 
      account_type: 'income', 
      account_group: 'Other Income', 
      parent_account_id: insertedAccountIds['income_id'], 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Income from non-core business activities'
    });

    // ----------------------- EXPENSES (50000-59999) -----------------------
    // Cost of Goods Sold (51000-51999)
    addAccount('cogs_id', { 
      account_code: '51000', 
      account_name: 'Cost of Goods Sold', 
      account_type: 'expense', 
      account_group: 'Cost of Goods Sold', 
      parent_account_id: insertedAccountIds['expense_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Direct costs attributable to production of goods sold'
    });

    // Operating Expenses (52000-52999)
    addAccount('operating_expense_id', { 
      account_code: '52000', 
      account_name: 'Operating Expenses', 
      account_type: 'expense', 
      account_group: 'Operating Expenses', 
      parent_account_id: insertedAccountIds['expense_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Expenses incurred in normal business operations'
    });

    // Financial Expenses (53000-53999)
    addAccount('financial_expense_id', { 
      account_code: '53000', 
      account_name: 'Financial Expenses', 
      account_type: 'expense', 
      account_group: 'Financial Expenses', 
      parent_account_id: insertedAccountIds['expense_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Expenses related to financing activities'
    });

    // Depreciation & Amortization (54000-54999)
    addAccount('depreciation_id', { 
      account_code: '54000', 
      account_name: 'Depreciation & Amortization', 
      account_type: 'expense', 
      account_group: 'Depreciation & Amortization', 
      parent_account_id: insertedAccountIds['expense_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Allocation of asset costs over their useful lives'
    });

    // Taxes (55000-55999)
    addAccount('taxes_id', { 
      account_code: '55000', 
      account_name: 'Taxes', 
      account_type: 'expense', 
      account_group: 'Taxes', 
      parent_account_id: insertedAccountIds['expense_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Various tax expenses including income tax, property tax, etc.'
    });

    // Insert second-level groups
    const { data: secondLevelData, error: secondLevelError } = await supabase
      .from('chart_of_accounts')
      .insert(accountsToInsert)
      .select('id, account_code');
    
    if (secondLevelError) throw secondLevelError;

    // Store second-level account IDs
    secondLevelData.forEach(acc => {
      const prefix = acc.account_code.substring(0, 2);
      switch(prefix) {
        case '11': insertedAccountIds['current_asset_id'] = acc.id; break;
        case '12': insertedAccountIds['fixed_asset_id'] = acc.id; break;
        case '13': insertedAccountIds['intangible_asset_id'] = acc.id; break;
        case '14': insertedAccountIds['investment_id'] = acc.id; break;
        case '15': insertedAccountIds['other_asset_id'] = acc.id; break;
        case '21': insertedAccountIds['current_liability_id'] = acc.id; break;
        case '22': insertedAccountIds['long_term_liability_id'] = acc.id; break;
        case '23': insertedAccountIds['provisions_id'] = acc.id; break;
        case '31': insertedAccountIds['share_capital_id'] = acc.id; break;
        case '32': insertedAccountIds['retained_earnings_id'] = acc.id; break;
        case '33': insertedAccountIds['reserves_id'] = acc.id; break;
        case '34': insertedAccountIds['drawings_id'] = acc.id; break;
        case '41': insertedAccountIds['sales_revenue_id'] = acc.id; break;
        case '42': insertedAccountIds['service_revenue_id'] = acc.id; break;
        case '43': insertedAccountIds['other_income_id'] = acc.id; break;
        case '51': insertedAccountIds['cogs_id'] = acc.id; break;
        case '52': insertedAccountIds['operating_expense_id'] = acc.id; break;
        case '53': insertedAccountIds['financial_expense_id'] = acc.id; break;
        case '54': insertedAccountIds['depreciation_id'] = acc.id; break;
        case '55': insertedAccountIds['taxes_id'] = acc.id; break;
      }
    });

    accountsToInsert.length = 0; // Reset for next batch

    // ======================================================================
    // 3. THIRD-LEVEL GROUPS AND LEDGER ACCOUNTS (Detailed Accounts)
    // ======================================================================

    // ------------------------- CURRENT ASSETS -----------------------------
    // Cash & Cash Equivalents (11100-11199)
    addAccount('cash_equivalents_id', { 
      account_code: '11100', 
      account_name: 'Cash & Cash Equivalents', 
      account_type: 'asset', 
      account_group: 'Cash & Cash Equivalents', 
      parent_account_id: insertedAccountIds['current_asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Highly liquid assets including cash, bank accounts, and short-term investments'
    });

    // Accounts Receivable (11200-11299)
    addAccount('accounts_receivable_id', { 
      account_code: '11200', 
      account_name: 'Accounts Receivable', 
      account_type: 'asset', 
      account_group: 'Accounts Receivable', 
      parent_account_id: insertedAccountIds['current_asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Amounts owed by customers for goods/services sold on credit'
    });

    // Inventory (11300-11399)
    addAccount('inventory_id', { 
      account_code: '11300', 
      account_name: 'Inventory', 
      account_type: 'asset', 
      account_group: 'Inventory', 
      parent_account_id: insertedAccountIds['current_asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Goods held for sale in the ordinary course of business'
    });

    // Prepaid Expenses (11400-11499)
    addAccount('prepaid_expenses_id', { 
      account_code: '11400', 
      account_name: 'Prepaid Expenses', 
      account_type: 'asset', 
      account_group: 'Prepaid Expenses', 
      parent_account_id: insertedAccountIds['current_asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Expenses paid in advance for future periods'
    });

    // Other Current Assets (11500-11599)
    addAccount('other_current_assets_id', { 
      account_code: '11500', 
      account_name: 'Other Current Assets', 
      account_type: 'asset', 
      account_group: 'Other Current Assets', 
      parent_account_id: insertedAccountIds['current_asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Miscellaneous current assets not fitting other categories'
    });

    // ------------------------- FIXED ASSETS ------------------------------
    // Land & Buildings (12100-12199)
    addAccount('land_buildings_id', { 
      account_code: '12100', 
      account_name: 'Land & Buildings', 
      account_type: 'asset', 
      account_group: 'Land & Buildings', 
      parent_account_id: insertedAccountIds['fixed_asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Real property including land and structures'
    });

    // Plant & Machinery (12200-12299)
    addAccount('plant_machinery_id', { 
      account_code: '12200', 
      account_name: 'Plant & Machinery', 
      account_type: 'asset', 
      account_group: 'Plant & Machinery', 
      parent_account_id: insertedAccountIds['fixed_asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Heavy equipment and machinery used in production'
    });

    // Furniture & Fixtures (12300-12399)
    addAccount('furniture_fixtures_id', { 
      account_code: '12300', 
      account_name: 'Furniture & Fixtures', 
      account_type: 'asset', 
      account_group: 'Furniture & Fixtures', 
      parent_account_id: insertedAccountIds['fixed_asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Office furniture and related equipment'
    });

    // Vehicles (12400-12499)
    addAccount('vehicles_id', { 
      account_code: '12400', 
      account_name: 'Vehicles', 
      account_type: 'asset', 
      account_group: 'Vehicles', 
      parent_account_id: insertedAccountIds['fixed_asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Company-owned automobiles and transportation equipment'
    });

    // Computer Equipment (12500-12599)
    addAccount('computer_equipment_id', { 
      account_code: '12500', 
      account_name: 'Computer Equipment', 
      account_type: 'asset', 
      account_group: 'Computer Equipment', 
      parent_account_id: insertedAccountIds['fixed_asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Hardware including computers, servers, and peripherals'
    });

    // Accumulated Depreciation (12600-12699)
    addAccount('accumulated_depreciation_id', { 
      account_code: '12600', 
      account_name: 'Accumulated Depreciation', 
      account_type: 'asset', 
      account_group: 'Accumulated Depreciation', 
      parent_account_id: insertedAccountIds['fixed_asset_id'], 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Cumulative depreciation of fixed assets'
    });

    // ----------------------- INTANGIBLE ASSETS ---------------------------
    // Goodwill (13100-13199)
    addAccount('goodwill_id', { 
      account_code: '13100', 
      account_name: 'Goodwill', 
      account_type: 'asset', 
      account_group: 'Goodwill', 
      parent_account_id: insertedAccountIds['intangible_asset_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Excess of purchase price over fair value of net assets acquired'
    });

    // Patents & Trademarks (13200-13299)
    addAccount('patents_trademarks_id', { 
      account_code: '13200', 
      account_name: 'Patents & Trademarks', 
      account_type: 'asset', 
      account_group: 'Patents & Trademarks', 
      parent_account_id: insertedAccountIds['intangible_asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Legal rights to inventions and brand identifiers'
    });

    // Software & Licenses (13300-13399)
    addAccount('software_licenses_id', { 
      account_code: '13300', 
      account_name: 'Software & Licenses', 
      account_type: 'asset', 
      account_group: 'Software & Licenses', 
      parent_account_id: insertedAccountIds['intangible_asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Purchased software and licensing rights'
    });

    // Accumulated Amortization (13400-13499)
    addAccount('accumulated_amortization_id', { 
      account_code: '13400', 
      account_name: 'Accumulated Amortization', 
      account_type: 'asset', 
      account_group: 'Accumulated Amortization', 
      parent_account_id: insertedAccountIds['intangible_asset_id'], 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Cumulative amortization of intangible assets'
    });

    // ------------------------- INVESTMENTS -------------------------------
    // Short-term Investments (14100-14199)
    addAccount('short_term_investments_id', { 
      account_code: '14100', 
      account_name: 'Short-term Investments', 
      account_type: 'asset', 
      account_group: 'Short-term Investments', 
      parent_account_id: insertedAccountIds['investment_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Investments maturing within one year'
    });

    // Long-term Investments (14200-14299)
    addAccount('long_term_investments_id', { 
      account_code: '14200', 
      account_name: 'Long-term Investments', 
      account_type: 'asset', 
      account_group: 'Long-term Investments', 
      parent_account_id: insertedAccountIds['investment_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Investments held for longer than one year'
    });

    // ------------------------ OTHER ASSETS ------------------------------
    // Deferred Tax Assets (15100-15199)
    addAccount('deferred_tax_assets_id', { 
      account_code: '15100', 
      account_name: 'Deferred Tax Assets', 
      account_type: 'asset', 
      account_group: 'Deferred Tax Assets', 
      parent_account_id: insertedAccountIds['other_asset_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Future tax benefits from temporary differences'
    });

    // Security Deposits (15200-15299)
    addAccount('security_deposits_id', { 
      account_code: '15200', 
      account_name: 'Security Deposits', 
      account_type: 'asset', 
      account_group: 'Security Deposits', 
      parent_account_id: insertedAccountIds['other_asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Refundable deposits paid to vendors or landlords'
    });

    // Loans to Employees (15300-15399)
    addAccount('loans_to_employees_id', { 
      account_code: '15300', 
      account_name: 'Loans to Employees', 
      account_type: 'asset', 
      account_group: 'Loans to Employees', 
      parent_account_id: insertedAccountIds['other_asset_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Amounts loaned to employees to be repaid'
    });

    // -------------------- CURRENT LIABILITIES ----------------------------
    // Accounts Payable (21100-21199)
    addAccount('accounts_payable_id', { 
      account_code: '21100', 
      account_name: 'Accounts Payable', 
      account_type: 'liability', 
      account_group: 'Accounts Payable', 
      parent_account_id: insertedAccountIds['current_liability_id'], 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Amounts owed to suppliers for goods/services purchased on credit'
    });

    // Short-term Loans (21200-21299)
    addAccount('short_term_loans_id', { 
      account_code: '21200', 
      account_name: 'Short-term Loans', 
      account_type: 'liability', 
      account_group: 'Short-term Loans', 
      parent_account_id: insertedAccountIds['current_liability_id'], 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Loans payable within one year'
    });

    // Accrued Expenses (21300-21399)
    addAccount('accrued_expenses_id', { 
      account_code: '21300', 
      account_name: 'Accrued Expenses', 
      account_type: 'liability', 
      account_group: 'Accrued Expenses', 
      parent_account_id: insertedAccountIds['current_liability_id'], 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Expenses incurred but not yet paid'
    });

    // Taxes Payable (21400-21499)
    addAccount('taxes_payable_id', { 
      account_code: '21400', 
      account_name: 'Taxes Payable', 
      account_type: 'liability', 
      account_group: 'Taxes Payable', 
      parent_account_id: insertedAccountIds['current_liability_id'], 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Tax obligations due within one year'
    });

    // Current Portion of Long-term Debt (21500-21599)
    addAccount('current_portion_lt_debt_id', { 
      account_code: '21500', 
      account_name: 'Current Portion of Long-term Debt', 
      account_type: 'liability', 
      account_group: 'Current Portion of Long-term Debt', 
      parent_account_id: insertedAccountIds['current_liability_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Portion of long-term debt due within one year'
    });

    // Unearned Revenue (21600-21699)
    addAccount('unearned_revenue_id', { 
      account_code: '21600', 
      account_name: 'Unearned Revenue', 
      account_type: 'liability', 
      account_group: 'Unearned Revenue', 
      parent_account_id: insertedAccountIds['current_liability_id'], 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Payments received for goods/services not yet delivered'
    });

    // ----------------- LONG-TERM LIABILITIES ----------------------------
    // Long-term Loans (22100-22199)
    addAccount('long_term_loans_id', { 
      account_code: '22100', 
      account_name: 'Long-term Loans', 
      account_type: 'liability', 
      account_group: 'Long-term Loans', 
      parent_account_id: insertedAccountIds['long_term_liability_id'], 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Loans payable beyond one year'
    });

    // Bonds Payable (22200-22299)
    addAccount('bonds_payable_id', { 
      account_code: '22200', 
      account_name: 'Bonds Payable', 
      account_type: 'liability', 
      account_group: 'Bonds Payable', 
      parent_account_id: insertedAccountIds['long_term_liability_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Corporate bonds issued to investors'
    });

    // Deferred Tax Liabilities (22300-22399)
    addAccount('deferred_tax_liabilities_id', { 
      account_code: '22300', 
      account_name: 'Deferred Tax Liabilities', 
      account_type: 'liability', 
      account_group: 'Deferred Tax Liabilities', 
      parent_account_id: insertedAccountIds['long_term_liability_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Future tax obligations from temporary differences'
    });

    // ----------------------- PROVISIONS --------------------------------
    // Employee Benefits (23100-23199)
    addAccount('employee_benefits_provision_id', { 
      account_code: '23100', 
      account_name: 'Provision for Employee Benefits', 
      account_type: 'liability', 
      account_group: 'Provision for Employee Benefits', 
      parent_account_id: insertedAccountIds['provisions_id'], 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Estimated liabilities for employee benefits'
    });

    // Warranties (23200-23299)
    addAccount('warranty_provision_id', { 
      account_code: '23200', 
      account_name: 'Provision for Warranties', 
      account_type: 'liability', 
      account_group: 'Provision for Warranties', 
      parent_account_id: insertedAccountIds['provisions_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Estimated costs for product warranties'
    });

    // Restructuring (23300-23399)
    addAccount('restructuring_provision_id', { 
      account_code: '23300', 
      account_name: 'Provision for Restructuring', 
      account_type: 'liability', 
      account_group: 'Provision for Restructuring', 
      parent_account_id: insertedAccountIds['provisions_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Estimated costs for business restructuring'
    });

    // ----------------------- SHARE CAPITAL ----------------------------
    // Common Stock (31100-31199)
    addAccount('common_stock_id', { 
      account_code: '31100', 
      account_name: 'Common Stock', 
      account_type: 'equity', 
      account_group: 'Common Stock', 
      parent_account_id: insertedAccountIds['share_capital_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Par value of common shares issued'
    });

    // Preferred Stock (31200-31299)
    addAccount('preferred_stock_id', { 
      account_code: '31200', 
      account_name: 'Preferred Stock', 
      account_type: 'equity', 
      account_group: 'Preferred Stock', 
      parent_account_id: insertedAccountIds['share_capital_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Par value of preferred shares issued'
    });

    // Additional Paid-in Capital (31300-31399)
    addAccount('additional_paid_in_capital_id', { 
      account_code: '31300', 
      account_name: 'Additional Paid-in Capital', 
      account_type: 'equity', 
      account_group: 'Additional Paid-in Capital', 
      parent_account_id: insertedAccountIds['share_capital_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Amounts received for shares above par value'
    });

    // ------------------------- RESERVES -------------------------------
    // Capital Reserves (33100-33199)
    addAccount('capital_reserves_id', { 
      account_code: '33100', 
      account_name: 'Capital Reserves', 
      account_type: 'equity', 
      account_group: 'Capital Reserves', 
      parent_account_id: insertedAccountIds['reserves_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Reserves from capital transactions'
    });

    // Revenue Reserves (33200-33299)
    addAccount('revenue_reserves_id', { 
      account_code: '33200', 
      account_name: 'Revenue Reserves', 
      account_type: 'equity', 
      account_group: 'Revenue Reserves', 
      parent_account_id: insertedAccountIds['reserves_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Reserves from retained earnings'
    });

    // Statutory Reserves (33300-33399)
    addAccount('statutory_reserves_id', { 
      account_code: '33300', 
      account_name: 'Statutory Reserves', 
      account_type: 'equity', 
      account_group: 'Statutory Reserves', 
      parent_account_id: insertedAccountIds['reserves_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Reserves required by law or regulation'
    });

    // -------------------- DRAWINGS/DIVIDENDS -------------------------
    // Owner's Drawings (34100-34199)
    addAccount('owners_drawings_id', { 
      account_code: '34100', 
      account_name: 'Owner\'s Drawings', 
      account_type: 'equity', 
      account_group: 'Owner\'s Drawings', 
      parent_account_id: insertedAccountIds['drawings_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Withdrawals by business owner (sole proprietorship/partnership)'
    });

    // Dividends Paid (34200-34299)
    addAccount('dividends_paid_id', { 
      account_code: '34200', 
      account_name: 'Dividends Paid', 
      account_type: 'equity', 
      account_group: 'Dividends Paid', 
      parent_account_id: insertedAccountIds['drawings_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Dividends distributed to shareholders'
    });

    // ---------------------- SALES REVENUE ---------------------------
    // Product Sales (41100-41199)
    addAccount('product_sales_id', { 
      account_code: '41100', 
      account_name: 'Product Sales', 
      account_type: 'income', 
      account_group: 'Product Sales', 
      parent_account_id: insertedAccountIds['sales_revenue_id'], 
      is_group: true, 
      balance_type: 'credit',
      comment: 'Revenue from sale of goods'
    });

    // Sales Returns & Allowances (41200-41299)
    addAccount('sales_returns_id', { 
      account_code: '41200', 
      account_name: 'Sales Returns & Allowances', 
      account_type: 'income', 
      account_group: 'Sales Returns & Allowances', 
      parent_account_id: insertedAccountIds['sales_revenue_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Reductions in revenue from returns or allowances'
    });

    // Sales Discounts (41300-41399)
    addAccount('sales_discounts_id', { 
      account_code: '41300', 
      account_name: 'Sales Discounts', 
      account_type: 'income', 
      account_group: 'Sales Discounts', 
      parent_account_id: insertedAccountIds['sales_revenue_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Discounts given to customers'
    });

    // -------------------- SERVICE REVENUE ---------------------------
    // Service Fees (42100-42199)
    addAccount('service_fees_id', { 
      account_code: '42100', 
      account_name: 'Service Fees', 
      account_type: 'income', 
      account_group: 'Service Fees', 
      parent_account_id: insertedAccountIds['service_revenue_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Revenue from service provision'
    });

    // Maintenance Contracts (42200-42299)
    addAccount('maintenance_contracts_id', { 
      account_code: '42200', 
      account_name: 'Maintenance Contracts', 
      account_type: 'income', 
      account_group: 'Maintenance Contracts', 
      parent_account_id: insertedAccountIds['service_revenue_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Revenue from maintenance/service agreements'
    });

    // Consulting Fees (42300-42399)
    addAccount('consulting_fees_id', { 
      account_code: '42300', 
      account_name: 'Consulting Fees', 
      account_type: 'income', 
      account_group: 'Consulting Fees', 
      parent_account_id: insertedAccountIds['service_revenue_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Revenue from professional consulting services'
    });

    // --------------------- OTHER INCOME ----------------------------
    // Interest Income (43100-43199)
    addAccount('interest_income_id', { 
      account_code: '43100', 
      account_name: 'Interest Income', 
      account_type: 'income', 
      account_group: 'Interest Income', 
      parent_account_id: insertedAccountIds['other_income_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Earnings from interest-bearing accounts/investments'
    });

    // Dividend Income (43200-43299)
    addAccount('dividend_income_id', { 
      account_code: '43200', 
      account_name: 'Dividend Income', 
      account_type: 'income', 
      account_group: 'Dividend Income', 
      parent_account_id: insertedAccountIds['other_income_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Dividends received from investments'
    });

    // Rental Income (43300-43399)
    addAccount('rental_income_id', { 
      account_code: '43300', 
      account_name: 'Rental Income', 
      account_type: 'income', 
      account_group: 'Rental Income', 
      parent_account_id: insertedAccountIds['other_income_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Income from property rentals'
    });

    // Gain on Sale of Assets (43400-43499)
    addAccount('gain_sale_assets_id', { 
      account_code: '43400', 
      account_name: 'Gain on Sale of Assets', 
      account_type: 'income', 
      account_group: 'Gain on Sale of Assets', 
      parent_account_id: insertedAccountIds['other_income_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Profit from disposal of fixed assets'
    });

    // Foreign Exchange Gain (43500-43599)
    addAccount('forex_gain_id', { 
      account_code: '43500', 
      account_name: 'Foreign Exchange Gain', 
      account_type: 'income', 
      account_group: 'Foreign Exchange Gain', 
      parent_account_id: insertedAccountIds['other_income_id'], 
      is_group: false, 
      balance_type: 'credit',
      comment: 'Gains from currency exchange rate fluctuations'
    });

    // -------------------- COST OF GOODS SOLD -----------------------
    // Direct Materials (51100-51199)
    addAccount('direct_materials_id', { 
      account_code: '51100', 
      account_name: 'Direct Materials', 
      account_type: 'expense', 
      account_group: 'Direct Materials', 
      parent_account_id: insertedAccountIds['cogs_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Raw materials used in production'
    });

    // Direct Labor (51200-51299)
    addAccount('direct_labor_id', { 
      account_code: '51200', 
      account_name: 'Direct Labor', 
      account_type: 'expense', 
      account_group: 'Direct Labor', 
      parent_account_id: insertedAccountIds['cogs_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Wages for production workers'
    });

    // Manufacturing Overhead (51300-51399)
    addAccount('manufacturing_overhead_id', { 
      account_code: '51300', 
      account_name: 'Manufacturing Overhead', 
      account_type: 'expense', 
      account_group: 'Manufacturing Overhead', 
      parent_account_id: insertedAccountIds['cogs_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Indirect production costs'
    });

    // Purchases (51400-51499)
    addAccount('purchases_id', { 
      account_code: '51400', 
      account_name: 'Purchases', 
      account_type: 'expense', 
      account_group: 'Purchases', 
      parent_account_id: insertedAccountIds['cogs_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Cost of merchandise purchased for resale'
    });

    // Freight In (51500-51599)
    addAccount('freight_in_id', { 
      account_code: '51500', 
      account_name: 'Freight In', 
      account_type: 'expense', 
      account_group: 'Freight In', 
      parent_account_id: insertedAccountIds['cogs_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Transportation costs for incoming goods'
    });

    // ----------------- OPERATING EXPENSES --------------------------
    // Salaries & Wages (52100-52199)
    addAccount('salaries_wages_id', { 
      account_code: '52100', 
      account_name: 'Salaries & Wages', 
      account_type: 'expense', 
      account_group: 'Salaries & Wages', 
      parent_account_id: insertedAccountIds['operating_expense_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Compensation for non-production employees'
    });

    // Rent Expense (52200-52299)
    addAccount('rent_expense_id', { 
      account_code: '52200', 
      account_name: 'Rent Expense', 
      account_type: 'expense', 
      account_group: 'Rent Expense', 
      parent_account_id: insertedAccountIds['operating_expense_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Costs for leased facilities'
    });

    // Utilities (52300-52399)
    addAccount('utilities_id', { 
      account_code: '52300', 
      account_name: 'Utilities', 
      account_type: 'expense', 
      account_group: 'Utilities', 
      parent_account_id: insertedAccountIds['operating_expense_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Electricity, water, gas, etc.'
    });

    // Office Supplies (52400-52499)
    addAccount('office_supplies_id', { 
      account_code: '52400', 
      account_name: 'Office Supplies', 
      account_type: 'expense', 
      account_group: 'Office Supplies', 
      parent_account_id: insertedAccountIds['operating_expense_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Consumable office materials'
    });

    // Insurance (52500-52599)
    addAccount('insurance_id', { 
      account_code: '52500', 
      account_name: 'Insurance', 
      account_type: 'expense', 
      account_group: 'Insurance', 
      parent_account_id: insertedAccountIds['operating_expense_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Business insurance premiums'
    });

    // Repairs & Maintenance (52600-52699)
    addAccount('repairs_maintenance_id', { 
      account_code: '52600', 
      account_name: 'Repairs & Maintenance', 
      account_type: 'expense', 
      account_group: 'Repairs & Maintenance', 
      parent_account_id: insertedAccountIds['operating_expense_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Costs to maintain property and equipment'
    });

    // Advertising & Marketing (52700-52799)
    addAccount('advertising_marketing_id', { 
      account_code: '52700', 
      account_name: 'Advertising & Marketing', 
      account_type: 'expense', 
      account_group: 'Advertising & Marketing', 
      parent_account_id: insertedAccountIds['operating_expense_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Promotional and marketing costs'
    });

    // Travel & Entertainment (52800-52899)
    addAccount('travel_entertainment_id', { 
      account_code: '52800', 
      account_name: 'Travel & Entertainment', 
      account_type: 'expense', 
      account_group: 'Travel & Entertainment', 
      parent_account_id: insertedAccountIds['operating_expense_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Business travel and client entertainment'
    });

    // Professional Fees (52900-52999)
    addAccount('professional_fees_id', { 
      account_code: '52900', 
      account_name: 'Professional Fees', 
      account_type: 'expense', 
      account_group: 'Professional Fees', 
      parent_account_id: insertedAccountIds['operating_expense_id'], 
      is_group: true, 
      balance_type: 'debit',
      comment: 'Legal, accounting, consulting fees'
    });

    // ----------------- FINANCIAL EXPENSES -------------------------
    // Interest Expense (53100-53199)
    addAccount('interest_expense_id', { 
      account_code: '53100', 
      account_name: 'Interest Expense', 
      account_type: 'expense', 
      account_group: 'Interest Expense', 
      parent_account_id: insertedAccountIds['financial_expense_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Interest on loans and credit facilities'
    });

    // Bank Charges (53200-53299)
    addAccount('bank_charges_id', { 
      account_code: '53200', 
      account_name: 'Bank Charges', 
      account_type: 'expense', 
      account_group: 'Bank Charges', 
      parent_account_id: insertedAccountIds['financial_expense_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Fees charged by financial institutions'
    });

    // Foreign Exchange Loss (53300-53399)
    addAccount('forex_loss_id', { 
      account_code: '53300', 
      account_name: 'Foreign Exchange Loss', 
      account_type: 'expense', 
      account_group: 'Foreign Exchange Loss', 
      parent_account_id: insertedAccountIds['financial_expense_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Losses from currency exchange rate fluctuations'
    });

    // ----------------- DEPRECIATION & AMORTIZATION ----------------
    // Depreciation Expense (54100-54199)
    addAccount('depreciation_expense_id', { 
      account_code: '54100', 
      account_name: 'Depreciation Expense', 
      account_type: 'expense', 
      account_group: 'Depreciation Expense', 
      parent_account_id: insertedAccountIds['depreciation_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Periodic allocation of tangible asset costs'
    });

    // Amortization Expense (54200-54299)
    addAccount('amortization_expense_id', { 
      account_code: '54200', 
      account_name: 'Amortization Expense', 
      account_type: 'expense', 
      account_group: 'Amortization Expense', 
      parent_account_id: insertedAccountIds['depreciation_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Periodic allocation of intangible asset costs'
    });

    // ------------------------- TAXES ------------------------------
    // Income Tax Expense (55100-55199)
    addAccount('income_tax_expense_id', { 
      account_code: '55100', 
      account_name: 'Income Tax Expense', 
      account_type: 'expense', 
      account_group: 'Income Tax Expense', 
      parent_account_id: insertedAccountIds['taxes_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Current period income tax provision'
    });

    // Property Tax (55200-55299)
    addAccount('property_tax_id', { 
      account_code: '55200', 
      account_name: 'Property Tax', 
      account_type: 'expense', 
      account_group: 'Property Tax', 
      parent_account_id: insertedAccountIds['taxes_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Taxes on owned property'
    });

    // Sales Tax (55300-55399)
    addAccount('sales_tax_id', { 
      account_code: '55300', 
      account_name: 'Sales Tax', 
      account_type: 'expense', 
      account_group: 'Sales Tax', 
      parent_account_id: insertedAccountIds['taxes_id'], 
      is_group: false, 
      balance_type: 'debit',
      comment: 'Taxes on sales (where applicable)'
    });

    // ======================================================================
    // 4. COUNTRY-SPECIFIC ACCOUNTS (e.g., GST for India)
    // ======================================================================
    
    // Add country-specific groups and accounts
    for (const group of countrySpecificGroups) {
      addAccount(group.account_code, {
        ...group,
        parent_account_id: insertedAccountIds[group.parent_account_key] || null
      });
    }

    // Add country-specific tax accounts
    for (const taxAccount of taxAccountsTemplate) {
      // Determine parent account (default to taxes payable if not specified)
      const parentId = taxAccount.parent_account_key ? 
        insertedAccountIds[taxAccount.parent_account_key] : 
        insertedAccountIds['taxes_payable_id'];
      
      addAccount(taxAccount.account_code, {
        ...taxAccount,
        parent_account_id: parentId,
        is_default: taxAccount.is_default || false, // NEW: Pass is_default from template
      });
    }

    // Insert all remaining accounts in a single batch
    const { error: finalInsertError } = await supabase
      .from('chart_of_accounts')
      .insert(accountsToInsert);
    
    if (finalInsertError) throw finalInsertError;

    console.log('Chart of Accounts population completed successfully.');

  } catch (error) {
    console.error('Error populating Chart of Accounts:', error);
    throw new Error('Failed to populate default Chart of Accounts');
  }
}