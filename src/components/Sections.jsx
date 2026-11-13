import { useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Pill } from './Ui.jsx'

const EASE = [0.2, 0.9, 0.2, 1]
const itemV = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } }
const Stagger = ({ children, className }) => (
  <motion.div className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>{children}</motion.div>
)
const fade = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.6 } }
const toContact = (e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }

// Numbered editorial section: "01 / Label" on the left, short declarative headline + content on the right.
const Row = ({ id, n, label, title, children }) => (
  <section id={id} className="relative z-10 mx-auto max-w-[1600px] px-2.5 grid lg:grid-cols-3 gap-[10px] border-t border-white/10 py-12">
    <h2 className="font-mono text-[11px] text-white/45"><span className="text-emerald-400">{n} /</span> {label}</h2>
    <div className="lg:col-span-2">
      {title && <h3 className="mb-8 overflow-hidden pb-1 text-5xl sm:text-7xl leading-[0.92]"><motion.span className="block" initial={{ y: '105%' }} whileInView={{ y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.8, ease: EASE }}>{title}</motion.span></h3>}
      {children}
    </div>
  </section>
)

// ---- ticker -----------------------------------------------------------------
const TICKER = ['C++', 'Pascal', 'Cybersecurity', 'CTF', 'Web Security', 'Cryptography', 'React', 'Linux CLI', 'Open to build']

function Band({ dir, rotate, z, outline }) {
  const items = [...TICKER, ...TICKER]
  return (
    <div className="absolute inset-x-[-10%] top-1/2 -translate-y-1/2 border-y border-white/15 bg-[#07100e]/90 py-3 shadow-[0_0_40px_rgba(0,0,0,.6)]"
      style={{ transform: `translateY(-50%) rotate(${rotate}deg)`, zIndex: z }}>
      <div className={`marquee-track ${dir === 'ltr' ? 'marquee-rev' : ''}`}>
        {items.concat(items).map((t, i) => (
          <span key={i} className="flex items-center gap-8 pr-8 text-5xl sm:text-6xl whitespace-nowrap"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800, textTransform: 'uppercase',
              ...(outline && i % 2 ? { color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,.55)' } : { color: outline ? '#e8f1ee' : '#34f5a4' }) }}>
            {t}<span className={`${outline ? 'text-emerald-400' : 'text-white/80'} text-3xl`}>✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// Two bands crossing in an X: one enters from the left, one from the right (the right one sits on top).
export function Marquee() {
  return (
    <div className="marquee relative z-10 h-[260px] sm:h-[320px] overflow-hidden">
      <Band dir="ltr" rotate={5} z={1} />
      <Band dir="rtl" rotate={-5} z={2} outline />
    </div>
  )
}

// ---- 01 crafts (shortcuts to the tabs) --------------------------------------
export function Teasers() {
  const items = [['#/code', '01', 'Coding', 'DoMas, M.E.A.C., CTF writeups'], ['#/design', '02', 'Design', 'Generative art, UI, posters'], ['#/learning', '03', 'Learning', 'What I studied and what is next']]
  return (
    <Row id="crafts" n="01" label="Crafts" title="Three crafts. One mind.">
      <Stagger className="grid md:grid-cols-3 gap-[10px]">
        {items.map(([href, n, t, d]) => (
          <motion.a key={t} href={href} variants={itemV} whileHover={{ y: -6 }} className="group relative overflow-hidden rounded-[5px] border border-white/10 bg-white/[0.05] p-5 min-h-[220px] flex flex-col hover:border-emerald-400/50 transition-colors">
            <span className="font-mono text-[11px] text-white/40">{n}</span>
            <span className="absolute top-4 right-4 grid size-8 place-items-center rounded-full border border-white/15 group-hover:bg-emerald-400 group-hover:text-black group-hover:rotate-45 transition-all"><ArrowUpRight size={14} /></span>
            <h3 className="mt-auto text-6xl">{t}</h3>
            <p className="mt-1 text-xs text-white/50">{d}</p>
          </motion.a>
        ))}
      </Stagger>
    </Row>
  )
}

// ---- 02 about ---------------------------------------------------------------
export function About() {
  return (
    <Row id="about" n="02" label="About" title="Security-minded. Code-first.">
      <p className="font-serif text-2xl sm:text-4xl leading-snug text-white/90 max-w-3xl">
        Mahasiswa baru Computer Science (USU '26) dengan ketertarikan besar pada keamanan siber, dari low-level programming
        dengan C++ dan Pascal, web development, hingga CTF.
      </p>
      <div className="mt-6 grid sm:grid-cols-2 gap-6 text-sm">
        <div><p className="font-mono text-[11px] text-white/40 mb-2">Code</p><div className="flex flex-wrap gap-1">{['C++', 'Pascal', 'React', 'Linux CLI'].map((t) => <Pill key={t}>{t}</Pill>)}</div></div>
        <div><p className="font-mono text-[11px] text-white/40 mb-2">Security</p><div className="flex flex-wrap gap-1">{['CTF', 'Web Security', 'Crypto', 'Pentest basics'].map((t) => <Pill key={t}>{t}</Pill>)}</div></div>
      </div>
    </Row>
  )
}

// ---- 03 numbered skill cards (last card is a CTA, like the reference) ---------
const FEATURES = [
  ['C++ & OOP', 'Class, inheritance, file I/O. Dipakai di DoMas.'],
  ['Pascal', 'Struktur data dasar dan simulator matriks M.E.A.C.'],
  ['Web Security', 'OWASP Top 10, XSS, SQLi, dan autentikasi.'],
  ['Cryptography', 'Classical ciphers, RSA, dan hashing.'],
  ['CTF', 'COMPFEST writeups: crypto dan web exploitation.'],
  ['Linux CLI', 'Shell, permission, dan networking tools.'],
  ['React & Canvas', 'Animasi 60 FPS, fisika, dan UI interaktif.'],
]

export function Features() {
  return (
    <Row id="skills" n="03" label="Skills" title="Skills with receipts.">
      <Stagger className="grid sm:grid-cols-2 xl:grid-cols-4 gap-[10px]">
        {FEATURES.map(([t, d], i) => (
          <motion.div key={t} variants={itemV} whileHover={{ y: -6 }} className="group rounded-[5px] border border-white/10 bg-white/[0.05] p-4 min-h-[170px] flex flex-col hover:border-emerald-400/50 transition-colors">
            <span className="font-mono text-[11px] text-emerald-400">{String(i + 1).padStart(2, '0')}</span>
            <h4 className="mt-auto text-3xl group-hover:text-emerald-300 transition-colors">{t}</h4>
            <p className="mt-1 text-xs text-white/50 leading-relaxed">{d}</p>
          </motion.div>
        ))}
        <motion.a href="#contact" onClick={toContact} variants={itemV} whileHover={{ y: -6 }} className="rounded-[5px] bg-emerald-400 text-black p-4 min-h-[170px] flex flex-col">
          <span className="font-mono text-[11px]">08</span>
          <h4 className="mt-auto text-3xl flex items-center gap-2">Let's talk <ArrowUpRight size={22} /></h4>
          <p className="mt-1 text-xs">Punya proyek atau ide? Hubungi saya.</p>
        </motion.a>
      </Stagger>
    </Row>
  )
}

// ---- 04 services (original rows kept) ----------------------------------------
const SERVICES = [
  ['01', 'Software Development', 'Scalable web & mobile products built to last.'],
  ['02', 'Product Design', 'Interfaces that feel effortless and look sharp.'],
  ['03', 'Quality Assurance', 'Rigorous testing for flawless, confident releases.'],
  ['04', 'Consulting', 'Strategy and direction for ambitious teams.'],
]

const SPRING = { stiffness: 170, damping: 24, mass: 0.7 } // critically damped-ish: no wobble, no lag

// One card: outer layer handles carousel position, inner layer tilts toward the cursor with a moving glare.
function SelectCard({ num, title, off, active, onSelect, px, py }) {
  const tx = useMotionValue(0), ty = useMotionValue(0)
  const rx = useSpring(useTransform(ty, [-0.5, 0.5], [16, -16]), SPRING)
  const ry = useSpring(useTransform(tx, [-0.5, 0.5], [-18, 18]), SPRING)
  const gx = useTransform(tx, [-0.5, 0.5], [0, 100]), gy = useTransform(ty, [-0.5, 0.5], [0, 100])
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,.28), transparent 55%)`
  // letter drifts opposite to the cursor, further than the card: a cheap depth illusion
  const lx = useSpring(useTransform(tx, [-0.5, 0.5], [18, -18]), SPRING), ly = useSpring(useTransform(ty, [-0.5, 0.5], [18, -18]), SPRING)
  const move = (e) => { if (!active) return; const r = e.currentTarget.getBoundingClientRect(); tx.set((e.clientX - r.left) / r.width - 0.5); ty.set((e.clientY - r.top) / r.height - 0.5) }
  const leave = () => { tx.set(0); ty.set(0) }
  // the whole row leans toward the pointer; side cards also slide slightly toward it
  const shift = useTransform(px, [-0.5, 0.5], [-14 * (1 + Math.abs(off)), 14 * (1 + Math.abs(off))])
  return (
    <motion.div className="absolute left-1/2 top-0 w-[200px] sm:w-[250px] h-[340px] sm:h-[400px]" style={{ marginLeft: -125, transformStyle: 'preserve-3d', zIndex: 10 - Math.abs(off), willChange: 'transform' }}
      animate={{ x: off * 150, z: active ? 120 : -Math.abs(off) * 90, rotateY: off * -38, scale: active ? 1 : 0.88, opacity: Math.abs(off) > 1.5 ? 0.35 : 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 22, mass: 0.9 }}>
      <motion.button type="button" onClick={onSelect} aria-pressed={active} onPointerMove={move} onPointerLeave={leave}
        whileHover={{ scale: active ? 1.03 : 1.06 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className={`relative size-full rounded-[8px] border p-4 flex flex-col text-left cursor-pointer overflow-hidden ${active ? 'border-emerald-400 bg-[#0c1a16] shadow-[0_0_50px_rgba(52,245,164,.25)]' : 'border-white/15 bg-[#0a0d0e] hover:border-emerald-400/60'}`}
        style={{ rotateX: rx, rotateY: ry, x: shift, transformStyle: 'preserve-3d' }}>
        <span className="font-mono text-[11px] text-emerald-400">{num}</span>
        <motion.div style={{ x: lx, y: ly, translateZ: 40 }} className={`my-auto grid place-items-center text-[120px] sm:text-[160px] leading-none font-extrabold select-none ${active ? 'text-emerald-400' : 'text-white/15'}`}>
          <span style={{ fontFamily: 'var(--font-display)' }}>{title[0]}</span>
        </motion.div>
        <h3 className="text-2xl sm:text-3xl leading-none" style={{ transform: 'translateZ(25px)' }}>{title}</h3>
        <motion.span className="pointer-events-none absolute inset-0" style={{ background: glare }} />
      </motion.button>
    </motion.div>
  )
}

export function Capabilities() {
  const [sel, setSel] = useState(0)
  const n = SERVICES.length
  const go = (d) => setSel((v) => (v + d + n) % n)
  const onKey = (e) => { if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1) }
  // pointer position over the stage, -0.5..0.5; the whole stage rotates toward it
  const mx = useMotionValue(0), my = useMotionValue(0)
  const px = useSpring(mx, SPRING), py = useSpring(my, SPRING)
  const stageRY = useTransform(px, [-0.5, 0.5], [-14, 14]), stageRX = useTransform(py, [-0.5, 0.5], [8, -8])
  const sx = useTransform(px, [-0.5, 0.5], ['20%', '80%']), sy = useTransform(py, [-0.5, 0.5], ['20%', '80%'])
  const spot = useMotionTemplate`radial-gradient(420px circle at ${sx} ${sy}, rgba(52,245,164,.16), transparent 65%)`
  const track = (e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5) }
  const reset = () => { mx.set(0); my.set(0) }
  return (
    <Row id="capabilities" n="04" label="What we do best" title="Built to last.">
      <div tabIndex={0} onKeyDown={onKey} aria-label="Pilih layanan" className="outline-none">
        <motion.div className="relative h-[380px] sm:h-[440px] touch-pan-y cursor-grab active:cursor-grabbing" style={{ perspective: 1100 }}
          onPointerMove={track} onPointerLeave={reset}
          onWheel={(e) => { if (Math.abs(e.deltaX) > 30) go(e.deltaX > 0 ? 1 : -1) }}
          drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15}
          onDragEnd={(_, i) => { if (i.offset.x < -60) go(1); else if (i.offset.x > 60) go(-1) }}>
          <motion.div className="pointer-events-none absolute inset-0 rounded-[8px]" style={{ background: spot }} />
          <motion.div className="absolute inset-0" style={{ transformStyle: 'preserve-3d', rotateY: stageRY, rotateX: stageRX }}>
            {SERVICES.map(([num, t], i) => {
              let off = i - sel
              if (off > n / 2) off -= n
              if (off < -n / 2) off += n
              return <SelectCard key={num} num={num} title={t} off={off} active={off === 0} onSelect={() => setSel(i)} px={px} py={py} />
            })}
          </motion.div>
        </motion.div>
        <div className="mt-2 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
          <button type="button" onClick={() => go(-1)} aria-label="Sebelumnya" className="grid size-10 place-items-center rounded-full border border-white/15 hover:bg-emerald-400 hover:text-black"><ChevronLeft size={18} /></button>
          <div className="text-center">
            <p className="font-mono text-[11px] text-emerald-400">{SERVICES[sel][0]} / {String(n).padStart(2, '0')}</p>
            <p className="mt-1 text-sm text-white/70">{SERVICES[sel][2]}</p>
          </div>
          <button type="button" onClick={() => go(1)} aria-label="Berikutnya" className="grid size-10 place-items-center rounded-full border border-white/15 hover:bg-emerald-400 hover:text-black"><ChevronRight size={18} /></button>
        </div>
      </div>
    </Row>
  )
}

// ---- 05 principles A / B / C --------------------------------------------------
const PILLARS = [
  ['A', 'Low-level first', 'Memahami mesin sebelum framework: C++ dan Pascal jadi fondasi.'],
  ['B', 'Security by default', 'Setiap fitur dipikir dari sisi penyerang lebih dulu.'],
  ['C', 'Learn in public', 'Catatan, writeup, dan progres belajar terbuka di tab Learning.'],
]

export function Pillars() {
  return (
    <Row id="principles" n="05" label="Principles" title="Built to be understood.">
      <Stagger className="grid md:grid-cols-3 gap-[10px]">
        {PILLARS.map(([k, t, d]) => (
          <motion.div key={k} variants={itemV} className="border-t border-white/20 pt-4">
            <span className="font-mono text-[11px] text-emerald-400">{k}</span>
            <h4 className="mt-2 text-3xl">{t}</h4>
            <p className="mt-2 text-sm text-white/55 leading-relaxed">{d}</p>
          </motion.div>
        ))}
      </Stagger>
    </Row>
  )
}

// ---- 06 closing CTA: two side-by-side cards -----------------------------------
export function Cta() {
  return (
    <Row id="start" n="06" label="Next" title="Start crafting.">
      <Stagger className="grid md:grid-cols-2 gap-[10px]">
        <motion.a href="#/code" variants={itemV} whileHover={{ y: -6 }} className="group rounded-[5px] bg-[#f2f1ee] text-[#0b0b0c] p-6 min-h-[240px] flex flex-col">
          <span className="font-mono text-[11px] opacity-60">Work</span>
          <h4 className="mt-auto text-6xl flex items-center gap-3">Browse the work <ArrowUpRight className="transition-transform group-hover:rotate-45" size={36} /></h4>
          <p className="mt-2 text-sm opacity-70">Proyek coding, karya design, dan catatan belajar.</p>
        </motion.a>
        <motion.a href="#contact" onClick={toContact} variants={itemV} whileHover={{ y: -6 }} className="group rounded-[5px] border border-white/15 bg-white/[0.05] p-6 min-h-[240px] flex flex-col hover:border-emerald-400/60 transition-colors">
          <span className="font-mono text-[11px] text-white/50">Contact</span>
          <h4 className="mt-auto text-6xl flex items-center gap-3 text-emerald-300">Say hello <ArrowUpRight className="transition-transform group-hover:rotate-45" size={36} /></h4>
          <p className="mt-2 text-sm text-white/55">Terbuka untuk kolaborasi, magang, dan CTF bareng.</p>
        </motion.a>
      </Stagger>
    </Row>
  )
}

// ---- footer: email + link columns ---------------------------------------------
export function Footer() {
  const col = (title, links) => (
    <div>
      <p className="font-mono text-[11px] text-white/40 mb-3">{title}</p>
      <ul className="space-y-1.5 text-sm">{links.map(([l, h]) => <li key={l}><a href={h} className="text-white/70 hover:text-emerald-300">{l}</a></li>)}</ul>
    </div>
  )
  return (
    <footer id="contact" className="relative z-10 mx-auto max-w-[1600px] px-2.5 border-t border-white/10 pt-10 pb-8">
      <p className="font-mono text-[11px] text-white/45 mb-3">Contact</p>
      <a href="mailto:mumchakys@gmail.com" className="block font-name text-4xl sm:text-7xl text-emerald-400 hover:underline break-all">mumchakys@gmail.com</a>
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {col('Work', [['Coding', '#/code'], ['Design', '#/design'], ['Learning', '#/learning']])}
        {col('Explore', [['About', '#/'], ['Skills', '#/'], ['Home', '#/']])}
        {col('Reach me', [['Email', 'mailto:mumchakys@gmail.com']])}
        <div><p className="font-mono text-[11px] text-white/40 mb-3">Status</p><p className="text-sm text-white/70"><span className="inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse mr-2" />Online · CS @ USU '26</p></div>
      </div>
      <div className="mt-10 flex flex-wrap justify-between gap-2 font-mono text-[11px] text-white/30">
        <span>© 2026 Ahmad Mumtazul Kautsar</span><span>Made by hand. Built to learn.</span>
      </div>
    </footer>
  )
}
