"use client";

import * as React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";

interface StatCardProps {
  title: string;
  value: number | string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  description?: string;
  footer?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "positive",
  description,
  footer,
}: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col space-y-0.5 pb-3">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <CardTitle className="text-2xl font-extrabold tabular-nums text-foreground">
          {value}
        </CardTitle>
        {change && (
          <Badge
            variant={
              changeType === "positive"
                ? "success"
                : changeType === "negative"
                  ? "danger"
                  : "neutral"
            }
            size="sm"
          >
            {change}
          </Badge>
        )}
      </CardHeader>
      {description && (
        <CardContent className="pb-3">
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      )}
      {footer && <CardFooter className="pt-3 border-t border-border">{footer}</CardFooter>}
    </Card>
  );
}
