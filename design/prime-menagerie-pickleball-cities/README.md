# Pickleball city editions

Requested cities: Portland, Maine and New Orleans. New York remains the existing edition.

Artwork uses the built-in image generation/edit tool with transparent output. Full initial and cutout-refinement prompts are saved in `portland-prompts.txt` and `new-orleans-prompts.txt`. Final source images are `portland-scene.png` and `new-orleans-scene-v5.png`. The final New Orleans scene keeps the beignet-sugar joke, removes the joint and smoke, softens the rat’s eyes, fixes the bowtie and antelope hands, and follows the official court-line layout. The final v5 restores the full French Quarter architecture from the user reference, deepens Yak’s green and softens Rat’s expression. Its final prompt is `new-orleans-v5-prompt.txt`; preceding correction prompts are in `new-orleans-final-prompts.txt`; the earlier sugar edit is saved in `new-orleans-sugar-prompt.txt`. The original New Orleans scene is retained for history.

`scripts/make-pickleball-city-backs.mjs` composes native outlined typography around each source. Printer files are `public/shop/designs/pickleball-cities-2026-11/{portland,new-orleans}/back-{cream,forest}.png`: 2250 × 2700, 150 dpi, full 15-inch placement. The original Pickleball chest badges are retained.

Comfort Colors 1566; Blue Spruce, Pepper, True Navy and Butter; $59. Each city has its own provider product, selected through the storefront city picker so fulfillment uses that city's artwork.

Product IDs: New York 490239643 (existing), Portland 490719865, New Orleans 490719872. City navigation preserves available color and size choices and shows the selected scene on the back. One Pickleball Club card is listed in the main shop. City editions use their own product-page URLs for checkout price validation.

Court layout reference: https://usapickleball.org/construction/ — net midpoint, two seven-foot kitchens, service centerlines ending at the kitchen. A native diagram is saved as `court-reference.svg` and `court-reference.png`.
