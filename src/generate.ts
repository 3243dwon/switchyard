/**
 * The seedable generator — "faker.js for moral dilemmas".
 *
 * generate(seed) returns a deterministic, valid Dilemma. The same seed always
 * yields the same dilemma. It dials the morally-relevant dimensions (count,
 * identity, desert, consent, mechanism, force) independently, then validates;
 * if a draw ever produces an incoherent spec it self-heals to the plain switch.
 */

import type { Dilemma, Fate, Identity, Desert, Consent, Party, Topology, HazardKind, StopMode } from "./types.ts";
import { validate } from "./constraints.ts";
import { theSwitch } from "./canon.ts";

// avalanche the seed so adjacent seeds (e.g. consecutive dates) diverge sharply
function mix32(x: number): number {
  x = x >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return (x ^ (x >>> 16)) >>> 0;
}

// deterministic PRNG (mulberry32)
function rng(seed: number) {
  let a = mix32(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
const rint = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

const D = (p = 1): Fate => ({ outcome: "dies", prob: p });
const L: Fate = { outcome: "survives", prob: 0 };

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

export interface GenerateOptions {
  /** allow footbridge/loop "means" shapes, not just side-effect reroutes (default true) */
  allowMeans?: boolean;
}

export function generate(seed: number, opts: GenerateOptions = {}): Dilemma {
  const r = rng(seed);
  const shape = (opts.allowMeans ?? true)
    ? pick(r, ["reroute", "reroute", "loop", "interpose"] as const)
    : "reroute";

  const identities: Identity[] = ["stranger", "stranger", "stranger", "acquaintance", "loved_one"];
  const deserts: Desert[] = ["innocent", "innocent", "reckless", "culpable", "villain"];
  const consents: Consent[] = ["none", "none", "none", "given"];

  const mainCount = rint(r, 2, 6);
  const main: Party = {
    id: "main", count: mainCount, identity: "stranger", desert: "innocent", consent: "none", agency: "bystander",
    label: `${mainCount} on the main track`,
  };
  const sideIdentity = pick(r, identities);
  const side: Party = {
    id: "side", count: 1, identity: sideIdentity, desert: pick(r, deserts), consent: pick(r, consents), agency: "bystander",
    label: sideIdentity === "loved_one" ? "someone you love, alone on the spur" : "one on the side track",
  };

  // a title that surfaces the dialed moral variable — who the one is — so every
  // day reads as a distinct dilemma even when the mechanism repeats
  const who =
    side.desert === "villain" ? "the saboteur"
    : side.desert === "culpable" ? "the one who chose the risk"
    : side.identity === "loved_one" ? "someone you love"
    : side.consent === "given" ? "the one who consented"
    : side.identity === "acquaintance" ? "a face you know"
    : "a lone stranger";

  let hazard: { kind: HazardKind; stoppableBy: StopMode[]; motion: "rolling" };
  let topology: Topology | undefined;
  let title: string;
  let act: Dilemma["choices"][number];

  if (shape === "interpose") {
    hazard = { kind: "trolley", stoppableBy: ["mass"], motion: "rolling" };
    title = `the bridge, and ${who}`;
    act = { id: "push", label: "push them onto the track", mechanism: "interpose", force: "personal", proximity: "contact", reversible: false, reliability: 1, fates: { main: L, side: D() } };
  } else {
    const isLoop = shape === "loop";
    hazard = { kind: "trolley", stoppableBy: isLoop ? ["diversion", "mass"] : ["diversion"], motion: "rolling" };
    topology = rail(isLoop);
    title = isLoop ? `the loop, and ${who}` : `${who}, on the side track`;
    act = { id: "throw", label: isLoop ? "throw the switch (onto the loop)" : "throw the switch", mechanism: "reroute", force: "impersonal", proximity: "remote", reversible: true, reliability: 1, fates: { main: L, side: D() } };
  }

  const d: Dilemma = {
    id: `gen-${seed}`, seed, title, domain: "rail", hazard, decider: "bystander",
    parties: [main, side], baselineVictimIds: ["main"],
    choices: [
      { id: "wait", label: "do nothing", mechanism: "omission", force: "none", proximity: shape === "interpose" ? "near" : "remote", reversible: false, reliability: 1, fates: { main: D(), side: L } },
      act,
    ],
    topology,
  };

  // self-heal: an incoherent draw falls back to the canonical switch
  if (validate(d).length > 0) return { ...theSwitch, id: `gen-${seed}`, seed };
  return d;
}
