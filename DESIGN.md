---
name: "World Travel Photobook Atlas"
description: "A hand-held Earth opens into curved glass albums and geographic photography."
colors:
  primary: "rgb(14% 83% 100%)"
  nebula-indigo: "rgb(5.5% 21% 80%)"
  space: "#000207"
  player-ivory: "#fff9ee"
  rim-ivory: "#fff5dc"
  editorial-ink: "#263c3c"
  editorial-ivory: "#f1e7d4"
  reader-canvas: "#efe2c8"
  reader-paper: "#f7eeda"
  reader-ink: "#263039"
  journey-gold: "#ffbf58"
typography:
  title:
    fontFamily: "Atlas Player Sans, Microsoft YaHei, sans-serif"
    fontSize: "calc(var(--book-width) * .071)"
    fontWeight: 550
    lineHeight: 1.16
    letterSpacing: ".035em"
  body:
    fontFamily: "Atlas Player Sans, Microsoft YaHei, sans-serif"
    fontSize: "calc(var(--book-width) * .041)"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: ".035em"
  label:
    fontFamily: "Atlas Player Sans, Microsoft YaHei, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: ".04em"
  editorial-title:
    fontFamily: "Baskerville, Georgia, Times New Roman, serif"
    fontSize: "calc(17px * var(--projection-unit,1))"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: ".205em"
  editorial-caption:
    fontFamily: "Baskerville, Georgia, Times New Roman, serif"
    fontSize: "calc(8.5px * var(--projection-unit,1))"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: ".12em"
  reader-title:
    fontFamily: "Songti SC, STSong, Noto Serif CJK SC, Georgia, serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.1
rounded:
  pill: "999px"
  photograph: "2px"
  photo-action: "3px"
  circle: "50%"
spacing:
  control-y: "8px"
  control-x: "13px"
  reader-y: "10px"
components:
  atlas-toggle:
    backgroundColor: "#03112666"
    textColor: "#edf2f4"
    rounded: "28px"
    padding: "9px 26px"
    typography: "400 14px/1.2 SimSun, serif"
  intro-replay:
    backgroundColor: "#07111b80"
    textColor: "#d2e6f6"
    rounded: "{rounded.pill}"
    padding: "8px 13px"
    typography: "11px/1.2 Atlas Player Sans, Microsoft YaHei, sans-serif"
  curved-player:
    backgroundColor: "rgb(203 197 177 / 3%)"
    textColor: "{colors.player-ivory}"
    padding: "calc(var(--book-width) * .068) calc(var(--book-width) * .088)"
    width: "236px"
    height: "138px"
  geographic-projection:
    backgroundColor: "transparent"
    textColor: "{colors.editorial-ink}"
    rounded: "{rounded.photograph}"
  reader-return:
    backgroundColor: "transparent"
    textColor: "{colors.reader-ink}"
    padding: "10px 0"
    typography: "600 10px/1 Atlas Player Sans, PingFang SC, Microsoft YaHei, sans-serif"
---

# Design System: World Travel Photobook Atlas

## Overview

**Creative North Star: "The Hand-held Travel Cosmos"**

A miniature geographic Earth is the centre of this world. A human hand introduces its scale, while a broad, softly turbulent cyan and indigo nebula gives the surrounding space volume. Continents, oceans, clouds and city lights remain legible throughout the opening and album modes. The background is almost black, with a restrained NASA star catalogue image rather than a dense field of decorative particles.

Albums float as transparent, bowed players around Earth. Their warm ivory lettering and fine controls feel delicate against the cold space. Hovering reveals an editorial photograph with a small transparent geographic layer; entering an album carries that same destination into a golden flight and a tangible, opening book. The photographs and existing readers remain the content authority.

**Key Characteristics:**

- Geographic Earth, human scale and spacious deep black.
- Soft cyan nebula volume with sparse, distant stars.
- Three orbital tiers of continuously curved, warm glass players.
- Unfiltered photography with restrained real geography and serif annotation.
- Live cinematic transitions into the selected original photobook.

## Colors

Cold atmospheric light surrounds warm, readable album details; photographs retain their own colour.

### Primary

- **Nebula Cyan** (`primary`): the luminous end of the nebula's colour mixture, used as spatial light.
- **Orbital Indigo** (`nebula-indigo`): the deeper gas colour that gives the cyan volume a shadowed body.

### Secondary

- **Journey Gold** (`journey-gold`): the warm flight plume and its glow, followed by the book's gilded material.

### Neutral

- **Deep Space** (`space`): the uninterrupted stage behind Earth, satellites and albums.
- **Player Ivory** (`player-ivory`) and **Rim Ivory** (`rim-ivory`): readable player content and a warm highlight within the continuous glass rim.
- **Editorial Ink** (`editorial-ink`) and **Editorial Ivory** (`editorial-ivory`): quiet annotation colours selected to suit the photograph's negative space.
- **Reader Canvas**, **Reader Paper** and **Reader Ink**: the warm reading layer and its restrained return bar.

**The Light Has a Place Rule.** Cyan belongs to the surrounding atmosphere and nebula; the central body remains geographic Earth in every scene mode.

## Typography

**Player Font:** locally bundled Manrope, exposed as Atlas Player Sans, with Microsoft YaHei and sans-serif fallbacks. It is the closest available reference match, not an identified copy of the reference font.

**Photographic Annotation Font:** Baskerville with Georgia and Times New Roman fallbacks. **Reader Title Font:** the existing Songti-oriented serif stack.

**Character:** clean, measured player lettering supports precise controls; widely spaced serif annotation gives photographic previews the feel of a travel print. There is no large visible promotional headline over the cosmos.

### Hierarchy

- **Title:** medium player headings scale with player width; the single-line Chinese title leads the smaller English destination label.
- **Body:** the English player label uses the same sans-serif family at a quieter weight and proportion.
- **Label:** the bottom interaction hint uses small, softly spaced sans-serif text; numerals inside players use tabular spacing.
- **Editorial title and caption:** regular serif annotation scales with the photograph. The approximate-area line is italic and subordinate.
- **Reader title:** the existing compact serif title sits at the centre of the reading header.

**The Surface Carries Type Rule.** Player titles, progress lines and controls bend with the glass surface; text must not float on an independent flat rectangle.

## Layout

The atlas occupies one viewport with a fixed scene and no page scroll. Earth anchors one perspective space. Ten albums occupy three staggered orbital tiers, with front and back placement, scale and occlusion derived from the same observer. At the desktop reference scale, a player is (236 × 138px); it scales with the viewport rather than defining a card grid.

The mode switch sits in the upper right, the opening replay in the upper left, the interaction hint near the bottom centre, and discreet source links along the lower edge. A photographic projection floats above Earth and preserves the source aspect ratio. Its desktop width is bounded by the viewport, photograph ratio and a (680px) maximum; the enlarged view is bounded by (1200px), (85vw) and available height.

At the mobile breakpoint (720px), players use a smaller (86 × 57px) base, orbital tiers compress, and captions and controls scale with their surfaces. Hints wrap within the viewport. The reader uses a (54px) header above the existing embedded album. These are the implemented responsive behaviours, not a separate mobile dashboard.

## Elevation & Depth

Depth comes primarily from perspective, orbital occlusion, transparent material and the curved player silhouette. Glass has a soft blur (5px) and very light neutral tint; one continuous rim encloses each player. The nebula is a single irregular gaseous band with overlapping density, rather than several parallel stroked rings. The star image remains subdued, at (.27) opacity in planet mode and (.36) in album mode.

### Shadow Vocabulary

- **Player ambient shadow:** `0 8px 14px rgb(0 0 0 / 28%)`, applied to the continuous glass outline.
- **Player focus glow:** a small ivory glow plus the same ambient shadow, identifying keyboard focus without covering the content.
- **Photographic lift:** `0 16px 48px #0008`, separating the photograph from space without colouring the photograph itself.
- **Reading-bar shadow:** none; warm surfaces and a fine lower divider separate the reader header.

**The Single Rim Rule.** The player has one uninterrupted glass boundary. Its projected content strips have no individual borders, fills or shadows.

## Shapes

The signature shape is a visibly bowed section of a cylinder, including both long edges and its internal content. The implementation projects (31) borderless content strips onto the same surface as the continuous glass rim. The small corners soften the silhouette without turning it into a capsule.

Supporting shapes are simple: pill-shaped replay and mode controls, a circular ivory read symbol, an almost square photographic edge, and a transparent circular Earth drag target. The physical book has a thick cover, visible page blocks and four principal curved folios that open into a tilted V.

## Components

### Mode and replay controls

Quiet controls sit at the edges of the experience. The mode switch uses a translucent dark fill, fine blue border and compact serif label; hover and expanded states brighten its fill and border. Replay uses a smaller sans-serif pill, with a brighter hover state and an offset cyan focus outline. The opening temporarily hides both controls while the hand sequence runs.

### Curved album player

A complete album is one native button with one accessible name. Warm ivory titles, a fine progress line, page count and player-style symbols follow the bowed surface. The central ivory circle carries the read symbol. The small heart, bookmark and transport symbols form the visual player anatomy; they are not separate controls. Hover or keyboard focus pauses the orbit and previews that album, with a slightly stronger continuous rim. Activating the player begins its journey.

### Geographic photographic projection

The source photograph stays unfiltered, unwarped and fully contained in its original aspect ratio. A separate transparent real-data map occupies the photograph's negative space, within the confirmed (15–25%) footprint; the current ten overlays range from (18.7–23.5%). Serif title, place and approximate-area annotation remain compact, and attribution stays along the bottom. The small expand control appears on hover or focus and opens an enlarged version of the same composition. Map markers describe an approximate area, not exact photograph GPS.

### Opening and book journey

The four-second opening moves from black to fist, unfurling palm, geographic Earth and small satellites, then lets the hand leave. The Earth never changes into a cratered moon, energy sphere or vortex. The live eight-second album journey carries a warm luminous trail through space, a complete atmospheric horizon and clouds, into the selected destination's photographic plate. A thick gilded book materializes, decelerates and opens before its original reader appears. The destination plate is a cinematic use of the selected photograph, not a claim of an aerial camera approach.

Escape cancels the active journey and returns focus to its album. Reduced motion skips the hand sequence, holds the ambient motion still and replaces the journey with a short (220ms) transition. The experience runs in the page; it is not an MP4 playback.

### Reader return

A restrained warm header introduces the preserved reader. Its transparent return button sits on the left; the selected book title and English label remain centred. Returning restores the album orbit and focuses the album that was read. Escape is also available from the reading layer when keyboard focus belongs to the parent page.

## Do's and Don'ts

### Do:

- Do keep geographic Earth visible as Earth throughout the hand opening and album modes.
- Do use one soft, irregular cyan and indigo nebula volume with restrained star brightness.
- Do bend the entire player surface, including its type and progress line, inside one continuous rim.
- Do preserve photograph colour, aspect ratio and original reader content.
- Do keep real geographic overlays in negative space within the confirmed 15–25% footprint and label approximate areas honestly.
- Do preserve Escape, keyboard focus and the 220ms reduced-motion journey alternative.

### Don't:

- Don't substitute a cratered moon, blue energy ball or central vortex for Earth.
- Don't replace the nebula with parallel ellipse strokes or separate luminous rails.
- Don't give each projected content strip its own glass border or treat the player symbols as independent working buttons.
- Don't tint, blur or stretch the original photograph to create the editorial map treatment.
- Don't claim the closest available font is identical to the reference font, or that a photographic destination plate is a true aerial approach.
