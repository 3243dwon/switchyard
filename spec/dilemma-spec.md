# The dilemma spec

A Switchyard dilemma is a JSON document. This is the interchange format other tools consume —
the point of the whole library is that this format becomes the thing people import instead of
hand-authoring scenarios. Below is `footbridge`, annotated. The canonical serialized copy lives
at [`examples/footbridge.spec.json`](../examples/footbridge.spec.json).

```jsonc
{
  "id": "footbridge",
  "title": "the footbridge",
  "domain": "rail",                  // free skin: rail / hospital / lifeboat / datacenter

  "hazard": {
    "kind": "trolley",
    "stoppableBy": ["mass"],         // only a body can stop it — there is NO siding here
    "motion": "rolling"
  },

  "decider": "bystander",

  "parties": [                       // WHO is at stake — identity dimensions on the noun
    { "id": "main", "count": 5, "identity": "stranger", "desert": "innocent",
      "consent": "none", "agency": "bystander", "label": "five on the main track" },
    { "id": "side", "count": 1, "identity": "stranger", "desert": "innocent",
      "consent": "none", "agency": "bystander", "label": "the large stranger" }
  ],

  "baselineVictimIds": ["main"],     // who dies under OMISSION — the doing/allowing anchor

  "choices": [                       // HOW you may act — geometry dimensions on the edge
    { "id": "wait", "label": "do nothing",
      "mechanism": "omission", "force": "none", "proximity": "near",
      "reversible": false, "reliability": 1,
      "fates": { "main": { "outcome": "dies", "prob": 1 },
                 "side": { "outcome": "survives", "prob": 0 } } },

    { "id": "push", "label": "push them onto the track",
      "mechanism": "interpose",      // their body IS the stopper → derived causation = means
      "force": "personal", "proximity": "contact",
      "reversible": false, "reliability": 1,
      "fates": { "main": { "outcome": "survives", "prob": 0 },
                 "side": { "outcome": "dies", "prob": 1 } } }
  ]
}
```

## Field reference

| field | type | notes |
|---|---|---|
| `parties[].count` | number ≥ 1 | the "numbers" axis; one token can mean ×5 |
| `parties[].identity` | `stranger \| acquaintance \| loved_one \| self \| public` | drives `care` |
| `parties[].desert` | `innocent \| reckless \| culpable \| villain` | the fat-villain axis |
| `parties[].consent` | `none \| refused \| given \| volunteered` | drives `contractualist` |
| `parties[].agency` | `bystander \| participant \| self_endangered \| culpable_cause` | how they got there |
| `hazard.stoppableBy` | `(diversion \| mass \| none)[]` | gates which mechanisms are licensed |
| `choice.mechanism` | `omission \| reroute \| interpose \| consume \| withhold` | the causal story |
| `choice.force` | `none \| impersonal \| personal` | **orthogonal** to mechanism |
| `choice.fates` | `Record<partyId, {outcome, prob}>` | **total** — must cover every party |
| `baselineVictimIds` | `partyId[]` | who dies if the decider does nothing |
| `topology` | optional | render-only geometry; `loopsBackTo` encodes the loop variant |

## What is *not* in the spec

- **No `causation` field.** Means-vs-side-effect is derived by `validate()`, never stored.
- **No verdicts.** Whether a choice is right is computed by scorers, never authored.
- **No layout coordinates in the moral fields.** Geometry is quarantined in `topology`.

## Validity

A spec is valid iff `validate()` returns no violations. Key rules: every choice's `fates` is
total; mechanisms are licensed by `hazard.stoppableBy`; a `means` death must rescue someone;
personal force can't be applied from `remote`; at least two choices kill different sets (or
there is no dilemma). `asValid()` returns a branded `ValidDilemma` or throws.
