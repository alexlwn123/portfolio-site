# Personal site

The source for [alex.lwn.lol](https://alex.lwn.lol).

The site is built around an approved design called "Sticker Shock": the home page is the lid of a
laptop covered in die-cut stickers, and `/cv/` is the same record as a plain page. The approved
mockups are in `design/mockups/` and the facts the site states come from
`docs/alex-lewin-cv-data.md`.

Each sticker on the lid is listed once, in reading order, in `src/features/lid/stickers.ts`. Where
it sits is data in `src/features/lid/placement/`: one hand-set arrangement for wide screens and one
for phones, compiled into a stylesheet at build time. No element carries an inline style.

## Stack

- [Astro](https://astro.build) with static output. Every page is HTML at build time.
- React and TypeScript components, rendered on the server only. Nothing hydrates, so pages ship no
  JavaScript unless a component opts in with a `client:*` directive.
- Plain CSS: design tokens as custom properties in `src/design/tokens.css`, and a CSS Module per
  component. No Tailwind, no component library, no CSS-in-JS.
- Content as typed data in `src/content/`, validated with [zod](https://zod.dev) when the build
  loads it. A bad record fails the build and names the field.
- Self-hosted fonts from Fontsource packages. No requests to third-party hosts at runtime.
- Vitest and React Testing Library for unit tests, Playwright for end-to-end tests.

## Layout

```
design/mockups/     approved mockups, kept unchanged, and DEVIATIONS.md: where the site departs from them
design/screenshots/ the mockups and the home page as rendered, rewritten by every `pnpm test:e2e`
docs/               source material
e2e/                Playwright specs
public/             files served as they are (favicons, robots.txt, web manifest)
src/content/        the facts: schemas, records and every derived number
src/design/         tokens and base styles
src/features/       components, grouped by feature
src/layouts/        the shared page shell
src/pages/          routes (thin .astro shells)
tests/build/        tests that run against the built site in dist/
```

## Commands

Requires Node 22.23.4 or newer (`.node-version` pins 24) and [pnpm](https://pnpm.io).

| Command              | What it does                                                |
| -------------------- | ----------------------------------------------------------- |
| `pnpm install`       | Install dependencies                                        |
| `pnpm dev`           | Start the dev server at `http://localhost:4321`             |
| `pnpm build`         | Build the static site into `dist/`                          |
| `pnpm preview`       | Serve `dist/` locally                                       |
| `pnpm test`          | Run unit tests, then build the site and run the build tests |
| `pnpm test:coverage` | The same, with a coverage report (80% minimum)              |
| `pnpm test:e2e`      | Build, serve and run the Playwright specs                   |
| `pnpm lint`          | ESLint and a Prettier check                                 |
| `pnpm typecheck`     | `astro check` and `tsc`                                     |
| `pnpm format`        | Format with Prettier                                        |

`pnpm test:e2e` needs a browser once: `pnpm exec playwright install chromium`.

Set `DIST_PREBUILT=1` to make the build tests read an existing `dist/` instead of rebuilding it.
