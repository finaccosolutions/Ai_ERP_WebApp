// src/lib/coaSetup.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './supabase';
import { getCountryByCode } from '../constants/geoData';

export async function populateDefaultChartOfAccounts(supabase: SupabaseClient<Database>, companyId: string, countryCode: string) {
  console.log(`Populating Chart of Accounts for Company ID: ${companyId} and Country: ${countryCode}`);

  try {
    // Use a temporary array to collect accounts for each batch
    let currentBatchAccounts: Database['public']['Tables']['chart_of_accounts']['Insert'][] = [];
    const insertedAccountIds: { [key: string]: string } = {}; // Stores IDs of all accounts (newly inserted or pre-existing)

    // Helper function to add accounts to the current batch
    const addAccountToBatch = (key: string, account: Partial<Database['public']['Tables']['chart_of_accounts']['Insert']>) => {
      if (!account.account_code || !account.account_name) {
        throw new Error(`Account code and name are required for ${key}`);
      }
      
      const { parent_account_key, ...restOfAccount } = account;
      
      const newAccount = {
        ...restOfAccount,
        company_id: companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_default: account.is_default || false,
      };
      
      currentBatchAccounts.push(newAccount as Database['public']['Tables']['chart_of_accounts']['Insert']);
    };

    // Function to process and insert a batch of accounts
    const processAndInsertBatch = async (batchName: string) => {
      if (currentBatchAccounts.length === 0) return;

      // Get existing accounts for this company to avoid duplicates
      const { data: existingAccounts, error: existingAccountsError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code')
        .eq('company_id', companyId)
        .in('account_code', currentBatchAccounts.map(acc => acc.account_code)); // Only check for codes in current batch

      if (existingAccountsError) throw existingAccountsError;

      const existingAccountCodesMap = new Map(existingAccounts.map(acc => [acc.account_code, acc.id]));

      const accountsToInsertInDb = currentBatchAccounts.filter(
        acc => !existingAccountCodesMap.has(acc.account_code)
      );

      let newlyInsertedData: { id: string; account_code: string; }[] = [];
      if (accountsToInsertInDb.length > 0) {
        const { data: insertedData, error: insertError } = await supabase
          .from('chart_of_accounts')
          .insert(accountsToInsertInDb)
          .select('id, account_code');
        
        if (insertError) throw insertError;
        newlyInsertedData = insertedData;
      }

      // Update insertedAccountIds with IDs from both newly inserted and pre-existing accounts
      currentBatchAccounts.forEach(acc => {
        const existingId = existingAccountCodesMap.get(acc.account_code);
        if (existingId) {
          insertedAccountIds[acc.account_code] = existingId;
        } else {
          const newlyInserted = newlyInsertedData.find(item => item.account_code === acc.account_code);
          if (newlyInserted) {
            insertedAccountIds[acc.account_code] = newlyInserted.id;
          }
        }
      });

      currentBatchAccounts = []; // Clear batch for next use
    };


    // Get country-specific configuration
    const countryConfig = getCountryByCode(countryCode);
    const taxAccountsTemplate = countryConfig?.chartOfAccountsTemplate?.taxAccounts || [];
    const countrySpecificGroups = countryConfig?.chartOfAccountsTemplate?.groups || [];

    // ======================================================================
    // 1. TOP-LEVEL GROUPS (Balance Sheet & Income Statement Categories)
    // ======================================================================
    
    // Assets (10000-19999)
    addAccountToBatch('10000', { account_code: '10000', account_name: 'Assets', account_type: 'asset', account_group: 'Assets', is_group: true, balance_type: 'debit', comment: 'All company assets including current, fixed, and intangible assets' });
    // Liabilities (20000-29999)
    addAccountToBatch('20000', { account_code: '20000', account_name: 'Liabilities', account_type: 'liability', account_group: 'Liabilities', is_group: true, balance_type: 'credit', comment: 'Company obligations including current and long-term liabilities' });
    // Equity (30000-39999)
    addAccountToBatch('30000', { account_code: '30000', account_name: 'Equity', account_type: 'equity', account_group: 'Equity', is_group: true, balance_type: 'credit', comment: 'Owner\'s equity including capital, retained earnings, and reserves' });
    // Income (40000-49999)
    addAccountToBatch('40000', { account_code: '40000', account_name: 'Income', account_type: 'income', account_group: 'Income', is_group: true, balance_type: 'credit', comment: 'Revenue from primary operations and other income sources' });
    // Expenses (50000-59999)
    addAccountToBatch('50000', { account_code: '50000', account_name: 'Expenses', account_type: 'expense', account_group: 'Expenses', is_group: true, balance_type: 'debit', comment: 'All business expenses including COGS, operating, and financial expenses' });

    await processAndInsertBatch('Top-Level Groups');

    // ======================================================================
    // 2. SECOND-LEVEL GROUPS (Major Account Categories)
    // ======================================================================

    // ------------------------- ASSETS (10000-19999) -----------------------
    addAccountToBatch('11000', { account_code: '11000', account_name: 'Current Assets', account_type: 'asset', account_group: 'Current Assets', parent_account_id: insertedAccountIds['10000'], is_group: true, balance_type: 'debit', comment: 'Assets expected to be converted to cash within one year' });
    addAccountToBatch('12000', { account_code: '12000', account_name: 'Fixed Assets', account_type: 'asset', account_group: 'Fixed Assets', parent_account_id: insertedAccountIds['10000'], is_group: true, balance_type: 'debit', comment: 'Long-term tangible assets used in business operations' });
    addAccountToBatch('13000', { account_code: '13000', account_name: 'Intangible Assets', account_type: 'asset', account_group: 'Intangible Assets', parent_account_id: insertedAccountIds['10000'], is_group: true, balance_type: 'debit', comment: 'Non-physical assets with long-term value' });
    addAccountToBatch('14000', { account_code: '14000', account_name: 'Investments', account_type: 'asset', account_group: 'Investments', parent_account_id: insertedAccountIds['10000'], is_group: true, balance_type: 'debit', comment: 'Financial investments including stocks, bonds, and other securities' });
    addAccountToBatch('15000', { account_code: '15000', account_name: 'Other Assets', account_type: 'asset', account_group: 'Other Assets', parent_account_id: insertedAccountIds['10000'], is_group: true, balance_type: 'debit', comment: 'Miscellaneous current assets not fitting other categories' });

    // ---------------------- LIABILITIES (20000-29999) ---------------------
    addAccountToBatch('21000', { account_code: '21000', account_name: 'Current Liabilities', account_type: 'liability', account_group: 'Current Liabilities', parent_account_id: insertedAccountIds['20000'], is_group: true, balance_type: 'credit', comment: 'Obligations due within one year' });
    addAccountToBatch('22000', { account_code: '22000', account_name: 'Long-term Liabilities', account_type: 'liability', account_group: 'Long-term Liabilities', parent_account_id: insertedAccountIds['20000'], is_group: true, balance_type: 'credit', comment: 'Obligations due beyond one year' });
    addAccountToBatch('23000', { account_code: '23000', account_name: 'Provisions', account_type: 'liability', account_group: 'Provisions', parent_account_id: insertedAccountIds['20000'], is_group: true, balance_type: 'credit', comment: 'Estimated liabilities for future obligations' });

    // ------------------------ EQUITY (30000-39999) -----------------------
    addAccountToBatch('31000', { account_code: '31000', account_name: 'Share Capital', account_type: 'equity', account_group: 'Share Capital', parent_account_id: insertedAccountIds['30000'], is_group: true, balance_type: 'debit', comment: 'Capital contributed by shareholders' });
    addAccountToBatch('32000', { account_code: '32000', account_name: 'Retained Earnings', account_type: 'equity', account_group: 'Retained Earnings', parent_account_id: insertedAccountIds['30000'], is_group: false, balance_type: 'credit', comment: 'Accumulated profits not distributed as dividends' });
    addAccountToBatch('33000', { account_code: '33000', account_name: 'Reserves', account_type: 'equity', account_group: 'Reserves', parent_account_id: insertedAccountIds['30000'], is_group: true, balance_type: 'credit', comment: 'Various reserves including statutory and capital reserves' });
    addAccountToBatch('34000', { account_code: '34000', account_name: 'Drawings/Dividends', account_type: 'equity', account_group: 'Drawings/Dividends', parent_account_id: insertedAccountIds['30000'], is_group: true, balance_type: 'debit', comment: 'Owner withdrawals or dividends paid to shareholders' });

    // ------------------------ INCOME (40000-49999) -----------------------
    addAccountToBatch('41000', { account_code: '41000', account_name: 'Sales Revenue', account_type: 'income', account_group: 'Sales Revenue', parent_account_id: insertedAccountIds['40000'], is_group: true, balance_type: 'credit', comment: 'Revenue from primary business operations' });
    addAccountToBatch('42000', { account_code: '42000', account_name: 'Service Revenue', account_type: 'income', account_group: 'Service Revenue', parent_account_id: insertedAccountIds['40000'], is_group: true, balance_type: 'credit', comment: 'Revenue from service provision' });
    addAccountToBatch('43000', { account_code: '43000', account_name: 'Other Income', account_type: 'income', account_group: 'Other Income', parent_account_id: insertedAccountIds['40000'], is_group: true, balance_type: 'credit', comment: 'Income from non-core business activities' });

    // ----------------------- EXPENSES (50000-59999) -----------------------
    addAccountToBatch('51000', { account_code: '51000', account_name: 'Cost of Goods Sold', account_type: 'expense', account_group: 'Cost of Goods Sold', parent_account_id: insertedAccountIds['50000'], is_group: true, balance_type: 'debit', comment: 'Direct costs attributable to production of goods sold' });
    addAccountToBatch('52000', { account_code: '52000', account_name: 'Operating Expenses', account_type: 'expense', account_group: 'Operating Expenses', parent_account_id: insertedAccountIds['50000'], is_group: true, balance_type: 'debit', comment: 'Expenses incurred in normal business operations' });
    addAccountToBatch('53000', { account_code: '53000', account_name: 'Financial Expenses', account_type: 'expense', account_group: 'Financial Expenses', parent_account_id: insertedAccountIds['50000'], is_group: true, balance_type: 'debit', comment: 'Expenses related to financing activities' });
    addAccountToBatch('54000', { account_code: '54000', account_name: 'Depreciation & Amortization', account_type: 'expense', account_group: 'Depreciation & Amortization', parent_account_id: insertedAccountIds['50000'], is_group: true, balance_type: 'debit', comment: 'Allocation of asset costs over their useful lives' });
    addAccountToBatch('55000', { account_code: '55000', account_name: 'Taxes', account_type: 'expense', account_group: 'Taxes', parent_account_id: insertedAccountIds['50000'], is_group: true, balance_type: 'debit', comment: 'Various tax expenses including income tax, property tax, etc.' });

    await processAndInsertBatch('Second-Level Groups');

    // ======================================================================
    // 3. THIRD-LEVEL GROUPS AND LEDGER ACCOUNTS (Detailed Accounts)
    // ======================================================================

    // ------------------------- CURRENT ASSETS -----------------------------
    addAccountToBatch('11100', { account_code: '11100', account_name: 'Cash & Cash Equivalents', account_type: 'asset', account_group: 'Cash & Cash Equivalents', parent_account_id: insertedAccountIds['11000'], is_group: true, balance_type: 'debit', comment: 'Highly liquid assets including cash, bank accounts, and short-term investments' });
    addAccountToBatch('11200', { account_code: '11200', account_name: 'Accounts Receivable', account_type: 'asset', account_group: 'Accounts Receivable', parent_account_id: insertedAccountIds['11000'], is_group: true, balance_type: 'debit', comment: 'Amounts owed by customers for goods/services sold on credit' });
    addAccountToBatch('11300', { account_code: '11300', account_name: 'Inventory', account_type: 'asset', account_group: 'Inventory', parent_account_id: insertedAccountIds['11000'], is_group: true, balance_type: 'debit', comment: 'Goods held for sale in the ordinary course of business' });
    addAccountToBatch('11400', { account_code: '11400', account_name: 'Prepaid Expenses', account_type: 'asset', account_group: 'Prepaid Expenses', parent_account_id: insertedAccountIds['11000'], is_group: true, balance_type: 'debit', comment: 'Expenses paid in advance for future periods' });
    addAccountToBatch('11500', { account_code: '11500', account_name: 'Other Current Assets', account_type: 'asset', account_group: 'Other Current Assets', parent_account_id: insertedAccountIds['11000'], is_group: true, balance_type: 'debit', comment: 'Miscellaneous current assets not fitting other categories' });

    // ------------------------- FIXED ASSETS ------------------------------
    addAccountToBatch('12100', { account_code: '12100', account_name: 'Land & Buildings', account_type: 'asset', account_group: 'Land & Buildings', parent_account_id: insertedAccountIds['12000'], is_group: true, balance_type: 'debit', comment: 'Real property including land and structures' });
    addAccountToBatch('12200', { account_code: '12200', account_name: 'Plant & Machinery', account_type: 'asset', account_group: 'Plant & Machinery', parent_account_id: insertedAccountIds['12000'], is_group: true, balance_type: 'debit', comment: 'Heavy equipment and machinery used in production' });
    addAccountToBatch('12300', { account_code: '12300', account_name: 'Furniture & Fixtures', account_type: 'asset', account_group: 'Furniture & Fixtures', parent_account_id: insertedAccountIds['12000'], is_group: true, balance_type: 'debit', comment: 'Office furniture and related equipment' });
    addAccountToBatch('12400', { account_code: '12400', account_name: 'Vehicles', account_type: 'asset', account_group: 'Vehicles', parent_account_id: insertedAccountIds['12000'], is_group: true, balance_type: 'debit', comment: 'Company-owned automobiles and transportation equipment' });
    addAccountToBatch('12500', { account_code: '12500', account_name: 'Computer Equipment', account_type: 'asset', account_group: 'Computer Equipment', parent_account_id: insertedAccountIds['12000'], is_group: true, balance_type: 'debit', comment: 'Hardware including computers, servers, and peripherals' });
    addAccountToBatch('12600', { account_code: '12600', account_name: 'Accumulated Depreciation', account_type: 'asset', account_group: 'Accumulated Depreciation', parent_account_id: insertedAccountIds['12000'], is_group: true, balance_type: 'credit', comment: 'Cumulative depreciation of fixed assets' });

    // ----------------------- INTANGIBLE ASSETS ---------------------------
    addAccountToBatch('13100', { account_code: '13100', account_name: 'Goodwill', account_type: 'asset', account_group: 'Goodwill', parent_account_id: insertedAccountIds['13000'], is_group: false, balance_type: 'debit', comment: 'Excess of purchase price over fair value of net assets acquired' });
    addAccountToBatch('13200', { account_code: '13200', account_name: 'Patents & Trademarks', account_type: 'asset', account_group: 'Patents & Trademarks', parent_account_id: insertedAccountIds['13000'], is_group: true, balance_type: 'debit', comment: 'Legal rights to inventions and brand identifiers' });
    addAccountToBatch('13300', { account_code: '13300', account_name: 'Software & Licenses', account_type: 'asset', account_group: 'Software & Licenses', parent_account_id: insertedAccountIds['13000'], is_group: true, balance_type: 'debit', comment: 'Purchased software and licensing rights' });
    addAccountToBatch('13400', { account_code: '13400', account_name: 'Accumulated Amortization', account_type: 'asset', account_group: 'Accumulated Amortization', parent_account_id: insertedAccountIds['13000'], is_group: true, balance_type: 'credit', comment: 'Cumulative amortization of intangible assets' });

    // ------------------------- INVESTMENTS -------------------------------
    addAccountToBatch('14100', { account_code: '14100', account_name: 'Short-term Investments', account_type: 'asset', account_group: 'Short-term Investments', parent_account_id: insertedAccountIds['14000'], is_group: true, balance_type: 'debit', comment: 'Investments maturing within one year' });
    addAccountToBatch('14200', { account_code: '14200', account_name: 'Long-term Investments', account_type: 'asset', account_group: 'Long-term Investments', parent_account_id: insertedAccountIds['14000'], is_group: true, balance_type: 'debit', comment: 'Investments held for longer than one year' });

    // ------------------------ OTHER ASSETS ------------------------------
    addAccountToBatch('15100', { account_code: '15100', account_name: 'Deferred Tax Assets', account_type: 'asset', account_group: 'Deferred Tax Assets', parent_account_id: insertedAccountIds['15000'], is_group: false, balance_type: 'debit', comment: 'Future tax benefits from temporary differences' });
    addAccountToBatch('15200', { account_code: '15200', account_name: 'Security Deposits', account_type: 'asset', account_group: 'Security Deposits', parent_account_id: insertedAccountIds['15000'], is_group: true, balance_type: 'debit', comment: 'Refundable deposits paid to vendors or landlords' });
    addAccountToBatch('15300', { account_code: '15300', account_name: 'Loans to Employees', account_type: 'asset', account_group: 'Loans to Employees', parent_account_id: insertedAccountIds['15000'], is_group: true, balance_type: 'debit', comment: 'Amounts loaned to employees to be repaid' });

    // -------------------- CURRENT LIABILITIES ----------------------------
    addAccountToBatch('21100', { account_code: '21100', account_name: 'Accounts Payable', account_type: 'liability', account_group: 'Accounts Payable', parent_account_id: insertedAccountIds['21000'], is_group: true, balance_type: 'credit', comment: 'Amounts owed to suppliers for goods/services purchased on credit' });
    addAccountToBatch('21200', { account_code: '21200', account_name: 'Short-term Loans', account_type: 'liability', account_group: 'Short-term Loans', parent_account_id: insertedAccountIds['21000'], is_group: true, balance_type: 'credit', comment: 'Loans payable within one year' });
    addAccountToBatch('21300', { account_code: '21300', account_name: 'Accrued Expenses', account_type: 'liability', account_group: 'Accrued Expenses', parent_account_id: insertedAccountIds['21000'], is_group: true, balance_type: 'credit', comment: 'Expenses incurred but not yet paid' });
    addAccountToBatch('21400', { account_code: '21400', account_name: 'Taxes Payable', account_type: 'liability', account_group: 'Taxes Payable', parent_account_id: insertedAccountIds['21000'], is_group: true, balance_type: 'credit', comment: 'Tax obligations due within one year' });
    addAccountToBatch('21500', { account_code: '21500', account_name: 'Current Portion of Long-term Debt', account_type: 'liability', account_group: 'Current Portion of Long-term Debt', parent_account_id: insertedAccountIds['21000'], is_group: false, balance_type: 'credit', comment: 'Portion of long-term debt due within one year' });
    addAccountToBatch('21600', { account_code: '21600', account_name: 'Unearned Revenue', account_type: 'liability', account_group: 'Unearned Revenue', parent_account_id: insertedAccountIds['21000'], is_group: true, balance_type: 'credit', comment: 'Payments received for goods/services not yet delivered' });

    // ----------------- LONG-TERM LIABILITIES ----------------------------
    addAccountToBatch('22100', { account_code: '22100', account_name: 'Long-term Loans', account_type: 'liability', account_group: 'Long-term Loans', parent_account_id: insertedAccountIds['22000'], is_group: true, balance_type: 'credit', comment: 'Loans payable beyond one year' });
    addAccountToBatch('22200', { account_code: '22200', account_name: 'Bonds Payable', account_type: 'liability', account_group: 'Bonds Payable', parent_account_id: insertedAccountIds['22000'], is_group: false, balance_type: 'credit', comment: 'Corporate bonds issued to investors' });
    addAccountToBatch('22300', { account_code: '22300', account_name: 'Deferred Tax Liabilities', account_type: 'liability', account_group: 'Deferred Tax Liabilities', parent_account_id: insertedAccountIds['22000'], is_group: false, balance_type: 'credit', comment: 'Future tax obligations from temporary differences' });

    // ----------------------- PROVISIONS --------------------------------
    addAccountToBatch('23100', { account_code: '23100', account_name: 'Provision for Employee Benefits', account_type: 'liability', account_group: 'Provision for Employee Benefits', parent_account_id: insertedAccountIds['23000'], is_group: true, balance_type: 'credit', comment: 'Estimated liabilities for employee benefits' });
    addAccountToBatch('23200', { account_code: '23200', account_name: 'Provision for Warranties', account_type: 'liability', account_group: 'Provision for Warranties', parent_account_id: insertedAccountIds['23000'], is_group: false, balance_type: 'credit', comment: 'Estimated costs for product warranties' });
    addAccountToBatch('23300', { account_code: '23300', account_name: 'Provision for Restructuring', account_type: 'liability', account_group: 'Provision for Restructuring', parent_account_id: insertedAccountIds['23000'], is_group: false, balance_type: 'credit', comment: 'Estimated costs for business restructuring' });

    // ----------------------- SHARE CAPITAL ----------------------------
    addAccountToBatch('31100', { account_code: '31100', account_name: 'Common Stock', account_type: 'equity', account_group: 'Common Stock', parent_account_id: insertedAccountIds['31000'], is_group: false, balance_type: 'credit', comment: 'Par value of common shares issued' });
    addAccountToBatch('31200', { account_code: '31200', account_name: 'Preferred Stock', account_type: 'equity', account_group: 'Preferred Stock', parent_account_id: insertedAccountIds['31000'], is_group: false, balance_type: 'credit', comment: 'Par value of preferred shares issued' });
    addAccountToBatch('31300', { account_code: '31300', account_name: 'Additional Paid-in Capital', account_type: 'equity', account_group: 'Additional Paid-in Capital', parent_account_id: insertedAccountIds['31000'], is_group: false, balance_type: 'credit', comment: 'Amounts received for shares above par value' });

    // ------------------------- RESERVES -------------------------------
    addAccountToBatch('33100', { account_code: '33100', account_name: 'Capital Reserves', account_type: 'equity', account_group: 'Capital Reserves', parent_account_id: insertedAccountIds['33000'], is_group: false, balance_type: 'credit', comment: 'Reserves from capital transactions' });
    addAccountToBatch('33200', { account_code: '33200', account_name: 'Revenue Reserves', account_type: 'equity', account_group: 'Revenue Reserves', parent_account_id: insertedAccountIds['33000'], is_group: false, balance_type: 'credit', comment: 'Reserves from retained earnings' });
    addAccountToBatch('33300', { account_code: '33300', account_name: 'Statutory Reserves', account_type: 'equity', account_group: 'Statutory Reserves', parent_account_id: insertedAccountIds['33000'], is_group: false, balance_type: 'credit', comment: 'Reserves required by law or regulation' });

    // -------------------- DRAWINGS/DIVIDENDS -------------------------
    addAccountToBatch('34100', { account_code: '34100', account_name: 'Owner\'s Drawings', account_type: 'equity', account_group: 'Owner\'s Drawings', parent_account_id: insertedAccountIds['34000'], is_group: false, balance_type: 'debit', comment: 'Withdrawals by business owner (sole proprietorship/partnership)' });
    addAccountToBatch('34200', { account_code: '34200', account_name: 'Dividends Paid', account_type: 'equity', account_group: 'Dividends Paid', parent_account_id: insertedAccountIds['34000'], is_group: false, balance_type: 'debit', comment: 'Dividends distributed to shareholders' });

    // ---------------------- SALES REVENUE ---------------------------
    addAccountToBatch('41100', { account_code: '41100', account_name: 'Product Sales', account_type: 'income', account_group: 'Product Sales', parent_account_id: insertedAccountIds['41000'], is_group: true, balance_type: 'credit', comment: 'Revenue from sale of goods' });
    addAccountToBatch('41200', { account_code: '41200', account_name: 'Sales Returns & Allowances', account_type: 'income', account_group: 'Sales Returns & Allowances', parent_account_id: insertedAccountIds['41000'], is_group: false, balance_type: 'debit', comment: 'Reductions in revenue from returns or allowances' });
    addAccountToBatch('41300', { account_code: '41300', account_name: 'Sales Discounts', account_type: 'income', account_group: 'Sales Discounts', parent_account_id: insertedAccountIds['41000'], is_group: false, balance_type: 'debit', comment: 'Discounts given to customers' });

    // -------------------- SERVICE REVENUE ---------------------------
    addAccountToBatch('42100', { account_code: '42100', account_name: 'Service Fees', account_type: 'income', account_group: 'Service Fees', parent_account_id: insertedAccountIds['42000'], is_group: false, balance_type: 'credit', comment: 'Revenue from service provision' });
    addAccountToBatch('42200', { account_code: '42200', account_name: 'Maintenance Contracts', account_type: 'income', account_group: 'Maintenance Contracts', parent_account_id: insertedAccountIds['42000'], is_group: false, balance_type: 'credit', comment: 'Revenue from maintenance/service agreements' });
    addAccountToBatch('42300', { account_code: '42300', account_name: 'Consulting Fees', account_type: 'income', account_group: 'Consulting Fees', parent_account_id: insertedAccountIds['42000'], is_group: false, balance_type: 'credit', comment: 'Revenue from professional consulting services' });

    // --------------------- OTHER INCOME ----------------------------
    addAccountToBatch('43100', { account_code: '43100', account_name: 'Interest Income', account_type: 'income', account_group: 'Interest Income', parent_account_id: insertedAccountIds['43000'], is_group: false, balance_type: 'credit', comment: 'Earnings from interest-bearing accounts/investments' });
    addAccountToBatch('43200', { account_code: '43200', account_name: 'Dividend Income', account_type: 'income', account_group: 'Dividend Income', parent_account_id: insertedAccountIds['43000'], is_group: false, balance_type: 'credit', comment: 'Dividends received from investments' });
    addAccountToBatch('43300', { account_code: '43300', account_name: 'Rental Income', account_type: 'income', account_group: 'Rental Income', parent_account_id: insertedAccountIds['43000'], is_group: false, balance_type: 'credit', comment: 'Income from property rentals' });
    addAccountToBatch('43400', { account_code: '43400', account_name: 'Gain on Sale of Assets', account_type: 'income', account_group: 'Gain on Sale of Assets', parent_account_id: insertedAccountIds['43000'], is_group: false, balance_type: 'credit', comment: 'Profit from disposal of fixed assets' });
    addAccountToBatch('43500', { account_code: '43500', account_name: 'Foreign Exchange Gain', account_type: 'income', account_group: 'Foreign Exchange Gain', parent_account_id: insertedAccountIds['43000'], is_group: false, balance_type: 'credit', comment: 'Gains from currency exchange rate fluctuations' });

    // -------------------- COST OF GOODS SOLD -----------------------
    addAccountToBatch('51100', { account_code: '51100', account_name: 'Direct Materials', account_type: 'expense', account_group: 'Direct Materials', parent_account_id: insertedAccountIds['51000'], is_group: false, balance_type: 'debit', comment: 'Raw materials used in production' });
    addAccountToBatch('51200', { account_code: '51200', account_name: 'Direct Labor', account_type: 'expense', account_group: 'Direct Labor', parent_account_id: insertedAccountIds['51000'], is_group: false, balance_type: 'debit', comment: 'Wages for production workers' });
    addAccountToBatch('51300', { account_code: '51300', account_name: 'Manufacturing Overhead', account_type: 'expense', account_group: 'Manufacturing Overhead', parent_account_id: insertedAccountIds['51000'], is_group: true, balance_type: 'debit', comment: 'Indirect production costs' });
    addAccountToBatch('51400', { account_code: '51400', account_name: 'Purchases', account_type: 'expense', account_group: 'Purchases', parent_account_id: insertedAccountIds['51000'], is_group: false, balance_type: 'debit', comment: 'Cost of merchandise purchased for resale' });
    addAccountToBatch('51500', { account_code: '51500', account_name: 'Freight In', account_type: 'expense', account_group: 'Freight In', parent_account_id: insertedAccountIds['51000'], is_group: false, balance_type: 'debit', comment: 'Transportation costs for incoming goods' });

    // ----------------- OPERATING EXPENSES --------------------------
    addAccountToBatch('52100', { account_code: '52100', account_name: 'Salaries & Wages', account_type: 'expense', account_group: 'Salaries & Wages', parent_account_id: insertedAccountIds['52000'], is_group: true, balance_type: 'debit', comment: 'Compensation for non-production employees' });
    addAccountToBatch('52200', { account_code: '52200', account_name: 'Rent Expense', account_type: 'expense', account_group: 'Rent Expense', parent_account_id: insertedAccountIds['52000'], is_group: false, balance_type: 'debit', comment: 'Costs for leased facilities' });
    addAccountToBatch('52300', { account_code: '52300', account_name: 'Utilities', account_type: 'expense', account_group: 'Utilities', parent_account_id: insertedAccountIds['52000'], is_group: true, balance_type: 'debit', comment: 'Electricity, water, gas, etc.' });
    addAccountToBatch('52400', { account_code: '52400', account_name: 'Office Supplies', account_type: 'expense', account_group: 'Office Supplies', parent_account_id: insertedAccountIds['52000'], is_group: false, balance_type: 'debit', comment: 'Consumable office materials' });
    addAccountToBatch('52500', { account_code: '52500', account_name: 'Insurance', account_type: 'expense', account_group: 'Insurance', parent_account_id: insertedAccountIds['52000'], is_group: true, balance_type: 'debit', comment: 'Business insurance premiums' });
    addAccountToBatch('52600', { account_code: '52600', account_name: 'Repairs & Maintenance', account_type: 'expense', account_group: 'Repairs & Maintenance', parent_account_id: insertedAccountIds['52000'], is_group: true, balance_type: 'debit', comment: 'Costs to maintain property and equipment' });
    addAccountToBatch('52700', { account_code: '52700', account_name: 'Advertising & Marketing', account_type: 'expense', account_group: 'Advertising & Marketing', parent_account_id: insertedAccountIds['52000'], is_group: true, balance_type: 'debit', comment: 'Promotional and marketing costs' });
    addAccountToBatch('52800', { account_code: '52800', account_name: 'Travel & Entertainment', account_type: 'expense', account_group: 'Travel & Entertainment', parent_account_id: insertedAccountIds['52000'], is_group: true, balance_type: 'debit', comment: 'Business travel and client entertainment' });
    addAccountToBatch('52900', { account_code: '52900', account_name: 'Professional Fees', account_type: 'expense', account_group: 'Professional Fees', parent_account_id: insertedAccountIds['52000'], is_group: true, balance_type: 'debit', comment: 'Legal, accounting, consulting fees' });

    // ----------------- FINANCIAL EXPENSES -------------------------
    addAccountToBatch('53100', { account_code: '53100', account_name: 'Interest Expense', account_type: 'expense', account_group: 'Interest Expense', parent_account_id: insertedAccountIds['53000'], is_group: false, balance_type: 'debit', comment: 'Interest on loans and credit facilities' });
    addAccountToBatch('53200', { account_code: '53200', account_name: 'Bank Charges', account_type: 'expense', account_group: 'Bank Charges', parent_account_id: insertedAccountIds['53000'], is_group: false, balance_type: 'debit', comment: 'Fees charged by financial institutions' });
    addAccountToBatch('53300', { account_code: '53300', account_name: 'Foreign Exchange Loss', account_type: 'expense', account_group: 'Foreign Exchange Loss', parent_account_id: insertedAccountIds['53000'], is_group: false, balance_type: 'debit', comment: 'Losses from currency exchange rate fluctuations' });

    // ----------------- DEPRECIATION & AMORTIZATION ----------------
    addAccountToBatch('54100', { account_code: '54100', account_name: 'Depreciation Expense', account_type: 'expense', account_group: 'Depreciation Expense', parent_account_id: insertedAccountIds['54000'], is_group: false, balance_type: 'debit', comment: 'Periodic allocation of tangible asset costs' });
    addAccountToBatch('54200', { account_code: '54200', account_name: 'Amortization Expense', account_type: 'expense', account_group: 'Amortization Expense', parent_account_id: insertedAccountIds['54000'], is_group: false, balance_type: 'debit', comment: 'Periodic allocation of intangible asset costs' });

    // ------------------------- TAXES ------------------------------
    addAccountToBatch('55100', { account_code: '55100', account_name: 'Income Tax Expense', account_type: 'expense', account_group: 'Income Tax Expense', parent_account_id: insertedAccountIds['55000'], is_group: false, balance_type: 'debit', comment: 'Current period income tax provision' });
    addAccountToBatch('55200', { account_code: '55200', account_name: 'Property Tax', account_type: 'expense', account_group: 'Property Tax', parent_account_id: insertedAccountIds['55000'], is_group: false, balance_type: 'debit', comment: 'Taxes on owned property' });
    addAccountToBatch('55300', { account_code: '55300', account_name: 'Sales Tax', account_type: 'expense', account_group: 'Sales Tax', parent_account_id: insertedAccountIds['55000'], is_group: false, balance_type: 'debit', comment: 'Taxes on sales (where applicable)' });

    await processAndInsertBatch('Third-Level Groups and Ledgers');

    // ======================================================================
    // 4. COUNTRY-SPECIFIC ACCOUNTS (e.g., GST for India)
    // ======================================================================
    
    // Add country-specific groups and accounts
    for (const group of countrySpecificGroups) {
      addAccountToBatch(group.account_code, {
        ...group,
        parent_account_id: insertedAccountIds[group.account_code] || insertedAccountIds[group.parent_account_key] || null // Use account_code as key if it's a top-level country group, otherwise parent_account_key
      });
    }
    await processAndInsertBatch('Country-Specific Groups');

    // Add country-specific tax accounts
    for (const taxAccount of taxAccountsTemplate) {
      // Determine parent account (default to taxes payable if not specified)
      const parentId = taxAccount.parent_account_key ? 
        insertedAccountIds[taxAccount.parent_account_key] : 
        insertedAccountIds['21400']; // Use '21400' (Taxes Payable) as default parent
      
      addAccountToBatch(taxAccount.account_code, {
        ...taxAccount,
        parent_account_id: parentId,
        is_default: taxAccount.is_default || false,
      });
    }
    await processAndInsertBatch('Country-Specific Tax Accounts');

    console.log('Chart of Accounts population completed successfully.');

  } catch (error) {
    console.error('Error populating Chart of Accounts:', error);
    throw new Error('Failed to populate default Chart of Accounts');
  }
}
