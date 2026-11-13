import { AnimatePresence, motion } from 'framer-motion'
import KetupatBackground from './components/KetupatBackground.jsx'
import SnakeLayer from './components/SnakeLayer.jsx'
import ScrollBlur from './components/ScrollBlur.jsx'
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
  const Page = PAGES[route]
  return (
    <>
      <KetupatBackground />
      <SnakeLayer />
      <ScrollBlur />
      <Header route={route} />
      <AnimatePresence mode="wait">
        <motion.div key={route} initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.45, ease: [0.2, 0.9, 0.2, 1] }}>
          <Page />
        </motion.div>
      </AnimatePresence>
      <Footer />
    </>
  )
}
