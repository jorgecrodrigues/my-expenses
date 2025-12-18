/**
 * Generates a hex color code based on the input string.
 * @param input The input string to generate the color from.
 * @returns  A hex color code.
 */
export const generateColorByString = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate HSL color for more vibrant, modern colors
  const hue = Math.abs(hash) % 360;
  const saturation = 65 + (Math.abs(hash >> 8) % 25); // 65-90%
  const lightness = 50 + (Math.abs(hash >> 16) % 15); // 50-65%

  // Convert HSL to RGB
  const s = saturation / 100;
  const l = lightness / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;
  if (hue >= 0 && hue < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (hue >= 60 && hue < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (hue >= 120 && hue < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (hue >= 180 && hue < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (hue >= 240 && hue < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Generate a text color (black or white) based on the background color for better readability.
 * @param backgroundColor The background color in hex format.
 * @returns The text color in hex format (#000000 for black, #FFFFFF for white).
 */
export const getContrastingTextColor = (backgroundColor: string): string => {
  // Validate hex color format
  if (!/^#([0-9A-Fa-f]{6})$/.test(backgroundColor)) {
    throw new Error("Invalid hex color format. Expected format: #RRGGBB");
  }

  // Remove the hash if present
  const hex = backgroundColor.replace("#", "");

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds and white for dark backgrounds
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
};
