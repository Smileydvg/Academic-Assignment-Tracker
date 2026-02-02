"use client";

import { useState, useMemo } from "react";
import type { AcademicItem, ItemStatus, ClassInfo } from "@/lib/data";
import { defaultClasses } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Circle, CheckCircle2, Clock } from "lucide-react";

interface CalendarViewProps {
  items: AcademicItem[];
  onStatusChange: (id: string, status: ItemStatus) => void;
  classes?: ClassInfo[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const classes = defaultClasses;

function getClassColor(classCode: string, classList: ClassInfo[]): string {
  const classInfo = classList.find((c) => c.code === classCode);
  return classInfo?.color || "bg-muted";
}

function getClassTextColor(classCode: string, classList: ClassInfo[]): string {
  const colorMap: Record<string, string> = {
    "bg-chart-1": "text-chart-1",
    "bg-chart-2": "text-chart-2",
    "bg-chart-3": "text-chart-3",
    "bg-chart-4": "text-chart-4",
  };
  const classInfo = classList.find((c) => c.code === classCode);
  return colorMap[classInfo?.color || ""] || "text-muted-foreground";
}

export function CalendarView({ items, onStatusChange, classes: classesProp }: CalendarViewProps) {
  const classList = classesProp || defaultClasses;
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const { daysInMonth, startDay, monthItems } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const monthItemsMap = new Map<number, AcademicItem[]>();
    
    items.forEach((item) => {
      const itemDate = new Date(item.dueDate);
      if (itemDate.getMonth() === month && itemDate.getFullYear() === year) {
        const day = itemDate.getDate();
        if (!monthItemsMap.has(day)) {
          monthItemsMap.set(day, []);
        }
        monthItemsMap.get(day)!.push(item);
      }
    });

    return {
      daysInMonth: lastDay.getDate(),
      startDay: firstDay.getDay(),
      monthItems: monthItemsMap,
    };
  }, [currentDate, items]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const isToday = (day: number) => {
    const now = new Date();
    return (
      currentDate.getMonth() === now.getMonth() &&
      currentDate.getFullYear() === now.getFullYear() &&
      day === now.getDate()
    );
  };

  const calendarDays = [];
  
  // Empty cells for days before the first of the month
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(
      <div key={`empty-${i}`} className="h-24 md:h-32 bg-secondary/20 border-r border-b border-border" />
    );
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayItems = monthItems.get(day) || [];
    const hasItems = dayItems.length > 0;
    
    calendarDays.push(
      <div
        key={day}
        className={cn(
          "h-24 md:h-32 border-r border-b border-border p-1 md:p-2 transition-colors",
          hasItems ? "bg-card" : "bg-secondary/10",
          isToday(day) && "ring-2 ring-primary ring-inset"
        )}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
              isToday(day) && "bg-primary text-primary-foreground"
            )}
          >
            {day}
          </span>
          {dayItems.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{dayItems.length - 2}
            </Badge>
          )}
        </div>
        <div className="space-y-1 overflow-hidden">
          {dayItems.slice(0, 2).map((item) => (
            <Popover key={item.id}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "w-full text-left text-xs px-1.5 py-0.5 rounded truncate transition-opacity",
                    item.status === "completed" ? "opacity-50 line-through" : "",
                    getClassColor(item.classCode, classList),
                    "text-background font-medium"
                  )}
                >
                  {item.title}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="start">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn("w-2 h-2 rounded-full", getClassColor(item.classCode, classList))} />
                      <span className={cn("text-xs font-mono", getClassTextColor(item.classCode, classList))}>
                        {item.classCode}
                      </span>
                    </div>
                    <h4 className="font-semibold">{item.title}</h4>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.time ? `Due at ${item.time}` : "No time set"}
                    </span>
                    <Badge variant="secondary" className="capitalize">
                      {item.type}
                    </Badge>
                  </div>
                  {item.location && (
                    <p className="text-sm text-muted-foreground">
                      Location: {item.location}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button
                      size="sm"
                      variant={item.status === "not-started" ? "default" : "outline"}
                      className="flex-1 gap-1"
                      onClick={() => onStatusChange(item.id, "not-started")}
                    >
                      <Circle className="h-3 w-3" />
                      Not Started
                    </Button>
                    <Button
                      size="sm"
                      variant={item.status === "in-progress" ? "default" : "outline"}
                      className="flex-1 gap-1"
                      onClick={() => onStatusChange(item.id, "in-progress")}
                    >
                      <Clock className="h-3 w-3" />
                      In Progress
                    </Button>
                    <Button
                      size="sm"
                      variant={item.status === "completed" ? "default" : "outline"}
                      className="flex-1 gap-1"
                      onClick={() => onStatusChange(item.id, "completed")}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Done
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ))}
          {dayItems.length > 2 && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full text-xs text-muted-foreground hover:text-foreground text-left">
                  +{dayItems.length - 2} more
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="start">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">All items for {MONTHS[currentDate.getMonth()]} {day}</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {dayItems.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "p-2 rounded border border-border",
                          item.status === "completed" && "opacity-50"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn("w-2 h-2 rounded-full", getClassColor(item.classCode, classList))} />
                          <span className="text-xs font-mono text-muted-foreground">{item.classCode}</span>
                          <Badge variant="secondary" className="ml-auto text-xs capitalize">
                            {item.type}
                          </Badge>
                        </div>
                        <p className={cn("font-medium text-sm", item.status === "completed" && "line-through")}>
                          {item.title}
                        </p>
                        {item.time && (
                          <p className="text-xs text-muted-foreground">Due at {item.time}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    );
  }

  // Empty cells to complete the grid
  const totalCells = calendarDays.length;
  const remainingCells = 7 - (totalCells % 7);
  if (remainingCells < 7) {
    for (let i = 0; i < remainingCells; i++) {
      calendarDays.push(
        <div key={`end-empty-${i}`} className="h-24 md:h-32 bg-secondary/20 border-r border-b border-border" />
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous month</span>
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next month</span>
            </Button>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-7 bg-secondary/50">
          {DAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-3 text-center text-sm font-medium text-muted-foreground border-r border-b border-border last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        {classList.map((c) => (
          <div key={c.code} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", c.color)} />
            <span className="text-muted-foreground">{c.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
