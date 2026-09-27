"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export function TeachersEmptyState() {
  return (
    <Card className="border-dashed border-2 bg-transparent">
      <CardContent className="py-20 text-center text-muted-foreground">
        <Users className="size-12 mx-auto mb-4 opacity-20" />
        <p className="text-lg font-medium">No teachers found</p>
        <p className="text-sm">Try adjusting your search criteria</p>
      </CardContent>
    </Card>
  );
}
