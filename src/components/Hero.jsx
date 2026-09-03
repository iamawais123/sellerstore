import { useState, useEffect } from 'react'
import { heroSlides } from '../data/data'

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const goToSlide = (index) => setCurrentSlide(index)
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)

  const slide = heroSlides[currentSlide]

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative h-[70vh] min-h-[500px] max-h-[700px]">
        {heroSlides.map((s, idx) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={s.image}
              alt={s.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
          </div>
        ))}

        <div className="absolute inset-0 z-20 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div
              key={currentSlide}
              className="max-w-xl animate-fade-in"
              style={{
                animation: 'fadeSlideUp 0.8s ease-out forwards',
              }}
            >
              <div className="flex items-center mb-5">
                <span className="w-8 h-px bg-white/80 mr-3" />
                <span className="text-white tracking-[0.2em] text-sm font-semibold uppercase">
                  {slide.category}
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif text-white leading-[1.1] mb-8" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                {slide.title}
              </h1>
              <button className="inline-flex items-center space-x-2 bg-white text-gray-900 px-8 py-4 rounded-full font-semibold hover:bg-gray-50 hover:shadow-lg transition-all duration-300 group">
                <span>{slide.cta}</span>
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={prevSlide}
          className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
          aria-label="Previous slide"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
          aria-label="Next slide"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <div className="absolute top-6 right-6 lg:right-12 z-30 text-white/90 font-mono text-sm tracking-wider">
          <span className="text-white font-bold text-lg">
            {String(currentSlide + 1).padStart(2, '0')}
          </span>
          <span className="mx-2 text-white/50">/</span>
          <span className="text-white/60">
            {String(heroSlides.length).padStart(2, '0')}
          </span>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`rounded-full transition-all duration-300 ${
                idx === currentSlide
                  ? 'w-10 h-2 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  )
}

export default Hero
