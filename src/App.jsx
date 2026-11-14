import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import KetupatBackground from './components/KetupatBackground.jsx'
import SnakeLayer from './components/SnakeLayer.jsx'
import ScrollBlur from './components/ScrollBlur.jsx'
import Fireworks from './components/Fireworks.jsx'
import PageLoader, { COVER_IN, LOAD_TIME } from './components/PageLoader.jsx'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import { Marquee, About, Features, Capabilities, Pillars, Cta, Teasers, Footer } from './components/Sections.jsx'
import Code from './pages/Code.jsx'
import Design from './pages/Design.jsx'
import Learning from './pages/Learning.jsx'
import useRoute from './useRoute.js'

const Home = () => (
  <>
    <Hero />
    <Marquee />
    <Teasers />
    <About />
    <Features />
    <Capabilities />
    <Pillars />
    <Cta />
  </>
)
const PAGES = { home: Home, code: Code, design: Design, learning: Learning }

export default function App() {
  const route = useRoute()
  // `shown` is the page actually on screen. When the route changes, a black loading cover fades in first, the page is
  // swapped underneath it (and scrolled to the top), then the cover fades out. The very first load has no cover.
  const [shown, setShown] = useState(route)
  const [loading, setLoading] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    setLoading(true)
    const swap = setTimeout(() => { setShown(route); window.scrollTo({ top: 0, behavior: 'instant' }) }, COVER_IN * 1000)
    const done = setTimeout(() => setLoading(false), (COVER_IN + LOAD_TIME) * 1000)
    return () => { clearTimeout(swap); clearTimeout(done) }
  }, [route])

  const Page = PAGES[shown]
  return (
    <>
      <KetupatBackground />
      <SnakeLayer />
      <ScrollBlur />
      <Header route={route} />
      <motion.div key={shown} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.2, 0.9, 0.2, 1] }}>
        <Page />
      </motion.div>
      <Footer />
      <Fireworks />
      <AnimatePresence>{loading && <PageLoader key="loader" route={route} />}</AnimatePresence>
    </>
  )
}
