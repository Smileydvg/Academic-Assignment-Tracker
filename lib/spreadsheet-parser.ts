import type { AcademicItem, ClassInfo, ItemType } from "./data";

const COLORS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];

const TYPE_MAP: Record<string, ItemType> = {
  assignment: "assignment",
  assignments: "assignment",
  hw: "homework",
  homework: "homework",
  quiz: "quiz",
  quizzes: "quiz",
  exam: "exam",
  exams: "exam",
  final: "exam",
  midterm: "exam",
  project: "project",
  projects: "project",
  lecture: "lecture",
  lectures: "lecture",
  reading: "lecture",
};

function normalizeType(value: string): ItemType {
  const key = value.toLowerCase().trim();
  return TYPE_MAP[key] ?? "assignment";
}

function parseDate(value: string): string | null {
  if (!value?.trim()) return null;
  const str = value.trim();
  const currentYear = new Date().getFullYear();

  // ISO: 2026-02-15
  const iso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;

  // US: 2/15/2026, 02/15/26
  const us = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (us) {
    let [, m, d, y] = us;
    let year = parseInt(y, 10);
    if (year < 100) year += 2000;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // US short: 2/15
  const usShort = str.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (usShort) {
    return `${currentYear}-${usShort[1].padStart(2, "0")}-${usShort[2].padStart(2, "0")}`;
  }

  // Month names: Feb 15, February 15, 2026
  const months: Record<string, number> = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
    may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
    oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
  };
  const monthMatch = str.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?\b/i);
  if (monthMatch) {
    const m = months[monthMatch[1].toLowerCase().slice(0, 3)];
    const d = monthMatch[2].padStart(2, "0");
    const y = monthMatch[3] || String(currentYear);
    return `${y}-${String(m).padStart(2, "0")}-${d}`;
  }

  return null;
}

function detectDelimiter(firstLine: string): string {
  return firstLine.includes("\t") ? "\t" : ",";
}

export interface ParseResult {
  items: AcademicItem[];
  classes: ClassInfo[];
}

export function parseSpreadsheet(text: string): ParseResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return { items: [], classes: [] };

  const delimiter = detectDelimiter(lines[0]);
  const headers = lines[0].split(delimiter).map((h) => h.toLowerCase().trim());

  const col = (names: string[]): number => {
    for (const name of names) {
      const i = headers.findIndex((h) => h.includes(name) || name.includes(h));
      if (i >= 0) return i;
    }
    return -1;
  };

  const classCol = col(["class", "course", "subject"]) >= 0 ? col(["class", "course", "subject"]) : 0;
  const titleCol = col(["title", "name", "assignment"]) >= 0 ? col(["title", "name", "assignment"]) : 1;
  const typeCol = col(["type", "category"]);
  const dateCol = col(["due date", "due", "date"]) >= 0 ? col(["due date", "due", "date"]) : 2;
  const timeCol = col(["time"]);

  const classMap = new Map<string, ClassInfo>();
  const items: AcademicItem[] = [];
  let colorIndex = 0;

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map((c) => c.trim());
    const classRaw = cells[classCol] ?? "";
    const titleRaw = cells[titleCol] ?? "";
    const dateRaw = cells[dateCol] ?? "";

    if (!titleRaw && !classRaw) continue;

    // Parse class: "MATH101" or "MATH101 - Calculus"
    let classCode = classRaw;
    let className = classRaw;
    const dash = classRaw.indexOf(" - ");
    if (dash > 0) {
      classCode = classRaw.slice(0, dash).trim();
      className = classRaw.slice(dash + 3).trim() || classCode;
    } else {
      classCode = classRaw.replace(/\s+/g, "").toUpperCase() || `CLASS-${i}`;
      className = classRaw || classCode;
    }

    if (!classMap.has(classCode)) {
      classMap.set(classCode, {
        code: classCode,
        name: className,
        color: COLORS[colorIndex % COLORS.length],
        hasLatePenalty: false,
      });
      colorIndex++;
    }

    const dueDate = parseDate(dateRaw) ?? new Date().toISOString().slice(0, 10);
    const type = typeCol >= 0 && cells[typeCol] ? normalizeType(cells[typeCol]) : "assignment";
    const time = timeCol >= 0 && cells[timeCol] ? cells[timeCol] : undefined;

    items.push({
      id: `imported-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 9)}`,
      title: titleRaw || `${type} ${i}`,
      class: className,
      classCode,
      type,
      status: "not-started",
      dueDate,
      time: time || undefined,
    });
  }

  const classes = Array.from(classMap.values());
  return { items, classes };
}
