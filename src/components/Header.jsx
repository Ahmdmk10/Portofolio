import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Menu, X } from 'lucide-react'

const LINKS = [['Home', 'home', '#/'], ['Coding', 'code', '#/code'], ['Design', 'design', '#/design'], ['Learning', 'learning', '#/learning']]
const toContact = (e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }

function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '').toLowerCase()
  const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  return (
    <div className="hidden xl:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/70">
      <span className="size-1.5 rounded-full bg-cyber animate-pulse" />
      {time} · {date}
    </div>
  )
}

export default function Header({ route }) {
  const [open, setOpen] = useState(false)
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-slate-950/40 backdrop-blur-md border-b border-white/5">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-5 sm:px-8 py-3">
        <a href="#/" className="group flex items-center gap-2 font-bold tracking-tight">
          <motion.span whileHover={{ rotate: 180, scale: 1.2 }} transition={{ type: 'spring', stiffness: 200 }} className="text-cyber">
            <Sparkles size={18} />
          </motion.span>
          <span className="font-name text-sm md:text-base">Ahmad Mumtazul Kautsar</span>
        </a>

        <nav className="hidden lg:flex items-center gap-1">
          {LINKS.map(([label, key, href]) => (
            <motion.a key={key} href={href} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className={`relative rounded-full px-4 py-1.5 text-sm ${route === key ? 'text-black' : 'text-white/70 hover:text-emerald-300'}`}>
              {route === key && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-white" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
              <span className="relative">{label}</span>
            </motion.a>
          ))}
          <motion.a href="#contact" onClick={toContact} whileHover={{ y: -2 }} className="rounded-full px-4 py-1.5 text-sm text-white/70 hover:text-emerald-300">Contact</motion.a>
        </nav>

        <div className="flex items-center gap-2">
          <LiveClock />
          <motion.a href="#contact" onClick={toContact} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="hidden sm:block rounded-full bg-cyber px-4 py-1.5 text-sm font-bold text-ink">
            Let's Talk
          </motion.a>
          <button className="lg:hidden p-2 text-white" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="lg:hidden mx-auto max-w-7xl px-5 pb-3 flex flex-col">
            {[...LINKS, ['Contact', 'contact', '#contact']].map(([label, key, href]) => (
              <a key={key} href={href} onClick={(e) => { setOpen(false); if (key === 'contact') toContact(e) }}
                className={`rounded-lg px-3 py-2.5 hover:bg-white/5 ${route === key ? 'text-emerald-300' : 'text-white/80'}`}>{label}</a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
