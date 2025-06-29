import React from 'react';
import { motion } from 'framer-motion';

const Loading = ({ type = 'jobs' }) => {
  const renderJobCardSkeleton = () => (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-15 h-15 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="w-15 h-15 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5"></div>
        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/5"></div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex gap-4">
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  const renderProfileSkeleton = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="h-5 bg-gray-200 rounded animate-pulse mb-3"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
          <div>
            <div className="h-5 bg-gray-200 rounded animate-pulse mb-3"></div>
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFormSkeleton = () => (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        ))}
        
        <div className="flex gap-4 pt-4">
          <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  const getSkeletonContent = () => {
    switch (type) {
      case 'jobs':
        return (
          <div className="space-y-6">
            {[1, 2, 3, 4].map(i => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {renderJobCardSkeleton()}
              </motion.div>
            ))}
          </div>
        );
      case 'profile':
        return renderProfileSkeleton();
      case 'form':
        return renderFormSkeleton();
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        );
    }
  };

  return (
    <div className="animate-pulse">
      {getSkeletonContent()}
    </div>
  );
};

export default Loading;