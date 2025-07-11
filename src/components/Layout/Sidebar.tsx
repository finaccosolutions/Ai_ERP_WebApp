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
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

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
  { icon: BarChart3, label: 'Reports', path: '/reports', color: 'from-red-500 to-red-600' },
  { icon: Shield, label: 'Compliance', path: '/compliance', color: 'from-yellow-500 to-yellow-600' },
  { icon: UserCheck, label: 'HR & Payroll', path: '/hr', color: 'from-pink-500 to-pink-600' },
  { icon: Users, label: 'CRM', path: '/crm', color: 'from-cyan-500 to-cyan-600' },
  { icon: Settings, label: 'Admin', path: '/admin', color: 'from-gray-500 to-gray-600' },
];

function Sidebar({ open, setOpen }: SidebarProps) {
  const location = useLocation();
  const { theme } = useTheme();

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
        ${theme.sidebarBg} border-r ${theme.borderColor}
        ${theme.shadowLevel} overflow-y-auto
      `}>
        <div className="relative h-full">
          {/* Toggle Button */}
          <button
            onClick={() => setOpen(!open)}
            className={`
              absolute ${open ? '-right-3' : '-right-3'} top-4 
              ${theme.cardBg} border-2 ${theme.borderColor}
              rounded-full p-1.5 ${theme.shadowLevel} hover:${theme.shadowHover}
              transition-all duration-300 transform hover:scale-110 z-40
              ${theme.textPrimary} hover:text-[#6AC8A3] hover:border-[#6AC8A3]
            `}
          >
            {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>

          {/* Navigation */}
          <div className="p-3 pt-6">
            <nav className="space-y-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                               (item.path !== '/' && location.pathname.startsWith(item.path));

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      group relative flex items-center px-3 py-3 ${theme.borderRadius}
                      transition-all duration-300 ease-in-out transform hover:scale-105
                      ${isActive 
                        ? `bg-gradient-to-r ${theme.primaryGradient} text-white ${theme.shadowLevel}` 
                        : 'text-slate-300 hover:bg-white hover:bg-opacity-10 hover:text-[#6AC8A3]'
                      }
                      ${!open ? 'justify-center' : ''}
                    `}
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    {/* Icon Container */}
                    <div className={`
                      relative flex items-center justify-center
                      ${open ? 'mr-3' : ''} 
                      ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#6AC8A3]'}
                      transition-colors duration-300
                    `}>
                      <Icon size={20} className="relative z-10" />
                      
                      {/* Icon Background Effect for collapsed state */}
                      {!open && isActive && (
                        <div className={`
                          absolute inset-0 bg-gradient-to-r ${theme.primaryGradient}
                          rounded-lg opacity-20 scale-150
                        `} />
                      )}
                    </div>

                    {/* Label */}
                    {open && (
                      <span className={`
                        text-sm font-medium transition-all duration-300
                        ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-[#6AC8A3]'}
                      `}>
                        {item.label}
                      </span>
                    )}

                    {/* Active Indicator */}
                    {isActive && open && (
                      <div className={`
                        absolute right-0 top-1/2 transform -translate-y-1/2
                        w-1 h-6 bg-white rounded-l-full
                        transition-opacity duration-300
                      `} />
                    )}

                    {/* Tooltip for collapsed state */}
                    {!open && (
                      <div className={`
                        absolute left-full ml-3 px-3 py-2 ${theme.cardBg} ${theme.textPrimary} text-sm 
                        ${theme.borderRadius} opacity-0 invisible group-hover:opacity-100 group-hover:visible
                        transition-all duration-300 whitespace-nowrap z-50 ${theme.shadowLevel}
                        border ${theme.borderColor}
                      `}>
                        {item.label}
                        <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 
                                      border-4 border-transparent border-r-slate-100`} />
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;