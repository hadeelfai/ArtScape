import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { toast } from 'sonner';
import { useGalleryData } from "../hooks/useGalleryData";

const CardsList = ({ artworks, loading }) => {
    const { addToCart } = useCart();
    const { users } = useGalleryData();

    // Fallback items if no artworks provided
    const defaultItems = [
        { id: 1, url: '/Hero-carousel/w2.jpeg' },
        { id: 2, url: '/Hero-carousel/w1.jpeg' },
        { id: 3, url: '/Hero-carousel/red.jpg' },
        { id: 4, url: '/Hero-carousel/orange.jpg' },
        { id: 5, url: '/Hero-carousel/pink.jpg' },
        { id: 6, url: '/Hero-carousel/dis.jpg' },
        { id: 7, url: '/Hero-carousel/wadi.jpg' },
    ];

    // Use provided artworks or fallback to default items
    const items = artworks && artworks.length > 0 ? artworks : defaultItems;

    // Lookup user
    const lookupUser = (id) =>
        users.find((user) => user._id === id || user.id === id) || {};

    // Render artwork card
    const renderArtworkCard = (art) => {
        const user = lookupUser(art.artist);
        const username =
            user.username ||
            user.name?.replace(/\s+/g, "").toLowerCase() ||
            "artist";
        const avatarUrl = user.avatar || user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;

        return (
            <div key={art._id || art.id} className="w-52 lg:w-96 md:w-96 flex-shrink-0">
                <Link to={`/artwork/${art._id || art.id}`} className="flex flex-col items-start gap-2 bg-white">
                    <div className="aspect-[1/1] w-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        <img
                            src={art.image && art.image.startsWith('http') ? art.image : '/Profileimages/User.jpg'}
                            alt={art.title || 'Artwork'}
                            className="w-full h-full object-cover"
                            onError={e => { e.target.onerror = null; e.target.src = '/Profileimages/User.jpg'; }}
                        />
                    </div>
                    <div className="text-left w-full">
                        <div className="flex items-center gap-2 mb-1">
                            <Link
                                to={user._id ? `/profile/${user._id}` : '#'}
                                onClick={e => e.stopPropagation()}
                            >
                                <img
                                    src={avatarUrl}
                                    alt={username}
                                    className="w-6 h-6 rounded-full object-cover border"
                                />
                            </Link>
                            <Link
                                to={user._id ? `/profile/${user._id}` : '#'}
                                onClick={e => e.stopPropagation()}
                                className="text-sm text-gray-500 hover:underline"
                            >
                                {username.startsWith('@') ? username : `@${username}`}
                            </Link>
                        </div>
                        <div className="text-left w-full">
                            <p className="font-semibold text-base text-gray-900">
                                {art.title || "Untitled"}
                            </p>
                        </div>
                        {art.price !== undefined && (
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-sm font-medium text-gray-900">{art.price} SAR</span>
                                <button title="Add to cart" className="ml-1 p-1 hover:bg-gray-100 rounded" onClick={async e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const success = await addToCart(art, (error) => {
                                        toast.error(error);
                                    });
                                    if (success) {
                                        toast.success('Added to cart!');
                                    }
                                }}>
                                    <ShoppingCart className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </Link>
            </div>
        );
    };

    // Render default card
    const renderDefaultCard = (item) => (
        <div key={item.id} className="w-72 lg:w-96 md:w-96 flex-shrink-0">
            <img
                src={item.url}
                alt={item.title || `Slide ${item.id}`}
                className="w-full h-full object-cover"
            />
        </div>
    );

    if (loading) {
        return (
            <div className="pl-28">
                <div className="flex items-center justify-center py-16">
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pl-28">
            <div className='overflow-x-auto whitespace-nowrap'>
                <div className="inline-flex gap-10 p-4">
                    {items.map(item => 
                        item.artist ? renderArtworkCard(item) : renderDefaultCard(item)
                    )}
                </div>
            </div>
        </div>
    );
};

export default CardsList;