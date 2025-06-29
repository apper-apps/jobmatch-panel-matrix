import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/organisms/Header';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';
import Empty from '@/components/ui/Empty';
import ApperIcon from '@/components/ApperIcon';
import { importLogService } from '@/services/api/importLogService';

const ImportStatusPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await importLogService.getAll();
      setLogs(data);
    } catch (err) {
      setError('Failed to load import logs. Please try again.');
      console.error('Error loading logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return 'CheckCircle';
      case 'warning':
        return 'AlertTriangle';
      case 'error':
        return 'XCircle';
      default:
        return 'Clock';
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        icon="RefreshCw"
        onClick={loadLogs}
        loading={loading}
      >
        Refresh
      </Button>
      <Button
        variant="primary"
        icon="Download"
      >
        Export Logs
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <Header 
          title="Import Status" 
          subtitle="Track your resume import history"
          actions={headerActions}
        />
        <div className="flex-1 p-6">
          <Loading type="form" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <Header 
          title="Import Status" 
          subtitle="Track your resume import history"
          actions={headerActions}
        />
        <div className="flex-1 flex items-center justify-center">
          <Error
            title="Failed to Load Import Logs"
            message={error}
            onRetry={loadLogs}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Header 
        title="Import Status" 
        subtitle={`${logs.length} import ${logs.length === 1 ? 'record' : 'records'} found`}
        actions={headerActions}
      />
      
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {logs.length === 0 ? (
            <Empty
              icon="FileText"
              title="No import history"
              message="You haven't imported any resumes yet. Upload your resume to start tracking import status."
              actionLabel="Go to Profile"
              onAction={() => window.location.href = '/profile'}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {logs.map((log, index) => (
                <motion.div
                  key={log.Id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className={`
                      p-2 rounded-full flex-shrink-0
                      ${log.status === 'success' ? 'bg-green-100' : ''}
                      ${log.status === 'warning' ? 'bg-yellow-100' : ''}
                      ${log.status === 'error' ? 'bg-red-100' : ''}
                    `}>
                      <ApperIcon 
                        name={getStatusIcon(log.status)} 
                        size={20} 
                        className={`
                          ${log.status === 'success' ? 'text-green-600' : ''}
                          ${log.status === 'warning' ? 'text-yellow-600' : ''}
                          ${log.status === 'error' ? 'text-red-600' : ''}
                        `}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">
                            Resume Import
                          </h3>
                          <Badge variant={getStatusVariant(log.status)} size="sm">
                            {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                      
                      {/* Extracted Fields */}
                      {log.extractedFields && Object.keys(log.extractedFields).length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Successfully Extracted:
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(log.extractedFields).map(([field, value]) => (
                              <Badge key={field} variant="accent" size="sm">
                                {field}: {Array.isArray(value) ? value.length : value?.toString().length || 0} items
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Errors */}
                      {log.errors && log.errors.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-red-700 mb-2">
                            Issues Found:
                          </h4>
                          <div className="space-y-1">
                            {log.errors.map((error, errorIndex) => (
                              <div key={errorIndex} className="flex items-start gap-2 text-sm text-red-600">
                                <ApperIcon name="AlertCircle" size={14} className="mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Summary */}
                      <div className="text-sm text-gray-600">
                        {log.status === 'success' && (
                          <p>Resume processed successfully. All data extracted and saved to your profile.</p>
                        )}
                        {log.status === 'warning' && (
                          <p>Resume processed with some issues. Please review the warnings above.</p>
                        )}
                        {log.status === 'error' && (
                          <p>Resume processing failed. Please check the errors above and try again.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportStatusPage;