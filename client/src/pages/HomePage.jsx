import CardsList from '../components/CardsList'
import Navbar from '../components/Navbar'
import ScrollVelocity from '../components/ScrollVelocity'
import { motion } from "framer-motion";
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import HomeNewsSection from '../components/HomeNewsSection';
import HomeArticlesSection from '../components/HomeArticlesSection';


const steps = [
  {
    id: 1,
    title: "Create an Account",
    subtitle: "Sign up to start your art journey"
  },
  {
    id: 2,
    title: "Share your art",
    subtitle: "Upload and showcase your artworks with the community"
  },
  {
    id: 3,
    title: "Browse & Discover",
    subtitle: "Explore diverse collections and find inspiration"
  },
  {
    id: 4,
    title: "Buy & Collect",
    subtitle: "Support artists by purchasing pieces you love"
  },
  {
    id: 5,
    title: "Connect & Discuss",
    subtitle: "join conversations, exchange ideas, and grow with the community"
  },
  {
    id: 6,
    title: "Stay Updated",
    subtitle: "Read weekly articles, art news, and exhibition updates"
  },
];



const HomePage = () => {
  return (
    <div>
      <Navbar />

      <div className="relative">
        <img src='d.gif' className='w-full' />
        <h1 className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-3xl md:text-5xl lg:text-7xl font-highcruiser text-center'>ArtScape</h1>
        <h2 className="absolute top-2/4 pt-20 md:pt-36 lg:pt-48 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-3xl md:text-5xl lg:text-7xl font-highcruiser text-center">
          everyone is an Artist
        </h2>
      </div>

      {/* Latest pieces section */}
      <div>
        <div className='flex justify-between'>
          <h1 className='font-albert text-4xl lg:text-5xl pl-24 pt-20 pb-4'>Latest <span className='font-highcruiser'>Pieces</span></h1>
          <Link to={"/marketplace"}> <h1 className='font-albert text-lg md:text-xl lg:text-2xl underline underline-offset-4 pr-10 pt-20 pb-4'>See More</h1> </Link>
        </div>
        <CardsList />
      </div>


      <div className='lg:pt-52 pt-28 text-center p-9 pb-4 text-3xl lg:text-6xl'>
        <h1 className='font-akshar'>About <span className='font-highcruiser'>ArtScape</span>: what makes us unique</h1>
      </div>

      <div>
        <h2 className='font-albert text-center leading-loose pt-2 p-10 lg:pt-11 lg:p-40 lg:pb-10 lg:leading-loose lg:text-2xl'> ArtScape is a digital art gallery built to celebrate creativity in all its forms.
          We provide a space where artists can share their work, connect with other creators,
          and showcase their talent to a global audience. Whether you’re a painter,
          photographer, digital illustrator, or experimental artist, ArtScape offers
          you a platform to be seen, appreciated, and supported.</h2>
        <p className='text-center pb-52'><a className='font-akshar text-2xl text-center underline decoration-2 underline-offset-8 cursor-pointer' href='/AboutUs'>
          Read more in <span className='font-highcruiser '>About Us</span></a></p>
      </div>



      <ScrollVelocity
        texts={['✦ Discover ✦ Collect ✦ Connect']}
        className="custom-scroll-text text-rose-600"
      />

      <div className='bg-black text-white font-akshar'>

        <div className='lg:flex lg:flex-col-2 lg:items-center'>

          <h1 className='text-6xl p-28 pb-11 pt-16'>
            How to Use <span className='font-highcruiser'>ArtScape</span>?
          </h1>


          <div className="px-28 pb-20 space-y-10 lg:pt-20 lg:px-12 lg:w-full">
            {steps.map((step, i) => (
              <motion.div
                key={step.id}
                className={`flex gap-6 pb-8 ${i !== steps.length - 1 ? "border-b border-gray-600" : ""
                  }`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                {/* Number circle */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full border border-gray-400 flex items-center justify-center text-lg font-semibold">
                  {step.id}
                </div>

                {/* Content */}
                <div>
                  <h2 className="lg:text-2xl font-medium">{step.title}</h2>
                  <p className="uppercase tracking-wide mt-1 text-sm">{step.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>


      </div>

      <div className='pt-20 text-center text-3xl lg:text-6xl'>
        <h1 className='font-akshar'>Stay Updated With <span className='font-highcruiser'>ArtScape</span></h1>
      </div>

      <HomeArticlesSection />

      <HomeNewsSection />

      <div className='pt-44'>
        <Footer />
      </div>

    </div>
  )
}

export default HomePage
