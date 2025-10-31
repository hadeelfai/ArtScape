import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import Link from '@mui/material/Link';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export default function MasonryImageList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <ImageList
      variant="masonry"
      cols={isMobile ? 2 : 3}
      gap={8}
      sx={{
        width: '100%',
        margin: 0,
        padding: 0,
        overflow: 'visible',
      }}
    >
      {itemData.map((item) => (
        <ImageListItem key={item.img}>
          <ImageListItemBar
            title={
              <Link
                href={item.link}
                underline="none"
                sx={{
                  color: '#fff',
                  fontWeight: 500,
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'inline-block',
                  paddingBottom: '2px',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: 0,
                    height: '1px',
                    backgroundColor: '#fff',
                    transition: 'width 0.3s ease-in-out',
                  },
                  '&:hover::after': {
                    width: '100%',
                  },
                }}
              >
                {item.title}
              </Link>
            }
            position="bottom"
            sx={{
              fontFamily: 'AlbertSans',
              background: 'transparent',
              '& .MuiImageListItemBar-title': {
                marginBottom: '8px',
              },
            }}
          />
          <img
            srcSet={`${item.img}?w=600&fit=crop&auto=format&dpr=2 2x`}
            src={`${item.img}?w=600&fit=crop&auto=format`}
            alt={item.title}
            loading="lazy"
            style={{
              width: '100%',
              display: 'block',
              objectFit: 'cover',
              paddingTop: '12px',
            }}
          />
        </ImageListItem>
      ))}
    </ImageList>
  );
}

const itemData = [
  { img: '/grid/pl.jpg', title: 'THE PLATE', link: '/flower' },
  { img: '/grid/mun1.PNG', title: 'MUN', link: '/fog-film' },
  { img: '/grid/cel.jpg', title: 'THE CEILIENG', link: '/horse' },
  { img: '/grid/tt.jpg', title: 'FOG', link: '/home' },
  { img: '/grid/mun2.PNG', title: 'LIGMUNHT', link: '/blue-sky' },
  { img: '/grid/pap.jpg', title: 'GIRL IN THE GALLERY', link: '/mun' },
  { img: '/grid/noor.jpg', title: 'LIGHT', link: '/mun-2' },
  { img: '/grid/cit.jpg', title: 'SCENERY', link: '/jasmine' },
  { img: '/grid/mun3.PNG', title: 'MUN', link: '/jasmine' },
  { img: '/grid/red.gif', title: 'RED EYE', link: '/jasmine' },
  { img: '/grid/juice.jpg', title: 'POISONING', link: '/jasmine' },
  { img: '/grid/vans.jpg', title: 'VANS', link: '/jasmine' },
];