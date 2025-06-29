import React, { useState } from 'react';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import ApperIcon from '@/components/ApperIcon';

const SearchBar = ({ 
  placeholder = "Search...", 
  onSearch,
  onAISearch,
  loading = false,
  supportsAI = false,
  className = '' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAIMode, setIsAIMode] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isAIMode && onAISearch && searchTerm.trim()) {
      onAISearch(searchTerm);
    } else if (onSearch) {
      onSearch(searchTerm);
    }
  };

  const toggleAIMode = () => {
    setIsAIMode(!isAIMode);
  };

const aiPlaceholders = [
    "Search live job boards for React developer positions",
    "Find current senior frontend openings on LinkedIn & Indeed",
    "Discover Python roles from major job boards",
    "Search real-time AI/ML positions across platforms",
    "Find contract opportunities from live job postings"
  ];

  const currentPlaceholder = isAIMode 
    ? aiPlaceholders[Math.floor(Math.random() * aiPlaceholders.length)]
    : placeholder;
  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <div className="flex-1 relative">
        <Input
          icon={isAIMode ? "Zap" : "Search"}
          placeholder={currentPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${isAIMode ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200' : ''} ${supportsAI ? 'rounded-r-none' : ''}`}
          disabled={loading}
        />
        {isAIMode && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              <ApperIcon name="Sparkles" size={12} />
              AI
            </div>
          </div>
        )}
      </div>
      
      {supportsAI && (
        <Button
          type="button"
          variant={isAIMode ? "primary" : "secondary"}
          icon={isAIMode ? "Zap" : "Bot"}
          onClick={toggleAIMode}
          className="rounded-none border-l-0"
          disabled={loading}
          title={isAIMode ? "Switch to regular search" : "Enable AI-powered search"}
        >
          {isAIMode ? "AI" : "AI"}
        </Button>
      )}
      
      <Button
        type="submit"
        variant="primary"
        icon={loading ? "Loader2" : (isAIMode ? "Sparkles" : "Search")}
        className={supportsAI ? "rounded-l-none border-l-0" : "rounded-l-none"}
        disabled={loading || !searchTerm.trim()}
        loading={loading}
      >
        {loading ? "Searching..." : (isAIMode ? "AI Search" : "Search")}
      </Button>
    </form>
  );
};

export default SearchBar;