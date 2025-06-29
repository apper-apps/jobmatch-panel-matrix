import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';

const FileUpload = ({ onFileSelect, accept = ".pdf", className = '' }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  return (
    <div className={className}>
      <motion.div
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${isDragOver 
            ? 'border-primary-400 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        whileHover={{ scale: 1.01 }}
      >
        <ApperIcon 
          name="Upload" 
          size={48} 
          className={`mx-auto mb-4 ${isDragOver ? 'text-primary-500' : 'text-gray-400'}`} 
        />
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload Your Resume
        </h3>
        
        <p className="text-gray-600 mb-6">
          Drag and drop your PDF resume here, or click to browse
        </p>
        
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        
        <label htmlFor="file-upload">
          <Button variant="primary" icon="Upload" className="cursor-pointer">
            Choose File
          </Button>
        </label>
        
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200"
          >
            <div className="flex items-center justify-center gap-2">
              <ApperIcon name="FileText" size={16} className="text-green-600" />
              <span className="text-sm text-green-800 font-medium">
                {selectedFile.name}
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default FileUpload;