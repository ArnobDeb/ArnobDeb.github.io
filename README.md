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

**Everything the page says lives in [`src/content/site.ts`](src/content/site.ts)**: bio, education, thesis, projects,
skills, resumes, off-duty section, quote, terminal lines, contact links. Edit it and save; the dev server reloads.

The content is rendered into static HTML at build time (`src/content/render.ts`, wired up in `vite.config.ts`),
so the page is fully readable without JavaScript and crawlable by search engines.

Fill-in-later fields (hidden while empty):
- `valhalla.siege.platform`, `valhalla.siege.handle`
- `valhalla.anime.favorites` (list of titles)
- `meta.siteUrl` — set to the final public address to emit `canonical`, `og:url` and an absolute `og:image`.

## Swap a resume

The PDFs live in `public/resume/`:

| Card | File |
|---|---|
| ML — Scroll of Wisdom | `Arnob_Deb_Resume_ML.pdf` |
| Systems — Scroll of the Forge (featured) | `Arnob_Deb_Resume_Systems.pdf` |
| SDE — Scroll of the Builder | `Arnob_Deb_Resume_SDE.pdf` |

To update one, overwrite the PDF with the same file name and rebuild. To rename or add one, edit
`resumes.items` in `site.ts` (the `file` path is relative, no leading slash).

## Effects (all in `src/fx/`)

| File | What it does |
|---|---|
| `starfield.ts` + `aurora.ts` | Hero sky: parallax stars that brighten and lean toward the cursor, constellation lines, aurora that lifts toward the cursor |
| `runeDecode.ts` | Headings scramble from Elder Futhark runes into Latin text once on first view |
| `lightning.ts` | Bolt + flash on the "Choose your resume" and "Send a raven" buttons |
| `ravens.ts` | Raven flying along the top scroll-progress line |
| `embers.ts` | A few sparks behind the thesis card |
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

### IITB CSE server (final)
Needs the SSH hostname and web directory from Arnob/the department (don't guess). Then:
```bash
ssh <user>@<host> 'cp -r ~/public_html ~/public_html_backup_$(date +%Y%m%d)'   # back up first
npm run build
rsync -avz --delete dist/ <user>@<host>:~/public_html/
```
Arnob types the password; no credentials go in any file. A `deploy:cse` npm script gets added once host and path are confirmed.
