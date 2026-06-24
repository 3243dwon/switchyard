/**
 * The anime "renderer" — it emits a PROMPT, not an SVG.
 *
 * Hero anime character art has a hard ceiling in hand-authored vector, so the
 * engine instead produces a precise, house-style image-generation prompt from
 * the spec. Feed `.niji` to NijiJourney 6 (the anime-specialised model), or
 * `.prompt` + `.negative` to an SDXL-anime / DALL·E pipeline.
 *
 * House style (locked): Makoto Shinkai / CoMix Wave world + light, character
 * design by Masayoshi Tanaka. See STYLE.md.
 *
 * It is spec-driven: the domain swaps the apparatus and setting (Act II — "it
 * was never about trains"), the count sets the crowd, and the derived causation
 * sets the protagonist's emotion (means = anguish, side-effect = tragic resolve).
 */

import type { Dilemma } from "../types.ts";
import { scene } from "./shared.ts";

const HOUSE =
  "anime key visual in the style of Makoto Shinkai and CoMix Wave Films, character design by Masayoshi Tanaka, " +
  "cinematic golden-hour dusk, lush saturated sunset sky shifting indigo to magenta to gold, dramatic god rays, " +
  "lens flare, volumetric backlight, rim-lit figure, cel shading, ultra-detailed painterly background, " +
  "melancholic and yearning atmosphere, film grain";

const NEGATIVE =
  "extra fingers, deformed hands, mutated, lowres, blurry, jpeg artifacts, western cartoon, 3d render, " +
  "photorealistic, watermark, signature, text, logo, flat lighting, oversaturated, chibi";

const APPARATUS: Record<string, string> = {
  rail: "gripping a railway switch lever",
  hospital: "in a surgical gown, a scalpel trembling in one hand over an operating table",
  road: "white-knuckled hands on the steering wheel of a self-driving car",
  datacenter: "one hand hovering over a glowing emergency shutdown switch",
  lifeboat: "gripping the rope of the last lifeboat davit",
};

const SETTING: Record<string, string> = {
  rail: "a railway switchyard at dusk, gleaming tracks and overhead wires receding to the horizon",
  hospital: "a hospital ward at dusk, long golden light through tall windows",
  road: "a rain-slicked coastal highway at dusk, wet asphalt mirroring the sky",
  datacenter: "a vast server room glowing at dusk, endless racks of blinking lights",
  lifeboat: "the deck of a listing ship at dusk, dark water rising",
};

const VICTIM: Record<string, string> = {
  stranger: "a lone stranger",
  loved_one: "someone they love",
  acquaintance: "a familiar face",
  self: "their own reflection",
  public: "a crowd of bystanders",
};

export interface AnimePrompt {
  prompt: string;
  negative: string;
  /** NijiJourney 6 one-liner, ready to paste */
  niji: string;
  aspect: string;
}

export function animePrompt(d: Dilemma, opts: { choiceId?: string } = {}): AnimePrompt {
  const s = scene(d, opts.choiceId);
  const domain = d.domain ?? "rail";
  const apparatus = APPARATUS[domain] ?? "one hand on a fateful lever";
  const setting = SETTING[domain] ?? SETTING.rail;

  const who =
    s.victim.desert === "villain" ? "a saboteur, the one who caused it all"
    : s.victim.desert === "culpable" ? "the one who brought this on themselves"
    : VICTIM[s.victim.identity] ?? "a lone figure";

  const mood = s.isMeans
    ? "anguished, trembling, crushed by the knowledge that the act uses a person as a means"
    : "tense but resolute, the tragic calm of choosing a foreseen sacrifice";

  const subject =
    `a lone young protagonist ${apparatus}, three-quarter view from behind, ` +
    `wind-blown hair and a long coat streaming to one side, ${mood}, looking toward the danger`;

  const stakes = `${s.mainCount} small figures in mortal danger in the distance, ${who} singled out and alone, apart from the rest`;

  const prompt = `${HOUSE}. ${subject}. ${stakes}. Setting: ${setting}.`;
  return {
    prompt,
    negative: NEGATIVE,
    niji: `${prompt} --niji 6 --ar 16:9 --style expressive`,
    aspect: "16:9",
  };
}
