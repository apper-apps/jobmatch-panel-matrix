import React from 'react';
import { motion } from 'framer-motion';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';

const Empty = ({ 
  icon = "Inbox",
  title = "No data found",
  message = "There's nothing to display right now.",
  actionLabel,
  onAction,
  className = ""
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center py-16 px-6 ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center"
      >
        <ApperIcon name={icon} size={48} className="text-gray-400" />
      </motion.div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        {message}
      </p>
      
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="primary"
          icon="Plus"
          size="lg"
        >
          {actionLabel}
        </Button>
      )}
      
      <div className="mt-8 flex justify-center gap-8 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <ApperIcon name="Search" size={12} />
          <span>Search & Filter</span>
        </div>
        <div className="flex items-center gap-1">
          <ApperIcon name="RefreshCw" size={12} />
          <span>Auto Refresh</span>
        </div>
        <div className="flex items-center gap-1">
          <ApperIcon name="Bell" size={12} />
          <span>Get Notified</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Empty;