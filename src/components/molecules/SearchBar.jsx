import React, { useState } from 'react';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';

const SearchBar = ({ 
  placeholder = "Search...", 
  onSearch, 
  className = '' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <div className="flex-1">
        <Input
          icon="Search"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-r-none"
        />
      </div>
      <Button
        type="submit"
        variant="primary"
        icon="Search"
        className="rounded-l-none"
      >
        Search
      </Button>
    </form>
  );
};

export default SearchBar;