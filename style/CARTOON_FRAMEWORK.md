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
  - brows: arcs 0.14 D long, ~0.03 D thick, tapered ends, centred at (+-0.137 D, -0.106 D) (0.146 D above the eye centres)
  - mouth: centred at x = 0, about +0.21 D; neutral dash ~0.07 D [R], slight smile up to ~0.24 D wide
- [R] Expressions are the same kit with changed shapes:
  - worried / sad: inner brow ends raised, mouth a dash or small frown
  - smug: a flat top lid cuts ~40% off both eyes, one brow raised, small closed smile
  - angry: brows slanted down to the centre, squinted eyes, gritted teeth (rounded box with a tooth grid); shouting = a dark open oval
  - tired / resigned: droopy half lids or -_- closed lines, sad brows, tiny mouth
  - startled: white rings with dot pupils, brows high, open mouth [? confirm it belongs to the kit]
- [R] Emotion FX: rage = the whole head flushes one strong colour + steam puffs. Rick uses purple; WE use crimson, because
  the channel rule bans purple / violet / magenta. [?] Pink cheek dots appeared once on a happy face; never by default.

## 3. Building a character
- [U] One skin colour for everyone. Warm ink everywhere, never pure black.
  - [M] Rick's ink is a very dark warm brown, about #1E140F to #28190E.
  - [M] His graded skin reads about #DACBA5 in moody scenes. [I] Our base skin is #F3E9CF; the grade does the rest.
- [U] A HAT on every character: the biggest shape after the head, and the make-or-break.
- [U] Silhouette test: fill every character solid black; each one must still be recognisable by shape alone.
- [U] Identity = hat + body. [R] Also hair, beards, glasses and props. Hair can stand in for the hat (a red ponytail); hair is a
  flat dark patch on the head with a ragged edge.
- Proportions, about 3 heads tall ([U]; [M] 3.13 D):
  - head: a clean circle 1 D wide (the silhouette of a sphere), outline about 0.045 D [M]
  - body: an upright oval, fill 0.76 x 0.91 D (about 0.84 x 1.0 D with its outline); its top tucks ~0.05-0.1 D under the head; no neck [M]
  - legs: 1.27 D from the body bottom to the soles, 0.40 D apart at the hips, bowing to ~0.46 D mid-leg [M]
  - feet: the leg line turns outward into a short flat toe, ~0.14 D past the leg [M]
  - arms: from the upper sides of the body, about 0.65 D long [I]
  - limbs: rubber lines 0.06 D wide ([U]; the drawings measure ~0.052 D), warm ink, smooth curves, no elbows or knees
  - hands: balls of ink about 0.07 D (1.3x the limb width) [M], no fingers, one tiny pale dot [U]

## 4. Shading
- [U] Clothes: a soft horizontal gradient, light on the left, the right side 1.4-2x darker
  ([M] the example is 1.35x darker in sRGB value, about 1.9x in linear light), plus a thin PALE STREAK just inside the left
  edge ([M] ~40% of the height, upper middle, about half the outline width), then the warm ink outline.
- [R] Head: the same fixed left light, but subtle (right side ~5% darker), plus a soft darker rim inside the outline.
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
- The ink is never pure black; there is one skin colour.
- Holds are pixel-identical; there is no motion blur anywhere (whips included).
- The face leads the body by 1 frame; mouths change on ~2s; no blinks during speech.
- Characters are crisp on top (no blur or fog); particles are over them.
- The camera is still on at most 4.5% of frames; the lens is 26 degrees.
- Details everywhere: no bare frame.

## 15. Open questions for the user
1. Startled white-ring eyes: part of the face kit?
2. What is step 6, "screen"?
3. Shake amplitude.
4. Who lip-syncs.
5. Hats: 3D models or drawn shapes?
