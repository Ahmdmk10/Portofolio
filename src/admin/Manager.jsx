import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteImage, readCollection, updateCollection } from './github.js'
import { COLLECTIONS } from './config.js'
import { Field } from './Fields.jsx'
import { safeUrl } from '../content.js'

const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 40) || 'item'
const uploadPath = (c) => (c?.type === 'upload' && /^uploads\/[\w.\-]+$/.test(c.src || '') ? c.src : null)
const removeFile = (c) => { const p = uploadPath(c); return p ? deleteImage(p) : null }

function Editor({ cfg, name, row, onClose, onSaved }) {
  const isNew = !row.id
  const [v, setV] = useState(row)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (val) => setV((p) => ({ ...p, [k]: val }))
  const key = v[cfg.titleKey] || ''

  const save = async (e) => {
    e.preventDefault()
    setErr('')
    for (const f of cfg.fields) if (f.required && !String(v[f.name] || '').trim()) return setErr(`${f.label} wajib diisi`)
    if (v.link && !safeUrl(v.link)) return setErr('Link proyek harus http(s)://')
    if (v.cover?.type === 'url' && !safeUrl(v.cover.src)) return setErr('Link gambar harus http(s)://')
    if (v.cover && !v.cover.src) return setErr('Cover dipilih tapi belum diisi')
    setSaving(true)
    const payload = { ...v, id: v.id || `${slugify(key)}-${Date.now().toString(36).slice(-4)}` }
    delete payload.sort_order; delete payload.updated_at
    if (payload.cover === undefined) payload.cover = null
    try {
      await updateCollection(name, (items) => (items.some((i) => i.id === payload.id) ? items.map((i) => (i.id === payload.id ? payload : i)) : [...items, payload]), `admin: ${isNew ? 'add' : 'edit'} ${name}/${payload.id}`)
    } catch (e) { setSaving(false); return setErr(e.message) }
    setSaving(false)
    if (!isNew && uploadPath(row.cover) && uploadPath(row.cover) !== uploadPath(v.cover)) removeFile(row.cover) // old image replaced
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-lg overflow-auto border-l border-white/10 bg-[#0b0d0c] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{isNew ? 'Item baru' : 'Edit item'}</h2>
          <button type="button" onClick={onClose} className="text-sm text-white/50 hover:text-white">Tutup</button>
        </div>
        {cfg.fields.map((f) => <Field key={f.name} f={f} value={v[f.name]} onChange={set(f.name)} slug={slugify(key)} />)}
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button disabled={saving} className="w-full rounded-full bg-emerald-400 py-2.5 font-bold text-black disabled:opacity-50">{saving ? 'Menyimpan…' : 'Simpan'}</button>
      </form>
    </div>
  )
}

export default function Manager({ name }) {
  const cfg = COLLECTIONS[name]
  const [rows, setRows] = useState(null)
  const [edit, setEdit] = useState(null)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    try { setRows(await readCollection(name)) } catch (e) { setMsg(e.message); setRows([]) }
  }, [name])
  useEffect(() => { setRows(null); setEdit(null); load() }, [load])

  const run = async (fn, message) => {
    try { setMsg(''); setRows(await updateCollection(name, fn, message)) } catch (e) { setMsg(e.message); load() }
  }
  const move = (i, d) => {
    const j = i + d
    if (j < 0 || j >= rows.length) return
    const [a, b] = [rows[i].id, rows[j].id]
    run((items) => {
      const x = items.findIndex((r) => r.id === a), y = items.findIndex((r) => r.id === b)
      if (x < 0 || y < 0) return items
      const next = [...items];[next[x], next[y]] = [next[y], next[x]]
      return next
    }, `admin: reorder ${name}`)
  }
  const toggle = (r) => run((items) => items.map((i) => (i.id === r.id ? { ...i, status: r.status === 'published' ? 'draft' : 'published' } : i)), `admin: toggle ${name}/${r.id}`)
  const del = async (r) => {
    if (!window.confirm(`Hapus "${r[cfg.titleKey]}"? Tidak bisa dibatalkan.`)) return
    await run((items) => items.filter((i) => i.id !== r.id), `admin: delete ${name}/${r.id}`)
    removeFile(r.cover)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-xs text-white/45">{rows ? `${rows.length} item` : 'memuat…'}</p>
        <button onClick={() => setEdit({ ...cfg.blank })} className="flex items-center gap-1.5 rounded-full bg-emerald-400 px-4 py-2 text-sm font-bold text-black"><Plus size={16} />Baru</button>
      </div>
      {msg && <p className="mb-3 rounded-[5px] border border-red-400/30 bg-red-400/10 p-2 text-sm text-red-300">{msg}</p>}
      <div className="border-t border-white/10">
        {rows?.map((r, i) => (
          <div key={r.id} className="flex items-center gap-3 border-b border-white/10 py-3">
            <div className="flex flex-col">
              <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Naik" className="text-white/40 hover:text-white disabled:opacity-20"><ArrowUp size={14} /></button>
              <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Turun" className="text-white/40 hover:text-white disabled:opacity-20"><ArrowDown size={14} /></button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{r[cfg.titleKey]}</p>
              <p className="truncate font-mono text-[11px] text-white/40">{r.kind || r.note || r.stage}{r.year ? ` · ${r.year}` : ''}</p>
            </div>
            <button onClick={() => toggle(r)} title="Klik untuk ganti status"
              className={`rounded-[5px] px-2 py-1 text-[11px] ${r.status === 'published' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-white/60'}`}>{r.status}</button>
            <button onClick={() => setEdit({ ...r })} aria-label="Edit" className="text-white/60 hover:text-white"><Pencil size={16} /></button>
            <button onClick={() => del(r)} aria-label="Hapus" className="text-white/40 hover:text-red-400"><Trash2 size={16} /></button>
          </div>
        ))}
        {rows?.length === 0 && <p className="py-10 text-center text-sm text-white/40">Belum ada item.</p>}
      </div>
      {edit && <Editor cfg={cfg} name={name} row={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); setMsg(''); load() }} />}
    </div>
  )
}
