# Where the lid departs from the mockup

The home page began as a port of `01-first-screen.html`. Since round 2 ("Round 2: a proper site",
at the end) the lid is no longer laid out as the mockup is, and the comparison with it guards how
each sticker is drawn, not where it is stuck. At the mockup's own width of 728px, with the lid
dressed as the mockup, the two differ in 1.63% of the pixels compared (`e2e/lid-visual.spec.ts`
measures it on every run and fails above 2.7%). The pixels that differ are the ones listed here.

Sizes are in design units unless they say px. One unit is 1px when an artboard is shown at its own
width (1100 for the wide arrangement, 728 for the desktop one, 390 for the phone one), and ten
units are 1em.

## The five requested departures

### 1. Width cap and centring

Superseded in round 2: the lid now runs edge to edge at every width, with no desk and no corners.
See "Round 2: a proper site" at the end. What this departure was:

|               | Mockup                                    | Lid                                                         |
| ------------- | ----------------------------------------- | ----------------------------------------------------------- |
| Lid width     | Always the full window                    | The full window up to 1001px (728 × 1.375), then fixed      |
| At 1280 wide  | 1280 × 2286px, more than three screens    | 1001 × 1788px, centred, with 139px of desk either side      |
| Around it     | Nothing: the page is the lid              | An ink desk, and up to 32px above and below once it is capped |
| Below 1001    | Edge to edge                              | Edge to edge, unchanged                                     |

The breakpoint, both artboard sizes and the 1.375 are in `src/features/lid/placement/artboards.ts`.

### 2. Phone: no text under 11px at 360 wide

The mockup's smallest label was 6.5px at 390 wide (6.0px at 360). The lid's smallest is 11.06px
at 360. The phone artboard grew from 1870 to 2128 units to make room.

Type set in em, phone arrangement only:

| Label                               | Mockup | Lid   |
| ----------------------------------- | ------ | ----- |
| Asset tag, "The serious version"    | 1.06em | 1.2em |
| Badge, "Hacker / Organizer / Speaker" | 1.08em | 1.2em |
| Bumper, "a real workshop…"          | 1.15em | 1.2em |
| Pleb FM, the two small lines        | 1.12em | 1.2em |
| bitcoin++ record, the three lines   | 1.12em | 1.2em |
| Saved spot, "AI Hack for Freedom IV, upcoming" | 1.1em | 1.2em |

Five stickers were widened: the four drawings because their lettering scales with their width,
and the bitcoin++ record so that its larger type still fits on its lines.

| Sticker          | Mockup (x, y, width) | Lid (x, y, width) | Smallest label at 360 |
| ---------------- | -------------------- | ----------------- | --------------------- |
| Wins seal        | −8, 500, 154         | −12, 498, 160     | 10.7px → 11.1px       |
| Organized seal   | −14, 652, 162        | −18, 652, 166     | 10.8px → 11.1px       |
| Last Pay Wins    | 198, 1304, 188       | 196, 1536, 192    | 10.8px → 11.1px       |
| bitcoin++ record | 254, 1598, 126       | 236, 1214, 138    | 10.3px → 11.1px       |
| Lightning Welder | 262, 1004, 124       | 2, 1172, 196      | 6.0px → 11.1px        |

The hex badge could not reach 11px by width alone, so its drawing changed too, on both
arrangements: the foot line ("BTC++ BERLIN ’24") went from 9.5 to 11 units, the four lines of
lettering moved up 6 units and the bolt is a tenth smaller, so the larger line still sits inside
the keyline. On the desktop the badge keeps its place and size.

A hex badge 196 wide no longer fits beside the foil win, so the lower half of the phone
arrangement was re-flowed. The pairings are the mockup's (crab with the button, parking sign with
Pleb FM), in the mockup's order. The positions in this section are those of the port. The additions
have since moved everything from the foil win down by 46 to 60 units: "Additions since the mockup"
gives where each sticker is now.

| Sticker                      | Mockup (x, y)                         | Lid (x, y)                               |
| ---------------------------- | ------------------------------------- | ---------------------------------------- |
| Second lightning bolt        | hidden                                | 306, 1040 (fills the gap the hex left)   |
| Lightning Welder, bitcoin++  | beside the foil win; bottom right     | a row of their own at 1172               |
| Bumper                       | 12, 1186                              | 12, 1416                                 |
| Crab                         | −2, 1290                              | −2, 1522                                 |
| Parking sign                 | 18, 1474                              | 18, 1708                                 |
| Pleb FM                      | 142, 1504                             | 142, 1738                                |
| Saved spot                   | 38, 1624                              | 10, 1858                                 |
| Toronto, Berlin, Austin      | a row at 1136 to 1146                 | stacked beside the saved spot, from 1862 |
| "Bitcoin & freedom tech"     | 14, 1722                              | 14, 1978                                 |
| Wristbands                   | 1768 and 1814                         | 2026 and 2072                            |

Everything from the name down to the foil win is where the mockup had it.

### 3. Contrast

| Lettering                         | Mockup                           | Lid                                  |
| --------------------------------- | -------------------------------- | ------------------------------------ |
| "HELLO I’m a" on tangerine        | white, 2.9:1                     | ink, 6.4:1                           |
| "8×" on the wins seal             | white with an ink shadow, 2.9:1  | ink with a white shadow, 6.4:1       |
| "++" on the bitcoin++ record      | white with an ink shadow, 2.9:1  | ink with a white shadow, 6.4:1       |
| Lanyard lettering on bubblegum    | white, 3.0:1                     | ink, 6.0:1                           |
| "real title" on the white card    | bubblegum `#ff4fa3`, 3.0:1       | the strap-edge pink `#c81f78`, 5.3:1 |

No colour was added: `#c81f78` is the mockup's own lanyard edge. `src/features/lid/contrast.test.ts`
checks every pairing of lettering and vinyl on the lid.

### 4. Semantics

| Part                 | Mockup                                              | Lid                                                                    |
| -------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| Heading              | None. The name was a link to `#top`                 | One `h1`: the name, not a link                                          |
| Landmarks            | Two `nav`s for the wristbands, one for the ribbons  | `main` around the lid, and the same three `nav`s                        |
| Groups               | Loose elements                                      | Lists: the eight city pills, the four project stickers, the ribbons, each wristband's links, the badge's roles |
| Order in the markup  | Drawing order (badge last)                          | Reading order: name, badge and ribbons, intro, content, contact links   |
| Photo                | `alt` present                                       | The same `alt`                                                          |
| Drawings             | Mostly hidden; the tally was announced as an image  | All hidden, the tally included: the count is already stated twice       |
| "real title"         | Hidden from screen readers                          | Still hidden as a scrawl, but the title is read as "Minister of Development (real title)" |
| Focus                | Yellow outline                                      | Yellow outline with an ink edge on both sides. Wristband links take an ink outline |
| Keyboard             | Hover effects on hover only                         | Lift, corner peel, arrow nudge and ribbon slide on keyboard focus too   |
| Touch targets        | "X" was 12 × 22px                                   | Every link at least 24 × 24px at 360 wide ("X" is 27 × 29px)            |

### 5. Arrows and stars are drawn

None of the mockup's three typefaces has `→`, `↓` or `✦`, so each came from whichever system
font the browser found (on this Mac: SF, Lucida Grande and Zapf Dingbats).

| Glyph                          | Mockup            | Lid                                          |
| ------------------------------ | ----------------- | -------------------------------------------- |
| `→` on the asset tag           | typed             | inline SVG                                   |
| `↓` after "real title"         | typed             | inline SVG                                   |
| `✦` between wristband links    | typed             | inline SVG                                   |
| `✦` along the lanyard          | typed in a `textPath` | the same drawn star, set as an SVG marker on a line that rides the strap (see below) |
| `✦` around the organized seal  | typed in a `textPath` | SVG paths. Each phrase has its own arc, measured from the mockup |

`×` and `·` are in the typefaces and are still typed.

The straps are SVG again, as in the mockup, so that the badge's physics can bend and stretch them:
each is a line with a wide stroke drawn twice (the darker edge, then the face), its words set
along it in `textPath`s, and its stars drawn by a marker at each corner of a second line that the
script moves along the strap with it. A marker is the drawn star, not a glyph, so no typeface needs
`✦`. At rest the line is straight, from the mockup's own points, and the words and stars sit where
the HTML bands had them, to within a px or two (the lid's comparison with the mockup passes).
Each word is given its length from a table of the label face's widths
(`src/features/stickers/geometry/labelFace.ts`, checked against the browser in
`e2e/badge.spec.ts`), because a word on a path must be placed before the browser lays it out.

## What else differs, and why

- **The name's typeface is the one the mockup rendered, not the one its CSS names.** The mockup
  asks for Bowlby One on the name, but in Chromium the rule (`.name svg text`) does not reach text
  drawn through `<use>`, so the name appears in Bricolage Grotesque Regular with a heavy ink edge.
  The reference screenshots show exactly that, and the lid sets that face outright, so it is the
  same in every browser. If the mockup was approved in a browser that did apply Bowlby One, the
  line to change is `.letters` in `src/features/stickers/DieCutText.module.css`.
- **The peeling corners are cut, with no folded flap.** The mockup's CSS draws a silver flap in
  each peeled corner, but the custom property that sizes it is registered as non-inheriting, so
  the flap has zero size and is never drawn. The lid matches the render: the corner is cut, and
  the cut grows on hover and on focus.
- **The photo is the same crop, sharper.** The mockup carried a 300px JPEG. The lid cuts the same
  rectangle from `src/assets/alex-lewin.png` through Astro's image pipeline (AVIF 9 to 21 kB, WebP
  16 to 36 kB) and tints it with the same SVG filter and halftone.
- **The sixteenth tally mark is full height.** The marks are generated from the count. The first
  fifteen are the mockup's strokes exactly; the mockup's last one was 6 units shorter.
- **Links.** The mockup's count stickers and ribbons pointed at anchors on a page that did not
  exist. They went to `/cv/#organized`, `#wins`, `#talks` and `#projects`; since round 2 they go to
  the sections of the home page itself. Project and contact stickers open in the same tab, as
  links on the CV do. The mockup opened them in a new one.
- **Rounded corners showed the desk.** Until round 2 the four 12px corners of the lid were ink
  where the mockup's were white. The lid has no corners now.
- **The mockup's script was not ported: it was rebuilt.** The foil that follows the pointer and the
  peel-and-restick dragging are now part of a larger interaction layer, described at the end under
  "The interaction layer". The light rests where the mockup's script started it (0.35 across, 0.3
  down). The grab cursor and the ban on selecting text apply only once the page's script is running.

## Kept as it was, but worth a look

- "real title ↓" sat over the last two letters of "LEWIN" on the badge, as in the mockup, until
  round 3, when it was taken off (see "The badge's scrawl is gone" below).

## Additions since the mockup

Three things were stuck on after the mockup was approved, and a ninth win was added to the record.
None of this is in `01-first-screen.html`, so none of it can be checked against it. After those came
the script that makes the lid move, with two buttons of its own: it is the last part of this
section, "The interaction layer".

### What was added

| Addition | What it is | Desktop (x, y, width) | Phone (x, y, width) | Leads to |
| -------- | ---------- | --------------------- | ------------------- | -------- |
| Compliance label (`patents`) | A small silver label of the kind stuck under every laptop: `U.S. PAT. NOS. 12,354,083 · 12,536,579` and, only while a filing is pending, `OTHER PATENTS PENDING` | 238, 957, 150 | 64, 2094, 262 | `/cv/#patents` |
| Fifth ribbon | `INVENTOR`, cut from white, with no count | under `BUILDER` | under `BUILDER` | `/cv/#patents` |
| NCR medal (`ncr-win`) | A round highlighter medal: `1ST`, `OF 300+ TEAMS`, and round the rim `NCR GLOBAL HACKATHON 2021` and `TEAM ETH HEADS` | 532, 0, 112 | 244, 1106, 140 | `/cv/#wins` |
| Ninth win | The wins seal reads `9×` and the `WINNER` ribbon `×9`, where the mockup has 8 | | | |

Each is built from what the lid already had:

- **The compliance label** is the asset tag's sibling. Both are cut from the same brushed metal,
  which moved to `src/features/stickers/metal.module.css` so that they share it, with the same white
  edge and ink keyline a size down. It has no barcode and no arrow: it is small print and nothing
  else. The patent numbers are read from `src/content/patents.ts`: granted patents the owner has
  chosen to show, lowest number first. An application's number is never printed, and the pending
  line appears only while `stats.patents.anyPending` is true. On the desktop the label breaks into
  three lines, and on the phone into two.
- **The fifth ribbon** is one more entry in the badge's list of ribbons. White is the one vinyl
  colour the other four had not used. It leans as the first ribbon does and is tucked under the
  fourth.
- **The medal** is the round seal's smaller sibling: lettering on a rim path with a drawn star in
  each gap, as on the organized seal, and the stitched ring of the wins seal. Its numbers are in
  `src/features/stickers/geometry/medal.ts`. On the desktop it sits in the V of the lanyard, where
  the lid was bare, on the layer above the straps like every other sticker. Everything it says
  comes from the win's record: the place, the size of the field, the event, the year and the team.

Smallest lettering, in px:

|                         | 360 wide (phone) | 728 wide | 1001 wide and over |
| ----------------------- | ---------------- | -------- | ------------------ |
| Compliance label        | 11.1             | 10.6     | 14.6               |
| Medal, rim and lines    | 11.6             | 10.1     | 13.9               |

The label is set at 1.06em on the desktop and 1.2em on the phone, like the asset tag's small line.
The medal's 10.1px at 728 wide is above the hex badge's foot line, which is 9.5px there.

### What moved to make room

On the desktop the fifth ribbon hangs 35 units lower than the fourth and would have covered the
tops of three city pills. They moved down. Nothing else on the desktop moved.

| Pill    | Mockup (x, y) | Lid (x, y) |
| ------- | ------------- | ---------- |
| Berlin  | 476, 800      | 402, 818   |
| Toronto | 556, 788      | 556, 816   |
| Austin  | 644, 806      | 644, 822   |

Berlin also moved left, into the gap beside the Last Pay Wins button, whose rim it would otherwise
have sat on.

On the phone the artboard grew from 2128 to 2256 units. Everything from the name down to the five
city pills on the left is where it was. Below that:

| Sticker                 | Before (x, y)        | Now (x, y)           | Why                                     |
| ----------------------- | -------------------- | -------------------- | --------------------------------------- |
| Foil win                | 8, 1014              | 8, 1060              | clears the fifth ribbon                 |
| Medal                   | not there            | 244, 1106            | beside the foil win, a layer below it   |
| Second lightning bolt   | 306, 1040 (56 wide)  | 194, 1190 (52 wide)  | the medal took its place                |
| Lightning Welder        | 2, 1172              | 2, 1232              | moved down 60                           |
| bitcoin++ record        | 236, 1214            | 236, 1274            | moved down 60                           |
| Bumper                  | 12, 1416             | 12, 1476             | moved down 60                           |
| Crab                    | −2, 1522             | −2, 1582             | moved down 60                           |
| Last Pay Wins           | 196, 1536            | 196, 1596            | moved down 60                           |
| Parking sign            | 18, 1708             | 18, 1768             | moved down 60                           |
| Pleb FM                 | 142, 1738            | 142, 1798            | moved down 60                           |
| Saved spot              | 10, 1858             | 10, 1918             | moved down 60                           |
| Toronto, Berlin, Austin | from 1862            | from 1922            | moved down 60                           |
| "Bitcoin & freedom tech" | 14, 1978            | 14, 2038             | moved down 60                           |
| Compliance label        | not there            | 64, 2094             | a row of its own above the wristbands   |
| Wristbands              | 2026 and 2072        | 2154 and 2200        | moved down 128                          |

### Nothing is covered

- No addition covers a link. `e2e/lid.spec.ts` probes each of the three on a grid of points at
  1280, 728 and 390 wide and fails if any other link lies under one. The compliance label is on a
  layer below the bumper and Pleb FM, and on the phone the medal is on a layer below the foil win.
- Every link's centre still hit-tests to itself at all three widths, the new ones included.
- The badge's clip is drawn in a box as wide as the badge and as tall as the straps above it. That
  box took the clicks meant for the medal, so the drawing no longer takes clicks
  (`svg.clip` in `src/features/badge/Badge.module.css`). It looks the same.

### What the comparison with the mockup leaves out

A picture that predates the additions cannot match them. `e2e/lid-visual.spec.ts` leaves their
places out of the comparison instead of allowing more difference. A left-out pixel is not compared,
counts in neither the difference nor the total it is a share of, and is painted blue on
`design/screenshots/lid-728-difference.png`. The places are found on the page by what they are,
never by coordinates, and the test fails if one of them is missing:

| Left out                                         | Where it is found                                      |
| ------------------------------------------------ | ------------------------------------------------------ |
| The medal and the compliance label               | The box of each sticker on the lid                     |
| The fifth ribbon                                 | The box of the ribbon that leads to `/cv/#patents`     |
| The three moved pills, where the lid has them    | The box of each pill on the lid                        |
| The three moved pills, where the mockup has them | The box of each pill on the mockup, found by its text  |
| The changed count on the wins seal               | The box of the seal's figure                           |
| The changed count on the `WINNER` ribbon         | The box of the ribbon's count                          |

Each sticker's box is grown by 3px above, 6px either side and 12px below, which is where its shadow
falls. The two counts are grown by 2px.

|                                    | Before the additions | With the first three     | With the two buttons     |
| ---------------------------------- | -------------------- | ------------------------ | ------------------------ |
| Share of the page compared         | 100%                 | 92.1%                    | 91.1%                    |
| Difference, of what is compared    | 1.95%                | 1.64%                    | 1.66%                    |
| Tolerance                          | 3%                   | 2.7%                     | 2.7%                     |
| Limit on what may be left out      | none needed          | 9% (7.9% is left out)    | 9% (8.9% is left out)    |
| Limit for a sticker that must match | 0.1% of the page    | 0.1% of the page         | 0.1% of the page         |

The last column is the lid with its script running, which shows two buttons the mockup does not
have (see "The interaction layer"). Their places are left out as the other additions' are. No limit
moved. The difference went from 1.64% to 1.66% because the same differing pixels are now a share of
a slightly smaller area. The left-out share is within a tenth of a point of its limit: one more
sticker will not fit under it.

The tolerance came down, not up. The seal's figure was already a recorded departure (ink where the
mockup has white), so leaving its place out took 0.3 points of known difference out of the
measurement, and the tolerance followed it down. The room between what is measured and what is
allowed is one point, as it was. Every sticker that had to match the mockup before still has to,
to the same 0.1%. The three pills that moved are the exception: both of their places are left out.

### The interaction layer

The home page now loads one script, `src/features/lid/enhance/lid.client.ts`: plain TypeScript
modules, no framework and no library, 9.5 kB gzipped against a budget of 12 kB that
`tests/build/dist.test.ts` enforces. `/cv/` loads none. None of this is in the mockup beyond the two
ideas its own script had: foil that follows the pointer, and stickers that can be dragged.

#### Without the script

The lid is what it was. With JavaScript disabled the page was compared once, by hand, with the
commit before this work: at 1280, 728 and 390 wide not one pixel differs. On every run
`e2e/lid.spec.ts` compares the page with the script to the page without it and fails if any pixel
outside the two buttons differs by more than the comparison's threshold (32 levels in a channel).
Three things changed in the markup, and none of them shows:

- **Seven stickers have a note under them**, so each is now a `div` holding its link, a hidden
  button and the note, where it used to be the link itself. They are the three wins (Stringer
  Safety, the NCR medal, Lightning Welder) and the four projects.
- **The notes are in the page from the start.** Without the script a note is tucked away: it takes
  no room and shows nothing, a screen reader reads it, and it slides out below its sticker when the
  Tab key reaches one of its links. It is not laid out for print. Every fact in a note is also in
  the CV, which prints the same records in full: `tests/build/dist.test.ts` checks that each
  description appears there word for word.
- **Three stickers are buttons**, hidden until the script shows them.

#### What the script adds

| Behaviour | What it does | Where it is decided |
| --------- | ------------ | ------------------- |
| One lamp | The script writes two custom properties on the lid, `--lamp-x` and `--lamp-y`, and nothing else on the lid. Every sticker's shadow falls away from the lamp and lengthens with distance, the silver flap of a peeling corner catches it, and the foil turns with it. The pointer moves the lamp. With no pointer it drifts. | `lightMath.ts`, `lightLoop.ts`, `lightDom.ts`, and the stylesheets of the stickers |
| Tilt | On a touch screen that reports its orientation, a "TILT ME" sticker asks for motion and then a tilted phone moves the same lamp. | `tilt.ts`, `tiltDom.ts` |
| Pick up, throw, re-stick | With a mouse or a pen a sticker can be picked up. It hangs from where it was pinched, swings as it is carried, keeps half its speed when let go, bounces off the lid's edges and sticks with a squash. "TIDY THE LID" puts everything back. | `dragMachine.ts`, `dragDom.ts`, `resetControl.ts` |
| Peel to reveal | Each of the seven stickers peels back to show the note under it: by its corner (a button), by dragging the corner past halfway, or with the arrow keys on the corner. One is open at a time. | `peelMachine.ts`, `peelDom.ts`, `src/features/lid/notes.ts` |
| Sound | A speaker sticker turns on three synthesised sounds: a crackle for a peel, a slap for a drop, a tick for the badge's ribbons. Off until asked. | `sound.ts`, `soundDom.ts`, `preference.ts` |

#### The light

- **Shadows** were `0 0.5em 0.5em` and are now `var(--cast-x) var(--cast-y) 0.5em`. At rest that is
  the same shadow. With the lamp in a corner the shadow reaches 1.2em to the side.
- **The peeling corners have their flap.** The mockup's CSS drew a silver flap in each peeled corner
  and a mistake in it kept the flap from ever showing (see "What else differs"). It is drawn now, on
  the hello tag, the bumper and the foil win, but only while the corner is lifting under the pointer
  or the keyboard, and only with the script running: at rest the corner is the plain cut it was.
- **The SVG foil is the one exception to "two properties".** The gradient of the name and the hex
  badge, and the name's hot spot, are SVG attributes, which a stylesheet cannot set in every
  browser. The script writes those three attributes from the same lamp.
- **Only what is on screen is lit.** A sticker follows the lamp while it carries `data-lit`, which
  an IntersectionObserver sets. Off-screen stickers keep the resting light and do not repaint.
- **The drift is slow and cheap.** The lamp wanders 0.15 either side of its resting place over 47
  and 61 seconds. It takes one frame every 200ms, not sixty a second.
- **When it stops.** The loop asks for no frame once the lamp has settled on the pointer, none
  while the lid is off screen, and it is never started under reduced motion.

#### The three buttons

| Sticker | What it is | Desktop (x, y, width) | Phone (x, y, width) |
| ------- | ---------- | --------------------- | ------------------- |
| `sound` | A round ink speaker: a cross when sound is off, waves when it is on | 470, 108, 46 | 336, 1052, 46 |
| `tidy` | A small white label, `TIDY THE LID` | 14, 806, 66 | 16, 1010, 66 |
| `tilt` | A small highlighter label, `TILT ME`. Touch screens with an orientation sensor only | 478, 196, 58 | 330, 3, 54 |

Each sits where the lid was bare and covers no link, which `e2e/lid.spec.ts` and
`e2e/lid-interactions.spec.ts` probe on a grid of points. They are last in the markup, so the Tab
key reaches them after everything there is to read. Their smallest lettering is 11.1px at 360 wide.

#### Peeling, and what a note says

A peeled sticker swings up from the lid about its top left corner, its bottom right corner coming
towards you, and stays a link. The note lies where it lifted from: the name of the thing, what it
is, the result with the event and the year, the size of the field or the first week's takings where
the record has them, and the record's links. A project that never competed (Clawthing Store) has
no result or year to give. A note that would hang over the lid's edge is moved back onto it.

A note can lie over a neighbour's link while it is out. It re-sticks on Escape, on a press anywhere
outside its sticker, when another is opened, and when the Tab key moves on past its last link.

The Tab order with the script running is: each link, then, for a sticker with a note, its corner,
then the links of its note while the note is out.

#### Reduced motion

Nothing moves by itself: the lamp stays at rest, a note opens and closes at once, and a sticker
that is let go sticks where it is with no swing, throw or squash. Carrying a sticker still follows
the pointer, because the visitor is moving it. Sound is off unless it was turned on while reduced
motion was set.

#### What could not be checked here

The tests run in headless Chromium on a desktop. A real phone's tilt (the tests send the readings a
sensor would), the sounds as heard, Safari and Firefox, and a pen on a tablet have not been tried.

## Round 2: a proper site

Alex's feedback on the built lid: it read as a screenshot on a desk ("weird margins"), and its
first screen was "just focusing on the hackathon stuff". Both answers move the lid further from
the mockup, so this round also changed how the lid is compared with it.

### Full bleed, and a third arrangement

|                    | Before                                        | Now                                                                       |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------------- |
| The lid            | A 1001px card with 12px corners on an ink desk | Cobalt from edge to edge at every width, no desk, no corners, no padding |
| Arrangements       | 390 (to 560px) and 728 (561px and up)         | 390 (to 560px), 728 (561 to 1099px) and a new wide one, 1100 (1100px up)  |
| Largest artboard   | 728 units at 1001px                           | 1100 units, growing to 1920px (1.75px a unit), then centred               |
| Artboard heights   | 728 × 1300, 390 × 2256                         | 1100 × 1090, 728 × 1510, 390 × 2526                                       |
| Below the lid      | The desk                                      | The strap pinned to the top, then the first section                       |

Past 1920px the stickers stop growing and are centred, and the cobalt and its brushed texture run
on to both edges. The wide arrangement is `src/features/lid/placement/wide.ts`. Its badge hangs
from a point 120 units above the top edge (`rise` in `artboards.ts`), higher than on the other
two, so that at 1440 × 900 the first screen shows the name, the hello tag, the badge with the top
of its ribbons, the Plain CV tag and both counts. The lid is kept clear 60 units either side of
the badge and 120 below its ribbons, for the badge's drag and spring.

### The whole career, not only hackathons

- **The hello tag** introduces the whole person. Its handwriting is his own first line followed by
  "I build AI agents at" the employer the record marks as current, "Before that: bitcoin and
  Lightning apps." and "Along the way:" the count of granted patents "and hackathons around the
  world." The highlighted phrase is now "AI agents", where the mockup had "hackathons".
- **Five asset tags** for his employers (Finite Computer, Fedi, Zion, BlockSpaces, NCR), drawn as
  the silver plates, white "property of" labels and riveted strips companies stick on their
  laptops: `src/features/stickers/PropertyTag.tsx`. Each has the organization and, where the record
  has one, the start year ("Issued 2024"); the current job reads "In service". They link to the
  work section.
- **Six ribbons**, in the order of the page: ENGINEER, WINNER ×9, BUILDER, ORGANIZER ×16, SPEAKER,
  INVENTOR. The mockup had four (ORGANIZER, WINNER, SPEAKER, BUILDER).
- **Links stay on the page.** Every sticker and ribbon that went to `/cv/#…` now goes to the
  matching section of the home page. Plain CV still goes to `/cv/`, and the "More in the CV" link
  at the foot of a peeled sticker's note still goes to the CV's own section.
- **Nothing was dropped.** To make room, the stickers below the hello tag moved down on the 728
  and phone arrangements (200 to 260 units on 728). The eight city pills kept their size and were moved
  into the gaps.

### The strap pinned to the top

`src/features/nav/`: the lanyard's strap laid flat between the lid and the first section,
`position: sticky`, 44px tall at every width, a `nav` named "On this page" (the ribbons' is
"Sections"). It carries Top and a link to each section; on a phone the links scroll sideways
inside it. The page sets `--pinned-height` to its height, so a section followed from it lands with
its heading clear. Following a link on the page glides there, except under reduced motion.

### How the comparison with the mockup changed

Until this round `e2e/lid-visual.spec.ts` compared the lid as laid out with the mockup, and left
out the places taken by everything added since. With the asset tags, the sixth ribbon and the
moved stickers those places would have come to well over the 9% it allowed, and the comparison
would have guarded almost nothing. It now works the other way round:

1. **It dresses the lid as the mockup** before taking the picture (`e2e/mockupArrangement.ts`): it
   adds a stylesheet that puts every sticker the mockup has back at the mockup's place, size,
   tilt and stacking, makes the stage the mockup's 1300 units tall and takes off everything added
   since (the five asset tags, the NCR medal, the patents label and the three buttons the script
   shows). It then gives the hello tag the mockup's sentence around "hackathons" and hangs the
   mockup's four ribbons in the mockup's order.
2. **It compares the two pictures** as before: at most 2.7% of the pixels may differ, and every
   sticker not in the list of recorded departures must match to 0.1%. Today the difference is
   1.63%.
3. **Only the two counts the ninth win changed are left out**: the wins seal's figure and the
   WINNER ribbon's ×9. The allowance for what is left out came down from 9% to 2%; they take 1.57%.
4. **Two new checks keep it honest.** Every sticker on the lid is either on the mockup or on the
   list of additions, so a new sticker cannot slip past unnoticed. And the dressed lid is checked
   to have every mockup sticker at the mockup's exact place, its height, the mockup's hello
   wording and its four ribbons, so the dressing cannot quietly stop working.

What it still guards: how every sticker of the mockup is drawn (vinyl, cut, paint, lettering,
shadow), at the mockup's width. What it no longer guards: where the stickers are stuck, the
wording of the hello tag, and the ribbons beyond the mockup's four. Those are covered by
`e2e/lid.spec.ts` instead, at 390, 728 and 1440 wide, with 1100, 1920 and 2560 checked for
overflow and for the 11px floor. The review screenshots are now taken at 1920, 1440, 728 and 390.

## Round 3: a cover, a pile and motion

Alex's feedback on the deployed site: the art direction is right, the landing screen is "too busy",
and the margins are "kind of funky". He asked for "a larger, more minimalist landing page with my
name, the badge, and maybe the short hello, I'm thing", the stats and most of the stickers moved
"to another section, maybe after scrolling down", and "a bit more flourishing animation". The lid
is the same surface with the same stickers, in two parts.

### The lid is two blocks

|                 | Before                                             | Now                                                                                           |
| --------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| The lid         | One stage, about forty stickers on one artboard    | A cover and, under it, a pile: two blocks inside the one `[data-lid]`                         |
| First screen    | Name, hello, badge, CV tag, five employers, counts | The cover: name, hello tag, badge on its lanyard, a cue to scroll. Nothing else               |
| Cover's height  | Whatever the artboard came to                      | Exactly one screen (`100svh`, `100vh` where there is no small viewport)                       |
| Cover's unit    | The page's, from the width                         | The smaller of width and height, so the composition fits as a picture set to "contain" does   |
| Name            | 460 units of 1100 (42%)                            | 590 of the column's 1000 (59%) on a laptop, the column's whole width on a phone               |
| Pile's unit     | Grew to 1920px                                     | Stops at 1440px, as the sections' does                                                        |
| Pile artboards  | 1100 × 1090, 728 × 1510, 390 × 2526 (whole lid)    | 1100 × 856, 728 × 1296, 390 × 2212 (the pile alone)                                           |
| Hello tag       | Four sentences: now, before, patents, hackathons   | Two short lines: who he is and where, and "I build AI agents at" his current employer         |

- **The cover has four compositions** (`src/features/lid/placement/cover.ts`): a laptop's, a
  tablet's on its side, a tablet's upright (narrower than nine tenths of its height) and a phone's.
  A placement on it is measured in from one edge of the page's column and down from the top of the
  screen, its middle or its bottom. So the name's left edge is the edge every section's heading
  sits on at any width, the badge's card ends on the column's right edge, and what a wider or
  taller screen adds is bare lid between and around them.
- **It is centred down the screen, not across it.** A composition centred across would leave the
  name off the column's edge on every screen that is not the artboard's own shape, which is most
  laptops. The spare width goes between the name and the badge instead.
- **Past 1440px the cover's unit grows a tenth more and stops** (`COVERS.wide.capPx`). The column
  stops growing at 1440px, and a name any larger would run into the badge.
- **It never shrinks its type under 11px.** On a screen too short for the composition at the
  smallest legible unit (a phone on its side, a very short window) the cover grows taller than the
  screen instead. That is the one case in which it is not exactly one screen.
- **The pile has a heading**, "Stuck on / so far", an `h2` drawn as the sections' headings are
  (`src/features/sections/HeadingLabel.tsx`, now shared) on the same left edge, with a line in his
  hand under it. The cover's cue, "scroll, it gets stickier", is a link to it (`/#pile`).
- **The ribbons trail off the cover and land on the pile.** On a laptop and a tablet the pile
  keeps its top right corner bare for them (`LANDINGS` in `artboards.ts`). On a phone the badge is
  most of the screen's width, so the pile starts under the last ribbon, by a gap the stylesheet
  works out from the screen's height.
- **No sticker covers another's link**, at any width: `e2e/lid-cover.spec.ts` probes every sticker
  on a grid. The first two rounds held only what was added after the mockup to that.
- **Three stickers are new** (the cue, the pile's heading and the line under it), so the lid has
  43. The sentences that left the hello tag ("Before that: bitcoin and Lightning apps. Along the
  way: two granted patents, and hackathons around the world.") were dropped: the employers' tags,
  the patents label and the counts in the pile say the same from the records.

### Motion

All of it runs only where motion is welcome, animates only `transform`, `translate`, `rotate`,
`scale` and `opacity`, and adds to a page that is whole without it.

- **The name is drawn a letter at a time.** Each letter is a piece of its own
  (`src/features/stickers/DieCutText.tsx`), placed from a table of the face's advances
  (`geometry/nameFace.ts`), so the letters can be slapped down one after another, 55ms apart. The
  mockup set each line as one piece of text, stretched to the measure and kerned by the browser.
  Set letter by letter there is no kerning: on the 480-unit drawing the E of ALEX sits 1.9 units
  to the right of the mockup's and the L 1 unit. The optical size is pinned to 96, which is what
  browsers chose themselves at that size.
- **One pass of light** crosses the name's foil once it is on. **The three sparks no longer
  twinkle for ever**: they come on after the light, twinkle twice and are still.
- **The hello tag** is slapped down as the name finishes, and its highlighter is a stroke of its
  own (a pseudo-element where the mockup had a background), drawn from left to right once the tag
  has landed.
- **The badge drops in.** The stylesheet holds it above the lid for a quarter of a second and
  drops it; the page's script, if it has run by then, drops it by its physics from where it is
  held. Before, it dropped only when the script ran before the first paint, and was otherwise
  tossed from where it hung.
- **The pile lands as it scrolls into view**, each sticker slapped down in its turn, 60ms after
  its neighbour and never more than half a second after it came into view
  (`src/features/lid/enhance/arrive.ts`). The first sticker to land and every fifth after it are
  heard when sound is on, five at most.
- **Each section's heading and stickers are pressed on** the first time they scroll into view: a
  quarter of a second, 35ms apart.
- **Nothing is hidden by the stylesheet alone.** A sticker is held back only by the script, only
  after the browser has said it is off the screen, and is shown at once if anything goes wrong.
  What is on screen when the page opens is never touched.
- **Nothing loops for ever** but the nod of the cue's arrow, and, until the script runs, the sway
  of the badge.

### How the comparison with the mockup changed

`e2e/lid-visual.spec.ts` still dresses the lid as the mockup and compares the pictures, to the same
2.7% and 0.1%. To put each sticker back at the mockup's place it now first takes the two blocks
away (`oneStageCss` in `e2e/mockupArrangement.ts`): the cover, its column and the pile stop being
what stickers are placed against, so all of them are placed on one stage again. Three stickers
joined the list of what the mockup never had (the cue, the pile's heading, the line under it), and
the name joined the list of recorded departures, for the two letters above.

What guards the first screen now is `e2e/lid-cover.spec.ts`, at 1440 × 900, 1920 × 1080,
1280 × 720, 1024 × 768, 768 × 1024, 390 × 844 and 360 × 640: the cover exactly one screen tall, the
name, the hello tag and the cue wholly on it, the badge's photo and name on it, and no sticker of
the pile showing. `e2e/lid-arrival.spec.ts` guards the motion, and that nothing stays hidden with
the script, without it, or with motion reduced.

### The badge's scrawl is gone

Alex asked for the "real title ↓" note on the badge to be removed. The badge now prints his title
with nothing scrawled beside it, and the "(real title)" that a screen reader heard after the title
went with it. The rows above about the scrawl's colour, its arrow and how it is read out describe
the lid before this. The badge was already one of the comparison's recorded departures; without
the note the lid differs from the mockup by 1.99% of pixels, against 2.70% allowed.

### The words were gone over

Alex asked for the copy to be gone over for anything "out of place for a portfolio site designed
to make me look good", and for the lines about who a press piece names to come off. What changed:

| Where                         | Before                                                                 | Now                                                               |
| ----------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Press, everywhere             | The claim, then "The piece names neither the event nor him." or the like | The claim alone. Who a piece names stays in the record, unprinted |
| The cover's cue               | "scroll, it gets stickier"                                             | "scroll for the highlights"                                       |
| The pile's heading and line   | "Stuck on / so far", "the long versions are further down"              | "At a / glance", "every sticker links to the full story"          |
| The CV tag on the lid         | "The serious version"                                                  | "Short on time?"                                                  |
| The button that puts it back  | "Tidy the lid"                                                         | "Reset stickers"                                                  |
| The workshop sticker and pass | "a real workshop I teach"                                              | "a workshop I teach"                                              |
| Career path, under the title  | A line about where each tag is stuck                                   | How many roles, from the first employer to the current one        |
| Wins                          | The newest win an empty outline with a note; two asides in his hand    | Every win has its sticker; no asides                              |
| Organized, under the title    | "one wristband each. newest at the wrist."                             | No line: the totals are straight under the title                  |
| Organized, each label         | Dashed pills for figures "not public"; an aside on the one he also won | A figure nobody published is left out; no aside                   |
| Organized, the upcoming one   | "still on the roll"                                                    | "save the date"                                                   |
| Projects, under the title     | "serious tech, shipped as toys. freshly cut."                          | No line: the stickers are straight under the title                |
| Patents, under the title      | "flip the laptop over. it's all on the rating plate."                  | No line: the plate is straight under the title                    |
| Contact                       | "that's the whole lid. the rest is a conversation.", a line about stickers harmed | "got something worth building? let's talk.", a thank-you |

The record's own note that he ran the hackathon Lightning Welder won, and took no part in the
judging, is still printed beside that win. The workshop sticker joins the comparison's recorded
departures, because its line no longer matches the mockup's.

Since 2026-11-12 the compliance label prints `U.S. PATENT FILINGS` and all four publication numbers.

### Links that leave the site open a new tab

Since 2026-11-13, at the owner's request, every link to another host opens in a new tab
(`target="_blank"` with `rel="noopener"`), on the home page and the plain CV, so the tab the visitor
was reading stays where it was. Before, no link opened a new window. Links within the site (the
ribbons, the strap, the count stickers, the plain CV) and mail addresses stay in their tab. One
function decides it, `linkTo` in `src/lib/linkTo.ts`; `tests/build/links.test.ts` checks every anchor
in the built pages and `e2e/outbound.spec.ts` follows the links in a browser.

### A way to the contact section on the cover

Since 2026-11-13, at the owner's request, the cover holds one more thing: "contact me", with a drawn
arrow, written in his marker under the left end of the hello tag. It leads to the contact section at
the foot of the page, for a visitor who came to write to him. It is deliberately quiet: white where
the cue to scroll is in highlighter, about three quarters of its size, on one line, and its arrow
does not nod. It is the sticker `contact` (a `cue` that is `quiet`), placed in all four compositions
against the same line of the screen as the hello tag, so the two stay together on a screen of any
height. The cover's links are now eight: the six under the badge, this one and the cue.

### One ribbon for the hackathons, with two pins

Since 2026-11-13, at the owner's request, the `WINNER ×9` and `ORGANIZER ×16` ribbons are one
ribbon, `HACKATHONS`, cut from highlighter yellow, with two pin-back buttons pinned to it, the kind
handed out at a conference: `WINNER ×9` in ink and `ORGANIZER ×16` in orange. The badge now hangs
five ribbons: ENGINEER, HACKATHONS, BUILDER, SPEAKER, INVENTOR.

- **A button is drawn** (`src/features/badge/PinButton.tsx`): a printed disc in a rolled metal rim,
  what it is lettered around the top and its count across the middle, with a dome of light over
  the print and a glint at the edge. It is 62 units across. On a 360px phone that is 57px, and its
  smallest lettering is 11px.
- **The buttons are the links.** `WINNER ×9` leads to the wins and `ORGANIZER ×16` to the hackathons
  he organized. The ribbon itself is not a link: it stands for two sections, so its word is a
  heading for the buttons. The ways in under the badge are still six, and they still reach every
  section but the contact one. They are no longer in the order of the page: the two about
  hackathons come together.
- **The stack is as long as it was.** The ribbon is two ribbons deep, less the tuck between them, so
  the ribbons trail exactly as far as six did, and nothing placed around them moved. The buttons
  are pinned to its two lower corners and hang a little off its ends and its foot.
- **A button swings on its pin.** It hangs a few degrees askew and swings the other way under the
  pointer or the keyboard. The link keeps its place, so a pointer on its edge stays on it.
- **The comparison with the mockup** leaves the whole ribbon out, buttons and all, where it used to
  leave out only the `WINNER` ribbon's count: the mockup has two ribbons there. What is left out is
  now 4.0% of the picture (the allowance went from 2% to 4.5%), and the difference over the rest is
  2.20% against a tolerance of 2.70%. An empty item keeps
  the second ribbon's turn in the dressed page, so SPEAKER and BUILDER still lean as the mockup's
  third and fourth ribbons did.
- The rule that set the badge's roles a touch larger on the wide artboard matched any list inside
  the badge. It is in `Badge.module.css` now, on the roles alone.
- Code: `src/features/badge/ribbons.ts` (a ribbon is a link, or carries pins),
  `src/features/badge/SectionRibbons.tsx` and `src/features/badge/PinButton.tsx`.

### What could not be checked here

The tests run in headless Chromium on a desktop. A real phone's tilt (the tests send the readings a
sensor would), the sounds as heard, Safari and Firefox, and a pen on a tablet have not been tried.

## Round 2: a proper site

Alex's feedback on the built lid: it read as a screenshot on a desk ("weird margins"), and its
first screen was "just focusing on the hackathon stuff". Both answers move the lid further from
the mockup, so this round also changed how the lid is compared with it.

### Full bleed, and a third arrangement

|                    | Before                                        | Now                                                                       |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------------- |
| The lid            | A 1001px card with 12px corners on an ink desk | Cobalt from edge to edge at every width, no desk, no corners, no padding |
| Arrangements       | 390 (to 560px) and 728 (561px and up)         | 390 (to 560px), 728 (561 to 1099px) and a new wide one, 1100 (1100px up)  |
| Largest artboard   | 728 units at 1001px                           | 1100 units, growing to 1920px (1.75px a unit), then centred               |
| Artboard heights   | 728 × 1300, 390 × 2256                         | 1100 × 1090, 728 × 1510, 390 × 2526                                       |
| Below the lid      | The desk                                      | The strap pinned to the top, then the first section                       |

Past 1920px the stickers stop growing and are centred, and the cobalt and its brushed texture run
on to both edges. The wide arrangement is `src/features/lid/placement/wide.ts`. Its badge hangs
from a point 120 units above the top edge (`rise` in `artboards.ts`), higher than on the other
two, so that at 1440 × 900 the first screen shows the name, the hello tag, the badge with the top
of its ribbons, the Plain CV tag and both counts. The lid is kept clear 60 units either side of
the badge and 120 below its ribbons, for the badge's drag and spring.

### The whole career, not only hackathons

- **The hello tag** introduces the whole person. Its handwriting is his own first line followed by
  "I build AI agents at" the employer the record marks as current, "Before that: bitcoin and
  Lightning apps." and "Along the way:" the count of granted patents "and hackathons around the
  world." The highlighted phrase is now "AI agents", where the mockup had "hackathons".
- **Five asset tags** for his employers (Finite Computer, Fedi, Zion, BlockSpaces, NCR), drawn as
  the silver plates, white "property of" labels and riveted strips companies stick on their
  laptops: `src/features/stickers/PropertyTag.tsx`. Each has the organization and, where the record
  has one, the start year ("Issued 2024"); the current job reads "In service". They link to the
  work section.
- **Six ribbons**, in the order of the page: ENGINEER, WINNER ×9, BUILDER, ORGANIZER ×16, SPEAKER,
  INVENTOR. The mockup had four (ORGANIZER, WINNER, SPEAKER, BUILDER).
- **Links stay on the page.** Every sticker and ribbon that went to `/cv/#…` now goes to the
  matching section of the home page. Plain CV still goes to `/cv/`, and the "More in the CV" link
  at the foot of a peeled sticker's note still goes to the CV's own section.
- **Nothing was dropped.** To make room, the stickers below the hello tag moved down on the 728
  and phone arrangements (200 to 260 units on 728). The eight city pills kept their size and were moved
  into the gaps.

### The strap pinned to the top

`src/features/nav/`: the lanyard's strap laid flat between the lid and the first section,
`position: sticky`, 44px tall at every width, a `nav` named "On this page" (the ribbons' is
"Sections"). It carries Top and a link to each section; on a phone the links scroll sideways
inside it. The page sets `--pinned-height` to its height, so a section followed from it lands with
its heading clear. Following a link on the page glides there, except under reduced motion.

### How the comparison with the mockup changed

Until this round `e2e/lid-visual.spec.ts` compared the lid as laid out with the mockup, and left
out the places taken by everything added since. With the asset tags, the sixth ribbon and the
moved stickers those places would have come to well over the 9% it allowed, and the comparison
would have guarded almost nothing. It now works the other way round:

1. **It dresses the lid as the mockup** before taking the picture (`e2e/mockupArrangement.ts`): it
   adds a stylesheet that puts every sticker the mockup has back at the mockup's place, size,
   tilt and stacking, makes the stage the mockup's 1300 units tall and takes off everything added
   since (the five asset tags, the NCR medal, the patents label and the three buttons the script
   shows). It then gives the hello tag the mockup's sentence around "hackathons" and hangs the
   mockup's four ribbons in the mockup's order.
2. **It compares the two pictures** as before: at most 2.7% of the pixels may differ, and every
   sticker not in the list of recorded departures must match to 0.1%. Today the difference is
   1.63%.
3. **Only the two counts the ninth win changed are left out**: the wins seal's figure and the
   WINNER ribbon's ×9. The allowance for what is left out came down from 9% to 2%; they take 1.57%.
4. **Two new checks keep it honest.** Every sticker on the lid is either on the mockup or on the
   list of additions, so a new sticker cannot slip past unnoticed. And the dressed lid is checked
   to have every mockup sticker at the mockup's exact place, its height, the mockup's hello
   wording and its four ribbons, so the dressing cannot quietly stop working.

What it still guards: how every sticker of the mockup is drawn (vinyl, cut, paint, lettering,
shadow), at the mockup's width. What it no longer guards: where the stickers are stuck, the
wording of the hello tag, and the ribbons beyond the mockup's four. Those are covered by
`e2e/lid.spec.ts` instead, at 390, 728 and 1440 wide, with 1100, 1920 and 2560 checked for
overflow and for the 11px floor. The review screenshots are now taken at 1920, 1440, 728 and 390.

## Round 3: a cover, a pile and motion

Alex's feedback on the deployed site: the art direction is right, the landing screen is "too busy",
and the margins are "kind of funky". He asked for "a larger, more minimalist landing page with my
name, the badge, and maybe the short hello, I'm thing", the stats and most of the stickers moved
"to another section, maybe after scrolling down", and "a bit more flourishing animation". The lid
is the same surface with the same stickers, in two parts.

### The lid is two blocks

|                 | Before                                             | Now                                                                                           |
| --------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| The lid         | One stage, about forty stickers on one artboard    | A cover and, under it, a pile: two blocks inside the one `[data-lid]`                         |
| First screen    | Name, hello, badge, CV tag, five employers, counts | The cover: name, hello tag, badge on its lanyard, a cue to scroll. Nothing else               |
| Cover's height  | Whatever the artboard came to                      | Exactly one screen (`100svh`, `100vh` where there is no small viewport)                       |
| Cover's unit    | The page's, from the width                         | The smaller of width and height, so the composition fits as a picture set to "contain" does   |
| Name            | 460 units of 1100 (42%)                            | 590 of the column's 1000 (59%) on a laptop, the column's whole width on a phone               |
| Pile's unit     | Grew to 1920px                                     | Stops at 1440px, as the sections' does                                                        |
| Pile artboards  | 1100 × 1090, 728 × 1510, 390 × 2526 (whole lid)    | 1100 × 856, 728 × 1296, 390 × 2212 (the pile alone)                                           |
| Hello tag       | Four sentences: now, before, patents, hackathons   | Two short lines: who he is and where, and "I build AI agents at" his current employer         |

- **The cover has four compositions** (`src/features/lid/placement/cover.ts`): a laptop's, a
  tablet's on its side, a tablet's upright (narrower than nine tenths of its height) and a phone's.
  A placement on it is measured in from one edge of the page's column and down from the top of the
  screen, its middle or its bottom. So the name's left edge is the edge every section's heading
  sits on at any width, the badge's card ends on the column's right edge, and what a wider or
  taller screen adds is bare lid between and around them.
- **It is centred down the screen, not across it.** A composition centred across would leave the
  name off the column's edge on every screen that is not the artboard's own shape, which is most
  laptops. The spare width goes between the name and the badge instead.
- **Past 1440px the cover's unit grows a tenth more and stops** (`COVERS.wide.capPx`). The column
  stops growing at 1440px, and a name any larger would run into the badge.
- **It never shrinks its type under 11px.** On a screen too short for the composition at the
  smallest legible unit (a phone on its side, a very short window) the cover grows taller than the
  screen instead. That is the one case in which it is not exactly one screen.
- **The pile has a heading**, "Stuck on / so far", an `h2` drawn as the sections' headings are
  (`src/features/sections/HeadingLabel.tsx`, now shared) on the same left edge, with a line in his
  hand under it. The cover's cue, "scroll, it gets stickier", is a link to it (`/#pile`).
- **The ribbons trail off the cover and land on the pile.** On a laptop and a tablet the pile
  keeps its top right corner bare for them (`LANDINGS` in `artboards.ts`). On a phone the badge is
  most of the screen's width, so the pile starts under the last ribbon, by a gap the stylesheet
  works out from the screen's height.
- **No sticker covers another's link**, at any width: `e2e/lid-cover.spec.ts` probes every sticker
  on a grid. The first two rounds held only what was added after the mockup to that.
- **Three stickers are new** (the cue, the pile's heading and the line under it), so the lid has
  43. The sentences that left the hello tag ("Before that: bitcoin and Lightning apps. Along the
  way: two granted patents, and hackathons around the world.") were dropped: the employers' tags,
  the patents label and the counts in the pile say the same from the records.

### Motion

All of it runs only where motion is welcome, animates only `transform`, `translate`, `rotate`,
`scale` and `opacity`, and adds to a page that is whole without it.

- **The name is drawn a letter at a time.** Each letter is a piece of its own
  (`src/features/stickers/DieCutText.tsx`), placed from a table of the face's advances
  (`geometry/nameFace.ts`), so the letters can be slapped down one after another, 55ms apart. The
  mockup set each line as one piece of text, stretched to the measure and kerned by the browser.
  Set letter by letter there is no kerning: on the 480-unit drawing the E of ALEX sits 1.9 units
  to the right of the mockup's and the L 1 unit. The optical size is pinned to 96, which is what
  browsers chose themselves at that size.
- **One pass of light** crosses the name's foil once it is on. **The three sparks no longer
  twinkle for ever**: they come on after the light, twinkle twice and are still.
- **The hello tag** is slapped down as the name finishes, and its highlighter is a stroke of its
  own (a pseudo-element where the mockup had a background), drawn from left to right once the tag
  has landed.
- **The badge drops in.** The stylesheet holds it above the lid for a quarter of a second and
  drops it; the page's script, if it has run by then, drops it by its physics from where it is
  held. Before, it dropped only when the script ran before the first paint, and was otherwise
  tossed from where it hung.
- **The pile lands as it scrolls into view**, each sticker slapped down in its turn, 60ms after
  its neighbour and never more than half a second after it came into view
  (`src/features/lid/enhance/arrive.ts`). The first sticker to land and every fifth after it are
  heard when sound is on, five at most.
- **Each section's heading and stickers are pressed on** the first time they scroll into view: a
  quarter of a second, 35ms apart.
- **Nothing is hidden by the stylesheet alone.** A sticker is held back only by the script, only
  after the browser has said it is off the screen, and is shown at once if anything goes wrong.
  What is on screen when the page opens is never touched.
- **Nothing loops for ever** but the nod of the cue's arrow, and, until the script runs, the sway
  of the badge.

### How the comparison with the mockup changed

`e2e/lid-visual.spec.ts` still dresses the lid as the mockup and compares the pictures, to the same
2.7% and 0.1%. To put each sticker back at the mockup's place it now first takes the two blocks
away (`oneStageCss` in `e2e/mockupArrangement.ts`): the cover, its column and the pile stop being
what stickers are placed against, so all of them are placed on one stage again. Three stickers
joined the list of what the mockup never had (the cue, the pile's heading, the line under it), and
the name joined the list of recorded departures, for the two letters above.

What guards the first screen now is `e2e/lid-cover.spec.ts`, at 1440 × 900, 1920 × 1080,
1280 × 720, 1024 × 768, 768 × 1024, 390 × 844 and 360 × 640: the cover exactly one screen tall, the
name, the hello tag and the cue wholly on it, the badge's photo and name on it, and no sticker of
the pile showing. `e2e/lid-arrival.spec.ts` guards the motion, and that nothing stays hidden with
the script, without it, or with motion reduced.

### The badge's scrawl is gone

Alex asked for the "real title ↓" note on the badge to be removed. The badge now prints his title
with nothing scrawled beside it, and the "(real title)" that a screen reader heard after the title
went with it. The rows above about the scrawl's colour, its arrow and how it is read out describe
the lid before this. The badge was already one of the comparison's recorded departures; without
the note the lid differs from the mockup by 1.99% of pixels, against 2.70% allowed.

### The words were gone over

Alex asked for the copy to be gone over for anything "out of place for a portfolio site designed
to make me look good", and for the lines about who a press piece names to come off. What changed:

| Where                         | Before                                                                 | Now                                                               |
| ----------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Press, everywhere             | The claim, then "The piece names neither the event nor him." or the like | The claim alone. Who a piece names stays in the record, unprinted |
| The cover's cue               | "scroll, it gets stickier"                                             | "scroll for the highlights"                                       |
| The pile's heading and line   | "Stuck on / so far", "the long versions are further down"              | "At a / glance", "every sticker links to the full story"          |
| The CV tag on the lid         | "The serious version"                                                  | "Short on time?"                                                  |
| The button that puts it back  | "Tidy the lid"                                                         | "Reset stickers"                                                  |
| The workshop sticker and pass | "a real workshop I teach"                                              | "a workshop I teach"                                              |
| Career path, under the title  | A line about where each tag is stuck                                   | How many roles, from the first employer to the current one        |
| Wins                          | The newest win an empty outline with a note; two asides in his hand    | Every win has its sticker; no asides                              |
| Organized, under the title    | "one wristband each. newest at the wrist."                             | No line: the totals are straight under the title                  |
| Organized, each label         | Dashed pills for figures "not public"; an aside on the one he also won | A figure nobody published is left out; no aside                   |
| Organized, the upcoming one   | "still on the roll"                                                    | "save the date"                                                   |
| Projects, under the title     | "serious tech, shipped as toys. freshly cut."                          | No line: the stickers are straight under the title                |
| Patents, under the title      | "flip the laptop over. it's all on the rating plate."                  | No line: the plate is straight under the title                    |
| Contact                       | "that's the whole lid. the rest is a conversation.", a line about stickers harmed | "got something worth building? let's talk.", a thank-you |

The record's own note that he ran the hackathon Lightning Welder won, and took no part in the
judging, is still printed beside that win. The workshop sticker joins the comparison's recorded
departures, because its line no longer matches the mockup's.

Since 2026-11-12 the compliance label prints `U.S. PATENT FILINGS` and all four publication numbers.

### Links that leave the site open a new tab

Since 2026-11-13, at the owner's request, every link to another host opens in a new tab
(`target="_blank"` with `rel="noopener"`), on the home page and the plain CV, so the tab the visitor
was reading stays where it was. Before, no link opened a new window. Links within the site (the
ribbons, the strap, the count stickers, the plain CV) and mail addresses stay in their tab. One
function decides it, `linkTo` in `src/lib/linkTo.ts`; `tests/build/links.test.ts` checks every anchor
in the built pages and `e2e/outbound.spec.ts` follows the links in a browser.

### A way to the contact section on the cover

Since 2026-11-13, at the owner's request, the cover holds one more thing: "contact me", with a drawn
arrow, written in his marker under the left end of the hello tag. It leads to the contact section at
the foot of the page, for a visitor who came to write to him. It is deliberately quiet: white where
the cue to scroll is in highlighter, about three quarters of its size, on one line, and its arrow
does not nod. It is the sticker `contact` (a `cue` that is `quiet`), placed in all four compositions
against the same line of the screen as the hello tag, so the two stay together on a screen of any
height. The cover's links are now eight: the six under the badge, this one and the cue.

### One ribbon for the hackathons, with two pins

Since 2026-11-13, at the owner's request, the `WINNER ×9` and `ORGANIZER ×16` ribbons are one
ribbon, `HACKATHONS`, cut from highlighter yellow, with two enamel pins stuck on it: `WINNER ×9` in
ink and `ORGANIZER ×16` in orange, each in a metal rim. The badge now hangs five ribbons: ENGINEER,
HACKATHONS, BUILDER, SPEAKER, INVENTOR.

- **The pins are the links.** `WINNER ×9` leads to the wins and `ORGANIZER ×16` to the hackathons
  he organized. The ribbon itself is not a link: it stands for two sections, so its word is a
  heading for the pins. The ways in under the badge are still six, and they still reach every
  section but the contact one. They are no longer in the order of the page: the two about
  hackathons come together.
- **The stack is as long as it was.** The ribbon is two ribbons deep, less the tuck between them, so
  the ribbons trail exactly as far as six did, and nothing placed around them moved.
- **A pin lifts by its enamel.** The link keeps its place and is as deep as a fingertip needs
  (31px on a 360px phone, where its lettering is 11px).
- **The comparison with the mockup** leaves the whole ribbon out, where it used to leave out only
  the `WINNER` ribbon's count: the mockup has two ribbons there. What is left out is now 3.6% of the
  picture (the allowance went from 2% to 4%), and the difference over the rest is 2.20% against a
  tolerance of 2.70%. An empty item keeps the second ribbon's turn in the dressed page, so SPEAKER
  and BUILDER still lean as the mockup's third and fourth ribbons did.
- Code: `src/features/badge/ribbons.ts` (a ribbon is a link, or carries pins) and
  `src/features/badge/SectionRibbons.tsx`.

### The contact section offers four ways to reach him

Since 2026-11-13, at the owner's request:

- **Four strips, in his order:** X, GitHub, Book 30 min, LinkedIn. The section used to print a strip
  for every link in the profile. His Devpost, his bitcoin++ community profile and his business-card
  page are still in the record, and are no longer offered here. The four and their order are
  `CONTACT_LINK_IDS` in `src/features/sections/contact/links.ts`.
- **The label is his address and nothing more:** his name, his city and the work address. The line
  across its top ("If found, please return to") and the one at its foot ("Reward: one sticker,
  hardly used.") are gone, so the address sits in the middle of the label.
- **The layout was reset for four strips.** On a laptop they are a ladder as tall as the label, each
  a little deeper than before. On a tablet they are two rows of two, each row the width of the
  column. On a phone they are a ladder again.
- The lid's two wristbands (GitHub, X, LinkedIn; Devpost, Book 30 min) and the plain CV's list of
  links were not asked about and are unchanged.

### The patents plate is "Patent records", and says less

Since 2026-11-13, at the owner's request:

- **The plate is headed "Patent records"**, where it was "Inventor rating plate".
- **A row is a filing's title, its publication number and the day it was filed.** Who each filing
  is assigned to and who else it names are gone from the plate and from the plain CV, and from the
  records too (`src/content/patents.ts`): the schema now refuses both. Each number still opens its
  public record, which has them.
- **A row is one line on a laptop:** the title from the plate's left edge, and the number and the
  date at its right end, in columns down the plate. On a tablet the title has a line to itself and
  the two fields share the next. On a phone each has a line.
- **Two stickers, not three.** The "Caution: novel, useful, non-obvious" strip is gone. The pink
  "Named inventor" seal is replaced by a die-cut emoji, a light bulb: the visitor's own system
  draws it (`--font-emoji`), and its white edge is the glyph's outline grown outwards with hard
  white shadows, so it follows whichever emoji face is used. The quality check stays.

### Two bands take the screen's width: the pile and the projects

Round 3 set the whole page in one column. Since 2026-11-13, at the owner's request, two bands leave
it on a laptop, "so that it feels a bit wider and more like a bulletin board". Every other section
keeps the column and its margins. A tablet and a phone are unchanged: there the column is the
screen already.

- **The pile ("At a glance") takes the whole screen.** Its stickers keep the size they were drawn
  at and spread out across the screen instead. The wide board is still drawn in the column
  (`placement/wide.ts`); `placement/spread.ts` gives each sticker a share: how far across its free
  room it was drawn. On the page it stands the same share of the way across the room the screen
  gives it, between two margins of 32 units. So the sticker on the column's left edge stands on the
  left margin at any width, the one on its right edge on the right margin, and the rest spread
  between them as the screen widens. The pile's unit still stops growing at 1440px, as the
  sections' does.
- **Its heading moved out with it.** "At a glance" stands on the screen's left margin on a laptop,
  not on the sections' left edge, so that nothing is stuck to the left of the board's own title.
- **Three stickers stop short** of the place the badge's ribbons land (the Finite Computer tag and
  the two buttons): that place hangs from the column's right edge, not the screen's.
- **Self-sizing stickers have a recorded width** (`WIDE_SPANS`), because a share needs one. A browser
  test holds each to what the page draws.
- **The projects ("Things I built") are set on a wider measure:** the screen from margin to margin
  (32 units each side), up to half as wide again as the column. `SectionFrame` takes
  `measure="wide"` for it. The rows are the same rows; each has more room across, and the heading
  stands on the same left edge as the first sticker of each row.

### A press on a sticker with a note peels it

Since 2026-11-13, at the owner's request. A sticker with a note under it used to be left by a press
on its face: the face was a link, and only the corner peeled it. Now a plain press anywhere on the
face peels it, as the corner does, and a second sticks it back.

- **The face is still a link in the markup.** With no script it is followed as before. With the
  script, `enhance/peelDom.ts` keeps a plain press and peels the sticker instead, and tells a
  reader the face is a button that opens the note (`role`, `aria-expanded`, `aria-controls`). A
  press that asks for a new tab (with a modifier key, or another mouse button) is left to the
  browser. Space presses it, as it does a button.
- **The note's links are the way on.** Each still lists the record's own links (site, code, video),
  which open in a new tab. Its last link was "More in the CV" and led to the plain CV. It is "Full
  story" now and leads to the section of this page the sticker belongs to, because the three win
  stickers used to lead there themselves when pressed.
- A drag still picks the sticker up: the click that ends a drag never reaches the peel.

### An invitation at the end of the arm

Since 2026-11-13, at the owner's request, "Hackathons organized" ends with something for the
visitor: a label stuck across the end of the arm, under "room for more", that asks "Want to plan
your own hackathon?", says "Planning it, funding it, running it: I can help with any of them." and
leads to the contact section ("Reach out"). The whole label is the link. It is cut as the address
label at the foot of the page is, white stock in a tangerine border, because that is where it
leads. It stands outside the numbered list: it is not one of the hackathons.

### What could not be checked here

Safari and Firefox, a real phone's small viewport as its bars come and go, and the sounds as heard
have not been tried. The lid's own review screenshots (`design/screenshots/lid-*.png`) show the
cover as one screen of a 900px-tall window with the pile under it.

