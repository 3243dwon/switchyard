/**
 * Renderer registry. renderDiorama(d, { style }) dispatches to a style module.
 * Every renderer is a pure (ValidDilemma, opts) => SVG string, driven by the spec.
 */

import type { Dilemma } from "../types.ts";
import { renderEditorial } from "./editorial.ts";
import { renderRisograph } from "./riso.ts";
import { renderInkwash } from "./inkwash.ts";
import { renderAnimated } from "./animated.ts";

export type RenderStyle = "editorial" | "risograph" | "inkwash" | "animated";

export interface RenderOptions {
  /** which choice to depict; defaults to the first non-omission choice */
  choiceId?: string;
  /** the visual language; defaults to "editorial" */
  style?: RenderStyle;
}

const RENDERERS: Record<RenderStyle, (d: Dilemma, o: RenderOptions) => string> = {
  editorial: renderEditorial,
  risograph: renderRisograph,
  inkwash: renderInkwash,
  animated: renderAnimated,
};

export const RENDER_STYLES: RenderStyle[] = ["editorial", "risograph", "inkwash", "animated"];

export function renderDiorama(d: Dilemma, opts: RenderOptions = {}): string {
  const fn = RENDERERS[opts.style ?? "editorial"] ?? renderEditorial;
  return fn(d, opts);
}

export { renderEditorial, renderRisograph, renderInkwash, renderAnimated };
