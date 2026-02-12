import { Instagram } from 'lucide-react';


export default function Footer() {
  return (
    <footer className="w-full bg-black text-white font-albert py-12 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 md:grid-cols-4 gap-8">

        <div>
          <h1 className="font-highcruiser text-3xl mb-2">ArtScape</h1>
          <h2 className="text-lg text-white">Everyone Is An Artist</h2>
        </div>

        <div>
          <h3 className="text-lg lg:text-xl mb-3">Quick Links</h3>
          <ul className="space-y-2">
            <li><a href="/about" className="hover:opacity-80 transition-opacity inline-flex items-center">About Us</a></li>
            <li><a href="/contact" className="hover:opacity-80 transition-opacity inline-flex items-center">Contact us</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg lg:text-xl mb-3">Community</h3>
          <ul className="space-y-2">
            <li><a href="/news" className="hover:opacity-80 transition-opacity inline-flex items-center">Articles & News</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg lg:text-xl mb-3">Follow Us</h3>
          <ul className="space-y-2">
            <li>
              <a
                href="https://www.instagram.com/x.artscape.x/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity inline-flex items-center"
              >
                <Instagram className="w-6 h-6" />
              </a>

            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 mt-10 pt-6 text-center text-white text-sm">
        <p>© 2026 ArtScape. All rights reserved.</p>
      </div>
    </footer >
  );
}
