import { useState, useMemo, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { searchRecords } from '@/lib/searchUtils';
import { useLocation } from 'wouter';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const { searchIndex, miniSearchIndex } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useLocation();
  
  const results = useMemo(() => {
    if (!query.trim()) {
      return [];
    }
    return searchRecords(searchIndex, query, miniSearchIndex || undefined).slice(0, 20); // Limit to top 20 results
  }, [query, searchIndex, miniSearchIndex]);
  
  // Group results by category
  const groupedResults = useMemo(() => {
    const groups: Record<string, typeof results> = {};
    results.forEach(result => {
      if (!groups[result.category]) {
        groups[result.category] = [];
      }
      groups[result.category].push(result);
    });
    return groups;
  }, [results]);
  
  const categories = Object.keys(groupedResults);
  
  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setQuery(''); // Clear query when opening
    }
  }, [isOpen]);
  
  const handleResultClick = (result: typeof results[0]) => {
    // If not on home page, navigate there first before opening the modal
    const isOnHomePage = location === '/' || location === '/torah' || location === '/tefilla' || location === '/tzedaka' || location === '/life';
    
    if (!isOnHomePage) {
      // Navigate to home first
      setLocation('/');
      // Then execute the action after a short delay to allow navigation
      setTimeout(() => {
        if (result.action) {
          result.action();
        }
        onClose();
      }, 150);
    } else {
      // Already on home page, just execute the action
      if (result.action) {
        result.action();
      }
      // Delay close to allow navigation/modal actions to complete
      setTimeout(() => {
        onClose();
      }, 100);
    }
  };
  
  const handleClearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl h-[90vh] md:h-[80vh] p-0 gap-0 flex flex-col overflow-hidden bg-gradient-to-br from-rose-50 to-purple-50"
        data-testid="search-modal"
      >
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex-1">Search</h2>
            <button
              onPointerDown={onClose}
              className="rounded-full w-8 h-8 bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200"
              aria-label="Close search"
              data-testid="button-close-search"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search prayers, Torah, recipes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base bg-white border-gray-300 focus-visible:ring-blush"
              autoFocus
              data-testid="search-input"
            />
            {query && (
              <button
                onPointerDown={handleClearQuery}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
                data-testid="button-clear-search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {!query.trim() && (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Search for content</p>
              <p className="text-sm">Try searching for prayers, Torah topics, or recipes</p>
            </div>
          )}
          
          {query.trim() && results.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium mb-2">No results found</p>
              <p className="text-sm">Try different search terms</p>
            </div>
          )}
          
          {query.trim() && results.length > 0 && (
            <div className="space-y-6">
              {categories.map(category => (
                <div key={category}>
                  <h3 className="text-xs uppercase font-semibold text-gray-500 mb-2 px-1">
                    {category}
                  </h3>
                  <div className="space-y-1">
                    {groupedResults[category].map(result => (
                      <button
                        key={result.id}
                        onPointerDown={() => handleResultClick(result)}
                        className="w-full text-left p-3 rounded-lg bg-white hover:bg-rose-50 transition-colors border border-gray-200 hover:border-rose-300"
                        data-testid={`result-${result.id}`}
                      >
                        <div className="font-medium text-gray-900">{result.title}</div>
                        {result.secondaryText && (
                          <div className="text-sm text-gray-600 mt-1">{result.secondaryText}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer hint */}
        <div className="p-3 border-t border-gray-200 bg-white/80 backdrop-blur-sm text-center text-xs text-gray-500">
          Smart search with Hebrew • Typo-tolerant • {searchIndex.length} items
        </div>
      </DialogContent>
    </Dialog>
  );
}
