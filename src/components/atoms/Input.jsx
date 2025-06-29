import React, { useState, useRef, useEffect } from 'react';
import ApperIcon from '@/components/ApperIcon';

const Input = ({
  label,
  error,
  icon,
  iconPosition = 'left',
  className = '',
  suggestions = [],
  onSuggestionSelect,
  showSuggestions = false,
  ...props
}) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const inputClasses = `
    w-full px-4 py-3 border rounded-lg transition-all duration-200 bg-white
    ${error 
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
    }
    ${icon && iconPosition === 'left' ? 'pl-11' : ''}
    ${icon && iconPosition === 'right' ? 'pr-11' : ''}
    ${showDropdown && filteredSuggestions.length > 0 ? 'rounded-b-none' : ''}
    ${className}
  `;

  // Filter suggestions based on input value
  useEffect(() => {
    if (showSuggestions && props.value && suggestions.length > 0) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(props.value.toLowerCase()) &&
        suggestion.toLowerCase() !== props.value.toLowerCase()
      ).slice(0, 8); // Limit to 8 suggestions
      
      setFilteredSuggestions(filtered);
      setShowDropdown(filtered.length > 0);
      setActiveSuggestion(-1);
    } else {
      setFilteredSuggestions([]);
      setShowDropdown(false);
    }
  }, [props.value, suggestions, showSuggestions]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
        setActiveSuggestion(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (!showDropdown || filteredSuggestions.length === 0) {
      if (props.onKeyPress) props.onKeyPress(e);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestion >= 0) {
          handleSuggestionClick(filteredSuggestions[activeSuggestion]);
        } else if (props.onKeyPress) {
          props.onKeyPress(e);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setActiveSuggestion(-1);
        inputRef.current?.blur();
        break;
      default:
        if (props.onKeyPress) props.onKeyPress(e);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
    setShowDropdown(false);
    setActiveSuggestion(-1);
  };

  const handleInputChange = (e) => {
    if (props.onChange) {
      props.onChange(e);
    }
  };

  const handleInputFocus = (e) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      setShowDropdown(true);
    }
    if (props.onFocus) {
      props.onFocus(e);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <ApperIcon 
              name={icon} 
              size={18} 
              className="text-gray-400" 
            />
          </div>
        )}
        
        <input
          ref={inputRef}
          className={inputClasses}
          {...props}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
            <ApperIcon 
              name={icon} 
              size={18} 
              className="text-gray-400" 
            />
          </div>
        )}

        {/* Suggestions Dropdown */}
        {showDropdown && filteredSuggestions.length > 0 && (
          <div 
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 bg-white border border-t-0 border-gray-200 rounded-b-lg shadow-lg z-50 max-h-48 overflow-y-auto"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                  index === activeSuggestion ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                } ${index === filteredSuggestions.length - 1 ? '' : 'border-b border-gray-100'}`}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setActiveSuggestion(index)}
              >
                <div className="flex items-center gap-2">
                  <ApperIcon name="Search" size={14} className="text-gray-400" />
                  <span>{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;