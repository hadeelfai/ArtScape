import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import ScrollVelocity from '../components/ScrollVelocity'
import Footer from '../components/Footer'

const AboutUs = () => {
    const [currentSlide, setCurrentSlide] = useState(0)

    const slides = [
        {
            image: '../Hero-carousel/photography.jpg',
            title: 'Photography',
            type: 'Capturing Moments'
        },
        {
            image: '../Hero-carousel/sculpture.jpg',
            title: 'Sculpture',
            type: 'Shaping Dimensions'
        },
        {
            image: '../Hero-carousel/paintings.jpg',
            title: 'Paintings',
            type: 'Expressing Colors'
        }
    ]

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length)
        }, 4000) 

        return () => clearInterval(timer)
    }, [])

    const goToSlide = (index) => {
        setCurrentSlide(index)
    }

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
    }

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    }

    return (
        <div>
            <Navbar />
            <div >


                {/* Carousel */}
                <div className='max-w-full mx-auto px-6 relative pt-28'>
                    <div className='relative overflow-hidden rounded-lg'>
                        {/* Slides */}
                        <div className='relative h-[400px] lg:h-[800px]'>
                            {slides.map((slide, index) => (
                                <div
                                    key={index}
                                    className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ${currentSlide === index ? 'opacity-100' : 'opacity-0'
                                        }`}
                                >
                                    <img
                                        src={slide.image}
                                        alt={slide.title}
                                        className='w-full h-full object-cover'
                                    />
                                    {/* Text Overlay */}
                                    <div className='absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center'>
                                        <h2 className='font-highcruiser text-5xl lg:text-7xl text-white mb-2'>
                                            {slide.title}
                                        </h2>
                                        <p className='font-albert text-xl lg:text-2xl text-white/90'>
                                            {slide.type}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Navigation Arrows */}
                        <button
                            onClick={prevSlide}
                            className='absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all'
                        >
                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                            </svg>
                        </button>
                        <button
                            onClick={nextSlide}
                            className='absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all'
                        >
                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                            </svg>
                        </button>

                        {/* Dots Indicator */}
                        <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2'>
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`w-3 h-3 rounded-full transition-all ${currentSlide === index
                                        ? 'bg-gray-500 w-8'
                                        : 'bg-white/50 hover:bg-white/80'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <ScrollVelocity
                    texts={[' Everyone Is An Artist ✦']}
                    className="custom-scroll-text pt-2 pb-11"
                />

                <h1 className='pt-11 pb-10 text-center font-highcruiser text-4xl lg:text-6xl'>About Us</h1>
                <p className='pb-10 leading-loose text-start lg:leading-loose pl-10 pr-10 lg:pl-44 lg:pr-44 text-xl lg:text-3xl font-albert'>
                    We're senior students from Jeddah University
                    developing an art platform for our graduation
                    project.
                    If you have artworks to share (or know someone
                    who does) we'd love your help connecting with
                    them!
                </p>



                <p className='leading-loose lg:leading-loose text-start pl-10 pr-10 pt-5 lg:pl-44 lg:pr-44 text-xl lg:text-3xl font-albert'>
                    ArtScape is a space for people to share and promote their art,
                    engage with the art community, and stay inspired by the art world.
                    We support all forms of art, photography, sculptures, paintings.
                    Basically all kinds of art!!
                </p>



                <div className='pt-36'>
                    <Footer />
                </div>

            </div>
        </div>
    )
}

export default AboutUs