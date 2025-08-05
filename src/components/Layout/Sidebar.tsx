// src/components/Layout/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Calculator,
  Package,
  Factory,
  BarChart3,
  Shield,
  Users,
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ClipboardCheck // NEW: Import ClipboardCheck icon for Project module
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../contexts/AIContext';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', color: 'from-blue-500 to-blue-600' },
  { icon: ShoppingBag, label: 'Sales', path: '/sales', color: 'from-green-500 to-green-600' },
  { icon: ShoppingCart, label: 'Purchase', path: '/purchase', color: 'from-purple-500 to-purple-600' },
  { icon: Calculator, label: 'Accounting', path: '/accounting', color: 'from-orange-500 to-orange-600' },
  { icon: Package, label: 'Inventory', path: '/inventory', color: 'from-teal-500 to-teal-600' },
  { icon: Factory, label: 'Manufacturing', path: '/manufacturing', color: 'from-indigo-500 to-indigo-600' },
  { icon: ClipboardCheck, label: 'Project', path: '/project', color: 'from-pink-500 to-pink-600' }, // NEW: Project Module
  { icon: BarChart3, label: 'Reports', path: '/reports', color: 'from-red-500 to-red-600' },
  { icon: Shield, label: 'Compliance', path: '/compliance', color: 'from-yellow-500 to-yellow-600' },
  { icon: UserCheck, label: 'HR & Payroll', path: '/hr', color: 'from-pink-500 to-pink-600' },
  { icon: Users, label: 'CRM', path: '/crm', color: 'from-cyan-500 to-cyan-600' },
  { icon: Settings, label: 'Admin', path: '/admin', color: 'from-gray-500 to-gray-600' },
];

function Sidebar({ open, setOpen }: SidebarProps) {
  const location = useLocation();
  const { theme } = useTheme();
  const { isAIEnabled } = useAI();

  return (
    <>
      {/* Backdrop for mobile */}
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      
      <div className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)] z-30 transition-all duration-300 ease-in-out
        ${open ? 'w-64' : 'w-16'} 
        ${theme.sidebarBg}
        border-r border-slate-700/30 shadow-xl backdrop-blur-sm
        flex flex-col
      `}>
        {/* Header Section */}
        <div className="relative p-3 border-b border-slate-700/30">
          {/* Toggle Button - Redesigned */}
          <button
            onClick={() => setOpen(!open)}
            className={`
              absolute ${open ? '-right-3' : '-right-3'} top-1/2 transform -translate-y-1/2
              w-6 h-6 bg-gradient-to-r ${theme.primaryGradient}
              border border-slate-600 rounded-full shadow-lg
              flex items-center justify-center transition-all duration-300
              hover:bg-gradient-to-r hover:${theme.primaryGradientHover}
              hover:shadow-lg hover:shadow-[#5DBF99]/25 z-40
              text-white hover:scale-110
            `}
          >
            {open ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
          </button>

          {/* AI Status Indicator */}
          {open && isAIEnabled && (
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex items-center space-x-2 px-2.5 py-1.5 bg-gradient-to-r from-[#6AC8A3]/20 to-[#7AD4B0]/20 rounded-lg border border-[#6AC8A3]/30">
                <Sparkles size={12} className="text-[#6AC8A3]" />
                <span className="text-xs text-[#6AC8A3] font-medium">AI Active</span>
                <div className="w-1.5 h-1.5 bg-[#6AC8A3] rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-500">
          <div className="p-2 space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                             (item.path !== '/' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    group relative flex items-center px-3 py-3 rounded-xl
                    transition-all duration-300 ease-in-out
                    ${isActive 
                      ? 'bg-gradient-to-r ${theme.primaryGradient} text-white shadow-lg shadow-[#6AC8A3]/25' 
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-white' // Changed text-slate-300 to text-slate-400 for better contrast
                    }
                    ${!open ? 'justify-center' : ''}
                    transform hover:scale-105 hover:translate-x-1
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {/* Icon Container */}
                  <div className={`
                    relative flex items-center justify-center
                    ${open ? 'mr-3' : ''} 
                    transition-all duration-300
                  `}>
                    <Icon size={18} className="relative z-10" />
                    
                    {/* Active indicator for collapsed state */}
                    {!open && isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r ${theme.primaryGradient} rounded-lg opacity-20 scale-150" />
                    )}
                  </div>

                  {/* Label */}
                  {open && (
                    <span className="text-sm font-medium transition-all duration-300 truncate">
                      {item.label}
                    </span>
                  )}

                  {/* AI Enhancement Indicator */}
                  {open && isAIEnabled && (
                    <div className="ml-auto">
                      <div className="w-1.5 h-1.5 bg-[#6AC8A3] rounded-full animate-pulse opacity-60" />
                    </div>
                  )}

                  {/* Active Indicator */}
                  {isActive && open && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full" />
                  )}

                  {/* Tooltip for collapsed state */}
                  {!open && (
                    <div className={`
                      absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-sm 
                      rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible
                      transition-all duration-300 whitespace-nowrap z-50 shadow-xl
                      border border-slate-600
                    `}>
                      {item.label}
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 
                                    border-4 border-transparent border-r-slate-800" />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        {open && (
          <div className="p-3 border-t border-slate-700/30">
            <div className="text-center">
              <p className="text-xs text-slate-400">Version 2.0.1</p>
              {isAIEnabled && (
                <p className="text-xs text-[#6AC8A3] mt-1">AI Enhanced</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Sidebar 
