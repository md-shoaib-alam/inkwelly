import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export type TabType = 'all' | 'upcoming' | 'in_progress' | 'completed' | 'draft';

interface ActiveExamsTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

const tabs: { key: TabType; label: string }[] = [
  { key: 'all', label: 'All Exams' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'draft', label: 'Drafts' },
];

export function ActiveExamsTabs({
  activeTab,
  onTabChange,
  searchQuery = '',
  onSearchChange,
}: ActiveExamsTabsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-px">
      <div className="flex items-center gap-1 sm:gap-6 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {onSearchChange && (
        <div className="relative pb-2 sm:pb-1.5 w-full sm:w-60 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search exams..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-xs bg-muted/30 border-border/80 rounded-lg w-full"
          />
        </div>
      )}
    </div>
  );
}
