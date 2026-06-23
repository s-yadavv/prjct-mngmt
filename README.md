# ProjectFlow — MERN Project Management Dashboard

A full-stack Kanban-style project management dashboard built with MongoDB, Express, React, and Node.js. Features drag-and-drop boards, role-based access control, and full data persistence.

---

## Features

- **Boards, Lists & Task Cards** — Create unlimited boards, add lists (columns), and manage tasks with full CRUD
- **Drag & Drop** — Reorder tasks within lists and across lists; reorder lists left/right — all powered by `@dnd-kit`
- **Role-Based Access Control** — Three roles: `admin`, `manager`, `member` — each with different permissions
- **Task Details** — Priority levels, due dates, assignees, labels, and interactive checklists with progress bar
- **Admin Panel** — Admins can view all users, change roles, and deactivate accounts
- **JWT Authentication** — Secure login/register with token-based sessions
- **Data Persistence** — All state stored in MongoDB

---

## Tech Stack

| Layer    | Technology                                    |
|----------|-----------------------------------------------|
| Frontend | React 18, React Router v6, @dnd-kit, Axios    |
| Backend  | Node.js, Express 4                            |
| Database | MongoDB with Mongoose ODM                     |
| Auth     | JWT (jsonwebtoken) + bcryptjs                 |
| Styling  | Pure CSS with CSS Variables (no UI library)   |

---

## Project Structure

```
pm-dashboard/
├── server/                  # Express backend
│   ├── models/
│   │   ├── User.js
│   │   ├── Board.js
│   │   ├── List.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── boards.js
│   │   ├── lists.js
│   │   ├── tasks.js
│   │   └── users.js
│   ├── middleware/
│   │   ├── auth.js          # JWT protect + requireRole
│   │   └── boardAccess.js   # Per-board role enforcement
│   ├── .env.example
│   ├── index.js             # Server entry point
│   └── package.json
│
├── client/                  # React frontend
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── Board/
│       │   │   ├── TaskCard.js       # Draggable task card
│       │   │   ├── ListColumn.js     # Droppable list column
│       │   │   └── TaskModal.js      # Task detail/edit modal
│       │   └── Layout/
│       │       └── Layout.js         # Navbar + page shell
│       ├── context/
│       │   ├── AuthContext.js        # User auth state
│       │   └── BoardContext.js       # Board/list/task state
│       ├── pages/
│       │   ├── Login.js
│       │   ├── Register.js
│       │   ├── Dashboard.js          # Board listing
│       │   ├── BoardPage.js          # Kanban view with DnD
│       │   └── AdminPage.js          # User management
│       ├── utils/
│       │   └── api.js                # Axios instance + interceptors
│       ├── App.js                    # Routes + providers
│       └── index.css                 # Global styles + design tokens
│
├── seed.js                  # Seed script with demo data
└── package.json             # Root: concurrent dev scripts
```

---

## Prerequisites

Make sure you have installed:

- **Node.js** v18 or higher — https://nodejs.org
- **MongoDB** running locally on port 27017 — https://www.mongodb.com/try/download/community
  - OR use **MongoDB Atlas** (cloud) — just swap the `MONGO_URI` in `.env`
- **npm** v8 or higher (comes with Node.js)

---

## Setup & Run Locally

### Step 1 — Clone / navigate to the project

```bash
cd project-management
```

### Step 2 — Install all dependencies

```bash
# Install root devDependencies (concurrently)
npm install

# Install server dependencies
npm install --prefix server

# Install client dependencies
npm install --prefix client
```

Or use the convenience script:

```bash
npm run install:all
```

### Step 3 — Configure environment variables

```bash
cp server/.env.example server/.env
```

Open `server/.env` and set your values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/projec_management
JWT_SECRET=change_this_to_a_long_random_secret_string
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

> For MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string.

### Step 4 — Seed demo data (optional but recommended)

```bash
node seed.js
```

This creates 4 demo users and 2 sample boards with lists and tasks.

**Demo accounts created:**

| Email                 | Password      | Role    |
|-----------------------|---------------|---------|
| admin@demo.com        | password123   | Admin   |
| manager@demo.com      | password123   | Manager |
| sam@demo.com          | password123   | Member  |
| jordan@demo.com       | password123   | Member  |

### Step 5 — Start the development servers

```bash
npm run dev
```

This runs both backend and frontend concurrently:
- **Backend** → http://localhost:5000
- **Frontend** → http://localhost:3000

The React app proxies `/api` requests to the Express server automatically.

To run them separately:

```bash
npm run dev:server    # Express only on :5000
npm run dev:client    # React only on :3000
```

---

## API Reference

### Auth
| Method | Endpoint         | Description           | Auth |
|--------|------------------|-----------------------|------|
| POST   | /api/auth/register | Register new user   | No   |
| POST   | /api/auth/login    | Login               | No   |
| GET    | /api/auth/me       | Get current user    | Yes  |
| PATCH  | /api/auth/me       | Update profile      | Yes  |

### Boards
| Method | Endpoint               | Description              | Min Role    |
|--------|------------------------|--------------------------|-------------|
| GET    | /api/boards            | List accessible boards   | member      |
| POST   | /api/boards            | Create board             | any         |
| GET    | /api/boards/:id        | Get board with lists+tasks | member    |
| PATCH  | /api/boards/:id        | Update board             | manager     |
| DELETE | /api/boards/:id        | Archive board            | admin       |
| POST   | /api/boards/:id/members | Add member              | manager     |
| DELETE | /api/boards/:id/members/:userId | Remove member | manager  |

### Lists
| Method | Endpoint                      | Description       |
|--------|-------------------------------|-------------------|
| POST   | /api/lists/board/:boardId     | Create list       |
| PATCH  | /api/lists/:id                | Update/rename list|
| DELETE | /api/lists/:id                | Archive list      |
| PATCH  | /api/lists/reorder/:boardId   | Reorder lists     |

### Tasks
| Method | Endpoint               | Description          |
|--------|------------------------|----------------------|
| POST   | /api/tasks/list/:listId | Create task         |
| GET    | /api/tasks/:id         | Get task detail      |
| PATCH  | /api/tasks/:id         | Update task          |
| DELETE | /api/tasks/:id         | Archive task         |
| PATCH  | /api/tasks/move/:id    | Move task to list    |
| PATCH  | /api/tasks/reorder/:listId | Reorder tasks   |

### Users (Admin only)
| Method | Endpoint                  | Description         |
|--------|---------------------------|---------------------|
| GET    | /api/users                | List all users      |
| PATCH  | /api/users/:id/role       | Change user role    |
| PATCH  | /api/users/:id/deactivate | Deactivate user     |

---

## Role Permissions

| Action                    | Member | Manager | Admin |
|---------------------------|--------|---------|-------|
| View boards they're on    | ✅     | ✅      | ✅    |
| Create boards             | ✅     | ✅      | ✅    |
| Create/edit tasks         | ✅     | ✅      | ✅    |
| Rename lists              | ✅     | ✅      | ✅    |
| Edit board settings       | ❌     | ✅      | ✅    |
| Add/remove board members  | ❌     | ✅      | ✅    |
| Delete/archive board      | ❌     | ❌      | ✅    |
| View all boards (global)  | ❌     | ❌      | ✅    |
| Admin panel access        | ❌     | ❌      | ✅    |
| Change user roles         | ❌     | ❌      | ✅    |

---

## Production Build

To build the React app for production:

```bash
npm run build
```

The built files land in `client/build/`. You can then serve them from Express by adding:

```js
// In server/index.js (add before the error handler)
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, '../client/build/index.html'))
);
```
