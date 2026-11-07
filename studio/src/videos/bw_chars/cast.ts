// CHARACTERS (owner: character agent). The cast of "The Bell Witch": outfits (bridge toon.ts Outfit), head-shape seeds,
// and the drawing resolution of a card by camera distance (picture sharpness of every character).
import { Outfit, SKINS } from "../bw_chars_bridge/toon";

// 1817 Tennessee farm family. Day: John in a brown coat open over an ochre waistcoat, shirt collar, felt farm hat,
// short grey-brown beard; Lucy in a poke bonnet, shawl over a white fichu, apron; Betsy (12) in braids and a pinafore;
// the boy in a linen shirt with braces. Night: nightshirt + striped nightcap, ruffled nightgowns, a mob cap.
// Faces (chars round 2): cheek blush on Lucy and Betsy, freckles on Betsy, worry creases on John when he is scared.
const BEARD = "#7d6857", SHIRT = "#f1ead9", GOWN = "#efe8dc";
/** warm coral cheek blush (Lucy, Betsy): a coral, not a rose, so it never reads as pink-violet under the moon */
const BLUSH = "#f2826a";
export const JOHN: Outfit = { jacket: "#5b4636", pants: "#3a3a44", boots: "#2a1e18", hat: "brim", cap: "#4b3b2c", moustache: BEARD, beard: BEARD, skin: SKINS[0],
  vest: "#9a7440", shirt: SHIRT, collar: SHIRT, buttons: "#d9c27a", worry: true };
export const JOHN_BED: Outfit = { jacket: GOWN, pants: "#cfc6b2", boots: "#2a1e18", hat: "nightcap", cap: "#f2ead8", ribbon: "#a8434a", hair: BEARD, hairdo: "parted",
  moustache: BEARD, beard: BEARD, skin: SKINS[0], placket: true, collar: GOWN, worry: true };
export const LUCY: Outfit = { jacket: "#3a5670", pants: "#3a3a3e", boots: "#2a1e18", hat: "bonnet", bonnet: "#dccaa0", ribbon: "#6a2f3c", hair: "#4a3020",
  dress: "#3a5670", shawl: "#8c3f3a", collar: SHIRT, apron: "#e6dac0", skin: SKINS[2], blush: BLUSH };
export const LUCY_BED: Outfit = { jacket: "#efe9de", pants: "#3a3a44", boots: "#2a1e18", hat: "mobcap", ribbon: "#8fa9cf", hair: "#4a3020", hairdo: "center",
  ruffle: "#fbf8f2", placket: true, skin: SKINS[2], blush: BLUSH };
export const BETSY: Outfit = { build: "kid", jacket: "#a8434a", pants: "#3a3f52", boots: "#2a1e18", hat: "hair", hair: "#7a4a2a", hairdo: "braids", ribbon: "#6f93c9",
  dress: "#a8434a", apron: "#efe6d6", skin: SKINS[1], blush: BLUSH, freckles: true };
export const BETSY_BED: Outfit = { build: "kid", jacket: "#f2ece0", pants: "#3a3f52", boots: "#2a1e18", hat: "hair", hair: "#7a4a2a", hairdo: "braids", ribbon: "#6f93c9",
  ruffle: "#fbf8f2", placket: true, skin: SKINS[1], blush: BLUSH, freckles: true };
export const SON: Outfit = { build: "kid", jacket: "#d8cdb4", pants: "#3a3f52", waist: "#3a3f52", suspenders: "#6a3f2a", collar: "#e9e1cf", boots: "#2a1e18",
  hat: "hair", hair: "#5a3b2a", hairdo: "tousled", skin: SKINS[0] };
/** the 1894 writer: top hat, black frock coat over a grey waistcoat, bow tie, spectacles, grey mutton chops */
export const WRITER: Outfit = { jacket: "#2b2927", pants: "#2a2927", boots: "#1a1715", hat: "tophat", moustache: "#a9a7ae", beard: "#a9a7ae", beardStyle: "chops",
  skin: SKINS[0], vest: "#6e6a63", shirt: SHIRT, collar: SHIRT, tie: "#1d1b1a", glasses: true, buttons: "#d9c27a" };
/** the fisherman: straw hat, ginger beard, blue work shirt, braces */
export const FISHER: Outfit = { jacket: "#7f9bb3", pants: "#4b4a3a", waist: "#4b4a3a", suspenders: "#6a3f2a", boots: "#4a3426", hat: "straw", cap: "#d8bb72",
  ribbon: "#5a2f2a", beard: "#9a5530", moustache: "#9a5530", skin: SKINS[3] };
/** neighbours: even = men (Sunday top hat, felt hat + beard, bare-headed farmhand), odd = women (bonnets, shawls, aprons) */
export const FOLK: Outfit[] = [
  { jacket: "#3f5f8f", pants: "#3b3f52", boots: "#4a3426", hat: "tophat", vest: "#c9b48a", collar: SHIRT, tie: "#6a2f3c", moustache: "#4a3426", skin: SKINS[0] },
  { jacket: "#8c3b4a", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", bonnet: "#cfae6e", ribbon: "#3f5f8f", hair: "#6a4428", dress: "#8c3b4a", apron: "#e6dcc4", skin: SKINS[1] },
  { jacket: "#5d6a3a", pants: "#3b3f52", boots: "#4a3426", hat: "brim", cap: "#3b3226", vest: "#9a6a3a", collar: SHIRT, beard: "#3a2a20", moustache: "#3a2a20", skin: SKINS[2] },
  { jacket: "#3f6a6a", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", bonnet: "#9a8a62", ribbon: "#e6dcc4", hair: "#2a201a", dress: "#3f6a6a", shawl: "#b5653f", collar: SHIRT, skin: SKINS[3] },
  { jacket: "#e2d8c0", pants: "#4a4436", waist: "#4a4436", suspenders: "#3a2a20", collar: "#efe8d8", boots: "#4a3426", hat: "hair", hair: "#2a201a", hairdo: "parted", skin: SKINS[0] },
  { jacket: "#5a6f9a", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", bonnet: "#ece4d4", ribbon: "#7a3a36", hair: "#8a5a30", dress: "#5a6f9a", shawl: "#7a3a36", collar: SHIRT, apron: "#e9e0cc", skin: SKINS[1] },
];
export type Who = { o: Outfit; k: string; seed: number };
export const W = (o: Outfit, k: string, seed: number): Who => ({ o, k, seed });
export const john = W(JOHN, "john", 3), johnBed = W(JOHN_BED, "johnB", 3), lucy = W(LUCY, "lucy", 5), lucyBed = W(LUCY_BED, "lucyB", 5);
export const betsy = W(BETSY, "betsy", 2), betsyBed = W(BETSY_BED, "betsyB", 2), son = W(SON, "son", 6), writer = W(WRITER, "writer", 4), fisher = W(FISHER, "fisher", 7);
export const folk = (i: number) => W(FOLK[i % 6], "folk" + (i % 6), (i * 5 + 1) % 7 + 1);

/** card canvas [w, h, scale from the 600 x 1000 design] by camera distance (m), sized for a 1080 x 1920 final.
 *  Screen density of a card is 1920 / (2 d tan(fov/2) * 463 units/m) px per design unit = 2.07 / (d tan(fov/2)); pick the
 *  smallest step >= 0.9 x that (a 10 % stretch is invisible; minification is mip-mapped). Default fov 38 deg covers the
 *  narrow close-ups (34-40 deg); pass the real fov to save canvas size in wide shots. Steps keep the canvas pool reusable. */
const STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 3.5];
export const tier = (d: number, fov = 38): [number, number, number] => {
  const need = (0.9 * 2.073) / (Math.max(0.3, d) * Math.tan((fov * Math.PI) / 360));
  const k = STEPS.find((v) => v >= need) ?? STEPS[STEPS.length - 1];
  return [Math.round(600 * k), Math.round(1000 * k), k];
};
