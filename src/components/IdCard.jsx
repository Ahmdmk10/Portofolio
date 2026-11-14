import { useMemo, useState } from 'react'
import qrcode from 'qrcode-generator'

// Two-sided ID card (front: notebook + polaroid photo, back: QR). Layout follows a spiral-notebook ID template,
// re-themed to the site: obsidian + emerald, blurred floating boxes instead of props.

const FACE = 'absolute inset-0 overflow-hidden rounded-2xl border border-emerald-400/30 shadow-[0_0_40px_-5px_rgba(52,211,153,0.35),inset_0_1px_0_rgba(255,255,255,0.06)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden]'
const FACE_BG = { background: 'linear-gradient(160deg,#0f2a21 0%,#07100d 55%,#020504 100%)' }

function Avatar() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <rect width="100" height="100" fill="#0b1f1a" />
      <circle cx="50" cy="42" r="19" fill="#e0ac84" />
      <path d="M30 40c0-16 12-24 22-23 12 1 19 10 18 23-4-8-9-12-20-12s-16 5-20 12z" fill="#1a1412" />
      <circle cx="43" cy="44" r="1.8" fill="#1a1412" /><circle cx="57" cy="44" r="1.8" fill="#1a1412" />
      <path d="M43 52q7 6 14 0" stroke="#7a3f2a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M14 100c2-20 16-30 36-30s34 10 36 30z" fill="#34d399" opacity=".85" />
    </svg>
  )
}

// Nametag photo is removed for now: always the placeholder avatar.
const Photo = () => <Avatar />

const Orbs = () => (
  <>
    <div className="absolute -right-7 top-16 size-24 rotate-12 rounded-xl border border-emerald-300/30 bg-gradient-to-br from-emerald-400/50 to-emerald-900/10 blur-[2px]" />
    <div className="absolute -left-9 bottom-8 size-28 -rotate-12 rounded-xl border border-purple-300/30 bg-gradient-to-br from-purple-400/40 to-emerald-900/10 blur-[3px]" />
    <div className="absolute right-6 bottom-20 size-8 rotate-45 rounded-md border border-amber-300/40 bg-gradient-to-br from-amber-300/40 to-transparent blur-[1px]" />
  </>
)

const Header = () => (
  <div className="absolute left-4 top-4 flex items-center gap-2">
    <span className="grid size-9 place-items-center rounded-full border border-emerald-400/50 bg-emerald-400/10">
      <svg viewBox="0 0 24 24" className="size-5 text-emerald-300" fill="currentColor"><path d="M12 2l5 10-5 10-5-10z" opacity=".9" /><path d="M2 12l10-3 10 3-10 3z" opacity=".5" /></svg>
    </span>
    <span className="leading-tight">
      <span className="block text-[13px] font-bold tracking-wide text-white">USU</span>
      <span className="block font-mono text-[9px] text-emerald-300/80">Class of '26</span>
    </span>
  </div>
)

const Slot = () => <div className="absolute left-1/2 top-2.5 h-2.5 w-10 -translate-x-1/2 rounded-full border border-white/10 bg-black" />

const Spiral = ({ side = 'left', n = 11 }) => (
  <div className={`absolute top-3 bottom-3 flex w-5 flex-col justify-between ${side === 'left' ? '-left-2.5' : '-right-2.5'}`}>
    {Array.from({ length: n }, (_, i) => (
      <i key={i} className="block h-[7px] w-5 rounded-full bg-gradient-to-b from-zinc-600 to-zinc-950 shadow-[0_1px_1px_rgba(255,255,255,.35)]" />
    ))}
  </div>
)

function Qr({ text }) {
  const { n, d } = useMemo(() => {
    const q = qrcode(0, 'M'); q.addData(text); q.make()
    const n = q.getModuleCount(); let d = ''
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`
    return { n, d }
  }, [text])
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} shapeRendering="crispEdges" className="h-full w-full rounded-md bg-white">
      <path d={d} fill="#05080a" />
    </svg>
  )
}

export default function IdCard() {
  const url = typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://example.com'
  return (
    <>
      {/* FRONT */}
      <div className={FACE} style={FACE_BG}>
        <Orbs /><Slot /><Header />
        <div className="absolute left-4 right-4 top-[56px] leading-none">
          <p className="font-serif text-[26px] text-white">Computer Science</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">&amp; Cybersecurity</p>
        </div>

        <div className="absolute left-3 right-3 top-[112px] h-[248px] -rotate-2 rounded-xl bg-gradient-to-br from-[#f4f3ef] to-[#d6d4cb] shadow-[0_8px_20px_rgba(0,0,0,.5)]">
          <Spiral />
          <div className="absolute left-7 right-3 top-3 h-[150px] rounded-md bg-[#0b2a20] p-1.5 shadow-inner">
            <div className="h-full w-full overflow-hidden rounded-[4px] bg-gradient-to-b from-emerald-900/60 to-[#04100c]"><Photo /></div>
          </div>
          <div className="absolute left-5 right-2 top-[138px] flex h-8 items-center justify-center rounded-md bg-emerald-700 shadow-md">
            <span className="font-name text-[15px] text-white">Ahmad Mumtazul Kautsar</span>
          </div>
          <div className="absolute left-9 right-5 top-[176px] flex h-6 items-center justify-center rounded bg-[#0b1f19]">
            <span className="font-mono text-[10px] text-emerald-300">Cybersecurity Enthusiast</span>
          </div>
          <p className="absolute left-7 right-3 top-[210px] text-center font-mono text-[10px] tracking-widest text-zinc-600">2026 · USU CS</p>
        </div>

        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between font-mono text-[9px]">
          <span className="flex items-center gap-1.5 text-emerald-400"><i className="size-1.5 rounded-full bg-emerald-400 animate-ping" />ONLINE</span>
          <span className="text-zinc-500">ID: 2026.USU.CS</span>
        </div>
      </div>

      {/* BACK */}
      <div className={FACE} style={{ ...FACE_BG, transform: 'rotateY(180deg)' }}>
        <Orbs /><Slot /><Header />
        <div className="absolute left-3 right-3 top-[70px] h-[300px] rotate-1 rounded-xl bg-gradient-to-br from-[#f4f3ef] to-[#d6d4cb] shadow-[0_8px_20px_rgba(0,0,0,.5)]">
          <Spiral />
          <div className="absolute left-8 right-4 top-5 aspect-square"><Qr text={url} /></div>
          <p className="absolute left-8 right-4 top-[200px] text-center font-serif text-[26px] leading-none text-emerald-900">Scan me</p>
          <div className="absolute left-8 right-4 top-[240px] flex h-8 items-center justify-center rounded-md bg-emerald-700">
            <span className="font-mono text-[10px] text-white">Visit my portfolio</span>
          </div>
        </div>
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between font-mono text-[9px] text-zinc-500">
          <span>ID: 2026.USU.CS</span><span>click to flip ↻</span>
        </div>
      </div>
    </>
  )
}
