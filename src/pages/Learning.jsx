import { motion } from 'framer-motion'
import { useContent } from '../content.js'
import { Pill, PageHead } from '../components/Ui.jsx'

const GROUPS = [
  ['now', 'Learning now'],
  ['done', 'Learned'],
  ['next', 'Up next'],
]

export default function Learning() {
  const { items: LEARNING, loading } = useContent('learning')
  return (
    <main className="relative z-10 mx-auto max-w-[1600px] px-2.5 pb-10">
      <PageHead index="03" title="Learning" count={loading ? 'loading…' : `${LEARNING.length} topics`} />
      {GROUPS.map(([key, label]) => (
        <section key={key} className="grid lg:grid-cols-3 gap-[10px] border-b border-white/10 py-6">
          <h2 className="font-mono text-[11px] text-white/45 flex items-center gap-2">
            {key === 'now' && <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />}{label}
          </h2>
          <div className="lg:col-span-2">
            {LEARNING.filter((l) => l.stage === key).map((l) => (
              <motion.div key={l.topic} whileHover={{ x: 8 }} className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-t border-white/10 first:border-t-0 py-3">
                <div>
                  <p className="text-xl sm:text-2xl font-semibold tracking-tight group-hover:text-emerald-300 transition-colors">{l.topic}</p>
                  <p className="text-xs text-white/50 mt-0.5">{l.note}</p>
                </div>
                <Pill>{l.level}%</Pill>
                <div className="col-span-2 h-px bg-white/10 relative">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${l.level}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: 'easeOut' }}
                    className="absolute inset-y-0 left-0 h-px bg-emerald-400" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
