"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TINT_CLASSES, type ModuleCard } from "./moduleCatalogue";

interface ModuleGridProps {
  cards: ModuleCard[];
  onNavigate: (screen: string) => void;
}

const SECTION_ORDER = [
  "People & Attendance",
  "Teaching & Learning",
  "Fees & Finance",
  "Student Life",
  "Campus & Operations",
  "Communication & Tools",
  "Administration",
];

export function ModuleGrid({ cards, onNavigate }: ModuleGridProps) {
  // Group cards by category
  const groupedCards = useMemo(() => {
    const groups: Record<string, ModuleCard[]> = {};

    cards.forEach((card) => {
      const cat = card.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(card);
    });

    return groups;
  }, [cards]);

  const orderedCategories = useMemo(() => {
    const defined = SECTION_ORDER.filter((cat) => groupedCards[cat]?.length);
    const extra = Object.keys(groupedCards).filter((cat) => !SECTION_ORDER.includes(cat));
    return [...defined, ...extra];
  }, [groupedCards]);

  return (
    <div className="space-y-6 w-full pb-10">
      {orderedCategories.map((category) => {
        const categoryCards = groupedCards[category];
        if (!categoryCards || categoryCards.length === 0) return null;

        return (
          <section key={category} className="iwm-section" aria-label={category}>
            {/* Section Header */}
            <h2 className="iwm-section-title">{category}</h2>

            {/* Cards Grid */}
            <div className="iwm-grid">
              {categoryCards.map((card) => {
                const isComingSoon = card.screen === null;
                const tintStyle = TINT_CLASSES[isComingSoon ? "slate" : card.tint];

                return (
                  <a
                    key={card.id}
                    onClick={(e) => {
                      e.preventDefault();
                      if (!isComingSoon && card.screen) {
                        onNavigate(card.screen);
                      }
                    }}
                    role="button"
                    tabIndex={isComingSoon ? -1 : 0}
                    aria-disabled={isComingSoon}
                    className={cn(
                      "iwm-card group",
                      isComingSoon && "is-disabled"
                    )}
                  >
                    {/* Icon Container */}
                    <div className={cn("iwm-icon-box", tintStyle)}>
                      <card.icon className="size-5" />
                    </div>

                    {/* Content (Title & Subtitle) */}
                    <div className="iwm-content">
                      <h3 className="iwm-title">{card.title}</h3>
                      <p className="iwm-subtitle">
                        {isComingSoon ? "Coming soon" : card.subtitle}
                      </p>
                    </div>

                    {/* Right Chevron Arrow */}
                    <ChevronRight className="iwm-arrow" />
                  </a>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

