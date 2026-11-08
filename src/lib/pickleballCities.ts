import { productPath, type ShopProduct } from './productPages.ts';

const baseName = 'Prime Menagerie Pickleball Club Crewneck';
export const PICKLEBALL_CITIES = [
  { key: 'new-york', label: 'New York', name: baseName },
  { key: 'portland', label: 'Portland, Maine', name: `${baseName} — Portland, Maine` },
  { key: 'new-orleans', label: 'New Orleans', name: `${baseName} — New Orleans` },
  { key: 'livingston', label: 'Livingston, MT', name: `${baseName} — Livingston, Montana` },
] as const;

export const pickleballCity = (product: Pick<ShopProduct, 'name'>) => PICKLEBALL_CITIES.find(city => city.name === product.name);

export function pickleballCityOptions(product: ShopProduct, products: ShopProduct[]) {
  if (!pickleballCity(product)) return [];
  return PICKLEBALL_CITIES.flatMap(city => {
    const edition = products.find(p => p.name === city.name);
    return edition ? [{ ...city, product: edition, href: productPath(edition) }] : [];
  });
}

/** Every edition has its own print-provider product. Only carry available options between cities. */
export function citySelectionUrl(product: ShopProduct, selection: { color?: string; size?: string } = {}) {
  const color = product.colors?.find(c => c.name === selection.color) ?? product.colors?.[0];
  const sizes = color?.sizes ?? product.sizes ?? [];
  const size = selection.size && sizes.includes(selection.size) ? selection.size : sizes[0];
  const query = new URLSearchParams({ view: 'back' });
  if (color) query.set('color', color.name);
  if (size) query.set('size', size);
  return `${productPath(product)}?${query}`;
}

/** One club card in the shop; city editions remain available on their own product pages and feeds. */
export const showInShop = (product: ShopProduct) => {
  const city = pickleballCity(product);
  return !city || city.key === 'new-york';
};
