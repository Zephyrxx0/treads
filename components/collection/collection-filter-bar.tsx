'use client';

import * as React from 'react';
import { Search, X, ArrowUpDown, TreePine, Flower2, Sprout, Bird, Bug, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OrganismKind } from '@/lib/hunt';

export type SortOption = 'recent' | 'seen' | 'alpha';

export interface CategoryCount {
  kind: OrganismKind | 'all';
  label: string;
  count: number;
}

export interface CollectionFilterBarProps {
  selectedKind: OrganismKind | 'all';
  onSelectKind: (kind: OrganismKind | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  categoryCounts: CategoryCount[];
  className?: string;
}

function getCategoryIcon(kind: OrganismKind | 'all') {
  switch (kind) {
    case 'tree':
      return TreePine;
    case 'flower':
      return Flower2;
    case 'plant':
      return Sprout;
    case 'bird':
      return Bird;
    case 'insect':
      return Bug;
    case 'all':
      return Sparkles;
    default:
      return Sparkles;
  }
}

export function CollectionFilterBar({
  selectedKind,
  onSelectKind,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  categoryCounts,
  className,
}: CollectionFilterBarProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by common or scientific name..."
            className="w-full h-11 pl-10 pr-9 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#F35C2B] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative inline-flex items-center">
            <ArrowUpDown className="absolute left-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <select
              value={sortBy}
              aria-label="Sort species collection"
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="h-11 pl-9 pr-8 rounded-xl border border-border bg-card text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F35C2B] appearance-none cursor-pointer"
            >
              <option value="recent">Most Recent</option>
              <option value="seen">Most Seen</option>
              <option value="alpha">Alphabetical (A–Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Horizontal Category Filter Pills (per D-05) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {categoryCounts.map((cat) => {
          const Icon = getCategoryIcon(cat.kind);
          const isSelected = selectedKind === cat.kind;

          return (
            <button
              key={cat.kind}
              type="button"
              onClick={() => onSelectKind(cat.kind)}
              className={cn(
                'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 border',
                isSelected
                  ? 'bg-[#F35C2B] text-white border-[#F35C2B] shadow-sm'
                  : 'bg-card text-foreground border-border hover:border-[#F35C2B]/40 hover:bg-muted/40'
              )}
            >
              <Icon className={cn('w-3.5 h-3.5', isSelected ? 'text-white' : 'text-muted-foreground')} />
              <span>{cat.label}</span>
              <span
                className={cn(
                  'ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                  isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                )}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

