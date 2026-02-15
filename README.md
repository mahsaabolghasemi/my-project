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
