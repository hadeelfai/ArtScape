
const CardsList = () => {

    const items = [
        {
            id: 1,
            url: '/Hero-carousel/w2.jpeg'
        },
        {
            id: 2,
            url: '/Hero-carousel/w1.jpeg'
        },
        {
            id: 3,
            url: '/Hero-carousel/red.jpg'
        },
        {
            id: 4,
            url: '/Hero-carousel/orange.jpg'
        },
        {
            id: 5,
            url: '/Hero-carousel/pink.jpg'
        },
        {
            id: 6,
            url: '/Hero-carousel/dis.jpg'
        },
        {
            id: 7,
            url: '/Hero-carousel/wadi.jpg'
        },
    ];

    return (
        <div className="pl-28">
            <div className='overflow-x-auto whitespace-nowrap'>

                <div className="inline-flex gap-10 p-4">
                    {items.map(item => (
                        <div key={item.id} className="w-72 lg:w-96 md:w-96 flex-shrink-0">
                            {/* Card content */}
                            <img
                                src={item.url}
                                alt={item.title || `Slide ${item.id}`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}

export default CardsList
