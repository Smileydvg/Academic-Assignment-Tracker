"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import type { AcademicItem, ItemStatus, ClassInfo } from "@/lib/data";
import { defaultClasses } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Circle, CheckCircle2, Clock, GripVertical, Trash2 } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

interface CalendarViewProps {
  items: AcademicItem[];
  onStatusChange: (id: string, status: ItemStatus) => void;
  onItemUpdate?: (id: string, updates: Partial<Pick<AcademicItem, "title" | "dueDate" | "time" | "description">>) => void;
  onDeleteItem?: (id: string) => void;
  classes?: ClassInfo[];
}

type CalendarViewMode = "day" | "week" | "month";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getItemsForDate(items: AcademicItem[], year: number, month: number, day: number): AcademicItem[] {
  return items.filter((item) => {
    const id = new Date(item.dueDate);
    return id.getFullYear() === year && id.getMonth() === month && id.getDate() === day;
  });
}

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

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function CalendarView({ items, onStatusChange, onItemUpdate, onDeleteItem, classes: classesProp }: CalendarViewProps) {
  const classList = classesProp || defaultClasses;
  const onItemUpdateRef = useRef(onItemUpdate);
  onItemUpdateRef.current = onItemUpdate;

  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  const monthFocusedDate = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  const { daysInMonth, startDay, monthItems } = useMemo(() => {
    const year = monthFocusedDate.getFullYear();
    const month = monthFocusedDate.getMonth();
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
  }, [monthFocusedDate, items]);

  const navigatePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate()));
    } else if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const navigateNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate()));
    } else if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  const isToday = (day: number, year?: number, month?: number) => {
    const now = new Date();
    const y = year ?? currentDate.getFullYear();
    const m = month ?? currentDate.getMonth();
    return (
      m === now.getMonth() &&
      y === now.getFullYear() &&
      day === now.getDate()
    );
  };

  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination, reason } = result;
    if (reason !== "DROP") return;
    if (!destination || source.droppableId === destination.droppableId) return;
    const newDueDate = destination.droppableId;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDueDate)) return;
    const update = onItemUpdateRef.current;
    if (update) {
      update(result.draggableId, { dueDate: newDueDate });
    }
  }, []);

  const isDragEnabled = !!onItemUpdate;
  const year = viewMode === "month" ? monthFocusedDate.getFullYear() : currentDate.getFullYear();
  const month = viewMode === "month" ? monthFocusedDate.getMonth() : currentDate.getMonth();

  const weekStartDate = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekDays = useMemo(() => {
    const days: { date: Date; day: number; year: number; month: number; items: AcademicItem[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStartDate);
      d.setDate(d.getDate() + i);
      days.push({
        date: d,
        day: d.getDate(),
        year: d.getFullYear(),
        month: d.getMonth(),
        items: getItemsForDate(items, d.getFullYear(), d.getMonth(), d.getDate()),
      });
    }
    return days;
  }, [weekStartDate, items]);

  const dayViewItems = useMemo(
    () => getItemsForDate(items, currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
    [items, currentDate]
  );

  const calendarDays = [];
  
  // Empty cells for days before the first of the month (month view only)
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(
      <div key={`empty-${i}`} className="h-24 md:h-32 bg-secondary/20 border-r border-b border-border" />
    );
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayItems = monthItems.get(day) || [];
    const hasItems = dayItems.length > 0;
    const droppableId = formatDateKey(year, month, day);

    const dayCellContent = (
      <>
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
              isToday(day, year, month) && "bg-primary text-primary-foreground"
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
        <div className="space-y-1 overflow-hidden min-h-[20px]">
          {dayItems.slice(0, 2).map((item, index) =>
            isDragEnabled ? (
              <Draggable key={item.id} draggableId={item.id} index={index} disableInteractiveElementBlocking>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={cn(
                      "flex items-center gap-0.5 touch-manipulation group",
                      snapshot.isDragging && "opacity-90 shadow-lg z-50"
                    )}
                  >
                    <div
                      {...provided.dragHandleProps}
                      className="shrink-0 cursor-grab active:cursor-grabbing p-1 -ml-0.5 rounded bg-black/25 hover:bg-black/40 min-w-[24px] min-h-[24px] flex items-center justify-center touch-manipulation"
                      aria-label="Drag to change date"
                    >
                      <GripVertical className="h-4 w-4 text-white" />
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "flex-1 min-w-0 text-left text-xs px-1 py-0.5 rounded truncate transition-opacity",
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
                  <div className="flex gap-2 pt-2 border-t border-border flex-wrap">
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
                    {onDeleteItem && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm(`Delete "${item.title}"?`)) onDeleteItem(item.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
                  </div>
                )}
              </Draggable>
            ) : (
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
                    <div className="flex gap-2 pt-2 border-t border-border flex-wrap">
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
                      {onDeleteItem && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm(`Delete "${item.title}"?`)) onDeleteItem(item.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )
          )}
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
      </>
    );

    const dayCell = isDragEnabled ? (
      <Droppable key={day} droppableId={droppableId} direction="vertical">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "h-24 md:h-32 border-r border-b border-border p-1 md:p-2 transition-colors",
              hasItems ? "bg-card" : "bg-secondary/10",
              isToday(day, year, month) && "ring-2 ring-primary ring-inset",
              snapshot.isDraggingOver && "bg-primary/10 ring-2 ring-primary/50 ring-inset"
            )}
          >
            {dayCellContent}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    ) : (
      <div
        key={day}
        className={cn(
          "h-24 md:h-32 border-r border-b border-border p-1 md:p-2 transition-colors",
          hasItems ? "bg-card" : "bg-secondary/10",
          isToday(day, year, month) && "ring-2 ring-primary ring-inset"
        )}
      >
        {dayCellContent}
      </div>
    );

    calendarDays.push(dayCell);
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

  const headerTitle =
    viewMode === "month"
      ? `${MONTHS[monthFocusedDate.getMonth()]} ${monthFocusedDate.getFullYear()}`
      : viewMode === "week"
        ? (() => {
            const weekStart = getWeekStart(currentDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
          })()
        : `${DAYS[currentDate.getDay()]}, ${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-xl font-semibold">
            {headerTitle}
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={navigatePrev}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous</span>
              </Button>
              <Button variant="outline" size="icon" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next</span>
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
        </div>
        <div className="w-full sm:w-auto min-w-0">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as CalendarViewMode)}
            variant="outline"
            size="sm"
            className="flex w-full md:w-fit min-h-[44px]"
          >
            <ToggleGroupItem value="day" aria-label="Day view" className="flex-1 md:flex-initial min-w-0 min-h-[44px]">
              Day
            </ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label="Week view" className="flex-1 md:flex-initial min-w-0 min-h-[44px]">
              Week
            </ToggleGroupItem>
            <ToggleGroupItem value="month" aria-label="Month view" className="flex-1 md:flex-initial min-w-0 min-h-[44px]">
              Month
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        {viewMode === "day" ? (
          <div className="p-4 md:p-6 bg-card">
            {dayViewItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assignments due this day</p>
            ) : (
              <div className="space-y-3">
                {dayViewItems.map((item) => (
                  <Popover key={item.id}>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "w-full text-left p-3 rounded-lg border border-border transition-opacity",
                          item.status === "completed" ? "opacity-50 line-through" : "",
                          getClassColor(item.classCode, classList),
                          "text-background font-medium"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{item.title}</span>
                          <Badge variant="secondary" className="capitalize shrink-0">
                            {item.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm opacity-90">
                          <span className="font-mono">{item.classCode}</span>
                          {item.time && <span>• {item.time}</span>}
                        </div>
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
                        <div className="flex gap-2 pt-2 border-t border-border flex-wrap">
                          <Button
                            size="sm"
                            variant={item.status === "not-started" ? "default" : "outline"}
                            className="gap-1"
                            onClick={() => onStatusChange(item.id, "not-started")}
                          >
                            <Circle className="h-3 w-3" />
                            Not Started
                          </Button>
                          <Button
                            size="sm"
                            variant={item.status === "in-progress" ? "default" : "outline"}
                            className="gap-1"
                            onClick={() => onStatusChange(item.id, "in-progress")}
                          >
                            <Clock className="h-3 w-3" />
                            In Progress
                          </Button>
                          <Button
                            size="sm"
                            variant={item.status === "completed" ? "default" : "outline"}
                            className="gap-1"
                            onClick={() => onStatusChange(item.id, "completed")}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Done
                          </Button>
                          {onDeleteItem && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm(`Delete "${item.title}"?`)) onDeleteItem(item.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {isDragEnabled && viewMode === "month" && (
              <p className="text-sm text-muted-foreground mb-2 px-4 pt-2">Drag assignments by the ⋮⋮ grip to move them between days</p>
            )}
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
            {viewMode === "month" ? (
              isDragEnabled ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <div className="grid grid-cols-7">
                    {calendarDays}
                  </div>
                </DragDropContext>
              ) : (
                <div className="grid grid-cols-7">
                  {calendarDays}
                </div>
              )
            ) : (
              isDragEnabled ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <div className="grid grid-cols-7">
                    {weekDays.map(({ day, year: y, month: m, items: dayItems }) => {
                      const droppableId = formatDateKey(y, m, day);
                      const hasItems = dayItems.length > 0;
                      const dayCellContent = (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={cn(
                                "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                                isToday(day, y, m) && "bg-primary text-primary-foreground"
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
                          <div className="space-y-1 overflow-hidden min-h-[20px]">
                            {dayItems.slice(0, 4).map((item, index) =>
                              isDragEnabled ? (
                                <Draggable key={item.id} draggableId={item.id} index={index} disableInteractiveElementBlocking>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={cn(
                                        "flex items-center gap-0.5 touch-manipulation group",
                                        snapshot.isDragging && "opacity-90 shadow-lg z-50"
                                      )}
                                    >
                                      <div
                                        {...provided.dragHandleProps}
                                        className="shrink-0 cursor-grab active:cursor-grabbing p-1 -ml-0.5 rounded bg-black/25 hover:bg-black/40 min-w-[24px] min-h-[24px] flex items-center justify-center touch-manipulation"
                                        aria-label="Drag to change date"
                                      >
                                        <GripVertical className="h-4 w-4 text-white" />
                                      </div>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <button
                                            className={cn(
                                              "flex-1 min-w-0 text-left text-xs px-1 py-0.5 rounded truncate transition-opacity",
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
                                            <div className="flex gap-2 pt-2 border-t border-border flex-wrap">
                                              <Button
                                                size="sm"
                                                variant={item.status === "not-started" ? "default" : "outline"}
                                                className="gap-1"
                                                onClick={() => onStatusChange(item.id, "not-started")}
                                              >
                                                <Circle className="h-3 w-3" />
                                                Not Started
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant={item.status === "in-progress" ? "default" : "outline"}
                                                className="gap-1"
                                                onClick={() => onStatusChange(item.id, "in-progress")}
                                              >
                                                <Clock className="h-3 w-3" />
                                                In Progress
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant={item.status === "completed" ? "default" : "outline"}
                                                className="gap-1"
                                                onClick={() => onStatusChange(item.id, "completed")}
                                              >
                                                <CheckCircle2 className="h-3 w-3" />
                                                Done
                                              </Button>
                                              {onDeleteItem && (
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                  onClick={() => {
                                                    if (confirm(`Delete "${item.title}"?`)) onDeleteItem(item.id);
                                                  }}
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                  Delete
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                  )}
                                </Draggable>
                              ) : (
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
                                      <div className="flex gap-2 pt-2 border-t border-border flex-wrap">
                                        <Button
                                          size="sm"
                                          variant={item.status === "not-started" ? "default" : "outline"}
                                          className="gap-1"
                                          onClick={() => onStatusChange(item.id, "not-started")}
                                        >
                                          <Circle className="h-3 w-3" />
                                          Not Started
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant={item.status === "in-progress" ? "default" : "outline"}
                                          className="gap-1"
                                          onClick={() => onStatusChange(item.id, "in-progress")}
                                        >
                                          <Clock className="h-3 w-3" />
                                          In Progress
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant={item.status === "completed" ? "default" : "outline"}
                                          className="gap-1"
                                          onClick={() => onStatusChange(item.id, "completed")}
                                        >
                                          <CheckCircle2 className="h-3 w-3" />
                                          Done
                                        </Button>
                                        {onDeleteItem && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                              if (confirm(`Delete "${item.title}"?`)) onDeleteItem(item.id);
                                            }}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                            Delete
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )
                            )}
                            {dayItems.length > 4 && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="w-full text-xs text-muted-foreground hover:text-foreground text-left">
                                    +{dayItems.length - 4} more
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-72" align="start">
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">All items for {MONTHS[m]} {day}</h4>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                      {dayItems.map((i) => (
                                        <div
                                          key={i.id}
                                          className={cn(
                                            "p-2 rounded border border-border",
                                            i.status === "completed" && "opacity-50"
                                          )}
                                        >
                                          <div className="flex items-center gap-2 mb-1">
                                            <div className={cn("w-2 h-2 rounded-full", getClassColor(i.classCode, classList))} />
                                            <span className="text-xs font-mono text-muted-foreground">{i.classCode}</span>
                                            <Badge variant="secondary" className="ml-auto text-xs capitalize">
                                              {i.type}
                                            </Badge>
                                          </div>
                                          <p className={cn("font-medium text-sm", i.status === "completed" && "line-through")}>
                                            {i.title}
                                          </p>
                                          {i.time && (
                                            <p className="text-xs text-muted-foreground">Due at {i.time}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </>
                      );
                      return (
                        <Droppable key={droppableId} droppableId={droppableId} direction="vertical">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={cn(
                                "h-32 md:h-48 border-r border-b border-border p-1 md:p-2 transition-colors",
                                hasItems ? "bg-card" : "bg-secondary/10",
                                isToday(day, y, m) && "ring-2 ring-primary ring-inset",
                                snapshot.isDraggingOver && "bg-primary/10 ring-2 ring-primary/50 ring-inset"
                              )}
                            >
                              {dayCellContent}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      );
                    })}
                  </div>
                </DragDropContext>
              ) : (
                <div className="grid grid-cols-7">
                  {weekDays.map(({ day, year: y, month: m, items: dayItems }) => {
                    const hasItems = dayItems.length > 0;
                    const dayCellContent = (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={cn(
                              "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                              isToday(day, y, m) && "bg-primary text-primary-foreground"
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
                        <div className="space-y-1 overflow-hidden min-h-[20px]">
                          {dayItems.slice(0, 4).map((item) => (
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
                                  <div className="flex gap-2 pt-2 border-t border-border flex-wrap">
                                    <Button
                                      size="sm"
                                      variant={item.status === "not-started" ? "default" : "outline"}
                                      className="gap-1"
                                      onClick={() => onStatusChange(item.id, "not-started")}
                                    >
                                      <Circle className="h-3 w-3" />
                                      Not Started
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={item.status === "in-progress" ? "default" : "outline"}
                                      className="gap-1"
                                      onClick={() => onStatusChange(item.id, "in-progress")}
                                    >
                                      <Clock className="h-3 w-3" />
                                      In Progress
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={item.status === "completed" ? "default" : "outline"}
                                      className="gap-1"
                                      onClick={() => onStatusChange(item.id, "completed")}
                                    >
                                      <CheckCircle2 className="h-3 w-3" />
                                      Done
                                    </Button>
                                    {onDeleteItem && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                          if (confirm(`Delete "${item.title}"?`)) onDeleteItem(item.id);
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                        Delete
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          ))}
                          {dayItems.length > 4 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="w-full text-xs text-muted-foreground hover:text-foreground text-left">
                                  +{dayItems.length - 4} more
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72" align="start">
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-sm">All items for {MONTHS[m]} {day}</h4>
                                  <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {dayItems.map((i) => (
                                      <div
                                        key={i.id}
                                        className={cn(
                                          "p-2 rounded border border-border",
                                          i.status === "completed" && "opacity-50"
                                        )}
                                      >
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className={cn("w-2 h-2 rounded-full", getClassColor(i.classCode, classList))} />
                                          <span className="text-xs font-mono text-muted-foreground">{i.classCode}</span>
                                          <Badge variant="secondary" className="ml-auto text-xs capitalize">
                                            {i.type}
                                          </Badge>
                                        </div>
                                        <p className={cn("font-medium text-sm", i.status === "completed" && "line-through")}>
                                          {i.title}
                                        </p>
                                        {i.time && (
                                          <p className="text-xs text-muted-foreground">Due at {i.time}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </>
                    );
                    return (
                      <div
                        key={formatDateKey(y, m, day)}
                        className={cn(
                          "h-32 md:h-48 border-r border-b border-border p-1 md:p-2 transition-colors",
                          hasItems ? "bg-card" : "bg-secondary/10",
                          isToday(day, y, m) && "ring-2 ring-primary ring-inset"
                        )}
                      >
                        {dayCellContent}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>
        )}
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
