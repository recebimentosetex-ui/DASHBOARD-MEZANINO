import React from 'react';
import { LayoutDashboard, PenTool, Sprout, Package, Boxes } from 'lucide-react';
import { TabView } from '../types';

interface SidebarProps {
  currentTab: TabView;
  onTabChange: (tab: TabView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  
  const navItems = [
    { id: TabView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: TabView.INK, label: 'Estoque de Tinta', icon: PenTool },
    { id: TabView.FIBER, label: 'Estoque de Fibras', icon: Sprout },
    { id: TabView.PACKAGING, label: 'Estoque de Embalagem', icon: Package },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-10 shadow-lg">
      <div className="p-6 border-b border-gray-100 flex items-center justify-center">
        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white shadow-md mr-3">
          <Boxes className="w-6 h-6" />
        </div>
        <span className="text-xl font-bold text-slate-800 tracking-tight">Estoque Mezanino</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group
                ${isActive 
                  ? 'bg-green-50 text-green-700 shadow-sm border border-green-100' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <item.icon 
                className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'}`} 
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-md">
          <p className="text-xs font-semibold opacity-80 mb-1">Status do Sistema</p>
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-200 mr-2 animate-pulse"></span>
            <span className="text-sm font-bold">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;