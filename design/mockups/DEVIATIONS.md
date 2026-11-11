# Where the lid departs from the mockup

The home page is a port of `01-first-screen.html`. At the mockup's own width of 728px the two
differ in 1.64% of the pixels compared (`e2e/lid-visual.spec.ts` measures it on every run and fails
above 2.7%). The comparison leaves out 7.9% of the page: the places taken by what was stuck on
after the mockup was approved, which are listed at the end under "Additions since the mockup".
Three city pills moved to make room for those. Every other sticker's box is in the same place to
the hundredth of a pixel. The pixels that differ are the ones listed here.

Sizes are in design units unless they say px. One unit is 1px when an artboard is shown at its own
width (728 for the desktop arrangement, 390 for the phone one), and ten units are 1em.

## The five requested departures

### 1. Width cap and centring

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
| `✦` along the lanyard          | typed in a `textPath` | inline SVG. The straps are now HTML bands, at the same place and angle |
| `✦` around the organized seal  | typed in a `textPath` | SVG paths. Each phrase has its own arc, measured from the mockup |

`×` and `·` are in the typefaces and are still typed.

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
  exist. They go to `/cv/#organized`, `#wins`, `#talks` and `#projects`. Project and contact
  stickers open in the same tab, as links on the CV do. The mockup opened them in a new one.
- **Rounded corners show the desk.** The four 12px corners of the lid are ink where the mockup's
  were white.
- **Not ported yet.** The foil that follows the pointer and peel-and-restick dragging are the next
  phase. The foil rests where the mockup's script started it (`--hx: 0.35`, `--hy: 0.3`). The grab
  cursor and the ban on selecting text are left out until dragging exists.

## Kept as it was, but worth a look

- "real title ↓" still sits over the last two letters of "LEWIN" on the badge, as in the mockup.

## Additions since the mockup

Three things were stuck on after the mockup was approved, and a ninth win was added to the record.
None of this is in `01-first-screen.html`, so none of it can be checked against it.

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

|                                    | Before the additions | Now                      |
| ---------------------------------- | -------------------- | ------------------------ |
| Share of the page compared         | 100%                 | 92.1%                    |
| Difference, of what is compared    | 1.95%                | 1.64%                    |
| Tolerance                          | 3%                   | 2.7%                     |
| Limit on what may be left out      | none needed          | 9% (7.9% is left out)    |
| Limit for a sticker that must match | 0.1% of the page    | 0.1% of the page         |

The tolerance came down, not up. The seal's figure was already a recorded departure (ink where the
mockup has white), so leaving its place out took 0.3 points of known difference out of the
measurement, and the tolerance followed it down. The room between what is measured and what is
allowed is one point, as it was. Every sticker that had to match the mockup before still has to,
to the same 0.1%. The three pills that moved are the exception: both of their places are left out.
