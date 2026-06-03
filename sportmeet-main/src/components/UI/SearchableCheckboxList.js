import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';

const SearchableCheckboxList = ({
  items = [],
  selectedItems = [],
  onToggle,
  title,
  placeholder = "Search...",
  maxHeight = "max-h-40",
  showIcon = false,
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort items alphabetically
  const filteredItems = useMemo(() => {
    return items
      .filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, searchQuery]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {title}
      </label>
      
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Checkbox List */}
      <div className={`space-y-2 overflow-y-auto border border-gray-300 rounded-lg p-3 ${maxHeight}`}>
        {filteredItems.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            {searchQuery ? 'No items found matching your search.' : 'No items available.'}
          </div>
        ) : (
          filteredItems.map((item) => (
            <label key={item.id} className="flex items-center space-x-2 hover:bg-gray-50 p-1 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={() => onToggle(item)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {showIcon && item.icon && (
                <span className="text-lg">{item.icon}</span>
              )}
              <span className="text-sm text-gray-700 flex-1">{item.name}</span>
            </label>
          ))
        )}
      </div>

      {/* Selected Count */}
      {selectedItems.length > 0 && (
        <div className="text-xs text-gray-500">
          {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
};

export default SearchableCheckboxList;
