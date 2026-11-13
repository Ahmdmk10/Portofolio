import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useContent } from '../content.js'
import { Pill, PageHead, Cover } from '../components/Ui.jsx'
import Window from '../components/Window.jsx'

export default function Design() {
  const { items: DESIGN, loading } = useContent('design')
  const [open, setOpen] = useState(null)
  return (
    <main className="relative z-10 mx-auto max-w-[1600px] px-2.5">
      <PageHead index="02" title="Design" count={loading ? 'loading…' : `${DESIGN.length} works`} />
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-[10px]">
        {DESIGN.map((d, i) => (
          <motion.button key={d.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: (i % 3) * 0.06 }} onClick={() => setOpen(d)}
            className="group mb-[10px] block w-full break-inside-avoid text-left">
            <div className="overflow-hidden rounded-[5px] border border-white/10" style={{ aspectRatio: d.ratio || '1/1' }}>
              <div className="h-full w-full transition-transform duration-700 group-hover:scale-105"><Cover item={d} hue={d.hue ?? 150} seed={i * 3 + 1} /></div>
            </div>
            <div className="flex items-baseline justify-between pt-1.5 px-0.5">
              <span className="text-xs">{d.title}</span>
              <span className="font-mono text-[11px] text-white/40">{d.kind}</span>
            </div>
          </motion.button>
        ))}
      </div>
      <AnimatePresence>
        {open && (
          <Window title={`~/design/${open.id}`} onClose={() => setOpen(null)}>
            <div style={{ aspectRatio: open.ratio || '1/1' }} className="max-h-[60vh] w-full"><Cover item={open} hue={open.hue ?? 150} seed={5} /></div>
            <div className="p-5">
              <h2 className="text-2xl font-bold tracking-tight">{open.title}</h2>
              <p className="mt-1 font-mono text-[11px] text-white/45">{open.kind} · {open.year}</p>
              <div className="mt-3 flex flex-wrap gap-1">{(open.tags || []).map((t) => <Pill key={t}>{t}</Pill>)}</div>
            </div>
          </Window>
        )}
      </AnimatePresence>
    </main>
  )
}
