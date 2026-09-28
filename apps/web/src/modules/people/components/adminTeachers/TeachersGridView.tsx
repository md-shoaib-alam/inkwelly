"use client";

import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { TeacherCard } from "./TeacherCard";
import type { TeacherInfo } from "./types";

const premiumLayoutTransition = {
  type: "spring",
  stiffness: 280,
  damping: 28,
  mass: 0.7
} as const;

interface TeachersGridViewProps {
  teachers: TeacherInfo[];
  canEdit: boolean;
  canDelete: boolean;
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  onEdit: (t: TeacherInfo) => void;
  onDelete: (id: string) => void;
  onView: (t: TeacherInfo) => void;
}

export function TeachersGridView({
  teachers,
  canEdit,
  canDelete,
  deletingId,
  setDeletingId,
  onEdit,
  onDelete,
  onView,
}: TeachersGridViewProps) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {teachers.map((teacher, index) => (
            <m.div 
              key={teacher.id}
              id={`teacher-item-${teacher.id}`}
              layout
              transition={premiumLayoutTransition}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <TeacherCard
                teacher={teacher}
                index={index}
                canEdit={canEdit}
                canDelete={canDelete}
                deletingId={deletingId}
                setDeletingId={setDeletingId}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
              />
            </m.div>
          ))}
        </AnimatePresence>
      </m.div>
    </LazyMotion>
  );
}
