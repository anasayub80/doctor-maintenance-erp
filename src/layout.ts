/** Fit the desktop editor below sticky navigation, keeping room for its chrome. */
export function editorViewportHeight(
  viewportWidth: number,
  viewportHeight: number,
  editorTop: number,
  headerHeight: number,
  chromeHeight: number,
): number | undefined {
  if (viewportWidth <= 1050 || viewportHeight < 500) return undefined;
  const top = Math.max(headerHeight + 16, editorTop);
  return Math.max(chromeHeight + 96, viewportHeight - top - 18);
}
