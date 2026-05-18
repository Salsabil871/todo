// server.js - Main Express server entry point
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so the frontend can call the backend
app.use(cors({
  origin: true, // Allow all origins for Vercel deployment
  credentials: true
}));

// Parse incoming JSON request bodies
app.use(express.json());
app.use(express.static("public"));

app.use('/api', userRoutes);
app.use('/api', taskRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Todo API is running!' });
});

app.get('/health', async (req, res) => {
  try {
    res.status(200).json({
      status: 'OK',
      server: 'running'
    });
  } catch (err) {
    res.status(500).json({
      status: 'ERROR',
      error: err.message
    });
  }
});

// For Vercel deployment, export the app
module.exports = app;

// For local development, start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
