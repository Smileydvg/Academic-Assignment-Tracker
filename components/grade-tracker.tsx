"use client";

import { useState } from "react";
import type { AcademicItem, ClassInfo } from "@/lib/data";
import { defaultClasses, defaultGradeWeights, calculateLatePenalty } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AlertTriangle, Pencil, Check, X, Plus, Trash2 } from "lucide-react";

const CATEGORY_OPTIONS = [
  { key: "exam", label: "Exams" },
  { key: "final", label: "Final Exam" },
  { key: "hw", label: "Homework" },
  { key: "quiz", label: "Quizzes" },
  { key: "project", label: "Projects" },
  { key: "lab", label: "Lab" },
  { key: "participation", label: "Participation" },
];

interface GradeTrackerProps {
  items: AcademicItem[];
  classes?: ClassInfo[];
  gradeWeights?: Record<string, Record<string, { weight: number; label: string }>>;
  onUpdateGradeWeights?: (classCode: string, weights: Record<string, { weight: number; label: string }>) => void;
}

const classes = defaultClasses;
const gradeWeights = defaultGradeWeights;

function getLetterGrade(percent: number): { letter: string; color: string } {
  if (percent >= 93) return { letter: "A", color: "text-primary" };
  if (percent >= 90) return { letter: "A-", color: "text-primary" };
  if (percent >= 87) return { letter: "B+", color: "text-chart-1" };
  if (percent >= 83) return { letter: "B", color: "text-chart-1" };
  if (percent >= 80) return { letter: "B-", color: "text-chart-1" };
  if (percent >= 77) return { letter: "C+", color: "text-warning" };
  if (percent >= 73) return { letter: "C", color: "text-warning" };
  if (percent >= 70) return { letter: "C-", color: "text-warning" };
  if (percent >= 67) return { letter: "D+", color: "text-destructive" };
  if (percent >= 63) return { letter: "D", color: "text-destructive" };
  if (percent >= 60) return { letter: "D-", color: "text-destructive" };
  return { letter: "F", color: "text-destructive" };
}

function calculateClassGrade(
  items: AcademicItem[],
  classCode: string,
  classList: ClassInfo[],
  gradeWeightsMap: Record<string, Record<string, { weight: number; label: string }>>
): {
  currentGrade: number | null;
  earnedPoints: number;
  possiblePoints: number;
  categoryBreakdown: Record<
    string,
    { earned: number; possible: number; items: number; weight: number }
  >;
  hasFinalWarning: boolean;
} {
  const classItems = items.filter(
    (item) => item.classCode === classCode && item.gradeCategory
  );
  const weights = gradeWeightsMap[classCode];
  const classInfo = classList.find((c) => c.code === classCode);

  if (!weights)
    return {
      currentGrade: null,
      earnedPoints: 0,
      possiblePoints: 0,
      categoryBreakdown: {},
      hasFinalWarning: false,
    };

  const categoryBreakdown: Record<
    string,
    { earned: number; possible: number; items: number; weight: number }
  > = {};

  // Initialize categories
  for (const [cat, info] of Object.entries(weights)) {
    categoryBreakdown[cat] = {
      earned: 0,
      possible: 0,
      items: 0,
      weight: info.weight,
    };
  }

  // Check for final exam status
  const finalExam = classItems.find((item) => item.isFinal);
  const hasFinalWarning =
    !!classInfo?.killSwitch &&
    finalExam &&
    finalExam.status !== "completed" &&
    !finalExam.grade;

  // Calculate grades per category
  for (const item of classItems) {
    const cat = item.gradeCategory!;
    if (!categoryBreakdown[cat]) continue;

    if (item.grade !== undefined) {
      let effectiveGrade = item.grade;

      // Apply late penalty if applicable
      if (item.isLate && item.daysLate && item.daysLate > 0) {
        effectiveGrade = calculateLatePenalty(
          item.grade,
          item.daysLate,
          classCode
        );
      }

      categoryBreakdown[cat].earned += effectiveGrade;
      categoryBreakdown[cat].possible += 100;
      categoryBreakdown[cat].items += 1;
    }
  }

  // Calculate weighted average based on graded items only
  let totalWeightedEarned = 0;
  let totalWeightUsed = 0;

  for (const [cat, data] of Object.entries(categoryBreakdown)) {
    if (data.possible > 0) {
      const categoryPercent = (data.earned / data.possible) * 100;
      totalWeightedEarned += categoryPercent * data.weight;
      totalWeightUsed += data.weight;
    }
  }

  const currentGrade =
    totalWeightUsed > 0 ? totalWeightedEarned / totalWeightUsed : null;

  return {
    currentGrade,
    earnedPoints: totalWeightedEarned,
    possiblePoints: totalWeightUsed * 100,
    categoryBreakdown,
    hasFinalWarning,
  };
}

export function GradeTracker({ items, classes: classesProp, gradeWeights: gradeWeightsProp, onUpdateGradeWeights }: GradeTrackerProps) {
  const classList = classesProp || defaultClasses;
  const gradeWeightsMap = gradeWeightsProp || defaultGradeWeights;
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [editWeights, setEditWeights] = useState<Record<string, Record<string, { weight: number; label: string }>>>({});
  const classesWithWarnings = classList.filter((c) => c.killSwitch);

  const startEditing = (classCode: string) => {
    setEditingClass(classCode);
    const current = gradeWeightsMap[classCode] || {};
    setEditWeights((prev) => ({
      ...prev,
      [classCode]: Object.fromEntries(
        Object.entries(current).map(([k, v]) => [k, { ...v }])
      ),
    }));
  };

  const cancelEditing = (classCode: string) => {
    setEditingClass(null);
    setEditWeights((prev) => {
      const next = { ...prev };
      delete next[classCode];
      return next;
    });
  };

  const saveEditing = (classCode: string) => {
    const weights = editWeights[classCode];
    if (weights && onUpdateGradeWeights) {
      const total = Object.values(weights).reduce((s, w) => s + w.weight, 0);
      if (Math.abs(total - 1) > 0.01) return;
      onUpdateGradeWeights(classCode, weights);
    }
    setEditingClass(null);
    setEditWeights((prev) => {
      const next = { ...prev };
      delete next[classCode];
      return next;
    });
  };

  const updateEditWeight = (classCode: string, catKey: string, weight: number, label?: string) => {
    setEditWeights((prev) => {
      const classWeights = { ...(prev[classCode] || {}) };
      const existing = classWeights[catKey];
      classWeights[catKey] = {
        weight: Math.max(0, Math.min(1, weight)),
        label: label ?? existing?.label ?? catKey,
      };
      return { ...prev, [classCode]: classWeights };
    });
  };

  const addCategory = (classCode: string) => {
    const existing = editWeights[classCode] || {};
    const used = new Set(Object.keys(existing));
    const available = CATEGORY_OPTIONS.find((c) => !used.has(c.key));
    if (available) {
      setEditWeights((prev) => ({
        ...prev,
        [classCode]: {
          ...(prev[classCode] || {}),
          [available.key]: { weight: 0.1, label: available.label },
        },
      }));
    }
  };

  const removeCategory = (classCode: string, catKey: string) => {
    setEditWeights((prev) => {
      const classWeights = { ...(prev[classCode] || {}) };
      delete classWeights[catKey];
      return { ...prev, [classCode]: classWeights };
    });
  };

  return (
    <div className="space-y-6">
      {/* Kill Switch Warnings */}
      {classesWithWarnings.map((classInfo) => {
        const { hasFinalWarning } = calculateClassGrade(items, classInfo.code, classList, gradeWeightsMap);
        if (!hasFinalWarning) return null;

        return (
          <Alert
            key={classInfo.code}
            variant="destructive"
            className="border-destructive/50 bg-destructive/10"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-semibold">
              {classInfo.code} Warning
            </AlertTitle>
            <AlertDescription>{classInfo.killSwitch}</AlertDescription>
          </Alert>
        );
      })}

      {/* Grade Cards per Class */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classList.map((classInfo) => {
          const { currentGrade, categoryBreakdown } = calculateClassGrade(
            items,
            classInfo.code,
            classList,
            gradeWeightsMap
          );
          const letterGrade = currentGrade
            ? getLetterGrade(currentGrade)
            : null;
          const weights = gradeWeightsMap[classInfo.code];
          const isEditing = editingClass === classInfo.code;
          const displayWeights = isEditing ? (editWeights[classInfo.code] || weights || {}) : (weights || {});
          const editTotal = isEditing
            ? Object.values(editWeights[classInfo.code] || {}).reduce((s, w) => s + w.weight, 0)
            : 1;
          const totalValid = Math.abs(editTotal - 1) < 0.01;

          return (
            <Card key={classInfo.code} className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn("w-3 h-8 rounded-full", classInfo.color)}
                    />
                    <div>
                      <CardTitle className="text-lg">{classInfo.code}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {classInfo.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentGrade !== null && !isEditing && (
                      <>
                        <p
                          className={cn(
                            "text-3xl font-bold",
                            letterGrade?.color
                          )}
                        >
                          {letterGrade?.letter}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {currentGrade.toFixed(1)}%
                        </p>
                      </>
                    )}
                    {currentGrade === null && !isEditing && (
                      <p className="text-sm text-muted-foreground">
                        No grades yet
                      </p>
                    )}
                    {onUpdateGradeWeights && (
                      isEditing ? (
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => saveEditing(classInfo.code)}
                            disabled={!totalValid}
                            title="Save"
                            aria-label="Save weights"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => cancelEditing(classInfo.code)}
                            title="Cancel"
                            aria-label="Cancel editing"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEditing(classInfo.code)}
                          title="Edit weights"
                          aria-label="Edit grade weights"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentGrade !== null && !isEditing && (
                  <Progress value={currentGrade} className="h-2" />
                )}

                {/* Category Breakdown */}
                <div className="space-y-3">
                  {Object.keys(displayWeights).length === 0 && !isEditing && (
                    <p className="text-sm text-muted-foreground">
                      No categories set. Click the pencil to add.
                    </p>
                  )}
                  {Object.entries(displayWeights).map(([cat, info]) => {
                    const catData = categoryBreakdown[cat];
                    const catPercent =
                      catData && catData.possible > 0
                        ? (catData.earned / catData.possible) * 100
                        : null;

                    return (
                      <div key={cat} className="flex items-center justify-between text-sm gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-muted-foreground truncate">
                            {info.label}
                          </span>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step={5}
                                className="w-16 min-h-[44px] text-xs"
                                value={Math.round(info.weight * 100)}
                                onChange={(e) => {
                                  const v = Number.parseInt(e.target.value, 10);
                                  if (!Number.isNaN(v)) {
                                    updateEditWeight(classInfo.code, cat, v / 100, info.label);
                                  }
                                }}
                              />
                              <span className="text-xs">%</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => removeCategory(classInfo.code, cat)}
                                aria-label={`Remove ${info.label} category`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              {(info.weight * 100).toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                        {!isEditing && (
                          <div className="flex items-center gap-2 shrink-0">
                            {catData && catData.items > 0 ? (
                              <>
                                <span className="font-medium">
                                  {catPercent?.toFixed(1)}%
                                </span>
                                <span className="text-muted-foreground">
                                  ({catData.items} graded)
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">--</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {isEditing && (
                    <div className="pt-2 border-t border-border">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 w-full"
                        onClick={() => addCategory(classInfo.code)}
                      >
                        <Plus className="h-4 w-4" />
                        Add category
                      </Button>
                      <p className={cn(
                        "text-xs mt-2",
                        totalValid ? "text-muted-foreground" : "text-destructive"
                      )}>
                        Total: {(editTotal * 100).toFixed(0)}% {totalValid ? "(must equal 100%)" : "— Must equal 100%"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Late Penalty Notice */}
                {classInfo.hasLatePenalty && !isEditing && (
                  <p className="text-xs text-muted-foreground border-t border-border pt-3">
                    Late penalty: -10% per day late
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overall Summary */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Grade Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {classList.map((classInfo) => {
              const { currentGrade } = calculateClassGrade(
                items,
                classInfo.code,
                classList,
                gradeWeightsMap
              );
              const letterGrade = currentGrade
                ? getLetterGrade(currentGrade)
                : null;

              return (
                <div
                  key={classInfo.code}
                  className="text-center p-4 rounded-lg bg-secondary/30"
                >
                  <p className="text-sm text-muted-foreground mb-1">
                    {classInfo.code}
                  </p>
                  {currentGrade !== null ? (
                    <>
                      <p
                        className={cn("text-2xl font-bold", letterGrade?.color)}
                      >
                        {letterGrade?.letter}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currentGrade.toFixed(1)}%
                      </p>
                    </>
                  ) : (
                    <p className="text-lg text-muted-foreground">--</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
