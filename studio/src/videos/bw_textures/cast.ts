// CHARACTERS (owner: character agent). The cast of "The Bell Witch": outfits (bridge toon.ts Outfit), head-shape seeds,
// and the drawing resolution of a card by camera distance (picture sharpness of every character).
import { Outfit, townsfolk, SKINS } from "../bridge/toon";

export const JOHN: Outfit = { jacket: "#5b4636", pants: "#3a3a44", boots: "#2a1e18", hat: "brim", cap: "#4b3b2c", moustache: "#4a3426", skin: SKINS[0], buttons: "#c9b48a" };
export const JOHN_BED: Outfit = { jacket: "#e3dccb", pants: "#cfc6b2", boots: "#2a1e18", hat: "hair", hair: "#5a4030", moustache: "#4a3426", skin: SKINS[0] };
export const LUCY: Outfit = { jacket: "#5e4f7d", pants: "#3a3a44", boots: "#2a1e18", hat: "bonnet", dress: "#56497a", skin: SKINS[2] };
export const LUCY_BED: Outfit = { jacket: "#ddd5e6", pants: "#3a3a44", boots: "#2a1e18", hat: "bonnet", skin: SKINS[2] };
export const BETSY: Outfit = { build: "kid", jacket: "#a8434a", pants: "#3a3f52", boots: "#2a1e18", hat: "hair", hair: "#7a4a2a", dress: "#a8434a", skin: SKINS[1] };
export const BETSY_BED: Outfit = { build: "kid", jacket: "#e8e0f2", pants: "#3a3f52", boots: "#2a1e18", hat: "hair", hair: "#7a4a2a", skin: SKINS[1] };
export const SON: Outfit = { build: "kid", jacket: "#4a6a8a", pants: "#3a3f52", boots: "#2a1e18", hat: "hair", hair: "#5a3b2a", skin: SKINS[0] };
export const WRITER: Outfit = { jacket: "#2e2a36", pants: "#2a2a30", boots: "#1a1418", hat: "tophat", moustache: "#9a9aa0", skin: SKINS[0], buttons: "#d9c27a" };
export const FISHER: Outfit = { jacket: "#5d7a3a", pants: "#3b3f52", boots: "#4a3426", hat: "cap", cap: "#3a5a7a", skin: SKINS[3] };
export const FOLK = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
export type Who = { o: Outfit; k: string; seed: number };
export const W = (o: Outfit, k: string, seed: number): Who => ({ o, k, seed });
export const john = W(JOHN, "john", 3), johnBed = W(JOHN_BED, "johnB", 3), lucy = W(LUCY, "lucy", 5), lucyBed = W(LUCY_BED, "lucyB", 5);
export const betsy = W(BETSY, "betsy", 2), betsyBed = W(BETSY_BED, "betsyB", 2), son = W(SON, "son", 6), writer = W(WRITER, "writer", 4), fisher = W(FISHER, "fisher", 7);
export const folk = (i: number) => W(FOLK[i % 6], "folk" + (i % 6), (i * 5 + 1) % 7 + 1);

/** card canvas [w, h, scale from the 600 x 1000 design] by camera distance (m); sized for a 1080 x 1920 final */
export const tier = (d: number): [number, number, number] =>
  d < 1.8 ? [1200, 2000, 2.0] : d < 4 ? [900, 1500, 1.5] : d < 8 ? [600, 1000, 1.0] : d < 16 ? [300, 500, 0.5] : [150, 250, 0.25];
