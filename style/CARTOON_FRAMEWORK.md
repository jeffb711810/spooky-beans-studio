# Spooky Beans cartoon framework (v3, 2026-11-07)

The one source of truth for characters, animation, camera and frame finish, for EVERY project from now on.
Everything taught before 2026-11-07 about character art and animation is TRASHED (paper cards, googly/mixed eyes,
noses, wobble heads, idle bobbing, old camera toolkit). Only the idea "2D characters in a 3D world" stays.

Tags: **[U]** the user's rule (taught from Rick's breakdown) - **[M]** measured from the user's reference drawings -
**[R]** seen in Rick's frames, not stated as a rule - **[I]** our implementation choice (may change) - **[?]** open question.

## 0. Priorities
1. [U] The details matter more than anything else. A bare frame is an unfinished frame.
2. [U] The invisible timing (section 7) is the most important animation rule.
3. [U] Build order: the FACE first, then hats and bodies, then motion, then camera, then the frame pipeline.

## 1. The unit D
[U] 1 D = the width of the head. Every size below is in D.

## 2. Face kit (build this first)
- [U] The exact same drawn face on every character. Identity never comes from the face; it comes from the hat and the body.
- [U] 2 solid ovals, a small mouth, short brush brows. NO nose, NO ears, NO cheeks.
- [M] Geometry (head centre = 0, +y = down):
  - eyes: solid warm-ink vertical ovals 0.091 x 0.107 D, centres at (+-0.132 D, +0.04 D), so 0.264 D apart, just below centre
  - brows: THICK tapered brush strokes, ~0.18 D long and ~0.05 D thick ([M] Rick's frames: 0.17-0.21 x 0.05-0.06 D; the
    kit diagram's thin 0.14 D brows read too weak), ~0.16 D above the eye centres
  - mouth: 0.03 D ink strokes centred at x = 0, about +0.22 to +0.25 D; dash ~0.07 D, smirk ~0.14 D, deadpan line up to 0.3 D
- [M] Eye types (all part of the kit):
  - dot: the vertical oval above (0.09 x 0.115 D) - neutral, worried
  - LIDDED (Rick's most common look: deadpan / smug): a wide dark half-disc 0.17 x 0.095 D, flat top, under a thick lid line
    (~0.034 D thick, ~0.2 D wide, outer end a touch lower); brows sit ~0.10 D above the lid
  - startled: white rings ~0.21 D across with ink rims, almost touching (gap ~0.02 D), small pupils ~0.06 D
- [R] Expressions are the same kit with changed shapes:
  - worried / sad: inner brow ends raised, mouth a dash or small frown
  - smug: a flat top lid cuts ~40% off both eyes, one brow raised, small closed smile
  - angry: brows slanted down to the centre, squinted eyes, gritted teeth (rounded box with a tooth grid); shouting = a dark open oval
  - tired / resigned: droopy half lids or -_- closed lines, sad brows, tiny mouth
  - startled: white-ring eyes with small pupils, brows high, small open "o" mouth (confirmed in Rick's thumbnails)
- [R] Emotion FX: rage = the whole head flushes one strong colour + steam puffs. Rick uses purple; WE use crimson, because
  the channel rule bans purple / violet / magenta. [R] Happy faces can get two soft pink blush dots and ^ ^ closed eyes
  (seen in his "Job Nobody Wants" frame); never by default. Sweat drops for fear.

## 3. Building a character
- [U] One skin colour for everyone, and it is WHITE (user, 2026-11-07: "the same white as RicksClips"). Warm ink
  everywhere, never pure black ([M] Rick's ink is a very dark warm brown, about #1E140F to #28190E).
  - [I] Base fill #FEFBF5. The character itself is never tinted; the colour grade (step 9) does all the tinting.
  - [M] Rick's white heads ON SCREEN (measured in his frames):
    - day: #FBF9F0 to #FBF8F4 (L* 98, luma 0.97-0.98, a hair warm), shade side about x(0.94, 0.92, 0.95)
    - warm interiors: the grade turns them cream, #E2CFA0 to #E9E2BF (luma 0.81-0.88, b* +17 to +26)
    - dark / night: cool grey-blue around #85859D (luma 0.53); next to a lamp they stay near white
    - his shade side and night heads lean lavender; WE use neutral-cool / blue only (channel no-purple rule)
- [U] A HAT on every character: the biggest shape after the head, and the make-or-break.
- [U] Silhouette test: fill every character solid black; each one must still be recognisable by shape alone.
- [U] Identity = hat + body. [R] Also hair, beards, glasses and props. Hair can stand in for the hat (a red ponytail, an orange
  quiff); hair is a dark shape on the back / top of the head with a ragged edge and a few strand lines.
- [M] Hats are 3D-looking, never flat side shapes: seen slightly from above (the base is an elliptical arc that curves down in
  front, tops show an ellipse), clothes-style gradient plus a gloss streak, seams and buttons on caps, and they sit LOW
  (base ~0.20-0.25 D above the head centre, just over the brows).
- [R] Bodies carry the costume detail: lapels, collars, ties / bow ties, buttons, belts, pockets, badges, plaid and polka dots.
- Proportions, about 3 heads tall ([U]; the diagram measures 3.13 D; [M] Rick's real adults are 3.2-3.5 D with bean torsos).
  [I] Our build: 3.25 D (head 1, bean body, soles at +2.75 D from the head centre):
  - head: a clean circle 1 D wide (the silhouette of a sphere), outline about 0.045 D [M]
  - body: a BEAN, not an ellipse: a superellipse capsule ~0.70 x 1.08 D, the lower half ~6% wider, its top tucked 0.10 D
    under the head, no neck ([M] Rick's frames: 0.62-0.75 D wide, 1.0-1.2 D tall; the diagram's 0.76 x 0.91 oval is a simplification)
  - legs: 1.27 D from the body bottom to the soles, 0.40 D apart at the hips, bowing to ~0.46 D mid-leg [M]
  - feet: the leg line turns outward into a short flat toe, ~0.14 D past the leg [M]
  - arms: from the upper sides of the body, about 0.65 D long [I]
  - limbs: rubber lines 0.06 D wide ([U]; the drawings measure ~0.052 D; [I] we draw 0.055), warm ink, smooth curves, no elbows or knees
  - hands: balls of ink about 0.07 D (1.3x the limb width) [M], no fingers, one tiny pale dot [U]

## 4. Shading
- [U] Clothes: a soft horizontal gradient, light on the left, the right side 1.4-2x darker
  ([M] the example is 1.35x darker in sRGB value, about 1.9x in linear light), plus a thin PALE STREAK just inside the left
  edge ([M] ~40% of the height, upper middle, about half the outline width), then the warm ink outline.
- [M] Head: shaded like a soft ball lit from the upper left and front (light direction about (-0.55, 0.45, 0.70)). The
  lower-right side falls off to ~15% darker blue-grey, x(0.84, 0.85, 0.90), through a soft terminator (Rick's measured shade
  side is 10-25% darker and lavender; ours stays blue-grey). Plus a faint darker rim (~6%) just inside the 0.05 D outline.
- [I] Characters are NOT lit by the scene lights (read from "the sun pass is just for the shadow"). Their colours come only
  from this fixed shading, then the final grade.

## 5. Shadow
- [U] Each character is drawn a second time, the way the sun sees it, just for its shadow (a 2048 depth map).
- [I] A flat body card must be turned to face the sun for that pass, or its shadow becomes a sliver. The visible character
  is untouched.

## 6. The face in code
- [U] The head is a 3D sphere. Face curves are turned into tiny triangles and pushed onto the sphere.
- [U] Faces are cached, up to 24 per character (drop the oldest). After the first draw we only turn the face.
- [U] When the camera passes the character's front, the face flips sides in ONE frame.
- [U] Past 95% the face turns off. [I] Read as: hide it when its centre is more than 95% of the head radius from the head
  centre on screen, so there are never slivers on the rim.
- [I] Placement: the face sits at a 3/4 offset on the side the character faces (never dead centre) and follows the head turn;
  crossing the front swaps the side in one frame.

## 7. Animation
- [U] A NEW POSE EVERY SINGLE FRAME while a character acts (animate on ones, no held drawings). NO motion blur.
- [U] Move timing: 60-70% of every move happens in the first 4-5 frames, then a slow settle.
  [I] That is an outCubic ease over about 12-19 frames (15 typical).
- [U] When a character stops it is COMPLETELY STILL: no breathing, no sway, no bob. The frames are identical.
- [U] **MOST IMPORTANT, the timing nobody notices:**
  - the FACE moves ONE FRAME BEFORE the body
  - the MOUTH changes about every 2 frames while talking
  - NOBODY BLINKS while they talk (blinks only in pauses)
- [?] Who lip-syncs: our earlier rule was "only the character who is speaking at that moment". Confirm.

## 8. Camera
- [U] Every shot = a position, a target and a 26 degree lens that change over time (three.js vertical fov 26).
- [U] Three moves:
  - push-in: 1.9x closer, outCubic
  - orbit: azimuth -44 to +55 degrees (looks like 180, really about 98), elevation 17.5 degrees
  - whip: stops in 1 frame, no settle, no wobble
- [U] The camera stands still on only 4.5% of frames.
- [U] Shake: `nz = sin(t*4.59)*.5 + sin(t*8.61)*.3 + ...` [?/I] Amplitude unknown: keep it subtle.
- [I] The face flip lands mid-orbit, because the orbit crosses the front about 45% of the way through the arc.
- [U] Rick's code, for reference:
  ```js
  shot(t) -> { pos, target, fov: 26 }
  pushIn(shot, { factor: 1.9, ease: 'outCubic' })
  orbit(center, { az0: -44, az1: 55, el: 17.5 })
  if (K[i].stop) return 0;   // whip lands: hard stop
  nz = sin(t*4.59)*.5 + sin(t*8.61)*.3 + ...   // shake
  ```

## 9. Camera styles
- [U] Five styles: Dread Cuts, One Take, Found Footage, The Watcher, Through the Steel.
- [U] THROUGH THE STEEL: the camera just follows the sound, through walls and water. It was invented by a subagent for Rick's
  submarine short. [I] Sharp hits get a whip with a hard stop on the source; long sounds get a push-in; in silence the camera
  drifts toward the next source. (Winchester: chase the hammering through walls and floors.)
- [I] Our definitions of the other four (Rick's versions are unknown):
  1. DREAD CUTS (tension): 12-24 frame shots, each a slow push-in on a detail, getting tighter; ends on a whip to the reveal. No shake.
  2. ONE TAKE (storytelling): one unbroken 3-8 s shot chaining push-in, orbit, whip to the next subject.
  3. FOUND FOOTAGE (tourists, "evidence"): stronger shake, eye height, quick reframes, optional REC dot and timecode.
  4. THE WATCHER (something watches): far away, half-hidden behind doorframes, banisters, plants or windows; very slow push-in; no shake.

## 10. Frame pipeline: 9 effects, in this order
[U] 1 world, 2 fog, 3 haze, 4 depth of field, 5 bloom, 6 screen, 7 characters, 8 particles, 9 colour grade.
- [U] Characters go on top and are NEVER blurred, fogged or bloomed. Particles go over them; the grade goes over everything.
- [I] Characters keep their 3D depth, so a banister in front still covers them.
- [?] What "screen" is. [I] Until we know: a screen-space finish of the world layer only.

## 10b. Colour grade (step 9), measured from Rick
[M] From the earlier 20-video analysis (2,164 frames, references/reports/grade.md) plus the user's new frames. Luma Y' (Rec.709)
percentiles p1 / p5 / p25 / p50 / p75 / p95 / p99 of the whole frame:

| scene | Y' percentiles | saturation (HSV S p50) | black point | vignette (corner / centre) |
|---|---|---|---|---|
| day | .13 / .21 / .42 / .57 / .71 / .90 / .97 | .43 | warm-lifted (35, 19, 20) | .86 |
| golden | .12 / .18 / .36 / .52 / .67 / .83 / .91 | .45 | not measured | .75 |
| night | .07 / .09 / .15 / .24 / .37 / .67 / .82 | .61 (saturated darks) | not measured | .46 (heavy) |
| interior | .08 / .12 / .26 / .45 / .61 / .87 / .94 | .42 | not measured | .67 |

- [M] What the grade does: deeper mids with full whites (an S-curve), richer mid and high saturation, blacks lifted and warm
  (never blue-black, never pure black), a soft vignette. White heads stay at L* ~98 in daylight.
- [R] Rick paints his day shadows blue-violet (b* -20 to -30, lit/shadow 2.8-4.4 : 1 in linear light). WE use blue, not violet.
- [I] Our DAY grade (studio/tools/v3_lookdev.py `DAY`), on the look-dev still:
  - PCHIP tone curve: x 0 / .30 / .55 / .75 / .86 / .95 / 1 maps to y .035 / .17 / .42 / .63 / .82 / .975 / 1
  - saturation (shadows / mids / highlights): 1.0 / 1.12 / 1.06
  - tints: shadow (+6, 0, +3)/255, mid (0, 0, +4)/255
  - vignette: k .12, r0 .42
  - result: Y' .07/.22/.45/.60/.75/.87/.97, S .48, vignette .87, white heads #FCF9F3
- [I] TODO when the engine gets v3: the world render alone is too flat and bright (Y' p50 .75, blue-grey blacks
  (77, 81, 105), no vignette). Re-fit the engine grade to the table above per scene type, then measure every new set
  against it.

## 11. Performance
- [U] Rick's start point: 84 ms a frame, every character updated 3x a frame (even ones in another place), and rebuilding faces
  took 34% of every frame.
- [U] The fix: stop drawing what nobody sees (skip their update and shadow pass, hide off-shot characters) and cache the faces
  (24, drop the oldest). Result: 84.3 ms to 19.0 ms, 4.4x faster.
  ```js
  if (skip?.has(ch)) continue;                     // nobody sees him
  for (const ch of off) ch.root.visible = false;
  let E = cache.get(key);                          // face: draw once
  if (cache.size >= 24) cache.delete(oldest);
  ```
- [U] SAME PICTURE: after any speed-up, every film is checked frame by frame against the old frames.

## 12. Captions
[R] 1-2 words at a time; a heavy rounded white sans with a thick dark outline and a soft drop shadow; lower middle of the
frame, over the body.

## 13. Channel rules that still apply (not character art)
Aiden narration - captions ON - no purple / violet / magenta tints anywhere - true 4K renders with phone-safe H.264 encodes -
Rick's reference clips are private study material (never publish, never commit).

## 14. Check every frame
- The face kit is identical on every character; no nose, ears or cheeks; the eyes are 0.264 D apart.
- The silhouette test passes; every character has a hat (or hair that does the job).
- The ink is never pure black; skin is one WHITE (day heads L* >= 96 on screen); the frame grade sits inside the table in 10b.
- Holds are pixel-identical; there is no motion blur anywhere (whips included).
- The face leads the body by 1 frame; mouths change on ~2s; no blinks during speech.
- Characters are crisp on top (no blur or fog); particles are over them.
- The camera is still on at most 4.5% of frames; the lens is 26 degrees.
- Details everywhere: no bare frame.

## 15. Open questions for the user
1. What is step 6, "screen"?
2. Shake amplitude.
3. Who lip-syncs.
(Answered by Rick's thumbnails 2026-11-07: white-ring eyes ARE part of the kit; hats look 3D.)
