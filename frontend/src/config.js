// Single source of truth for the backend API base URL.
//
// Set VITE_API_URL in the environment (Vite reads it at build time):
//   - Local dev:  VITE_API_URL=http://localhost:5050/api   (see .env.example)
//   - Production: VITE_API_URL=https://<your-backend>.onrender.com/api  (set in Render)
//
// The localhost value below is only a development fallback for when VITE_API_URL
// is unset. There are no hardcoded production URLs anywhere in the app.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
