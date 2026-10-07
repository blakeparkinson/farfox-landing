/**
 * The approved Foxy poses for print artwork (copied from the app's foxy-approved-* set, standardised
 * 2026-09-11). Every merch generator draws Foxy from here, never from the retired flat Foxy
 * (hearteyes-v2.png / foxy.png). Each master is 1254 px square with transparency.
 */
import sharp from 'sharp';

export const FOXY_POSES = ['head', 'headClosed', 'headSad', 'idle', 'letter'];
export const FOXY_MASTER = 1254;
const path = (pose) => new URL(`../public/brand/print/foxy-${pose}.png`, import.meta.url).pathname;

/** The pose trimmed to its artwork, as a PNG buffer (optionally resized to `width`). */
export async function foxyPng(pose, width) {
  let img = sharp(path(pose)).trim();
  if (width) img = img.resize({ width, kernel: 'lanczos3' });
  return img.png().toBuffer();
}

/** The pose as a data URI plus its trimmed aspect (height / width), for SVG <image> tags. */
export async function foxyImage(pose) {
  const buf = await foxyPng(pose);
  const { width, height } = await sharp(buf).metadata();
  return { href: `data:image/png;base64,${buf.toString('base64')}`, aspect: height / width, width };
}

/** An SVG <image> of the pose, `w` wide, centred on cx with its top at `top`. */
export const foxyTag = (art, cx, top, w, extra = '') => `<image href="${art.href}" x="${cx - w / 2}" y="${top}" width="${w}" height="${w * art.aspect}" ${extra}/>`;
