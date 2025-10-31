import { useState } from "react";
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Hero = () => {
    const slides = [
        {
            id: 1,
            url: '/Hero-carousel/j.jpeg',
            title: <span className="font-highcruiser text-left ">Browse</span>,
            subtitle: <span className="font-albert text-left align-text-bottom"> artworks that spark inspiration. </span>
        },
        {
            url: '/Hero-carousel/asdfghjkl.jpg',
            title: <span className="font-highcruiser text-left ">Join </span>,
            subtitle: <span className="font-albert text-left align-text-bottom"> our art community. </span>,
            slogan: <span className="">connect with like-minded individuals and grow together</span>
        },
        {
            url: '/Hero-carousel/19.jpg',
            title: 'Join Our Community',
            subtitle: 'Connect with like-minded individuals and grow together'
        },
        {
            url: '/Hero-carousel/Image.jpg',
            title: 'Join Our Community',
            subtitle: 'Connect with like-minded individuals and grow together'
        },
        {
            url: '/Hero-carousel/24.jpg',
            title: 'Join Our Community',
            subtitle: 'Connect with like-minded individuals and grow together'
        },
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    const prevSlide = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? slides.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const nextSlide = () => {
        const isLastSlide = currentIndex === slides.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    const goToSlide = (slideIndex) => {
        setCurrentIndex(slideIndex);
    };

    return (
        <div className="relative group">
            <div className="h-screen bg-cover bg-center duration-300"
                style={{ backgroundImage: `url(${slides[currentIndex].url})` }}>
            </div>

            <div className="absolute inset-0 flex flex-col items-end text-white py-32 px-16">
                <h1 className="text-6xl md:text-7xl font-bold mb-4 drop-shadow-2xl">
                    {slides[currentIndex].title}
                    {slides[currentIndex].subtitle}
                </h1>
                <h2 className="font-albert text-4xl">
                    {slides[currentIndex].slogan}
                </h2>
            </div>

            <div className="absolute top-1/2 left-5 -translate-y-1/2 text-white/50 cursor-pointer hover:text-white transition-colors">
                <ChevronLeft size={70} onClick={prevSlide} />
            </div>

            <div className="absolute top-1/2 right-5 -translate-y-1/2 text-white/50 cursor-pointer hover:text-white transition-colors">
                <ChevronRight size={70} onClick={nextSlide} />
            </div>
        </div>
    )
}

export default Hero