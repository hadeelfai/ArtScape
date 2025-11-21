import React from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./ArticleDetailPage.css";


const allArticles = {
  0: {
    title: "Diriyah Contemporary Art Biennale Returns",
    badge: "Featured",
    date: "DEC 2021 — MAR 2022",
    image: "/NewsImages/newsHero.JPG",
    sourceLabel: "Diriyah Biennale Foundation",
    sourceUrl: "https://biennale.org.sa/",
    text: [
      "The Diriyah Contemporary Art Biennale is Saudi Arabia’s first international art biennale, held in the creative JAX District.",
      "It features global and local artists showcasing modern installations, sculptures, and conceptual works.",
      "The Biennale is part of a cultural movement supporting creative growth in the Kingdom."
    ]
  },

  1: {
    title: "Young Saudi Artists Rising in Digital Art Scene",
    badge: "Spotlight",
    date: "OCT 05, 2025",
    image: "/NewsImages/news1.JPG",
    sourceLabel: "Arab News – Saudi illustrator story",
    sourceUrl: "https://www.arabnews.com/node/1927076/saudi-arabia",
    text: [
      "Saudi youth are increasingly exploring digital illustration using tablets and apps such as Procreate.",
      "Digital artists mix Saudi culture with modern art styles, creating expressive and unique visual identities.",
      "Many young Saudi artists share their work online, gaining recognition and freelance opportunities."
    ]
  },

  2: {
    title: "Jeddah Corniche Art Week Draws Huge Crowds",
    badge: "Event",
    date: "OCT 21, 2025",
    image: "/NewsImages/news2.JPG",
    sourceLabel: "AGSI – Saudis transform the Kingdom through public art",
    sourceUrl: "https://agsi.org/analysis/saudis-transform-the-kingdom-through-public-art/",
    text: [
      "Jeddah Corniche Art Week transforms the waterfront into an open gallery full of sculptures and art installations.",
      "Local and international artists participate, building Jeddah’s reputation as a cultural center.",
      "The event brings art to public spaces, making it more accessible for families and youth."
    ]
  },

  3: {
    title: "University of Jeddah Hosts Student Art Showcase",
    badge: "Community",
    date: "OCT 19, 2025",
    image: "/NewsImages/article3.JPG",
    sourceLabel: "University of Jeddah – College of Art & Design",
    sourceUrl: "https://cad.uj.edu.sa/en/college-art-and-design",
    text: [
      "The University of Jeddah’s annual art showcase highlights student work in drawing, fashion, photography, and digital art.",
      "Students combine traditional Saudi aesthetics with modern techniques.",
      "These showcases help students build portfolios and confidence for the creative industry."
    ]
  },

  4: {
    title: "How AI is Transforming Art Education in Saudi Arabia",
    badge: "Featured",
    date: "OCT 10, 2025",
    image: "/NewsImages/articleHero.JPG",
    sourceLabel: "Times of India – Saudi AI curriculum",
    sourceUrl: "https://timesofindia.indiatimes.com/world/middle-east/saudi-arabia-introduces-ai-curriculum-for-over-six-million-students-as-part-of-vision-2030-goals/articleshow/123499532.cms",
    text: [
      "Saudi Arabia is introducing AI education in schools as part of Vision 2030.",
      "In art classes, AI tools help students experiment with ideas, colors, and styles faster.",
      "AI becomes a creative assistant, combining traditional skills with digital innovation."
    ]
  },

  5: {
    title: "The Rise of Digital Illustration Among Saudi Youth",
    badge: "Insight",
    date: "OCT 20, 2025",
    image: "/NewsImages/article1.JPG",
    sourceLabel: "Arab News – Digital art story",
    sourceUrl: "https://www.arabnews.com/node/1927076/saudi-arabia",
    text: [
      "Digital illustration is growing fast among young Saudis due to accessibility and creative potential.",
      "Artists mix anime, minimalism, and Saudi cultural elements to shape their unique art style.",
      "Many now work as freelancers in branding and content creation."
    ]
  },

  6: {
    title: "Jeddah Corniche Art Week Draws Huge Crowds",
    badge: "Event",
    date: "OCT 21, 2025",
    image: "/NewsImages/article2.JPG",
    sourceLabel: "Aesthetica Magazine – Jeddah Art Week",
    sourceUrl: "https://aestheticamagazine.com/jeddah-art-week-jeddah-saudi-arabia/",
    text: [
      "Jeddah Art Week includes exhibitions, performances, and installations across the city.",
      "The Corniche remains one of the most iconic locations for public art.",
      "The festival strengthens Jeddah’s position as a growing art destination."
    ]
  },

  7: {
    title: "University of Jeddah Hosts Student Art Showcase",
    badge: "Community",
    date: "OCT 19, 2025",
    image: "/NewsImages/article3.JPG",
    sourceLabel: "University of Jeddah – Student Clubs",
    sourceUrl: "https://dsa.uj.edu.sa/en/node/719",
    text: [
      "Student showcases present work created throughout the semester.",
      "The events help students develop teamwork, leadership, and artistic expression.",
      "They also promote a culture of creativity and collaboration on campus."
    ]
  }
};

function ArticleDetailPage() {
  const { id } = useParams();
  const article = allArticles[id];

  return (
    <>
      <Navbar />

      <div className="detail-page">
        <main className="detail-main">
          <h1 className="detail-title">{article.title}</h1>
          <p className="detail-date">{article.date}</p>

          <div className="detail-image-wrap">
            <img src={article.image} alt={article.title} className="detail-image" />
          </div>

          {article.text.map((p, i) => (
            <p key={i} className="detail-text">{p}</p>
          ))}

          <p className="detail-source">
            Source:{" "}
            <a href={article.sourceUrl} target="_blank" rel="noreferrer">
              {article.sourceLabel}
            </a>
          </p>
        </main>
      </div>

      <Footer />
    </>
  );
}

export default ArticleDetailPage;
