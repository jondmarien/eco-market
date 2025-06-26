import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Products', href: '/products', icon: '📦' },
  { name: 'Orders', href: '/orders', icon: '🛒' },
  { name: 'Analytics', href: '/analytics', icon: '📈' },
  { name: 'Messages', href: '/messages', icon: '💬' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow pt-5 bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg bg-vendor-600 flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Vendor Portal</h1>
          </div>
        </div>
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          {/* Vendor Badge */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-lg bg-vendor-100 flex items-center justify-center">
                <span className="text-vendor-600 font-semibold">🏪</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Vendor Account</p>
                <p className="text-xs text-gray-500">Approved Partner</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
