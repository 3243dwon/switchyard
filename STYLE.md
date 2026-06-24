# Switchyard — art bible

The visual identity is split by **medium**, because each renderer should play to its strength.

## The two production lanes

| lane | styles | tool | why |
|---|---|---|---|
| **Graphic** | `risograph`, `inkwash`, `animated`, `editorial` | hand-authored **SVG**, spec-driven, in-engine | vector excels at flat color, screentone, type, schematic clarity, and deterministic reproducibility |
| **Hero anime** | the cinematic key visual | **image generation** (NijiJourney 6), prompted by `animePrompt(d)` | character-grade anime has a hard ceiling in hand-coded bezier; an anime-specialised model is the right tool |

The engine produces SVG for the graphic lane and a **prompt** for the hero lane — same spec, two outputs.

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
