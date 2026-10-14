import test from "node:test";
import assert from "node:assert/strict";
import { editorViewportHeight } from "../src/layout.ts";
test("a desktop editor initially fits above the viewport bottom below the page heading", () => {
  const height = editorViewportHeight(1440, 900, 300, 70, 200)!;
  assert.equal(300 + height, 882);
  assert(height - 200 >= 96);
});
test("a scrolled editor reserves navigation clearance and footer space", () => {
  const height = editorViewportHeight(1600, 800, -100, 70, 240)!;
  assert.equal(86 + height, 782);
  assert(height - 240 >= 96);
});
test("large wrapped chrome still leaves a scrollable content area", () => {
  assert(editorViewportHeight(1366, 768, 520, 70, 260)! - 260 >= 96);
});
test("tablet widths and very short viewports use natural page scrolling", () => {
  assert.equal(editorViewportHeight(1024, 800, 250, 70, 200), undefined);
  assert.equal(editorViewportHeight(1440, 450, 250, 70, 200), undefined);
});
