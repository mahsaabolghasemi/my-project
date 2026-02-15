# MiniBookstore — Architecture & Folder Structure

## Business context

- **Product:** Digital books (PDF only). No physical shipping.
- **Flow:** Browse books → add to cart → payment (simulated) → thank you → order history.
- **Post-purchase:** User sees purchased books in order history; each order detail shows **purchased PDFs** (download links).

---

## Design principles

1. **Separation of concerns** — HTML structure, CSS presentation, JS behavior in clear layers.
2. **Single responsibility** — Each module does one thing (e.g. `mockApi.js` only talks to the “backend”).
3. **Testability** — State and API are isolated so we can test UI and flows without real servers.
4. **Maintainability** — A QA or new dev can find “where is the cart logic?” or “where do we call the API?” quickly.

---

## Folder structure

```
miniShop/
├── index.html              # Home page (book list)
├── plp.html                # PLP (search results)
├── pdp.html                # PDP (book detail, add/remove)
├── cart.html
├── payment.html
├── thank-you.html
├── orders.html             # Order history (click row → detail with PDFs)
│
├── css/
│   ├── variables.css       # Colors, spacing, typography
│   ├── layout.css          # Header, main layout, book grid
│   └── components.css      # Buttons, badges, cards, forms
│
├── js/
│   ├── config.js           # Base URL, storage keys, constants
│   ├── api/
│   │   └── mockApi.js      # Mock backend: books list, search, get by id
│   ├── state/
│   │   ├── cart.js         # Cart state (books, add/remove, persist)
│   │   └── orders.js       # Order history (persist; items include pdfUrl for download)
│   ├── components/
│   │   └── header.js       # Shared header: logo, search books, cart badge, profile
│   ├── pages/
│   │   ├── home.js         # Fetch books, render grid
│   │   ├── plp.js          # Search → PLP results
│   │   ├── pdp.js          # Book detail, add/remove to cart
│   │   ├── cart.js         # Cart list, total, continue → payment
│   │   ├── payment.js      # Simulate payment → create order → redirect
│   │   ├── thankYou.js     # Purchase success
│   │   └── orders.js       # Order list, row click → detail (with PDF links)
│   └── utils.js            # formatPrice, getQueryParam, buildUrl
│
├── tests/
│   └── e2e/
│       └── *.spec.js       # Playwright E2E tests
│
├── ARCHITECTURE.md
└── README.md
```

---

## Why this structure?

| Choice | Reason |
|--------|--------|
| **`api/mockApi.js`** | All “backend” calls in one place. Books (with `pdfUrl`) live here. Swap for a real API later by changing only this layer. |
| **`state/cart.js`** | Single source of truth for cart. When adding a book we store `pdfUrl` so at payment we can pass it into the order (for “purchased PDFs” in order history). |
| **`state/orders.js`** | Orders store item details including `pdfUrl` so the order-detail view can show “Download PDF” per book. No shipping logic. |
| **`components/header.js`** | Header (search books, cart badge, profile) reused on Home, PLP, PDP. One place to fix and test. |
| **`pages/*.js`** | One script per page. Clear “what runs where”; easier E2E tests. |
| **`css/` split** | Variables = tokens; layout = structure; components = buttons/cards. |

---

## Data flow (high level)

- **Navigation:** Normal links between pages (`<a href="plp.html?q=...">`) or `location.href`. No SPA router.
- **Search:** Header form submits to `plp.html?q=...` → PLP reads `q` and calls `mockApi.searchBooks(q)`.
- **Cart:** `state/cart.js` holds items (id, title, price, quantity, **pdfUrl**). PDP adds/removes; cart page shows list and total; “Continue” → `payment.html`.
- **Payment:** Simulated submit → `ordersState.addOrder(items, total)` with items that include **pdfUrl** → clear cart → redirect to `thank-you.html`.
- **Order history:** Orders page lists orders; click row → show order detail with **purchased PDFs** (links using stored `pdfUrl`). No shipping.

---

## Page → script mapping

| Page | HTML | Main script | Purpose |
|------|------|-------------|---------|
| Home | index.html | pages/home.js | Fetch books, render grid |
| PLP | plp.html | pages/plp.js | Read `?q=`, search books, render results |
| PDP | pdp.html | pages/pdp.js | Book detail, add/remove to cart |
| Cart | cart.html | pages/cart.js | List cart, total, continue → payment |
| Payment | payment.html | pages/payment.js | Simulate pay → create order (with pdfUrl) → redirect |
| Thank you | thank-you.html | pages/thankYou.js | Purchase success |
| Orders | orders.html | pages/orders.js | List orders, row click → detail with PDF links |

---

## Next steps

Build step by step: home → PLP → PDP → cart → payment → thank you → order history (with PDFs in detail). After each step, we’ll explain what we did and why, and cover state management and testing.
