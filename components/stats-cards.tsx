"use client";

import type { AcademicItem } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ClipboardList, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface StatsCardsProps {
  items: AcademicItem[];
}

export function StatsCards({ items }: StatsCardsProps) {
  const total = items.length;
  const completed = items.filter((i) => i.status === "completed").length;
  const inProgress = items.filter((i) => i.status === "in-progress").length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingWeek = items.filter((i) => {
    if (i.status === "completed") return false;
    const dueDate = new Date(i.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  const stats = [
    {
      label: "Total Items",
      value: total,
      icon: ClipboardList,
      className: "text-foreground",
    },
    {
      label: "In Progress",
      value: inProgress,
      icon: Clock,
      className: "text-warning",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle2,
      className: "text-primary",
    },
    {
      label: "Due This Week",
      value: upcomingWeek,
      icon: AlertCircle,
      className: upcomingWeek > 0 ? "text-destructive" : "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={cn("text-2xl font-bold", stat.className)}>
                    {stat.value}
                  </p>
                </div>
                <Icon className={cn("h-8 w-8 opacity-50", stat.className)} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
