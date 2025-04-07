const usedColors = new Set<string>();

export function getPlayerColor(playerName: string): string {
  const hash = [...playerName].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  let hue = hash % 360; // Map hash to a hue value (0-359)

  // Ensure uniqueness by adjusting the hue if the color is already used
  let color = `hsl(${hue}, 70%, 50%)`;
  while (usedColors.has(color)) {
    hue = (hue + 1) % 360; // Increment hue and wrap around if necessary
    color = `hsl(${hue}, 70%, 50%)`;
  }

  usedColors.add(color);
  return color;
}
