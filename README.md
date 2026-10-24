# Arnob Deb — personal site ("Nine Realms" edition)

A single static page: a Norse night sky over a recruiter-friendly portfolio, plus three downloadable resumes.
Built with Vite + vanilla TypeScript; the output in `dist/` is plain HTML/CSS/JS that runs on any static host.

## Run it locally

```bash
npm install
npm run dev        # live dev server → http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build → http://localhost:4173
```

Requires Node 20+ (tested with Node 24).

## Edit the words

**Everything the home page says lives in [`src/content/site.ts`](src/content/site.ts)**: bio, the Yggdrasil timeline,
the Forge portals and GitHub hand-off, skills, resumes, Valhalla tiles (gamer IDs included), quote, terminal lines, contact links.
**The three project pages ("sagas") live in [`src/content/sagas.ts`](src/content/sagas.ts)**: each one is a list of
acts (scroll-driven steps beside an animated stage), chart blocks and runestone blocks. Edit and save; the dev server reloads.

Pages: `index.html` (home), `restorekv.html` (thesis), `gpu.html` (RowHammer + OoO seminar), `http-server.html` (CS744).

The content is rendered into static HTML at build time (`src/content/render.ts`, wired up in `vite.config.ts`),
so the page is fully readable without JavaScript and crawlable by search engines.

`meta.siteUrl` is the public address (`https://www.cse.iitb.ac.in/~arnobdeb/`); it feeds `canonical`, `og:url` and the absolute `og:image`.

## Swap a resume

The PDFs live in `public/resume/`:

| Card | File |
|---|---|
| ML — Scroll of Wisdom | `Arnob_Deb_Resume_ML.pdf` |
| Systems — Scroll of the Forge (featured) | `Arnob_Deb_Resume_Systems.pdf` |
| SDE — Scroll of the Builder | `Arnob_Deb_Resume_SDE.pdf` |

To update one, overwrite the PDF with the same file name and rebuild. To rename or add one, edit
`resumes.items` in `site.ts` (the `file` path is relative, no leading slash).

## Project pages

Each act pins an animated canvas "stage" (`src/sagas/*.ts`) next to a column of steps; the step crossing the middle of the
screen drives the stage (`src/fx/story.ts`). Charts are SVG rendered at build time from the report numbers
(`src/content/charts.ts`) with hover/focus tooltips and a "View as table" fallback. The home page's Forge portals reuse the
same stages, cycling through a few steps on their own.

## Effects (all in `src/fx/`)

| File | What it does |
|---|---|
| `starfield.ts` + `aurora.ts` | Hero sky: parallax stars that brighten and lean toward the cursor, constellation lines, aurora that lifts toward the cursor |
| `runeDecode.ts` | Headings scramble from Elder Futhark runes into Latin text once on first view |
| `lightning.ts` | Bolt + flash on the "Choose your resume" and "Send a raven" buttons |
| `ravens.ts` | Raven flying along the top scroll-progress line |
| `embers.ts` | A few sparks behind the thesis card |
| `lantern.ts` / `shatter.ts` | Cursor lantern revealing runes in the hero sky; the name breaks into shards as you scroll |
| `yggdrasil.ts` | Timeline trunk fills with light as you scroll; knots light up |
| `pool.ts` | Playable pool table in Valhalla |
| `story.ts` / `chartHover.ts` | Scroll-driven stages; chart tooltips and count-up stats |
| `bifrost.ts` | Clicking a link to a section opens a rainbow beam that drags the page there and burns a rune ring where you land; between pages the beam departs and arrives |
| `easterEggs.ts` | Konami code (↑↑↓↓←→←→BA) → thunder + Tony Stark quote; type `odin` → the All-father opens an eye |
| `loop.ts` | Shared helpers: animation loops pause when off-screen or the tab is hidden |

`prefers-reduced-motion: reduce` turns off decode, lightning, embers, parallax, marquee and reveals; the sky is drawn
as one static frame and all content is visible immediately.

## Deploy

The build uses `base: './'` (relative URLs), so the same `dist/` works at `/`, at `/<repo>/` on GitHub Pages,
and at `/~arnobdeb/` on the CSE server. **Nothing is deployed until Arnob says yes.**

### GitHub Pages (temporary)
1. Arnob runs `gh auth login` himself.
2. Create the repo (name still to be decided — see `OPEN_QUESTIONS.md`), add a Pages workflow, push.
3. Check every link and PDF on the live URL.

Before the first push, review `git ls-files` together — nothing personal may be in the repo.

### IITB CSE server
```bash
npm run deploy:cse                      # defaults to arnobdeb@mars.cse.iitb.ac.in, ~/public_html
npm run deploy:cse -- user@host dir     # anything else
```
The script builds, lists what's on the server, asks before touching it, backs up `~/public_html` to
`~/public_html_backup_<timestamp>`, then rsyncs `dist/` (with `--delete`) and sets world-readable permissions.
Arnob types the password when ssh asks; no credentials go in any file. It prints the one-line undo at the end.
