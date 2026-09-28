"use client";

import { ParentCard } from "./ParentCard";
import type { ParentInfo } from "./types";

interface ParentsGridViewProps {
  parents: ParentInfo[];
  linking: boolean;
  onEdit: (p: ParentInfo) => void;
  onDelete: (id: string) => void;
  onLinkOpen: (p: ParentInfo) => void;
  onUnlinkChild: (parentId: string, studentId: string) => void;
  onView: (p: ParentInfo) => void;
}

export function ParentsGridView({
  parents,
  linking,
  onEdit,
  onDelete,
  onLinkOpen,
  onUnlinkChild,
  onView,
}: ParentsGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {parents.map((parent) => (
        <div key={parent.id}>
          <ParentCard
            parent={parent}
            linking={linking}
            onEdit={onEdit}
            onDelete={onDelete}
            onLinkOpen={onLinkOpen}
            onUnlinkChild={onUnlinkChild}
            onView={onView}
          />
        </div>
      ))}
    </div>
  );
}
