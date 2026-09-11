<<<<<<< HEAD
# Ember & Bun — Setup Guide

React + TypeScript + Vite frontend · Node/Express + PostgreSQL backend.

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 18 |
| npm | 9 |
| PostgreSQL | 14 |

---

## 1 — Create the database

Open a terminal and run:

```bash
psql -U postgres
```

Then inside the `psql` prompt:

```sql
CREATE DATABASE ember_bun;
-- Optional: create a dedicated user
CREATE USER ember_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE ember_bun TO ember_user;
\q
```

---

## 2 — Apply the schema

From the **project root**:

```bash
psql "postgres://ember_user:yourpassword@localhost:5432/ember_bun" \
  -f server/db/schema.sql
```

This creates all tables, enums, indexes, and triggers in a single transaction.

---

## 3 — Seed lookup data

The seed file inserts the required `method_of_sale`, `payment_method`,
`sale_payment_rule`, and starter `division` rows. It is **idempotent** — safe
to run multiple times.

```bash
psql "postgres://ember_user:yourpassword@localhost:5432/ember_bun" \
  -f server/db/seed.sql
```

---

## 4 — (Optional) Load sample data

To get a fully populated menu with categories, ingredients, products, offers,
tables, and example orders right away:

```bash
psql "postgres://ember_user:yourpassword@localhost:5432/ember_bun" \
  -f server/db/sample_data.sql
```

> **Note:** Run `seed.sql` first — `sample_data.sql` depends on the lookup
> rows it inserts.

---

## 5 — Configure the backend environment

```bash
cp server/.env.example server/.env
```

Open `server/.env` and fill in your values:

```env
DATABASE_URL=postgres://ember_user:yourpassword@localhost:5432/ember_bun
JWT_SECRET=replace-with-a-long-random-string
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

Generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 6 — Install dependencies and start the backend

```bash
cd server
npm install
npm run dev
```

Verify it is running:

```bash
curl http://localhost:3001/api/health
# → {"ok":true}
```

---

## 7 — Start the frontend

In a **separate terminal**, from the project root:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## 8 — Create privileged accounts

Register two accounts through the UI (or via `POST /api/auth/register`), then
promote them directly in the database:

```sql
-- Connect to the DB
psql "postgres://ember_user:yourpassword@localhost:5432/ember_bun"

-- Promote to Owner (singleton)
UPDATE users SET role = 'OWNER' WHERE email = 'owner@example.com';

-- Promote to Super Admin (singleton)
UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'superadmin@example.com';
```

Owner and Super Admin are enforced as singletons by partial unique indexes —
only one row of each role can exist at a time.

---

## 9 — Create a delivery rider account

Register with `role: "courier"` from the Register page (or via the API).
The backend maps `courier` → `DELIVERY` automatically.

The rider's dashboard is at `/delivery` after login.

---

## Environment variables reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Full PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret used to sign 7-day JWTs |
| `PORT` | ❌ | API port (default: `3001`) |
| `CORS_ORIGIN` | ❌ | Frontend origin allowed by CORS (default: `http://localhost:5173`) |
| `VITE_API_URL` | ❌ | Frontend env — API base URL (default: `http://localhost:3001`) |

Set `VITE_API_URL` in a `.env` file at the **project root** (not inside
`server/`) if your API runs on a different host or port:

```env
VITE_API_URL=http://localhost:3001
```

---

## Project structure

```
├── src/                        # React frontend
│   ├── admin/routes/           # Admin pages (overview, menu, offers, users)
│   ├── components/             # Customer pages + shared UI
│   │   ├── food-select-page/   # Live menu (useCatalog hook → /api/catalog)
│   │   ├── user-dashboard/     # Customer dashboard
│   │   ├── MyOrdersPage.tsx    # Order history (/my-orders)
│   │   ├── DeliveryDashboard.tsx # Rider console (/delivery)
│   │   └── TicketsPage.tsx     # Support tickets (/tickets)
│   └── context/
│       ├── AuthContext.tsx      # JWT session
│       └── CartContext.tsx      # Cart state
├── server/
│   ├── db/
│   │   ├── schema.sql          # Full DB schema
│   │   ├── seed.sql            # Lookup data (methods, rules, divisions)
│   │   └── sample_data.sql     # Example catalog + orders
│   └── src/
│       └── routes/             # Express routers
│           ├── auth.js
│           ├── catalog.js
│           ├── offers.js
│           ├── orders.js
│           ├── tickets.js
│           ├── users.js
│           └── analytics.js
└── fable5-users-auth-offers-division-brief.md
```

---

## API quick reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register (USER or DELIVERY) |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | Bearer | Current user |
| GET | `/api/catalog/divisions` | — | All divisions |
| GET | `/api/catalog/categories` | — | All categories (`?division=id`) |
| GET | `/api/catalog/products` | — | All products (`?category=id`) |
| GET | `/api/catalog/products/:id` | — | Product with ingredients |
| GET | `/api/offers` | — | Active offers with items |
| POST | `/api/orders` | Optional | Place an order (guest OK) |
| GET | `/api/orders/mine` | USER | My order history |
| GET | `/api/orders/assigned` | DELIVERY | Assigned drops |
| GET | `/api/tickets` | Bearer | My tickets (admin sees all) |
| POST | `/api/tickets` | Bearer | Submit a ticket |
| GET | `/api/analytics` | OWNER/SUPER_ADMIN | Revenue, top foods, feedback |
| GET | `/api/users` | SUPER_ADMIN | All users with order stats |
=======
# resto-venezia



## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

* [Create](https://docs.gitlab.com/user/project/repository/web_editor/#create-a-file) or [upload](https://docs.gitlab.com/user/project/repository/web_editor/#upload-a-file) files
* [Add files using the command line](https://docs.gitlab.com/topics/git/add_files/#add-files-to-a-git-repository) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://gitlab.com/dddd-group4423937/resto-venezia.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

* [Set up project integrations](https://gitlab.com/dddd-group4423937/resto-venezia/-/settings/integrations)

## Collaborate with your team

* [Invite team members and collaborators](https://docs.gitlab.com/user/project/members/)
* [Create a new merge request](https://docs.gitlab.com/user/project/merge_requests/creating_merge_requests/)
* [Automatically close issues from merge requests](https://docs.gitlab.com/user/project/issues/managing_issues/#closing-issues-automatically)
* [Enable merge request approvals](https://docs.gitlab.com/user/project/merge_requests/approvals/)
* [Set auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)

## Test and Deploy

Use the built-in continuous integration in GitLab.

* [Get started with GitLab CI/CD](https://docs.gitlab.com/ci/quick_start/)
* [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/user/application_security/sast/)
* [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/topics/autodevops/requirements/)
* [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/user/clusters/agent/)
* [Set up protected environments](https://docs.gitlab.com/ci/environments/protected_environments/)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
>>>>>>> 51539ef8710d7f6acb20b366f57476e51a589e9d
