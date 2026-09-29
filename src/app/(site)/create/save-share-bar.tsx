"use client";

import { Button } from "@/components/ui";

export function SaveShareBar({ onShare }: { studio: unknown; onShare: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onShare}>
      Share
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
      </svg>
    </Button>
  );
}
