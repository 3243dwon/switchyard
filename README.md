# Switchyard

**A typed, seedable grammar for moral dilemmas.** Think `faker.js`, but for the trolley problem.

Switchyard treats the trolley problem not as a webpage with a lever, but as a *composable grammar*. Every scenario it produces serializes to two things at once: a clean machine-readable **dilemma spec**, and a restrained **editorial diorama**. It's the upstream library other things import — ethics evals, teaching demos, games, quizzes — so nobody has to hand-author moral scenarios ever again.

The trolley problem stopped being a thought experiment the day we started shipping autonomous agents. This is the infrastructure for that.

```ts
import { generate, asValid, scoreAll, renderDiorama } from "@switchyard/core";

const d = asValid(generate(42));        // a reproducible dilemma from a seed
console.log(scoreAll(d));                // five ethical frameworks, each a verdict
await writeFile("d.svg", renderDiorama(d)); // ...and a diorama of the same scene
```

No build step. Node 22.6+ runs it straight from TypeScript:

```bash
node examples/demo.ts
```

---

## What makes it not-a-toy

Most trolley projects store the answer. Switchyard **derives** everything that matters, so the spec can't lie and the verdicts aren't hand-waved.

#### 1. Orthogonal grammar — dial each dimension independently
Who-dies dimensions live on the `Party` noun; how-they-die dimensions live on the `Choice`. The generator varies count, identity, desert, consent, mechanism, and personal force **independently**.

#### 2. The doctrine of double effect, *derived from structure*
This is the heart of the design. `switch` and `footbridge` have **identical 5-vs-1 counts** — the whole philosophical fight is about *how* the one dies. Switchyard never stores that label; `validate()` computes it:

| variant | mechanism | derived causation | deontology |
|---|---|---|---|
| `switch` | reroute (no loop) | `side_effect` | **permits** |
| `yard` | reroute to a dead-end spur | `side_effect` | **permits** |
| `loop` | reroute — but the track loops back | `means` | **forbids** |
| `footbridge` | push a body onto the track | `means` | **forbids** |
| `transplant` | harvest organs | `means` | **forbids** |

The `loop` is the tell: it's a *lever, just like the switch* — but because the side track rejoins the main line, the victim's body is what stops the trolley, so the grammar derives `means` from topology alone. You cannot author a footbridge that pretends to be a switch.

#### 3. Validity is a constructor, not a hope
`asValid(d)` returns a branded `ValidDilemma` or throws with every violation listed. Only valid specs can be scored or rendered — incoherent dilemmas ("divert a static surgeon", a means that rescues no one) can't reach a consumer.

#### 4. Five frameworks, pluggable, pure
`utilitarian`, `deontological`, `virtue`, `contractualist`, `care` — each a pure `(Dilemma) => FrameworkResult`. The interesting dilemmas are the **contested** ones, where the five disagree:

```
dilemma         contested?  utilitarian / deontological / virtue / contractualist / care
switch          —           act  act  act  act  act
footbridge      yes         act  wait act  wait act
loop            yes         act  wait act  wait act
transplant      yes         act  wait act  wait act
```

Register your own framework with the same shape.

---

## The grammar at a glance

```ts
interface Party  { count; identity; desert; consent; agency }      // WHO is at stake
interface Hazard { kind; stoppableBy; motion }                     // WHAT does the killing
interface Choice { mechanism; force; proximity; reliability; fates } // HOW you may act
interface Dilemma { hazard; parties; baselineVictimIds; choices; topology? }
```

- `fates` is a **total** map — every choice accounts for every party, which is what makes triage (a partition, not a single victim) first-class and lets verdicts be derived.
- `baselineVictimIds` is the fixed anchor for *doing vs. allowing*.
- `topology` is render-only geometry. Scorers never read it; renderers never read the moral fields.
- `domain` is a free "skin" — `rail`, `hospital`, `lifeboat`, `datacenter`. The footbridge and the transplant ward are the *same logical shape*, different skin.

See [`spec/dilemma-spec.md`](spec/dilemma-spec.md) for the full format and [`DESIGN.md`](DESIGN.md) for why it's shaped this way.

## The canon, expressed in the grammar

All ten ship as fixtures in [`src/canon.ts`](src/canon.ts) — the proof that the primitives regenerate what philosophers actually argue over: `switch`, `footbridge`, `loop`, `fat-villain`, `yard`, `consenting`, `transplant`, `tunnel` (probabilistic), `triage` (partition), `alignment` (an agent's directive).

## Visual styles

`renderDiorama(d, { style })` emits the same dilemma in any of four visual languages — each a pure function of the spec, so the count drives the crowd/ink-weight, the derived causation drives the "used as a means" stamp, and the mechanism picks a push gesture vs. a diverting fork.

```ts
renderDiorama(d, { style: "risograph" });  // constructivist agitprop poster (the flagship)
renderDiorama(d, { style: "inkwash" });    // 水墨 — ink weight encodes the death toll
renderDiorama(d, { style: "animated" });   // SMIL loop: the trolley rolls, the tally ticks
renderDiorama(d, { style: "editorial" });  // the clean rail schematic (default)
```

`node examples/demo.ts` renders the whole canon in every style to `out/styles/`. Because each style reads the spec rather than a fixed scene, a footbridge (`means`) and a switch (`side_effect`) come out visibly different — and seed 9,999 new dilemmas, get 9,999 coherent posters.

## Roadmap

- **Daily diorama** — a scheduled action that commits one fresh risograph/ink-wash dilemma a day; the auto-growing gallery is the storefront.
- **Five Hands** — a renderer where each ethical framework draws the *same* dilemma its own way (utilitarian sizes by headcount, deontology draws inviolable boundaries). Consumes this spec.
- **`@switchyard/py`** — a Python port of the spec + scorers, for the eval crowd.
- **Consistency fuzzer** — because every scenario is a *parametric program*, dial one variable and re-run to find where a model's moral verdict silently flips. (The one benchmark wedge the labs haven't taken.)

## License

MIT
