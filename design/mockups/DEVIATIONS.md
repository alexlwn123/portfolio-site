# Where the lid departs from the mockup

The home page is a port of `01-first-screen.html`. At the mockup's own width of 728px the two
differ in 1.95% of pixels (`e2e/lid-visual.spec.ts` measures it on every run and fails above 3%).
Every sticker's box is in the same place to the hundredth of a pixel. The pixels that differ are
the ones listed here.

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
Pleb FM), in the mockup's order:

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
