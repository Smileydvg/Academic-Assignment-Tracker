"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  Plus,
  Settings,
  Trash2,
  BookOpen,
  Calendar,
  GraduationCap,
  Palette,
  AlertTriangle,
} from "lucide-react";
import type { Semester, ClassInfo } from "@/lib/data";

interface SemesterManagerProps {
  semesters: Semester[];
  currentSemesterId: string;
  onSemesterChange: (semesterId: string) => void;
  onAddSemester: (semester: Semester) => void;
  onDeleteSemester: (semesterId: string) => void;
  onAddClass: (semesterId: string, classInfo: ClassInfo) => void;
  onDeleteClass: (semesterId: string, classCode: string) => void;
  onUpdateClass: (semesterId: string, classCode: string, updates: Partial<ClassInfo>) => void;
}

const colorOptions = [
  { value: "bg-chart-1", label: "Teal", preview: "bg-[oklch(0.7_0.15_160)]" },
  { value: "bg-chart-2", label: "Blue", preview: "bg-[oklch(0.65_0.18_250)]" },
  { value: "bg-chart-3", label: "Orange", preview: "bg-[oklch(0.7_0.18_45)]" },
  { value: "bg-chart-4", label: "Purple", preview: "bg-[oklch(0.65_0.15_320)]" },
  { value: "bg-chart-5", label: "Cyan", preview: "bg-[oklch(0.7_0.12_200)]" },
];

const semesterSeasons = ["Spring", "Summer", "Fall", "Winter"];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

export function SemesterManager({
  semesters,
  currentSemesterId,
  onSemesterChange,
  onAddSemester,
  onDeleteSemester,
  onAddClass,
  onDeleteClass,
  onUpdateClass,
}: SemesterManagerProps) {
  const [addSemesterOpen, setAddSemesterOpen] = useState(false);
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [manageClassesOpen, setManageClassesOpen] = useState(false);
  
  // New semester form
  const [newSeason, setNewSeason] = useState("Fall");
  const [newYear, setNewYear] = useState(currentYear.toString());
  
  // New class form
  const [newClassCode, setNewClassCode] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [newClassColor, setNewClassColor] = useState("bg-chart-1");
  const [newClassHasLatePenalty, setNewClassHasLatePenalty] = useState(false);
  const [newClassKillSwitch, setNewClassKillSwitch] = useState(false);
  
  // Grade weights for new class
  const [gradeWeights, setGradeWeights] = useState({
    exam: { weight: 40, label: "Exams" },
    final: { weight: 25, label: "Final Exam" },
    hw: { weight: 15, label: "Homework" },
    quiz: { weight: 10, label: "Quizzes" },
    project: { weight: 10, label: "Projects" },
  });

  const currentSemester = semesters.find((s) => s.id === currentSemesterId);

  const handleAddSemester = () => {
    const id = `${newSeason.toLowerCase()}-${newYear}`;
    const name = `${newSeason} ${newYear}`;
    
    // Check if semester already exists
    if (semesters.some((s) => s.id === id)) {
      return;
    }

    onAddSemester({
      id,
      name,
      startDate: `${newYear}-01-01`,
      endDate: `${newYear}-05-15`,
      classes: [],
      gradeWeights: {},
    });
    
    setAddSemesterOpen(false);
    onSemesterChange(id);
  };

  const handleAddClass = () => {
    if (!newClassCode || !newClassName) return;

    const classInfo: ClassInfo = {
      code: newClassCode.toUpperCase().replace(/\s/g, ""),
      name: newClassName,
      color: newClassColor,
      hasLatePenalty: newClassHasLatePenalty,
      killSwitch: newClassKillSwitch ? "Missing the final results in a failing grade" : undefined,
    };

    onAddClass(currentSemesterId, classInfo);

    // Reset form
    setNewClassCode("");
    setNewClassName("");
    setNewClassColor("bg-chart-1");
    setNewClassHasLatePenalty(false);
    setNewClassKillSwitch(false);
    setAddClassOpen(false);
  };

  const totalWeight = Object.values(gradeWeights).reduce((sum, w) => sum + w.weight, 0);

  return (
    <div className="flex items-center gap-2">
      {/* Semester Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Calendar className="h-4 w-4" />
            {currentSemester?.name || "Select Semester"}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {semesters.map((semester) => (
            <DropdownMenuItem
              key={semester.id}
              onClick={() => onSemesterChange(semester.id)}
              className={semester.id === currentSemesterId ? "bg-accent" : ""}
            >
              <Calendar className="h-4 w-4 mr-2" />
              {semester.name}
              <span className="ml-auto text-xs text-muted-foreground">
                {semester.classes.length} classes
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setAddSemesterOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Semester
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Manage Classes Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setManageClassesOpen(true)}
        title="Manage Classes"
      >
        <Settings className="h-4 w-4" />
      </Button>

      {/* Add Semester Dialog */}
      <Dialog open={addSemesterOpen} onOpenChange={setAddSemesterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              New Semester
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Season</Label>
                <Select value={newSeason} onValueChange={setNewSeason}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {semesterSeasons.map((season) => (
                      <SelectItem key={season} value={season}>
                        {season}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={newYear} onValueChange={setNewYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAddSemester} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Semester
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Classes Dialog */}
      <Dialog open={manageClassesOpen} onOpenChange={setManageClassesOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Manage Classes - {currentSemester?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Existing Classes */}
            {currentSemester?.classes && currentSemester.classes.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Your Classes</Label>
                {currentSemester.classes.map((cls) => (
                  <div
                    key={cls.code}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${cls.color.replace('bg-', 'bg-')}`} 
                        style={{
                          backgroundColor: cls.color === 'bg-chart-1' ? 'oklch(0.7 0.15 160)' :
                                          cls.color === 'bg-chart-2' ? 'oklch(0.65 0.18 250)' :
                                          cls.color === 'bg-chart-3' ? 'oklch(0.7 0.18 45)' :
                                          cls.color === 'bg-chart-4' ? 'oklch(0.65 0.15 320)' :
                                          'oklch(0.7 0.12 200)'
                        }}
                      />
                      <div>
                        <p className="font-medium">{cls.code}</p>
                        <p className="text-sm text-muted-foreground">{cls.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {cls.hasLatePenalty && (
                        <span className="text-xs px-2 py-1 rounded bg-warning/20 text-warning">
                          Late Penalty
                        </span>
                      )}
                      {cls.killSwitch && (
                        <span className="text-xs px-2 py-1 rounded bg-destructive/20 text-destructive">
                          Final Required
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteClass(currentSemesterId, cls.code)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No classes added yet</p>
                <p className="text-sm">Add your first class below</p>
              </div>
            )}

            {/* Add New Class Form */}
            <div className="border-t border-border pt-4 mt-4">
              <Label className="text-sm font-medium">Add New Class</Label>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="classCode" className="text-xs text-muted-foreground">
                    Course Code
                  </Label>
                  <Input
                    id="classCode"
                    placeholder="e.g., ECON 101"
                    value={newClassCode}
                    onChange={(e) => setNewClassCode(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="className" className="text-xs text-muted-foreground">
                    Course Name
                  </Label>
                  <Input
                    id="className"
                    placeholder="e.g., Intro to Economics"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Palette className="h-3 w-3" />
                    Color
                  </Label>
                  <Select value={newClassColor} onValueChange={setNewClassColor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{
                                backgroundColor: color.value === 'bg-chart-1' ? 'oklch(0.7 0.15 160)' :
                                                color.value === 'bg-chart-2' ? 'oklch(0.65 0.18 250)' :
                                                color.value === 'bg-chart-3' ? 'oklch(0.7 0.18 45)' :
                                                color.value === 'bg-chart-4' ? 'oklch(0.65 0.15 320)' :
                                                'oklch(0.7 0.12 200)'
                              }}
                            />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="latePenalty" className="text-xs text-muted-foreground">
                      Late Penalty (10%/day)
                    </Label>
                    <Switch
                      id="latePenalty"
                      checked={newClassHasLatePenalty}
                      onCheckedChange={setNewClassHasLatePenalty}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="killSwitch" className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Final Required
                    </Label>
                    <Switch
                      id="killSwitch"
                      checked={newClassKillSwitch}
                      onCheckedChange={setNewClassKillSwitch}
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleAddClass}
                disabled={!newClassCode || !newClassName}
                className="w-full mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
            </div>

            {/* Delete Semester */}
            {semesters.length > 1 && (
              <div className="border-t border-border pt-4 mt-4">
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent"
                  onClick={() => {
                    onDeleteSemester(currentSemesterId);
                    setManageClassesOpen(false);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete This Semester
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
