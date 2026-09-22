import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { heroSlides } from '../data/data'

const SWIPE_DISTANCE = 45

const Chevron = ({ d }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
)

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStart = useRef(null)

  useEffect(() => {
    if (paused) return undefined
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [paused])

  const goToSlide = (index) => setCurrentSlide(index)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)

  const onTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    setPaused(true)
  }
  const onTouchEnd = (e) => {
    const start = touchStart.current
    touchStart.current = null
    setPaused(false)
    if (!start) return
    const dx = e.changedTouches[0].clientX - start.x
    const dy = e.changedTouches[0].clientY - start.y
    if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) nextSlide()
      else prevSlide()
    }
  }

  const slide = heroSlides[currentSlide]

  return (
    <section
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <div className="relative h-[68vh] min-h-[440px] max-h-[720px] sm:h-[70vh] sm:min-h-[500px]">
        {heroSlides.map((s, idx) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            aria-hidden={idx !== currentSlide}
          >
            <img
              src={s.image}
              alt=""
              className="w-full h-full object-cover"
              loading={idx === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/10 sm:bg-gradient-to-r sm:from-black/50 sm:via-black/20 sm:to-transparent" />
          </div>
        ))}

        <div className="absolute inset-0 z-20 flex items-end sm:items-center pb-20 sm:pb-0">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full">
            <div key={currentSlide} className="max-w-xl" style={{ animation: 'fadeSlideUp 0.8s ease-out forwards' }}>
              <div className="flex items-center mb-3 sm:mb-5">
                <span className="w-8 h-px bg-white/80 mr-3 shrink-0" />
                <span className="text-white tracking-[0.18em] sm:tracking-[0.2em] text-xs sm:text-sm font-semibold uppercase">
                  {slide.category}
                </span>
              </div>
              <h1
                className="text-[2.6rem] leading-[1.08] sm:text-6xl lg:text-7xl text-white mb-6 sm:mb-8"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                {slide.title}
              </h1>
              <Link
                to={slide.to || '/shop'}
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3.5 sm:px-8 sm:py-4 rounded-full font-semibold hover:bg-gray-50 hover:shadow-lg transition-all duration-300 group"
              >
                <span>{slide.cta}</span>
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={prevSlide}
          className="hidden sm:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-lg items-center justify-center transition-all duration-300 hover:scale-110"
          aria-label="Previous slide"
        >
          <Chevron d="M15 19l-7-7 7-7" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          className="hidden sm:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-lg items-center justify-center transition-all duration-300 hover:scale-110"
          aria-label="Next slide"
        >
          <Chevron d="M9 5l7 7-7 7" />
        </button>

        <div className="absolute top-5 right-5 lg:top-6 lg:right-12 z-30 text-white/90 font-mono text-sm tracking-wider" aria-hidden="true">
          <span className="text-white font-bold text-base sm:text-lg">{String(currentSlide + 1).padStart(2, '0')}</span>
          <span className="mx-2 text-white/50">/</span>
          <span className="text-white/60">{String(heroSlides.length).padStart(2, '0')}</span>
        </div>

        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goToSlide(idx)}
              className="p-2 group"
              aria-label={`Go to slide ${idx + 1}`}
              aria-current={idx === currentSlide}
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  idx === currentSlide ? 'w-10 h-2 bg-white' : 'w-2 h-2 bg-white/40 group-hover:bg-white/70'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}

export default Hero
