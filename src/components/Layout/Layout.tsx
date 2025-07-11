import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import AIAssistant from '../AI/AIAssistant';
import { useTheme } from '../../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme.panelBg}`}>
      <TopNavbar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        sidebarWidth={sidebarOpen ? 'w-64' : 'w-16'}
        showAI={showAI}
        setShowAI={setShowAI}
      />
      
      <div className="flex">
        <Sidebar 
          open={sidebarOpen} 
          setOpen={setSidebarOpen}
        />
        
        <main className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        } pt-16`}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {showAI && (
        <AIAssistant 
          isOpen={showAI}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  );
}

export default Layout;
