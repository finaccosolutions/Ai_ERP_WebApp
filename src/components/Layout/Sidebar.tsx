import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  ShoppingCart,
  Package,
  Calculator,
  Warehouse,
  Settings,
  FileText,
  Users,
  Building,
  TrendingUp,
  Shield,
  UserCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: ShoppingCart, label: 'Sales', path: '/sales' },
  { icon: Package, label: 'Purchase', path: '/purchase' },
  { icon: Calculator, label: 'Accounting', path: '/accounting' },
  { icon: Warehouse, label: 'Inventory', path: '/inventory' },
  { icon: Settings, label: 'Manufacturing', path: '/manufacturing' },
  { icon: FileText, label: 'Reports', path: '/reports' },
  { icon: Shield, label: 'Compliance', path: '/compliance' },
  { icon: UserCircle, label: 'HR & Payroll', path: '/hr' },
  { icon: Users, label: 'CRM', path: '/crm' },
  { icon: Building, label: 'Admin', path: '/admin' },
];

function Sidebar({ open, setOpen }: SidebarProps) {
  const location = useLocation();
  const { theme } = useTheme();

  return (
    <div className={`
      fixed left-0 top-16 h-full z-30 transition-all duration-300
      ${open ? 'w-64' : 'w-16'} 
      ${theme.sidebarBg} text-white
    `}>
      <div className="p-4">
        <button
          onClick={() => setOpen(!open)}
          className="absolute -right-3 top-4 bg-white text-gray-600 rounded-full p-1 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center px-3 py-3 mb-2 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white'
                  }
                `}
              >
                <Icon size={20} className="min-w-[20px]" />
                {open && (
                  <span className="ml-3 text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;