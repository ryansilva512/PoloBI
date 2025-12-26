"use client"

import * as React from "react"
import { format, startOfWeek, endOfWeek, subWeeks, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Check, X } from "lucide-react"
import { DateRange, DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
    dateRange: DateRange | undefined
    onDateRangeChange: (range: DateRange | undefined) => void
    className?: string
    placeholder?: string
}

const presets = [
    {
        label: "Esta semana",
        getValue: () => ({
            from: startOfWeek(new Date(), { weekStartsOn: 1 }),
            to: endOfWeek(new Date(), { weekStartsOn: 1 }),
        }),
    },
    {
        label: "Semana passada",
        getValue: () => ({
            from: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
            to: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
        }),
    },
    {
        label: "Últimos 30 dias",
        getValue: () => ({
            from: subDays(new Date(), 30),
            to: new Date(),
        }),
    },
    {
        label: "Este mês",
        getValue: () => ({
            from: startOfMonth(new Date()),
            to: endOfMonth(new Date()),
        }),
    },
    {
        label: "Mês passado",
        getValue: () => ({
            from: startOfMonth(subMonths(new Date(), 1)),
            to: endOfMonth(subMonths(new Date(), 1)),
        }),
    },
]

export function DateRangePicker({
    dateRange,
    onDateRangeChange,
    className,
    placeholder = "Selecione um período",
}: DateRangePickerProps) {
    const [tempRange, setTempRange] = React.useState<DateRange | undefined>(dateRange)
    const [isOpen, setIsOpen] = React.useState(false)
    const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date())

    // Sync tempRange when dateRange changes externally
    React.useEffect(() => {
        setTempRange(dateRange)
    }, [dateRange])

    const handlePresetClick = (preset: typeof presets[0]) => {
        const range = preset.getValue()
        setTempRange(range)
        setCurrentMonth(range.from)
    }

    const handleConfirm = () => {
        onDateRangeChange(tempRange)
        setIsOpen(false)
    }

    const handleClear = () => {
        setTempRange(undefined)
        onDateRangeChange(undefined)
        setIsOpen(false)
    }

    const formatDateRange = (range: DateRange | undefined) => {
        if (!range?.from) return placeholder
        if (!range.to) return format(range.from, "d 'de' MMM 'de' yyyy", { locale: ptBR })
        return `${format(range.from, "d 'de' MMM 'de' yyyy", { locale: ptBR })} - ${format(range.to, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "justify-start text-left font-normal min-w-[260px]",
                        !dateRange && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateRange(dateRange)}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                    {/* Presets Sidebar */}
                    <div className="border-r p-3 space-y-1 bg-muted/30 min-w-[140px]">
                        {presets.map((preset) => (
                            <Button
                                key={preset.label}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "w-full justify-start text-sm font-normal h-9",
                                    tempRange?.from &&
                                    preset.getValue().from.toDateString() === tempRange.from.toDateString() &&
                                    preset.getValue().to.toDateString() === (tempRange.to?.toDateString() ?? "") &&
                                    "bg-accent text-accent-foreground"
                                )}
                                onClick={() => handlePresetClick(preset)}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>

                    {/* Calendar */}
                    <div className="p-3">
                        {/* Period Display Header */}
                        <div className="mb-3 px-2 py-2 bg-slate-700 rounded-lg text-white">
                            <p className="text-xs text-slate-300">{tempRange?.from ? format(tempRange.from, "yyyy", { locale: ptBR }) : new Date().getFullYear()}</p>
                            <p className="font-semibold text-sm">
                                {tempRange?.from
                                    ? `${format(tempRange.from, "d 'de' MMM 'de' yyyy", { locale: ptBR })}${tempRange.to ? ` - ${format(tempRange.to, "d 'de' MMM 'de' yyyy", { locale: ptBR })}` : ""}`
                                    : "Selecione as datas"
                                }
                            </p>
                        </div>

                        <DayPicker
                            mode="range"
                            selected={tempRange}
                            onSelect={setTempRange}
                            month={currentMonth}
                            onMonthChange={setCurrentMonth}
                            locale={ptBR}
                            showOutsideDays={true}
                            numberOfMonths={1}
                            classNames={{
                                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                month: "space-y-4",
                                caption: "flex justify-center pt-1 relative items-center",
                                caption_label: "text-sm font-medium",
                                nav: "space-x-1 flex items-center",
                                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground",
                                nav_button_previous: "absolute left-1",
                                nav_button_next: "absolute right-1",
                                table: "w-full border-collapse space-y-1",
                                head_row: "flex",
                                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                                row: "flex w-full mt-2",
                                cell: cn(
                                    "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                                    "h-9 w-9",
                                    "[&:has([aria-selected])]:bg-slate-700/80",
                                    "[&:has([aria-selected].day-range-end)]:rounded-r-md",
                                    "[&:has([aria-selected].day-range-start)]:rounded-l-md",
                                    "first:[&:has([aria-selected])]:rounded-l-md",
                                    "last:[&:has([aria-selected])]:rounded-r-md"
                                ),
                                day: cn(
                                    "h-9 w-9 p-0 font-normal",
                                    "hover:bg-slate-600/50 hover:text-white rounded-md",
                                    "aria-selected:opacity-100"
                                ),
                                day_range_start: "day-range-start bg-slate-700 text-white rounded-l-md",
                                day_range_end: "day-range-end bg-slate-700 text-white rounded-r-md",
                                day_selected: "bg-slate-700 text-white hover:bg-slate-600",
                                day_today: "bg-accent text-accent-foreground font-semibold",
                                day_outside: "day-outside text-muted-foreground opacity-50",
                                day_disabled: "text-muted-foreground opacity-50",
                                day_range_middle: "aria-selected:bg-slate-700/60 aria-selected:text-white",
                                day_hidden: "invisible",
                            }}
                        />

                        {/* Confirm/Clear buttons */}
                        <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                            <Button variant="ghost" size="sm" onClick={handleClear}>
                                <X className="h-4 w-4 mr-1" />
                                Limpar
                            </Button>
                            <Button size="sm" onClick={handleConfirm} className="bg-emerald-600 hover:bg-emerald-700">
                                <Check className="h-4 w-4 mr-1" />
                                Confirmar
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
