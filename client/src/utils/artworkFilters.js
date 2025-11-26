export const CATEGORY_TABS = ['For You', 'Photography', 'Graphic Design', 'Illustration', 'Paintings', 'Pottery'];
const parseSizeValue = (dimensions) => {
  if (!dimensions) return null;
  const cleaned = dimensions.replace(/[^0-9x×\s.]/gi, '').toLowerCase();
  const parts = cleaned.split(/[x×]/).map(part => parseFloat(part.trim()));
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
  return parts[0] * parts[1];
};

export const matchesSize = (art, sizeFilter) => {
  if (sizeFilter === 'any') return true;
  const area = parseSizeValue(art.dimensions);
  if (area == null) return true;
  if (sizeFilter === 'small') return area < 2000;
  if (sizeFilter === 'medium') return area >= 2000 && area < 5000;
  if (sizeFilter === 'large') return area >= 5000;
  return true;
};

export const matchesColor = (art, colorFilter) => {
  if (colorFilter === 'any') return true;
  const tags = (art.tags || '').toLowerCase();
  return tags.includes(colorFilter);
};

export const matchesArtType = (art, artTypeFilter) => {
  if (artTypeFilter === 'any') return true;
  const tags = (art.tags || '').toLowerCase();
  return tags.includes(artTypeFilter);
};

export const matchesCategory = (art, category) => {
  if (!category || category === 'For You') return true;
  const target = category.toLowerCase();
  const tags = (art.tags || '').toLowerCase();
  return tags.includes(target);
};
