import { Router } from 'express';
import eventsRoutes from '../../routes/events.routes';
import devicesRoutes from '../../routes/devices.routes';

const router = Router();

// API routes
router.use('/events', eventsRoutes);
router.use('/devices', devicesRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;