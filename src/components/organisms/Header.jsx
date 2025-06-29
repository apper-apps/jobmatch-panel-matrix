import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { AuthContext } from '../../App';
const Header = ({ title, subtitle, actions }) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-200 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

<div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" icon="Bell" className="p-2">
              <Badge 
                variant="error" 
                size="sm" 
                className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs"
              >
                3
              </Badge>
            </Button>
          </div>

          {/* Search Status */}
          <div className="flex items-center gap-2 px-3 py-2 bg-accent-50 rounded-lg">
            <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-accent-700 font-medium">
              Searching for matches...
            </span>
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            icon="LogOut"
            onClick={() => {
              const authContext = React.useContext(AuthContext);
              if (authContext?.logout) {
                authContext.logout();
              }
            }}
            className="p-2"
          >
            Logout
          </Button>

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;