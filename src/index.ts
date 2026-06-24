/**
 * Switchyard — a typed grammar for moral dilemmas.
 *
 * @example
 *   import { generate, asValid, scoreAll, renderDiorama } from "@switchyard/core";
 *   const d = asValid(generate(42));
 *   console.log(scoreAll(d));          // five frameworks, each a recommendation
 *   await Bun.write("d.svg", renderDiorama(d));
 */

export * from "./types.ts";
export { partyById, deathProb, harmedParties, expectedDeaths, isDoing, rescued, deriveCausation, fingerprint } from "./model.ts";
export type { Causation } from "./model.ts";
export { validate, isValid, asValid } from "./constraints.ts";
export type { Violation } from "./constraints.ts";
export { utilitarian, deontological, virtue, contractualist, care, SCORERS, scoreAll, isContested } from "./scorers.ts";
export type { Scorer, Verdict, FrameworkResult } from "./scorers.ts";
export { generate } from "./generate.ts";
export type { GenerateOptions } from "./generate.ts";
export { renderDiorama, renderEditorial, renderRisograph, renderInkwash, renderAnimated, RENDER_STYLES } from "./render/index.ts";
export type { RenderOptions, RenderStyle } from "./render/index.ts";
export {
  CANON, theSwitch, footbridge, loop, fatVillain, yard, consenting, transplant, tunnel, triage, alignment,
} from "./canon.ts";
