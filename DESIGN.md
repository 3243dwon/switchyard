# Design notes

Switchyard's grammar was chosen by generating four independent ontologies — each from a
different design philosophy (minimal-orthogonal, canon-first empiricist, type-theoretic,
scene-graph) — and stress-testing each adversarially against the full canon. This document
records what survived and why, so future changes don't re-introduce a solved problem.

## The one mistake every first draft made

All four drafts **stored** the means-vs-side-effect label and trusted the author to set it
honestly. That's fatal: the entire philosophical content of the trolley problem is the
difference between the switch (side effect) and the footbridge (means), and a grammar that
lets you *assert* "this is a means" has encoded nothing. Every reviewer independently arrived
at the same fix:

> Derive causation by counterfactual — would the rescued still be rescued if the victim were
> absent? If removing the victim un-saves the others, their death is a means.

Switchyard implements a structural proxy for exactly that (`deriveCausation` in
[`src/model.ts`](src/model.ts)):

- `interpose` / `consume` → the body/organs *are* the stopper → **means**.
- `reroute` onto a segment whose `loopsBackTo` rejoins a rescued party's terminus → the loop
  closes the same counterfactual → **means**.
- any other `reroute` → the victim merely happened to be on the diverted path → **side effect**.

And `validate()` enforces `MEANS_BACKING`: a means-death that rescues no one is rejected as
incoherent. You cannot stamp "means" without a rescue that structurally depends on it.

## What was stolen from each draft

- **Cohort / Channel split** (minimal-orthogonal): identity dimensions on the noun, geometry
  dimensions on the edge. This is the orthogonality that lets the generator dial who-dies
  independently of how-they-die.
- **causation ⟂ force** (canon-empiricist, type-theoretic): the doctrine-of-double-effect axis
  and the personal-force axis are independent, so the loop (means + impersonal) and the
  footbridge (means + personal) and the switch (side effect + impersonal) are three distinct
  points, not one flat label.
- **`loopsBackTo` topology** (scene-graph): encoding the loop as a graph fact, and letting that
  fact *license* `means` under a reroute, is what makes the switch/loop distinction structural.
- **Total `fates` map** (canon-empiricist): every choice reassigns every party's fate. This is
  what makes triage — a partition over N parties, not a single victim — expressible as one
  choice, and it gives every scorer a complete accounting.
- **`baselineVictimIds` anchor** (type-theoretic): doing-vs-allowing is computed by diffing a
  choice against a fixed omission baseline, not tagged ad hoc.
- **Branded `ValidDilemma`** (type-theoretic): "validity is a constructor, not a checker."
- **`domain` as a free skin** (canon-empiricist): footbridge and transplant share a logical
  shape; the domain string is decoration, so non-rail dilemmas are first-class, not hacks.

## Known v0.1 limitations (honest list)

- **The counterfactual is a proxy, not a simulation.** `deriveCausation` reads mechanism +
  `loopsBackTo` rather than running a full causal model. It is correct on the canon and blocks
  the obvious fakes, but a determined author with exotic topology could still mislabel. v0.2
  should carry a minimal `savedDependsOn` causal edge and derive purely from it.
- **The renderer is tuned for rail-shaped dilemmas.** `triage` and `alignment` render as a
  best-effort schematic; they want their own renderers (a lifeboat grid, a dependency graph).
- **Probabilistic fates are per-party independent.** The `tunnel` models death probabilities
  per party, which doesn't capture correlated outcomes (the swerve either works or doesn't).
  Fine for expected-value scoring; revisit if a scorer needs joint distributions.
- **Scorer weights are illustrative.** The numeric penalties (means = −100, etc.) are tuned to
  produce defensible recommendations on the canon, not claimed as a calibrated moral theory.
