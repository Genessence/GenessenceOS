# Genessence Project Management Portal

A modern, production-ready, full-stack single-page application for managing projects, client budgets, timelines, and secure document vaults. Built with React (Vite, Tailwind CSS, Recharts, SheetJS) on the frontend, and Node.js (Express, Mongoose, Multer, JWT) on the backend.

---

## Key Features

1. **Role-Based Authentication**: Secure JWT-based route access controls:
   - **Admin**: Full administrative privileges (read/write projects, upload/delete files, user configuration management).
   - **Manager**: Workflow privileges (read/write projects, upload/download documents, view dashboard).
   - **Viewer**: Read-only access (view dashboard, query projects spreadsheet, download documents).
2. **Interactive Analytics Dashboard**: Summary cards, Recharts time-series area charts for capital budgeting, status distribution pie charts, and lists of recent project updates and files.
3. **Excel-Style Spreadsheet**: Fully responsive grid sheet featuring sorting, search filters, modal detail sheets, bulk creation, and spreadsheet CRUD.
4. **Excel Import/Export**: Direct client-side parsing of Excel files (`.xlsx` / `.xls`) to bulk-seed projects using SheetJS, alongside direct table exports.
5. **Secure Document Repository**: File dropzone supporting uploads of PDFs, DOCX, XLSX, images, and ZIP archives. Includes inline document viewer previews (PDF/images) and deletion controls.
6. **Robust Data Fallbacks**: Automatic `mongodb-memory-server` in-memory database fallback to run the server instantly on local machines without requiring MongoDB installation. Also includes theme persistence (dark/light mode) to prevent unstyled flashes (FOUC).

---

## Project Structure

```text
├── README.md               # Setup and deployment manual
├── package.json            # Root frontend client configuration
├── vite.config.js          # Vite and Tailwind CSS plugins config
├── index.html              # HTML shell with theme-initializer scripts
├── src/
│   ├── main.jsx            # React root renderer
│   ├── App.jsx             # React routing and context hooks entry
│   ├── index.css           # Tailwind v4 import, fonts, and scrollbars
│   ├── context/
│   │   ├── AuthContext.jsx # JWT session, profile, and roles handler
│   │   └── ToastContext.jsx# UI notifications overlay manager
│   ├── components/
│   │   ├── Navbar.jsx      # Top header with user profile, theme toggler
│   │   ├── Sidebar.jsx     # Navigation panel and mobile responsive drawer
│   │   └── Loader.jsx      # Inline spinners and full-screen loading blockers
│   └── pages/
│       ├── Login.jsx       # centered login card with credentials guide
│       ├── Dashboard.jsx   # Metrics, charts, and recent activity logs
│       ├── ProjectManagement.jsx # Excel spreadsheet table with import/export
│       ├── DocumentUploads.jsx   # File dropzone, project link, and previews
│       └── UserManagement.jsx   # Admin panel for roles configuration
└── server/
    ├── package.json        # Backend dependencies
    ├── server.js           # Express server bootstrap and routers connector
    ├── seed.js             # DB seeding schema with mock projects and users
    ├── config/
    │   └── db.js           # Mongoose setup with memory database fallback
    ├── middleware/
    │   └── auth.js         # JWT authorization checks and role filters
    ├── models/
    │   ├── User.js         # Hashed credentials database model
    │   ├── Project.js      # Projects metadata and timelines model
    │   └── Document.js     # Upload file mapping reference model
    └── routes/
        ├── auth.js         # Login, profile, and user administration endpoints
        ├── projects.js     # Projects CRUD and bulk Excel import endpoints
        └── documents.js    # Multer uploads handler, inline download, delete routes
```

---

## Local Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Optional - the server will automatically launch an in-memory database if no local instance is running)

### Setup Instructions

1. **Clone the repository** (or navigate to the workspace directory).
2. **Install frontend dependencies** (in the root directory):
   ```bash
   npm install
   ```
3. **Install backend dependencies** (in the `server` directory):
   ```bash
   cd server
   npm install
   ```

### Running the Application

To run the application locally, you must run both the backend API server and the frontend Vite development server:

#### 1. Start the Backend API Server:
In the `server` directory:
```bash
npm run dev
```
*Note: The server runs on `http://localhost:5000`. On first launch, if the database is empty, it will automatically populate default credentials and mock data.*

#### 2. Start the Frontend client:
In the root directory (in a separate terminal window):
```bash
npm run dev
```
*Note: The React client will launch on `http://localhost:5173`.*

---

## Credentials (Test Accounts)

Use the following seeded accounts to verify different role behaviors:

| Role | Email Address | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@genessence.com` | `admin123` | Full access, delete projects, remove files, manage users |
| **Manager** | `manager@genessence.com` | `manager123` | Add/Edit projects, upload files, read everything |
| **Viewer** | `viewer@genessence.com` | `viewer123` | Read-only access, search and export, download files |

---

## Production Deployment

### Database Setup (MongoDB Atlas)

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and copy the connection string.
3. In production environments, set the `MONGO_URI` environment variable to this connection string.

### Backend Deployment (Render / Railway / Heroku)

Deploy the `server` folder to your backend hosting platform:
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `MONGO_URI`: Your MongoDB Atlas connection string.
  - `JWT_SECRET`: A secure random string for signing JWT tokens.
  - `PORT`: `5000` (or host-assigned port).
  - `NODE_ENV`: `production` (will automatically serve the built static client if integrated).

### Frontend Deployment (Vercel / Netlify / Cloudflare)

Deploy the root project directory to your hosting platform:
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- *Note: Ensure API fetch links in `src/context/AuthContext.jsx` are configured to point to your live backend domain in production instead of localhost.*
