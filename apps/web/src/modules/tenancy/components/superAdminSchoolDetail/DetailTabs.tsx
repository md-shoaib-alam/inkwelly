import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableRow,
  TableHeader,
} from "@/components/ui/table";
import { 
  Download, 
  Upload, 
  Search, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Filter
} from "lucide-react";
import { TabType, TAB_CONFIG } from "./types";
import { TableHeaders, TableCells } from "./TabRenderers";

interface DetailTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  search: string;
  setSearch: (val: string) => void;
  currentPage: number;
  setCurrentPage: (page: number | ((p: number) => number)) => void;
  exporting: boolean;
  importing: boolean;
  onExport: (type: string) => void;
  onImportClick: () => void;
  paginatedData: any[];
  totalPages: number;
  totalItems: number;
  isLoading: boolean;
}

export function DetailTabs({
  activeTab,
  setActiveTab,
  search,
  setSearch,
  currentPage,
  setCurrentPage,
  exporting,
  importing,
  onExport,
  onImportClick,
  paginatedData,
  totalPages,
  totalItems,
  isLoading,
}: DetailTabsProps) {
  
  function getPaginationRange(current: number, total: number): (number | "ellipsis")[] {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "ellipsis")[] = [1];
    if (current > 3) pages.push("ellipsis");
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push("ellipsis");
    pages.push(total);
    return pages;
  }

  return (
    <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          {/* Header Tab Bar & Action Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            {/* Pill Tabs List */}
            <div className="overflow-x-auto pb-1 scrollbar-hide">
              <TabsList className="h-10 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl gap-1 border border-slate-100 dark:border-slate-800">
                {TAB_CONFIG.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="gap-2 px-4 h-8 text-xs font-semibold rounded-xl transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-blue-950/40 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-2xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {/* Export & Import Buttons matching reference */}
            <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport(activeTab)}
                disabled={exporting || totalItems === 0}
                className="h-9.5 text-xs font-semibold px-4 rounded-xl border-slate-200 hover:bg-slate-50 text-blue-600 dark:text-blue-400 dark:border-slate-700 shadow-2xs gap-1.5 transition-all"
              >
                {exporting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5 text-blue-600 dark:text-blue-400" />
                )}
                Export Excel
              </Button>
              <Button
                size="sm"
                onClick={onImportClick}
                disabled={importing}
                className="h-9.5 text-xs font-semibold px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs gap-1.5 transition-all"
              >
                {importing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5 text-white" />
                )}
                Import CSV
              </Button>
            </div>
          </div>

          {/* Section Sub-header & Search Input (matching reference) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 capitalize">
                {activeTab}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                Manage and view all {activeTab} enrolled in this school
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  placeholder={`Search ${activeTab} by name, admission number, or class...`}
                  className="pl-10 h-10 rounded-xl bg-slate-50/70 dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-xs placeholder:text-slate-400 shadow-2xs focus-visible:ring-1 focus-visible:ring-blue-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3.5 rounded-xl border-slate-200/90 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 gap-1.5 shadow-2xs hover:bg-slate-50"
              >
                <Filter className="size-3.5 text-slate-400" />
                Filter
              </Button>
            </div>
          </div>

          {/* Table Content */}
          {TAB_CONFIG.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              {isLoading ? (
                <div className="py-24 text-center">
                  <Loader2 className="size-10 animate-spin text-rose-600 mx-auto mb-4" />
                  <p className="text-sm font-medium text-muted-foreground">Fetching {tab.label}…</p>
                </div>
              ) : totalItems === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl">
                  <div className="size-20 mx-auto mb-6 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-muted-foreground/30">
                    {tab.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    No {tab.label.toLowerCase()} found
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 font-medium max-w-[280px] mx-auto leading-relaxed">
                    {search
                      ? `We couldn't find any results matching "${search}". Try a different term.`
                      : `There is no ${tab.label.toLowerCase()} data available for this school yet.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/70 dark:bg-slate-800/40 hover:bg-transparent border-b border-slate-200/80 dark:border-slate-800">
                            <TableHeaders activeTab={activeTab} />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedData.map((item, idx) => (
                            <TableRow
                              key={item.id || idx}
                              className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/80 last:border-none"
                            >
                              <TableCells activeTab={activeTab} item={item} index={idx} />
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Pagination */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Showing <span className="text-blue-600 dark:text-blue-400 font-semibold">{(currentPage - 1) * 20 + 1}</span> to <span className="text-blue-600 dark:text-blue-400 font-semibold">{Math.min(currentPage * 20, totalItems)}</span> of {totalItems} records
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <div className="flex items-center gap-1 px-1">
                        {getPaginationRange(currentPage, totalPages).map((page, idx) =>
                          page === "ellipsis" ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-xs">...</span>
                          ) : (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "ghost"}
                              size="sm"
                              className={`size-8 rounded-lg font-semibold text-xs ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white shadow-2xs hover:bg-blue-700'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          )
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        <ChevronRight className="size-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
