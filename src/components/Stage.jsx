import { useEffect, useRef, useState } from 'react'

// ---- isometric slab (the 3D "divider" base) ---------------------------------
const slab = (cx, cy, w, h, t, k) => {
  const T = `${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}`
  const L = `${cx - w},${cy} ${cx},${cy + h} ${cx},${cy + h + t} ${cx - w},${cy + t}`
  const R = `${cx},${cy + h} ${cx + w},${cy} ${cx + w},${cy + t} ${cx},${cy + h + t}`
  return (
    <g key={k}>
      <polygon points={L} fill="url(#faceL)" stroke="rgba(52,245,164,.35)" strokeWidth="1" />
      <polygon points={R} fill="url(#faceR)" stroke="rgba(52,245,164,.35)" strokeWidth="1" />
      <polygon points={T} fill="url(#faceT)" stroke="rgba(52,245,164,.75)" strokeWidth="1.2" />
    </g>
  )
}

function Plinth() {
  return (
    <svg viewBox="0 0 420 230" className="absolute bottom-0 left-1/2 w-[112%] max-w-none -translate-x-1/2 overflow-visible">
      <defs>
        <linearGradient id="faceT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#14201c" /><stop offset="1" stopColor="#070b0a" /></linearGradient>
        <linearGradient id="faceL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b1411" /><stop offset="1" stopColor="#040706" /></linearGradient>
        <linearGradient id="faceR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#060b09" /><stop offset="1" stopColor="#020403" /></linearGradient>
        <radialGradient id="underglow"><stop offset="0" stopColor="#34f5a4" stopOpacity=".45" /><stop offset="1" stopColor="#34f5a4" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="210" cy="205" rx="200" ry="34" fill="url(#underglow)" style={{ animation: 'glow-pulse 4s ease-in-out infinite' }} />
      {slab(210, 140, 190, 66, 34, 'low')}
      {slab(210, 108, 128, 46, 22, 'up')}
      {/* glowing ring on the upper slab */}
      <polygon points="210,80 306,108 210,136 114,108" fill="none" stroke="#34f5a4" strokeOpacity=".5" strokeDasharray="3 5" />
    </svg>
  )
}

// ---- floating 3D cube -------------------------------------------------------
const FACES = ['translateZ(S)', 'rotateY(180deg) translateZ(S)', 'rotateY(90deg) translateZ(S)', 'rotateY(-90deg) translateZ(S)', 'rotateX(90deg) translateZ(S)', 'rotateX(-90deg) translateZ(S)']

function Cube({ size, color, style, dur = 7, delay = 0, depth = 10, sx = 0, sy = 0, sr = 0, pop = 0 }) {
  const half = size / 2
  return (
    <div className="absolute" style={{ width: size, height: size, perspective: 500, ...({ ...style, translate: `calc(var(--mx) * ${depth}px + var(--sp) * ${sx}px) calc(var(--my) * ${depth}px + var(--sp) * ${sy}px)`, rotate: `calc(var(--sp) * ${sr}deg)`, animation: `pop-in .9s cubic-bezier(.2,.9,.2,1) ${pop}s both` }) }}>
      <div style={{ width: size, height: size, animation: `float-y ${dur}s ease-in-out ${delay}s infinite` }}>
        <div className="relative h-full w-full" style={{ transformStyle: 'preserve-3d', animation: `spin-cube ${dur * 3}s linear ${delay}s infinite` }}>
          {FACES.map((f, i) => (
            <i key={i} className="absolute inset-0" style={{
              transform: f.replace('S', `${half}px`),
              border: `1px solid ${color}`, background: `linear-gradient(135deg, ${color}22, transparent 70%)`, boxShadow: `inset 0 0 12px ${color}33`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// flat glass square, tilted
function Tile({ size, color, rot, style, dur = 6, delay = 0, depth = 16, sx = 0, sy = 0, sr = 0, pop = 0 }) {
  return (
    <div className="absolute" style={{ ...({ ...style, translate: `calc(var(--mx) * ${depth}px + var(--sp) * ${sx}px) calc(var(--my) * ${depth}px + var(--sp) * ${sy}px)`, rotate: `calc(var(--sp) * ${sr}deg)`, animation: `pop-in .9s cubic-bezier(.2,.9,.2,1) ${pop}s both` }) }}>
      <div style={{ width: size, height: size, rotate: `${rot}deg`, border: `1px solid ${color}`, borderRadius: 4,
        background: `linear-gradient(135deg, ${color}26, transparent)`, backdropFilter: 'blur(2px)', animation: `float-y ${dur}s ease-in-out ${delay}s infinite` }} />
    </div>
  )
}

// ---- portrait: put a transparent PNG at public/me.png to replace the placeholder ----
function Portrait() {
  const [custom, setCustom] = useState(true)
  return (
    <div className="absolute bottom-[110px] lg:bottom-[175px] left-1/2 h-[440px] w-[330px] lg:h-[600px] lg:w-[440px] -translate-x-1/2"
      style={{ maskImage: 'linear-gradient(to bottom, #000 82%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, #000 82%, transparent 100%)' }}>
      {custom ? (
        <img src="/me.png" alt="Ahmad Mumtazul Kautsar" className="h-full w-full object-contain object-bottom" onError={() => setCustom(false)} />
      ) : (
        <svg viewBox="0 0 200 270" className="h-full w-full">
          <defs>
            <linearGradient id="jacket" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f6f54" /><stop offset="1" stopColor="#0d3a2c" /></linearGradient>
          </defs>
          <path d="M10 270c2-58 30-92 90-92s88 34 90 92z" fill="url(#jacket)" />
          <path d="M78 178l22 34 22-34" fill="#e8f1ee" opacity=".9" />
          <rect x="86" y="150" width="28" height="32" rx="10" fill="#d49a72" />
          <ellipse cx="55" cy="108" rx="8" ry="14" fill="#d49a72" /><ellipse cx="145" cy="108" rx="8" ry="14" fill="#d49a72" />
          <ellipse cx="100" cy="102" rx="46" ry="56" fill="#e0ac84" />
          <path d="M52 98c-6-44 22-64 50-63 30 1 52 22 46 63-6-20-16-30-48-30S58 78 52 98z" fill="#17120f" />
          <circle cx="84" cy="106" r="3.5" fill="#17120f" /><circle cx="116" cy="106" r="3.5" fill="#17120f" />
          <path d="M82 128q18 16 36 0" stroke="#8a4b33" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M76 94q8-5 16-1M108 93q8-4 16 1" stroke="#17120f" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      )}
    </div>
  )
}

export default function Stage() {
  const ref = useRef(null)
  useEffect(() => {
    // window-level, because text and card sit on top of the portrait and would swallow pointer events
    const move = (e) => {
      const r = ref.current.getBoundingClientRect()
      ref.current.style.setProperty('--mx', Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width - 0.5)).toFixed(3))
      ref.current.style.setProperty('--my', Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height - 0.5)).toFixed(3))
    }
    // scrolling disperses the boxes (0 at top -> 1 after ~70% of a viewport)
    const scroll = () => ref.current.style.setProperty('--sp', Math.min(1, window.scrollY / (window.innerHeight * 0.7)).toFixed(3))
    scroll()
    window.addEventListener('pointermove', move)
    window.addEventListener('scroll', scroll, { passive: true })
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('scroll', scroll) }
  }, [])

  return (
    <div ref={ref} style={{ '--mx': 0, '--my': 0, '--sp': 0 }}
      className="relative mx-auto h-[620px] w-full max-w-[420px] lg:h-[780px] lg:max-w-[600px] select-none [&_*]:transition-[translate] [&_*]:duration-300">
      <Plinth />
      <Portrait />
      <Cube size={46} color="#34f5a4" style={{ left: '2%', top: '18%' }} dur={7} depth={22} sx={-120} sy={-80} sr={120} pop={0.3} />
      <Cube size={30} color="#a855f7" style={{ right: '4%', top: '10%' }} dur={6} delay={-2} depth={30} sx={140} sy={-120} sr={-160} pop={0.45} />
      <Cube size={22} color="#fbbf24" style={{ right: '10%', top: '46%' }} dur={8} delay={-4} depth={14} sx={160} sy={90} sr={90} pop={0.6} />
      <Tile size={54} color="#3b82f6" rot={18} style={{ left: '8%', top: '52%' }} dur={7} delay={-1} depth={26} sx={-140} sy={120} sr={-80} pop={0.4} />
      <Tile size={34} color="#34f5a4" rot={-14} style={{ right: '22%', top: '2%' }} dur={5.5} delay={-3} depth={34} sx={90} sy={-150} sr={140} pop={0.55} />
      <Cube size={16} color="#3b82f6" style={{ left: '20%', top: '72%' }} dur={9} delay={-5} depth={12} sx={-110} sy={150} sr={200} pop={0.8} />
      <Tile size={26} color="#fbbf24" rot={24} style={{ right: '2%', top: '64%' }} dur={7.5} delay={-2} depth={20} sx={150} sy={140} sr={-110} pop={0.9} />
      <Tile size={20} color="#a855f7" rot={30} style={{ left: '30%', top: '4%' }} dur={6.5} delay={-2} depth={18} sx={-60} sy={-160} sr={-120} pop={0.7} />
    </div>
  )
}
