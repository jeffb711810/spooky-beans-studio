// CHARACTERS (owner: character agent). The cast of "The Bell Witch": outfits (bridge toon.ts Outfit), head-shape seeds,
// and the drawing resolution of a card by camera distance (picture sharpness of every character).
import { Outfit, SKINS, INK, STYLE } from "../bridge/toon";
import { CARD_FX } from "../bridge/cast";
import { paperOn } from "./look";
/** RICK-STYLE wardrobe (paper mode, user: "his style is very different, make it look more like his"): his people wear
 *  saturated colours with fine pinstripes (red shirts, teal and coral clothes, white pyjamas with blue stripes) */
const RK = paperOn();

/** PALE: paper-white faces + black stick limbs (user, after the side-by-side with the reference: "full white with black
 *  ink"): a warm BONE white rather than a cool paper white, so it reads pale and eerie under the moon and ivory by
 *  candlelight, and stays our own. Every Who goes through it (W below); false = the old peach skins. */
export const PALE = true;
const BONE = "#f6f1e8";
/** style C (user: "C ... it helps make everything so smooth ... simplified 3D/2D art"): white skin, black stick
 *  limbs and PLAIN clothes (no stitching, pockets, buttons or lapel lines) for every character */
// clean faces (user: "remove the dimples ... clean faces"): no cheek blush, no freckles; eyes, brows and mouth do the acting
const pale = (o: Outfit): Outfit => (PALE ? { ...o, skin: BONE, limb: INK, plain: true, blush: undefined, freckles: false } : o);

// 1817 Tennessee farm family. Day: John in a brown coat open over an ochre waistcoat, shirt collar, felt farm hat,
// short grey-brown beard; Lucy in a poke bonnet, shawl over a white fichu, apron; Betsy (12) in braids and a pinafore;
// the boy in a linen shirt with braces. Night: nightshirt + striped nightcap, ruffled nightgowns, a mob cap.
// Faces (chars round 2): cheek blush on Lucy and Betsy, freckles on Betsy, worry creases on John when he is scared.
const BEARD = "#7d6857", SHIRT = "#f1ead9", GOWN = "#efe8dc";
/** warm coral cheek blush (Lucy, Betsy): a coral, not a rose, so it never reads as pink-violet under the moon */
const BLUSH = "#f2826a";
// style C: John in a plain white work shirt with brown braces (was a brown coat over an ochre waistcoat); the felt hat
// and the beard say who he is
export const JOHN: Outfit = { jacket: RK ? "#c94a3c" : "#f3efe7", pants: "#3a3a44", waist: "#3a3a44", suspenders: "#5b4636", boots: "#2a1e18", hat: "brim", cap: "#4b3b2c",
  moustache: BEARD, beard: BEARD, skin: SKINS[0], collar: "#f3efe7", worry: true };
export const JOHN_BED: Outfit = { jacket: GOWN, pants: "#cfc6b2", boots: "#2a1e18", hat: "nightcap", cap: "#f2ead8", ribbon: "#a8434a", hair: BEARD, hairdo: "parted",
  moustache: BEARD, beard: BEARD, skin: SKINS[0], placket: true, collar: GOWN, worry: true };
export const LUCY: Outfit = { jacket: "#3a5670", pants: "#3a3a3e", boots: "#2a1e18", hat: "bonnet", bonnet: "#dccaa0", ribbon: "#6a2f3c", hair: "#4a3020",
  dress: "#3a5670", shawl: "#8c3f3a", collar: SHIRT, apron: "#e6dac0", skin: SKINS[2], blush: BLUSH };
export const LUCY_BED: Outfit = { jacket: RK ? "#8fcfc2" : "#efe9de", pants: "#3a3a44", boots: "#2a1e18", hat: "mobcap", ribbon: "#8fa9cf", hair: "#4a3020", hairdo: "center",
  ruffle: "#fbf8f2", placket: true, skin: SKINS[2], blush: BLUSH };
export const BETSY: Outfit = { build: "kid", jacket: "#a8434a", pants: "#3a3f52", boots: "#2a1e18", hat: "hair", hair: "#7a4a2a", hairdo: "braids", ribbon: "#6f93c9",
  dress: "#a8434a", apron: "#efe6d6", skin: SKINS[1], blush: BLUSH, freckles: true };
export const BETSY_BED: Outfit = { build: "kid", jacket: RK ? "#f4a48e" : "#f2ece0", pants: "#3a3f52", boots: "#2a1e18", hat: "hair", hair: "#7a4a2a", hairdo: "braids", ribbon: "#6f93c9",
  ruffle: "#fbf8f2", placket: true, skin: SKINS[1], blush: BLUSH, freckles: true };
export const SON: Outfit = { build: "kid", jacket: RK ? "#86c06e" : "#d8cdb4", pants: "#3a3f52", waist: "#3a3f52", suspenders: "#6a3f2a", collar: "#e9e1cf", boots: "#2a1e18",
  hat: "hair", hair: "#5a3b2a", hairdo: "tousled", skin: SKINS[0] };
/** the 1894 writer: top hat, black frock coat over a grey waistcoat, bow tie, spectacles, grey mutton chops */
export const WRITER: Outfit = { jacket: "#485a4c", pants: "#3b3f52", boots: "#1a1715", hat: "tophat", cap: "#363230", ribbon: "#962c26", hair: "#969490",
  skin: SKINS[0], vest: "#cca640", shirt: SHIRT, collar: "#f4f0e6", tie: "#231810", buttons: "#5a4020", kit: "foreman" }; // v3: the test-clip foreman (user: "he looks exactly the same" as the last video)
/** the fisherman: straw hat, ginger beard, blue work shirt, braces */
export const FISHER: Outfit = { jacket: "#7f9bb3", pants: "#4b4a3a", waist: "#4b4a3a", suspenders: "#6a3f2a", boots: "#4a3426", hat: "straw", cap: "#d8bb72",
  ribbon: "#5a2f2a", beard: "#9a5530", moustache: "#9a5530", skin: SKINS[3] };
/** neighbours: even = men (Sunday top hat, felt hat + beard, bare-headed farmhand), odd = women (bonnets, shawls, aprons) */
export const FOLK: Outfit[] = [
  { jacket: "#485a4c", pants: "#3b3f52", boots: "#4a3426", hat: "tophat", cap: "#363230", ribbon: "#962c26", vest: "#cca640", collar: "#f4f0e6", tie: "#231810", buttons: "#5a4020", hair: "#969490", kit: "foreman" }, // v3: the test-clip foreman
  { jacket: "#8f3e2e", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", bonnet: "#cfae6e", ribbon: "#3f5f8f", hair: "#6a4428", dress: "#8f3e2e", apron: "#e6dcc4", skin: SKINS[1] },
  { jacket: "#5d6a3a", pants: "#3b3f52", boots: "#4a3426", hat: "brim", cap: "#3b3226", vest: "#9a6a3a", collar: SHIRT, beard: "#3a2a20", moustache: "#3a2a20", skin: SKINS[2] },
  { jacket: "#3f6a6a", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", bonnet: "#9a8a62", ribbon: "#e6dcc4", hair: "#2a201a", dress: "#3f6a6a", shawl: "#b5653f", collar: SHIRT, skin: SKINS[3] },
  { jacket: "#e2d8c0", pants: "#4a4436", waist: "#4a4436", suspenders: "#3a2a20", collar: "#efe8d8", boots: "#4a3426", hat: "hair", hair: "#2a201a", hairdo: "parted", skin: SKINS[0] },
  { jacket: "#5a6f9a", pants: "#3b3f52", boots: "#4a3426", hat: "bonnet", bonnet: "#ece4d4", ribbon: "#7a3a36", hair: "#8a5a30", dress: "#5a6f9a", shawl: "#7a3a36", collar: SHIRT, apron: "#e9e0cc", skin: SKINS[1] },
];
export type Who = { o: Outfit; k: string; seed: number };
export const W = (o: Outfit, k: string, seed: number): Who => ({ o: pale(o), k, seed });
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

/** BANNER CAST (channel art): three ghost-hunting friends, new faces in the paper style */
export const MAX = W({ build: "kid", jacket: "#2fb3a6", pants: "#2f3a5a", boots: "#2a1e18", hat: "hair", hair: "#d0632a", hairdo: "tousled", collar: "#f3efe7", glasses: true, skin: SKINS[0] }, "max", 8);
export const ROSA = W({ jacket: "#f2c23c", pants: "#2f3a5a", boots: "#2a1e18", hat: "hair", hair: "#2a1d17", hairdo: "braids", ribbon: "#e0533a", collar: "#f3efe7", skin: SKINS[1] }, "rosa", 9);
export const GUS = W({ jacket: "#4f9e5a", pants: "#3a3a44", boots: "#2a1e18", hat: "brim", cap: "#2f4f6f", moustache: "#5a3b2a", glasses: true, vest: "#e9e1cf", tie: "#c94a3c", collar: "#f3efe7", skin: SKINS[2], worry: true }, "gus", 10);

/** WINCHESTER: Sarah Winchester, the widow (black pinstriped dress, white high collar, dark hair, gold buttons) */
export const SARAH = W({ jacket: "#24242a", pants: "#24242a", boots: "#1a1715", hat: "hood", bonnet: "#1d1e24", ribbon: "#202127", dress: "#24242a", collar: "#f0eadc", buttons: "#ded4c0", kit: "sarah" }, "sarah", 11); // v3: the test-clip widow (mourning hood + veil, lace collar, brooch)
/** WINCHESTER cast (paper style, his clothing details: buttons, braces, ties, glasses) */
export const WORKER = [
  W({ jacket: "#d9573f", pants: "#3a5f9a", waist: "#3a5f9a", suspenders: "#5b3a22", boots: "#3a2618", hat: "brim", cap: "#8a6a3c", moustache: "#5a3b2a", collar: "#f3efe7", skin: SKINS[0] }, "wk0", 21),
  W({ jacket: "#3fa8a0", pants: "#7a5a3a", waist: "#7a5a3a", suspenders: "#3a2618", boots: "#3a2618", hat: "straw", cap: "#d8bb72", ribbon: "#c94a3c", beard: "#7a4a2a", moustache: "#7a4a2a", skin: SKINS[0] }, "wk1", 22),
  W({ jacket: "#f2c23c", pants: "#5a4a3a", waist: "#5a4a3a", suspenders: "#8a3a22", boots: "#3a2618", hat: "hair", hair: "#3a2a1e", hairdo: "tousled", collar: "#f3efe7", skin: SKINS[0] }, "wk2", 23),
];
/** WINCHESTER builders, one person per role (user: "make unique characters not the same one" + "match the correct
 *  clothing style to the era"): 1880s-1920s working men - shirtsleeves, waistcoats, braces, leather aprons, flat caps,
 *  felt and straw hats, moustaches and beards; the 1922 crew wears the later flat cap / slicked centre part */
const B = (o: Partial<Outfit>, k: string, seed: number) => W({ boots: "#3a2618", collar: "#f3efe7", skin: SKINS[0], ...o } as Outfit, k, seed);
export const CREW = {
  gardener: B({ jacket: "#f3ead8", pants: "#6b5a3a", waist: "#6b5a3a", hat: "straw", cap: "#e2c77e", ribbon: "#3f7f4a", apron: "#4f8a4a", beard: "#a39a8e", beardStyle: "short", moustache: "#a39a8e", skin: SKINS[2] }, "gardener", 41),
  lumber: B({ jacket: "#cfe0ea", pants: "#3e4a5e", waist: "#3e4a5e", suspenders: "#7a3a28", hat: "cap", cap: "#5a4a3c", moustache: "#3a2a1e" }, "lumber", 42),
  apprentice: B({ jacket: "#547aaa", pants: "#4a3a2c", hat: "cap", cap: "#806e5a", hair: "#3a281c", plaid: "#405c86", apron: "#ceaa70", kerchief: "#c44030", kit: "carpenter" }, "apprentice", 43), // v3: the test-clip carpenter
  doorman: B({ jacket: "#f6f2ea", pants: "#5a5a62", waist: "#5a5a62", vest: "#2e2c2a", hat: "brim", cap: "#4a4a52", moustache: "#2a2420", buttons: "#c9a24a" }, "doorman", 44),
  roofer: B({ build: "stout", jacket: "#4f7fc0", pants: "#5a4632", waist: "#5a4632", suspenders: "#c9473a", hat: "straw", cap: "#e0c27a", ribbon: "#c9473a", beard: "#6a3f22", beardStyle: "short", moustache: "#6a3f22" }, "roofer", 45),
  farmhand: B({ jacket: "#b5562f", pants: "#4a4436", waist: "#4a4436", vest: "#6b5640", hat: "brim", cap: "#b08a56", beard: "#c8c2b8", beardStyle: "chops", moustache: "#c8c2b8", skin: SKINS[2] }, "farmhand", 46),
  sc1: B({ jacket: "#c9473a", pants: "#3a4258", waist: "#3a4258", suspenders: "#2a2420", hat: "cap", cap: "#2f3f62", moustache: "#2a1d17" }, "sc1", 47),
  sc2: B({ build: "stout", jacket: "#e8b23c", pants: "#5a4a3a", waist: "#5a4a3a", suspenders: "#5b3a22", hat: "straw", cap: "#d8bb72", ribbon: "#2f6f9a", beard: "#8a5a2a", beardStyle: "short" }, "sc2", 48),
  sc3: B({ jacket: "#f3efe4", pants: "#4a4a40", waist: "#4a4a40", vest: "#3f7f5a", buttons: "#e0b04a", hat: "hair", hair: "#1e1a18", hairdo: "parted", glasses: true }, "sc3", 49),
  bricky: B({ build: "stout", jacket: "#efe3cc", pants: "#5e4a3a", waist: "#5e4a3a", apron: "#8a5a36", hat: "cap", cap: "#7a5a3c", moustache: "#c8642a" }, "bricky", 50),
  glazier: B({ jacket: "#3fa8a0", pants: "#4a3a2c", waist: "#4a3a2c", suspenders: "#2e2a26", hat: "hair", hair: "#5a3b2a", hairdo: "parted", glasses: true }, "glazier", 51),
  run1: B({ jacket: "#d9573f", pants: "#3a5f9a", waist: "#3a5f9a", suspenders: "#5b3a22", hat: "brim", cap: "#8a6a3c", moustache: "#5a3b2a" }, "run1", 52),
  run2: B({ build: "stout", jacket: "#9fc46a", pants: "#4a4a40", waist: "#4a4a40", suspenders: "#3a2618", hat: "hair", hair: "#d8d2c8", hairdo: "center", beard: "#d8d2c8", beardStyle: "short", skin: SKINS[2] }, "run2", 53),
  nt1: B({ jacket: "#efe6d2", pants: "#4e4438", waist: "#4e4438", vest: "#7a5640", buttons: "#d9c08a", hat: "cap", cap: "#6a6a70", moustache: "#e8e4dc", skin: SKINS[2] }, "nt1", 54),
  nt2: B({ jacket: "#6f9fd8", pants: "#3a3a44", waist: "#3a3a44", suspenders: "#b08a56", hat: "hair", hair: "#2a1d17", hairdo: "center" }, "nt2", 55),
  nt3: B({ jacket: "#7f8a4a", pants: "#4a3a2c", waist: "#4a3a2c", suspenders: "#2e2a26", hat: "brim", cap: "#6a4a30", beard: "#c8642a", beardStyle: "chops" }, "nt3", 56),
};
export const PSYCHIC = W({ jacket: "#2e6f5a", pants: "#2e6f5a", boots: "#1a1715", hat: "bonnet", bonnet: "#e0a83a", ribbon: "#c94a3c", hair: "#2a1d17", dress: "#2e6f5a", shawl: "#e0a83a", collar: "#f6f1e8", buttons: "#f2c24f", skin: SKINS[1] }, "psychic", 24);
export const GUY = W({ jacket: "#3f8fd2", pants: "#33507e", boots: "#f4f1ea", hat: "hair", hair: "#6a3f22", hairdo: "tousled", skin: SKINS[0] }, "guy", 25);
export const HISTORIAN = W({ jacket: "#8a5e3c", pants: "#4a4a52", boots: "#3a2618", hat: "hair", hair: "#b8b2a8", hairdo: "parted", shirt: "#e6eef6", tie: "#2f6fb5", collar: "#e6eef6", glasses: true, buttons: "#5a3a22", skin: SKINS[2] }, "historian", 26);
export const TOURISTS = [
  W({ jacket: "#e46838", pants: "#2f4f7a", boots: "#f3efe7", hat: "ballcap", cap: "#3070b8", hair: "#80502a", pack: "#2c3a58", camera: true, logo: true, kit: "tourist" }, "tr0", 31), // v3: the test-clip tourist
  W({ jacket: "#2fb3a6", pants: "#3a3a44", boots: "#f3efe7", hat: "hair", hair: "#7a4a2a", hairdo: "braids", ribbon: "#f2c23c", skin: SKINS[1] }, "tr1", 32),
  W({ jacket: "#f08a2c", pants: "#2f3a5a", boots: "#2a2420", hat: "brim", cap: "#3f6fb5", glasses: true, moustache: "#5a3b2a", skin: SKINS[2] }, "tr2", 33),
  W({ build: "kid", jacket: "#f2c23c", pants: "#3a5f9a", boots: "#e8503c", hat: "hair", hair: "#d0632a", hairdo: "tousled", skin: SKINS[0] }, "tr3", 34),
];

// ===== SPOOKY BEANS v2 character design (user: "complete new assets, funny looking goofy characters", "match the
// narrator's voice: fun, exciting, mysterious, bouncy, silly"): scissor-cut paper edge, mixed eye assets (dots / -_- /
// googly), a cartoon nose each, and every person their own goofy silhouette (noodle, ball, pear, big head, stubby legs)
STYLE.googly = true; CARD_FX.paperCut = !STYLE.v3; // v3: no paper-cut border (Rick: ink outline only)
const look = (w: Who, shape: Outfit["shape"], nose: Outfit["nose"]) => { Object.assign(w.o, { shape, nose }); };
look(SARAH, { head: 1.12, torso: 0.9, legs: 0.7, tw: 1.06, feet: 1.2 }, "button");          // the real Sarah was 4'10": tiny, big head
look(PSYCHIC, { head: 1.05, torso: 1.0, legs: 0.72, tw: 1.3, feet: 1.3 }, "potato");          // round as a crystal ball
look(GUY, { head: 1.1, torso: 1.0, legs: 0.95, tw: 0.95, feet: 1.4 }, "bulb");
look(HISTORIAN, { head: 0.95, torso: 1.05, legs: 0.8, tw: 1.22, feet: 1.2 }, "long");         // pear-shaped professor
look(writer, { head: 0.92, torso: 1.12, legs: 1.15, tw: 0.82, feet: 1.4 }, "long");          // a beanpole lawyer
const C = CREW;
look(C.gardener, { head: 1.0, torso: 0.95, legs: 0.75, tw: 1.15, feet: 1.3 }, "potato");
look(C.lumber, { head: 0.95, torso: 1.1, legs: 1.15, tw: 0.85, feet: 1.4 }, "long");
look(C.apprentice, { head: 0.92, torso: 1.05, legs: 1.2, tw: 0.8, feet: 1.5 }, "button");    // lanky kid, huge boots
look(C.doorman, { head: 1.05, torso: 1.08, legs: 1.05, tw: 0.9, feet: 1.2 }, "long");
look(C.roofer, { head: 1.0, torso: 1.0, legs: 0.72, tw: 1.25, feet: 1.3 }, "bulb");
look(C.farmhand, { head: 1.1, torso: 0.95, legs: 0.85, tw: 1.0, feet: 1.3 }, "potato");
look(C.sc1, { head: 1.0, torso: 1.0, legs: 1.0, tw: 1.0, feet: 1.3 }, "bulb");
look(C.sc2, { head: 1.05, torso: 0.95, legs: 0.75, tw: 1.2, feet: 1.3 }, "potato");
look(C.sc3, { head: 0.95, torso: 1.12, legs: 1.15, tw: 0.82, feet: 1.3 }, "button");
look(C.bricky, { head: 1.0, torso: 0.95, legs: 0.7, tw: 1.28, feet: 1.4 }, "potato");
look(C.glazier, { head: 0.95, torso: 1.1, legs: 1.18, tw: 0.82, feet: 1.3 }, "long");
look(C.run1, { head: 1.05, torso: 1.0, legs: 1.05, tw: 0.95, feet: 1.4 }, "bulb");
look(C.run2, { head: 1.1, torso: 0.95, legs: 0.75, tw: 1.25, feet: 1.3 }, "potato");
look(C.nt1, { head: 0.95, torso: 1.1, legs: 1.1, tw: 0.85, feet: 1.3 }, "long");
look(C.nt2, { head: 1.05, torso: 1.0, legs: 0.95, tw: 1.0, feet: 1.3 }, "button");
look(C.nt3, { head: 1.0, torso: 0.95, legs: 0.78, tw: 1.2, feet: 1.4 }, "bulb");
[[{ head: 1.05, torso: 0.95, legs: 0.85, tw: 1.18, feet: 1.4 }, "button"], [{ head: 0.95, torso: 1.1, legs: 1.15, tw: 0.82, feet: 1.3 }, "button"],
 [{ head: 1.0, torso: 1.05, legs: 0.8, tw: 1.22, feet: 1.3 }, "bulb"], [{ head: 1.15, torso: 1.0, legs: 1.0, tw: 1.0, feet: 1.5 }, "button"]]
  .forEach(([sh, n], i) => look(TOURISTS[i], sh as Outfit["shape"], n as Outfit["nose"]));


// ===== BUSBY cast (user: "make them look more like his: human character"): the reference proportions and finish
// (rick: lanky, matte form shading, solid hands; glasses and moustaches allowed), our own people for our own story
const R_ = (o: Partial<Outfit>, k: string, seed: number) => B({ rick: true, ...o }, k, seed);
export const BZ = {
  busby: R_({ shape: { head: 1.1 }, jacket: "#7a2a22", pants: "#3a2a22", vest: "#c9a24a", buttons: "#e8c060", hat: "tricorn", cap: "#2a2420", ribbon: "#d9a83a", hair: "#3a281c", collar: "#f4efe2" }, "bz_busby", 61),
  auty: R_({ shape: { head: 1.05 }, jacket: "#4f73a6", pants: "#ece4d2", hat: "nightcap", cap: "#e0b04a", ribbon: "#f4efe2", hair: "#d8d2c8", moustache: "#d8d2c8" }, "bz_auty", 62),
  local1: R_({ jacket: "#ece2cc", vest: "#5a3a28", buttons: "#d9c08a", pants: "#3a3a40", hat: "cap", cap: "#6a5a48", moustache: "#5a3a22" }, "bz_local1", 63),
  local2: R_({ shape: { head: 0.94 }, jacket: "#3f6f9a", pants: "#4a3a2c", suspenders: "#7a3a28", hat: "hair", hair: "#c8642a", hairdo: "tousled" }, "bz_local2", 64),
  airman: R_({ jacket: "#7a4a2a", collar: "#f2e8d6", pants: "#4a5a3a", hat: "flight", cap: "#6a3e22" }, "bz_airman", 65),
  sweep: R_({ shape: { head: 0.9 }, jacket: "#2e2e34", pants: "#2e2e34", hat: "tophat", cap: "#1e1e22", ribbon: "#3a3a40", hair: "#2a1d17" }, "bz_sweep", 66),
  pilot: R_({ shape: { head: 0.96 }, jacket: "#5a6f9a", pants: "#4a5a7a", shirt: "#cfd8e6", collar: "#cfd8e6", tie: "#1e2a40", buttons: "#e0b04a", hat: "peaked", cap: "#3e4f72", ribbon: "#1e2a40" }, "bz_pilot", 67),
  guard: R_({ jacket: "#24304a", pants: "#24304a", buttons: "#e0b04a", hat: "peaked", cap: "#1e2840", moustache: "#3a281c" }, "bz_guard", 68),
  expert: R_({ jacket: "#8a6a3c", pants: "#4a4a52", shirt: "#e6eef6", collar: "#e6eef6", tie: "#2f6fb5", hat: "hair", hair: "#b8b2a8", hairdo: "parted", glasses: true }, "bz_expert", 69),
  landlord: R_({ shape: { head: 1.12 }, build: "stout", jacket: "#efe6d2", pants: "#4e4438", apron: "#f4efe2", hat: "hair", hair: "#3a281c", hairdo: "parted", moustache: "#3a281c" }, "bz_landlord", 70),
};
