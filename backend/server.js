// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const aiRoutes = require('./routes/aiRoutes');

dotenv.config();

const path = require('path');

const app = express();
app.use(express.json());  // Parses JSON input.
app.use(cors());  // Allows calls from frontend later.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectDB();  // Connect to MongoDB.

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/ai', aiRoutes);

// Serve frontend static assets
app.use(express.static(path.join(__dirname, '../frontend')));

// Wildcard route to serve frontend index.html
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use(errorHandler);  // Global error catcher.

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));