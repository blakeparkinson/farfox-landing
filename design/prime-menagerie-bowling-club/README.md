# Prime Menagerie Bowling Club crewneck

Created November 6, 2026 as a design concept. The artwork and mockup are saved locally; no storefront product was created or published.

## Deliverables

- crewneck-mockup.png — front/back forest-green crewneck concept. AI-generated apparel presentation, not a supplier proof.
- bowling-scene.png — selected six-character scene with dark chestnut Antelope, native 1536 × 1024 pixels with transparency.
- bowling-scene-v1.png — preserved first version before the Antelope color correction.
- back-artwork.png / back-artwork.svg — transparent 1800 × 1800 layout; cream lettering, scene, website. SVG lettering is outlined and illustration is embedded raster. PNG marked 150 ppi; the larger layout does not add native illustration detail.
- chest-badge.png / chest-badge.svg — 900 × 650 cream oval badge with existing PM elephant mark and bowling pins.
- back-artwork-proof.png / chest-badge-proof.png — exact design proofs on forest green.
- build-artwork.mjs — reproducible native layout using the existing Bricolage Grotesque ExtraBold font and elephant brand mark.

## Design

Forest green #294C3B, cream #F2E4C4. Small wearer-left chest badge; large scene across upper back. Title PRIME MENAGERIE, subtitle BOWLING CLUB, website primemenagerie.com. Small badge has PRIME MENAGERIE and BOWLING CLUB.

Characters: game-model moss elephant rolling a ball, smooth-headed black-eartipped Foxy celebrating, half-green/half-red Scan Yak sliding with green left leg and gray hooves, dark Antelope keeping score in cobalt scarf, Goose examining a pin, Slab Rat eating fries on the ball return.

## Generation mode and prompts

Scene, targeted character color edit, and apparel mockup used the built-in image_gen tool. No fallback CLI. Typography and badge layout were composed separately from existing brand assets with SVG.

### Scene prompt

Use case: illustration-story.
Create the main illustration for a Prime Menagerie Bowling Club crewneck sweatshirt. New composition; the attached images are CHARACTER IDENTITY AND ART STYLE REFERENCES, not compositions to copy.
Reference 1: the six established mascots and warm bold outlined illustration language.
Reference 2: PM elephant's video game character model; use the FULL BODY MOSS GREEN ELEPHANT in the center/right, not the flat head logo on the left.

Draw one wonderfully silly, cohesive bowling alley scene with exactly these SIX characters interacting in the SAME shared perspective and environment. They should look like a slightly dysfunctional local bowling team. Strong silhouettes, big readable faces, tactile warm colors, crisp dark navy outlines and controlled soft shading like the reference. Slight retro clubhouse character, detailed enough to reward looking, not crowded with decorative clutter.

Composition: landscape, roughly 3:2 aspect ratio, isolated vignette on genuinely transparent background, all characters and props fully inside safe margins. A honey-colored polished wooden bowling lane makes a strong diagonal from lower left toward upper right, with a small set of ivory pins at the far end. A low cream and muted burgundy ball-return console sits in the near right foreground and supports the rat. The lane and console physically connect the characters into one scene. No rectangular room backdrop; warm wood floor ends in a neat shaped vignette perimeter. Keep open transparent space around it. No title or lettering anywhere; typography will be added separately.

Six characters and actions:
1. At the near left approach, the large warm moss-green PM ELEPHANT gently rolls a small burgundy bowling ball with his curled trunk. Large sage P/M-shaped inner ear folds, navy happy closed crescent eyes, round barrel body, four pillar legs, cream toenails. Same model as the second reference, no tusks, no clothes, no hair.
2. Nearby FOXY prematurely celebrates with both brown paws in the air while looking down the lane. Orange fur, cream muzzle and belly, cream tail tip, pink heart-shaped cheeks, flat cream forehead teardrop. BOTH ear tips BLACK. Head contour perfectly smooth between the ears: absolutely NO tuft, spikes, bangs, or raised hair. Friendly full-body fox from the first reference.
3. SCAN YAK is the main visual joke: he slipped and is sliding toward the pins on his back/bottom, both legs up, arms out, delighted goofy toothy open grin. His entire viewer-left torso and LEFT LEG INCLUDING ANKLE are GREEN; viewer-right torso and other leg RED. Both hooves GRAY. Upper-right facial hair WHITE, viewer-left eye an X, right eye open, gray muzzle, ivory horns. Keep green and red halves very clear even in this seated sliding pose. Full body visible. No shoes.
4. Dark AFFIRMING ANTELOPE stands at the left sideline, holding a little scorecard and pencil, looking fondly concerned at Yak. Rich DARK chestnut/burnt brown fur (darker than the orange fox), cream muzzle, long navy horns, vivid cobalt-blue scarf.
5. White GOOSE at the far right end of the lane examines one stubborn upright bowling pin using his magnifying glass, bent down very seriously. Orange bill and feet, no clothes.
6. SLAB RAT lounges on top of the foreground ball-return console, eating fries from a little red paper carton, utterly unimpressed half-lidded eyes. Lavender-gray body, purple ears/nose/tail and bow tie.

No extra characters, no duplicate animals, no people, no speech bubbles, no text, no logos, no sparkles or yellow/orange triangular emphasis marks. No photorealism or 3D rendering. Do not add generic apparel or accessories to the animals beyond the scarf/bow tie/props described. Premium playful illustration, not a sticker collage. Make it feel like a single humorous moment we caught in progress.

### Antelope correction prompt

Use case: precise-object-edit. Edit this existing bowling club illustration with EXACTLY ONE change: the ANTELOPE standing at the far upper left holding the scorecard must have much DARKER chestnut-brown fur, deep warm brown like #6B3522 in the midtones with #432719 shadows, rather than bright orange. Darken the antelope's forehead, cheeks outside the cream muzzle, outer ears, neck, torso, arms, hands and legs consistently. He must clearly look brown, distinct from the orange fox beside him. Preserve his cream muzzle and belly, cream inner ears, navy horns, cobalt-blue scarf, clipboard, pencil and expression. Preserve the full composition and every other pixel as closely as possible: do NOT alter any other character, pose, outlines, facial features, colors, props, perspective, typography (there is none), or layout. Fox keeps his smooth head and black ear tips. Yak keeps green viewer-left torso AND leg/ankle and red viewer-right torso and leg, gray hooves, white right-side forehead. Keep genuinely transparent background and original proportions.

### Crewneck mockup prompt

Use case: product-mockup.
Create an excellent photorealistic apparel concept presentation: TWO views of the SAME washed FOREST GREEN heavyweight crewneck sweatshirt, FRONT on the left and BACK on the right, hanging side by side from simple natural wood hangers against a warm pale limestone studio wall. Wide landscape composition, both garments fully visible including cuffs and hems, no people. Soft daylight, gentle realistic shadows, premium cotton fleece with subtle garment wash, slightly boxy relaxed fit, dropped shoulders, substantial ribbed neck, cuffs and hem. Forest green close to #294C3B, neither olive nor teal. Crisp useful view of graphics, neutral lighting and very few folds across art. Both views approximately same size, back slightly more prominent. This is a product design concept photograph, not a poster or moodboard.

Input 1 is the EXACT BACK ARTWORK. Reproduce its lettering and all six illustrated characters faithfully as a LARGE centered upper-back print. Use the cream "PRIME MENAGERIE" title, cream "BOWLING CLUB" subtitle with small horizontal rules, the complete illustrated bowling scene, and cream lowercase "primemenagerie.com" underneath. All text must be spelled exactly as provided. Print occupies approximately 65% of the torso width and is positioned high on back, with clear space above ribbed hem. The green background in the reference is ONLY a proof background: do not print a green rectangular panel; the illustration and cream lettering sit directly on the sweatshirt fabric with transparent negative space. Don't simplify, crop, recompose or redraw the scene into new character designs. Show all SIX characters: moss-green full-body game elephant rolling ball, orange smooth-headed black-eartipped fox celebrating, half-green half-red yak sliding with left leg green and gray hooves, DARK chestnut antelope holding scorecard and wearing cobalt scarf, white goose examining bowling pin, purple-gray rat eating fries on ball return. Reference graphic is fixed.

Input 2 is the EXACT FRONT CHEST BADGE. Reproduce this oval cream Prime Menagerie Bowling Club badge, including elephant head and bowling pins, in a small approximately 3.5-inch-wide print on WEARER'S LEFT CHEST (viewer right). No graphic on center chest. The green reference background is not printed; the cream badge sits directly on fabric. Badge should look like a soft ink print, not a sewn on fabric patch. Keep its small text accurate: "PRIME MENAGERIE" above, "BOWLING CLUB" below.

Do not add labels, captions, floating graphics, other apparel, props, extra logos, watermarks, a title outside the garment or new text. Tasteful, believable commerce photography. Let the forest green fabric and big colorful back scene be the focus.


## Selected lane correction

The continuous-lane version is now current. See [lane-correction.md](lane-correction.md) for the edit prompts and selected artwork details. The previous scene and mockup are preserved under before-lane-fix/.
