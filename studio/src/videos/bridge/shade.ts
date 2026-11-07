// Stylised two-tone lighting for every world material (lighting.md 9.2, world part): albedo x mix(shadeCol, litCol,
// sunTerm), sunTerm = real shadow-map visibility x a soft N.L terminator. The sun visibility is captured inside three's
// own light loop (LFB), so nothing is computed twice. Character cards (cardShade) live in the CHAR agent's file and
// can import LFB / CHAR from here; world.ts sets every uniform below once per frame from LIGHTS.
import * as THREE from "three";

export const TONE = {
  uLitCol: { value: new THREE.Vector3(1.5, 1.44, 1.32) }, uShadeCol: { value: new THREE.Vector3(0.6, 0.58, 0.86) },
  uShadeLift: { value: new THREE.Vector3() }, uLambert: { value: 0.35 }, uSideK: { value: 0.84 }, uTerm: { value: 0.2 },
  uBounce: { value: new THREE.Vector3() }, // warm bounce on shaded faces turned to the camera (golden only; day = 0)
  uSat: { value: 1 }, // world albedo saturation around its luminance (characters are not twoTone, so unaffected)
  // NIGHT COLOUR (look round 10): albedo saturation in the DARK (shade, or far from every practical source when
  // uPoolVis = 1). Lit = vivid uSat, dark = uSatDark, so a moon / candle shadow takes the clean colour of its light (blue)
  // instead of orange wood x blue light = mauve. 1 / 0 = off (the bridge).
  uSatDark: { value: 1 }, uPoolVis: { value: 0 },
  // NO PURPLE (Bell Witch user rule): a blend of warm albedo / candle light with blue shade can land on mauve or dusty
  // rose (R and B both above G). 1 = pull the red excess down to green for hues 236-350 deg (luma kept), so those
  // blends read neutral grey-blue; saturated reds / pinks above 330 deg keep their colour. 0 = off (the bridge).
  uNoPurple: { value: 0 },
  uSatMulK: { value: 0 }, // 1 = apply each material's SAT_MUL (SATMUL_OF) on top of uSat / uSatDark (Bell Witch: outdoors only)
};
/** SHINE (Bell Witch look round 10, user: "his pops / shines / smooth"): stylised highlights on GLOSSY materials only
 *  (twoTone gloss > 0; matte stays exactly as before, and uShine.x = 0 switches it off everywhere = the bridge).
 *  x = highlight strength, y = Blinn exponent of the tight hot spot (the soft sheen lobe uses y / 4),
 *  z = half-width of the toon edge of the hot spot, w = fresnel sheen strength (rim of reflected sky / room light).
 *  Highlights come from the key light (moon / candle key) AND from the practical pool sources (candles, hearth,
 *  lanterns: POOL.uPoolP), so pewter / glass / iron near a candle catch a warm glint. */
export const SHINE = {
  uShine: { value: new THREE.Vector4(0, 40, 0.1, 0) },
  uSpecCol: { value: new THREE.Vector3(1, 1, 1) },       // key highlight colour (linear)
  uPoolSpecCol: { value: new THREE.Vector3(1, 0.8, 0.5) }, // highlight colour from the practical sources
  uSheenCol: { value: new THREE.Vector3(0.3, 0.4, 0.7) },  // fresnel sheen colour
};
/** gloss per lam() material key (0 / missing = matte). Filled by the video before its materials are built. */
export const GLOSS_OF: Record<string, number> = {};
/** albedo saturation multiplier per lam() material key (1 / missing = as is), active where TONE.uSatMulK = 1 */
export const SATMUL_OF: Record<string, number> = {};
/** light pools (Bell Witch interiors): brightness falls off with distance from up to 3 practical sources (candles,
 *  hearth) toward uPoolFloor, warm tint uPoolCol right at the source. Positions are VIEW space (world.ts converts every
 *  frame). uPoolK = 0 (default, the bridge) switches it off. Cards use uPoolCardK of the same falloff. */
export const POOL = {
  uPoolP: { value: [new THREE.Vector3(1e5, 0, 0), new THREE.Vector3(1e5, 0, 0), new THREE.Vector3(1e5, 0, 0)] },
  uPoolR: { value: new THREE.Vector2(1.2, 4.5) }, uPoolK: { value: 0 }, uPoolFloor: { value: 0.55 },
  uPoolCol: { value: new THREE.Vector3(1.1, 1.0, 0.88) }, uPoolCardK: { value: 0.5 },
  uPoolFloorCol: { value: new THREE.Vector3(0.55, 0.55, 0.55) }, // far-from-source colour (cool darkness)
};
export const POOL_DECL = "uniform vec3 uPoolP[ 3 ]; uniform vec2 uPoolR; uniform float uPoolK; uniform float uPoolFloor; uniform vec3 uPoolCol; uniform float uPoolCardK; uniform vec3 uPoolFloorCol;";
/** GLSL: vec3 poolM(): multiplier for the pool lighting at this fragment (needs vViewPosition, Lambert/Phong have it) */
export const POOL_FN = /* glsl */ `
float poolK() {
  float pk = 0.0;
  for ( int i = 0; i < 3; i ++ ) pk = max( pk, 1.0 - smoothstep( uPoolR.x, uPoolR.y, length( - vViewPosition - uPoolP[ i ] ) ) );
  return pk;
}
vec3 poolM() { return mix( uPoolFloorCol, uPoolCol, poolK() ); }
`;
/** character-card uniforms (lighting.md 9.2 cardShade); world.ts keeps them in sync with LIGHTS for cardshade.ts */
export const CHAR = {
  uCharTint: { value: new THREE.Vector3(1, 0.94, 0.92) }, uCharShade: { value: 0.86 }, uGrad: { value: 0.07 },
  uBodyGrad: { value: 0.2 }, uSideTint: { value: new THREE.Vector3(0.92, 0.9, 0.96) },
  // optional rim of any colour (Bell Witch: cool moon / warm candle); 0 keeps the bridge's golden-only warm rim
  uRimK: { value: 0 }, uRimCol: { value: new THREE.Vector3(0.95, 0.52, 0.16) },
  // the white faces' own colour (pre-grade): cool white by default; the reference cast's warm cream is set per look
  uFaceTint: { value: new THREE.Vector3(0.95, 0.97, 1.03) },
};

// directional light 0 = the sun = the only shadow caster (three sorts shadow-casting lights first). Only the
// UNROLLED index 0 compiles the shadow block, so sunVis is written once.
export const LFB = THREE.ShaderChunk.lights_fragment_begin
  .replace("directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ]",
    "sunVis = ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ]")
  .replace("vDirectionalShadowCoord[ i ] ) : 1.0;", "vDirectionalShadowCoord[ i ] ) : 1.0;\n\t\tdirectLight.color *= sunVis;");
if (!LFB.includes("directLight.color *= sunVis")) throw new Error("shade.ts: three lights_fragment_begin changed");

const TWO_TONE = /* glsl */ `
#if NUM_DIR_LIGHTS > 0
{
  vec3 sunV = directionalLights[ 0 ].direction;                               // view space, towards the sun
  vec3 upV = normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz );
  float ndl = max( dot( geometryNormal, sunV ), 0.0 );
  float sunTerm = sunVis * smoothstep( 0.0, uTerm, ndl );                     // 0 = cast/form shadow, 1 = lit
  float skyK = mix( uSideK, 1.0, 0.5 + 0.5 * dot( geometryNormal, upV ) );    // up-facing a bit brighter
  vec3 lit = uLitCol * mix( 1.0, ndl, uLambert );                             // keep some cosine modelling
  float facing = max( dot( geometryNormal, geometryViewDir ), 0.0 );        // 1 = faces the lens
  float pkv = poolK() * step( 0.001, uPoolK );                               // 1 at a practical source, 0 far / off
  float vis = sunTerm * mix( 1.0, pkv, uPoolVis );                            // how lit this fragment reads
  float satK = mix( mix( uSatDark, uSat, vis ), max( uSat, uSatDark ), pkv );    // vivid when lit / at a source
  satK *= mix( 1.0, SAT_MUL, uSatMulK );                                       // per-material (grass bluer, wood warmer)
  vec3 alb = max( mix( vec3( dot( diffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) ) ), diffuseColor.rgb, satK ), 0.0 );
  reflectedLight.directDiffuse = alb * ( mix( uShadeCol, lit, sunTerm ) * skyK + uBounce * facing * clamp( 1.0 - dot( geometryNormal, upV ), 0.0, 1.0 ) * ( 1.0 - sunTerm ) )
    + uShadeLift * LIFT_K * ( 1.0 - sunTerm );
  reflectedLight.indirectDiffuse = vec3( 0.0 );                               // hemisphere/fill no longer used here
  reflectedLight.directDiffuse *= mix( vec3( 1.0 ), poolM(), uPoolK );        // practical light pools (off by default)
  if ( uNoPurple > 0.0 ) {
    vec3 o = reflectedLight.directDiffuse;
    float d = max( o.r, o.b ) - o.g;
    if ( o.r > o.g && o.b > o.g && d > 1e-5 ) {
      float h = o.b >= o.r ? 60.0 * ( ( o.r - o.g ) / d + 4.0 ) : 60.0 * ( 6.0 - ( o.b - o.g ) / d );
      float sat = d / max( max( o.r, o.b ), 1e-5 );
      float w = smoothstep( 236.0, 256.0, h ) * ( 1.0 - smoothstep( 344.0, 352.0, h ) );
      w *= mix( 1.0, 1.0 - smoothstep( 0.45, 0.7, sat ), smoothstep( 320.0, 335.0, h ) ) * uNoPurple;
      float dr = w * ( o.r - o.g );
      reflectedLight.directDiffuse = o - vec3( dr, 0.0, 0.0 ) + vec3( 0.2126 * dr );
    }
  }
#ifdef SHINY
  {
    // SHINE: soft sheen lobe + toon hot spot (soft edge) from the key, then from each practical source, + fresnel sheen
    vec3 hV = normalize( sunV + geometryViewDir );
    float nh = max( dot( geometryNormal, hV ), 0.0 );
    vec3 spec = uSpecCol * ( 0.35 * pow( nh, uShine.y * 0.25 ) + smoothstep( 0.5 - uShine.z, 0.5 + uShine.z, pow( nh, uShine.y ) ) )
      * sunVis * smoothstep( 0.0, 0.12, ndl );
    vec3 Pv = - vViewPosition;
    for ( int i = 0; i < 3; i ++ ) {
      vec3 toL = uPoolP[ i ] - Pv;
      float dl = length( toL );
      vec3 lV = toL / max( dl, 1e-4 );
      float att = ( 1.0 - smoothstep( uPoolR.x * 0.5, uPoolR.y, dl ) ) * step( dl, 1e4 );
      float nl2 = max( dot( geometryNormal, lV ), 0.0 );
      float nh2 = max( dot( geometryNormal, normalize( lV + geometryViewDir ) ), 0.0 );
      spec += uPoolSpecCol * att * smoothstep( 0.0, 0.15, nl2 )
        * ( 0.35 * pow( nh2, uShine.y * 0.25 ) + smoothstep( 0.5 - uShine.z, 0.5 + uShine.z, pow( nh2, uShine.y ) ) );
    }
    float fres = pow( 1.0 - facing, 3.0 );
    reflectedLight.directDiffuse += ( spec * uShine.x + uSheenCol * fres * uShine.w ) * GLOSS;
  }
#endif
}
#endif
`;
const SHINE_DECL = "\nuniform vec4 uShine; uniform vec3 uSpecCol; uniform vec3 uPoolSpecCol; uniform vec3 uSheenCol;";
const DECL = "#include <common>\nuniform vec3 uLitCol; uniform vec3 uShadeCol; uniform vec3 uShadeLift; uniform float uLambert; uniform float uSideK; uniform float uTerm; uniform vec3 uBounce; uniform float uSat; uniform float uSatDark; uniform float uPoolVis; uniform float uNoPurple; uniform float uSatMulK;";

/** Lambert (or Phong: its specular term is kept, masked by the shadow) -> two-tone. Call once per material. */
export function twoTone<T extends THREE.MeshLambertMaterial | THREE.MeshPhongMaterial>(m: T, liftK = 1, gloss = 0, satMul = 1): T {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, TONE, POOL, SHINE);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", DECL + POOL_DECL + SHINE_DECL + `\n#define LIFT_K ${liftK.toFixed(3)}\n#define SAT_MUL ${satMul.toFixed(3)}` + (gloss > 0 ? `\n#define SHINY\n#define GLOSS ${gloss.toFixed(3)}` : ""))
      .replace("void main() {", POOL_FN + "\nvoid main() {")
      .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
      .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + TWO_TONE);
  };
  m.customProgramCacheKey = () => "twoTone10_" + liftK.toFixed(3) + "_" + gloss.toFixed(3) + "_" + satMul.toFixed(3);
  return m;
}

// ---------------- tone-map inversion ----------------
// The composer ends in PBR-Neutral tone mapping, so a colour written to the scene buffer is NOT what lands on screen
// (toe: -0.04 linear offset, shoulder above 0.76). Self-lit things whose on-screen colour is a measured target (sky,
// fog, river) are written as untone(target): the linear value that the Neutral curve maps onto the target.
const neutral = (c: number[]) => {
  const x = Math.min(c[0], c[1], c[2]), off = x < 0.08 ? x - 6.25 * x * x : 0.04;
  const v = c.map((k) => k - off), peak = Math.max(v[0], v[1], v[2]), S = 0.76;
  if (peak < S) return v;
  const d = 1 - S, np = 1 - (d * d) / (peak + d - S), g = 1 - 1 / (0.15 * (peak - np) + 1);
  return v.map((k) => (k * np) / peak * (1 - g) + np * g);
};
/** linear input that the Neutral tone map turns into the given on-screen colour (hex or THREE.Color, sRGB target) */
export const untone = (target: THREE.ColorRepresentation, out = new THREE.Color()) => {
  const t = new THREE.Color(target); // linear working space
  const tt = [t.r, t.g, t.b].map((k) => Math.min(k, 0.985));
  let c = tt.slice();
  for (let i = 0; i < 60; i++) { const y = neutral(c); c = c.map((k, j) => Math.max(0, k + (tt[j] - y[j]))); }
  return out.setRGB(c[0], c[1], c[2]);
};
