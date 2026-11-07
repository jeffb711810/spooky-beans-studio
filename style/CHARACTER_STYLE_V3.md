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
## 5 camera styles (built on top of the 3 moves) - details TBD from user
1. Dread Cuts  2. One Take  3. Found Footage  4. The Watcher  5. Through the Steel
