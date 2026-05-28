# StoreHelper - Portfolio Project Notes

## Project Summary
A full-stack Store Inventory & Sales Tracker built as a portfolio project for a mid-level software developer role.

## Tech Stack
- **Frontend**: React (Vite) + TypeScript + Ant Design + Recharts + React Router v6
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas (free tier)
- **Hosting**: Render (both frontend and backend)

## Features
- User registration and login (JWT auth)
- Product management with SKU, cost price, selling price, stock quantity
- Category management
- Low stock threshold alerts (per-product configurable)
- Sales recording with multiple line items per transaction
- Automatic stock deduction on sale
- Server-side pagination and search
- Dashboard with KPI stats (revenue, profit, low stock count)
- Line chart: Revenue & Profit over last 30 days
- Bar chart: Top 5 products by units sold
- Date range filter on sales
- Responsive sidebar layout

## Project Structure
```
store-helper/
├── backend/
│   ├── src/
│   │   ├── models/       # User.js, Category.js, Product.js, Sale.js
│   │   ├── routes/       # auth.js, products.js, categories.js, sales.js, dashboard.js
│   │   ├── middleware/   # auth.js (JWT)
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/        # LoginPage, RegisterPage, DashboardPage, ProductsPage, CategoriesPage, SalesPage
    │   ├── components/   # AppLayout
    │   ├── context/      # AuthContext
    │   ├── services/     # api.ts (axios)
    │   └── types/        # index.ts
    ├── public/
    │   └── _redirects    # Render SPA routing fix
    ├── .env.example
    └── package.json
```

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/store-helper
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend.onrender.com/api
```

## Running Locally
```bash
# Backend
cd backend
npm install
cp .env.example .env  # fill in values
npm run dev           # runs on port 5000

# Frontend
cd frontend
npm install
npm run dev           # runs on port 5173
```

## Deployment Notes
- Backend deployed as a **Web Service** on Render
- Frontend deployed as a **Static Site** on Render
- `frontend/public/_redirects` handles React Router on Render
- Render free tier backend spins down after inactivity (~30s cold start)
- VITE_API_URL must be set before build time (Vite bakes it in at build)
