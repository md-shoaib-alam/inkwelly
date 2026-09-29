"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL,
  CLASS_SORT_OPTIONS,
  CLASS_STATUS_OPTIONS,
  CLASS_VOCATIONAL_OPTIONS,
  formatGradeLabel,
  type ClassFilters,
} from "@/lib/class-options";

interface ClassesFilterPanelProps {
  filters: ClassFilters;
  onChange: (patch: Partial<ClassFilters>) => void;
  options: { grades: string[]; sections: string[]; mediums: string[] };
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterSelect({
  value,
  onValueChange,
  placeholder,
  options,
  width = "w-full",
}: {
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  width?: string;
}) {
  return (
    <Select value={value || ALL} onValueChange={onValueChange}>
      <SelectTrigger className={`${width} bg-white dark:bg-zinc-900 h-9 rounded-md border-slate-200/90 dark:border-zinc-800 text-xs sm:text-[13px] shadow-2xs`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Grade, section and medium come from the tenant's own rows rather than the
 * static pickers, so the panel can never offer a value that returns nothing.
 */
export function ClassesFilterPanel({ filters, onChange, options }: ClassesFilterPanelProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 rounded-lg border border-slate-200/80 bg-[#F1F5F9] dark:bg-zinc-900/60 dark:border-zinc-800 mb-4">
      <FilterField label="Grade Level">
        <FilterSelect
          value={filters.grade ?? ALL}
          onValueChange={(v) => onChange({ grade: v })}
          placeholder="All Grades"
          options={[
            { value: ALL, label: "All Grades" },
            ...options.grades.map((g) => ({ value: g, label: formatGradeLabel(g) })),
          ]}
        />
      </FilterField>

      <FilterField label="Section">
        <FilterSelect
          value={filters.section ?? ALL}
          onValueChange={(v) => onChange({ section: v })}
          placeholder="All Sections"
          options={[
            { value: ALL, label: "All Sections" },
            ...options.sections.map((s) => ({ value: s, label: s })),
          ]}
        />
      </FilterField>

      <FilterField label="Medium">
        <FilterSelect
          value={filters.medium ?? ALL}
          onValueChange={(v) => onChange({ medium: v })}
          placeholder="All Mediums"
          options={[
            { value: ALL, label: "All Mediums" },
            ...options.mediums.map((m) => ({ value: m, label: m })),
          ]}
        />
      </FilterField>

      <FilterField label="Vocational Ed">
        <FilterSelect
          value={filters.vocational ?? ALL}
          onValueChange={(v) => onChange({ vocational: v })}
          placeholder="All"
          options={[...CLASS_VOCATIONAL_OPTIONS]}
        />
      </FilterField>

      <FilterField label="Status">
        <FilterSelect
          value={filters.status ?? ALL}
          onValueChange={(v) => onChange({ status: v })}
          placeholder="All Status"
          options={[...CLASS_STATUS_OPTIONS]}
        />
      </FilterField>

      <FilterField label="Sort By">
        <FilterSelect
          value={filters.sortBy ?? "name"}
          onValueChange={(v) => onChange({ sortBy: v })}
          placeholder="Name"
          options={[...CLASS_SORT_OPTIONS]}
        />
      </FilterField>

      <FilterField label="Sort Order">
        <FilterSelect
          value={filters.sortDir ?? "asc"}
          onValueChange={(v) => onChange({ sortDir: v as "asc" | "desc" })}
          placeholder="Ascending"
          options={[
            { value: "asc", label: "Ascending" },
            { value: "desc", label: "Descending" },
          ]}
        />
      </FilterField>
    </div>
  );
}
