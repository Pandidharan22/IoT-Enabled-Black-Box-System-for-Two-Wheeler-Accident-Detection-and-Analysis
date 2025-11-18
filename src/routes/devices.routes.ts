import { Router, Request, Response, NextFunction } from 'express';
import {
  getDevice,
  getDevicesByUser,
  createDevice,
  updateDevice,
} from '../services/database.service';
import {
  deviceCreateSchema,
  deviceUpdateSchema,
  deviceQuerySchema,
  deviceIdParamSchema,
} from '../models/schemas';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('DevicesRoutes');

// ============================================================
// DEVICE ROUTES
// ============================================================

/**
 * GET /api/devices
 * List all devices for the authenticated user
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate query parameters
    const filters = deviceQuerySchema.parse(req.query);

    // Get user ID from JWT token (assumes auth middleware sets req.user)
    const userId = (req as any).user?.id;

    const devices = await getDevicesByUser(userId, filters);

    res.json({
      success: true,
      data: devices,
      count: devices.length,
    });
  } catch (error) {
    logger.error('Error fetching devices:', error);
    next(error);
  }
});

/**
 * GET /api/devices/:deviceId
 * Get device details by device ID
 */
router.get('/:deviceId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate device ID
    const { deviceId } = deviceIdParamSchema.parse(req.params);

    const device = await getDevice(deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
      });
    }

    // Verify user owns this device
    const userId = (req as any).user?.id;
    if (device.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: device,
    });
  } catch (error) {
    logger.error('Error fetching device:', error);
    next(error);
  }
});

/**
 * GET /api/devices/:deviceId/status
 * Get quick device status (last seen, battery, status)
 */
router.get('/:deviceId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate device ID
    const { deviceId } = deviceIdParamSchema.parse(req.params);

    const device = await getDevice(deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
      });
    }

    // Verify user owns this device
    const userId = (req as any).user?.id;
    if (device.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Return only status-related fields
    res.json({
      success: true,
      data: {
        device_id: device.device_id,
        device_name: device.device_name,
        status: device.status,
        last_seen: device.last_seen,
        battery_level: device.battery_level,
        is_active: device.is_active,
      },
    });
  } catch (error) {
    logger.error('Error fetching device status:', error);
    next(error);
  }
});

/**
 * POST /api/devices
 * Register a new device
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate device data
    const deviceData = deviceCreateSchema.parse(req.body);

    // Get user ID from JWT token
    const userId = (req as any).user?.id;

    // Check if device already exists
    const existingDevice = await getDevice(deviceData.device_id);
    if (existingDevice) {
      return res.status(409).json({
        success: false,
        error: 'Device already registered',
      });
    }

    // Create device
    const device = await createDevice({
      ...deviceData,
      user_id: userId,
    });

    res.status(201).json({
      success: true,
      data: device,
      message: 'Device registered successfully',
    });
  } catch (error) {
    logger.error('Error creating device:', error);
    next(error);
  }
});

/**
 * PATCH /api/devices/:deviceId
 * Update device details
 */
router.patch('/:deviceId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate device ID and updates
    const { deviceId } = deviceIdParamSchema.parse(req.params);
    const updates = deviceUpdateSchema.parse(req.body);

    // Verify device exists and user owns it
    const device = await getDevice(deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
      });
    }

    const userId = (req as any).user?.id;
    if (device.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Update device
    const updatedDevice = await updateDevice(deviceId, updates);

    res.json({
      success: true,
      data: updatedDevice,
      message: 'Device updated successfully',
    });
  } catch (error) {
    logger.error('Error updating device:', error);
    next(error);
  }
});

export default router;
