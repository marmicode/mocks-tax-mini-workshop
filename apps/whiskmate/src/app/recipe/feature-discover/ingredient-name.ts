/**
 * Turns "2 red peppers, sliced" or "800g tinned chopped tomatoes" into
 * "red peppers" and "tinned chopped tomatoes".
 */
export function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .split(',')[0]
    .replace(/^(\d+[a-z]*\s+)+/, '')
    .trim();
}
