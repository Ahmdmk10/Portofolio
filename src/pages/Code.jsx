import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useContent, safeUrl } from '../content.js'
import { Pill, PageHead, Cover } from '../components/Ui.jsx'
import Window from '../components/Window.jsx'

export default function Code() {
  const { items: CODING, loading } = useContent('coding')
  const ALL = useMemo(() => ['All', ...new Set(CODING.flatMap((p) => p.tags || []))], [CODING])
  const [f, setF] = useState('All')
  const [open, setOpen] = useState(null)
  const list = CODING.filter((p) => f === 'All' || (p.tags || []).includes(f))
  return (
    <main className="relative z-10 mx-auto max-w-[1600px] px-2.5">
      <PageHead index="01" title="Coding" count={loading ? 'loading…' : `${CODING.length} projects`}>
        {ALL.map((t) => <Pill key={t} active={f === t} onClick={() => setF(t)}>{t}</Pill>)}
      </PageHead>

      <motion.div layout className="grid gap-[10px] sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => (
            <motion.button layout key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(p)} className="group text-left">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[5px] border border-white/10">
                <div className="h-full w-full transition-transform duration-700 group-hover:scale-105"><Cover item={p} hue={150 + i * 40} seed={i * 2} /></div>
                <span className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/50 backdrop-blur opacity-0 group-hover:opacity-100 transition"><ArrowUpRight size={14} /></span>
              </div>
              <div className="flex items-baseline justify-between pt-2 px-0.5">
                <span className="text-sm font-medium">{p.title}</span>
                <span className="font-mono text-[11px] text-white/40">{p.year}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">{(p.tags || []).map((t) => <Pill key={t}>{t}</Pill>)}</div>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {open && (
          <Window title={`~/coding/${open.id}`} onClose={() => setOpen(null)}>
            <div className="aspect-[16/9]"><Cover item={open} hue={150} seed={3} /></div>
            <div className="p-5">
              <p className="font-mono text-[11px] text-emerald-400">{open.kind}</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight">{open.title}</h2>
              <p className="mt-3 text-sm text-white/65 leading-relaxed">{open.desc}</p>
              <div className="mt-4 flex flex-wrap gap-1">{(open.tags || []).map((t) => <Pill key={t}>{t}</Pill>)}</div>
              {safeUrl(open.link) && <a href={safeUrl(open.link)} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1 text-sm text-emerald-400 hover:underline">Open <ArrowUpRight size={14} /></a>}
            </div>
          </Window>
        )}
      </AnimatePresence>
    </main>
  )
}
