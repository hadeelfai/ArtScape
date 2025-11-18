import React, {useState} from "react";
import { useNavigate} from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./NewsPage.css";

function News (){

    const [activeTab, setActiveTab] = useState("news");
    const navigate = useNavigate();

    const newsHero ={
        id:0,
        label: "FEATURED",
        title:"Diriyah Contemporary Art Biennale Returns",
        image: "/NewsImages/newsHero.JPG",
    };

    const articlesHero = {
        id:4,
        label: "FEATURED",
        title: "How AI is Transforming Art Education in Saudi Arabia",
        image: "/NewsImages/articleHero.JPG",
    
    };

    //Cards under latest news
    const newsCards = [
        {
            id: 1,
            badge: "Spotlight",
            title:"Young Saudi Artists Rising in Digital Art Scene",
            text: "Emerging Saudi digital illustrators and 3D artists are making waves with futuristic concepts and innovative storytelling.",
            date:"OCT 05, 2025",
            image:"/NewsImages/news1.JPG",
        },

          {
            id: 2,
            badge:"Event",
            title:"Jeddah Corniche Art Week Draws Huge Crowds",
            text:"Public art installations and live mural painting turn Jeddah’s waterfront into a vibrant creative space.",
            date:"OCT 21, 2025",
            image:"/NewsImages/news2.JPG",
        },

        {
            id: 3,
            badge:"Community",
            title:"University of Jeddah Hosts Student Art Showcase",
            text:"Student photographers and painters present experimental works celebrating Saudi youth creativity.",
            date:"OCT 19, 2025",
            image:"/NewsImages/article3.JPG",
        },
    ];

    const articleCards = [
        {
            id: 4,
            badge:"Insight",
            title: "The Rise of Digital Illustration Among Saudi Youth",
            text: "Creativity meets technology as more young artists shift to digital platforms.",
            date: "OCT 20, 2025",
            image: "/NewsImages/article1.JPG",
        },

      {
            id: 5,
            badge:"Event",
            title: "Jeddah Corniche Art Week Draws Huge Crowds",
            text: "Public art installations and live mural painting turn Jeddah’s waterfront into a vibrant creative space.",
            date: "OCT 21, 2025",
            image: "/NewsImages/article2.JPG",
        },
        {
            id: 6,
            badge:"Community",
            title: "University of Jeddah Hosts Student Art Showcase",
            text: "Student photographers and painters present experimental works celebrating Saudi youth creativity.",
            date: "OCT 19, 2025",
            image: "/NewsImages/article3.JPG",
        },
    ];

 
    const isNews = activeTab === "news";
    const hero = isNews ? newsHero : articlesHero;
    const cards = isNews ? newsCards : articleCards;

    //when hero arrow is clicked
const handleHeroClick = () => {
  if (isNews) {
    navigate(`/news/${hero.id}`);
  } else {
    navigate(`/articles/${hero.id}`);
  }
};

//when small card arrow is clicked
const handleCardClick = (id) => {
  if (isNews) {
    navigate(`/news/${id}`);
  } else {
    navigate(`/articles/${id}`);
  }
};


    return(
        <>
       
            <Navbar />

            <main className="news-main">

                {/* Tabs */}

                <div className="tabs-wrapper">
                    <div className="tabs-bg">
                        <button className= {
                            isNews ? "tab-btn tab-btn-active" : "tab-btn"
                        }
                        onClick={() => setActiveTab("news")}>
                            News
                        </button>

                        <button className= {
                            ! isNews ? "tab-btn tab-btn-active" : "tab-btn"
                        }
                        onClick={
                            () => setActiveTab("articles")
                        }>
                            Articles
                        </button>
                    </div>
                </div>


                {/* Hero card*/}

                <section className="hero-section" >
                    <div className="hero-card" style = {{backgroundImage: `url(${hero.image})`}}>
                        <div className="hero-overlay"/>
                        <div className="hero-text">
                            <span className="hero-label">
                                {hero.label}
                            </span>

                            <h1 className="hero-title">
                                {hero.title}
                            </h1>

                        </div>
                        <button className="hero-arrow" onClick={handleHeroClick}>
                            {">"}
                        </button>
                    </div>
                </section>

                {/*hero section ends*/}


                {/* Latest new and Articles */}

                <section className="list-section">
                    <h2 className="Section-heading">{isNews ? "Latest News" : "Latest Articles"}</h2>

                    <div className="cards-row">

                        {cards.map((item) => (
                            <article key={item.id} className="news-card">
                                <div className="card-img-wrap">
                                    <img
                                    src={item.image}
                                    alt={item.title}
                                    className="card-img" 
                                    />
                                </div>

                                <div className="card-body">
                                    <span className="card-badge"> {item.badge} </span>
                                    <h3 className="card-title"> {item.title} </h3>
                                    <p className="card-text"> {item.text} </p>
                                    <p className="card-date"> {item.date} </p>
                                </div>

                                <button className="card-arrow" onClick={() => handleCardClick(item.id)}> {">"} </button>
                            </article>
                        ))}
                    </div>
                </section>

            </main>
        <Footer />
        </>
    )
}

export default News;
