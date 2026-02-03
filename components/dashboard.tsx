"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  initialItems,
  initialSemesters,
  classes as defaultClasses,
  gradeWeights as defaultGradeWeights,
  type AcademicItem,
  type ItemStatus,
  type Semester,
  type ClassInfo,
} from "@/lib/data";
import { ItemTable } from "@/components/item-table";
import { CalendarView } from "@/components/calendar-view";
import { GradeTracker } from "@/components/grade-tracker";
import { StatsCards } from "@/components/stats-cards";
import { AddAssignment } from "@/components/add-assignment";
import { SemesterManager } from "@/components/semester-manager";
import { ImportData, type ImportMode } from "@/components/import-data";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GraduationCap, CalendarDays, List, BarChart3, ClipboardList, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "academic-dashboard-items";
const SEMESTERS_STORAGE_KEY = "academic-dashboard-semesters";
const CURRENT_SEMESTER_KEY = "academic-dashboard-current-semester";

function loadItemsFromStorage(): AcademicItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as AcademicItem[];
    }
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
  }
  return [];
}

function loadSemestersFromStorage(): Semester[] {
  if (typeof window === "undefined") return initialSemesters;

  try {
    const stored = localStorage.getItem(SEMESTERS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Semester[];
    }
  } catch (error) {
    console.error("Failed to load semesters from localStorage:", error);
  }
  return initialSemesters;
}

function loadCurrentSemesterFromStorage(): string {
  if (typeof window === "undefined") return "my-semester";

  try {
    const stored = localStorage.getItem(CURRENT_SEMESTER_KEY);
    if (stored) {
      return stored;
    }
  } catch (error) {
    console.error("Failed to load current semester from localStorage:", error);
  }
  return "my-semester";
}

function saveItemsToStorage(items: AcademicItem[]) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
}

function saveSemestersToStorage(semesters: Semester[]) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(SEMESTERS_STORAGE_KEY, JSON.stringify(semesters));
  } catch (error) {
    console.error("Failed to save semesters to localStorage:", error);
  }
}

function saveCurrentSemesterToStorage(semesterId: string) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CURRENT_SEMESTER_KEY, semesterId);
  } catch (error) {
    console.error("Failed to save current semester to localStorage:", error);
  }
}

export function Dashboard() {
  const [items, setItems] = useState<AcademicItem[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>(initialSemesters);
  const [currentSemesterId, setCurrentSemesterId] = useState("my-semester");
  const [view, setView] = useState<"list" | "calendar" | "grades">("list");
  const [isLoaded, setIsLoaded] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loadedItems = loadItemsFromStorage();
    const loadedSemesters = loadSemestersFromStorage();
    const loadedCurrentSemester = loadCurrentSemesterFromStorage();
    setItems(loadedItems);
    setSemesters(loadedSemesters);
    setCurrentSemesterId(loadedCurrentSemester);
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      saveItemsToStorage(items);
    }
  }, [items, isLoaded]);

  // Save semesters to localStorage
  useEffect(() => {
    if (isLoaded) {
      saveSemestersToStorage(semesters);
    }
  }, [semesters, isLoaded]);

  // Save current semester to localStorage
  useEffect(() => {
    if (isLoaded) {
      saveCurrentSemesterToStorage(currentSemesterId);
    }
  }, [currentSemesterId, isLoaded]);

  // Get current semester data
  const currentSemester = useMemo(
    () => semesters.find((s) => s.id === currentSemesterId),
    [semesters, currentSemesterId]
  );

  // Get classes for current semester
  const currentClasses = useMemo(
    () => currentSemester?.classes || defaultClasses,
    [currentSemester]
  );

  // Get grade weights for current semester
  const currentGradeWeights = useMemo(
    () => currentSemester?.gradeWeights || defaultGradeWeights,
    [currentSemester]
  );

  // Filter items for current semester
  const currentItems = useMemo(() => {
    // For items without semesterId, show them if they match a class in the current semester
    const currentClassCodes = new Set(currentClasses.map((c) => c.code));
    return items.filter((item) => {
      if (item.semesterId) {
        return item.semesterId === currentSemesterId;
      }
      // Legacy items: show if class code matches current semester
      return currentClassCodes.has(item.classCode);
    });
  }, [items, currentSemesterId, currentClasses]);

  const handleStatusChange = (id: string, status: ItemStatus) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const handleGradeChange = (
    id: string,
    grade: number | undefined,
    isLate?: boolean,
    daysLate?: number
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              grade,
              isLate: isLate || false,
              daysLate: daysLate || 0,
              status: grade !== undefined ? "completed" : item.status,
            }
          : item
      )
    );
  };

  const handleAddItem = (item: AcademicItem) => {
    setItems((prev) => [...prev, { ...item, semesterId: currentSemesterId }]);
  };

  const handleUpdateItem = useCallback(
    (
      id: string,
      updates: Partial<Pick<AcademicItem, "title" | "dueDate" | "time" | "description">>
    ) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    },
    []
  );

  const handleAddItems = (newItems: AcademicItem[]) => {
    setItems((prev) => [
      ...prev,
      ...newItems.map((item) => ({ ...item, semesterId: currentSemesterId })),
    ]);
  };

  // Semester management handlers
  const handleSemesterChange = (semesterId: string) => {
    setCurrentSemesterId(semesterId);
  };

  const handleAddSemester = (semester: Semester) => {
    setSemesters((prev) => [...prev, semester]);
  };

  const handleDeleteSemester = (semesterId: string) => {
    setSemesters((prev) => prev.filter((s) => s.id !== semesterId));
    // Also delete items for this semester
    setItems((prev) => prev.filter((i) => i.semesterId !== semesterId));
    // Switch to another semester
    const remaining = semesters.filter((s) => s.id !== semesterId);
    if (remaining.length > 0) {
      setCurrentSemesterId(remaining[0].id);
    }
  };

  const handleAddClass = (semesterId: string, classInfo: ClassInfo) => {
    setSemesters((prev) =>
      prev.map((s) =>
        s.id === semesterId
          ? {
              ...s,
              classes: [...s.classes, classInfo],
              gradeWeights: {
                ...s.gradeWeights,
                [classInfo.code]: {
                  exam: { weight: 0.4, label: "Exams" },
                  final: { weight: 0.25, label: "Final Exam" },
                  hw: { weight: 0.15, label: "Homework" },
                  quiz: { weight: 0.1, label: "Quizzes" },
                  project: { weight: 0.1, label: "Projects" },
                },
              },
            }
          : s
      )
    );
  };

  const handleDeleteClass = (semesterId: string, classCode: string) => {
    setSemesters((prev) =>
      prev.map((s) =>
        s.id === semesterId
          ? {
              ...s,
              classes: s.classes.filter((c) => c.code !== classCode),
            }
          : s
      )
    );
    // Also delete items for this class in this semester
    setItems((prev) =>
      prev.filter(
        (i) => !(i.semesterId === semesterId && i.classCode === classCode)
      )
    );
  };

  const handleUpdateClass = (
    semesterId: string,
    classCode: string,
    updates: Partial<ClassInfo>
  ) => {
    setSemesters((prev) =>
      prev.map((s) =>
        s.id === semesterId
          ? {
              ...s,
              classes: s.classes.map((c) =>
                c.code === classCode ? { ...c, ...updates } : c
              ),
            }
          : s
      )
    );
  };

  const handleImportData = (
    newItems: AcademicItem[],
    newClasses: ClassInfo[],
    newSemester: Semester,
    mode: ImportMode = "replace",
    updatedSemesters?: Semester[]
  ) => {
    setItems(newItems);
    if (mode === "add" && updatedSemesters) {
      setSemesters(updatedSemesters);
    } else {
      setSemesters([newSemester]);
      setCurrentSemesterId(newSemester.id);
    }
  };

  const showImport = items.length === 0 && isLoaded;

  if (showImport) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Academic Dashboard</h1>
                <p className="text-sm text-muted-foreground">Import your schedule to get started</p>
              </div>
            </div>
          </div>
        </header>
        <ImportData onImport={handleImportData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Academic Dashboard</h1>
                <div className="flex items-center gap-2">
                  <SemesterManager
                    semesters={semesters}
                    currentSemesterId={currentSemesterId}
                    onSemesterChange={handleSemesterChange}
                    onAddSemester={handleAddSemester}
                    onDeleteSemester={handleDeleteSemester}
                    onAddClass={handleAddClass}
                    onDeleteClass={handleDeleteClass}
                    onUpdateClass={handleUpdateClass}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sheet open={addSheetOpen} onOpenChange={setAddSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Add from spreadsheet
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Add from spreadsheet</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <ImportData
                      mode="add"
                      existingItems={items}
                      existingClasses={currentClasses}
                      existingSemesters={semesters}
                      currentSemesterId={currentSemesterId}
                      onImport={(mergedItems, _classes, _sem, mode, updatedSems) => {
                        handleImportData(mergedItems, _classes, _sem, mode, updatedSems);
                        setAddSheetOpen(false);
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  if (confirm("Replace all data with a new import? Current assignments will be cleared.")) {
                    setItems([]);
                    setSemesters(initialSemesters);
                    setCurrentSemesterId("my-semester");
                  }
                }}
              >
                <Upload className="h-4 w-4" />
                Replace all
              </Button>
              <div className="hidden md:inline-flex">
                <AddAssignment
                  onAddItem={handleAddItem}
                  onAddItems={handleAddItems}
                  classes={currentClasses}
                />
              </div>
              <Tabs
                value={view}
                onValueChange={(v) => setView(v as "list" | "calendar" | "grades")}
                className="hidden md:block"
              >
                <TabsList className="bg-secondary">
                  <TabsTrigger
                    value="list"
                    className="gap-2 data-[state=active]:bg-background"
                  >
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">List</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="calendar"
                    className="gap-2 data-[state=active]:bg-background"
                  >
                    <CalendarDays className="h-4 w-4" />
                    <span className="hidden sm:inline">Calendar</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="grades"
                    className="gap-2 data-[state=active]:bg-background"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Grades</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6">
        <StatsCards items={currentItems} />

        <div className="rounded-xl border border-border bg-card p-4 md:p-6">
          {view === "list" ? (
            <ItemTable
              items={currentItems}
              onStatusChange={handleStatusChange}
              onGradeChange={handleGradeChange}
              onItemUpdate={handleUpdateItem}
              classes={currentClasses}
            />
          ) : view === "calendar" ? (
            <CalendarView
              items={currentItems}
              onStatusChange={handleStatusChange}
              onItemUpdate={handleUpdateItem}
              classes={currentClasses}
            />
          ) : (
            <GradeTracker
              items={currentItems}
              classes={currentClasses}
              gradeWeights={currentGradeWeights}
            />
          )}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]"
        aria-label="Main navigation"
      >
        <div className="grid grid-cols-3 min-h-16">
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-sm transition-colors",
              view === "list"
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={view === "list" ? "page" : undefined}
            aria-label="Checklist"
          >
            <ClipboardList className="h-5 w-5" />
            <span>Checklist</span>
          </button>
          <button
            type="button"
            onClick={() => setView("grades")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-sm transition-colors",
              view === "grades"
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={view === "grades" ? "page" : undefined}
            aria-label="Grade Calculator"
          >
            <BarChart3 className="h-5 w-5" />
            <span>Grades</span>
          </button>
          <button
            type="button"
            onClick={() => setView("calendar")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-sm transition-colors",
              view === "calendar"
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={view === "calendar" ? "page" : undefined}
            aria-label="Calendar"
          >
            <CalendarDays className="h-5 w-5" />
            <span>Calendar</span>
          </button>
        </div>
      </nav>

      {/* Mobile FAB - positioned above bottom nav */}
      <div className="fixed bottom-20 right-6 z-50 md:hidden">
        <AddAssignment
          onAddItem={handleAddItem}
          onAddItems={handleAddItems}
          classes={currentClasses}
          variant="fab"
        />
      </div>
    </div>
  );
}
