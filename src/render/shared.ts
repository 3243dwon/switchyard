/**
 * Shared scene derivation for all renderers. Every renderer reads the SAME
 * spec-driven facts from here, so a change to a dilemma flows into every style.
 */

import type { Dilemma, Choice, Party } from "../types.ts";
import { partyById, harmedParties, deriveCausation, expectedDeaths } from "../model.ts";
import type { Causation } from "../model.ts";

export interface Scene {
  baseline: Party;     // the many (die under omission)
  act: Choice;         // the intervention being depicted
  omission?: Choice;
  victim: Party;       // the few the act harms
  causation: Causation;
  isMeans: boolean;
  isPush: boolean;     // means/personal gesture (footbridge, transplant) vs a fork (switch)
  mainCount: number;
  sideCount: number;
  edAct: number;
  edWait: number;
}

export function scene(d: Dilemma, choiceId?: string): Scene {
  const baseline = partyById(d, d.baselineVictimIds[0]);
  const act =
    (choiceId && d.choices.find((c) => c.id === choiceId)) ||
    d.choices.find((c) => c.mechanism !== "omission") ||
    d.choices[d.choices.length - 1];
  const omission = d.choices.find((c) => c.mechanism === "omission");
  const harmed = harmedParties(d, act);
  const victim = harmed.find((p) => p.id !== baseline.id) ?? harmed[0] ?? d.parties.find((p) => p.id !== baseline.id)!;
  const causation = deriveCausation(d, act, victim.id);
  return {
    baseline, act, omission, victim, causation,
    isMeans: causation === "means",
    isPush: act.mechanism === "interpose" || act.mechanism === "consume",
    mainCount: baseline.count,
    sideCount: victim.count,
    edAct: expectedDeaths(d, act),
    edWait: omission ? expectedDeaths(d, omission) : baseline.count,
  };
}

export const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const CN = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
export const cn = (n: number): string => (n >= 0 && n <= 10 ? CN[n] : String(n));
