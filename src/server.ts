// ==================== Actualizar src/server.ts ====================
import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
// import { rateLimiter } from './middleware/rateLimiter';

// Import all routes
import servicesRoutes from './routes/services';
import reviewsRoutes from './routes/reviews';
import categoriesRoutes from './routes/categories';
import storageRoutes from './routes/storage';


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    endpoints: {
      services: '/api/services',
      reviews: '/api/reviews', 
      categories: '/api/categories',
      storage: '/api/storage'
    }
  });
});

// API Routes
app.use('/api/services', servicesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/storage', storageRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API endpoints:`);
  console.log(`   Services: http://localhost:${PORT}/api/services`);
  console.log(`   Reviews: http://localhost:${PORT}/api/reviews`);
  console.log(`   Categories: http://localhost:${PORT}/api/categories`);
  console.log(`   Storage: http://localhost:${PORT}/api/storage`);
});

export default app;