'use client';

import * as React from 'react';
import { addMonths, subMonths, startOfYear, endOfYear, startOfMonth, endOfMonth, format, setYear, setMonth, setDate } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DateRangePickerProps {
  from: Date;
  to: Date;
  onSelect: (range: { from: Date; to: Date }) => void;
}

const QUICK_RANGES = [
  { label: '過去3ヶ月', getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
  { label: '過去6ヶ月', getValue: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
  { label: '過去12ヶ月', getValue: () => ({ from: subMonths(new Date(), 12), to: new Date() }) },
  { label: '今年', getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
  { label: '前年', getValue: () => {
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
  }},
];

interface DateControlsProps {
  date: Date;
  onChange: (date: Date) => void;
  label: string;
}

function DateControls({ date, onChange, label }: DateControlsProps) {
  // Generate year options (20 years back to 20 years forward)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 41 }, (_, i) => currentYear - 20 + i);

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2024, i), 'M月', { locale: ja }),
  }));

  // Generate day options based on the current month
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Select
          value={date.getFullYear().toString()}
          onValueChange={(value) => {
            const newDate = setYear(date, parseInt(value));
            onChange(newDate);
          }}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}年
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={date.getMonth().toString()}
          onValueChange={(value) => {
            const newDate = setMonth(date, parseInt(value));
            onChange(newDate);
          }}
        >
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((month) => (
              <SelectItem key={month.value} value={month.value.toString()}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={date.getDate().toString()}
          onValueChange={(value) => {
            const newDate = setDate(date, parseInt(value));
            onChange(newDate);
          }}
        >
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dayOptions.map((day) => (
              <SelectItem key={day} value={day.toString()}>
                {day}日
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function DateRangePicker({ from, to, onSelect }: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({ from, to });
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [calendarMode, setCalendarMode] = React.useState<'quick' | 'range' | 'precise'>('quick');
  const [calendarYearMonth, setCalendarYearMonth] = React.useState<{ year: number; month: number }>(() => ({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  }));

  const handleQuickRangeSelect = (range: { from: Date; to: Date }) => {
    setDate(range);
    onSelect(range);
    setIsPopoverOpen(false);
  };

  const handlePreciseDateChange = (type: 'from' | 'to', newDate: Date) => {
    if (!date) return;
    
    const newRange = {
      from: type === 'from' ? newDate : date.from!,
      to: type === 'to' ? newDate : date.to!,
    };
    
    setDate(newRange);
    onSelect(newRange);
  };

  // Tabsの値変更ハンドラ - 型安全にするため明示的に定義
  const handleValueChange = (value: string) => {
    // 型安全チェック
    if (value === 'quick' || value === 'range' || value === 'precise') {
      setCalendarMode(value);
    }
  };

  // カレンダーの選択ハンドラ - 型の不一致を解決
  const handleCalendarSelect = (range: DateRange | undefined) => {
    setDate(range);
    if (range?.from && range?.to) {
      onSelect({
        from: range.from,
        to: range.to
      });
      setIsPopoverOpen(false);
    }
  };

  return (
    <div className="grid gap-2">
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'yyyy年MM月dd日', { locale: ja })} -{' '}
                  {format(date.to, 'yyyy年MM月dd日', { locale: ja })}
                </>
              ) : (
                format(date.from, 'yyyy年MM月dd日', { locale: ja })
              )
            ) : (
              <span>日付を選択</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Tabs value={calendarMode} onValueChange={handleValueChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quick">クイック選択</TabsTrigger>
              <TabsTrigger value="range">カレンダー</TabsTrigger>
              <TabsTrigger value="precise">詳細指定</TabsTrigger>
            </TabsList>

            <TabsContent value="quick" className="p-4 space-y-4">
              {QUICK_RANGES.map((range) => (
                <Button
                  key={range.label}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleQuickRangeSelect(range.getValue())}
                >
                  {range.label}
                </Button>
              ))}
            </TabsContent>

            <TabsContent value="range" className="p-4">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={new Date(calendarYearMonth.year, calendarYearMonth.month)}
                month={new Date(calendarYearMonth.year, calendarYearMonth.month)}
                onMonthChange={(month) => {
                  setCalendarYearMonth({
                    year: month.getFullYear(),
                    month: month.getMonth(),
                  });
                }}
                selected={date}
                onSelect={handleCalendarSelect}
                numberOfMonths={2}
                locale={ja}
              />
            </TabsContent>

            <TabsContent value="precise" className="p-4 space-y-4">
              <DateControls
                date={date?.from || new Date()}
                onChange={(newDate) => handlePreciseDateChange('from', newDate)}
                label="開始日"
              />
              <DateControls
                date={date?.to || new Date()}
                onChange={(newDate) => handlePreciseDateChange('to', newDate)}
                label="終了日"
              />
              <Button 
                className="w-full"
                onClick={() => setIsPopoverOpen(false)}
              >
                完了
              </Button>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
}