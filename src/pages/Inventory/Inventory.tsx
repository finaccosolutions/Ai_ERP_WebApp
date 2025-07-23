// src/pages/Inventory/Inventory.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Package, Warehouse, AlertTriangle, BarChart3, Plus, Search, Bot, Mic, RefreshCw,
  FolderOpen, // For Item Master
  Layers, // For Item Categories/Groups
  Ruler, // For Units of Measure
  MapPin, // For Warehouses/Locations
  ArrowLeftRight, // For Stock Transfers
  ClipboardList, // For Stock Journal
  Truck, // For Goods Receipts/Issues
  CalendarCheck, // For Batch/Expiry Management
  PieChart, // For Stock Summary Report
  LayoutGrid, // For Warehouse-wise Stock Report
  ListOrdered, // For Reorder Report
  Clock, // For Batch Expiry Report
  DollarSign, // For Stock Valuation Report
  TrendingUp, // For Fast-moving/Slow-moving Items Report
  Tag, // For Item Groups (new icon)
  Lightbulb, // For AI Insights
} from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AIButton from '../../components/UI/AIButton';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import FormField from '../../components/UI/FormField';

// Import all inventory sub-module pages
import ItemMasterListPage from './masters/ItemMasterListPage'; // UPDATED IMPORT
import ItemMasterFormPage from './masters/ItemMasterFormPage'; // NEW IMPORT
import ItemCategoriesGroupsPage from './masters/ItemCategoriesGroupsPage';
import UnitsOfMeasurePage from './masters/UnitsOfMeasurePage';
import WarehousesPage from './masters/WarehousesPage';
import ItemGroupListPage from './masters/ItemGroupListPage'; // UPDATED IMPORT
import ItemGroupFormPage from './masters/ItemGroupFormPage'; // NEW IMPORT

import StockJournalPage from './transactions/StockJournalPage';
import StockTransfersPage from './transactions/StockTransfersPage';
import GoodsReceiptsIssuesPage from './transactions/GoodsReceiptsIssuesPage';
import BatchExpiryPage from './transactions/BatchExpiryPage';

import InventoryReportsPage from './reports/InventoryReportsPage';


function Inventory() {
  const location = useLocation();
  const { theme } = useTheme();
  const { smartSearch, voiceCommand, predictiveAnalysis } = useAI();
  const { currentCompany } = useCompany();
  const [searchTerm, setSearchTerm] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [inventoryMetrics, setInventoryMetrics] = useState({
    totalItems: '0',
    lowStockItems: '0',
    totalWarehouses: '0',
    totalStockValue: '0',
    stockAdjustments: '0',
    stockTransfers: '0',
    goodsReceipts: '0',
    goodsIssues: '0',
    batchesTracked: '0',
    itemGroups: '0',
    itemCategories: '0', // NEW: Metric for Item Categories
    unitsOfMeasure: '0', // NEW: Metric for Units of Measure
  });
  const [recentInventoryActivity, setRecentInventoryActivity] = useState<any[]>([]);
  const [inventoryAiInsights, setInventoryAiInsights] = useState<any[]>([]);
  const [refreshingInsights, setRefreshingInsights] = useState(false);
  const [isLoadingInventoryData, setIsLoadingInventoryData] = useState(false);
  const [activeInventoryTab, setActiveInventoryTab] = useState('Transactions');

  useEffect(() => {
    if (currentCompany?.id) {
      fetchInventoryData(currentCompany.id);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentCompany?.id) {
        console.log('Inventory.tsx: Document became visible, re-fetching inventory data.');
        fetchInventoryData(currentCompany.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentCompany?.id]);

  const fetchInventoryData = async (companyId: string) => {
    setIsLoadingInventoryData(true);
    try {
      // Fetch counts for metrics
      const { count: totalItemsCount } = await supabase.from('items').select('count', { count: 'exact', head: true }).eq('company_id', companyId);
      const { count: totalWarehousesCount } = await supabase.from('warehouses').select('count', { count: 'exact', head: true }).eq('company_id', companyId);
      const { count: batchesTrackedCount } = await supabase.from('batch_master').select('count', { count: 'exact', head: true }).eq('company_id', companyId);
      const { count: itemGroupsCount } = await supabase.from('item_groups').select('count', { count: 'exact', head: true }).eq('company_id', companyId);
      const { count: itemCategoriesCount } = await supabase.from('item_categories').select('count', { count: 'exact', head: true }).eq('company_id', companyId); // NEW: Fetch Item Categories count
      
      // Fetch count for units of measure (both company-specific and global)
      const { count: unitsOfMeasureCount } = await supabase
        .from('units_of_measure')
        .select('count', { count: 'exact', head: true })
        .or(`company_id.eq.${companyId},is_system_defined.eq.true`); // NEW: Fetch both
      
      // Placeholder for low stock items (requires more complex query)
      const lowStockItemsCount = 0; // To be implemented

      // Placeholder for total stock value (requires stock ledger/valuation)
      const totalStockValue = 0; // To be implemented

      // Placeholder for stock transaction counts
      const { count: stockAdjustmentsCount } = await supabase.from('stock_entries').select('count', { count: 'exact', head: true }).eq('company_id', companyId).eq('entry_type', 'stock_adjustment');
      const { count: stockTransfersCount } = await supabase.from('stock_entries').select('count', { count: 'exact', head: true }).eq('company_id', companyId).eq('entry_type', 'material_transfer');
      const { count: goodsReceiptsCount } = await supabase.from('goods_receipts').select('count', { count: 'exact', head: true }).eq('company_id', companyId);
      const { count: goodsIssuesCount } = await supabase.from('stock_entries').select('count', { count: 'exact', head: true }).eq('company_id', companyId).eq('entry_type', 'material_issue');


      setInventoryMetrics({
        totalItems: totalItemsCount?.toString() || '0',
        lowStockItems: lowStockItemsCount.toString(),
        totalWarehouses: totalWarehousesCount?.toString() || '0',
        totalStockValue: totalStockValue.toLocaleString(),
        stockAdjustments: stockAdjustmentsCount?.toString() || '0',
        stockTransfers: stockTransfersCount?.toString() || '0',
        goodsReceipts: goodsReceiptsCount?.toString() || '0',
        goodsIssues: goodsIssuesCount?.toString() || '0',
        batchesTracked: batchesTrackedCount?.toString() || '0',
        itemGroups: itemGroupsCount?.toString() || '0',
        itemCategories: itemCategoriesCount?.toString() || '0', // NEW: Set Item Categories count
        unitsOfMeasure: unitsOfMeasureCount?.toString() || '0', // NEW: Set Units of Measure count
      });

      // Fetch recent stock activities (e.g., last 5 stock entries)
      const { data: recentEntries, error: recentEntriesError } = await supabase
        .from('stock_entries')
        .select(`
          id, entry_no, entry_type, entry_date,
          stock_entry_items ( items ( item_name ) ),
          from_warehouses:warehouses!stock_entries_from_warehouse_id_fkey ( name ),
          to_warehouses:warehouses!stock_entries_to_warehouse_id_fkey ( name )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentEntriesError) throw recentEntriesError;

      setRecentInventoryActivity(recentEntries.map((entry: any) => ({
        type: entry.entry_type,
        refNo: entry.entry_no,
        date: entry.entry_date,
        description: `${entry.entry_type.replace(/_/g, ' ')} for ${entry.stock_entry_items?.[0]?.items?.item_name || 'N/A'}`,
        from: entry.from_warehouses?.name || 'N/A',
        to: entry.to_warehouses?.name || 'N/A',
      })));

    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setIsLoadingInventoryData(false);
    }
  };

  const generateInventoryAIInsights = async (companyId: string) => {
    setRefreshingInsights(true);
    try {
      let insights;
      if (activeInventoryTab === 'Masters') {
        insights = {
          predictions: [
            { type: 'suggestion', title: 'Item Categorization', message: 'AI suggests reviewing categorization for 15 items to improve reporting accuracy.', confidence: 'medium', impact: 'low', actionable: true, action: 'Review Item Categories' },
            { type: 'prediction', title: 'Optimal Reorder Levels', message: 'Predictive analysis suggests adjusting reorder levels for 5 key items based on recent sales velocity.', confidence: 'high', impact: 'medium', actionable: true, action: 'Adjust Reorder Levels' },
          ]
        };
      } else if (activeInventoryTab === 'Transactions') {
        insights = {
          predictions: [
            { type: 'alert', title: 'Unusual Stock Adjustment', message: 'Large negative stock adjustment detected for Product A. Investigate reason.', confidence: 'high', impact: 'high', actionable: true, action: 'View Stock Adjustment' },
            { type: 'suggestion', title: 'Warehouse Optimization', message: 'AI suggests consolidating stock of slow-moving items from Branch B to Main Warehouse to reduce holding costs.', confidence: 'medium', impact: 'medium', actionable: true, action: 'Plan Stock Transfer' },
          ]
        };
      } else if (activeInventoryTab === 'Reports') {
        insights = {
          predictions: [
            { type: 'prediction', title: 'Future Stockout Risk', message: 'Product X has a high probability of stockout in the next 30 days based on current consumption and lead time.', confidence: 'high', impact: 'high', actionable: true, action: 'Generate Reorder Report' },
            { type: 'trend', title: 'Inventory Turnover', message: 'Overall inventory turnover rate has decreased by 10% this quarter, indicating potential overstocking.', confidence: 'medium', impact: 'medium', actionable: true, action: 'Analyze Stock Valuation' },
          ]
        };
      } else {
        insights = {
          predictions: [
            { type: 'info', title: 'No Specific Insights', message: 'No specific AI insights for this category. Try refreshing or switching tabs.', confidence: 'low', impact: 'low', actionable: false }
          ]
        };
      }

      if (insights && insights.predictions) {
        setInventoryAiInsights(insights.predictions);
      } else {
        setInventoryAiInsights([
          {
            type: 'info',
            title: 'No New Insights',
            message: 'No specific AI insights generated at this moment. Try again later.',
            confidence: 'low',
            impact: 'low',
            actionable: false
          }
        ]);
      }
    } catch (error) {
      console.error('Error generating inventory AI insights:', error);
      setInventoryAiInsights([
        {
          type: 'error',
          title: 'AI Service Error',
          message: 'Could not fetch AI insights. Please try again.',
          confidence: 'low',
          impact: 'high',
          actionable: false
        }
      ]);
    } finally {
      setRefreshingInsights(false);
    }
  };

  const moduleColors = [
    { cardBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100', textColor: 'text-emerald-800', iconBg: 'bg-emerald-500' },
    { cardBg: 'bg-gradient-to-br from-sky-50 to-sky-100', textColor: 'text-sky-800', iconBg: 'bg-sky-500' },
    { cardBg: 'bg-gradient-to-br from-purple-50 to-purple-100', textColor: 'text-purple-800', iconBg: 'bg-purple-500' },
    { cardBg: 'bg-gradient-to-br from-orange-50 to-orange-100', textColor: 'text-orange-800', iconBg: 'bg-orange-500' },
    { cardBg: 'bg-gradient-to-br from-teal-50 to-teal-100', textColor: 'text-teal-800', iconBg: 'bg-teal-500' },
    { cardBg: 'bg-gradient-to-br from-indigo-50 to-indigo-100', textColor: 'text-indigo-800', iconBg: 'bg-indigo-500' },
    { cardBg: 'bg-gradient-to-br from-pink-50 to-pink-100', textColor: 'text-pink-800', iconBg: 'bg-pink-500' },
    { cardBg: 'bg-gradient-to-br from-red-50 to-red-100', textColor: 'text-red-800', iconBg: 'bg-red-500' },
    { cardBg: 'bg-gradient-to-br from-yellow-50 to-yellow-100', textColor: 'text-yellow-800', iconBg: 'bg-yellow-500' },
  ];

  const inventoryCategories = [
    {
      title: 'Transactions',
      description: 'Record all stock movements and adjustments.',
      modules: [
        { name: 'Stock Journal (Adjustments)', description: 'Increase or decrease stock levels.', icon: ClipboardList, path: '/inventory/transactions/stock-journal', count: inventoryMetrics.stockAdjustments, totalAmount: null },
        { name: 'Stock Transfers', description: 'Move stock between different warehouses.', icon: ArrowLeftRight, path: '/inventory/transactions/stock-transfers', count: inventoryMetrics.stockTransfers, totalAmount: null },
        { name: 'Goods Receipts / Issues', description: 'Record incoming and outgoing goods.', icon: Truck, path: '/inventory/transactions/goods-receipts-issues', count: `${inventoryMetrics.goodsReceipts}/${inventoryMetrics.goodsIssues}`, totalAmount: null },
        { name: 'Batch / Expiry Management', description: 'Track items by batch numbers and expiry dates.', icon: CalendarCheck, path: '/inventory/transactions/batch-expiry', count: inventoryMetrics.batchesTracked, totalAmount: null },
      ]
    },
    {
      title: 'Masters',
      description: 'Manage your core inventory data: items, categories, units, and warehouses.',
      modules: [
        { name: 'Item Master', description: 'Define and manage all products and services.', icon: FolderOpen, path: '/inventory/masters/items', count: inventoryMetrics.totalItems, totalAmount: null },
        { name: 'Item Groups', description: 'Manage broader classifications for items.', icon: Tag, path: '/inventory/masters/item-groups', count: inventoryMetrics.itemGroups, totalAmount: null },
        { name: 'Item Categories', description: 'Organize items into specific categories.', icon: Layers, path: '/inventory/masters/categories-groups', count: inventoryMetrics.itemCategories, totalAmount: null }, // RENAMED
        { name: 'Units of Measure', description: 'Define units like pcs, kgs, liters.', icon: Ruler, path: '/inventory/masters/units', count: inventoryMetrics.unitsOfMeasure, totalAmount: null }, // UPDATED COUNT
        { name: 'Warehouses / Locations', description: 'Manage storage locations and warehouses.', icon: MapPin, path: '/inventory/masters/warehouses', count: inventoryMetrics.totalWarehouses, totalAmount: null },
      ]
    },
    {
      title: 'Reports',
      description: 'Generate insights and reports for inventory analysis.',
      modules: [
        { name: 'Stock Summary Report', description: 'Item-wise closing stock, opening, inwards, outwards.', icon: PieChart, action: 'stock_summary' },
        { name: 'Warehouse-wise Stock Report', description: 'Stock levels per warehouse.', icon: LayoutGrid, action: 'warehouse_stock' },
        { name: 'Reorder Report', description: 'Items below reorder level.', icon: ListOrdered, action: 'reorder_report' },
        { name: 'Batch Expiry Report', description: 'Track expiring batches.', icon: Clock, action: 'batch_expiry' },
        { name: 'Stock Valuation Report', description: 'Financial value of current stock.', icon: DollarSign, action: 'stock_valuation' },
        { name: 'Fast-moving / Slow-moving Items Report', description: 'Identify sales velocity of items.', icon: TrendingUp, action: 'movement_report' },
      ]
    }
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction':
        return <TrendingUp size={16} className="text-sky-500" />;
      case 'alert':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'suggestion':
        return <Lightbulb size={16} className="text-yellow-500" />;
      case 'trend':
        return <BarChart3 size={16} className="text-emerald-500" />;
      default:
        return <Bot size={16} className="text-purple-500" />;
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-emerald-500 bg-emerald-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const isMainInventoryPage = location.pathname === '/inventory';

  const handleVoiceSearch = async () => {
    setIsVoiceActive(true);
    try {
      setTimeout(async () => {
        const mockCommand = "Show me items below reorder level";
        const result = await voiceCommand(mockCommand);
        console.log('Voice search result:', result);
        setIsVoiceActive(false);
      }, 2000);
    } catch (error) {
      setIsVoiceActive(false);
    }
  };

  const handleSmartSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      const result = await smartSearch(searchTerm);
      console.log('Smart search result:', result);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const getContextualAIInsights = () => {
    if (inventoryAiInsights.length > 0) {
      return inventoryAiInsights.map((insight, index) => (
        <div
          key={index}
          className={`
            p-3 rounded-2xl border-l-4
            ${getImpactColor(insight.impact)}
          `}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center space-x-2">
              {getInsightIcon(insight.type)}
              <h4 className={`font-medium ${theme.textPrimary} text-sm`}>
                {insight.title}
              </h4>
            </div>
            <span
              className={`
                px-2 py-1 text-xs rounded-full ${getConfidenceColor(insight.confidence)}
              `}
            >
              {insight.confidence}
            </span>
          </div>
          <p className={`text-sm ${theme.textMuted} mb-3`}>{insight.message}</p>
          {insight.actionable && (
            <button className="text-xs text-sky-600 hover:text-sky-800 font-medium">
              {insight.action || 'View Details'} →
            </button>
          )}
        </div>
      ));
    } else {
      return (
        <div className="text-center py-8 text-gray-500">
          No AI insights available. Click "Refresh Insights" to generate.
        </div>
      );
    }
  };

  if (!isMainInventoryPage) {
    return (
      <Routes>
        <Route path="/masters/items" element={<ItemMasterListPage />} /> {/* UPDATED */}
        <Route path="/masters/items/new" element={<ItemMasterFormPage />} /> {/* NEW */}
        <Route path="/masters/items/edit/:id" element={<ItemMasterFormPage />} /> {/* NEW */}
        <Route path="/masters/categories-groups" element={<ItemCategoriesGroupsPage />} />
        <Route path="/masters/item-groups" element={<ItemGroupListPage />} /> {/* UPDATED */}
        <Route path="/masters/item-groups/new" element={<ItemGroupFormPage />} /> {/* NEW */}
        <Route path="/masters/item-groups/edit/:id" element={<ItemGroupFormPage />} /> {/* NEW */}
        <Route path="/masters/units" element={<UnitsOfMeasurePage />} />
        <Route path="/masters/warehouses" element={<WarehousesPage />} />

        <Route path="/transactions/stock-journal" element={<StockJournalPage />} />
        <Route path="/transactions/stock-transfers" element={<StockTransfersPage />} />
        <Route path="/transactions/goods-receipts-issues" element={<GoodsReceiptsIssuesPage />} />
        <Route path="/transactions/batch-expiry" element={<BatchExpiryPage />} />

        <Route path="/reports/*" element={<InventoryReportsPage />} />
      </Routes>
    );
  }

  if (isLoadingInventoryData && recentInventoryActivity.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[${theme.hoverAccent}]"></div>
      </div>
    );
  }

  const getActiveTabBorderColor = (tabTitle: string) => {
    switch (tabTitle) {
      case 'Masters':
        return 'border-sky-500';
      case 'Transactions':
        return 'border-purple-500';
      case 'Reports':
        return 'border-emerald-500';
      default:
        return theme.borderColor;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1
            className={`text-3xl font-bold bg-gradient-to-r from-sky-500 to-blue-600 text-transparent bg-clip-text drop-shadow-lg`}
          >
            Inventory Management
          </h1>
          <p className={theme.textSecondary}>
            Manage items, stock movements, and reports
          </p>
        </div>
        <div className="flex space-x-2">
          <AIButton variant="voice" onSuggest={handleVoiceSearch} />
          <AIButton variant="suggest" onSuggest={() => console.log('AI Inventory Suggestions')} />
          <Link to="/inventory/masters/items/new">
            <Button icon={<Plus size={16} />}>Add New Item</Button>
          </Link>
        </div>
      </div>

      {/* AI-Enhanced Search */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="AI Search: 'Stock of Product X', 'Items below reorder level'..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSmartSearch()}
              className={`
                w-full pl-10 pr-14 py-2 border ${theme.inputBorder} rounded-lg
                focus:ring-2 focus:ring-sky-500 focus:border-transparent
                ${theme.inputBg} ${theme.textPrimary}
                placeholder:text-gray-400
              `}
            />
            <button
              onClick={handleVoiceSearch}
              className={`
                absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors
                ${
                  isVoiceActive
                    ? 'text-red-500 animate-pulse'
                    : `text-gray-400 hover:text-[${theme.hoverAccent}]`
                }
              `}
            >
              <Mic size={16} />
            </button>
          </div>
          <Button onClick={handleSmartSearch}>Search</Button>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center md:justify-start gap-2">
        {inventoryCategories.map((category) => (
          <button
            key={category.title}
            onClick={() => setActiveInventoryTab(category.title)}
            className={`
              flex-1 px-6 py-3 text-sm font-semibold transition-all duration-300 ease-in-out
              ${
                activeInventoryTab === category.title
                  ? `bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg transform scale-105 border border-sky-700 rounded-t-lg rounded-b-none`
                  : `bg-gray-100 text-gray-700 hover:bg-gradient-to-r hover:from-gray-200 hover:to-gray-300 hover:shadow-md border border-gray-200 rounded-lg`
              }
            `}
          >
            {category.title}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {inventoryCategories.map((category) => (
        <div
          key={category.title}
          className={`${activeInventoryTab === category.title ? 'block' : 'hidden'}`}
        >
          <Card
            className={`
            p-6 space-y-4 rounded-t-none rounded-b-lg
            border-t-4 ${getActiveTabBorderColor(category.title)}
            bg-white shadow-lg
          `}
          >
            {/* Category Header (inside the content div) */}
            <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>
              {category.title}
            </h2>
            <p className={theme.textSecondary}>{category.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.modules.map((module, moduleIndex) => {
                const Icon = module.icon;
                const colors = moduleColors[moduleIndex % moduleColors.length];
                return (
                  <Link key={module.name} to={module.path} className="flex">
                    <Card
                      hover
                      className={`
                      p-4 cursor-pointer group relative overflow-hidden flex-1 flex flex-col justify-between
                      ${colors.cardBg}
                      transform transition-all duration-300 ease-in-out
                      hover:translate-y-[-6px] hover:shadow-2xl hover:ring-2 hover:ring-[${theme.hoverAccent}] hover:ring-opacity-75
                    `}
                    >
                      {/* Background overlay for hover effect */}
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>

                      <div className="relative z-10">
                        <h3
                          className={`text-xl font-bold ${colors.textColor} group-hover:text-[${theme.hoverAccent}] transition-colors`}
                        >
                          {module.name}
                        </h3>
                        <p className={`text-sm ${theme.textMuted}`}>
                          {module.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-3 relative z-10">
                        <p className={`text-xl font-bold ${colors.textColor}`}>
                          {module.count}
                        </p>
                        {module.totalAmount && (
                          <p className={`text-md font-semibold ${colors.textColor}`}>
                            ₹{module.totalAmount}
                          </p>
                        )}
                        <div
                          className={`
                          p-3 rounded-2xl shadow-md
                          ${colors.iconBg} text-white
                          group-hover:scale-125 transition-transform duration-300
                        `}
                        >
                          <Icon size={24} className="text-white" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      ))}

      {/* Recent Inventory Activity and AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12 pt-8 border-t border-gray-200">
        {/* Recent Inventory Activity */}
        <Card className="p-6 bg-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
              Recent Inventory Activity
            </h3>
            <div className="flex items-center space-x-2">
              <Link
                to="/inventory/transactions/stock-journal"
                className="text-sm text-sky-600 hover:text-sky-800"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            {recentInventoryActivity.length > 0 ? (
              recentInventoryActivity.map((item, index) => (
                <div
                  key={index}
                  className={`
                  flex items-center justify-between p-3 ${theme.inputBg} rounded-2xl
                  border ${theme.borderColor} hover:border-[${theme.hoverAccent}] transition-all duration-300
                `}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className={`font-medium ${theme.textPrimary}`}>
                          {item.description}
                        </p>
                        <p className={`text-sm ${theme.textMuted}`}>
                          {item.refNo} on {item.date}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`
                      px-2 py-1 text-xs rounded-full
                      ${
                        item.type === 'material_receipt' || item.type === 'stock_adjustment' && item.quantity > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }
                    `}
                    >
                      {item.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent activity.
              </div>
            )}
          </div>
        </Card>

        {/* AI Inventory Insights */}
        <Card className="p-6 bg-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3
              className={`text-lg font-semibold ${theme.textPrimary} flex items-center`}
            >
              <Bot size={20} className="mr-2 text-[${theme.hoverAccent}]" />
              AI Inventory Insights
              <div className="ml-2 w-2 h-2 bg-[${theme.hoverAccent}] rounded-full animate-pulse" />
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                currentCompany?.id && generateInventoryAIInsights(currentCompany.id)
              }
              disabled={refreshingInsights}
              icon={
                <RefreshCw
                  size={16}
                  className={refreshingInsights ? 'animate-spin' : ''}
                />
              }
            >
              {refreshingInsights ? 'Refreshing...' : 'Refresh Insights'}
            </Button>
          </div>
          <div className="space-y-4">{getContextualAIInsights()}</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 mt-8 pt-4 border-t border-gray-200">
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/inventory/masters/items/new">
            <Button className="w-full justify-start" icon={<Plus size={16} />}>
              Add New Item
            </Button>
          </Link>
          <Link to="/inventory/transactions/stock-journal">
            <Button
              variant="outline"
              className="w-full justify-start"
              icon={<ClipboardList size={16} />}
            >
              Record Stock Adjustment
            </Button>
          </Link>
          <Link to="/inventory/reports/reorder">
            <Button
              variant="outline"
              className="w-full justify-start"
              icon={<ListOrdered size={16} />}
            >
              View Reorder Report
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full justify-start"
            icon={<Package size={16} />}
          >
            Import Inventory Data
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default Inventory;