import React from "react";

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function roleBadgeStyle(color: string): React.CSSProperties {
  return {
    backgroundColor: `${color}18`,
    color: color,
    borderColor: `${color}40`,
    borderWidth: 1,
    borderStyle: "solid",
  };
}

export function avatarStyle(color: string): React.CSSProperties {
  return {
    backgroundColor: color,
    color: "#fff",
  };
}
