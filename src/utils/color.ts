import colors from 'vuetify/util/colors';

const usedColors = new Set<string>();
const colorCache = new Map<string, string>();

const availableColors = [
  colors.red.base,
  colors.pink.base,
  colors.purple.base,
  colors.deepPurple.base,
  colors.indigo.base,
  colors.blue.base,
  colors.lightBlue.base,
  colors.cyan.base,
  colors.teal.base,
  colors.green.base,
  colors.lightGreen.base,
  colors.lime.base,
  colors.yellow.base,
  colors.amber.base,
  colors.orange.base,
  colors.deepOrange.base,
  colors.brown.base,
  colors.blueGrey.base,
];

export function getPlayerColor(player: string): string {
  if (colorCache.has(player)) {
    return colorCache.get(player)!;
  }

  const hash = [...player].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  let colorIndex = hash % availableColors.length;

  // Find the next available color if the calculated one is already used
  let color = availableColors[colorIndex];
  let attempts = 0;
  while (usedColors.has(color) && attempts < availableColors.length) {
    colorIndex = (colorIndex + 1) % availableColors.length;
    color = availableColors[colorIndex];
    attempts++;
  }

  if (attempts === availableColors.length) {
    // Generate a fallback color based on the player's hash
    const hue = hash % 360; // Generate a hue value between 0 and 359
    color = `hsl(${hue}, 70%, 50%)`; // Use HSL with fixed saturation and lightness
  }

  usedColors.add(color);
  colorCache.set(player, color);
  return color;
}
