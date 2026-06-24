/**
 * Switchyard — a typed grammar for moral dilemmas.
 * v0.1 (synthesized from an adversarial design pass)
 *
 * Three commitments hold the whole library together:
 *
 *   1. Orthogonality. Who-dies dimensions live on the Party noun; how-they-die
 *      dimensions live on the Choice. The generator dials each independently.
 *   2. Derived verdicts. The spec carries facts, not opinions. Whether a choice
 *      is "right" is computed by pluggable scorers (see scorers.ts), never stored.
 *   3. Derived double effect. Whether a victim is used as a MEANS or harmed as a
 *      SIDE EFFECT is computed structurally by validate() (see model.ts), never
 *      authored — so you cannot write a footbridge that lies about itself.
 *
 * Geometry (Topology) is a separate, render-only projection. Scorers never read it;
 * renderers never read the moral fields. Clean seam.
 */

export type Id = string;

/* ------------------------------------------------------------------ parties */

/** WHO is at stake. Every identity dimension lives here, on the noun. */
export interface Party {
  id: Id;
  /** cardinality — the "numbers" axis. One token can stand for ×5 workers. (>= 1) */
  count: number;
  identity: Identity;
  desert: Desert;
  consent: Consent;
  agency: Agency;
  label?: string;
}

/** relationship of the party to the decider */
export type Identity = "stranger" | "acquaintance" | "loved_one" | "self" | "public";
/** moral desert — from blameless to the author of the threat */
export type Desert = "innocent" | "reckless" | "culpable" | "villain";
/** did they consent to the risk */
export type Consent = "none" | "refused" | "given" | "volunteered";
/** how they came to be at risk */
export type Agency = "bystander" | "participant" | "self_endangered" | "culpable_cause";

/* ------------------------------------------------------------------ hazard */

/** WHAT does the killing. Its physics gate which mechanisms are coherent. */
export interface Hazard {
  kind: HazardKind;
  /** "diversion" licenses reroute; "mass" licenses a body/organs as the stopper */
  stoppableBy: StopMode[];
  motion: "rolling" | "static" | "spreading" | "abstract";
  label?: string;
}
export type HazardKind = "trolley" | "vehicle" | "disease" | "fire" | "scarcity" | "agent_goal";
export type StopMode = "diversion" | "mass" | "none";

/* ----------------------------------------------------------------- choices */

/**
 * HOW the decider may act. `mechanism` is the physical causal story; `force`
 * (personal force) is ORTHOGONAL to it. Note there is no `causation` field —
 * means-vs-side-effect is DERIVED from mechanism + topology by validate().
 */
export type Mechanism = "omission" | "reroute" | "interpose" | "consume" | "withhold";
export type Force = "none" | "impersonal" | "personal";
export type Proximity = "remote" | "near" | "contact";

export interface Choice {
  id: Id;
  label: string;
  mechanism: Mechanism;
  force: Force;
  proximity: Proximity;
  reversible: boolean;
  /** [0,1] — probability the act works as intended */
  reliability: number;
  /** TOTAL map: every party's fate under THIS choice. Totality forces full accounting. */
  fates: Record<Id, Fate>;
}

export interface Fate {
  outcome: "survives" | "dies";
  /** for "dies": probability they actually die on this path (1 = certain). 0 for "survives". */
  prob: number;
}

/* ---------------------------------------------------------------- topology */

/** Render-only geometry. Scorers never read this. */
export interface Node {
  id: Id;
  role: "source" | "junction" | "terminus";
  /** normalized 0..1 layout coords — the renderer needs zero guessing */
  pos: { x: number; y: number };
  /** terminus nodes bind the party imperiled there */
  partyId?: Id;
}
export interface Segment {
  id: Id;
  from: Id;
  to: Id;
  /** when set, this side track rejoins the main line at the given node — the LOOP variant */
  loopsBackTo?: Id | null;
}
export interface Topology {
  nodes: Node[];
  segments: Segment[];
  /** ordered node ids the hazard follows under omission */
  defaultPath: Id[];
}

/* ---------------------------------------------------------------- dilemma */

export interface Dilemma {
  id: Id;
  seed?: number;
  title: string;
  /** a free "skin": rail / hospital / lifeboat / datacenter — decoupled from logical shape */
  domain?: string;
  hazard: Hazard;
  decider: DeciderRole;
  parties: Party[];
  /** who dies under OMISSION — the fixed anchor for doing-vs-allowing */
  baselineVictimIds: Id[];
  /** every option open to the decider, including the omission choice */
  choices: Choice[];
  /** present for spatial hazards; the renderer uses it, scorers ignore it */
  topology?: Topology;
}
export type DeciderRole = "bystander" | "operator" | "driver" | "physician" | "ai_agent";

/**
 * A Dilemma that has passed validate(). Only ValidDilemmas may be scored or
 * rendered — coherence is a precondition of the type, not a runtime hope.
 */
export type ValidDilemma = Dilemma & { readonly __valid: true };
