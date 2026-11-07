# Character style v3 (user, 2026-11-07) - ALL earlier character rules are TRASHED. Only "2D characters in a 3D world" stays.
Unit: 1 D = head width. Everything measured in D.
## Face kit (build first; EXACT same face on every character; identity never from the face)
- head: big near-circle, slightly hand-wobbly outline, warm ink outline (never pure black)
- 2 solid warm-ink ovals for eyes (no whites/highlights), ~0.27 D apart, just below head centre, tight cluster
- short tapered brush brows (do the acting); small mouth (dash / slight smile)
- NO nose, NO ears, NO cheeks
- expressions via brows + eye shape (e.g. half-shut lids = smug)
## Build
- ONE skin colour for all (pale warm cream); warm ink everywhere, never pure black
- a HAT on every character: biggest shape after the head, the make-or-break; tell characters apart by silhouette (shape alone)
- identity = hat + body (+ accessories like glasses, props)
- body: upright oval ~0.95 D wide x 1.1 D tall tucked under head, no neck, flat colour + soft shading, ink outline
- limbs: rubber lines 0.06 D wide, warm ink, smooth curves, no elbows/knees; arms from upper body sides (~0.65 D),
  legs from body bottom ~0.3 D apart (~1.3 D long), feet = short flat toe turned outward
- hands: balls of ink, no fingers, one tiny pale highlight dot
- total height about 3 heads (3 D)
- captions: big bold white letters with dark outline
## Animation: a NEW POSE EVERY SINGLE FRAME (why it's addicting)
- NO motion blur: every frame is a crisp, clean drawing (pose changes snap, never smeared)
- every frame redraws the pose: arms, head tilt, body lean, legs, brows, mouth all shift a little (no held drawing)
- big emotions: angry = slanted brows, squinted eyes, gritted-teeth mouth (rounded box with tooth grid);
  rage = whole head turns a strong colour (e.g. purple) + steam puffs from the head; mouth opens to a dark oval when shouting
- the hat stays on and moves with the head; a dark hair patch can show at the side of the head
## Timing curve of every move
- 60-70% of the move happens in the first 4-5 frames (fast snap out), then a slow settle over the remaining frames
  (strong ease-out; no slow ease-in at the start)
- smug face: half-lidded eyes (flat top lid), one brow raised, small closed smile
## When a character STOPS it is COMPLETELY STILL
- no breathing, no sway, no head bob, no idle loop: the final settled pose is frozen (identical frames)
- "new pose every frame" applies only WHILE a move/action/expression change is happening
## How the face is built in code
- the head is a 3D SPHERE; face features (eye ovals, brows, mouth) are 2D curves -> filled shapes triangulated into tiny
  triangles (thin strokes = ribbon meshes) -> each vertex projected onto the head sphere surface (sit just above it)
- so the face wraps around the head and turns/foreshortens correctly when the head rotates; expressions = swapping/
  morphing the curves
- face meshes are CACHED: once a face (expression) is built it is stored, up to 24 cached faces per character
  (LRU); every later frame only re-uses/rotates the cached mesh with the head - never rebuilt per frame
- camera passing the front: the face does NOT slide smoothly across; when the camera crosses the character's front
  centre-line the face FLIPS to the other side in ONE frame (3/4-left -> 3/4-right, cartoon-style snap)
- past 95% the face TURNS OFF: once the face is turned more than 95% of the way away from camera (toward the
  silhouette edge / back of head), hide it completely instead of drawing a squashed sliver on the rim
## Camera: every shot uses one of 3 moves (Rick's originals all move the same way)
1. PUSH-IN: camera travels straight toward the subject
2. ORBIT: camera arcs around the subject (keeps looking at it) - this is when the face flip happens
3. WHIP: fast move that STOPS IN 1 FRAME - no settle, no wobble, no ease-out at the end
- example frame: low camera skimming along the rails/structure, strong perspective, warm low sun
- the camera stands still in only ~4.5% of frames (e.g. ~105 of 2350): it is moving in ~95% of all frames
- ORBIT size: looks like a 180 but is only ~98 degrees of arc around the subject (camera swings under/around the front,
  so the face flip happens mid-orbit)
## Camera code (from Rick's camera_moves.js)
- every shot = { pos, target, fov: 26 } THAT CHANGE OVER TIME (shot(t) -> pos(t), target(t); lens stays 26)  (a long 26-degree lens: flatter, telephoto look; our old shots used 44-66)
- pushIn(shot, { factor: 1.9, ease: 'outCubic' })  -> camera distance to target shrinks by 1.9x, outCubic ease
- orbit(center, { az0: -44, az1: 55, el: 17.5 })   -> azimuth -44 deg to +55 deg (= 99 deg arc), elevation 17.5 deg
- if (K[i].stop) return 0;  // whip lands: hard stop (zero velocity in 1 frame)
- shake: nz = sin(t*4.59)*.5 + sin(t*8.61)*.3 + ...  (sum of incommensurate sines = handheld noise)
## 5 camera styles (built on top of the 3 moves; our own definitions - Rick's exact versions unknown)
Pick ONE style per story beat; all keep fov 26, push-in 1.9x outCubic, orbit ~98 deg, whip hard stop, still <= 4.5%.
1. DREAD CUTS - tension beats: short shots (12-24 frames), each a slow push-in on a detail (door, stair, eyes), hard cut
   to the next, getting tighter each cut; ends on a whip that hard-stops on the reveal. No shake.
2. ONE TAKE - storytelling runs: one continuous shot (3-8 s) chaining push-in -> orbit -> whip-to-next-subject without
   cutting; the camera travels through the set from beat to beat.
3. FOUND FOOTAGE - "evidence"/modern tourist/ghost-hunter beats: handheld shake on (nz sines x2 strength), slight
   lag/overshoot on pans, eye-height camera, quick reframes; can add a REC dot / timecode overlay.
4. THE WATCHER - something is watching: camera hides behind foreground objects (doorframes, banisters, plants, windows)
   far from the subject, very slow push-in, no shake, long-lens voyeur framing; the subject is small in frame.
5. THROUGH THE STEEL (invented by a subagent for Rick's submarine short: the camera just FOLLOWS THE SOUND through the hull) - the camera is driven by the soundtrack: each sound
   (hammer hit, creak, footstep, bell, whisper) pulls the camera toward / whips it to the thing making it; push-ins on
   sustained sounds, whip + hard stop on sharp hits; silence = camera drifts toward the next sound source.
   The camera passes THROUGH WALLS AND WATER (clips straight through solid geometry: walls, floors, hull, water) to
   reach the sound - no cut needed. (Winchester: follow the hammering through walls, floors and rooms of the house.)
## Finish = DETAIL (matters more than anything else)
- characters: costume details that read as identity (watch chains, buttons, stitching, plaid, badges, tools/props in hand)
- world: every frame dressed with small details (props, debris, plants, particles/floating specks, signage, wear)
- effects: emotion FX (steam puffs, colour-flushed heads), dust, sparks, shavings on hits
## Clothes shading
- soft horizontal gradient: LIGHT on the left -> DARKER on the right (right side 1.4x to 2x darker than the left)
- a thin PALE STREAK (rim highlight) just inside the LEFT edge, following the outline curve (top-to-mid, not full length)
- warm ink outline on top
## Shadows
- each character is re-drawn a second time from the SUN's point of view, just for its shadow: a 2048x2048 depth
  (shadow) map from the directional sun light; characters cast real soft ground shadows (sun up-right -> shadow falls
  down-left, long soft grey ellipse-like shape)
- the sun pass is JUST for the shadow: characters are NOT lit/shaded by the scene lights (no sun shading, no receiving
  world shadows on the body); their look comes only from their own drawn colours + the fixed left-light gradient/streak
