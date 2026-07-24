# Switchyard — art bible

The visual identity is split by **medium**, because each renderer should play to its strength.

## The three production lanes

| lane | styles | tool | why |
|---|---|---|---|
| **Graphic** | `risograph`, `inkwash`, `animated`, `editorial` | hand-authored **SVG**, spec-driven, in-engine | vector excels at flat color, screentone, type, schematic clarity, and deterministic reproducibility |
| **Hero anime** | the cinematic key visual | **image generation** (NijiJourney 6), prompted by `animePrompt(d)` | character-grade anime has a hard ceiling in hand-coded bezier; an anime-specialised model is the right tool |
| **The experience** | the two deployed chapters | [`scripts/_design.ts`](scripts/_design.ts) — the white room | a reader making a decision needs a diagram, not a mood |

The engine produces SVG for the graphic lane and a **prompt** for the hero lane — same spec, two outputs.

## The experience is its own lane

The Shinkai dusk below governs the **renderers and the hero prompts**. It does not
govern the deployed chapters, and that separation is deliberate.

The trolley problem was published in 1967 as a diagram; the melodrama came later.
A saturated dusk with god-rays and a bloom on impact makes five deaths look like a
film still, and the reader gets to *feel* something instead of *decide* something.
The white room refuses that trade: near-white ground, one uninterrupted sheet,
New York for the fiction and SF Pro for the interface, and greyscale everywhere
except a single signal colour that belongs to the hazard and to nothing else.

Two things carry over rather than being invented twice:

- **The accent is `CORAL #D85A30` / `CORALDARK #993C1D`**, taken from
  [`src/render/editorial.ts`](src/render/editorial.ts) — so the library's own
  renderer and the deployed pages share one accent by construction.
- **A person is the `person()` glyph** from the same file: head, rounded
  shoulders, no face. Chapter two's rule — *a hierarchy of lives, never a face* —
  now applies to both chapters and to the editorial renderer alike.

Death is drawn, never faded: the glyph's fill drops out and leaves an outline,
present and empty and exactly where it was, and one line is struck through the
group's baseline. Fading a party out on white would let them dissolve into the
paper, which is the aestheticization the lane exists to avoid.

## House style (locked)

Decided after a four-hand comparison (Shinkai·Tanaka / CLAMP / Amano / Ghibli):

- **World + light: Makoto Shinkai / CoMix Wave Films.** Saturated dusk skies (indigo → magenta → gold), god rays, lens flare, volumetric backlight, rim-lit figures, melancholic atmosphere. This is the look the project was anchored on from the start.
- **Character design: Masayoshi Tanaka** (Shinkai's own designer — *your name*, *Weathering With You*). Clean, modern, ~7.5-head proportions, expressive but grounded. Chosen for **coherence** with the lighting and the yearning register the dilemma wants.
- **Do not blend hands.** A blended figure reads as the soulless "anime average." Reference one hand and commit. CLAMP's elongated fate-coded look is reserved for occasional **special-edition covers**, not the house style.

## Palette (shared across lanes)

The Shinkai dusk gradient and the figure values, as used by the renderers:

```
sky      indigo #2b2a55 → violet #6b4f86 → rose #c75f81 → amber #ef9a5a → gold #f7c873
figure   core #241B38 (never pure black) ; ambient plane #4A4660 ; core shadow #15101F
rim      transition #FFB259 → saturated #FF8A3D / #FFC27A → white-hot cap #FFF0C8
bounce   cool teal #3E5A6B with a #5B8299 edge sliver
lit face #CB9A82 ; catchlight #FFF6E8
```

## Hero-art prompting

`animePrompt(d)` returns `{ prompt, negative, niji, aspect }`, driven by the spec:

- **domain** swaps the apparatus + setting (rail → switch lever; hospital → scalpel; road → steering wheel; datacenter → kill-switch; lifeboat → davit rope) — the engine's way of saying *it was never about trains*.
- **count** sets the crowd in danger.
- **derived causation** sets the protagonist's emotion: `means` → anguish (using a person as a tool); `side_effect` → tragic resolve.

```ts
import { animePrompt, footbridge } from "@switchyard/core";
console.log(animePrompt(footbridge).niji);   // paste into NijiJourney 6
```

Standing **negative prompt**: `extra fingers, deformed hands, mutated, lowres, blurry, western cartoon, 3d render, photorealistic, watermark, text, flat lighting, oversaturated, chibi`.
