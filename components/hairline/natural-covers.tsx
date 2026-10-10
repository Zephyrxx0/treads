'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import './cover-motion.css';

export interface NaturalCoverDef {
  id: string;
  name: string;
  description: string;
  svg: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
}

/**
 * 25 preset natural element covers authored in the Hairline aesthetic:
 * Isometric 2:1 projection, single-stroke geometry, rounded hulls, creases,
 * and quiet natural metaphors.
 */
export const NATURAL_COVERS: NaturalCoverDef[] = [
  // 1. River Pebbles
  {
    id: 'pebbles',
    name: 'River Pebbles',
    description: 'Smooth river-worn stones settled in silt',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Ground bed contour */}
        <ellipse cx="200" cy="228" rx="145" ry="52" className="opacity-20" strokeDasharray="4 4" />
        {/* Large center pebble - hull & crease */}
        <path d="M 145 192 C 145 152 215 142 248 165 C 275 182 270 218 235 230 C 188 245 145 228 145 192 Z" />
        <path d="M 168 180 C 196 168 238 174 252 192" className="opacity-40" strokeWidth="1.1" />
        <path d="M 185 208 C 215 212 240 205 255 198" className="opacity-25" strokeWidth="0.9" />
        {/* Left skimming pebble */}
        <path d="M 95 212 C 95 190 148 184 170 200 C 186 214 180 234 152 242 C 118 250 95 234 95 212 Z" />
        <path d="M 112 206 C 134 198 158 202 170 214" className="opacity-40" strokeWidth="1.1" />
        {/* Back pebble */}
        <path d="M 225 152 C 225 134 262 128 284 142 C 300 154 296 174 274 180 C 248 186 225 172 225 152 Z" />
        <path d="M 240 146 C 258 140 278 144 286 154" className="opacity-40" strokeWidth="1.1" />
        {/* Front small river egg */}
        <ellipse cx="208" cy="246" rx="18" ry="9" />
        <path d="M 196 244 C 204 240 218 242 224 246" className="opacity-40" strokeWidth="0.9" />
        {/* Specimen highlight dots */}
        <circle cx="218" cy="180" r="2.5" fill="currentColor" />
        <circle cx="140" cy="216" r="1.5" fill="currentColor" className="opacity-60" />
        {/* Drip ring spreading in the silt */}
        <ellipse cx="208" cy="252" rx="22" ry="9" strokeWidth="1" />
      </svg>
    ),
  },

  // 2. Bird's Nest
  {
    id: 'nest',
    name: "Bird's Nest",
    description: 'Woven twigs circling a calm hollow with three eggs',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Ground plateau */}
        <ellipse cx="200" cy="222" rx="138" ry="48" className="opacity-20" strokeDasharray="3 3" />
        {/* Outer torus hull */}
        <ellipse cx="200" cy="182" rx="108" ry="46" />
        <ellipse cx="200" cy="174" rx="96" ry="38" className="opacity-40" strokeWidth="1.1" />
        {/* Inner hollow cup */}
        <ellipse cx="200" cy="182" rx="58" ry="24" className="opacity-60" strokeWidth="1.2" />
        {/* Interlocking woven twig strands */}
        <path d="M 102 172 C 136 216 264 216 298 172" />
        <path d="M 115 196 C 158 230 242 230 285 196" />
        <path d="M 128 154 C 168 136 232 136 272 154" />
        <path d="M 98 186 C 146 162 254 162 302 186" />
        <path d="M 142 208 C 176 226 224 226 258 208" className="opacity-40" strokeWidth="1" />
        {/* Wandering twig ends */}
        <path d="M 86 166 L 120 182" />
        <path d="M 280 182 L 314 166" />
        <path d="M 176 232 L 216 242" />
        {/* Three resting eggs nestled in the hollow */}
        <path d="M 198.69 177.67 A 9 13 -15 1 1 181.31 182.33 A 9 13 -15 1 1 198.69 177.67 Z" />
        <path d="M 218.08 180.63 A 8.5 12.5 18 1 1 201.92 175.37 A 8.5 12.5 18 1 1 218.08 180.63 Z" />
        <path d="M 208.97 186.78 A 9 12 5 1 1 191.03 185.22 A 9 12 5 1 1 208.97 186.78 Z" />
        <circle cx="188" cy="176" r="1.8" fill="currentColor" />
        <circle cx="211" cy="174" r="1.8" fill="currentColor" />
        <circle cx="200" cy="183" r="1.8" fill="currentColor" />
      </svg>
    ),
  },

  // 3. Forest Acorn
  {
    id: 'acorn',
    name: 'Forest Acorn',
    description: 'Oak fruit held in a textured woody cupule',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Curving petiole stalk */}
        <path d="M 186 62 C 192 84 198 96 200 114" />
        <path d="M 182 66 C 188 84 194 94 196 112" className="opacity-30" strokeWidth="1" />
        {/* Cup cap top rim flange */}
        <ellipse cx="200" cy="126" rx="66" ry="22" />
        {/* Cup cap lower boundary */}
        <path d="M 134 126 C 134 166 266 166 266 126" />
        {/* Overlapping scale imbrications */}
        <path d="M 146 138 C 172 150 228 150 254 138" className="opacity-50" strokeWidth="1.1" />
        <path d="M 160 148 C 182 156 218 156 240 148" className="opacity-40" strokeWidth="1" />
        <path d="M 174 158 C 188 163 212 163 226 158" className="opacity-30" strokeWidth="0.9" />
        {/* Nut body tapering to apical tip */}
        <path d="M 144 132 C 140 190 178 244 200 258 C 222 244 260 190 256 132" />
        {/* Reflective longitudinal light sheen crease */}
        <path d="M 182 142 C 176 190 194 236 200 258" className="opacity-35" strokeWidth="1.1" />
        <path d="M 168 152 C 164 186 178 220 188 238" className="opacity-20" strokeWidth="0.9" />
        <circle cx="200" cy="258" r="2.5" fill="currentColor" />
        <circle cx="188" cy="172" r="2" fill="currentColor" className="opacity-70" />
      </svg>
    ),
  },

  // 4. Pinecone
  {
    id: 'pinecone',
    name: 'Scots Pinecone',
    description: 'Tiered overlapping scales of an evergreen cone',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Axis stem */}
        <path d="M 200 72 L 200 90" />
        {/* Apex bract scale */}
        <path d="M 186 98 C 200 88 214 98 200 108 C 186 98 186 98 186 98 Z" />
        {/* Tier 1 */}
        <path d="M 172 118 C 188 108 202 112 200 124 C 200 112 216 108 228 118 C 214 130 186 130 172 118 Z" />
        <path d="M 186 114 L 200 124 L 214 114" className="opacity-40" strokeWidth="1" />
        {/* Tier 2 */}
        <path d="M 158 146 C 178 132 200 138 200 152 C 200 138 222 132 242 146 C 222 162 178 162 158 146 Z" />
        <path d="M 176 142 L 200 152 L 224 142" className="opacity-40" strokeWidth="1" />
        {/* Tier 3 (broadest) */}
        <path d="M 150 180 C 172 164 200 170 200 186 C 200 170 228 164 250 180 C 228 198 172 198 150 180 Z" />
        <path d="M 172 176 L 200 186 L 228 176" className="opacity-40" strokeWidth="1" />
        {/* Tier 4 */}
        <path d="M 156 216 C 174 202 200 206 200 220 C 200 206 226 202 244 216 C 224 232 176 232 156 216 Z" />
        <path d="M 176 212 L 200 220 L 224 212" className="opacity-40" strokeWidth="1" />
        {/* Base tip */}
        <path d="M 176 244 C 192 236 208 236 224 244 C 212 258 188 258 176 244 Z" />
        <circle cx="200" cy="108" r="2.5" fill="currentColor" />
        <circle cx="200" cy="186" r="2" fill="currentColor" className="opacity-60" />
      </svg>
    ),
  },

  // 5. Chanterelle Mushroom
  {
    id: 'mushroom',
    name: 'Wild Chanterelle',
    description: 'Fluted woodland fungi cap with descending gill ridges',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Ground line */}
        <ellipse cx="200" cy="262" rx="72" ry="18" className="opacity-20" strokeDasharray="3 3" />
        {/* Undulating trumpet cap rim */}
        <path d="M 112 126 C 128 116 156 128 178 120 C 200 112 224 116 246 122 C 268 128 288 120 288 132 C 288 144 264 154 242 150 C 220 146 196 156 174 152 C 152 148 124 154 112 142 C 104 134 104 130 112 126 Z" />
        {/* Central sunken funnel navel */}
        <ellipse cx="200" cy="132" rx="42" ry="15" className="opacity-50" strokeWidth="1.1" />
        <ellipse cx="200" cy="130" rx="14" ry="6" className="opacity-75" />
        {/* Stem column flaring down */}
        <path d="M 166 148 C 178 188 182 226 182 258" />
        <path d="M 234 148 C 222 188 218 226 218 258" />
        <ellipse cx="200" cy="258" rx="18" ry="6" />
        {/* False gill ridges extending down the stem */}
        <path d="M 142 142 C 168 156 186 178 190 202" className="opacity-45" strokeWidth="1" />
        <path d="M 258 142 C 232 156 214 178 210 202" className="opacity-45" strokeWidth="1" />
        <path d="M 174 150 C 184 166 192 182 196 200" className="opacity-35" strokeWidth="0.9" />
        <path d="M 226 150 C 216 166 208 182 204 200" className="opacity-35" strokeWidth="0.9" />
        {/* Little button mushroom companion */}
        <path d="M 124 236 C 132 230 146 232 148 240 C 144 246 130 248 124 242 Z" />
        <path d="M 132 242 L 132 258" strokeWidth="1.2" />
        <circle cx="200" cy="130" r="2.5" fill="currentColor" />
        {/* Spores drifting off the cap */}
        <circle cx="190" cy="124" r="1.6" fill="currentColor" />
        <circle cx="208" cy="120" r="1.3" fill="currentColor" />
        <circle cx="199" cy="116" r="1.8" fill="currentColor" />
      </svg>
    ),
  },

  // 6. Fern Fiddlehead
  {
    id: 'fern',
    name: 'Fern Fiddlehead',
    description: 'Unfurling spring crosier with emerging pinnae',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Stem rising up from forest floor */}
        <path d="M 198 268 C 198 205 204 164 190 134 C 176 102 138 92 138 122 C 138 148 166 158 182 148 C 192 138 186 122 176 122 C 170 122 165 127 167 132" />
        {/* Inner spiral coil */}
        <path d="M 167 132 C 169 136 176 136 178 132" className="opacity-50" strokeWidth="1" />
        {/* Lateral pinnae leaflets in alternating rhythm */}
        <path d="M 198 234 C 220 224 238 228 250 222" />
        <path d="M 198 204 C 224 194 242 198 254 190" />
        <path d="M 196 174 C 222 164 238 168 246 160" />
        <path d="M 198 248 C 178 240 162 244 150 240" />
        <path d="M 200 218 C 180 210 166 214 154 210" />
        <path d="M 198 188 C 182 180 172 184 162 180" />
        {/* Leaflet curls */}
        <circle cx="250" cy="222" r="2" fill="currentColor" />
        <circle cx="254" cy="190" r="2" fill="currentColor" />
        <circle cx="246" cy="160" r="2" fill="currentColor" />
        {/* Crosier apex dot */}
        <circle cx="167" cy="132" r="2.5" fill="currentColor" />
      </svg>
    ),
  },

  // 7. Oak Leaf
  {
    id: 'oak-leaf',
    name: 'English Oak Leaf',
    description: 'Sinuate lobed leaf with branching lateral venation',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Central Rachis / Midrib axis */}
        <path d="M 200 268 L 200 62" />
        {/* Symmetrical rounded lobes */}
        <path d="M 200 62 C 178 74 168 96 178 106 C 156 116 150 138 168 148 C 146 158 142 184 164 194 C 148 204 148 224 174 228 C 184 230 194 248 200 258" />
        <path d="M 200 62 C 222 74 232 96 222 106 C 244 116 250 138 232 148 C 254 158 258 184 236 194 C 252 204 252 224 226 228 C 216 230 206 248 200 258" />
        {/* Secondary lateral veins terminating in lobes */}
        <path d="M 200 106 L 174 94" className="opacity-45" strokeWidth="1.1" />
        <path d="M 200 106 L 226 94" className="opacity-45" strokeWidth="1.1" />
        <path d="M 200 148 L 162 136" className="opacity-45" strokeWidth="1.1" />
        <path d="M 200 148 L 238 136" className="opacity-45" strokeWidth="1.1" />
        <path d="M 200 194 L 158 180" className="opacity-45" strokeWidth="1.1" />
        <path d="M 200 194 L 242 180" className="opacity-45" strokeWidth="1.1" />
        <path d="M 200 228 L 176 218" className="opacity-35" strokeWidth="0.9" />
        <path d="M 200 228 L 224 218" className="opacity-35" strokeWidth="0.9" />
        {/* Leaf apex dot */}
        <circle cx="200" cy="62" r="2.5" fill="currentColor" />
      </svg>
    ),
  },

  // 8. Water Ripples
  {
    id: 'ripples',
    name: 'Clear Spring Ripples',
    description: 'Concentric wave crests expanding from droplet impact',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Concentric 2:1 isometric ellipses */}
        <ellipse cx="200" cy="168" rx="148" ry="54" className="opacity-20" strokeDasharray="4 4" />
        <ellipse cx="200" cy="168" rx="118" ry="42" className="opacity-35" />
        <ellipse cx="200" cy="168" rx="88" ry="31" className="opacity-60" />
        <ellipse cx="200" cy="168" rx="58" ry="20" strokeWidth="1.5" />
        <ellipse cx="200" cy="168" rx="28" ry="10" strokeWidth="1.75" />
        {/* Rebound impact column (Worthington jet) */}
        <path d="M 196 168 C 196 150 198 138 200 126 C 202 138 204 150 204 168" />
        {/* Suspended airborne droplet */}
        <ellipse cx="200" cy="106" rx="5.5" ry="7" />
        <circle cx="200" cy="104" r="2" fill="currentColor" />
        {/* Lateral wave glint lines */}
        <path d="M 120 166 C 140 172 170 174 186 172" className="opacity-30" strokeWidth="1" />
        <path d="M 214 172 C 230 174 260 172 280 166" className="opacity-30" strokeWidth="1" />
      </svg>
    ),
  },

  // 9. Spiral Shell
  {
    id: 'shell',
    name: 'Nautilus Shell',
    description: 'Logarithmic chambered spiral with internal septa',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Continuous logarithmic spiral outer boundary */}
        <path d="M 200 248 C 114 248 94 172 116 118 C 142 64 234 60 278 108 C 320 156 298 236 224 252 C 158 262 136 214 148 172 C 158 134 212 128 234 160 C 250 182 240 214 212 218 C 190 222 178 202 184 184 C 188 172 204 172 208 184" />
        {/* Chamber septum partition arches */}
        <path d="M 116 118 C 136 132 152 144 162 148" className="opacity-40" strokeWidth="1.1" />
        <path d="M 172 74 C 182 98 194 122 198 128" className="opacity-40" strokeWidth="1.1" />
        <path d="M 240 68 C 234 94 228 122 226 128" className="opacity-40" strokeWidth="1.1" />
        <path d="M 292 122 C 268 138 248 152 242 154" className="opacity-40" strokeWidth="1.1" />
        <path d="M 292 188 C 264 186 242 184 238 182" className="opacity-40" strokeWidth="1.1" />
        <path d="M 242 242 C 224 230 216 222 214 218" className="opacity-40" strokeWidth="1.1" />
        {/* Central protoconch core */}
        <circle cx="208" cy="184" r="2.5" fill="currentColor" />
      </svg>
    ),
  },

  // 10. Ancient Tree Rings
  {
    id: 'tree-rings',
    name: 'Ancient Tree Rings',
    description: 'Heartwood slab with annual growth rings and radial checks',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Slab bark perimeter & thickness rim */}
        <ellipse cx="200" cy="162" rx="132" ry="64" />
        <ellipse cx="200" cy="168" rx="132" ry="64" className="opacity-30" strokeDasharray="3 3" />
        {/* Annual growth rings (eccentric) */}
        <ellipse cx="202" cy="163" rx="108" ry="52" className="opacity-45" strokeWidth="1.1" />
        <ellipse cx="204" cy="164" rx="84" ry="40" strokeWidth="1.3" />
        <ellipse cx="206" cy="165" rx="58" ry="27" className="opacity-45" strokeWidth="1.1" />
        <ellipse cx="208" cy="166" rx="32" ry="15" strokeWidth="1.3" />
        <ellipse cx="210" cy="167" rx="14" ry="7" className="opacity-60" strokeWidth="1" />
        {/* Radial checks / split lines */}
        <path d="M 200 98 L 202 122" className="opacity-50" strokeWidth="1.2" />
        <path d="M 332 162 L 292 164" className="opacity-50" strokeWidth="1.2" />
        <path d="M 68 162 L 108 163" className="opacity-50" strokeWidth="1.2" />
        <path d="M 265 212 L 245 198" className="opacity-40" strokeWidth="1" />
        {/* Central pith core */}
        <circle cx="211" cy="167" r="3" fill="currentColor" />
      </svg>
    ),
  },

  // 11. Four-Leaf Clover
  {
    id: 'clover',
    name: 'Field Shamrock',
    description: 'Four cordate leaflets with pale chevron markings',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Curving petiole stem */}
        <path d="M 200 162 C 206 216 178 252 156 272" />
        {/* Top Leaflet */}
        <path d="M 200 162 C 178 128 168 92 200 96 C 232 92 222 128 200 162 Z" />
        <path d="M 186 122 C 200 114 214 122 214 122" className="opacity-40" strokeWidth="1" />
        {/* Bottom Leaflet */}
        <path d="M 200 162 C 178 196 168 232 200 228 C 232 232 222 196 200 162 Z" />
        <path d="M 186 202 C 200 210 214 202 214 202" className="opacity-40" strokeWidth="1" />
        {/* Left Leaflet */}
        <path d="M 200 162 C 166 140 130 130 134 162 C 130 194 166 184 200 162 Z" />
        <path d="M 160 148 C 152 162 160 176 160 176" className="opacity-40" strokeWidth="1" />
        {/* Right Leaflet */}
        <path d="M 200 162 C 234 140 270 130 266 162 C 270 194 234 184 200 162 Z" />
        <path d="M 240 148 C 248 162 240 176 240 176" className="opacity-40" strokeWidth="1" />
        {/* Center eye node */}
        <circle cx="200" cy="162" r="3.5" fill="currentColor" />
      </svg>
    ),
  },

  // 12. Songbird Feather
  {
    id: 'feather',
    name: 'Songbird Feather',
    description: 'Slender rachis shaft with asymmetric vane and barb striations',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Main curved rachis shaft */}
        <path d="M 112 258 C 158 214 232 142 286 68" />
        <path d="M 108 262 C 114 256 122 248 132 238" className="opacity-40" strokeWidth="1.2" />
        {/* Upper narrow vane */}
        <path d="M 286 68 C 264 90 212 108 172 144 C 146 170 134 206 132 228" />
        {/* Lower broad vane */}
        <path d="M 286 68 C 280 110 248 148 222 184 C 190 226 162 242 142 246" />
        {/* Fine parallel barbs */}
        <path d="M 260 94 L 244 120" className="opacity-35" strokeWidth="0.9" />
        <path d="M 234 118 L 212 146" className="opacity-35" strokeWidth="0.9" />
        <path d="M 208 148 L 182 176" className="opacity-35" strokeWidth="0.9" />
        <path d="M 250 124 L 270 134" className="opacity-35" strokeWidth="0.9" />
        <path d="M 220 158 L 242 172" className="opacity-35" strokeWidth="0.9" />
        <path d="M 190 196 L 210 212" className="opacity-35" strokeWidth="0.9" />
        {/* Quill tip calamus dot */}
        <circle cx="286" cy="68" r="2.5" fill="currentColor" />
        <circle cx="112" cy="258" r="2" fill="currentColor" className="opacity-75" />
      </svg>
    ),
  },

  // 13. Wild Honeycomb
  {
    id: 'honeycomb',
    name: 'Wild Honeycomb',
    description: 'Hexagonal wax prisms in an isometric lattice with honey drop',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Center Hexagon with prism depth */}
        <polygon points="200,128 228,144 228,176 200,192 172,176 172,144" />
        <polygon points="200,134 222,147 222,173 200,186 178,173 178,147" className="opacity-40" strokeWidth="1" />
        {/* Top Right */}
        <polygon points="228,80 256,96 256,128 228,144 200,128 200,96" />
        {/* Top Left */}
        <polygon points="172,80 200,96 200,128 172,144 144,128 144,96" />
        {/* Right */}
        <polygon points="256,128 284,144 284,176 256,192 228,176 228,144" />
        {/* Bottom Right */}
        <polygon points="228,176 256,192 256,224 228,240 200,224 200,192" />
        {/* Bottom Left */}
        <polygon points="172,176 200,192 200,224 172,240 144,224 144,192" />
        {/* Left */}
        <polygon points="144,128 172,144 172,176 144,192 116,176 116,144" />
        {/* Golden honey bead in center cell */}
        <ellipse cx="200" cy="160" rx="9" ry="11" />
        <circle cx="198" cy="157" r="2.5" fill="currentColor" />
      </svg>
    ),
  },

  // 14. Alpine Ridge
  {
    id: 'mountain',
    name: 'Alpine Topography',
    description: 'Arête ridgeline and stepped elevation contours',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Main Peak Spine Outline */}
        <path d="M 86 254 L 200 86 L 314 254" />
        {/* Central Knife-Edge Arête Ridge */}
        <path d="M 200 86 C 188 148 206 202 210 254" />
        {/* West slope stepped contour terraces */}
        <path d="M 196 116 L 152 168" className="opacity-45" strokeWidth="1.1" />
        <path d="M 194 148 L 130 212" className="opacity-45" strokeWidth="1.1" />
        <path d="M 198 188 L 114 254" className="opacity-45" strokeWidth="1.1" />
        {/* East slope sun contours */}
        <path d="M 204 122 L 238 164" className="opacity-30" strokeWidth="1" />
        <path d="M 206 160 L 262 214" className="opacity-30" strokeWidth="1" />
        {/* Distant horn sub-peak */}
        <path d="M 258 172 L 292 118 L 338 192" />
        <path d="M 292 118 L 298 192" className="opacity-40" strokeWidth="1" />
        <circle cx="200" cy="86" r="3" fill="currentColor" />
        {/* Passing cloud */}
        <path d="M 112 58 C 112 50 122 46 130 50 C 134 42 148 42 152 50 C 162 46 172 52 170 58 Z" strokeWidth="1.1" />
      </svg>
    ),
  },

  // 15. Spring Seedling
  {
    id: 'seedling',
    name: 'Spring Seedling',
    description: 'First cotyledon leaves emerging from an isometric soil bed',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Isometric Soil Mound */}
        <ellipse cx="200" cy="248" rx="108" ry="28" />
        <ellipse cx="200" cy="244" rx="76" ry="18" className="opacity-35" strokeDasharray="3 3" />
        {/* Hypocotyl Stem Arch */}
        <path d="M 200 242 C 200 192 194 158 198 138" />
        {/* Left Cotyledon Leaf */}
        <path d="M 198 142 C 168 138 142 112 152 92 C 178 86 194 116 198 142 Z" />
        <path d="M 166 114 C 182 112 194 124 198 142" className="opacity-40" strokeWidth="1" />
        {/* Right Cotyledon Leaf */}
        <path d="M 198 142 C 228 138 254 112 244 92 C 218 86 202 116 198 142 Z" />
        <path d="M 230 114 C 214 112 202 124 198 142" className="opacity-40" strokeWidth="1" />
        {/* Terminal epicotyl bud */}
        <circle cx="198" cy="136" r="3" fill="currentColor" />
        <circle cx="198" cy="88" r="1.5" fill="currentColor" className="opacity-70" />
      </svg>
    ),
  },

  // 16. Quartz Crystals
  {
    id: 'crystals',
    name: 'Quartz Crystals',
    description: 'Hexagonal crystalline prism cluster with termination pyramids',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Matrix base plateau */}
        <ellipse cx="200" cy="248" rx="90" ry="24" className="opacity-20" strokeDasharray="3 3" />
        {/* Main center crystal tower */}
        <path d="M 184 242 L 184 138 L 205 96 L 226 138 L 226 242" />
        <path d="M 205 96 L 205 242" />
        {/* Left rhombohedral crystal */}
        <path d="M 148 242 L 148 172 L 164 138 L 184 164 L 184 242" />
        <path d="M 164 138 L 164 242" />
        {/* Right companion crystal */}
        <path d="M 226 242 L 226 178 L 246 152 L 262 184 L 262 242" />
        <path d="M 246 152 L 246 242" />
        {/* Horizontal growth striations */}
        <path d="M 184 160 L 205 160" className="opacity-35" strokeWidth="0.9" />
        <path d="M 184 180 L 205 180" className="opacity-35" strokeWidth="0.9" />
        <path d="M 205 170 L 226 170" className="opacity-35" strokeWidth="0.9" />
        <path d="M 205 190 L 226 190" className="opacity-35" strokeWidth="0.9" />
        <circle cx="205" cy="96" r="3" fill="currentColor" />
        {/* Glints */}
        <path d="M 214 80 L 214 92 M 208 86 L 220 86" strokeWidth="1.1" />
        <path d="M 150 118 L 150 128 M 145 123 L 155 123" strokeWidth="1" />
        <path d="M 270 136 L 270 148 M 264 142 L 276 142" strokeWidth="1" />
      </svg>
    ),
  },

  // 17. Morning Dew
  {
    id: 'dewdrop',
    name: 'Morning Dew',
    description: 'Spherical water drop poised on an arched blade of fescue',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Arching Grass Blade */}
        <path d="M 94 264 C 126 192 178 118 284 118 C 314 118 326 134 332 144" />
        <path d="M 94 264 C 136 202 184 132 284 132 C 308 132 320 140 332 144" className="opacity-45" strokeWidth="1.1" />
        <path d="M 130 220 C 160 170 200 134 260 128" className="opacity-25" strokeWidth="0.9" />
        {/* Dewdrop poised on blade crest */}
        <ellipse cx="232" cy="112" rx="20" ry="18" />
        <ellipse cx="226" cy="107" rx="7" ry="6" className="opacity-60" />
        <circle cx="227" cy="107" r="2.5" fill="currentColor" />
        {/* Secondary tiny bead near blade tip */}
        <circle cx="318" cy="138" r="4" />
        <circle cx="318" cy="138" r="1.5" fill="currentColor" />
        {/* A falling bead */}
        <circle cx="232" cy="130" r="2.4" fill="currentColor" />
      </svg>
    ),
  },

  // 18. Winter Twig
  {
    id: 'twig',
    name: 'Winter Twig',
    description: 'Hardwood stem with swollen leaf scar nodes and dormant buds',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Zigzag main branch */}
        <path d="M 116 254 C 168 214 198 162 262 88" />
        {/* Node 1 & Lateral branch */}
        <path d="M 178.1 189.13 A 5 3 -35 1 1 169.9 194.87 A 5 3 -35 1 1 178.1 189.13 Z" className="opacity-50" />
        <path d="M 174 192 C 158 172 142 162 136 146" />
        <path d="M 141.64 143.95 A 6 8 -20 1 1 130.36 148.05 A 6 8 -20 1 1 141.64 143.95 Z" />
        <circle cx="136" cy="146" r="2" fill="currentColor" />
        {/* Node 2 & Lateral branch */}
        <path d="M 220.1 148.87 A 5 3 35 1 1 211.9 143.13 A 5 3 35 1 1 220.1 148.87 Z" className="opacity-50" />
        <path d="M 216 146 C 242 140 262 146 278 140" />
        <path d="M 283.44 142.54 A 6 8 25 1 1 272.56 137.46 A 6 8 25 1 1 283.44 142.54 Z" />
        <circle cx="278" cy="140" r="2" fill="currentColor" />
        {/* Plump terminal bud cluster */}
        <path d="M 270.34 86.96 A 7 11 25 1 1 257.66 81.04 A 7 11 25 1 1 270.34 86.96 Z" />
        <circle cx="264" cy="84" r="2.5" fill="currentColor" />
        {/* Snow falling past the twig */}
        <circle cx="96" cy="52" r="1.6" fill="currentColor" />
        <circle cx="150" cy="38" r="1.2" fill="currentColor" />
        <circle cx="212" cy="46" r="1.8" fill="currentColor" />
        <circle cx="296" cy="64" r="1.3" fill="currentColor" />
        <circle cx="336" cy="104" r="1.6" fill="currentColor" />
      </svg>
    ),
  },

  // 19. Wild Blossom
  {
    id: 'blossom',
    name: 'Wild Anemone',
    description: 'Five delicate obovate petals surrounding a stamen ring',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Pedicel Stem */}
        <path d="M 200 162 C 200 214 206 244 216 272" />
        {/* 5 Petals */}
        <ellipse cx="200" cy="114" rx="22" ry="36" />
        <path d="M 273.12 167.16 A 36 22 36 1 1 214.88 124.84 A 36 22 36 1 1 273.12 167.16 Z" />
        <path d="M 234.8 218.92 A 22 36 72 1 1 221.2 177.08 A 22 36 72 1 1 234.8 218.92 Z" />
        <path d="M 178.8 177.08 A 22 36 -72 1 1 165.2 218.92 A 22 36 -72 1 1 178.8 177.08 Z" />
        <path d="M 185.12 124.84 A 36 22 -36 1 1 126.88 167.16 A 36 22 -36 1 1 185.12 124.84 Z" />
        {/* Stamen anther crown */}
        <circle cx="200" cy="162" r="16" className="opacity-50" strokeDasharray="2 3" />
        <circle cx="200" cy="162" r="6" />
        <circle cx="200" cy="162" r="3" fill="currentColor" />
      </svg>
    ),
  },

  // 20. Pine Fascicle
  {
    id: 'pine-needles',
    name: 'Pine Fascicle',
    description: 'Paired evergreen needles held in a basal wrap sheath',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Cylindrical Sheath Base */}
        <path d="M 194 244 L 206 244 L 204 268 L 196 268 Z" />
        <path d="M 194 252 L 206 252" className="opacity-50" strokeWidth="1" />
        <path d="M 195 260 L 205 260" className="opacity-50" strokeWidth="1" />
        {/* Left Needle Arch */}
        <path d="M 196 244 C 178 178 146 118 116 68" />
        <path d="M 196 244 C 176 182 148 126 122 74" className="opacity-35" strokeWidth="0.9" />
        {/* Right Needle Arch */}
        <path d="M 204 244 C 222 178 254 118 284 68" />
        <path d="M 204 244 C 224 182 252 126 278 74" className="opacity-35" strokeWidth="0.9" />
        {/* Droplets at needle tips */}
        <circle cx="116" cy="68" r="3" fill="currentColor" />
        <circle cx="284" cy="68" r="3" fill="currentColor" />
      </svg>
    ),
  },

  // 21. Rock Lichen
  {
    id: 'lichen',
    name: 'Rock Lichen',
    description: 'Foliose rosette with crenulated margins and apothecia cups',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Outer lobed perimeter */}
        <path d="M 200 88 C 242 82 274 108 268 146 C 294 162 298 202 272 224 C 278 254 242 268 212 258 C 182 272 138 258 132 226 C 102 216 102 174 124 154 C 112 122 144 92 180 98 Z" />
        {/* Concentric growth ring */}
        <path d="M 200 118 C 232 112 254 134 248 162 C 264 176 264 202 248 218 C 232 232 206 232 192 222 C 172 232 150 222 150 202 C 134 192 134 166 150 150 C 150 128 176 118 200 118 Z" className="opacity-40" strokeWidth="1.1" />
        {/* Apothecia fruiting disks */}
        <circle cx="200" cy="170" r="14" />
        <circle cx="200" cy="170" r="5" fill="currentColor" />
        <circle cx="164" cy="148" r="8" />
        <circle cx="164" cy="148" r="2.5" fill="currentColor" />
        <circle cx="238" cy="186" r="7" />
        <circle cx="238" cy="186" r="2" fill="currentColor" />
      </svg>
    ),
  },

  // 22. Odonata Wing
  {
    id: 'dragonfly-wing',
    name: 'Odonata Wing',
    description: 'Chitinous venation lattice with pterostigma cell',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Wing Outline */}
        <path d="M 96 224 C 158 172 252 98 314 88 C 318 98 304 136 252 182 C 198 224 138 244 96 224 Z" />
        {/* Subcostal main longitudinal vein */}
        <path d="M 96 224 C 158 166 246 104 308 96" className="opacity-55" strokeWidth="1.2" />
        {/* Radial cross-veins */}
        <path d="M 158 198 L 174 162" className="opacity-35" strokeWidth="0.9" />
        <path d="M 194 178 L 210 142" className="opacity-35" strokeWidth="0.9" />
        <path d="M 230 156 L 246 122" className="opacity-35" strokeWidth="0.9" />
        <path d="M 266 132 L 282 106" className="opacity-35" strokeWidth="0.9" />
        {/* Dark Pterostigma cell */}
        <rect x="288" y="91" width="14" height="5" rx="1.5" fill="currentColor" />
        <circle cx="314" cy="88" r="2" fill="currentColor" />
      </svg>
    ),
  },

  // 23. Dandelion Achene
  {
    id: 'sunburst-seed',
    name: 'Dandelion Achene',
    description: 'Radiating capillary pappus parachute with cypsela seed',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Radiating umbrella pappus rays */}
        <path d="M 200 128 L 200 66" />
        <path d="M 200 128 L 158 80" />
        <path d="M 200 128 L 242 80" />
        <path d="M 200 128 L 126 106" />
        <path d="M 200 128 L 274 106" />
        <path d="M 200 128 L 138 142" />
        <path d="M 200 128 L 262 142" />
        {/* Pappus ray tip dots */}
        <circle cx="200" cy="66" r="2" fill="currentColor" />
        <circle cx="158" cy="80" r="2" fill="currentColor" />
        <circle cx="242" cy="80" r="2" fill="currentColor" />
        <circle cx="126" cy="106" r="2" fill="currentColor" />
        <circle cx="274" cy="106" r="2" fill="currentColor" />
        {/* Slender rostrum beak */}
        <path d="M 200 128 L 200 222" />
        {/* Barbed Cypsela seed body */}
        <ellipse cx="200" cy="238" rx="6" ry="16" />
        <path d="M 194 230 L 190 226" strokeWidth="1.2" />
        <path d="M 206 230 L 210 226" strokeWidth="1.2" />
        <circle cx="200" cy="128" r="3.5" fill="currentColor" />
      </svg>
    ),
  },

  // 24. Ginkgo Biloba
  {
    id: 'ginkgo',
    name: 'Ginkgo Biloba',
    description: 'Ancient fan leaf with deep central sinus and forking veins',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Slender Petiole Stem */}
        <path d="M 200 272 C 198 232 198 190 200 174" />
        {/* Fan Blade with Central Sinus Notch */}
        <path d="M 200 174 C 158 168 118 148 122 108 C 144 88 184 94 200 114 C 216 94 256 88 278 108 C 282 148 242 168 200 174 Z" />
        {/* Dichotomous branching veins */}
        <path d="M 200 170 C 178 148 158 128 148 104" className="opacity-35" strokeWidth="0.9" />
        <path d="M 200 170 C 188 144 182 122 182 108" className="opacity-35" strokeWidth="0.9" />
        <path d="M 200 170 C 222 148 242 128 252 104" className="opacity-35" strokeWidth="0.9" />
        <path d="M 200 170 C 212 144 218 122 218 108" className="opacity-35" strokeWidth="0.9" />
        <circle cx="200" cy="114" r="2.5" fill="currentColor" />
      </svg>
    ),
  },

  // 25. Meandering Brook
  {
    id: 'river-brook',
    name: 'Meandering Brook',
    description: 'Sinuous river cutbank and point-bar channel flow',
    svg: (props) => (
      <svg viewBox="0 0 400 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {/* Isometric terrain boundary */}
        <ellipse cx="200" cy="170" rx="146" ry="60" className="opacity-20" strokeDasharray="4 4" />
        {/* Left Cutbank */}
        <path d="M 116 68 C 172 108 138 162 192 212 C 222 242 212 262 212 272" />
        {/* Right Point-Bar Bank */}
        <path d="M 178 68 C 234 108 200 162 254 212 C 284 242 274 262 274 272" />
        {/* Central Thread Thalweg Flow */}
        <path d="M 148 68 C 204 108 170 162 224 212 C 254 242 244 262 244 272" className="opacity-45" strokeDasharray="4 4" strokeWidth="1.1" />
        {/* Terrace contour lines */}
        <path d="M 96 118 C 128 138 116 182 148 222" className="opacity-35" strokeWidth="0.9" />
        <path d="M 212 88 C 254 118 232 172 274 202" className="opacity-35" strokeWidth="0.9" />
        <circle cx="200" cy="162" r="3" fill="currentColor" />
        {/* Leaves carried on the current */}
        <circle cx="0" cy="0" r="3.2" fill="currentColor" />
        <circle cx="0" cy="0" r="2.2" fill="currentColor" />
      </svg>
    ),
  },
];

/**
 * Returns a deterministic natural cover based on string or number seed.
 */
export function getNaturalCover(seed: string | number): NaturalCoverDef {
  let hash = 0;
  if (typeof seed === 'number') {
    hash = Math.abs(seed);
  } else {
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    hash = Math.abs(hash);
  }
  const index = hash % NATURAL_COVERS.length;
  return NATURAL_COVERS[index];
}

export function getNaturalCoverById(id: string): NaturalCoverDef | undefined {
  return NATURAL_COVERS.find((c) => c.id === id);
}

/**
 * A cover drawn with its loop: the same line art, plus the `data-cover` hook
 * and `cover-anim` class that cover-motion.css animates.
 */
export function CoverArt({ cover, className }: { cover: NaturalCoverDef; className?: string }) {
  const Svg = cover.svg;
  return <Svg data-cover={cover.id} className={cn('cover-anim', className)} />;
}
