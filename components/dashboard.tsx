"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, CalendarDays, List, BarChart3 } from "lucide-react";

const STORAGE_KEY = "academic-dashboard-items";
const SEMESTERS_STORAGE_KEY = "academic-dashboard-semesters";
const CURRENT_SEMESTER_KEY = "academic-dashboard-current-semester";

function loadItemsFromStorage(): AcademicItem[] {
  if (typeof window === "undefined") return initialItems;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsedItems = JSON.parse(stored) as AcademicItem[];
      // Merge with initial items to catch any new items added
      const storedIds = new Set(parsedItems.map((i) => i.id));
      const newItems = initialItems.filter((i) => !storedIds.has(i.id));
      return [...parsedItems, ...newItems];
    }
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
  }
  return initialItems;
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
  if (typeof window === "undefined") return "spring-2026";

  try {
    const stored = localStorage.getItem(CURRENT_SEMESTER_KEY);
    if (stored) {
      return stored;
    }
  } catch (error) {
    console.error("Failed to load current semester from localStorage:", error);
  }
  return "spring-2026";
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
  const [items, setItems] = useState<AcademicItem[]>(initialItems);
  const [semesters, setSemesters] = useState<Semester[]>(initialSemesters);
  const [currentSemesterId, setCurrentSemesterId] = useState("spring-2026");
  const [view, setView] = useState<"list" | "calendar" | "grades">("list");
  const [isLoaded, setIsLoaded] = useState(false);

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
            <div className="flex items-center gap-3">
              <AddAssignment
                onAddItem={handleAddItem}
                onAddItems={handleAddItems}
                classes={currentClasses}
              />
              <Tabs
                value={view}
                onValueChange={(v) => setView(v as "list" | "calendar" | "grades")}
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

      <main className="container mx-auto px-4 py-6 space-y-6">
        <StatsCards items={currentItems} />

        <div className="rounded-xl border border-border bg-card p-4 md:p-6">
          {view === "list" ? (
            <ItemTable
              items={currentItems}
              onStatusChange={handleStatusChange}
              onGradeChange={handleGradeChange}
              classes={currentClasses}
            />
          ) : view === "calendar" ? (
            <CalendarView
              items={currentItems}
              onStatusChange={handleStatusChange}
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
    </div>
  );
}
