/**
 * Utility functions for string formatting and display
 */

export function formatDisplayName(name?: string | null): string {
  if (!name) return '';
  // Replace underscores and consecutive whitespace with single space
  const cleaned = name.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';

  // If text contains latin characters, title case them nicely
  return cleaned
    .split(' ')
    .map((word) => {
      if (/^[a-zA-Z]/.test(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word;
    })
    .join(' ');
}
