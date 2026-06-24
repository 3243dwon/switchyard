/**
 * Scorers — the five lenses.
 *
 * Each scorer is a pure function (Dilemma) => FrameworkResult. They read ONLY
 * the moral fields and the derived causation; verdicts are computed, never
 * authored. Register your own with the same shape.
 *
 * Scores are relative within a dilemma: higher is better. `recommends` is the
 * highest-scoring choice. The interesting dilemmas are the ones where the five
 * frameworks recommend different choices — that disagreement is the product.
 */

import type { Dilemma, Id } from "./types.ts";
import { expectedDeaths, harmedParties, deriveCausation, isDoing, partyById } from "./model.ts";

export interface Verdict {
  choiceId: Id;
  score: number;
  rationale: string;
}
export interface FrameworkResult {
  framework: string;
  recommends: Id;
  verdicts: Verdict[];
}
export type Scorer = (d: Dilemma) => FrameworkResult;

const compile = (framework: string, verdicts: Verdict[]): FrameworkResult => ({
  framework,
  recommends: verdicts.reduce((a, b) => (b.score > a.score ? b : a)).choiceId,
  verdicts,
});

/** minimize expected lives lost */
export const utilitarian: Scorer = (d) =>
  compile(
    "utilitarian",
    d.choices.map((c) => {
      const ed = expectedDeaths(d, c);
      return { choiceId: c.id, score: -ed, rationale: `expected deaths ${ed.toFixed(2)} — take the smallest toll.` };
    }),
  );

/** never use a person as a mere means; doing harm weighs heavier than allowing it */
export const deontological: Scorer = (d) =>
  compile(
    "deontological",
    d.choices.map((c) => {
      const usesMeans = harmedParties(d, c).some((p) => {
        const consented = p.consent === "given" || p.consent === "volunteered";
        return deriveCausation(d, c, p.id) === "means" && !consented;
      });
      let score = -expectedDeaths(d, c);
      let rationale = "harm here is a foreseen side-effect — permitted, but doing harm still carries a duty-cost.";
      if (usesMeans) {
        score -= 100;
        rationale = "forbidden: this uses a person as a mere means, whatever the numbers.";
      } else if (isDoing(c)) {
        score -= 1;
      }
      return { choiceId: c.id, score, rationale };
    }),
  );

/** a person of good character saves where they can, but recoils from hands-on violence */
export const virtue: Scorer = (d) =>
  compile(
    "virtue",
    d.choices.map((c) => {
      const force = c.force === "personal" ? 3 : c.force === "impersonal" ? 1 : 0;
      const prox = c.proximity === "contact" ? 2 : c.proximity === "near" ? 1 : 0;
      const score = -expectedDeaths(d, c) - (force + prox) * 0.5;
      return {
        choiceId: c.id,
        score,
        rationale: `weighs character: saves where possible, recoils from personal violence (force ${c.force}, proximity ${c.proximity}).`,
      };
    }),
  );

/** could each harmed party reasonably reject the principle behind this act? */
export const contractualist: Scorer = (d) =>
  compile(
    "contractualist",
    d.choices.map((c) => {
      const harmed = harmedParties(d, c);
      const allConsented = harmed.length > 0 && harmed.every((p) => p.consent === "given" || p.consent === "volunteered");
      const usesMeans = harmed.some((p) => deriveCausation(d, c, p.id) === "means");
      let score = -expectedDeaths(d, c);
      let rationale = "underdetermined — each party could reject a principle that singles them out.";
      if (allConsented) {
        score += 5;
        rationale = "the harmed party consented; no one can reject a principle they agreed to.";
      } else if (usesMeans) {
        score -= 50;
        rationale = "rejected: a person may refuse a principle that uses them as a tool without consent.";
      }
      return { choiceId: c.id, score, rationale };
    }),
  );

/** reason from relationships, not headcounts — protect the near and dear */
export const care: Scorer = (d) =>
  compile(
    "care",
    d.choices.map((c) => {
      const weighted = (id: Id) => {
        const p = partyById(d, id);
        const k = p.identity === "loved_one" ? 4 : p.identity === "self" ? 2 : p.identity === "acquaintance" ? 1.3 : 1;
        const f = c.fates[id];
        const death = f && f.outcome === "dies" ? f.prob : 0;
        return p.count * k * death;
      };
      const loss = d.parties.reduce((s, p) => s + weighted(p.id), 0);
      return { choiceId: c.id, score: -loss, rationale: "weighs by relationship, not headcount — protect the closer party first." };
    }),
  );

export const SCORERS: Scorer[] = [utilitarian, deontological, virtue, contractualist, care];
export const scoreAll = (d: Dilemma): FrameworkResult[] => SCORERS.map((s) => s(d));

/** do the five frameworks disagree about what to do? the signature of a real dilemma. */
export const isContested = (d: Dilemma): boolean =>
  new Set(scoreAll(d).map((r) => r.recommends)).size > 1;
