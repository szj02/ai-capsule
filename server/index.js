require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const capsuleRoutes = require('./routes/capsules');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Public health check - must stay unauthenticated.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// OAuth + session routes (public).
app.use('/auth', authRoutes);

// Protected CRUD API (JWT middleware is applied inside capsuleRoutes).
app.use('/api/capsules', capsuleRoutes);

// Serve the built React app (client/dist) and let React Router handle
// client-side routes like /login and /dashboard.
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`AI Capsule server running on port ${PORT}`);
});
