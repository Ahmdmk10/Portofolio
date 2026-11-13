import { useEffect, useState } from 'react'
import { Terminal as TermIcon } from 'lucide-react'

const LINES = [
  ['$ whoami', 'ahmad_mumtazul_kautsar'],
  ['$ cat bio.txt', "CS freshman @ USU '26 · C++ / Pascal / React"],
  ['$ ls ~/hobbies', 'ctf/  linux-rice/  mech-keyboards/  coffee/'],
]
const FULL = LINES.flat().join('\n')

export default function Terminal() {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (n >= FULL.length) return
    const id = setTimeout(() => setN((v) => v + 1), 28)
    return () => clearTimeout(id)
  }, [n])

  const shown = FULL.slice(0, n).split('\n')
  return (
    <div className="mt-10 max-w-xl rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-4 font-mono text-xs shadow-2xl min-h-[150px]">
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/10 text-slate-500">
        <TermIcon className="w-4 h-4 text-emerald-400" /> terminal@mumtaz:~
      </div>
      {shown.map((l, i) => (
        <p key={i} className={l.startsWith('$') ? 'text-emerald-400 mt-2 first:mt-0' : 'text-slate-300'}>
          {l.startsWith('$') ? l : `> ${l}`}
          {i === shown.length - 1 && <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-0.5 align-middle animate-pulse" />}
        </p>
      ))}
    </div>
  )
}
