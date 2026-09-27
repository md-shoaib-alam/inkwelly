'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  date?: Date;
  onChange?: (date?: Date) => void;
  placeholder?: string;
  className?: string;
  disabled?: (date: Date) => boolean;
  align?: 'start' | 'center' | 'end';
}

export function DatePicker({
  date,
  onChange,
  placeholder = 'Pick a date',
  className,
  disabled,
  align = 'start',
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const dateTime = date?.getTime();
  const memoizedDate = React.useMemo(() => date, [dateTime]);

  // Sync visible month state when popover opens or when memoizedDate changes
  const [month, setMonth] = React.useState<Date | undefined>(date);

  React.useEffect(() => {
    if (open) {
      setMonth(memoizedDate || new Date());
    }
  }, [open, memoizedDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "h-9 justify-start gap-2 text-left font-normal px-3 bg-background border-muted-foreground/20 hover:bg-muted/50 transition-all",
            !memoizedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="size-3.5 text-muted-foreground opacity-70" />
          <span className="text-[11px] font-medium truncate" suppressHydrationWarning>
            {memoizedDate ? format(memoizedDate, "PP") : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align} collisionPadding={16}>
        <Calendar
          mode="single"
          selected={memoizedDate}
          month={month}
          onMonthChange={setMonth}
          captionLayout="dropdown"
          startMonth={new Date(2000, 0)}
          endMonth={new Date(new Date().getFullYear() + 5, 11)}
          onSelect={(d) => {
            onChange?.(d);
            setOpen(false);
          }}
          disabled={disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
