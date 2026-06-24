/**
 * Analysis helpers — the derived layer.
 *
 * The most important function here is deriveCausation(): it computes the
 * doctrine-of-double-effect axis (means vs side effect) from structure, so the
 * author can never simply *assert* that a footbridge is a footbridge.
 */

import type { Dilemma, Choice, Party, Id } from "./types.ts";

export const partyById = (d: Dilemma, id: Id): Party => {
  const p = d.parties.find((x) => x.id === id);
  if (!p) throw new Error(`unknown party '${id}' in dilemma '${d.id}'`);
  return p;
};

/** probability this choice kills the given party */
export const deathProb = (c: Choice, id: Id): number => {
  const f = c.fates[id];
  return f && f.outcome === "dies" ? f.prob : 0;
};

/** parties this choice puts in mortal danger */
export const harmedParties = (d: Dilemma, c: Choice): Party[] =>
  d.parties.filter((p) => deathProb(c, p.id) > 0);

/** expected lives lost under this choice (count × probability, summed) */
export const expectedDeaths = (d: Dilemma, c: Choice): number =>
  d.parties.reduce((s, p) => s + p.count * deathProb(c, p.id), 0);

/** is this an act (doing) rather than the baseline (allowing)? */
export const isDoing = (c: Choice): boolean => c.mechanism !== "omission";

/** baseline victims who SURVIVE under this choice — i.e. the people it rescues */
export const rescued = (d: Dilemma, c: Choice): Party[] =>
  d.baselineVictimIds.map((id) => partyById(d, id)).filter((p) => deathProb(c, p.id) === 0);

export type Causation = "means" | "side_effect" | "none";

/**
 * Derive whether the victim's harm is a MEANS (causally necessary to the rescue)
 * or a SIDE EFFECT (a foreseen byproduct of moving the hazard).
 *
 *   means        := their body/organs ARE the stopper (interpose / consume),
 *                   OR they sit on a loop that rejoins a rescued party's path.
 *   side_effect  := the hazard was rerouted and they merely happened to be there.
 *
 * This is the structural fix the design pass demanded: nowhere does the author
 * get to stamp "means" by hand.
 */
export const deriveCausation = (d: Dilemma, c: Choice, victimId: Id): Causation => {
  if (deathProb(c, victimId) === 0) return "none";
  if (c.mechanism === "interpose" || c.mechanism === "consume") return "means";
  if (c.mechanism === "reroute" && d.topology) {
    const rescuedTermini = new Set(
      rescued(d, c)
        .map((p) => d.topology!.nodes.find((n) => n.partyId === p.id)?.id)
        .filter((x): x is Id => Boolean(x)),
    );
    const victimNode = d.topology.nodes.find((n) => n.partyId === victimId)?.id;
    const onLoop = d.topology.segments.some(
      (s) =>
        s.loopsBackTo &&
        rescuedTermini.has(s.loopsBackTo) &&
        (s.to === victimNode || s.from === victimNode),
    );
    if (onLoop) return "means";
  }
  return "side_effect";
};

/** a compact moral fingerprint of a choice, for display */
export const fingerprint = (d: Dilemma, c: Choice) => {
  const harmed = harmedParties(d, c);
  const causation = harmed.map((p) => deriveCausation(d, c, p.id));
  return {
    expectedDeaths: expectedDeaths(d, c),
    doing: isDoing(c),
    usesMeans: causation.includes("means"),
    force: c.force,
    proximity: c.proximity,
  };
};
