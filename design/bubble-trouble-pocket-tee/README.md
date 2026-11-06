# Bubble Trouble pocket tee

Six-character bubble scene featuring the Prime Menagerie elephant in the approved Skyline game design. The viewer-left Scan Yak ankle is green; the opposite ankle is red. Both hooves remain gray. Foxy has black ear tips and no head tuft.

## Product

- Comfort Colors 6030 garment-dyed pocket tee (Printful catalog 593).
- White, Butter, Violet, True Navy; S, M, L, XL, 2XL; $34.
- Back: restored two-line “Prime Menagerie” heading in Bricolage Grotesque ExtraBold above the scene; moss on White, Butter, and Violet, pale mint on True Navy. No tagline or URL. The scene remains 1760 px wide within the 1800 × 2400 px / 150 ppi print area: 11.73 inches across.
- Pocket: elephant silhouette only; moss on White, Butter, and Violet, pale mint on True Navy. 450 × 300 px / 150 ppi print area.
- Scene is a 1536 × 1024 raster illustration. The print layout enlarges it slightly; export density does not imply additional native detail.
- All 20 variant combinations use the same scene with their appropriate heading and pocket colors.

## Store setup

Printful sync product: `490092600`. The original pocket artwork remains pinned to commit `0b719c72f8e0079a47abfc51bf883ee5e684fa8b`. The revised back artwork is pinned to commit `9c8d00d73e9a84b068180fabb0e4e22a6142df13`. The active backs are `back-light.png` and `back-dark.png`; `back.png` preserves the previous version without lettering. The heading restores the same typeface and proportions as the original Prime Menagerie tee, with outlined lettering for font-independent production files.

Store URL: https://lovefarfox.com/shop/prime-menagerie-bubble-trouble-pocket-tee/

## Sources and generation

`scene.png` is the corrected Bubble Trouble illustration. It was produced by editing the original scene with the built-in image generation tool. The original scene and its character references are preserved in the main workspace at `design/prime-menagerie-elephant-scene/`.

The pocket silhouette comes from `design/prime-menagerie-pocket-tee/sources/elephant.png`. `scripts/make-bubble-trouble-pocket-tee.mjs` composes the print areas as self-contained SVGs and renders provider PNGs. The SVGs contain raster artwork and are not fully vector illustrations.

`scripts/printful-bubble-trouble-2026-11.mjs` generates provider previews, publishes this one product, and validates each variant. It never places an order. Local release state is deliberately not committed.

## Green-leg correction prompt

Mode: edit; transparent background; one local reference, the original Bubble Trouble illustration.

```text
Make one small, precise color correction to the supplied Bubble Trouble illustration. Preserve the entire scene and every character exactly.
The Scan Yak is the green-and-red shaggy animal at lower LEFT. The short visible leg/ankle immediately above the GRAY HOOF at the FAR LEFT of the image is currently RED, but it must be GREEN to continue the green half of his body. Recolor ONLY that little red leg/ankle section between the shaggy green torso and the leftmost gray hoof to the same vivid green as his left body fur, with matching green cel shading. By "left" here, mean VIEWER-LEFT / IMAGE-LEFT, not the character's anatomical left. Leave the far-left gray hoof GRAY. Keep the OTHER leg on viewer-right RED with its gray hoof.
Do not alter the split half-green/half-red torso, white upper-right facial patch, X eye, grin, ivory horns or little bubble wand.
Preserve Foxy's black-tipped ears and smooth tuft-free head, the game's warm moss elephant with sage P/M ear folds and crescent eyes, the dark antelope's blue scarf, the goose and magnifier, Slab Rat inside the big bubble, every bubble and plant, the composition, colors, outlines, shading, resolution, aspect ratio and transparent background.
Add no title, text, labels or other changes. Output only the corrected image.
```
