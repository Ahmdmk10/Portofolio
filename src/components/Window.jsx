import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

// vshslv-like detail "window" over a dimmed page.
export default function Window({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <motion.div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div onClick={(e) => e.stopPropagation()} initial={{ y: 30, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="w-full max-w-2xl max-h-[88vh] overflow-auto rounded-xl border border-white/10 bg-[#0b0d0c]">
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[#0b0d0c] px-4 py-2.5">
          <span className="font-mono text-[11px] text-white/50">{title}</span>
          <button onClick={onClose} aria-label="Close" className="text-white/60 hover:text-white"><X size={16} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
