import { useState } from 'react'
import { Upload, Link2, X } from 'lucide-react'
import { uploadImage } from './github.js'
import { mediaUrl, safeUrl } from '../content.js'

const input = 'w-full rounded-[5px] border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-emerald-400/60'

export const Label = ({ children }) => <span className="mb-1 block font-mono text-[11px] text-white/45">{children}</span>

export function TagsField({ value, onChange }) {
  const [text, setText] = useState((value || []).join(', '))
  return (
    <input className={input} value={text}
      onChange={(e) => { setText(e.target.value); onChange(e.target.value.split(',').map((t) => t.trim()).filter(Boolean)) }} />
  )
}

// Resize to max 1600px and re-encode as WebP before upload (saves quota, keeps pages fast).
async function toWebp(file, max = 1600) {
  const bmp = await createImageBitmap(file)
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s)
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Gagal mengubah gambar'))), 'image/webp', 0.85))
}

export function CoverField({ value, onChange, slug }) {
  const mode = value?.type || 'none'
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [local, setLocal] = useState('')
  const preview = (mode === 'upload' && local) || mediaUrl(value)

  const upload = async (file) => {
    setErr('')
    if (!file) return
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) return setErr('Hanya PNG, JPG, WEBP, atau GIF.')
    if (file.size > 15 * 1024 * 1024) return setErr('Maksimal 15 MB.')
    setBusy(true)
    try {
      const blob = await toWebp(file)
      const name = `uploads/${slug || 'img'}-${Date.now().toString(36)}.webp`
      await uploadImage(name, blob)
      setLocal(URL.createObjectURL(blob)) // GitHub's CDN needs a few minutes; show the file we just made
      onChange({ type: 'upload', src: name })
    } catch (e) { setErr(e.message || 'Upload gagal') }
    setBusy(false)
  }

  const tab = (m, Icon, label) => (
    <button type="button" onClick={() => onChange(m === 'none' ? null : m === 'url' ? { type: 'url', src: '' } : { type: 'upload', src: '' })}
      className={`flex items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 text-xs ${mode === m ? 'bg-white text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
      {Icon && <Icon size={13} />}{label}
    </button>
  )

  return (
    <div>
      <div className="flex gap-1.5 mb-2">{tab('upload', Upload, 'Upload gambar')}{tab('url', Link2, 'Link gambar')}{tab('none', X, 'Tanpa cover')}</div>
      {mode === 'upload' && (
        <label className="block cursor-pointer rounded-[5px] border border-dashed border-white/20 p-4 text-center text-xs text-white/55 hover:border-emerald-400/60">
          {busy ? 'Mengunggah…' : 'Klik untuk pilih gambar (otomatis jadi WebP maks 1600px)'}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      )}
      {mode === 'url' && (
        <>
          <input className={input} placeholder="https://…/gambar.png" value={value.src}
            onChange={(e) => onChange({ type: 'url', src: e.target.value })} />
          {value.src && !safeUrl(value.src) && <p className="mt-1 text-xs text-red-400">Harus diawali http:// atau https://</p>}
        </>
      )}
      {err && <p className="mt-1 text-xs text-red-400">{err}</p>}
      {preview && <img src={preview} alt="" className="mt-2 max-h-40 rounded-[5px] border border-white/10" referrerPolicy="no-referrer" />}
    </div>
  )
}

export function Field({ f, value, onChange, slug }) {
  const v = value ?? ''
  let el
  switch (f.type) {
    case 'area': el = <textarea rows={5} className={input} value={v} onChange={(e) => onChange(e.target.value)} />; break
    case 'tags': el = <TagsField value={value} onChange={onChange} />; break
    case 'cover': el = <CoverField value={value} onChange={onChange} slug={slug} />; break
    case 'select': el = (
      <select className={input} value={v} onChange={(e) => onChange(e.target.value)}>
        {f.options.map((o) => <option key={o} value={o} className="bg-black">{o}</option>)}
      </select>); break
    case 'range': el = (
      <div className="flex items-center gap-3">
        <input type="range" min={f.min} max={f.max} value={v} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-emerald-400" />
        <span className="w-10 text-right font-mono text-xs">{v}</span>
      </div>); break
    default: el = <input className={input} type="text" value={v} onChange={(e) => onChange(e.target.value)} />
  }
  return <div><Label>{f.label}{f.required && ' *'}</Label>{el}</div>
}
