import React, { useRef, useEffect } from 'react';
import { MenuItem } from '../types';
import { Search, Plus, UtensilsCrossed, X } from 'lucide-react';

interface MenuGridProps {
  items: MenuItem[];
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectItem: (item: MenuItem) => void;
  currencySymbol: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export const MenuGrid: React.FC<MenuGridProps> = ({
  items,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  onSelectItem,
  currencySymbol,
  searchInputRef,
}) => {
  // Filter items based on category and search query
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === 'ALL' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      item.name.toLowerCase().includes(query) ||
      (item.urduName && item.urduName.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="space-y-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        {/* Search input with keyboard hint */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search food by name, Urdu, or recipe... (F2 to focus)"
            className="w-full pl-10 pr-10 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/20'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            All Items ({items.length})
          </button>
          {categories.map((cat) => {
            const count = items.filter((i) => i.category.toLowerCase() === cat.toLowerCase()).length;
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/20'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Dishes */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            <UtensilsCrossed className="w-10 h-10 text-stone-300 dark:text-stone-600 mb-3" />
            <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200">No dishes found</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xs">
              No items match &quot;{searchQuery}&quot; in {selectedCategory === 'ALL' ? 'the menu' : selectedCategory}.
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
              >
                Clear search filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pb-12">
            {filteredItems.map((item) => {
              return (
                <div
                  key={item.id}
                  onClick={() => item.available && onSelectItem(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (item.available) onSelectItem(item);
                    }
                  }}
                  className={`group relative flex flex-col justify-between bg-white dark:bg-stone-900 rounded-xl border transition-all text-left overflow-hidden ${
                    item.available
                      ? 'border-stone-200 dark:border-stone-800 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:shadow-md cursor-pointer active:scale-[0.98]'
                      : 'border-stone-200 dark:border-stone-800 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {/* Food Image with zero-broken-image fallback */}
                  <div className="relative aspect-4/3 w-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback to placeholder background
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}
                    
                    {/* Fallback container with culinary icon if no image or error */}
                    <div className="absolute inset-0 -z-10 flex items-center justify-center bg-stone-100 dark:bg-stone-800 text-stone-400">
                      <UtensilsCrossed className="w-8 h-8 opacity-40" />
                    </div>

                    {/* Stock status overlay */}
                    {!item.available && (
                      <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-2">
                        <span className="text-xs font-bold text-rose-300 tracking-wider uppercase bg-rose-950/80 px-2.5 py-1 rounded-sm border border-rose-800">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    {/* Category Label */}
                    <span className="absolute top-2 left-2 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-stone-950/70 text-stone-200 backdrop-blur-xs">
                      {item.category}
                    </span>
                  </div>

                  {/* Item Content */}
                  <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {item.name}
                        </h4>
                      </div>
                      {item.urduName && (
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 font-sans tracking-wide">
                          {item.urduName}
                        </p>
                      )}
                      {item.description && (
                        <p className="text-[11px] text-stone-400 dark:text-stone-500 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Price & Add Button */}
                    <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800/80">
                      <span className="text-xs sm:text-sm font-extrabold text-stone-900 dark:text-white font-mono-numbers">
                        {currencySymbol} {item.price.toLocaleString()}
                      </span>

                      <button
                        type="button"
                        disabled={!item.available}
                        className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                          item.available
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 shadow-xs'
                            : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                        }`}
                        title="Add to order"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
