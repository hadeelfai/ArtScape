export const normalizeTagList = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags
      .map(tag => (typeof tag === 'string' ? tag.trim() : ''))
      .filter(Boolean);
  }
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  }
  return [];
};

export const TAG_GROUPS = [
  {
    title: 'Art & Illustration',
    tags: [
      'Paintings',
      'Abstract Art',
      'Digital Illustration',
      'Concept Art',
      'Mixed Media',
      'Graphic Design',
      'Illustration',
      'Character Design',
      'Branding',
      'Typography',
      'UI/UX Design',
      'Logo Design',
      'Visual Identity',
      'Watercolor',
      'Acrylic Painting'
    ]
  },
  {
    title: 'Photography',
    tags: [
      'Photography',
      'Portrait Photography',
      'Landscape Photography',
      'Street Photography',
      'Editorial Photography',
      'Fine Art Photography',
      'Black & White Photography',
      'Documentary Photography',
      'Macro Photography'
    ]
  },
  {
    title: 'Pottery & Sculpture',
    tags: [
      'Pottery',
      'Ceramic Sculpture',
      'Clay Modeling',
      'Wheel Throwing',
      'Handbuilt Ceramics',
      'Sculpture',
      'Stone Sculpture',
      'Metal Sculpture',
      'Glazing Techniques'
    ]
  }
];

export const CATEGORY_KEYWORDS = {
  Photography: [
    'photography',
    'portrait photography',
    'landscape photography',
    'street photography',
    'editorial photography',
    'fine art photography',
    'black & white photography',
    'documentary photography',
    'macro photography'
  ],
  'Graphic Design': [
    'graphic design',
    'branding',
    'typography',
    'ui/ux design',
    'logo design',
    'visual identity'
  ],
  Illustration: [
    'illustration',
    'concept art',
    'digital illustration',
    'character design',
    'mixed media'
  ],
  Paintings: [
    'paintings',
    'painting',
    'watercolor',
    'acrylic painting',
    'abstract art'
  ],
  Pottery: [
    'pottery',
    'ceramic sculpture',
    'clay modeling',
    'wheel throwing',
    'handbuilt ceramics',
    'sculpture',
    'stone sculpture',
    'metal sculpture'
  ]
};

