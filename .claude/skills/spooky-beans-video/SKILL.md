---
name: spooky-beans-video
description: Make an "Allegedly Haunted" / Spooky Beans vertical short (60-80 s): 2D cartoon characters built by the v3 framework (style/CARTOON_FRAMEWORK.md) living in a painted 3D world (Remotion + three.js), Aiden narration, captions, original bouncy-mystery score + SFX, rendered in true 4K with phone-safe encodes. Use for any new Spooky Beans / Allegedly Haunted video, edits to the Winchester or Bell Witch shorts, character / world / camera / audio work in this repo, or when the user says "make another one like Winchester".
---

# Spooky Beans studio (this repo)

## RICK'S RULES: NON-NEGOTIABLE, EVERY VIDEO, EVERY FRAME (user, 2026-11-07: "you NEED to remember those rules every time")
The user taught these and measured them from RicksClips3000. "The Chair" (2026-11-07) failed because they were not
applied. Its faults: dull colour, wrong sun, heads cut by the frame, clipping, stutter, jaggies, a reused score.
Check every item before ANY render and say which ones you verified.

**Characters (1:1 his look; our own people)**
- Big oval heads: bigger than our Busby cast. Size them against his frames side by side, never by guess.
- Heavier ink on the LEFT side of the head, consistently.
- Bright white faces with a white shine (near-emissive; task #10). Soft shade side x(0.84, 0.85, 0.90).
- Lanky bean bodies with thick dark limbs and solid black ball hands. Glasses and moustaches are allowed.
- A hat or real hair on everyone.
- Characters are NOT lit by the scene: they have fixed shading, and the sun pass is only for their shadow.

**The sun / lighting**
- ONE warm key (#FFF0D8-ish) from CAMERA-LEFT and HIGH. Top faces are brightest.
- Form contrast (lit vs shade) is 1.5-2.3x linear. A sun patch vs shade is ~3.5x.
- Cast shadows are BLUE-GREY (#7793A7-#8AA6B3), crisp but soft (6-12 px penumbra). Weak AO (~10%). Vignette 5-10%.
- Every scene has its own colour mood: warm practicals with glow, floating dust, and story light landing on faces.

**World look: HIGH-KEY like his rooms (measured 2026-11-07, the biggest single difference)**
- Median V 0.67-0.87. Dark areas (L < 0.25) 5-14 % of the frame. Ink / dark-line coverage 1.5-9 %. Median saturation 0.18-0.44.
- Light woods and painted surfaces, not dark brown everywhere. Soft bright shade (~2x below lit). Weak AO.
- Measure every look still with these numbers before rendering.

**Colour (measured targets; check with numbers, not by eye)**
- Median V 0.56-0.82. 95th-percentile V 0.95-1.0 (real white shine). Colourfulness 0.25-0.30.
- Large single-hue areas at V 85-98 and S 45-70. Use complementary pairs (warm wood / teal-green, orange / blue). Neutrals are tinted.
- NO purple, violet or magenta, ever.

**Ink**
- Close props 11-14 px, mid distance ~8, far ~3 (px at 1080 wide).
- Characters 6-9 px in a medium shot.
- Environment ink is near-black, tinted by the grade.
- Every hard crease is inked. Pattern lines are 1.5-3 px.

**Camera (his code)**
- Every shot is `shot(t) -> { pos, target, fov 26 }`.
- pushIn x1.9, outCubic.
- orbit az -44 -> +55, el 17.5.
- whip: a hard 1-frame stop, no settle.
- Still on <= 4.5 % of frames.
- Shake = a sum of sines (smooth), never a frame-to-frame flip.
- Use his signature moves: swoop onto a prop, push past a face to the held prop, extreme close-up of a story detail,
  fly through doors and holes, dutch orbit, rise to top-down -> zoom into a texture as the transition, huge soft
  foreground objects, 6-9 f cross-dissolves for time jumps.
- Camera styles (framework section 9): Dread Cuts, One Take, Found Footage, The Watcher, Through the Steel.

**Animation**
- A new pose every frame while acting. Moves are outCubic over 12-19 f (60-70 % done in the first 4-5 f).
- Holds are pixel-identical, with no idle bob.
- The face leads the body by 1 f. Mouths change on twos. No blinks while talking.
- Real acting: weight shifts, reactions, props held in hands, slapstick physics. Walks use thick, straight, scissoring legs.

**Framing and contact (zero tolerance)**
- A head is NEVER cut by the frame edge.
- Nobody inside furniture or walls, nobody floating. Sitters sit in front of the seat. The camera is never inside geometry.
- Run the every-frame checker `out/busby/check/check.ts` (esbuild + shim; see its header) and get "NO ISSUES",
  plus "camera jerks" limited to ease ends.

**Picture quality**
- No jaggies: characters at the top texture tier, and 4K finals supersampled (post dpr 3 at scale 2).
- Judge from full-size frames side by side with his frames, never from thumbnails.

**Music**
- A NEW original score for every video, never a re-skin of the last one: fun, unique, with mystery.
- Its own motif, instruments and groove, timed to the story beats. Silence for the scares.

## READ FIRST: style/CARTOON_FRAMEWORK.md (user, 2026-11-07, permanent, every project)
The framework is the ONLY valid source for character design, the face kit, animation timing, camera moves/styles and the
9-step frame pipeline. The user trashed every earlier character-art rule (paper cards, googly/mixed eyes, noses, wobble
heads, idle bobbing, creeps/crane-backs, wide lenses). Anything below that conflicts with the framework is OBSOLETE: the
framework wins. What still applies from below: the 3D world, engine, audio, captions, render/encode and QA workflow.
Code lives on the `studio` branch (the repo's default branch is `downloads`).

## Project layout (studio/)
- `src/videos/bellwitch/` - the film engine: `story.ts` (shots, camera keys, moods, cuts), `stage.ts` (who stands where,
  expressions, gags, acting layer: hop / bounce / stretch / shake), `world.ts` (three.js world, light, ink, grade),
  `mansion.ts` / `foyer.ts` / `whprops.ts` (Winchester sets), `cast.ts` (every character; SPOOKY BEANS v2 look at the
  bottom), `captions.ts` + `voiceEnv.ts` (generated), `look.ts` (per-shot moods).
- `src/videos/bridge/toon.ts` - the 2D character drawer (heads, googly / dot / -_- eyes, noses, mouths, clothes, poses);
  `bridge/cast.ts` - character card cache + the scissor-cut paper edge (CARD_FX.paperCut).
- `audio/lib/` - DSP + instruments + SFX generators. `audio/winchester/audio/wh_audio.py` = score + SFX + final mix
  (-14 LUFS); `audio/winchester/voice2/conform.py` + `adopt.py` = fit a new narration take to the cut, regenerate
  captions + lip-sync envelope.
- `scripts/` - `stills-variants.mjs` (test stills), `run_prev.sh` (full low-res pass), `scan.py` (pops / flat frames /
  purple), `run_final_4k.sh` (4K chunks -> phone-safe 4K + 1080 + ~9 Mbps YouTube file).

## Commands (run inside studio/)
- `npm install` (downloads Remotion 4.0.540, three, HyperFrames; ~0.5 GB) - `npm run typecheck`
- test frames in one pass: `npx remotion render src/index.ts BellWitch out/qc --sequence --frames=95,550,1625
  --image-format=jpeg --scale=0.5 --timeout=600000 --gl=swangle` (first frame builds the world: keep the long timeout)
- audio: `python3 audio/winchester/audio/wh_audio.py` (never while rendering: it needs several GB of RAM)
- full check: `npm run preview` then `python3 scripts/scan.py out/prev/prev.mp4` (the preview passes `post.dpr 0.25`: R3F
  clamps dpr to >= 1, so without it the WebGL buffer stays 1080x1920 and the scan render takes ~3.5 h instead of minutes)
- FINAL on the user's Windows PC (preferred, GPU): `npm run final` (scripts/render-final.mjs: true 4K, PNG frames, crf 16,
  High@5.1 + VBV, soundtrack from public/winchester_mix.wav via the `withAudio` prop, prints time left);
  `final-1080`, `final-safe` (concurrency 2), `final-cpu` (swangle). User guide: RENDER_ON_WINDOWS.md at the repo root.
  Cloud fallback: `npm run final4k` (~13 h on 4 CPU cores). Rebuild public/winchester_mix.wav after any audio change.
- HyperFrames (`npx hyperframes ...`): HTML-based motion pieces (title cards, banners, channel promos, end screens);
  the story shorts themselves stay in Remotion + three.js. The Remotion Claude plugin (remotion-best-practices etc.)
  is enabled on the account for API questions.

## OBSOLETE (trashed by the user 2026-11-07; use style/CARTOON_FRAMEWORK.md): SPOOKY BEANS v2 characters
"Same 3D world, 2D paperish characters, complete new assets, funny looking goofy characters", matching the narrator's
voice: fun, exciting, mysterious, bouncy, silly, engaging. Scissor-cut white paper edge round every character; eyes mix
by moment (black dots calm / -_- deadpan / googly shock, half-lid googly smug); a peach cartoon nose each; every person
their own silhouette (noodle, ball, pear, big head, stubby legs, big shoes); hand-drawn wobble, no perfect circles.
Lip sync ONLY when a character actually speaks a quoted line. Score: swung mystery groove, comic bassoon, theremin,
snaps, celesta; tuba oom-pah on construction. Voice: ElevenLabs "Aiden - The Everyday Guy" only.

# Full style guide + correction history (carried over from the personal cartoon-3d-short skill)


# Cartoon 3D story short (three.js + Remotion)

Proven example: **The Bridge That Fell for a Song**. It is an original 67 s short about the 1831 Broughton bridge and 74 soldiers marching in step.
- Code: `src/videos/bridge/` of your Remotion project (composition `BridgeShort`, 1080x1920, 30 fps).
- Script, voice and sound: `~/bridge-short/`.
- Style research: `references/`.

The style reference is a channel studied privately (`references/`: STYLE_BIBLE.md, reports/*.md, frames/).
- Those videos are private study material. Never upload, publish or send them.
- Never copy their scripts, characters or shots. Story, characters and voice are always OUR OWN.
- Never say the channel's name in a voice-over or description.

User rules that apply:
- No captions or labels in the video.
- English only.
- Voice: one steady tone.
- Jokes are researched real facts.
- Standard mix: music +3 dB, SFX -6 dB, voice unchanged.
- Final export 2K vertical: 1440x2560, `--scale 1.3333`.
- Opus max verifies every check.
- Save after every step.
- "Just do it" once the script is approved.

## SPOOKY BEANS house style (Bell Witch) - world/audio/caption rules only; its character rules are OBSOLETE - proven on "The Bell Witch" (2026-11-05)
Code: `src/videos/bellwitch/` (+ shared `src/videos/bridge/`), notes `HANDOFF.md`, lessons `references/BELL_WITCH_LESSONS.md`.
Start a new story by COPYING bellwitch/ and replacing story.ts / stage.ts / world.ts content; keep every look value.
User rules (override the bridge rules above where they differ):
- Captions ON (1-2 words, heavy white Montserrat with thick black outline, lower middle). 1080x1920, 30 fps, ~60-75 s.
- Voice: ElevenLabs "Aiden - The Everyday Guy" (user, 2026-11-07: "only aiden now" / "get rid of adam"; Adam is retired).
  The user never records their own voice. A new take is fitted to an existing cut with stories/winchester/voice2/conform.py
  (phrase-by-phrase pitch-preserving tempo onto timeline_target.json) + adopt.py (captions + VENV lip sync). Kate-style villains are
  NEVER shown in person (silhouette in a thought bubble at most). NO purple / violet / magenta anywhere.
- Style target: RicksClips3000 ("as clean or cleaner"): smooth everything, no jagged / dotted / bumpy edge anywhere,
  little details everywhere, bright white faces, studio feel. Reference clips are private study material.
- Show test clips first; when the user says "looks good", render the full thing and send ONE file.
Approved look (do not rediscover):
- Characters: style C pale skin, faces near-white (cardshade pale mask -> albedo x .95/.97/1.03, under bloom
  threshold), lumpy hand-drawn heads, heavy ink on the left, plain clothes, no blush / dimples.
- Eyes: every open eye has Rick's heavy flat LID LINE over a cut oval pupil (toon.ts eye(): dot AND small -> "open"
  on pale skin); shocked / terrified keep round eyes.
- Backgrounds SHARP (BG_BLUR = 0 in Bell.tsx): the user preferred the sharp frame over strong close-up blur.
- LOOK ROUND 10 = the approved Rick look ("a million times better"; bellwitch moon.ts / candle.ts / grade.ts / look.ts):
  * NIGHT (outdoors): royal-blue moon lit [1.05,1.4,2.45], shade [0.09,0.19,0.58], lift [.02,.045,.13], term .35,
    lambert .5, fog #3a5cc0, sky stops #7094f8 #5a80ee #4166d8 #2b4cb8 #16328e, NIGHT_SAT .65 / NIGHT_SAT_DARK .35,
    grass tint #3f6a78 + per-material outdoor saturation (SATMUL_OF: grass .45, pines .7, wood / logs / hay / pumpkins
    1.3-1.4), warm pools round lanterns / porch lamp / lit windows (EXT_POOLS col [2.3,1.6,.85] r [.5,4.5]), windows
    [5.8,3.4,1.3]. Measured vs his night frames: blue share .94 (his .76), L .40 (.41), colourfulness .33 (.34).
  * CANDLE (indoors): gold key lit [1.85,1.45,.85], deep blue shade [.1,.21,.52]; POOLS col [1.8,1.42,.8] at the
    candles/hearth -> floorCol [.12,.25,.62] far away, r [.7,3.4], sat 1.3, POOLS_SAT_DARK .25: gold near the flame,
    blue corners (his candle bedroom / burglar room). Colourfulness .35 (his .33).
  * shade.ts world shader: uSatDark (albedo desaturates in the dark so shadows take the light's blue, never mauve),
    uNoPurple (blends of warm albedo x blue light that land on hue 236-350 get their red pulled to green: no mauve /
    dusty rose ever; the grade's purple guard alone missed the 340-356 rose band), SHINE (stylised Blinn hot spot +
    soft lobe + fresnel per material gloss GLOSS_OF; candles / lanterns give warm glints via the pool positions).
  * Grades: night ky [.055,.2,.44,.71,.9,.97,1] sat [1.55,1.42,1.15] tintS [.038,-.012]; candle ky
    [.045,.17,.41,.69,.89,.97,1] sat [1.5,1.38,1.12] tintS [.05,-.015] tintH [-.035,.03]; vignette .4-.45; bloom 1.35.
  * Contact shadows (ink.ts SSAO in the mask pass, 16 taps 4x4-rotated + 4x4 box blur, masked off the cards): night
    ao .7 r 1.0 m, candle ao .75 r .6 m -> the 3D world reads solid while the 2D cards stay flat paper.
  * Iterate looks with INPUT_PROPS {"look": {...}} + scripts/stills-variants.mjs (one bundle, many variants; look.ts
    lists every knob), score with scratchpad colorstats-style metrics (L, Lp5, colourfulness, blue / warm / purple share)
    against his frames, then bake the winner into the preset files.
- Smoothness = SUPERSAMPLING: final at --scale=1.5 with props post.dpr 1.5, --image-format=png, crf 8 chunks, then ONE
  lanczos downscale to 1080x1920 crf 14 tune animation (out/bell/final/run_final_ss.sh). ~6.2 s/frame on 4 CPUs
  (71 s video = ~4 h). Test clips: same at 5 s (run_ss.sh). Never judge smoothness on 540-wide half-res tests.
- NO FXAA pass: as an extra last EffectPass it left patches UNGRADED (a "ghost halo" behind a character).
- Ink (bridge/ink.ts): faces seen edge-on (|n.v| < 0.1) are left out of the ink buffers, creases need >= 2 px of face,
  no creases from 1 px slivers -> no DOTTED lines on thin rails / battens.
- Thin hardware (hinges, battens, latches, rivets) is PAINTED into a texture (textures.ts doorTex), not 1-2 cm boxes.
- Shadows: SMOOTH5 PCF, 4096 map rotated 45 deg, only big solid pieces cast (SplitBatch); pillows / small props don't.
  Close gaps between objects (a 4 cm pillow gap showed a dashed sliver).
- Wheels / round parts: high segment counts (felloe 96). Camera: flights through every cut (rush / crane / whip, x^3
  ease, motion blur, T_OUT 7 + T_IN 10 f), creeping holds, impact kicks, LEVEL horizon (he never tilts), dead-still holds
  on dialogue / action shots (STILL_HOLDS). Split now static 17 / creep 34 / move 19 / rush 30 % (his 21/32/24/24).
- HIS STORY GRAMMAR (user, on his "What the Grave Bell Really Meant" clips): the scene changes CONSTANTLY (4 places in
  6.5 s: bedroom -> window -> street flythrough -> porch), every place densely detailed; big jumps in time / place are
  a ~0.45 s CROSS-DISSOLVE out of a slow push (toward a window / door) into a FREE-CAM glide (a drone-like flythrough
  down the street, a crane up a post), then a dead-still hold for the dialogue. Plan new stories with MANY locations
  (a new set or insert every 2-3 s), dissolves at the time / place jumps (story.ts DISSOLVES + tail renders +
  out/bell/final/dissolve.py), rush zooms for the beats inside a scene.
- EYES switch on the beat (his clip): small black lidded eyes by default; white googly eyes only on the 1-2 peak
  frights / surprises of a shot (with teeth or a scream, a sweat drop); > < winces; dashes / arcs when happy; half-lid
  side-eye when smug.
- Final = NATIVE 4K (run_final_4k.sh: --scale=2, post.dpr 2, PNG, crf 8 chunks) -> 2160x3840 master + lanczos 1080
  (2x supersampled). Test clips: out/bell/test10/run_test.sh <frames> <name> [props] (1.5x, with the mix slice).

## ALWAYS before sending ANY still or video to the user (user rule, 2026-11-06)
1. **Jagged-edge check, every time, automatically.** Render supersampled (`--scale=2` + props `{"post":{"dpr":2}}`, then lanczos
   down to the delivery size; never send a 1x render). Then crop 3-4 regions at 200 % around the hardest edges (ink lines,
   spindles/railings, character outlines, thin props, sun-patch borders) and LOOK at them. Fix stair-stepping before sending;
   say in the message that it was checked. Goal: none, or as little as RicksClips3000.
2. **Phone-safe encode** for video: H.264 High, level 5.1 (4K) / 4.1 (1080), vbv capped; level 6.0 broke playback on the
   user's phone (The Bell Witch, 2026-11-06).
3. **Scale and grandeur of sets:** the Winchester house is "an amazing Victorian mystery mansion, not just a house. It's huge,
   put more detail" - grand double-height rooms, galleries, stained glass, many doors, rich panelling, dense props.

4. **Standing QC checklist = every correction the user ever made (apply automatically, never wait to be told again):**
   smooth ink + supersampling, no jagged/stepped shadows (only big solid casters, SMOOTH5 PCF), no dotted thin details
   (hinges/rails/rods: paint into textures or thicken), no pixelly box tops/bottoms; NO purple/violet/magenta/pink anywhere
   (red roofs and navy cloth in blue shade turn pink: neutral shade); no blue hue on surfaces; nothing clips (cloth, feet,
   props); characters = paper style, Rick eyes (black, googly on peaks), eyelid line, heavier left ink, plain clothes, clean
   faces; captions ON and in sync (words.json), voice joins checked for chopped words; camera motivated + level, locked
   holds on action beats, NO ghosted cross-dissolves; sharp backgrounds; no ghost mascots in Winchester; scan the final
   for pops/flicker (frame-diff), check key frames + 200 % crops, phone-safe encode, then deliver.

## Pipeline
1. **Topic and facts.** Pick one surprising true story with a physical cause and effect (it should be visual), plus a simple everyday analogy that explains it.
   - Write the facts with their source at the top of `SCRIPT.md`.
2. **Script** (~3.7 words/s, 55-70 s). Beat formula from the bridge short:
   - **Hook:** the absurd fact in one line ("Seventy-four soldiers knocked down an iron bridge just by walking across it.").
   - **Setting:** year, place, pride.
   - **Action:** escalation over three or four beats, each a little bigger.
   - **Snap:** the moment it breaks.
   - **Deadpan double line:** "Luckily ... / Unluckily ...".
   - **Explanation:** one physics idea through an everyday analogy (the kid on a swing).
   - **Consequence:** the rule it created.
   - **Callback twist:** the ending.
   - Never describe on screen what the viewer already sees.
3. **Voice.** Record or generate `voice.wav`, then make its word timings `words.json` (any speech-to-text with word times).
   - Put them in the project folder, e.g. `~/bridge-short/voice/`.
   - Hand-fix the word timings. Everything is timed to words.json.
4. **Shot plan** in `story.ts`: copy `templates/bridge/` (the final bridge source, same as `src/videos/bridge/` of your Remotion project) to `src/videos/<name>/`, register a new composition next to `BridgeShort` in `src/Root.tsx`, and rename it.
   - `SHOTS`: id, a/b frames, light day/golden, crowd mode, `tau` story time.
   - `XFADE`: crossfades at place/time changes.
   - `FLASH_AT`: a white flash after the hook.
   - `CAMS`: per-shot keys `{f, dur?, cut?, s: f => {pos, look, fov, roll}}`.
   - `KICKS`: impact flip-shakes.
   - `DOF`/`dofAt`: lens blur per beat.
   - `FOREGROUND`: near framing props.
   - Every visual reaction lands 0-3 frames before its word.
5. **World.**
   - `lights.ts`: LIGHTS plus the LOOK sky/river/cloud palette per light.
   - `shade.ts`: two-tone shading and `untone()`.
   - `build.ts`: town, houses and Kenney CC0 kit props, recoloured, with sight-line culling of anything blocking a camera.
   - `paint.ts`: HD Canvas2D painted textures with seams painted in as dark tints.
   - `world.ts`: sky shader, fog = horizon colour, river, per-frame posing, sun frozen per shot and camera-relative.
6. **Characters.**
   - `toon.ts`: the Canvas2D `Pen` drawing API, 600x1000 design canvas, soles at y = 975, bean heads, stick limbs, plum variable-width outline, face library.
   - `cast.ts`: camera-facing billboards, crowds, effect cards, blinks, walk cycles. All billboards go on the `NOINK` layer.
   - `cardshade.ts`: cards lit by the scene light, no emissive.
7. **Post** (`Bridge.tsx` + `ink.ts` + `lensblur.ts` + `grade.ts`).
   - Composer order: ink → lens pre → lens main → bloom → NEUTRAL tone map → grade (MSAA 4).
   - Every pixel parameter scales with output height / 1920.
8. **Sound** (`~/bridge-short/audio/`: timeline.py, sfx_gen.py, sfx.py, music.py, instruments.py, dsp.py, mix.py).
   - Event table → synthesized SFX plus an original score ducked under the voice.
   - Output: mix.wav (48 kHz, exact length), stems and cues.md.
   - Lock the picture's time constants before the sound is made. Any later timing change means re-running the sound.
9. **Look checks.** Run `node scripts/bridge-stills.mjs out/<name>/x_ 100,400 0.5`.
   - Set `BRIDGE_ENTRY=src/sandboxes/<n>/index.tsx` to render a sandbox copy.
   - Make side-by-sides against reference frames with `python scripts/sbs_sheet.py out.jpg --ours ... --ref ...`.
   - Send them to an Opus max verifier: 1-3 images, a ≤200-word verdict.
10. **Final render.**
    - `npx remotion render src/index.ts <Comp> out/<name>/video.mp4 --codec h264 --crf 16 --scale 1.3333`
    - Mux with `-map 0:v:0 -map 1:a:0` (Remotion writes a silent audio track).
    - QA: `python scripts/short_qa.py final.mp4 out/<name>/qa shots.json` checks every frame for black, white, frozen and pop frames, plus loudness and sheets.
    - Fix anything it finds, then run a deep Opus audit.
11. **Deliver.** SendUserFile the final mp4, update memory, write notes.

## Final look values (bridge after 4 verifier rounds; all in `templates/bridge/`)
Start every new short from `templates/bridge/` (copy to `src/videos/<name>/`): the look lives in these values, the
story lives in story.ts / build.ts layout / cast.ts roles. Opus max scores at the end: colour day 7, golden 5-6,
lighting 5-6, ink 6, textures 5-6, characters 7, depth 6-7, composition 6-7 (from 5/3/4/5/4/7/4/6 at the start).
- **Light presets** (`lights.ts`, sun camera-relative and frozen per shot):
  - day: az 75 / el 48, lit [1.58,1.5,1.33], shade [.30,.29,.36], lift [.05,.06,.11] (cool tint ONLY in shade), sky
    top #3e7fd2 → horizon #b8d0ec, fog = horizon, 25→300 m, uSat 1.08, ~15 % blue haze past 60 m.
  - golden: az 6 / el 7 (backlit low sun), key toward #FFB36B ×1.5, violet-blue shade (facade ≈ #444380), sky
    #ffc47c → #8a6f8a, peach fog only past 50 m, sun disc #ffcf9e + bloom, contact blobs + real card shadows.
- **Albedos** (`paint.ts`/`build.ts`): muted brick / cream / ochre / terracotta houses with plinth, cornice, sills,
  hoods, door step, chimney + pot, heights 7 / 8.4 / 9.8 m; warm grey/beige stone (saturation −35 % from "storybook");
  ochre wood deck C* ~51-58 with near-black seams; iron dark and desaturated. Never lemon, never lavender lit faces.
- **Ink** (`ink.ts`): #030303, 5.1 px near (6 m) → 3.3 px far (90 m) at 1080x1920, creases ×0.8 from 35°, depth
  jumps from 1 %, fog tint 0.3 only far; character cards on layer `NOINK` (they carry their own plum ink).
- **Lens** (`lensblur.ts` + `dofAt` in story.ts): cInf px at 1080: hook/river CU 15-16, close-ups 12-14, MS 10-12,
  park 7, golden sway 5, wides/aerials 0. Focus on the eyes of the front row.
- **Post** (`Bridge.tsx`): ink → lens pre → lens main → bloom (thr 1.0, int .5, 6 levels, radius .6) → NEUTRAL tone
  map → grade; MSAA 4. Film grain exists but is OFF (reference measures no grain; it quadruples the file size).
- **Characters** (`toon.ts`/`cast.ts`/`cardshade.ts`): bean heads h/w .94, plum ink #241726, eyes .26 W apart, no blush,
  14 expressions; adults 3.5 head-heights; walk bob 5 %, lean 1-7°, planted 0.8 m stride; blinks 0.5-2.3 s; tight
  contact shadow ~.5 under the feet + sun-direction tail by day; golden rim inner only (never an offset outer copy).
- **Camera** (`story.ts`): cuts on big jumps, smootherstep glides 18-40 f, every hold creeps (no static hold ≥4 f),
  flip kicks decaying over 7 f on impacts, 4-4.6° rolls, foreground props (`FOREGROUND`) in ~1/3 of shots.

## Look targets (measured from the reference; see references/reports/)
- **Ink:**
  - World lines: about 3 px at 1080 wide, near-black #0b0a0c, nearly constant with distance. Silhouettes, depth jumps and normal creases only. No line on wall/floor joins or the horizon. Character cards are never outlined by the world ink.
  - Character ink: dark plum #201628-#2f1d28, thicker on the bottom/shadow side.
- **Colour:**
  - Day median luma ~.57. Non-ink p5 ~.23 (no crushed blacks). Lit chroma C* p90 ~55. Day sky top ~#5e93d9, horizon 1.28x brighter.
  - Golden: peach horizon #ffd08a, violet-blue shadows (never brown), backlit sun.
- **Depth:**
  - DOF on about 1/3 of screen time (CU, MS, inserts), cInf 10-16 px at 1080, focus on the eyes. Establishing and wide shots stay sharp.
  - Fog = horizon colour, 25→420 m day, 20→360 m golden.
  - Bloom only on HDR emissives: threshold 1.0.
- **Camera:**
  - Hard cuts on big jumps. Everything else is a smootherstep glide of 18-40 f, peak ≤ 25 px/f at 720p.
  - Every hold pushes in 0.15-0.35 %/f, with 0.6 %/f on punch words.
  - Rolls of 4-5°.
  - No hand-held float. Impact shakes flip sign every frame and decay over 7 f.
- **Characters:**
  - About 3.5 head-heights tall, legs 1.4 HH.
  - Stick limbs about 0.055 of head width, ink-dot hands.
  - Bean head (h/w ~0.93, narrower chin, pointier crown).
  - No blush or eye highlights. Faces at brightness ~.93.
  - Walk bob 3-7 %, lean 1-7°, planted feet.
  - Blinks every 0.5-2.3 s, lasting 4 f.

## Look-match loop (how the bridge look was reached; reuse for any "make it look like X" pass)
1. **Measure the reference first.** One analysis agent per topic (motion, depth, textures, characters, lighting, outlines, grade), each writing numbers, not adjectives, to `references/reports/<topic>.md`. Shared brief: `compare/CONTEXT.md`. Reports are the source of truth for every agent after.
2. **Sandboxes, one owner per file.** Copy the project folder to `src/videos/<name>_{cam,world,mat,char,post}` with entries `src/sandboxes/<n>/index.tsx` (same `index.tsx` as main, only the import path changed). Ownership used for the bridge:
   - cam: story.ts (camera keys, cuts, kicks, DOF table, foreground props)
   - world: world.ts, lights.ts, shade.ts, grade.ts (sun, sky, fog, river, colour, grade)
   - mat: paint.ts, build.ts (painted textures, buildings, props)
   - char: toon.ts, cast.ts, cardshade.ts (character drawing, posing, card lighting, fx cards)
   - post: ink.ts, Bridge.tsx, lensblur.ts (outline pass, composer, lens blur, bloom)
   Agents only edit their own files in their own sandbox and render stills with `BRIDGE_ENTRY=src/sandboxes/<n>/index.tsx node scripts/bridge-stills.mjs out/<name>/<n>/x_ <frames> 0.5`.
3. **Merge** with `python scripts/bridge_merge.py [cam,world,mat,char,post]` (backs main up to `backup/bridge_<time>/`, copies owned files only). Then `npx tsc --noEmit` (filter to the project folder), then **re-sync every sandbox from main** (`cp -f src/videos/<name>/* src/videos/<name>_<n>/`) before the next round.
4. **Verify** with a fresh Opus max agent: side-by-side sheets (`python scripts/sbs_sheet.py out.jpg --ours a b --ref r1 r2`), score each area out of 10 (colour day / golden, lighting, ink, textures, characters, depth, composition) plus a numbered fix list with frame numbers. Map each fix to the file owner and resume that owner's agent with SendMessage (keeps its context). Bridge scores: round 1 5/3/4/5/4/7/4/6 → round 2 5/4/5/6/4/7/6/6 → round 3 see notes.
5. Contracts between owners live in exported constants (e.g. `NOINK` layer from ink.ts, `dofAt`/`FOREGROUND` from story.ts, `LIGHTS`/`LOOK` from lights.ts). Changing a contract means telling every owner that reads it.

## Gotchas
- Kenney nature-kit materials are teal: recolour them by material name in build.ts.
- Cameras end up inside houses: the sight-line culler in build.ts/world.ts removes anything blocking any camera ray.
- Ink in the same merged effect pass as DOF gets overwritten. Ink must be its own pass before the blur.
- Pixel-sized post parameters must scale with resolution: stills are at 0.5, the final at 1.333. R3F clamps dpr to ≥ 1, so `--scale 0.5` stills still render a 1080x1920 buffer.
- **Disk:** every Remotion bundle copies `public/` (~1.3 GB) into `the temp folder\remotion-webpack-bundle-*` and never deletes it. 60+ GB filled the system drive during the bridge passes and a render died with ENOSPC. Always render with `export TEMP='<big drive>/remotion-tmp' TMP='<big drive>/remotion-tmp'` (bridge-stills.mjs sets it itself) and ask the user before deleting old bundle folders in the shared the temp folder (auto mode blocks the sweep). <big drive>/remotion-tmp fills too (~500 folders / 110 GB after the 4 bridge rounds): when a project is finished and nothing is rendering, delete its `remotion-webpack-bundle-*` and `puppeteer_dev_chrome_profile-*` folders there.
- In JS strings write `"<big drive>/remotion-tmp"`, never `"<big drive>\remotion-tmp"` (`\r` becomes a carriage return).
- Remotion writes a silent audio track: mux with `-map 0:v:0 -map 1:a:0`.
- Sub-agents can't write report files in this harness: ask them for a ≤150-word final message and save it yourself to `out/<name>/<n>/REPORT.md`.
- Scratch `.ts` files inside `out/` break `tsc`: name them `.txt`.
- 2K renders run ~4 fps (≈10 min for 67 s). Stills at 0.5 take 3-8 s each after a ~40 s bundle.
- Film grain at 2.5 % made the 2K file 910 MB instead of ~250 MB and will turn to mush on YouTube; the reference has none. Keep it off.

## Readability traps the verifier caught (check every new prop/shot for these)
- **A swing drawn as one rope that disappears behind the kid reads as a HANGING.** Always two ropes to a wide plank
  with the kid between them (`swingKid` in toon.ts), and a frame whose legs clear the arc (A-frame at each end).
- Props or flotsam closer than ~2 m to a lens become huge cut-off blobs at the frame edge. When a camera moves, re-check
  every prop near its new position (the river cameras moved into the floating hats).
- A foreground bush cut by the frame edge reads as a "green ball"; a foreground prop must be recognisable or gone.
- Flags: red + yellow star/diamond reads as Vietnam's. Use a period-correct flag (St George's cross for England 1831).
- Painted signs lit by a side sun go grey-blue and unreadable: give the sign face an unlit material.
- Golden rim light done as an offset outer copy turns every hat into a picture frame: inner rim only, head/torso only.
- Balcony/railing rails at chest height through characters: put the lens ~2.5 m up so rails cross legs, not torsos.
- Flat holds read as freezes in QA (frozen span ≥12 f): every hold needs a creeping push-in.

### Winchester round (2026-11-07) - standing rules (character-art items here are OBSOLETE; see the framework), apply to EVERY Spooky Beans video
- CHARACTERS: one unique person per role (never reuse the same worker across gags); clothing true to the era of the scene
  (1880s-1920s: shirtsleeves, waistcoats, braces, leather aprons, flat caps / felt / straw hats, moustaches, beards;
  present day: tees, jeans, sneakers, ball caps, blazers). Builders live in bellwitch/cast.ts CREW.
- HAND-DRAWN LOOK (user: "look like a human drew it", "no perfect circles", "fun and goofy"): bridge/toon.ts headBlob
  paper branch = per-person lopsided heads (b/a, crown, jaw, egg, asym, tilt, wobble 0.021, lobe); WOB = 0.055 radial
  wobble on every ellipse / arc while a face is drawn (seeded per person: no line boil); uneven eyes (one bigger, uneven
  heights, tilted lids); mouths tilted per person. Must be clearly visible at phone size - subtle = "you did not listen".
- ACTING (user: "jumpy energetic emotions on top of sad / confused / mad"): hops + squash-stretch on every reaction,
  beat bounces, sob shudders, trembles, running / hammering bob (stage.ts hop / bounce / stretch / shake / BEAT).
- LIP SYNC ONLY WHEN THE CHARACTER IS ACTUALLY SPEAKING (quoted speech, e.g. the psychic's "The cure? Build."). Never
  make on-screen characters mouth the narrator's third-person lines (user: "we dont want ... copying the narrator").
- CAMERA: story.ts keysOf drops glides that run into the cut (Bell Witch rule) - Winchester ids > 100 are exempt, and
  shots with designed moves get NO creep (the creep ate the end of the crane-back). Check a mid-move frame of every move.
- QC: render test stills per changed shot + a full low-res pass scanned by scripts/scan.py (pops / flat frames / purple)
  BEFORE the 4K. Never run the audio build (several GB) alongside a render: the stills batch was OOM-killed.
- VOICE: Aiden only. New takes: voice2/conform.py (fit to timeline_target.json) + adopt.py (captions + VENV).

## Rick-match rules learned on The Chair (Nov 7) - apply every video
- HEADS: his traced head (near-round ball, a touch wider than tall, slightly flat top) on most of the cast; a few people keep their own shape (`shape.geo`: wide / tall / round). Hats are SMALL and sit HIGH (lowest edge ~0.3 D above the head centre) so the big white face shows; hair fringes sit high too.
- INK: near-black (#0d080a at source, survives the high-key grade), heaviest low on the LEFT (~7 % of the head), thinnest top-right (~1.5 %).
- FACES: warm cream white (~255,251,245 on screen) with a soft shade just inside the left edge. Features: lids 0.075 D above the head middle, mouth 0.143 D below, eyes 0.138 D off centre; brows 0.042 D thick with blunt ends.
- EXPRESSIONS: never the same face on everyone. Mix his set per scene: deadpan (lid over a big pupil, one brow cocked, flat lozenge mouth), alert (white rings, small o), excited (rings + crescent teeth), toothy grin (dot eyes), sly/evil, nervous = gritted box teeth + sweat (NOT a grin), laugh. Neutral mouth is flat, never a smile curve.
- TALKING: small dark mouth shapes swapped on twos; only a shout opens wide with teeth. Rage gag: colour rises from the chin (red, never purple) + steam puffs + head shake.
- WORLD: every prop and piece of furniture casts the key light's shadow; every solid surface receives it; the room shell (walls, ceilings, beams) never casts. Shadows blue-grey, ~40 % darker than the lit floor. Backgrounds and foregrounds stay crisp (light background blur only, near blur x0.25). Props get real detail (e.g. the pint: nonic glass, amber gradient, bubbles, foam, highlights, heavy outline).
- NEVER FROZEN (his slide: "a new pose every single frame, no motion blur"): every character sways, breathes and redraws its brows every frame (stage `add` life layer); talking mouths change on ONES. Angry shouts use the arched, corners-down shout mouth (never a smile shape); rage steam jets out of BOTH sides of the head as solid outlined puffs, never over the face.
- FIGHTS: a cloud with one heavy outline round the outside only, shaded puffs, the fighters' own sleeve colours punching out with solid fists and boots, their faces popping out, hats flying, stars.
- REALISTIC WORLD (user: "change the world completely... 3D blender looking"): the world is rendered, not inked - CC0 photo-scanned PBR textures (Poly Haven, public/ph, diffuse + normal map via bridge/phtex.ts, preloaded before frame 0) on floors, walls, panels, beams and furniture; NO world ink lines (characters keep theirs); strong contact shading. Hero props keep their approved look (grey photo woods turn metallic - test every swap). His density is the next bar (Japan pachinko clip): rows of detailed props, background crowds, glowing practical lights with bloom, glossy reflective floors.
- STAGING (user caught these): never let furniture sit within ~0.5 m of the camera (legs end up crossing it); keep every table >= 15 cm clear of the hero chair; never raise a character off the floor to "sit on" something (feet float / pass through wood) - stand them clear instead; arms must never cross another character's head. Re-run the checker AND look at one frame per shot after any staging change.
