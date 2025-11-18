import { Router, Request, Response, NextFunction } from 'express';
import {
  getCrashEvent,
  getCrashEvents,
  updateCrashEvent,
  getPanicEvent,
  getPanicEvents,
  updatePanicEvent,
} from '../services/database.service';
import {
  crashEventQuerySchema,
  crashEventUpdateSchema,
  panicEventQuerySchema,
  panicEventUpdateSchema,
  eventIdParamSchema,
} from '../models/schemas';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('EventsRoutes');

// ============================================================
// CRASH EVENT ROUTES
// ============================================================

/**
 * GET /api/events/crashes
 * List crash events with filters
 */
router.get('/crashes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate query parameters
    const filters = crashEventQuerySchema.parse(req.query);

    // Add user ID from JWT token (assumes auth middleware sets req.user)
    const userId = (req as any).user?.id;
    const queryFilters = {
      ...filters,
      user_id: userId,
      start_date: filters.start_date ? new Date(filters.start_date) : undefined,
      end_date: filters.end_date ? new Date(filters.end_date) : undefined,
    };

    const events = await getCrashEvents(queryFilters);

    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    logger.error('Error fetching crash events:', error);
    next(error);
  }
});

/**
 * GET /api/events/crashes/:eventId
 * Get crash event details by ID
 */
router.get('/crashes/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate event ID
    const { eventId } = eventIdParamSchema.parse(req.params);

    const event = await getCrashEvent(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Crash event not found',
      });
    }

    // Verify user owns this event (assumes auth middleware)
    const userId = (req as any).user?.id;
    if (event.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    logger.error('Error fetching crash event:', error);
    next(error);
  }
});

/**
 * PATCH /api/events/crashes/:eventId
 * Update crash event (for review, notes, etc.)
 */
router.patch('/crashes/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate event ID and updates
    const { eventId } = eventIdParamSchema.parse(req.params);
    const updates = crashEventUpdateSchema.parse(req.body);

    // Verify event exists and user owns it
    const event = await getCrashEvent(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Crash event not found',
      });
    }

    const userId = (req as any).user?.id;
    if (event.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Update event
    const updatedEvent = await updateCrashEvent(eventId, updates);

    res.json({
      success: true,
      data: updatedEvent,
      message: 'Crash event updated successfully',
    });
  } catch (error) {
    logger.error('Error updating crash event:', error);
    next(error);
  }
});

// ============================================================
// PANIC EVENT ROUTES
// ============================================================

/**
 * GET /api/events/panics
 * List panic events with filters
 */
router.get('/panics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate query parameters
    const filters = panicEventQuerySchema.parse(req.query);

    // Add user ID from JWT token
    const userId = (req as any).user?.id;
    const queryFilters = {
      ...filters,
      user_id: userId,
      start_date: filters.start_date ? new Date(filters.start_date) : undefined,
      end_date: filters.end_date ? new Date(filters.end_date) : undefined,
      resolved: filters.resolved === 'true' ? true : filters.resolved === 'false' ? false : undefined,
    };

    const events = await getPanicEvents(queryFilters);

    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    logger.error('Error fetching panic events:', error);
    next(error);
  }
});

/**
 * GET /api/events/panics/:eventId
 * Get panic event details by ID
 */
router.get('/panics/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate event ID
    const { eventId } = eventIdParamSchema.parse(req.params);

    const event = await getPanicEvent(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Panic event not found',
      });
    }

    // Verify user owns this event
    const userId = (req as any).user?.id;
    if (event.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    logger.error('Error fetching panic event:', error);
    next(error);
  }
});

/**
 * PATCH /api/events/panics/:eventId
 * Update panic event (mark resolved, add notes, etc.)
 */
router.patch('/panics/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate event ID and updates
    const { eventId } = eventIdParamSchema.parse(req.params);
    const updates = panicEventUpdateSchema.parse(req.body);

    // Verify event exists and user owns it
    const event = await getPanicEvent(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Panic event not found',
      });
    }

    const userId = (req as any).user?.id;
    if (event.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Convert resolved_at to Date if it's a string
    const processedUpdates = {
      ...updates,
      resolved_at: updates.resolved_at ? new Date(updates.resolved_at) : undefined,
    };

    // Update event
    const updatedEvent = await updatePanicEvent(eventId, processedUpdates);

    res.json({
      success: true,
      data: updatedEvent,
      message: 'Panic event updated successfully',
    });
  } catch (error) {
    logger.error('Error updating panic event:', error);
    next(error);
  }
});

export default router;
