# PawNest: puppy store with a separate admin portal

A complete MERN e-commerce stack for a business that **sells dogs** (puppies from partner breeders, plus free rescue adoptions). It has three apps:

| App | Folder | Local link | What it is |
|---|---|---|---|
| Storefront | `client/` | http://localhost:5173 | What customers see |
| Admin portal | `admin/` | http://localhost:5174 | Separate link for the owner and staff |
| API | `server/` | http://localhost:5000 | Express + MongoDB, shared by both |

Demo logins (created automatically):

- **Admin portal:** `admin@pawnest.in` / `Admin@123` (staff: `staff@pawnest.in` / `Staff@123`)
- **Storefront customer:** `demo@pawnest.in` / `Demo@123`

---

## Run it locally

You need **Node 18+** and **MongoDB** (local, Docker, or a free MongoDB Atlas cluster).

```bash
# 1. MongoDB (skip if you use Atlas)
docker compose up -d

# 2. Install everything
npm run install:all

# 3. Configure the API
cp server/.env.example server/.env      # edit MONGO_URI if you use Atlas

# 4. Start the three apps (three terminals)
npm run dev:api      # API on :5000; first start seeds the demo store
npm run dev:store    # storefront on :5173
npm run dev:admin    # admin portal on :5174
```

On the first start the API sees an empty database and loads the demo store: 29 listed puppies across 18 breeds (including 3 free rescue adoptions), a breed guide, reservations from the last 30 days, kennel visits, enquiries, coupons and customer stories.

**Real dog photos:** the seed downloads real, breed-accurate photos (Golden Retriever photos for Golden Retrievers, and so on) from the free [Dog CEO API](https://dog.ceo/dog-api/), compresses them to WebP and saves them in `server/uploads/seed/`, so they're served from your own server. This needs internet on first run (about a minute). Run `npm run seed` any time to reset the demo data.

---

## What's in each panel

### Storefront (customers)

- **Home:** hero with the featured puppy, trust promises, puppies by breed, the buying steps, new arrivals, rescue adoption, happy-family stories, and kennel visit details.
- **Puppies:** filter by breed, boy/girl, "good with" (apartments, kids, first-time owners…), adult size, price, age and KCI papers, with sorting and pagination. Mobile gets a slide-in filter drawer.
- **Puppy page:** photo gallery, price and deposit, health record, parents with photos, what goes home with the puppy, breed living notes, similar puppies, WhatsApp and question form.
- **Compare:** up to three puppies side by side.
- **Breed guide:** every breed with energy, shedding, grooming and climate notes, plus a waitlist.
- **Reserve:** choose home delivery or kennel pickup, pay a refundable deposit or in full, apply coupons, with live server-side pricing. Two people can't reserve the same puppy because the reservation is locked atomically.
- **Book a visit:** kennel visit, video call or breed consultation, with live slot availability.
- **My account:** reservation tracker (Placed → Confirmed → Vet check → Ready → Home), visits, favourites, home preferences with suggested puppies, sharing a story, and profile/password.
- **Adopt, Happy families, FAQ, health guarantee, about and contact** pages.

### Admin portal (owner and staff), at its own link

- **Dashboard:** money collected, balance due, active reservations, inventory value, margin, a 30-day chart, reservation pipeline, top breeds, upcoming visits and handovers.
- **Puppies:** list, filter and search, change status or featured inline, and a full add/edit form with **drag-and-drop multi-photo upload** (auto-compressed to WebP, reorder, set cover). Pricing includes a private breeder payout and margin.
- **Reservations:** move each one through the pipeline, record balance payments, set the handover date, add customer-visible notes or private notes, cancel (the puppy goes back on sale automatically).
- **Visits, Enquiries** (puppy questions, breed waitlists, adoption requests) with call/WhatsApp buttons.
- **Customers** with history and saved puppies; block users or change roles (admin only).
- **Breeds, Coupons, Happy-family stories** (approve customer submissions) and **Store settings** (homepage text, deposit rules, delivery fees, visit slots, contact).

Both apps are responsive. On phones the admin tables turn into tappable card lists and the sidebar becomes a slide-out menu.

---

## Speed

- **One request for the homepage** (`/api/home`) instead of many.
- **API response cache** for public pages, cleared automatically whenever anything changes.
- **gzip compression**, lean MongoDB queries that return only card fields, and indexes on every filter.
- **Uploaded images compressed to WebP** (max 1400px) and served with 30-day immutable caching.
- **Route-level code splitting**, vendor chunking, React Query caching, and **prefetch on hover** so puppy pages open instantly.
- Lazy-loaded images with responsive `srcset`, skeleton loaders, and a graceful fallback image.

---

## Deploying (giving the admin its own link)

| Part | Suggested host | Settings |
|---|---|---|
| API (`server/`) | Render / Railway / any VPS | `npm start`; env vars from `.env.example`. Set `CLIENT_ORIGINS=https://pawnest.in,https://admin.pawnest.in` |
| Storefront (`client/`) | Vercel / Netlify | Build `npm run build`, output `dist`, env `VITE_API_URL=https://api.pawnest.in` |
| Admin (`admin/`) | Vercel / Netlify (second project) | Same build, env `VITE_API_URL=https://api.pawnest.in` and `VITE_STORE_URL=https://pawnest.in` |
| Database | MongoDB Atlas | Paste the connection string into `MONGO_URI` |

Point `admin.yourdomain.in` at the admin project and the admin portal lives on its own link. It isn't linked from the storefront and is marked `noindex`.

On hosts with temporary disks (Render's free tier, for example), attach a persistent disk at `server/uploads`, or uploaded photos will disappear on redeploy.

> Payments are simulated in this demo. To take real money, add Razorpay or Cashfree in `server/src/routes/orders.js` where the reservation is created.

---

## Project structure

```
server/   Express API · models (Pet, Breed, Order, Booking, Enquiry, Testimonial, Coupon, Setting, User)
          routes: auth, pets, orders, public, admin · seed/ (demo data + photo downloader)
client/   React + Vite + Tailwind storefront
admin/    React + Vite + Tailwind admin portal
```

Brand name, breeders, people and testimonials in the demo data are fictional. Edit them in the admin portal or in `server/src/seed/data.js`.
