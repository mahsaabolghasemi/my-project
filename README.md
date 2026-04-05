# MiniBookstore

A small **online bookstore** that sells **digital books (PDF only)** — built with pure HTML, CSS, and vanilla JavaScript (no frameworks).

## Business model

- All products are downloadable PDF books.
- No shipping logic.
- After successful purchase, users see purchased books in **order history**; each order detail shows **purchased PDFs** (download links).

## Run locally

Serve the project with any static file server:

```bash
npx serve .
# or: python3 -m http.server 8080
```

Then open the URL shown (e.g. `http://localhost:3000`).

## Publish online (public URL)

This site is static HTML/CSS/JS — no build step. Pick one:

### Netlify (fastest)

1. Go to [Netlify Drop](https://app.netlify.com/drop) (no account needed for a quick test).
2. Drag the **whole project folder** onto the page.
3. You get a random URL like `https://something-random-123.netlify.app` — share that link.

Or connect this Git repository in [Netlify](https://app.netlify.com/) — `netlify.toml` is already configured.

### Vercel

1. Install [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
2. In the project folder: `vercel` (follow prompts).
3. You get a URL like `https://your-project.vercel.app`.

### GitHub Pages

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source:** choose **GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` deploys on every push to `main` / `master`.
4. Your site will be at: **`https://<username>.github.io/<repository-name>/`**  
   (open `index.html` at the root of that URL.)

Add an empty `.nojekyll` at the repo root (already included) so GitHub does not run Jekyll on your files.

## Project structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for folder structure, design decisions, and data flow.

## Tests

E2E tests use Playwright:

```bash
npm install
npx playwright install
npx playwright test
```

## Pages

- **Home** — List of books from mock API
- **PLP** — Search results (`plp.html?q=...`)
- **PDP** — Book detail, add/remove from cart
- **Cart** — List books, remove items, total, continue → payment
- **Payment** — Simulated payment (no real gateway)
- **Thank you** — Purchase success
- **Order history** — List orders; click row to see order detail (including purchased PDFs)

## Tech stack

- Pure HTML / CSS / Vanilla JS
- Mock backend API (fake service layer)
- No real payment gateway
- Modular, maintainable structure (QA-focused)
