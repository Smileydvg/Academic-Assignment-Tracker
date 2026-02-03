"use client";

import React from "react";

import { useState } from "react";
import type { AcademicItem, ItemStatus, ItemType, ClassInfo } from "@/lib/data";
import { classes as defaultClasses, calculateLatePenalty } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Circle,
  CheckCircle2,
  Clock,
  FileText,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  FolderKanban,
  PenLine,
  Search,
  AlertTriangle,
  Pencil,
  Check,
  X,
} from "lucide-react";

interface ItemTableProps {
  items: AcademicItem[];
  onStatusChange: (id: string, status: ItemStatus) => void;
  onGradeChange: (id: string, grade: number | undefined, isLate?: boolean, daysLate?: number) => void;
  onItemUpdate?: (id: string, updates: Partial<Pick<AcademicItem, "title" | "dueDate" | "time" | "description">>) => void;
  classes?: ClassInfo[];
}

const typeIcons: Record<ItemType, React.ElementType> = {
  assignment: FileText,
  quiz: ClipboardCheck,
  exam: GraduationCap,
  project: FolderKanban,
  lecture: BookOpen,
  homework: PenLine,
};

const statusConfig: Record<
  ItemStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  "not-started": {
    label: "Not Started",
    icon: Circle,
    className: "text-muted-foreground",
  },
  "in-progress": {
    label: "In Progress",
    icon: Clock,
    className: "text-warning",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "text-primary",
  },
};

const classes: ClassInfo[] = defaultClasses;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getDaysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateString);
  dueDate.setHours(0, 0, 0, 0);
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getClassColor(classCode: string, classList: ClassInfo[]): string {
  const classInfo = classList.find((c) => c.code === classCode);
  return classInfo?.color || "bg-muted";
}

function GradeDialog({
  item,
  onGradeChange,
  classList,
}: {
  item: AcademicItem;
  onGradeChange: (id: string, grade: number | undefined, isLate?: boolean, daysLate?: number) => void;
  classList: ClassInfo[];
}) {
  const [grade, setGrade] = useState<string>(item.grade?.toString() || "");
  const [isLate, setIsLate] = useState(item.isLate || false);
  const [daysLate, setDaysLate] = useState<string>(item.daysLate?.toString() || "1");
  const [open, setOpen] = useState(false);

  const classInfo = classList.find((c) => c.code === item.classCode);
  const hasLatePenalty = classInfo?.hasLatePenalty || false;

  const handleSave = () => {
    const gradeNum = grade ? Number.parseFloat(grade) : undefined;
    const daysLateNum = isLate ? Number.parseInt(daysLate) || 1 : 0;
    onGradeChange(item.id, gradeNum, isLate, daysLateNum);
    setOpen(false);
  };

  const effectiveGrade =
    grade && isLate && hasLatePenalty
      ? calculateLatePenalty(Number.parseFloat(grade), Number.parseInt(daysLate) || 1, item.classCode)
      : grade
        ? Number.parseFloat(grade)
        : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto py-1 px-2 gap-1.5">
          {item.grade !== undefined ? (
            <span
              className={cn(
                "font-medium",
                item.isLate && hasLatePenalty && "text-warning"
              )}
            >
              {item.isLate && hasLatePenalty && item.daysLate
                ? `${calculateLatePenalty(item.grade, item.daysLate, item.classCode).toFixed(0)}%`
                : `${item.grade}%`}
              {item.isLate && hasLatePenalty && (
                <span className="text-xs ml-1 text-muted-foreground">
                  (was {item.grade}%)
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">Add grade</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Grade - {item.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="grade">Grade (%)</Label>
            <Input
              id="grade"
              type="number"
              min="0"
              max="100"
              placeholder="Enter grade (0-100)"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>

          {hasLatePenalty && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="late-toggle">Late Submission</Label>
                  <p className="text-xs text-muted-foreground">
                    -10% per day late for {item.classCode}
                  </p>
                </div>
                <Switch
                  id="late-toggle"
                  checked={isLate}
                  onCheckedChange={setIsLate}
                />
              </div>

              {isLate && (
                <div className="space-y-2">
                  <Label htmlFor="days-late">Days Late</Label>
                  <Input
                    id="days-late"
                    type="number"
                    min="1"
                    max="10"
                    value={daysLate}
                    onChange={(e) => setDaysLate(e.target.value)}
                  />
                </div>
              )}

              {isLate && grade && (
                <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <div className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Late Penalty Applied</span>
                  </div>
                  <p className="text-sm mt-1">
                    Original: {grade}% → After penalty:{" "}
                    <span className="font-bold">{effectiveGrade?.toFixed(0)}%</span>
                    <span className="text-muted-foreground ml-1">
                      (-{Number.parseInt(daysLate) * 10}%)
                    </span>
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Grade</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ItemTable({ items, onStatusChange, onGradeChange, onItemUpdate, classes: classesProp }: ItemTableProps) {
  const classList = classesProp || defaultClasses;
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"dueDate" | "class" | "type">("dueDate");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const startEditing = (item: AcademicItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDueDate(item.dueDate);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDueDate("");
  };

  const saveEditing = () => {
    if (editingId && onItemUpdate && editTitle.trim() && editDueDate) {
      onItemUpdate(editingId, {
        title: editTitle.trim(),
        dueDate: editDueDate,
      });
    }
    cancelEditing();
  };

  const filteredItems = items
    .filter((item) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesClass = item.classCode.toLowerCase().includes(query);
        const matchesClassName = item.class.toLowerCase().includes(query);
        const matchesType = item.type.toLowerCase().includes(query);
        if (!matchesTitle && !matchesClass && !matchesClassName && !matchesType) {
          return false;
        }
      }
      if (filterClass !== "all" && item.classCode !== filterClass) return false;
      if (filterType !== "all" && item.type !== filterType) return false;
      if (filterStatus !== "all" && item.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "dueDate") {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === "class") {
        return a.classCode.localeCompare(b.classCode);
      }
      return a.type.localeCompare(b.type);
    });

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by class, type, or title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-secondary"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-[180px] bg-secondary">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classList.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px] bg-secondary">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="assignment">Assignment</SelectItem>
            <SelectItem value="quiz">Quiz</SelectItem>
            <SelectItem value="exam">Exam</SelectItem>
            <SelectItem value="project">Project</SelectItem>
            <SelectItem value="lecture">Lecture</SelectItem>
            <SelectItem value="homework">Homework</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] bg-secondary">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="not-started">Not Started</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as "dueDate" | "class" | "type")}
        >
          <SelectTrigger className="w-[150px] bg-secondary">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dueDate">Due Date</SelectItem>
            <SelectItem value="class">Class</SelectItem>
            <SelectItem value="type">Type</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        {/* Mobile: Card layout */}
        <div className="block md:hidden space-y-3 p-3">
          {filteredItems.map((item) => {
            const daysUntil = getDaysUntil(item.dueDate);
            const TypeIcon = typeIcons[item.type];
            const statusInfo = statusConfig[item.status];
            const StatusIcon = statusInfo.icon;
            const isEditing = editingId === item.id;

            return (
              <Card
                key={item.id}
                className={cn(
                  "overflow-hidden transition-colors hover:bg-secondary/30",
                  item.status === "completed" && "opacity-60"
                )}
              >
                <CardContent className="p-4 gap-3 flex flex-col">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-1 min-h-10 rounded-full shrink-0",
                        getClassColor(item.classCode, classList)
                      )}
                    />
                                <div className="min-w-0 flex-1">
                                  {isEditing ? (
                                    <Input
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      placeholder="Task name"
                                      className="font-medium h-9"
                                      autoFocus
                                    />
                                  ) : (
                                    <>
                                      <p
                                        className={cn(
                                          "font-medium",
                                          item.status === "completed" && "line-through"
                                        )}
                                      >
                                        {item.title}
                                      </p>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                                        <TypeIcon className="h-4 w-4 shrink-0" />
                                        <span className="capitalize">{item.type}</span>
                                      </div>
                                      {item.description && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                          {item.description}
                                        </p>
                                      )}
                                      {onItemUpdate && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 mt-2 -ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
                                          onClick={() => startEditing(item)}
                                          aria-label="Edit assignment"
                                        >
                                          <Pencil className="h-4 w-4" />
                                          Edit
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                  <div className="flex flex-col gap-2 pl-4 border-l-2 border-border/50">
                                <div>
                                  <span className="text-xs text-muted-foreground">Class</span>
                                  <div className="mt-0.5">
                                    <Badge variant="secondary" className="font-mono text-xs">
                                      {item.classCode}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground">Due Date</span>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    {isEditing ? (
                                      <Input
                                        type="date"
                                        value={editDueDate}
                                        onChange={(e) => setEditDueDate(e.target.value)}
                                        className="h-9 max-w-[160px]"
                                      />
                                    ) : (
                                      <>
                                        <span className="text-sm">{formatDate(item.dueDate)}</span>
                                        {item.time && (
                                          <span className="text-sm text-muted-foreground">{item.time}</span>
                                        )}
                                        {item.status !== "completed" && (
                                          <Badge
                                            variant={
                                              daysUntil < 0
                                                ? "destructive"
                                                : daysUntil <= 3
                                                  ? "default"
                                                  : "secondary"
                                            }
                                            className={cn(
                                              "text-xs",
                                              daysUntil <= 3 &&
                                                daysUntil >= 0 &&
                                                "bg-warning text-warning-foreground"
                                            )}
                                          >
                                            {daysUntil < 0
                                              ? "Overdue"
                                              : daysUntil === 0
                                                ? "Today"
                                                : daysUntil === 1
                                                  ? "Tomorrow"
                                                  : `${daysUntil}d`}
                                          </Badge>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                                {isEditing ? (
                                  <div className="flex gap-2 pt-1">
                                    <Button
                                      size="sm"
                                      className="gap-1.5"
                                      onClick={saveEditing}
                                      disabled={!editTitle.trim() || !editDueDate}
                                    >
                                      <Check className="h-4 w-4" />
                                      Save
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1.5"
                                      onClick={cancelEditing}
                                    >
                                      <X className="h-4 w-4" />
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <div>
                                      <span className="text-xs text-muted-foreground">Status</span>
                                      <div className="mt-0.5">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className={cn(
                                                "h-auto py-1 px-2 gap-1.5 -ml-2",
                                                statusInfo.className
                                              )}
                                            >
                                              <StatusIcon className="h-4 w-4" />
                                              <span className="text-sm">{statusInfo.label}</span>
                                              <ChevronDown className="h-3 w-3 opacity-50" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="start">
                                            {(
                                              Object.entries(statusConfig) as [
                                                ItemStatus,
                                                (typeof statusConfig)[ItemStatus],
                                              ][]
                                            ).map(([status, config]) => {
                                              const Icon = config.icon;
                                              return (
                                                <DropdownMenuItem
                                                  key={status}
                                                  onClick={() => onStatusChange(item.id, status)}
                                                  className={cn("gap-2", config.className)}
                                                >
                                                  <Icon className="h-4 w-4" />
                                                  {config.label}
                                                </DropdownMenuItem>
                                              );
                                            })}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                    {item.gradeCategory && (
                                      <div>
                                        <span className="text-xs text-muted-foreground">Grade</span>
                                        <div className="mt-0.5">
                                          <GradeDialog
                                            item={item}
                                            onGradeChange={onGradeChange}
                                            classList={classList}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </CardContent>
                          </Card>
            );
          })}
        </div>

        {/* Desktop: Table layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50 text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
                {onItemUpdate && <th className="px-4 py-3 font-medium w-[100px]">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item) => {
                const daysUntil = getDaysUntil(item.dueDate);
                const TypeIcon = typeIcons[item.type];
                const statusInfo = statusConfig[item.status];
                const StatusIcon = statusInfo.icon;
                const isEditingRow = editingId === item.id;

                return (
                  <tr
                    key={item.id}
                    className={cn(
                      "transition-colors hover:bg-secondary/30",
                      item.status === "completed" && "opacity-60"
                    )}
                  >
                    <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={cn(
                                        "w-1 h-8 rounded-full",
                                        getClassColor(item.classCode, classList)
                                      )}
                                    />
                        <div>
                          {isEditingRow ? (
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="Task name"
                              className="font-medium h-9 max-w-[200px]"
                              autoFocus
                            />
                          ) : (
                            <>
                              <p
                                className={cn(
                                  "font-medium",
                                  item.status === "completed" && "line-through"
                                )}
                              >
                                {item.title}
                              </p>
                              {item.description && (
                                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                  {item.description}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {item.classCode}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{item.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-auto py-1 px-2 gap-1.5",
                              statusInfo.className
                            )}
                          >
                            <StatusIcon className="h-4 w-4" />
                            <span className="text-sm">{statusInfo.label}</span>
                            <ChevronDown className="h-3 w-3 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {(
                            Object.entries(statusConfig) as [
                              ItemStatus,
                              (typeof statusConfig)[ItemStatus],
                            ][]
                          ).map(([status, config]) => {
                            const Icon = config.icon;
                            return (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => onStatusChange(item.id, status)}
                                className={cn("gap-2", config.className)}
                              >
                                <Icon className="h-4 w-4" />
                                {config.label}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    <td className="px-4 py-3">
                      {item.gradeCategory ? (
                        <GradeDialog item={item} onGradeChange={onGradeChange} classList={classList} />
                      ) : (
                        <span className="text-muted-foreground text-sm">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditingRow ? (
                        <Input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="h-9 w-[140px]"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{formatDate(item.dueDate)}</span>
                          {item.status !== "completed" && (
                            <Badge
                              variant={
                                daysUntil < 0
                                  ? "destructive"
                                  : daysUntil <= 3
                                    ? "default"
                                    : "secondary"
                              }
                              className={cn(
                                "text-xs",
                                daysUntil <= 3 &&
                                  daysUntil >= 0 &&
                                  "bg-warning text-warning-foreground"
                              )}
                            >
                              {daysUntil < 0
                                ? "Overdue"
                                : daysUntil === 0
                                  ? "Today"
                                  : daysUntil === 1
                                    ? "Tomorrow"
                                    : `${daysUntil}d`}
                            </Badge>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {item.time || "-"}
                    </td>
                    {onItemUpdate && (
                      <td className="px-4 py-3">
                        {isEditingRow ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="h-8 gap-1"
                              onClick={saveEditing}
                              disabled={!editTitle.trim() || !editDueDate}
                            >
                              <Check className="h-4 w-4" />
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1"
                              onClick={cancelEditing}
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-muted-foreground hover:text-foreground"
                            onClick={() => startEditing(item)}
                            aria-label="Edit assignment"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No items match your filters
          </div>
        )}
      </div>
    </div>
  );
}
