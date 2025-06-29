import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ApperIcon from '@/components/ApperIcon';

const Sidebar = () => {
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Job Matches',
      href: '/job-matches',
      icon: 'Target',
      description: 'View matched opportunities'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: 'User',
      description: 'Manage your profile'
    },
    {
      name: 'Preferences',
      href: '/preferences',
      icon: 'Settings',
      description: 'Set job preferences'
    },
    {
      name: 'Import Status',
      href: '/import-status',
      icon: 'FileText',
      description: 'View import logs'
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
            <ApperIcon name="Target" size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">JobMatch Pro</h1>
            <p className="text-sm text-gray-500">Find your perfect match</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href || 
                           (item.href === '/job-matches' && location.pathname === '/');
            
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive: linkActive }) => {
                    const active = linkActive || isActive;
                    return `
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                      ${active 
                        ? 'bg-gradient-to-r from-primary-50 to-secondary-50 text-primary-700 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `;
                  }}
                >
                  {({ isActive: linkActive }) => {
                    const active = linkActive || isActive;
                    return (
                      <>
                        <div className={`
                          p-2 rounded-lg transition-all duration-200
                          ${active 
                            ? 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg' 
                            : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                          }
                        `}>
                          <ApperIcon name={item.icon} size={18} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.description}</div>
                        </div>
                        
                        {active && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="w-1 h-6 bg-gradient-to-b from-primary-500 to-secondary-500 rounded-full"
                          />
                        )}
                      </>
                    );
                  }}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center">
              <ApperIcon name="Zap" size={16} className="text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">Pro Tip</h4>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            Keep your profile updated to get better job matches!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;