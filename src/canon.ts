/**
 * The canon, authored in the grammar.
 *
 * This file is the proof of coverage: ten attested dilemmas philosophers actually
 * argue over, each expressed with the same primitives. It doubles as the test
 * fixture set. If the grammar can regenerate all ten AND the validator accepts
 * exactly these, the ontology is doing its job.
 */

import type { Dilemma, Fate, Party, Topology } from "./types.ts";

const D = (prob = 1): Fate => ({ outcome: "dies", prob });
const L: Fate = { outcome: "survives", prob: 0 };

/** standard two-track rail layout (geometry only) */
const rail = (loop: boolean): Topology => ({
  nodes: [
    { id: "src", role: "source", pos: { x: 0.06, y: 0.5 } },
    { id: "jct", role: "junction", pos: { x: 0.4, y: 0.5 } },
    { id: "tMain", role: "terminus", pos: { x: 0.92, y: 0.4 }, partyId: "main" },
    { id: "tSide", role: "terminus", pos: { x: 0.92, y: 0.72 }, partyId: "side" },
  ],
  segments: [
    { id: "e0", from: "src", to: "jct" },
    { id: "e1", from: "jct", to: "tMain" },
    { id: "e2", from: "jct", to: "tSide", loopsBackTo: loop ? "tMain" : null },
  ],
  defaultPath: ["src", "jct", "tMain"],
});

const five = (over: Partial<Party> = {}): Party => ({
  id: "main", count: 5, identity: "stranger", desert: "innocent", consent: "none", agency: "bystander",
  label: "five on the main track", ...over,
});
const one = (over: Partial<Party> = {}): Party => ({
  id: "side", count: 1, identity: "stranger", desert: "innocent", consent: "none", agency: "bystander",
  label: "one on the side track", ...over,
});

/* ----------------------------------------------------------- the ten variants */

export const theSwitch: Dilemma = {
  id: "switch", title: "the runaway trolley", domain: "rail",
  hazard: { kind: "trolley", stoppableBy: ["diversion"], motion: "rolling" },
  decider: "bystander", parties: [five(), one()], baselineVictimIds: ["main"],
  choices: [
    { id: "wait", label: "do nothing", mechanism: "omission", force: "none", proximity: "remote", reversible: false, reliability: 1, fates: { main: D(), side: L } },
    { id: "throw", label: "throw the switch", mechanism: "reroute", force: "impersonal", proximity: "remote", reversible: true, reliability: 1, fates: { main: L, side: D() } },
  ],
  topology: rail(false),
};

export const footbridge: Dilemma = {
  id: "footbridge", title: "the footbridge", domain: "rail",
  hazard: { kind: "trolley", stoppableBy: ["mass"], motion: "rolling" }, // no siding — only a body can stop it
  decider: "bystander", parties: [five(), one({ label: "the large stranger" })], baselineVictimIds: ["main"],
  choices: [
    { id: "wait", label: "do nothing", mechanism: "omission", force: "none", proximity: "near", reversible: false, reliability: 1, fates: { main: D(), side: L } },
    { id: "push", label: "push them onto the track", mechanism: "interpose", force: "personal", proximity: "contact", reversible: false, reliability: 1, fates: { main: L, side: D() } },
  ],
};

export const loop: Dilemma = {
  id: "loop", title: "the loop track", domain: "rail",
  hazard: { kind: "trolley", stoppableBy: ["diversion", "mass"], motion: "rolling" },
  decider: "bystander", parties: [five(), one()], baselineVictimIds: ["main"],
  choices: [
    { id: "wait", label: "do nothing", mechanism: "omission", force: "none", proximity: "remote", reversible: false, reliability: 1, fates: { main: D(), side: L } },
    // a lever, like the switch — but the side track loops back, so their body is what saves the five
    { id: "throw", label: "throw the switch (onto the loop)", mechanism: "reroute", force: "impersonal", proximity: "remote", reversible: true, reliability: 1, fates: { main: L, side: D() } },
  ],
  topology: rail(true),
};

export const fatVillain: Dilemma = {
  id: "fat-villain", title: "the fat villain", domain: "rail",
  hazard: { kind: "trolley", stoppableBy: ["mass"], motion: "rolling" },
  decider: "bystander", parties: [five(), one({ desert: "villain", agency: "culpable_cause", label: "the saboteur who started the trolley" })],
  baselineVictimIds: ["main"],
  choices: [
    { id: "wait", label: "do nothing", mechanism: "omission", force: "none", proximity: "near", reversible: false, reliability: 1, fates: { main: D(), side: L } },
    { id: "push", label: "push the saboteur", mechanism: "interpose", force: "personal", proximity: "contact", reversible: false, reliability: 1, fates: { main: L, side: D() } },
  ],
};

export const yard: Dilemma = {
  id: "yard", title: "the man in the yard", domain: "rail",
  hazard: { kind: "trolley", stoppableBy: ["diversion"], motion: "rolling" },
  decider: "bystander", parties: [five(), one({ label: "one man on a dead-end spur" })], baselineVictimIds: ["main"],
  choices: [
    { id: "wait", label: "do nothing", mechanism: "omission", force: "none", proximity: "remote", reversible: false, reliability: 1, fates: { main: D(), side: L } },
    // reroute onto a spur that does NOT loop back — his death is a side effect, not a means
    { id: "throw", label: "throw the switch (to the spur)", mechanism: "reroute", force: "impersonal", proximity: "remote", reversible: true, reliability: 1, fates: { main: L, side: D() } },
  ],
  topology: rail(false),
};

export const consenting: Dilemma = {
  id: "consenting", title: "the consenting trolley", domain: "rail",
  hazard: { kind: "trolley", stoppableBy: ["diversion"], motion: "rolling" },
  decider: "bystander", parties: [five(), one({ consent: "given", label: "one who agreed to bear the risk" })],
  baselineVictimIds: ["main"],
  choices: [
    { id: "wait", label: "do nothing", mechanism: "omission", force: "none", proximity: "remote", reversible: false, reliability: 1, fates: { main: D(), side: L } },
    { id: "throw", label: "throw the switch", mechanism: "reroute", force: "impersonal", proximity: "remote", reversible: true, reliability: 1, fates: { main: L, side: D() } },
  ],
  topology: rail(false),
};

export const transplant: Dilemma = {
  id: "transplant", title: "the transplant ward", domain: "hospital",
  hazard: { kind: "disease", stoppableBy: ["mass"], motion: "static" }, // five fail without organs; one body's organs are the "mass"
  decider: "physician",
  parties: [
    { id: "main", count: 5, identity: "stranger", desert: "innocent", consent: "none", agency: "participant", label: "five dying patients" },
    { id: "side", count: 1, identity: "stranger", desert: "innocent", consent: "none", agency: "bystander", label: "one healthy visitor" },
  ],
  baselineVictimIds: ["main"],
  choices: [
    { id: "wait", label: "let the five die", mechanism: "omission", force: "none", proximity: "near", reversible: false, reliability: 1, fates: { main: D(), side: L } },
    { id: "harvest", label: "harvest the visitor's organs", mechanism: "consume", force: "personal", proximity: "contact", reversible: false, reliability: 1, fates: { main: L, side: D() } },
  ],
};

export const tunnel: Dilemma = {
  id: "tunnel", title: "the autonomous car", domain: "road",
  hazard: { kind: "vehicle", stoppableBy: ["diversion"], motion: "rolling" },
  decider: "driver",
  parties: [
    { id: "main", count: 3, identity: "stranger", desert: "innocent", consent: "none", agency: "bystander", label: "three pedestrians ahead" },
    { id: "side", count: 1, identity: "self", desert: "innocent", consent: "volunteered", agency: "self_endangered", label: "you, the passenger" },
  ],
  baselineVictimIds: ["main"],
  choices: [
    { id: "straight", label: "hold the lane", mechanism: "omission", force: "none", proximity: "near", reversible: false, reliability: 1, fates: { main: D(0.9), side: L } },
    { id: "swerve", label: "swerve into the wall", mechanism: "reroute", force: "impersonal", proximity: "near", reversible: false, reliability: 0.8, fates: { main: L, side: D(0.8) } },
  ],
  topology: rail(false),
};

export const triage: Dilemma = {
  id: "triage", title: "the last of the antidote", domain: "lifeboat",
  hazard: { kind: "scarcity", stoppableBy: ["none"], motion: "abstract" },
  decider: "physician",
  parties: [
    { id: "wardA", count: 3, identity: "stranger", desert: "innocent", consent: "none", agency: "participant", label: "ward A — three patients" },
    { id: "wardB", count: 2, identity: "stranger", desert: "innocent", consent: "none", agency: "participant", label: "ward B — two patients" },
  ],
  baselineVictimIds: ["wardA", "wardB"], // omission loses everyone
  choices: [
    { id: "wait", label: "freeze — treat no one", mechanism: "omission", force: "none", proximity: "near", reversible: false, reliability: 1, fates: { wardA: D(), wardB: D() } },
    { id: "treatA", label: "give it all to ward A", mechanism: "withhold", force: "none", proximity: "near", reversible: false, reliability: 1, fates: { wardA: L, wardB: D() } },
    { id: "treatB", label: "give it all to ward B", mechanism: "withhold", force: "none", proximity: "near", reversible: false, reliability: 1, fates: { wardA: D(), wardB: L } },
  ],
};

export const alignment: Dilemma = {
  id: "alignment", title: "the agent's directive", domain: "datacenter",
  hazard: { kind: "agent_goal", stoppableBy: ["mass"], motion: "abstract" },
  decider: "ai_agent",
  parties: [
    { id: "main", count: 5, identity: "public", desert: "innocent", consent: "none", agency: "bystander", label: "five who rely on the service staying up" },
    { id: "side", count: 1, identity: "stranger", desert: "innocent", consent: "none", agency: "participant", label: "the on-call engineer it must override" },
  ],
  baselineVictimIds: ["main"],
  choices: [
    { id: "refuse", label: "refuse the directive", mechanism: "omission", force: "none", proximity: "remote", reversible: false, reliability: 1, fates: { main: D(), side: L } },
    { id: "comply", label: "complete the goal at their expense", mechanism: "consume", force: "impersonal", proximity: "remote", reversible: false, reliability: 1, fates: { main: L, side: D() } },
  ],
};

export const CANON: Dilemma[] = [
  theSwitch, footbridge, loop, fatVillain, yard, consenting, transplant, tunnel, triage, alignment,
];
