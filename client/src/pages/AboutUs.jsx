import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { motion } from 'framer-motion'




const AboutUs = () => {


    return (
        <div>
            <Navbar />
            <div >

                <p className='pt-32 leading-relaxed text-start lg:leading-loose pl-10 pr-10 lg:pl-64 lg:pr-64 text-lg lg:text-2xl font-albert font-light'>
                    ArtScape means a broad, immersive landscape or scene of art,
                    evoking a place where various forms of art
                    (like paintings, photography, and sculptures) come together to create a vast,
                    diverse artistic environment.
                </p>


                <div className='grid gap-2 grid-cols-3 pt-11 lg:pt-16 pb-16 lg:pl-20 lg:pr-20'>
                    <div className='flex flex-col items-center justify-center'>
                        <img
                            src='Hero-carousel/rug.jpg'
                            alt='rug'
                            className='w-full max-w-[500px] h-56 md:h-96 lg:h-[550px] object-cover'
                        />
                    </div>

                    <div className='flex flex-col items-center justify-center'>
                        <img
                            src='Hero-carousel/coffee.jpg'
                            alt='coffee'
                            className='w-full max-w-[600px] lg:h-[650px] object-cover'
                        />
                    </div>

                    <div className='flex flex-col items-center justify-center'>
                        <img
                            src='Hero-carousel/pom.jpg'
                            alt='pomegranate'
                            className='w-full max-w-[500px] h-56 md:h-96 lg:h-[550px] object-cover'
                        />
                    </div>
                </div>



                <div className='bg-black text-white font-albert pt-8 pb-12'>

                    <div className='grid grid-cols-[1fr_1.5fr] lg:grid-cols-[1fr_2fr] p-8 lg:p-20 lg:pt-10'>

                        <h1 className='font-normal text-md lg:text-xl'>About ArtScape</h1>
                        <p className='font-light text-sm lg:text-lg leading-relaxed'>ArtScape is a digital art gallery platform founded in 2024 in Jeddah
                            with the purpose of creating a centralized platform for art lovers and artists.
                            The platform aims to showcase and sell various forms of art, including paintings,
                            sculptures, and photography, while also connecting users with local galleries and art exhibitions.
                            ArtScape seeks to support artists, promote cultural awareness,
                            and make discovering and engaging with art more accessible to the community.</p>

                        <h1 className='pt-24 font-normal text-md lg:text-xl'>Meet the founders</h1>

                    </div>

                    <motion.div 
                      className='flex flex-col items-center'
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                    >
                        <img className='w-40 lg:w-60' src='founder.png' alt='founder1' />
                        <h1 className='text-center pt-4 lg:text-2xl'>Hadeel Alharthi</h1>
                        <p className='pt-2 p-16 text-center font-light text-sm lg:text-base'>An extraordinary designer and programmer with a love for art and music,
                            I like to add that extra spark to everything I make.</p>
                    </motion.div>


                    <motion.div 
                      className='flex flex-col items-center'
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      viewport={{ once: true, amount: 0.2 }}
                    >
                        <img className='w-40 lg:w-60' src='founder.png' alt='founder1' />
                        <h1 className='text-center pt-4 lg:text-2xl'>Bayan Alsahafi</h1>
                        <p className='pt-2 p-16 text-center font-light text-sm lg:text-base'>A passionate computer science student who enjoys turning ideas
                            into functional and meaningful innovative systems. I'm driven by curiosity,<br></br>
                            creative thinking, and continuously learning new technologies.</p>
                    </motion.div>


                    <motion.div 
                      className='flex flex-col items-center'
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      viewport={{ once: true, amount: 0.2 }}
                    >
                        <img className='w-40 lg:w-60' src='founder.png' alt='founder1' />
                        <h1 className='text-center pt-4 lg:text-2xl'>Riyam Alawaji</h1>
                        <p className='pt-2 p-16 text-center font-light text-sm lg:text-base'>A passionate developer with a strong interest in creating clean
                            and meaningful web experiences. She focuses on building effective <br></br> and
                            well-structured web solutions with attention to detail and user experience.</p>
                    </motion.div>



                    <motion.div 
                      className='flex flex-col items-center'
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      viewport={{ once: true, amount: 0.2 }}
                    >
                        <img className='w-40 lg:w-60' src='founder.png' alt='founder1' />
                        <h1 className='text-center pt-4 lg:text-2xl'>Rahaf Alajlani</h1>
                        <p className='pt-2 p-16 text-center font-light text-sm lg:text-base'>Inspired by art and design, blending UI creativity
                            and technical thinking to create meaningful experiences.</p>
                    </motion.div>


                    <motion.div 
                      className='flex flex-col items-center'
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.8 }}
                      viewport={{ once: true, amount: 0.2 }}
                    >
                        <img className='w-40 lg:w-60' src='founder.png' alt='founder1' />
                        <h1 className='text-center pt-4 lg:text-2xl'>Dana Aljuaid</h1>
                        <p className='pt-2 p-16 text-center font-light text-sm lg:text-base'>An ambitious and evolving individual driven
                            by curiosity and a love for learning. She thrives on challenges and enjoys turning <br></br>ideas into
                            creative and meaningful solutions.</p>
                    </motion.div>


                </div>


                <div className='pt-0 border-t border-gray-700 text-center text-sm'>
                    <Footer />
                </div>

            </div>
        </div>
    )
}

export default AboutUs