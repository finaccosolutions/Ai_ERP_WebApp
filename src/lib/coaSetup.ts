// src/lib/coaSetup.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './supabase'; // Assuming your Supabase types are in src/lib/supabase.ts

export async function populateDefaultChartOfAccounts(supabase: SupabaseClient<Database>, companyId: string) {
  console.log(`Populating Chart of Accounts for Company ID: ${companyId}`);

  try {
    // Helper function to insert an account and return its ID
    const insertAccount = async (account: Partial<Database['public']['Tables']['chart_of_accounts']['Insert']>) => {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .insert({
          ...account,
          company_id: companyId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    };

    // --- 1. Top-Level Groups (Balance Sheet & Income Statement Categories) ---
    const asset_id = await insertAccount({ account_code: '10000', account_name: 'Assets', account_type: 'asset', account_group: 'Assets', is_group: true, balance_type: 'debit' });
    const liability_id = await insertAccount({ account_code: '20000', account_name: 'Liabilities', account_type: 'liability', account_group: 'Liabilities', is_group: true, balance_type: 'credit' });
    const equity_id = await insertAccount({ account_code: '30000', account_name: 'Equity', account_type: 'equity', account_group: 'Equity', is_group: true, balance_type: 'credit' });
    const income_id = await insertAccount({ account_code: '40000', account_name: 'Income', account_type: 'income', account_group: 'Income', is_group: true, balance_type: 'credit' });
    const expense_id = await insertAccount({ account_code: '50000', account_name: 'Expenses', account_type: 'expense', account_group: 'Expenses', is_group: true, balance_type: 'debit' });

    // --- 2. Second-Level Groups (Sub-categories under Top-Level) ---
    // Assets
    const current_asset_id = await insertAccount({ account_code: '11000', account_name: 'Current Assets', account_type: 'asset', account_group: 'Current Assets', parent_account_id: asset_id, is_group: true, balance_type: 'debit' });
    const fixed_asset_id = await insertAccount({ account_code: '12000', account_name: 'Fixed Assets', account_type: 'asset', account_group: 'Fixed Assets', parent_account_id: asset_id, is_group: true, balance_type: 'debit' });
    const investment_id = await insertAccount({ account_code: '13000', account_name: 'Investments', account_type: 'asset', account_group: 'Investments', parent_account_id: asset_id, is_group: true, balance_type: 'debit' });
    const other_asset_id = await insertAccount({ account_code: '14000', account_name: 'Other Assets', account_type: 'asset', account_group: 'Other Assets', parent_account_id: asset_id, is_group: true, balance_type: 'debit' });

    // Liabilities
    const current_liability_id = await insertAccount({ account_code: '21000', account_name: 'Current Liabilities', account_type: 'liability', account_group: 'Current Liabilities', parent_account_id: liability_id, is_group: true, balance_type: 'credit' });
    const long_term_liability_id = await insertAccount({ account_code: '22000', account_name: 'Long-term Liabilities', account_type: 'liability', account_group: 'Long-term Liabilities', parent_account_id: liability_id, is_group: true, balance_type: 'credit' });

    // Expenses
    const cogs_id = await insertAccount({ account_code: '51000', account_name: 'Cost of Goods Sold', account_type: 'expense', account_group: 'Cost of Goods Sold', parent_account_id: expense_id, is_group: true, balance_type: 'debit' });
    const operating_expense_id = await insertAccount({ account_code: '52000', account_name: 'Operating Expenses', account_type: 'expense', account_group: 'Operating Expenses', parent_account_id: expense_id, is_group: true, balance_type: 'debit' });
    const indirect_expense_id = await insertAccount({ account_code: '53000', account_name: 'Indirect Expenses', account_type: 'expense', account_group: 'Indirect Expenses', parent_account_id: expense_id, is_group: true, balance_type: 'debit' });
    const financial_expense_id = await insertAccount({ account_code: '54000', account_name: 'Financial Expenses', account_type: 'expense', account_group: 'Financial Expenses', parent_account_id: expense_id, is_group: true, balance_type: 'debit' });

    // --- 3. Third-Level Groups and Ledger Accounts (Comprehensive List) ---

    // Current Assets Details
    const cash_bank_id = await insertAccount({ account_code: '11100', account_name: 'Cash & Bank', account_type: 'asset', account_group: 'Cash & Bank', parent_account_id: current_asset_id, is_group: true, balance_type: 'debit' });
    const accounts_receivable_id = await insertAccount({ account_code: '11200', account_name: 'Accounts Receivable (Sundry Debtors)', account_type: 'asset', account_group: 'Accounts Receivable', parent_account_id: current_asset_id, is_group: true, balance_type: 'debit' });
    const inventory_id = await insertAccount({ account_code: '11300', account_name: 'Inventory', account_type: 'asset', account_group: 'Inventory', parent_account_id: current_asset_id, is_group: true, balance_type: 'debit' });
    const loans_advances_asset_id = await insertAccount({ account_code: '11400', account_name: 'Loans & Advances (Asset)', account_type: 'asset', account_group: 'Loans & Advances', parent_account_id: current_asset_id, is_group: true, balance_type: 'debit' });
    await insertAccount({ account_code: '11500', account_name: 'Prepaid Expenses', account_type: 'asset', account_group: 'Prepaid Expenses', parent_account_id: current_asset_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '11600', account_name: 'Other Current Assets', account_type: 'asset', account_group: 'Other Current Assets', parent_account_id: current_asset_id, is_group: false, balance_type: 'debit' });

    // Cash & Bank Sub-accounts
    await insertAccount({ account_code: '11101', account_name: 'Cash in Hand', account_type: 'asset', account_group: 'Cash in Hand', parent_account_id: cash_bank_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '11102', account_name: 'Bank Account - Primary', account_type: 'asset', account_group: 'Bank Account', parent_account_id: cash_bank_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '11103', account_name: 'Bank Account - Secondary', account_type: 'asset', account_group: 'Bank Account', parent_account_id: cash_bank_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '11104', account_name: 'Petty Cash', account_type: 'asset', account_group: 'Petty Cash', parent_account_id: cash_bank_id, is_group: false, balance_type: 'debit' });

    // Accounts Receivable Sub-accounts
    await insertAccount({ account_code: '11201', account_name: 'Sundry Debtors', account_type: 'asset', account_group: 'Sundry Debtors', parent_account_id: accounts_receivable_id, is_group: true, balance_type: 'debit' });
    await insertAccount({ account_code: '11202', account_name: 'Provision for Bad Debts', account_type: 'asset', account_group: 'Provision for Bad Debts', parent_account_id: accounts_receivable_id, is_group: false, balance_type: 'credit' });

    // Inventory Sub-accounts
    await insertAccount({ account_code: '11301', account_name: 'Raw Materials', account_type: 'asset', account_group: 'Raw Materials', parent_account_id: inventory_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '11302', account_name: 'Work in Progress', account_type: 'asset', account_group: 'Work in Progress', parent_account_id: inventory_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '11303', account_name: 'Finished Goods', account_type: 'asset', account_group: 'Finished Goods', parent_account_id: inventory_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '11304', account_name: 'Stock in Transit', account_type: 'asset', account_group: 'Stock in Transit', parent_account_id: inventory_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '11305', account_name: 'Stores & Spares', account_type: 'asset', account_group: 'Stores & Spares', parent_account_id: inventory_id, is_group: false, balance_type: 'debit' });

    // Loans & Advances (Asset) Sub-accounts
    await insertAccount({ account_code: '11401', account_name: 'Loans to Employees', account_type: 'asset', account_group: 'Loans to Employees', parent_account_id: loans_advances_asset_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '11402', account_name: 'Advances to Suppliers', account_type: 'asset', account_group: 'Advances to Suppliers', parent_account_id: loans_advances_asset_id, is_group: false, balance_type: 'debit' });

    // Fixed Assets Details
    await insertAccount({ account_code: '12100', account_name: 'Land & Buildings', account_type: 'asset', account_group: 'Fixed Assets', parent_account_id: fixed_asset_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '12200', account_name: 'Plant & Machinery', account_type: 'asset', account_group: 'Fixed Assets', parent_account_id: fixed_asset_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '12300', account_name: 'Furniture & Fixtures', account_type: 'asset', account_group: 'Fixed Assets', parent_account_id: fixed_asset_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '12400', account_name: 'Vehicles', account_type: 'asset', account_group: 'Fixed Assets', parent_account_id: fixed_asset_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '12500', account_name: 'Office Equipment', account_type: 'asset', account_group: 'Fixed Assets', parent_account_id: fixed_asset_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '12600', account_name: 'Computers', account_type: 'asset', account_group: 'Fixed Assets', parent_account_id: fixed_asset_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '12700', account_name: 'Accumulated Depreciation', account_type: 'asset', account_group: 'Fixed Assets', parent_account_id: fixed_asset_id, is_group: false, balance_type: 'credit' });

    // Investments Details
    await insertAccount({ account_code: '13100', account_name: 'Short-term Investments', account_type: 'asset', account_group: 'Investments', parent_account_id: investment_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '13200', account_name: 'Long-term Investments', account_type: 'asset', account_group: 'Investments', parent_account_id: investment_id, is_group: false, balance_type: 'debit' });

    // Other Assets Details
    await insertAccount({ account_code: '14100', account_name: 'Goodwill', account_type: 'asset', account_group: 'Other Assets', parent_account_id: other_asset_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '14200', account_name: 'Patents & Trademarks', account_type: 'asset', account_group: 'Other Assets', parent_account_id: other_asset_id, is_group: false, balance_type: 'debit' });

    // Current Liabilities Details
    const accounts_payable_id = await insertAccount({ account_code: '21100', account_name: 'Accounts Payable (Sundry Creditors)', account_type: 'liability', account_group: 'Accounts Payable', parent_account_id: current_liability_id, is_group: true, balance_type: 'credit' });
    await insertAccount({ account_code: '21200', account_name: 'Short-term Loans', account_type: 'liability', account_group: 'Short-term Loans', parent_account_id: current_liability_id, is_group: false, balance_type: 'credit' });
    await insertAccount({ account_code: '21300', account_name: 'Accrued Expenses', account_type: 'liability', account_group: 'Accrued Expenses', parent_account_id: current_liability_id, is_group: false, balance_type: 'credit' });
    const duties_taxes_payable_id = await insertAccount({ account_code: '21400', account_name: 'Duties & Taxes Payable', account_type: 'liability', account_group: 'Duties & Taxes Payable', parent_account_id: current_liability_id, is_group: true, balance_type: 'credit' });
    const provisions_id = await insertAccount({ account_code: '21500', account_name: 'Provisions', account_type: 'liability', account_group: 'Provisions', parent_account_id: current_liability_id, is_group: true, balance_type: 'credit' });
    await insertAccount({ account_code: '21600', account_name: 'Unearned Revenue', account_type: 'liability', account_group: 'Unearned Revenue', parent_account_id: current_liability_id, is_group: false, balance_type: 'credit' });

    // Duties & Taxes Payable Sub-accounts
    await insertAccount({ account_code: '21401', account_name: 'GST Payable', account_type: 'liability', account_group: 'GST Payable', parent_account_id: duties_taxes_payable_id, is_group: false, balance_type: 'credit' });
    await insertAccount({ account_code: '21402', account_name: 'TDS Payable', account_type: 'liability', account_group: 'TDS Payable', parent_account_id: duties_taxes_payable_id, is_group: false, balance_type: 'credit' });
    await insertAccount({ account_code: '21403', account_name: 'PF Payable', account_type: 'liability', account_group: 'PF Payable', parent_account_id: duties_taxes_payable_id, is_group: false, balance_type: 'credit' });
    await insertAccount({ account_code: '21404', account_name: 'ESI Payable', account_type: 'liability', account_group: 'ESI Payable', parent_account_id: duties_taxes_payable_id, is_group: false, balance_type: 'credit' });

    // Provisions Sub-accounts
    await insertAccount({ account_code: '21501', account_name: 'Provision for Gratuity', account_type: 'liability', account_group: 'Provision for Gratuity', parent_account_id: provisions_id, is_group: false, balance_type: 'credit' });
    await insertAccount({ account_code: '21502', account_name: 'Provision for Warranty', account_type: 'liability', account_group: 'Provision for Warranty', parent_account_id: provisions_id, is_group: false, balance_type: 'credit' });

    // Long-term Liabilities Details
    await insertAccount({ account_code: '22100', account_name: 'Bank Loans (Long-term)', account_type: 'liability', account_group: 'Long-term Liabilities', parent_account_id: long_term_liability_id, is_group: false, balance_type: 'credit' });
    await insertAccount({ account_code: '22200', account_name: 'Bonds Payable', account_type: 'liability', account_group: 'Long-term Liabilities', parent_account_id: long_term_liability_id, is_group: false, balance_type: 'credit' });
    await insertAccount({ account_code: '22300', account_name: 'Debentures', account_type: 'liability', account_group: 'Long-term Liabilities', parent_account_id: long_term_liability_id, is_group: false, balance_type: 'credit' });

    // Equity Details
    await insertAccount({ account_code: '31000', account_name: 'Owner\'s Capital', account_type: 'equity', account_group: 'Equity', parent_account_id: equity_id, is_group: false, balance_type: 'credit' });
    await insertAccount({ account_code: '32000', account_name: 'Retained Earnings', account_type: 'equity', account_group: 'Equity', parent_account_id: equity_id, is_group: false, balance_type: 'credit' });
    await insertAccount({ account_code: '33000', account_name: 'Drawings', account_type: 'equity', account_group: 'Equity', parent_account_id: equity_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '34000', account_name: 'Share Capital', account_type: 'equity', account_group: 'Equity', parent_account_id: equity_id, is_group: false, balance_type: 'credit' });
    await insertAccount({ account_code: '35000', account_name: 'Reserves & Surplus', account_type: 'equity', account_group: 'Equity', parent_account_id: equity_id, is_group: false, balance_type: 'credit' });

    // Income Details
    const sales_revenue_id = await insertAccount({ account_code: '41000', account_name: 'Sales Revenue', account_type: 'income', account_group: 'Sales Revenue', parent_account_id: income_id, is_group: false, balance_type: 'credit' });
    const other_income_id = await insertAccount({ account_code: '42000', account_name: 'Other Income', account_type: 'income', account_group: 'Other Income', parent_account_id: income_id, is_group: true, balance_type: 'credit' });

    // Other Income Sub-accounts
    await insertAccount({ account_code: '42100', account_name: 'Interest Income', account_type: 'income', account_group: 'Interest Income', parent_account_id: other_income_id, is_group: false, balance_type: 'credit' });
    await insertAccount({ account_code: '42200', account_name: 'Rental Income', account_type: 'income', account_group: 'Rental Income', parent_account_id: other_income_id, is_group: false, balance_type: 'credit' });
    await insertAccount({ account_code: '42300', account_name: 'Dividend Income', account_type: 'income', account_group: 'Dividend Income', parent_account_id: other_income_id, is_group: false, balance_type: 'credit' });
    await insertAccount({ account_code: '42400', account_name: 'Discount Received', account_type: 'income', account_group: 'Discount Received', parent_account_id: other_income_id, is_group: false, balance_type: 'credit' });
    await insertAccount({ account_code: '42500', account_name: 'Scrap Sales', account_type: 'income', account_group: 'Scrap Sales', parent_account_id: other_income_id, is_group: false, balance_type: 'credit' });

    // Cost of Goods Sold Details
    await insertAccount({ account_code: '51100', account_name: 'Purchases', account_type: 'expense', account_group: 'Cost of Goods Sold', parent_account_id: cogs_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '51200', account_name: 'Direct Wages', account_type: 'expense', account_group: 'Cost of Goods Sold', parent_account_id: cogs_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '51300', account_name: 'Freight Inward', account_type: 'expense', account_group: 'Cost of Goods Sold', parent_account_id: cogs_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '51400', account_name: 'Customs Duty', account_type: 'expense', account_group: 'Cost of Goods Sold', parent_account_id: cogs_id, is_group: false, balance_type: 'debit' });

    // Operating Expenses Details
    const admin_expense_id = await insertAccount({ account_code: '52100', account_name: 'Administrative Expenses', account_type: 'expense', account_group: 'Operating Expenses', parent_account_id: operating_expense_id, is_group: true, balance_type: 'debit' });
    const selling_dist_expense_id = await insertAccount({ account_code: '52200', account_name: 'Selling & Distribution Expenses', account_type: 'expense', account_group: 'Operating Expenses', parent_account_id: operating_expense_id, is_group: true, balance_type: 'debit' });
    await insertAccount({ account_code: '52300', account_name: 'Depreciation Expense', account_type: 'expense', account_group: 'Operating Expenses', parent_account_id: operating_expense_id, is_group: false, balance_type: 'debit' });

    // Administrative Expenses Sub-accounts
    await insertAccount({ account_code: '52101', account_name: 'Salaries & Wages (Admin)', account_type: 'expense', account_group: 'Administrative Expenses', parent_account_id: admin_expense_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '52102', account_name: 'Rent Expense (Office)', account_type: 'expense', account_group: 'Administrative Expenses', parent_account_id: admin_expense_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '52103', account_name: 'Utilities Expense (Office)', account_type: 'expense', account_group: 'Administrative Expenses', parent_account_id: admin_expense_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '52104', account_name: 'Office Supplies', account_type: 'expense', account_group: 'Administrative Expenses', parent_account_id: admin_expense_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '52105', account_name: 'Legal & Professional Fees', account_type: 'expense', account_group: 'Administrative Expenses', parent_account_id: admin_expense_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '52106', account_name: 'Communication Expenses', account_type: 'expense', account_group: 'Administrative Expenses', parent_account_id: admin_expense_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '52107', account_name: 'Insurance Expense', account_type: 'expense', account_group: 'Administrative Expenses', parent_account_id: admin_expense_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '52108', account_name: 'Repairs & Maintenance (Office)', account_type: 'expense', account_group: 'Administrative Expenses', parent_account_id: admin_expense_id, is_group: false, balance_type: 'debit' });

    // Selling & Distribution Expenses Sub-accounts
    await insertAccount({ account_code: '52201', account_name: 'Marketing & Advertising', account_type: 'expense', account_group: 'Selling & Distribution Expenses', parent_account_id: selling_dist_expense_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '52202', account_name: 'Sales Commission', account_type: 'expense', account_group: 'Selling & Distribution Expenses', parent_account_id: selling_dist_expense_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '52203', account_name: 'Freight Outward', account_type: 'expense', account_group: 'Selling & Distribution Expenses', parent_account_id: selling_dist_expense_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '52204', account_name: 'Travel Expense (Sales)', account_type: 'expense', account_group: 'Selling & Distribution Expenses', parent_account_id: selling_dist_expense_id, is_group: false, balance_type: 'debit' });

    // Indirect Expenses Details
    await insertAccount({ account_code: '53100', account_name: 'Miscellaneous Expenses', account_type: 'expense', account_group: 'Indirect Expenses', parent_account_id: indirect_expense_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '53200', account_name: 'Donations & Charity', account_type: 'expense', account_group: 'Indirect Expenses', parent_account_id: indirect_expense_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '53300', account_name: 'Loss on Sale of Assets', account_type: 'expense', account_group: 'Indirect Expenses', parent_account_id: indirect_expense_id, is_group: false, balance_type: 'debit' });

    // Financial Expenses Details
    await insertAccount({ account_code: '54100', account_name: 'Interest Expense', account_type: 'expense', account_group: 'Financial Expenses', parent_account_id: financial_expense_id, is_group: false, balance_type: 'debit' });
    await insertAccount({ account_code: '54200', account_name: 'Bank Charges', account_type: 'expense', account_group: 'Financial Expenses', parent_account_id: financial_expense_id, is_group: false, balance_type: 'debit' });

    console.log('Chart of Accounts population complete.');

  } catch (error) {
    console.error('Error populating Chart of Accounts:', error);
    throw new Error('Failed to populate default Chart of Accounts.');
  }
}
