import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/theme'

/*
 * Aurora — a live WebGL2 port of the React Bits "Aurora" background
 * (reactbits.dev, MIT). The simplex-noise ribbon shader is theirs verbatim;
 * the ogl wrapper is replaced with ~70 lines of raw WebGL2 so we ship zero
 * extra dependencies. Falls back to the original CSS blob backdrop when
 * WebGL2 is unavailable or the user prefers reduced motion.
 */

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ),
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \\
  int index = 0;                                            \\
  for (int i = 0; i < 2; i++) {                               \\
     ColorStop currentColor = colors[i];                    \\
     bool isInBetween = currentColor.position <= factor;    \\
     index = int(mix(float(index), float(i), float(isInBetween))); \\
  }                                                         \\
  ColorStop currentColor = colors[index];                   \\
  ColorStop nextColor = colors[index + 1];                  \\
  float range = nextColor.position - currentColor.position; \\
  float lerpFactor = (factor - currentColor.position) / range; \\
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \\
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;

  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace('#', ''), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

const LIGHT_STOPS = ['#818cf8', '#a78bfa', '#67e8f9']
const DARK_STOPS = ['#6366f1', '#8b5cf6', '#22d3ee']

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function AuroraCanvas({
  stops,
  amplitude,
  blend,
  speed,
}: {
  stops: string[]
  amplitude: number
  blend: number
  speed: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const stopsRef = useRef(stops)
  stopsRef.current = stops

  useEffect(() => {
    const ctn = ref.current
    if (!ctn) return
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;'
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true })
    if (!gl) return

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      return sh
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[aurora] shader link failed:', gl.getProgramInfoLog(prog))
      return
    }
    gl.useProgram(prog)

    // Fullscreen triangle
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'position')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const u = {
      time: gl.getUniformLocation(prog, 'uTime'),
      amplitude: gl.getUniformLocation(prog, 'uAmplitude'),
      stops: gl.getUniformLocation(prog, 'uColorStops'),
      resolution: gl.getUniformLocation(prog, 'uResolution'),
      blend: gl.getUniformLocation(prog, 'uBlend'),
    }

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0, 0, 0, 0)

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const resize = () => {
      const w = Math.max(1, Math.round(ctn.clientWidth * dpr))
      const h = Math.max(1, Math.round(ctn.clientHeight * dpr))
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
      gl.uniform2f(u.resolution, w, h)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(ctn)
    ctn.appendChild(canvas)
    resize()

    gl.uniform1f(u.amplitude, amplitude)
    gl.uniform1f(u.blend, blend)

    let raf = 0
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw)
      if (document.hidden) return
      gl.uniform1f(u.time, t * 0.001 * speed)
      gl.uniform3fv(u.stops, new Float32Array(stopsRef.current.flatMap(hexToRgb)))
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.remove()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [amplitude, blend, speed])

  return <div ref={ref} className="absolute inset-0 overflow-hidden" />
}

/** Legacy CSS blob backdrop — the reduced-motion / no-WebGL fallback. */
function CssBlobs({ intensity }: { intensity: number }) {
  return (
    <>
      <div
        className="animate-aurora-1 absolute -left-[10%] -top-[15%] h-[55vh] w-[55vh] rounded-full blur-[110px]"
        style={{ background: `hsl(var(--primary) / ${0.28 * intensity})` }}
      />
      <div
        className="animate-aurora-2 absolute right-[5%] top-[10%] h-[50vh] w-[50vh] rounded-full blur-[120px]"
        style={{ background: `hsl(262 83% 66% / ${0.22 * intensity})` }}
      />
      <div
        className="animate-aurora-3 absolute bottom-[-10%] left-[30%] h-[45vh] w-[45vh] rounded-full blur-[120px]"
        style={{ background: `hsl(190 90% 55% / ${0.16 * intensity})` }}
      />
    </>
  )
}

/** Ambient backdrop: live WebGL aurora across the top of the viewport, CSS blobs otherwise. */
export function Aurora({ className, intensity = 1 }: { className?: string; intensity?: number }) {
  const { theme } = useTheme()
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const test = document.createElement('canvas')
    setFallback(prefersReducedMotion() || !test.getContext('webgl2'))
  }, [])

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      {fallback ? (
        <CssBlobs intensity={intensity} />
      ) : (
        // The shader's brightest band sits at the top of its own canvas, so the
        // container starts below the topbar — otherwise the good part hides
        // behind frosted chrome. Fades out well before the fold.
        <div
          className="absolute inset-x-0 top-14 h-[58vh]"
          style={{
            opacity: Math.min(1, intensity * (theme === 'dark' ? 1 : 0.7)),
            maskImage: 'linear-gradient(to bottom, black 0%, black 32%, transparent 92%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 32%, transparent 92%)',
          }}
        >
          <AuroraCanvas stops={theme === 'dark' ? DARK_STOPS : LIGHT_STOPS} amplitude={1.1} blend={0.6} speed={0.6} />
        </div>
      )}
    </div>
  )
}

/** A subtle SVG noise/grain overlay to add texture over flat surfaces. */
export function Grain({ className, opacity = 0.035 }: { className?: string; opacity?: number }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 mix-blend-overlay', className)}
      style={{
        opacity,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  )
}
