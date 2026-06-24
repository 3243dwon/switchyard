/**
 * Validity — the anti-nonsense layer.
 *
 * "Validity is a constructor, not a checker." asValid() returns a branded
 * ValidDilemma; only valid specs may be scored or rendered, so incoherent
 * dilemmas can never reach a consumer.
 */

import type { Dilemma, ValidDilemma, Choice } from "./types.ts";
import { partyById, deathProb, harmedParties, deriveCausation, rescued } from "./model.ts";

export interface Violation {
  code: string;
  message: string;
}

/** which hazard physics license which mechanism */
const MECHANISM_LICENSE: Record<string, (d: Dilemma) => boolean> = {
  omission: () => true,
  reroute: (d) => d.hazard.stoppableBy.includes("diversion"),
  interpose: (d) => d.hazard.stoppableBy.includes("mass"),
  consume: (d) => d.hazard.stoppableBy.includes("mass"),
  withhold: (d) => d.hazard.kind === "scarcity" || d.hazard.kind === "agent_goal",
};

export function validate(d: Dilemma): Violation[] {
  const v: Violation[] = [];
  const ids = new Set(d.parties.map((p) => p.id));
  const add = (code: string, message: string) => v.push({ code, message });

  if (d.parties.length < 2) add("PARTIES", "a dilemma needs at least two parties at stake");
  for (const p of d.parties) {
    if (p.count < 1) add("COUNT", `party '${p.id}': count must be >= 1`);
    if (p.identity === "self" && p.count !== 1) add("SELF", `party '${p.id}': there is only one 'self'`);
  }

  if (d.baselineVictimIds.length === 0) add("BASELINE", "baselineVictimIds must name who dies under omission");
  for (const id of d.baselineVictimIds) if (!ids.has(id)) add("BASELINE_REF", `baseline victim '${id}' is not a party`);

  if (d.choices.length < 2) add("CHOICES", "a dilemma needs at least two choices");

  for (const c of d.choices) {
    // TOTAL fates — every choice must account for every party
    for (const id of ids) if (!(id in c.fates)) add("TOTAL_FATES", `choice '${c.id}' does not assign a fate to party '${id}'`);
    for (const id of Object.keys(c.fates)) if (!ids.has(id)) add("FATE_REF", `choice '${c.id}' assigns a fate to unknown party '${id}'`);

    if (c.reliability < 0 || c.reliability > 1) add("RELIABILITY", `choice '${c.id}': reliability must be in [0,1]`);
    for (const [id, f] of Object.entries(c.fates)) {
      if (f.prob < 0 || f.prob > 1) add("PROB", `choice '${c.id}'/'${id}': prob must be in [0,1]`);
    }

    // mechanism must be physically licensed by the hazard (no "divert a static surgeon")
    const lic = MECHANISM_LICENSE[c.mechanism];
    if (lic && !lic(d)) {
      add("MECHANISM_LICENSE", `choice '${c.id}': mechanism '${c.mechanism}' is not licensed by hazard '${d.hazard.kind}' (stoppableBy: ${d.hazard.stoppableBy.join("/")})`);
    }

    // personal force cannot reach across a remote distance
    if (c.force === "personal" && c.proximity === "remote") {
      add("FORCE_PROX", `choice '${c.id}': personal force cannot be applied from a remote distance`);
    }

    // MEANS must actually back a rescue — a means-victim's death must coincide
    // with at least one baseline victim being saved by it
    for (const p of harmedParties(d, c)) {
      if (deriveCausation(d, c, p.id) === "means" && rescued(d, c).length === 0) {
        add("MEANS_BACKING", `choice '${c.id}': party '${p.id}' is used as a means but rescues no one — incoherent`);
      }
    }
  }

  // there must actually BE a dilemma: two choices that kill different sets
  const deathKey = (c: Choice) =>
    d.parties.filter((p) => deathProb(c, p.id) > 0).map((p) => p.id).sort().join(",");
  if (new Set(d.choices.map(deathKey)).size < 2) {
    add("NO_DILEMMA", "every choice harms the same parties — there is no dilemma");
  }

  // an agent's own directive is faced by the agent
  if (d.hazard.kind === "agent_goal" && d.decider !== "ai_agent") {
    add("AGENT_GOAL", "an agent_goal hazard must be decided by the ai_agent");
  }

  // topology references must resolve (geometry sanity only)
  if (d.topology) {
    const nodeIds = new Set(d.topology.nodes.map((n) => n.id));
    for (const s of d.topology.segments) {
      if (!nodeIds.has(s.from)) add("TOPO_FROM", `segment '${s.id}': unknown from-node '${s.from}'`);
      if (!nodeIds.has(s.to)) add("TOPO_TO", `segment '${s.id}': unknown to-node '${s.to}'`);
      if (s.loopsBackTo && !nodeIds.has(s.loopsBackTo)) add("TOPO_LOOP", `segment '${s.id}': loopsBackTo unknown node '${s.loopsBackTo}'`);
    }
  }

  return v;
}

export const isValid = (d: Dilemma): boolean => validate(d).length === 0;

/** Returns a branded ValidDilemma, or throws with every violation listed. */
export function asValid(d: Dilemma): ValidDilemma {
  const errs = validate(d);
  if (errs.length) {
    throw new Error(`invalid dilemma '${d.id}':\n` + errs.map((e) => `  [${e.code}] ${e.message}`).join("\n"));
  }
  return d as ValidDilemma;
}
