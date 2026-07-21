// Single source of truth for "which date is this dream on" — created_at is
// when the row was inserted (immutable), display_at is the user-editable
// override (see "Edit image details" on the Dream Result screen). Every
// place that groups, sorts, or displays a dream by date must go through
// this so an edited date can never disagree with itself across screens.
export function effectiveDreamDate(dream: { createdAt: string; displayAt?: string }): string {
  return dream.displayAt ?? dream.createdAt;
}
