"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { parseSpreadsheet } from "@/lib/spreadsheet-parser";
import type { AcademicItem, ClassInfo, Semester } from "@/lib/data";
import { Upload, FileSpreadsheet, ChevronRight, AlertCircle } from "lucide-react";

export type ImportMode = "replace" | "add";

interface ImportDataProps {
  onImport: (
    items: AcademicItem[],
    classes: ClassInfo[],
    semester: Semester,
    mode: ImportMode,
    updatedSemesters?: Semester[]
  ) => void;
  mode?: ImportMode;
  existingItems?: AcademicItem[];
  existingClasses?: ClassInfo[];
  existingSemesters?: Semester[];
  currentSemesterId?: string;
}

const EXAMPLE = `Class	Title	Type	Due Date	Time
MATH101	Homework 1	homework	2/15/2026	11:59 PM
MATH101	Quiz 1	quiz	2/20/2026	In Class
CS200	Project Proposal	project	3/1/2026
ENG101	Essay Draft	assignment	2/25/2026	11:59 PM`;

export function ImportData({
  onImport,
  mode = "replace",
  existingItems = [],
  existingClasses = [],
  existingSemesters = [],
  currentSemesterId = "my-semester",
}: ImportDataProps) {
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const isAddMode = mode === "add";

  const handleImport = () => {
    setError("");
    if (!pasteText.trim()) {
      setError("Please paste your spreadsheet data first.");
      return;
    }

    setIsParsing(true);
    try {
      const { items, classes } = parseSpreadsheet(pasteText);
      if (items.length === 0) {
        setError("No valid rows found. Make sure your data has a header row and at least one row of assignments. Use Tab or comma to separate columns.");
        setIsParsing(false);
        return;
      }

      const semester: Semester = {
        id: `semester-${Date.now()}`,
        name: "My Semester",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        classes,
        gradeWeights: Object.fromEntries(
          classes.map((c) => [
            c.code,
            {
              exam: { weight: 0.4, label: "Exams" },
              final: { weight: 0.25, label: "Final Exam" },
              hw: { weight: 0.15, label: "Homework" },
              quiz: { weight: 0.1, label: "Quizzes" },
              project: { weight: 0.1, label: "Projects" },
            },
          ])
        ),
      };

      const itemsWithSemester = items.map((item) => ({
        ...item,
        semesterId: semester.id,
      }));

      if (isAddMode && existingSemesters.length > 0 && currentSemesterId) {
        const targetSemesterId = currentSemesterId;
        const currentSem = existingSemesters.find((s) => s.id === targetSemesterId) ?? existingSemesters[0];
        const mergedClassCodes = new Set(currentSem.classes.map((c) => c.code));
        const mergedClasses = [...currentSem.classes];
        for (const cls of classes) {
          if (!mergedClassCodes.has(cls.code)) {
            mergedClasses.push(cls);
            mergedClassCodes.add(cls.code);
          }
        }
        const mergedItems = [
          ...existingItems,
          ...itemsWithSemester.map((i) => ({ ...i, semesterId: targetSemesterId })),
        ];
        const updatedSemester = { ...currentSem, classes: mergedClasses };
        const updatedSemesters = existingSemesters.map((s) =>
          s.id === targetSemesterId ? updatedSemester : s
        );
        onImport(mergedItems, mergedClasses, updatedSemester, "add", updatedSemesters);
      } else {
        onImport(itemsWithSemester, classes, semester, "replace", undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse data.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleLoadExample = () => {
    setPasteText(EXAMPLE);
    setError("");
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/10">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Import Your Schedule</CardTitle>
              <CardDescription>
                Paste from Excel, Google Sheets, or any spreadsheet
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Paste your data (Tab or comma separated)
            </label>
            <p className="text-xs text-muted-foreground">
              Paste multiple sheets at once — separate with blank lines or repeated header rows.
            </p>
            <Textarea
              placeholder="Class	Title	Type	Due Date	Time&#10;MATH101	Homework 1	homework	2/15/2026	11:59 PM&#10;..."
              value={pasteText}
              onChange={(e) => {
                setPasteText(e.target.value);
                setError("");
              }}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Expected columns:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Class</strong> or <strong>Course</strong> – e.g. MATH101 or &quot;MATH101 - Calculus&quot;</li>
              <li><strong>Title</strong> or <strong>Name</strong> – assignment name</li>
              <li><strong>Type</strong> (optional) – homework, quiz, exam, project, lecture, assignment</li>
              <li><strong>Due Date</strong> – 2/15/2026, 2026-02-15, Feb 15, etc.</li>
              <li><strong>Time</strong> (optional) – e.g. 11:59 PM, In Class</li>
            </ul>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleLoadExample}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Load example
            </Button>
            <Button
              onClick={handleImport}
              disabled={!pasteText.trim() || isParsing}
              className="gap-2"
            >
              {isParsing ? (
                <>
                  <span className="animate-pulse">Parsing...</span>
                </>
              ) : (
                <>
                  {isAddMode ? "Add to dashboard" : "Import & view dashboard"}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
