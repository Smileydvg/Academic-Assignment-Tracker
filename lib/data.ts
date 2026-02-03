export type ItemType =
  | "assignment"
  | "quiz"
  | "exam"
  | "project"
  | "lecture"
  | "homework";
export type ItemStatus = "not-started" | "in-progress" | "completed";

export interface AcademicItem {
  id: string;
  title: string;
  class: string;
  classCode: string;
  type: ItemType;
  status: ItemStatus;
  dueDate: string;
  time?: string;
  description?: string;
  location?: string;
  grade?: number; // Score out of 100
  isLate?: boolean; // Late submission toggle
  daysLate?: number; // Number of days late
  isFinal?: boolean; // Is this a final exam?
  gradeCategory?: "exam" | "final" | "hw" | "quiz" | "project" | "lab" | "participation"; // Grade weight category
  semesterId?: string; // Which semester this item belongs to
}

export interface ClassInfo {
  code: string;
  name: string;
  color: string;
  hasLatePenalty: boolean;
  killSwitch?: string;
}

export interface Semester {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  classes: ClassInfo[];
  gradeWeights: Record<string, Record<string, { weight: number; label: string }>>;
}

export const defaultClasses: ClassInfo[] = [];

export const defaultGradeWeights: Record<
  string,
  Record<string, { weight: number; label: string }>
> = {};

function createEmptySemester(): Semester {
  return {
    id: "my-semester",
    name: "My Semester",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    classes: [],
    gradeWeights: {},
  };
}

export const initialSemesters: Semester[] = [createEmptySemester()];

export const initialItems: AcademicItem[] = [];

// Backwards-compatible aliases
export { defaultClasses as classes };
export { defaultGradeWeights as gradeWeights };

// Helper function to calculate late penalty
export function calculateLatePenalty(
  grade: number,
  daysLate: number,
  classCode: string
): number {
  const classInfo = defaultClasses.find((c) => c.code === classCode);
  if (!classInfo?.hasLatePenalty || daysLate <= 0) return grade;
  // 10% deduction per day late
  const penalty = daysLate * 10;
  return Math.max(0, grade - penalty);
}
