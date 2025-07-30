// src/lib/coaSetup.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './supabase';
import { getCountryByCode } from '../constants/geoData';

export async function populateDefaultChartOfAccounts(supabase: SupabaseClient<Database>, companyId: string, countryCode: string) {
  console.log(`Populating Chart of Accounts for Company ID: ${companyId} and Country: ${countryCode}`);

  try {
    const accountsToInsert: Database['public']['Tables']['chart_of_accounts']['Insert'][] = [];
    const insertedAccountIds: { [key: string]: string } = {}; // To store IDs of inserted groups for parent_account_id

    // Helper function to add an account to the array and store its ID
    const addAccount = (key: string, account: Partial<Database['public']['Tables']['chart_of_accounts']['Insert']>) => {
      const newAccount = {
        ...account,
        company_id: companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      accountsToInsert.push(newAccount);
      // Temporarily store a placeholder ID. Actual IDs will be returned by the batch insert.
      // For parent-child relationships, we'll rely on the order of insertion and then update parent_account_id after the first batch.
      // For simplicity in this batch insert, we'll assume parent_account_id can be set directly if the parent is defined earlier in the array.
      // A more robust solution for complex hierarchies might involve multiple batch inserts or a database function.
      // For now, we'll just store the key to map to the returned ID later if needed, but direct parent_account_id assignment is simpler.
      // Since Supabase's `insert` with `select` returns the inserted rows, we can map them back.
      // For this specific COA structure, we can rely on the sequential creation and then map the IDs.
    };

    // Get country-specific CoA template
    const countryConfig = getCountryByCode(countryCode);
    const taxAccountsTemplate = countryConfig?.chartOfAccountsTemplate?.taxAccounts || [];

    // --- 1. Top-Level Groups (Balance Sheet & Income Statement Categories) ---
    addAccount('asset_id', { account_code: '10000', account_name: 'Assets', account_type: 'asset', account_group: 'Assets', is_group: true, balance_type: 'debit' });
    addAccount('liability_id', { account_code: '20000', account_name: 'Liabilities', account_type: 'liability', account_group: 'Liabilities', is_group: true, balance_type: 'credit' });
    addAccount('equity_id', { account_code: '30000', account_name: 'Equity', account_type: 'equity', account_group: 'Equity', is_group: true, balance_type: 'credit' });
    addAccount('income_id', { account_code: '40000', account_name: 'Income', account_type: 'income', account_group: 'Income', is_group: true, balance_type: 'credit' });
    addAccount('expense_id', { account_code: '50000', account_name: 'Expenses', account_type: 'expense', account_group: 'Expenses', is_group: true, balance_type: 'debit' });

    // Perform the first batch insert for top-level groups to get their IDs
    const { data: topLevelData, error: topLevelError } = await supabase
      .from('chart_of_accounts')
      .insert(accountsToInsert.slice(0, 5)) // Insert only the first 5 top-level accounts
      .select('id, account_code');
    if (topLevelError) throw topLevelError;

    topLevelData.forEach(acc => {
      if (acc.account_code === '10000') insertedAccountIds['asset_id'] = acc.id;
      if (acc.account_code === '20000') insertedAccountIds['liability_id'] = acc.id;
      if (acc.account_code === '30000') insertedAccountIds['equity_id'] = acc.id;
      if (acc.account_code === '40000') insertedAccountIds['income_id'] = acc.id;
      if (acc.account_code === '50000') insertedAccountIds['expense_id'] = acc.id;
    });

    // Clear accountsToInsert for the next batch
    accountsToInsert.length = 0;

    // --- 2. Second-Level Groups (Sub-categories under Top-Level) ---
    // Assets
    addAccount('current_asset_id', { account_code: '11000', account_name: 'Current Assets', account_type: 'asset', account_group: 'Current Assets', parent_account_id: insertedAccountIds['asset_id'], is_group: true, balance_type: 'debit' });
    addAccount('fixed_asset_id', { account_code: '12000', account_name: 'Fixed Assets', account_type: 'asset', account_group: 'Fixed Assets', parent_account_id: insertedAccountIds['asset_id'], is_group: true, balance_type: 'debit' });
    addAccount('investment_id', { account_code: '13000', account_name: 'Investments', account_type: 'asset', account_group: 'Investments', parent_account_id: insertedAccountIds['asset_id'], is_group: true, balance_type: 'debit' });
    addAccount('other_asset_id', { account_code: '14000', account_name: 'Other Assets', account_type: 'asset', account_group: 'Other Assets', parent_account_id: insertedAccountIds['asset_id'], is_group: true, balance_type: 'debit' });

    // Liabilities
    addAccount('current_liability_id', { account_code: '21000', account_name: 'Current Liabilities', account_type: 'liability', account_group: 'Current Liabilities', parent_account_id: insertedAccountIds['liability_id'], is_group: true, balance_type: 'credit' });
    addAccount('long_term_liability_id', { account_code: '22000', account_name: 'Long-term Liabilities', account_type: 'liability', account_group: 'Long-term Liabilities', parent_account_id: insertedAccountIds['liability_id'], is_group: true, balance_type: 'credit' });

    // Expenses
    addAccount('cogs_id', { account_code: '51000', account_name: 'Cost of Goods Sold', account_type: 'expense', account_group: 'Cost of Goods Sold', parent_account_id: insertedAccountIds['expense_id'], is_group: true, balance_type: 'debit' });
    addAccount('operating_expense_id', { account_code: '52000', account_name: 'Operating Expenses', account_type: 'expense', account_group: 'Operating Expenses', parent_account_id: insertedAccountIds['expense_id'], is_group: true, balance_type: 'debit' });
    addAccount('indirect_expense_id', { account_code: '53000', account_name: 'Indirect Expenses', account_type: 'expense', account_group: 'Indirect Expenses', parent_account_id: insertedAccountIds['expense_id'], is_group: true, balance_type: 'debit' });
    addAccount('financial_expense_id', { account_code: '54000', account_name: 'Financial Expenses', account_type: 'expense', account_group: 'Financial Expenses', parent_account_id: insertedAccountIds['expense_id'], is_group: true, balance_type: 'debit' });

    // Perform the second batch insert
    const { data: secondLevelData, error: secondLevelError } = await supabase
      .from('chart_of_accounts')
      .insert(accountsToInsert)
      .select('id, account_code');
    if (secondLevelError) throw secondLevelError;

    secondLevelData.forEach(acc => {
      if (acc.account_code === '11000') insertedAccountIds['current_asset_id'] = acc.id;
      if (acc.account_code === '12000') insertedAccountIds['fixed_asset_id'] = acc.id;
      if (acc.account_code === '13000') insertedAccountIds['investment_id'] = acc.id;
      if (acc.account_code === '14000') insertedAccountIds['other_asset_id'] = acc.id;
      if (acc.account_code === '21000') insertedAccountIds['current_liability_id'] = acc.id;
      if (acc.account_code === '22000') insertedAccountIds['long_term_liability_id'] = acc.id;
      if (acc.account_code === '51000') insertedAccountIds['cogs_id'] = acc.id;
      if (acc.account_code === '52000') insertedAccountIds['operating_expense_id'] = acc.id;
      if (acc.account_code === '53000') insertedAccountIds['indirect_expense_id'] = acc.id;
      if (acc.account_code === '54000') insertedAccountIds['financial_expense_id'] = acc.id;
    });

    accountsToInsert.length = 0; // Clear for next batch

    // --- 3. Third-Level Groups and Ledger Accounts (Comprehensive List) ---

    // Current Assets Details
    addAccount('cash_bank_id', { account_code: '11100', account_name: 'Cash & Bank', account_type: 'asset', account_group: 'Cash & Bank', parent_account_id: insertedAccountIds['current_asset_id'], is_group: true, balance_type: 'debit' });
    addAccount('accounts_receivable_id', { account_code: '11200', account_name: 'Accounts Receivable (Sundry Debtors)', account_type: 'asset', account_group: 'Accounts Receivable', parent_account_id: insertedAccountIds['current_asset_id'], is_group: true, balance_type: 'debit' });
    addAccount('inventory_id', { account_code: '11300', account_name: 'Inventory', account_type: 'asset', account_group: 'Inventory', parent_account_id: insertedAccountIds['current_asset_id'], is_group: true, balance_type: 'debit' });
    addAccount('loans_advances_asset_id', { account_code: '11400', account_name: 'Loans & Advances (Asset)', account_type: 'asset', account_group: 'Loans & Advances', parent_account_id: insertedAccountIds['current_asset_id'], is_group: true, balance_type: 'debit' });
    addAccount('prepaid_expenses_id', { account_code: '11500', account_name: 'Prepaid Expenses', account_type: 'asset', account_group: 'Prepaid Expenses', parent_account_id: insertedAccountIds['current_asset_id'], is_group: false, balance_type: 'debit' });
    addAccount('other_current_assets_id', { account_code: '11600', account_name: 'Other Current Assets', account_type: 'asset', account_group: 'Other Current Assets', parent_account_id: insertedAccountIds['current_asset_id'], is_group: false, balance_type: 'debit' });

    // Cash & Bank Sub-accounts
    addAccount('cash_in_hand_id', { account_code: '11101', account_name: 'Cash in Hand', account_type: 'asset', account_group: 'Cash in Hand', parent_account_id: insertedAccountIds['cash_bank_id'], is_group: false, balance_type: 'debit' });
    addAccount('bank_account_primary_id', { account_code: '11102', account_name: 'Bank Account - Primary', account_type: 'asset', account_group: 'Bank Account', parent_account_id: insertedAccountIds['cash_bank_id'], is_group: false, balance_type: 'debit' });
    addAccount('bank_account_secondary_id', { account_code: '11103', account_name: 'Bank Account - Secondary', account_type: 'asset', account_group: 'Bank Account', parent_account_id: insertedAccountIds['cash_bank_id'], is_group: false, balance_type: 'debit' });
    addAccount('petty_cash_id', { account_code: '11104', account_name: 'Petty Cash', account_type: 'asset', account_group: 'Petty Cash', parent_account_id: insertedAccountIds['cash_bank_id'], is_group: false, balance_type: 'debit' });

    // Accounts Receivable Sub-accounts
    addAccount('sundry_debtors_id', { account_code: '11201', account_name: 'Sundry Debtors', account_type: 'asset', account_group: 'Sundry Debtors', parent_account_id: insertedAccountIds['accounts_receivable_id'], is_group: true, balance_type: 'debit' });
    addAccount('provision_bad_debts_id', { account_code: '11202', account_name: 'Provision for Bad Debts', account_type: 'asset', account_group: 'Provision for Bad Debts', parent_account_id: insertedAccountIds['accounts_receivable_id'], is_group: false, balance_type: 'credit' });

    // Inventory Sub-accounts
    addAccount('raw_materials_id', { account_code: '11301', account_name: 'Raw Materials', account_type: 'asset', account_group: 'Raw Materials', parent_account_id: insertedAccountIds['inventory_id'], is_group: false, balance_type: 'debit' });
    addAccount('work_in_progress_id', { account_code: '11302', account_name: 'Work in Progress', account_type: 'asset', account_group: 'Work in Progress', parent_account_id: insertedAccountIds['inventory_id'], is_group: false, balance_type: 'debit' });
    addAccount('finished_goods_id', { account_code: '11303', account_name: 'Finished Goods', account_type: 'asset', account_group: 'Finished Goods', parent_account_id: insertedAccountIds['inventory_id'], is_group: false, balance_type: 'debit' });
    addAccount('stock_in_transit_id', { account_code: '11304', account_name: 'Stock in Transit', account_type: 'asset', account_group: 'Stock in Transit', parent_account_id: insertedAccountIds['inventory_id'], is_group: false, balance_type: 'debit' });
    addAccount('stores_spares_id', { account_code: '11305', account_name: 'Stores & Spares', account_type: 'asset', account_group: 'Stores & Spares', parent_account_id: insertedAccountIds['inventory_id'], is_group: false, balance_type: 'debit' });

    // Loans & Advances (Asset) Sub-accounts
    addAccount('loans_to_employees_id', { account_code: '11401', account_name: 'Loans to Employees', account_type: 'asset', account_group: 'Loans to Employees', parent_account_id: insertedAccountIds['loans_advances_asset_id'], is_group: false, balance_type: 'debit' });
    addAccount('advances_to_suppliers_id', { account_code: '11402', account_name: 'Advances to Suppliers', account_type: 'asset', account_group: 'Advances to Suppliers', parent_account_id: insertedAccountIds['loans_advances_asset_id'], is_group: false, balance_type: 'debit' });

    // Fixed Assets Details
    addAccount('land_buildings_id', { account_code: '12100', account_name: 'Land & Buildings', account_type: 'asset', account_group: 'Fixed Assets', parent_account_id: insertedAccountIds['fixed_asset_id'], is_group: false, balance_type: 'debit' });
    addAccount('plant_machinery_id', { account_code: '12200', account_name: 'Plant & Machinery', account_type: 'asset', account_group: 'Fixed Assets', parent_account_id: insertedAccountIds['fixed_asset_id'], is_group: false, balance_type: 'debit' });
    addAccount('furniture_fixtures_id', { account_code: '12300', account_name: 'Furniture & Fixtures', account_type: 'asset', account_group: 'Fixed Assets', parent_account_id: insertedAccountIds['fixed_asset_id'], is_group: false, balance_type: 'debit' });
    addAccount('vehicles_id', { account_code: '12400', account_name: 'Vehicles', account_type: 'asset', account_group: 'Fixed Assets', parent_account_id: insertedAccountIds['fixed_asset_id'], is_group: false, balance_type: 'debit' });
    addAccount('office_equipment_id', { account_code: '12500', account_name: 'Office Equipment', account_type: 'asset', account_group: 'Fixed Assets', parent_account_id: insertedAccountIds['fixed_asset_id'], is_group: false, balance_type: 'debit' });
    addAccount('computers_id', { account_code: '12600', account_name: 'Computers', account_type: 'asset', account_group: 'Fixed Assets', parent_account_id: insertedAccountIds['fixed_asset_id'], is_group: false, balance_type: 'debit' });
    addAccount('accumulated_depreciation_id', { account_code: '12700', account_name: 'Accumulated Depreciation', account_type: 'asset', account_group: 'Fixed Assets', parent_account_id: insertedAccountIds['fixed_asset_id'], is_group: false, balance_type: 'credit' });

    // Investments Details
    addAccount('short_term_investments_id', { account_code: '13100', account_name: 'Short-term Investments', account_type: 'asset', account_group: 'Investments', parent_account_id: insertedAccountIds['investment_id'], is_group: false, balance_type: 'debit' });
    addAccount('long_term_investments_id', { account_code: '13200', account_name: 'Long-term Investments', account_type: 'asset', account_group: 'Investments', parent_account_id: insertedAccountIds['investment_id'], is_group: false, balance_type: 'debit' });

    // Other Assets Details
    addAccount('goodwill_id', { account_code: '14100', account_name: 'Goodwill', account_type: 'asset', account_group: 'Other Assets', parent_account_id: insertedAccountIds['other_asset_id'], is_group: false, balance_type: 'debit' });
    addAccount('patents_trademarks_id', { account_code: '14200', account_name: 'Patents & Trademarks', account_type: 'asset', account_group: 'Other Assets', parent_account_id: insertedAccountIds['other_asset_id'], is_group: false, balance_type: 'debit' });

    // Current Liabilities Details
    addAccount('accounts_payable_id', { account_code: '21100', account_name: 'Accounts Payable (Sundry Creditors)', account_type: 'liability', account_group: 'Accounts Payable', parent_account_id: insertedAccountIds['current_liability_id'], is_group: true, balance_type: 'credit' });
    addAccount('short_term_loans_id', { account_code: '21200', account_name: 'Short-term Loans', account_type: 'liability', account_group: 'Short-term Loans', parent_account_id: insertedAccountIds['current_liability_id'], is_group: false, balance_type: 'credit' });
    addAccount('accrued_expenses_id', { account_code: '21300', account_name: 'Accrued Expenses', account_type: 'liability', account_group: 'Accrued Expenses', parent_account_id: insertedAccountIds['current_liability_id'], is_group: false, balance_type: 'credit' });
    addAccount('duties_taxes_payable_id', { account_code: '21400', account_name: 'Duties & Taxes Payable', account_type: 'liability', account_group: 'Duties & Taxes Payable', parent_account_id: insertedAccountIds['current_liability_id'], is_group: true, balance_type: 'credit' });
    addAccount('provisions_id', { account_code: '21500', account_name: 'Provisions', account_type: 'liability', account_group: 'Provisions', parent_account_id: insertedAccountIds['current_liability_id'], is_group: true, balance_type: 'credit' });
    addAccount('unearned_revenue_id', { account_code: '21600', account_name: 'Unearned Revenue', account_type: 'liability', account_group: 'Unearned Revenue', parent_account_id: insertedAccountIds['current_liability_id'], is_group: false, balance_type: 'credit' });

    // Dynamically add country-specific tax accounts
    for (const taxAccount of taxAccountsTemplate) {
      // Check if a parent group for 'Duties & Taxes Payable' exists, otherwise use general current_liability_id
      const parentId = taxAccount.account_group === 'Duties & Taxes Payable' ? insertedAccountIds['duties_taxes_payable_id'] : insertedAccountIds['current_liability_id'];
      addAccount(taxAccount.account_code, { ...taxAccount, parent_account_id: parentId, is_group: false });
    }

    // Provisions Sub-accounts
    addAccount('provision_gratuity_id', { account_code: '21501', account_name: 'Provision for Gratuity', account_type: 'liability', account_group: 'Provision for Gratuity', parent_account_id: insertedAccountIds['provisions_id'], is_group: false, balance_type: 'credit' });
    addAccount('provision_warranty_id', { account_code: '21502', account_name: 'Provision for Warranty', account_type: 'liability', account_group: 'Provision for Warranty', parent_account_id: insertedAccountIds['provisions_id'], is_group: false, balance_type: 'credit' });

    // Long-term Liabilities Details
    addAccount('bank_loans_long_term_id', { account_code: '22100', account_name: 'Bank Loans (Long-term)', account_type: 'liability', account_group: 'Long-term Liabilities', parent_account_id: insertedAccountIds['long_term_liability_id'], is_group: false, balance_type: 'credit' });
    addAccount('bonds_payable_id', { account_code: '22200', account_name: 'Bonds Payable', account_type: 'liability', account_group: 'Long-term Liabilities', parent_account_id: insertedAccountIds['long_term_liability_id'], is_group: false, balance_type: 'credit' });
    addAccount('debentures_id', { account_code: '22300', account_name: 'Debentures', account_type: 'liability', account_group: 'Long-term Liabilities', parent_account_id: insertedAccountIds['long_term_liability_id'], is_group: false, balance_type: 'credit' });

    // Equity Details
    addAccount('owners_capital_id', { account_code: '31000', account_name: 'Owner\'s Capital', account_type: 'equity', account_group: 'Equity', parent_account_id: insertedAccountIds['equity_id'], is_group: false, balance_type: 'credit' });
    addAccount('retained_earnings_id', { account_code: '32000', account_name: 'Retained Earnings', account_type: 'equity', account_group: 'Equity', parent_account_id: insertedAccountIds['equity_id'], is_group: false, balance_type: 'credit' });
    addAccount('drawings_id', { account_code: '33000', account_name: 'Drawings', account_type: 'equity', account_group: 'Equity', parent_account_id: insertedAccountIds['equity_id'], is_group: false, balance_type: 'debit' });
    addAccount('share_capital_id', { account_code: '34000', account_name: 'Share Capital', account_type: 'equity', account_group: 'Equity', parent_account_id: insertedAccountIds['equity_id'], is_group: false, balance_type: 'credit' });
    addAccount('reserves_surplus_id', { account_code: '35000', account_name: 'Reserves & Surplus', account_type: 'equity', account_group: 'Equity', parent_account_id: insertedAccountIds['equity_id'], is_group: false, balance_type: 'credit' });

    // Income Details
    addAccount('sales_revenue_id', { account_code: '41000', account_name: 'Sales Revenue', account_type: 'income', account_group: 'Sales Revenue', parent_account_id: insertedAccountIds['income_id'], is_group: false, balance_type: 'credit' });
    addAccount('other_income_id', { account_code: '42000', account_name: 'Other Income', account_type: 'income', account_group: 'Other Income', parent_account_id: insertedAccountIds['income_id'], is_group: true, balance_type: 'credit' });

    // Other Income Sub-accounts
    addAccount('interest_income_id', { account_code: '42100', account_name: 'Interest Income', account_type: 'income', account_group: 'Interest Income', parent_account_id: insertedAccountIds['other_income_id'], is_group: false, balance_type: 'credit' });
    addAccount('rental_income_id', { account_code: '42200', account_name: 'Rental Income', account_type: 'income', account_group: 'Rental Income', parent_account_id: insertedAccountIds['other_income_id'], is_group: false, balance_type: 'credit' });
    addAccount('dividend_income_id', { account_code: '42300', account_name: 'Dividend Income', account_type: 'income', account_group: 'Dividend Income', parent_account_id: insertedAccountIds['other_income_id'], is_group: false, balance_type: 'credit' });
    addAccount('discount_received_id', { account_code: '42400', account_name: 'Discount Received', account_type: 'income', account_group: 'Discount Received', parent_account_id: insertedAccountIds['other_income_id'], is_group: false, balance_type: 'credit' });
    addAccount('scrap_sales_id', { account_code: '42500', account_name: 'Scrap Sales', account_type: 'income', account_group: 'Scrap Sales', parent_account_id: insertedAccountIds['other_income_id'], is_group: false, balance_type: 'credit' });

    // Cost of Goods Sold Details
    addAccount('purchases_id', { account_code: '51100', account_name: 'Purchases', account_type: 'expense', account_group: 'Cost of Goods Sold', parent_account_id: insertedAccountIds['cogs_id'], is_group: false, balance_type: 'debit' });
    addAccount('direct_wages_id', { account_code: '51200', account_name: 'Direct Wages', account_type: 'expense', account_group: 'Cost of Goods Sold', parent_account_id: insertedAccountIds['cogs_id'], is_group: false, balance_type: 'debit' });
    addAccount('freight_inward_id', { account_code: '51300', account_name: 'Freight Inward', account_type: 'expense', account_group: 'Cost of Goods Sold', parent_account_id: insertedAccountIds['cogs_id'], is_group: false, balance_type: 'debit' });
    addAccount('customs_duty_id', { account_code: '51400', account_name: 'Customs Duty', account_type: 'expense', account_group: 'Cost of Goods Sold', parent_account_id: insertedAccountIds['cogs_id'], is_group: false, balance_type: 'debit' });

    // Operating Expenses Details
    addAccount('admin_expense_id', { account_code: '52100', account_name: 'Administrative Expenses', account_type: 'expense', account_group: 'Operating Expenses', parent_account_id: insertedAccountIds['operating_expense_id'], is_group: true, balance_type: 'debit' });
    addAccount('selling_dist_expense_id', { account_code: '52200', account_name: 'Selling & Distribution Expenses', account_type: 'expense', account_group: 'Operating Expenses', parent_account_id: insertedAccountIds['operating_expense_id'], is_group: true, balance_type: 'debit' });
    addAccount('depreciation_expense_id', { account_code: '52300', account_name: 'Depreciation Expense', account_type: 'expense', account_group: 'Operating Expenses', parent_account_id: insertedAccountIds['operating_expense_id'], is_group: false, balance_type: 'debit' });

    // Administrative Expenses Sub-accounts
    addAccount('salaries_wages_admin_id', { account_code: '52101', account_name: 'Salaries & Wages (Admin)', account_type: 'expense', account_group: 'Administrative Expenses', parent_account_id: insertedAccountIds['admin_expense_id'], is_group: false, balance_type: 'debit' });
    addAccount('rent_expense_office_id', { account_code: '52102', account_name: 'Rent Expense (Office)', account_type: 'expense', account_group: 'Administrative Expenses', parent_account_id: insertedAccountIds['admin_expense_id'], is_group: false, balance_type: 'debit' });
    addAccount('utilities_expense_office_id', { account_code: '52103', account_name: 'Utilities Expense (Office)', account_type: 'expense', account_group: 'Administrative Expenses', parent_account_id: insertedAccountIds['admin_expense_id'], is_group: false, balance_type: 'debit' });
    addAccount('office_supplies_id', { account_code: '52104', account_name: 'Office Supplies', account_type: 'expense', account_group: 'Administrative Expenses', parent_account_id: insertedAccountIds['admin_expense_id'], is_group: false, balance_type: 'debit' });
    addAccount('legal_professional_fees_id', { account_code: '52105', account_name: 'Legal & Professional Fees', account_type: 'expense', account_group: 'Administrative Expenses', parent_account_id: insertedAccountIds['admin_expense_id'], is_group: false, balance_type: 'debit' });
    addAccount('communication_expenses_id', { account_code: '52106', account_name: 'Communication Expenses', account_type: 'expense', account_group: 'Administrative Expenses', parent_account_id: insertedAccountIds['admin_expense_id'], is_group: false, balance_type: 'debit' });
    addAccount('insurance_expense_id', { account_code: '52107', account_name: 'Insurance Expense', account_type: 'expense', account_group: 'Administrative Expenses', parent_account_id: insertedAccountIds['admin_expense_id'], is_group: false, balance_type: 'debit' });
    addAccount('repairs_maintenance_office_id', { account_code: '52108', account_name: 'Repairs & Maintenance (Office)', account_type: 'expense', account_group: 'Administrative Expenses', parent_account_id: insertedAccountIds['admin_expense_id'], is_group: false, balance_type: 'debit' });

    // Selling & Distribution Expenses Sub-accounts
    addAccount('marketing_advertising_id', { account_code: '52201', account_name: 'Marketing & Advertising', account_type: 'expense', account_group: 'Selling & Distribution Expenses', parent_account_id: insertedAccountIds['selling_dist_expense_id'], is_group: false, balance_type: 'debit' });
    addAccount('sales_commission_id', { account_code: '52202', account_name: 'Sales Commission', account_type: 'expense', account_group: 'Selling & Distribution Expenses', parent_account_id: insertedAccountIds['selling_dist_expense_id'], is_group: false, balance_type: 'debit' });
    addAccount('freight_outward_id', { account_code: '52203', account_name: 'Freight Outward', account_type: 'expense', account_group: 'Selling & Distribution Expenses', parent_account_id: insertedAccountIds['selling_dist_expense_id'], is_group: false, balance_type: 'debit' });
    addAccount('travel_expense_sales_id', { account_code: '52204', account_name: 'Travel Expense (Sales)', account_type: 'expense', account_group: 'Selling & Distribution Expenses', parent_account_id: insertedAccountIds['selling_dist_expense_id'], is_group: false, balance_type: 'debit' });

    // Indirect Expenses Details
    addAccount('miscellaneous_expenses_id', { account_code: '53100', account_name: 'Miscellaneous Expenses', account_type: 'expense', account_group: 'Indirect Expenses', parent_account_id: insertedAccountIds['indirect_expense_id'], is_group: false, balance_type: 'debit' });
    addAccount('donations_charity_id', { account_code: '53200', account_name: 'Donations & Charity', account_type: 'expense', account_group: 'Indirect Expenses', parent_account_id: insertedAccountIds['indirect_expense_id'], is_group: false, balance_type: 'debit' });
    addAccount('loss_sale_assets_id', { account_code: '53300', account_name: 'Loss on Sale of Assets', account_type: 'expense', account_group: 'Indirect Expenses', parent_account_id: insertedAccountIds['indirect_expense_id'], is_group: false, balance_type: 'debit' });

    // Financial Expenses Details
    addAccount('interest_expense_id', { account_code: '54100', account_name: 'Interest Expense', account_type: 'expense', account_group: 'Financial Expenses', parent_account_id: insertedAccountIds['financial_expense_id'], is_group: false, balance_type: 'debit' });
    addAccount('bank_charges_id', { account_code: '54200', account_name: 'Bank Charges', account_type: 'expense', account_group: 'Financial Expenses', parent_account_id: insertedAccountIds['financial_expense_id'], is_group: false, balance_type: 'debit' });

    // Perform the final batch insert for all remaining accounts
    const { error: finalInsertError } = await supabase
      .from('chart_of_accounts')
      .insert(accountsToInsert);
    if (finalInsertError) throw finalInsertError;

    console.log('Chart of Accounts population complete.');

  } catch (error) {
    console.error('Error populating Chart of Accounts:', error);
    throw new Error('Failed to populate default Chart of Accounts.');
  }
}
