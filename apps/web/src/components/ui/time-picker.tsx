'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value?: string; // HH:mm format (24h)
  onChange?: (value: string) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [hour12, setHour12] = React.useState('09');
  const [minute, setMinute] = React.useState('00');
  const [period, setPeriod] = React.useState<'AM' | 'PM'>('AM');

  React.useEffect(() => {
    if (value) {
      const [h24, m] = value.split(':');
      const hInt = parseInt(h24 || '9');
      const p = hInt >= 12 ? 'PM' : 'AM';
      let h12 = hInt % 12;
      if (h12 === 0) h12 = 12;
      
      setHour12(String(h12).padStart(2, '0'));
      setMinute(m || '00');
      setPeriod(p);
    }
  }, [value]);

  const update24h = (h12: string, m: string, p: 'AM' | 'PM', shouldClose = false) => {
    let h24 = parseInt(h12);
    if (p === 'PM' && h24 < 12) h24 += 12;
    if (p === 'AM' && h24 === 12) h24 = 0;
    
    const formatted24h = `${String(h24).padStart(2, '0')}:${m}`;
    onChange?.(formatted24h);
    if (shouldClose) setOpen(false);
  };

  const hours12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 w-full justify-between text-left font-normal px-3 bg-background border-muted-foreground/20 hover:bg-muted/50 transition-all",
            className
          )}
        >
          <span className="text-[11px] font-medium">
            {hour12}:{minute} {period}
          </span>
          <Clock className="size-3.5 text-muted-foreground opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-[65px]">
              <Select value={hour12} onValueChange={(h) => { setHour12(h); update24h(h, minute, period); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {hours12.map((h) => (
                    <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-muted-foreground font-bold">:</span>
            <div className="w-[60px]">
              <Select value={minute} onValueChange={(m) => { setMinute(m); update24h(hour12, m, period); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {minutes.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[65px]">
              <Select value={period} onValueChange={(p: any) => { setPeriod(p); update24h(hour12, minute, p); }}>
                <SelectTrigger className="h-8 text-xs font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM" className="text-xs font-bold">AM</SelectItem>
                  <SelectItem value="PM" className="text-xs font-bold">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            size="sm" 
            className="w-full h-8 text-[11px] font-bold" 
            onClick={() => setOpen(false)}
          >
            Confirm time
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
