import { useMemo, useState } from 'react'
import { mediaUrl } from '../content.js'

// vshslv-style building blocks: tiny type, translucent pills, hairlines, 3-column rhythm.
export const Pill = ({ children, active, onClick, className = '' }) => {
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag onClick={onClick}
      className={`inline-block rounded-[5px] px-2 py-1 text-[11px] leading-[1.2] transition-colors ${
        active ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'} ${className}`}>
      {children}
    </Tag>
  )
}

export const PageHead = ({ index, title, count, children }) => (
  <div className="pt-32 pb-8 border-b border-white/10 mb-3">
    <p className="text-[11px] text-white/40 font-mono mb-3">{index} — {count}</p>
    <h1 className="text-7xl sm:text-9xl lg:text-[11rem] leading-[0.85]">{title}</h1>
    {children && <div className="mt-6 flex flex-wrap gap-1.5">{children}</div>}
  </div>
)

// Generative thumbnail: ketupat grid + sine ribbon, tinted per item.
export function Thumb({ hue, seed = 1, className = '' }) {
  const dots = useMemo(() => {
    const out = []
    for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) {
      const wave = 7 + Math.sin(x * 0.55 + seed) * 3.2
      const d = Math.abs(y - wave)
      out.push({ x: x * 24 + 12, y: y * 24 + 12, k: Math.max(0, 1 - d / 3) })
    }
    return out
  }, [seed])
  return (
    <svg viewBox="0 0 336 336" preserveAspectRatio="xMidYMid slice" className={`w-full h-full ${className}`}>
      <rect width="336" height="336" fill={`hsl(${hue} 40% 7%)`} />
      {dots.map((d, i) => {
        const r = 1.6 + d.k * 5
        return <path key={i} d={`M${d.x} ${d.y - r}L${d.x + r} ${d.y}L${d.x} ${d.y + r}L${d.x - r} ${d.y}Z`}
          fill={d.k > 0 ? `hsl(${hue + d.k * 60} 90% 62%)` : 'rgba(255,255,255,.12)'} opacity={d.k > 0 ? 0.35 + d.k * 0.65 : 1} />
      })}
    </svg>
  )
}

// Uploaded image or external image link when the item has a cover; generative thumbnail otherwise.
export function Cover({ item, hue, seed }) {
  const [broken, setBroken] = useState(false)
  const src = mediaUrl(item.cover)
  if (!src || broken) return <Thumb hue={hue} seed={seed} />
  return <img src={src} alt={item.title} loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="w-full h-full object-cover" />
}
