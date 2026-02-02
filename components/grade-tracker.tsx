"use client";

import type { AcademicItem, ClassInfo } from "@/lib/data";
import { defaultClasses, defaultGradeWeights, calculateLatePenalty } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface GradeTrackerProps {
  items: AcademicItem[];
  classes?: ClassInfo[];
  gradeWeights?: Record<string, Record<string, { weight: number; label: string }>>;
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

export function GradeTracker({ items, classes: classesProp, gradeWeights: gradeWeightsProp }: GradeTrackerProps) {
  const classList = classesProp || defaultClasses;
  const gradeWeightsMap = gradeWeightsProp || defaultGradeWeights;
  const classesWithWarnings = classList.filter((c) => c.killSwitch);

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
                  <div className="text-right">
                    {currentGrade !== null ? (
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
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No grades yet
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentGrade !== null && (
                  <Progress value={currentGrade} className="h-2" />
                )}

                {/* Category Breakdown */}
                <div className="space-y-3">
                  {weights &&
                    Object.entries(weights).map(([cat, info]) => {
                      const catData = categoryBreakdown[cat];
                      const catPercent =
                        catData && catData.possible > 0
                          ? (catData.earned / catData.possible) * 100
                          : null;

                      return (
                        <div key={cat} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {info.label}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {(info.weight * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
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
                        </div>
                      );
                    })}
                </div>

                {/* Late Penalty Notice */}
                {classInfo.hasLatePenalty && (
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
