"use client";

import React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  FileText,
  Sparkles,
  Upload,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  X,
} from "lucide-react";
import {
  type AcademicItem,
  type ItemType,
  type ClassInfo,
  classes as defaultClasses,
} from "@/lib/data";

interface AddAssignmentProps {
  onAddItem: (item: AcademicItem) => void;
  onAddItems: (items: AcademicItem[]) => void;
  classes?: ClassInfo[];
  /** When true, renders as a compact FAB (icon only) for mobile */
  variant?: "default" | "fab";
  /** Controlled open state - when provided with onOpenChange, enables controlled mode */
  open?: boolean;
  /** Callback when open state changes - use with open for controlled mode */
  onOpenChange?: (open: boolean) => void;
  /** When true, hides the trigger (use with controlled open/onOpenChange for custom triggers) */
  hideTrigger?: boolean;
}

// Month name mapping for parsing
const monthMap: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

// Priority levels based on assignment type
const typePriority: Record<ItemType, number> = {
  exam: 1,      // Highest priority
  project: 2,
  quiz: 3,
  assignment: 4,
  homework: 5,
  lecture: 6,   // Lowest priority
};

interface ParsedItem extends Partial<AcademicItem> {
  priority?: number;
  note?: string;
}

// Smart Paste parsing function with enhanced regex
function parseTextToAssignments(text: string, classes: ClassInfo[]): ParsedItem[] {
  const lines = text.split("\n").filter((line) => line.trim());
  const parsed: ParsedItem[] = [];
  const currentYear = new Date().getFullYear();

  // Enhanced date regex patterns
  const dateRegexes = [
    // "Feb 26" or "February 26" (no year)
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/gi,
    // "Feb 26, 2026" or "February 26, 2026"
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})\b/gi,
    // "3/26" or "03/26" (no year)
    /\b(\d{1,2})\/(\d{1,2})\b(?!\/\d)/g,
    // "3/26/26" or "3/26/2026" or "03-26-2026"
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g,
    // "2026-03-26" (ISO format)
    /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/g,
  ];

  // Type detection keywords with priority order
  const typeKeywords: Record<ItemType, string[]> = {
    exam: ["final exam", "final", "midterm", "exam", "test"],
    quiz: ["quiz", "assessment", "skill quiz"],
    project: ["project", "presentation", "paper", "report", "lab project"],
    assignment: ["assignment", "due", "submit", "submission"],
    homework: ["homework", "hw", "problem set", "ps", "exercises"],
    lecture: ["lecture", "class", "chapter", "ch.", "reading"],
  };

  // Class detection - match course codes like MATH101, CS 200, ECON330
  const classCodeRegex = /\b([A-Za-z]{2,6})\s*(\d{2,4})\b/g;

  // Function to extract date from text
  function extractDate(text: string): string | null {
    // Try "Feb 26, 2026" format first
    const monthDayYearMatch = text.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})\b/i);
    if (monthDayYearMatch) {
      const month = monthMap[monthDayYearMatch[1].toLowerCase().slice(0, 3)];
      const day = parseInt(monthDayYearMatch[2], 10);
      const year = parseInt(monthDayYearMatch[3], 10);
      return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    // Try "Feb 26" format (no year - assume current/next year)
    const monthDayMatch = text.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
    if (monthDayMatch) {
      const month = monthMap[monthDayMatch[1].toLowerCase().slice(0, 3)];
      const day = parseInt(monthDayMatch[2], 10);
      // Assume 2026 for spring semester dates
      const year = month < 6 ? currentYear : currentYear;
      return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    // Try "3/26/2026" or "3-26-2026" format
    const slashDateFullMatch = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
    if (slashDateFullMatch) {
      let month = parseInt(slashDateFullMatch[1], 10);
      let day = parseInt(slashDateFullMatch[2], 10);
      let year = parseInt(slashDateFullMatch[3], 10);
      if (year < 100) year += 2000;
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    // Try "3/26" format (no year)
    const slashDateMatch = text.match(/\b(\d{1,2})\/(\d{1,2})\b(?!\/\d)/);
    if (slashDateMatch) {
      const month = parseInt(slashDateMatch[1], 10);
      const day = parseInt(slashDateMatch[2], 10);
      // Assume 2026 for spring semester
      return `${currentYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    // Try ISO format "2026-03-26"
    const isoMatch = text.match(/\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
    }

    return null;
  }

  // Function to extract class code from text
  function extractClassCode(text: string): { code: string; name: string } | null {
    const codeMatch = text.match(classCodeRegex);
    if (codeMatch) {
      const normalized = codeMatch[0].toUpperCase().replace(/\s+/g, "");
      const classInfo = classes.find((c) => c.code.toUpperCase().replace(/\s+/g, "") === normalized);
      if (classInfo) {
        return { code: classInfo.code, name: classInfo.name };
      }
    }
    return null;
  }

  // Function to detect assignment type
  function detectType(text: string): { type: ItemType; priority: number } {
    const lowerText = text.toLowerCase();
    
    // Check in priority order (exam first, then quiz, etc.)
    for (const [type, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some((kw) => lowerText.includes(kw))) {
        return { 
          type: type as ItemType, 
          priority: typePriority[type as ItemType] 
        };
      }
    }
    
    return { type: "assignment", priority: typePriority.assignment };
  }

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Skip header rows
    if (
      (lowerLine.includes("date") && lowerLine.includes("class")) ||
      (lowerLine.includes("date") && lowerLine.includes("type")) ||
      lowerLine.startsWith("---") ||
      lowerLine.startsWith("===")
    ) {
      continue;
    }

    // Extract date
    const detectedDate = extractDate(line);
    
    // Extract class
    const classResult = extractClassCode(line);
    
    // Detect type and priority
    const { type: detectedType, priority } = detectType(line);

    // Extract title - remove detected patterns and clean up
    let title = line
      // Remove date patterns
      .replace(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*(?:\d{4})?\b/gi, "")
      .replace(/\b\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?\b/g, "")
      .replace(/\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g, "")
      // Remove class codes
      .replace(/\b(econ|eco|math|mis|bus|acc|fin|mkt|mgmt)\s*\d{3}\b/gi, "")
      .trim();

    // Clean up common separators
    title = title
      .replace(/^[\-\|\t,.:]+/, "")
      .replace(/[\-\|\t,.:]+$/, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    // If title is too short, use the type as title
    if (title.length <= 2 && detectedType) {
      title = `${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)}`;
    }

    if (title && title.length > 0) {
      const item: ParsedItem = {
        title,
        type: detectedType,
        priority,
        classCode: classResult?.code || "",
        class: classResult?.name || "",
        dueDate: detectedDate || new Date().toISOString().split("T")[0],
        status: "not-started",
      };

      // Add MIS 180 warning note
      if (classResult?.code === "MIS180") {
        item.note = "Final is mandatory to pass";
      }

      parsed.push(item);
    }
  }

  // Sort by priority (lower number = higher priority)
  parsed.sort((a, b) => (a.priority || 99) - (b.priority || 99));

  return parsed;
}

export function AddAssignment({ onAddItem, onAddItems, classes: classesProp, variant = "default", open: controlledOpen, onOpenChange: controlledOnOpenChange, hideTrigger = false }: AddAssignmentProps) {
  const classes = classesProp || defaultClasses;
  const classList = classes; // Declare classList variable
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;
  const [activeTab, setActiveTab] = useState("manual");

  // Manual form state
  const [title, setTitle] = useState("");
  const [classCode, setClassCode] = useState("");
  const [type, setType] = useState<ItemType>("assignment");
  const [dueDate, setDueDate] = useState("");
  const [time, setTime] = useState("");

  // AI import state
  const [importText, setImportText] = useState("");
  const [parsedItems, setParsedItems] = useState<Partial<AcademicItem>[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  // Image upload state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState("");

  const resetForm = () => {
    setTitle("");
    setClassCode("");
    setType("assignment");
    setDueDate("");
    setTime("");
    setImportText("");
    setParsedItems([]);
    setUploadedImage(null);
    setImageFileName("");
  };

  const handleManualSubmit = () => {
    if (!title || !classCode || !dueDate) return;

    const selectedClass = classList.find((c) => c.code === classCode);
    const newItem: AcademicItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      class: selectedClass?.name || "",
      classCode,
      type,
      status: "not-started",
      dueDate,
      time: time || undefined,
    };

    onAddItem(newItem);
    resetForm();
    setOpen(false);
  };

  const handleParseText = () => {
    setIsParsing(true);
    // Simulate AI processing delay
    setTimeout(() => {
      const items = parseTextToAssignments(importText, classes);
      setParsedItems(items);
      setIsParsing(false);
    }, 500);
  };

  const handleImportParsed = () => {
    const itemsToAdd: AcademicItem[] = parsedItems
      .filter((item) => item.title && item.dueDate)
      .map((item, index) => ({
        id: `imported-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        title: item.title || "Untitled",
        class: item.class || classList.find((c) => c.code === item.classCode)?.name || "",
        classCode: item.classCode || "",
        type: item.type || "assignment",
        status: "not-started",
        dueDate: item.dueDate || new Date().toISOString().split("T")[0],
        time: item.time,
      }));

    if (itemsToAdd.length > 0) {
      onAddItems(itemsToAdd);
      resetForm();
      setOpen(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateParsedItem = (
    index: number,
    field: keyof AcademicItem,
    value: string
  ) => {
    setParsedItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
              ...(field === "classCode"
                ? { class: classList.find((c) => c.code === value)?.name || "" }
                : {}),
            }
          : item
      )
    );
  };

  const removeParsedItem = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button
            className={
              variant === "fab"
                ? "rounded-full w-14 h-14 shadow-lg"
                : "gap-2"
            }
            size={variant === "fab" ? "icon" : "default"}
            aria-label={variant === "fab" ? "Add assignment" : undefined}
          >
            <Plus className={variant === "fab" ? "h-6 w-6" : "h-4 w-4"} />
            {variant === "default" && "Add Assignment"}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add New Assignment
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger value="manual" className="gap-2 data-[state=active]:bg-background">
              <FileText className="h-4 w-4" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2 data-[state=active]:bg-background">
              <Sparkles className="h-4 w-4" />
              AI Import
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-2 data-[state=active]:bg-background">
              <ImageIcon className="h-4 w-4" />
              Image
            </TabsTrigger>
          </TabsList>

          {/* Manual Entry Tab */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="title">Task Name</Label>
                <Input
                  id="title"
                  placeholder="e.g., Chapter 5 Homework"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Select value={classCode} onValueChange={setClassCode}>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classList.map((cls) => (
                      <SelectItem key={cls.code} value={cls.code}>
                        {cls.code} - {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as ItemType)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="lecture">Lecture</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time (optional)
                </Label>
                <Input
                  id="time"
                  placeholder="e.g., 23:59 or In Class"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleManualSubmit}
              disabled={!title || !classCode || !dueDate}
              className="w-full mt-4"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Add Assignment
            </Button>
          </TabsContent>

          {/* AI Import Tab */}
          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="importText" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Smart Paste - Paste syllabus or spreadsheet text
              </Label>
              <Textarea
                id="importText"
                placeholder={`Paste text and the parser will auto-detect dates, classes, and types.\n\nSupported date formats:\n• Feb 26 or February 26\n• 3/26 or 03/26\n• 3/26/26 or 3/26/2026\n\nExamples:\nFeb 15 - ECON 330 - Quiz 1\n3/26, Math 120, Exam 1\nMIS 180 Final Project Due March 1`}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
              />
            </div>

            <Button
              onClick={handleParseText}
              disabled={!importText.trim() || isParsing}
              variant="secondary"
              className="w-full"
            >
              {isParsing ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Parsing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Parse Text
                </>
              )}
            </Button>

            {parsedItems.length > 0 && (
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Parsed Items ({parsedItems.length})
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Edit before importing
                  </span>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {parsedItems.map((item, index) => {
                    const priorityColors: Record<number, string> = {
                      1: "bg-destructive/20 text-destructive border-destructive/30", // Exam
                      2: "bg-warning/20 text-warning-foreground border-warning/30", // Project
                      3: "bg-chart-2/20 text-chart-2 border-chart-2/30", // Quiz
                      4: "bg-chart-1/20 text-chart-1 border-chart-1/30", // Assignment
                      5: "bg-muted text-muted-foreground border-border", // Homework
                      6: "bg-muted/50 text-muted-foreground border-border", // Lecture
                    };
                    const priorityLabels: Record<number, string> = {
                      1: "High",
                      2: "Medium-High",
                      3: "Medium",
                      4: "Normal",
                      5: "Low",
                      6: "Info",
                    };
                    return (
                    <div
                      key={index}
                      className="p-3 rounded-lg border border-border bg-secondary/30 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Input
                              value={item.title || ""}
                              onChange={(e) =>
                                updateParsedItem(index, "title", e.target.value)
                              }
                              placeholder="Task name"
                              className="flex-1 h-8 text-sm"
                            />
                            {item.priority && (
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[item.priority] || "bg-muted"}`}>
                                {priorityLabels[item.priority] || "Normal"}
                              </span>
                            )}
                          </div>
                          {item.note && (
                            <div className="flex items-center gap-1.5 text-xs text-warning">
                              <AlertCircle className="h-3 w-3" />
                              {item.note}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParsedItem(index)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Select
                          value={item.classCode || ""}
                          onValueChange={(v) => {
                            updateParsedItem(index, "classCode", v);
                            // Add MIS180 note if selected
                            if (v === "MIS180") {
                              setParsedItems((prev) =>
                                prev.map((it, i) =>
                                  i === index ? { ...it, note: "Final is mandatory to pass" } : it
                                )
                              );
                            } else {
                              setParsedItems((prev) =>
                                prev.map((it, i) =>
                                  i === index ? { ...it, note: undefined } : it
                                )
                              );
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classList.map((cls) => (
                              <SelectItem key={cls.code} value={cls.code}>
                                {cls.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={item.type || "assignment"}
                          onValueChange={(v) => {
                            updateParsedItem(index, "type", v);
                            // Update priority based on type
                            const newPriority = typePriority[v as ItemType] || 4;
                            setParsedItems((prev) =>
                              prev.map((it, i) =>
                                i === index ? { ...it, priority: newPriority } : it
                              )
                            );
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exam">Exam (High Priority)</SelectItem>
                            <SelectItem value="project">Project</SelectItem>
                            <SelectItem value="quiz">Quiz</SelectItem>
                            <SelectItem value="assignment">Assignment</SelectItem>
                            <SelectItem value="homework">Homework</SelectItem>
                            <SelectItem value="lecture">Lecture</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={item.dueDate || ""}
                          onChange={(e) =>
                            updateParsedItem(index, "dueDate", e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  )})}
                </div>

                <Button onClick={handleImportParsed} className="w-full">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Import {parsedItems.length} Items
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Image Upload Tab */}
          <TabsContent value="image" className="space-y-4 mt-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              {uploadedImage ? (
                <div className="space-y-4">
                  <img
                    src={uploadedImage || "/placeholder.svg"}
                    alt="Uploaded syllabus"
                    className="max-h-[300px] mx-auto rounded-lg"
                  />
                  <p className="text-sm text-muted-foreground">{imageFileName}</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadedImage(null);
                      setImageFileName("");
                    }}
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Upload a screenshot</p>
                      <p className="text-sm text-muted-foreground">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                    <Button variant="secondary" type="button">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Choose Image
                    </Button>
                  </div>
                </label>
              )}
            </div>

            {uploadedImage && (
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">OCR Coming Soon</p>
                    <p className="text-xs text-muted-foreground">
                      Image text extraction requires an OCR API connection (like
                      OpenAI Vision or Tesseract). For now, you can manually copy
                      the text from your image and use the AI Import tab to parse
                      it.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
