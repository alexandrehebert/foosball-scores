export function getPlayerColor(playerName: string): string {
  const hash = [...playerName].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360; // Map hash to a hue value (0-359)
  return `hsl(${hue}, 70%, 50%)`; // Use HSL for vibrant colors
}
