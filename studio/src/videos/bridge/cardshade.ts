// Character card shading (lighting.md 9.2 / 9.5). Replaces the flat emissive "pasted-on" look: the card takes the
// scene light colour as a tint, keeps a bright floor where a cast shadow falls on it (charShade ~.86), and gets a soft
// side gradient toward the real sun (head ~charGrad, torso ~bodyGrad) with a lavender far side.
// Contract with WORLD: LFB (sun shadow visibility inside three's light loop) and CHAR (uniforms world.ts updates from
// LIGHTS every frame) come from shade.ts; the sun direction is three's own directional light 0.
// The drawing already carries a painted crescent (toon.ts shadedFill / gradFill), so the shader adds GRAD_K of the
// preset gradient, and the preset tint (measured on WHITE heads) is applied at TINT_K so peach skin stays clean
// (lighting.md 9.1 note: golden ~[1, .88, .76], day ~[1, .97, .96] for peach skin).
// Chars round 2: the head / torso zones come from the drawing itself (toon.ts Pen.mark -> canvas.__card -> per-material
// uniforms uHead / uTorso set in onBeforeRender), so kids, sitters and tilted heads get the head gradient on the head and
// the torso gradient on the torso (the fixed UV bands put a sitting adult's face, and most of a kid's, in the torso
// band). The sphere shading, sheen, hat shadow and cloth form are painted in the drawing (toon.ts sphereFill /
// formShade / hatShadow), so the shader's own head gradient is cut to HEAD_K of the preset's.
import * as THREE from "three";
import { LFB, CHAR, POOL, POOL_DECL, POOL_FN } from "./shade";
import type { CardInfo } from "./toon";

export const GRAD_K = 5.5;   // head: preset charGrad x5.5, capped at .4 linear: ~14 % on screen after the grade /
                             // tone-map highlight roll-off (faces sit at ~.96 there; review round 2)
export const GRAD_KB = 1.6;  // torso: preset bodyGrad x1.6 -> ~10-15 % form shade on screen (review round 3)
export const TINT_K = 0.55;
export const HEAD_K = 0.55;  // share of the head gradient left to the shader (the drawing carries the painted sphere)

// Card zones in UV (v = 1 at the top of the 600 x 1000 design card), defaults for a standing adult: head centre v .691,
// half height .111, half width .197; torso half width ~.148. Every character drawing overrides them (uHead / uTorso).
const CARD = /* glsl */ `
vec3 tintK = mix( vec3( 1.0 ), uCharTint, uTintK );
tintK /= pow( max( dot( tintK, vec3( 0.2126, 0.7152, 0.0722 ) ), 0.2 ), uNorm );             // same face value day and golden
vec3 outgoingLight = diffuseColor.rgb * tintK;
#if NUM_DIR_LIGHTS > 0
{
  vec3 sunV = directionalLights[ 0 ].direction;                                          // view space, towards the sun
  vec3 upV = normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz );
  float side = sign( sunV.x ) * smoothstep( 0.0, 0.35, abs( sunV.x ) );                     // saturates: even a near-frontal sun shades one side; + = sun on screen right
  float flip = sign( dFdx( vMapUv.x ) + 1e-7 );                                            // mirrored cards
  vec2 hd = ( vMapUv - uHead.xy ) / uHead.zw;                                               // head-local: -1..1 across the skull, + = up
  float head = smoothstep( -1.12, -0.9, hd.y );                                             // the skull and whatever sits on it, down to the chin
  float uu = mix( clamp( ( vMapUv.x - uTorso.x ) / uTorso.z, -1.0, 1.0 ), clamp( hd.x, -1.0, 1.0 ), head ) * flip; // -1..1 screen left..right
  float t = uu * side;                                                                     // +1 = edge facing the sun
  float gRef = min( uGrad * uGradK, 0.4 );
  float g = mix( uBodyGrad * uGradKB, gRef * uHeadK, head );
  float dark = smoothstep( -0.15, 0.9, -t );                                                 // far side
  vec3 sideK = mix( vec3( 1.0 ), uSideTint, dark * clamp( g / max( gRef, 1e-3 ), 0.0, 1.5 ) * 0.5 );
  float top = 1.0 + 0.05 * clamp( hd.y, -1.0, 1.0 ) * clamp( dot( sunV, upV ) * 2.0, 0.0, 1.0 ) * head;
  float lift = 1.0 + 0.04 * smoothstep( 0.0, 0.9, t );
  outgoingLight *= mix( uCharShade, 1.0, sunVis ) * ( 1.0 - g * dark ) * sideK * top * lift * uGain;
  outgoingLight *= mix( vec3( 1.0 ), poolM(), uPoolK * uPoolCardK );                     // light pools, milder on the cards
  #ifdef USE_MAP
  {
    // INNER warm rim, golden only: the outermost ~2 px (at 1080 wide) of the HEAD skin / TORSO silhouette on the
    // sun-facing edge. No offset copy: we only test whether the next pixels toward the sun are outside the card.
    // Hats, legs, rifles and other thin parts are skipped (inner sample must be skin, or torso at least ~40 units thick).
    float warm = max( smoothstep( 0.2, 0.4, 1.0 - uCharTint.b ) * step( uRimK, 0.0 ), uRimK );
    float sl = length( sunV.xy );
    vec2 d2 = sunV.xy / max( sl, 1e-4 );
    vec2 duv = 2.0 * uPx * ( d2.x * dFdx( vMapUv ) + d2.y * dFdy( vMapUv ) );
    float edge = step( texture2D( map, vMapUv + duv ).a, 0.5 );
    vec2 dirU = normalize( duv + vec2( 1e-9 ) );
    vec4 c1 = texture2D( map, vMapUv - dirU * vec2( 0.027, 0.016 ) );   // ~16 design units inward (past the ink line)
    vec4 c2 = texture2D( map, vMapUv - dirU * vec2( 0.067, 0.04 ) );    // ~40 units inward: thick parts only
    float skin = step( 0.5, c1.a ) * step( 0.3, c1.r ) * step( c1.b + 0.12, c1.r ) * step( c1.g, c1.r + 0.02 );
    float torso = step( abs( vMapUv.y - uTorso.y ), uTorso.w ) * ( 1.0 - head ) * step( 0.5, c1.a ) * step( 0.5, c2.a ) * step( 0.04, max( c1.r, max( c1.g, c1.b ) ) );
    float rim = warm * smoothstep( 0.1, 0.4, sl ) * edge * max( skin * head, torso ) * mix( 0.6, 1.0, sunVis );
    outgoingLight += mix( vec3( 0.95, 0.52, 0.16 ), uRimCol, step( 0.001, uRimK ) ) * rim;
    // GLOSS (user: "the characters don't have that same shine"): the reference heads read as glossy balls, a broad
    // bright patch on the upper key side plus a whiter core, added AFTER the lighting so it survives dim light. Only
    // on skin pixels of the head (peach test on the drawn texel), so hats, hair, eyes and ink stay as drawn.
    vec4 c0 = texture2D( map, vMapUv );
    // skin = peach (red well above blue) or warm near-white (the Bell Witch's bone-white faces)
    float bone0 = step( 0.74, c0.r ) * step( 0.7, c0.g ) * step( 0.64, c0.b ) * step( c0.b, c0.r + 0.01 ) * step( c0.r - c0.b, 0.13 );
    float skin0 = step( 0.5, c0.a ) * step( 0.3, c0.r ) * max( step( c0.b + 0.1, c0.r ), bone0 ) * step( c0.g, c0.r + 0.02 ) * step( 0.45, c0.g );
    float sg = side > 0.05 ? 1.0 : -1.0;                                                     // key side on screen (frontal: upper left)
    vec2 hs = vec2( hd.x * flip, hd.y );
    vec2 gc = vec2( 0.3 * sg, 0.42 );
    float gl = 1.0 - smoothstep( 0.45, 1.0, length( ( hs - gc ) / vec2( 0.5, 0.34 ) ) );
    float gk = 1.0 - smoothstep( 0.0, 1.0, length( ( hs - gc - vec2( 0.06 * sg, 0.05 ) ) / vec2( 0.2, 0.12 ) ) );
    // white faces: half the scene tint taken back (they read WHITE, lit by the room, not cream), and only a third of
    // this gloss (the drawing's own hot spot carries the shine; at full strength it saturated into a white streak
    // under hat brims)
    // BRIGHT WHITE FACES (user: "his is bright white, almost a light on its face"): the white face pixels (a SMOOTH mask:
    // light + unsaturated, so the drawn shine band and hot spot fade in and out of it with no edge) mostly ignore the
    // room light and sit just under the tone map's shoulder: near-white in candlelight and moonlight alike, the drawn
    // shading still reading on top. Ink, hair, hats and eyes (dark or coloured) keep the scene lighting.
    float lum0 = dot( c0.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
    float sat0 = max( c0.r, max( c0.g, c0.b ) ) - min( c0.r, min( c0.g, c0.b ) );
    float pw = smoothstep( 0.5, 0.7, lum0 ) * ( 1.0 - smoothstep( 0.1, 0.19, sat0 ) ) * smoothstep( 0.3, 0.6, c0.a ) * head;
    outgoingLight *= mix( vec3( 1.0 ), 1.0 / max( tintK, vec3( 0.2 ) ), 0.5 * pw );
    // gain kept under the bloom threshold (1.0): at 1.22 the faces bloomed and greyed the eye rings / pupils
    outgoingLight = mix( outgoingLight, diffuseColor.rgb * uFaceTint, 0.85 * pw );
    outgoingLight += vec3( 1.0, 0.985, 0.96 ) * ( 0.2 * gl + 0.38 * gk ) * ( 1.0 - pw ) * skin0 * head * step( -0.2, hd.y );
  }
  #endif
}
#endif
`;

const DECL = "#include <common>\nuniform vec3 uCharTint; uniform float uCharShade; uniform float uGrad; uniform float uBodyGrad; uniform vec3 uSideTint;"
  + " uniform float uRimK; uniform vec3 uRimCol; uniform float uGradK; uniform float uGradKB; uniform float uTintK; uniform float uNorm; uniform float uGain; uniform float uPx;"
  + " uniform float uHeadK; uniform vec4 uHead; uniform vec4 uTorso; uniform vec3 uFaceTint;";
/** card-only constants (not per light): gradient share, tint share, overall gain (calibrated: faces ~.93 V) */
export const CARD_K = { uGradK: { value: GRAD_K }, uGradKB: { value: GRAD_KB }, uTintK: { value: TINT_K }, uNorm: { value: 0.7 }, uGain: { value: 1.03 }, uPx: { value: 0.5 },
  uHeadK: { value: HEAD_K } }; // uPx = render height / 1920 (set per draw in cast.ts)
/** standing-adult defaults for a card whose drawing did not mark its head / torso */
const HEAD0: CardInfo["head"] = [0.5, 0.691, 0.197, 0.111], TORSO0: CardInfo["torso"] = [0.5, 0.45, 0.148, 0.15];

/** MeshLambertMaterial -> lit card: no emissive, scene tint, bright floor, side gradient toward the sun. */
export function cardShade(m: THREE.MeshLambertMaterial) {
  m.emissive.set(0x000000); m.emissiveIntensity = 0; m.emissiveMap = null;
  // per-card zones: this material's own uniforms, refreshed from the bound drawing right before each draw
  const own = { uHead: { value: new THREE.Vector4(...HEAD0) }, uTorso: { value: new THREE.Vector4(...TORSO0) } };
  m.onBeforeRender = () => {
    const c = (m.map?.image as { __card?: CardInfo | null } | undefined)?.__card;
    own.uHead.value.set(...(c ? c.head : HEAD0)); own.uTorso.value.set(...(c ? c.torso : TORSO0));
  };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, CHAR, CARD_K, POOL, own);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", DECL + POOL_DECL)
      .replace("void main() {", POOL_FN + "\nvoid main() {")
      .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
      .replace("vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;", CARD);
  };
  m.customProgramCacheKey = () => "card18";
  return m;
}

/** ground contact blob: multiplies what is already drawn (the ground); drawn after the ground and before the cards */
export const blobMaterial = (map: THREE.Texture) => new THREE.MeshBasicMaterial({
  map, transparent: false, depthWrite: false, fog: false, toneMapped: false,
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor,
  polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide,
});
