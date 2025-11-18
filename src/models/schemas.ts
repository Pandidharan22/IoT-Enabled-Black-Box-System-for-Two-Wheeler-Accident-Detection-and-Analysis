import { z } from 'zod';
import { DeviceStatus, EventSeverity, PanicTriggerType } from '../types/database';

/**
 * Zod validation schemas for API request validation
 * Ensures data integrity at the API boundary
 */

// ============================================================
// COMMON SCHEMAS
// ============================================================

const vector3DSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

const positionSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  altitude: z.number().optional(),
});

// ============================================================
// USER SCHEMAS
// ============================================================

export const userCreateSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1, 'Full name is required'),
  phone_number: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
});

export const userUpdateSchema = z.object({
  full_name: z.string().min(1).optional(),
  phone_number: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  is_active: z.boolean().optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// ============================================================
// DEVICE SCHEMAS
// ============================================================

export const deviceCreateSchema = z.object({
  device_id: z.string().min(1, 'Device ID is required'),
  device_name: z.string().optional(),
  firmware_version: z.string().optional(),
});

export const deviceUpdateSchema = z.object({
  device_name: z.string().optional(),
  firmware_version: z.string().optional(),
  battery_level: z.number().min(0).max(100).optional(),
  status: z.nativeEnum(DeviceStatus).optional(),
  is_active: z.boolean().optional(),
});

export const deviceQuerySchema = z.object({
  status: z.nativeEnum(DeviceStatus).optional(),
  is_active: z.boolean().optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
});

// ============================================================
// CRASH EVENT SCHEMAS
// ============================================================

export const crashEventCreateSchema = z.object({
  device_id: z.string().min(1, 'Device ID is required'),
  event_timestamp: z.string().datetime().or(z.date()),
  location_lat: z.number().min(-90).max(90),
  location_lon: z.number().min(-180).max(180),
  altitude: z.number().optional(),
  impact_force: z.number().min(0).optional(),
  impact_direction: z.string().optional(),
  tilt_angle: z.number().min(0).max(180).optional(),
  pre_event_speed_avg: z.number().min(0).optional(),
  pre_event_heading: z.number().min(0).max(360).optional(),
  pre_event_accel: vector3DSchema.optional(),
  pre_event_gyro: vector3DSchema.optional(),
  post_event_accel: vector3DSchema.optional(),
  post_event_gyro: vector3DSchema.optional(),
  post_event_position: positionSchema.optional(),
  severity: z.nativeEnum(EventSeverity).optional(),
  injury_probability: z.number().min(0).max(100).optional(),
});

export const crashEventUpdateSchema = z.object({
  severity: z.nativeEnum(EventSeverity).optional(),
  injury_probability: z.number().min(0).max(100).optional(),
  emergency_contacts_notified: z.boolean().optional(),
  first_responder_contacted: z.boolean().optional(),
  is_reviewed: z.boolean().optional(),
  review_notes: z.string().optional(),
});

export const crashEventQuerySchema = z.object({
  device_id: z.string().optional(),
  severity: z.nativeEnum(EventSeverity).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  is_reviewed: z.string().transform((val) => val === 'true').optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
});

// ============================================================
// PANIC EVENT SCHEMAS
// ============================================================

export const panicEventCreateSchema = z.object({
  device_id: z.string().min(1, 'Device ID is required'),
  event_timestamp: z.string().datetime().or(z.date()),
  location_lat: z.number().min(-90).max(90),
  location_lon: z.number().min(-180).max(180),
  device_speed: z.number().min(0).optional(),
  device_heading: z.number().min(0).max(360).optional(),
  triggered_by: z.nativeEnum(PanicTriggerType),
});

export const panicEventUpdateSchema = z.object({
  emergency_contacts_notified: z.boolean().optional(),
  ambulance_requested: z.boolean().optional(),
  police_requested: z.boolean().optional(),
  is_false_alarm: z.boolean().optional(),
  resolved_at: z.string().datetime().or(z.date()).optional(),
  rider_status: z.string().optional(),
  notes: z.string().optional(),
});

export const panicEventQuerySchema = z.object({
  device_id: z.string().optional(),
  triggered_by: z.nativeEnum(PanicTriggerType).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  is_false_alarm: z.string().transform((val) => val === 'true').optional(),
  resolved: z.string().transform((val) => val === 'true' ? 'true' : 'false').optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
});

// ============================================================
// EMERGENCY CONTACT SCHEMAS
// ============================================================

export const emergencyContactCreateSchema = z.object({
  contact_name: z.string().min(1, 'Contact name is required'),
  phone_number: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email format').optional(),
  whatsapp_number: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  relationship: z.string().optional(),
  is_primary: z.boolean().optional(),
});

export const emergencyContactUpdateSchema = z.object({
  contact_name: z.string().min(1).optional(),
  phone_number: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  email: z.string().email().optional(),
  whatsapp_number: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  relationship: z.string().optional(),
  is_primary: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

// ============================================================
// CONSENT SCHEMAS
// ============================================================

export const userConsentCreateSchema = z.object({
  consent_type: z.string().min(1, 'Consent type is required'),
  consent_given: z.boolean(),
  expires_at: z.string().datetime().or(z.date()).optional(),
  ip_address: z.string().optional(),
  device_fingerprint: z.string().optional(),
  consent_text: z.string().optional(),
});

// ============================================================
// DATA RETENTION POLICY SCHEMAS
// ============================================================

export const dataRetentionPolicyCreateSchema = z.object({
  telemetry_retention_days: z.number().min(1).max(3650).optional(),
  crash_event_retention_days: z.number().min(1).max(3650).optional(),
  panic_event_retention_days: z.number().min(1).max(3650).optional(),
  diagnostics_retention_days: z.number().min(1).max(3650).optional(),
  auto_delete_enabled: z.boolean().optional(),
});

export const dataRetentionPolicyUpdateSchema = z.object({
  telemetry_retention_days: z.number().min(1).max(3650).optional(),
  crash_event_retention_days: z.number().min(1).max(3650).optional(),
  panic_event_retention_days: z.number().min(1).max(3650).optional(),
  diagnostics_retention_days: z.number().min(1).max(3650).optional(),
  auto_delete_enabled: z.boolean().optional(),
});

// ============================================================
// MQTT MESSAGE SCHEMAS
// ============================================================

export const telemetryMessageSchema = z.object({
  deviceId: z.string(),
  timestamp: z.string().datetime().or(z.date()),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    altitude: z.number().optional(),
  }),
  speed: z.number().min(0),
  heading: z.number().min(0).max(360),
  battery_level: z.number().min(0).max(100).optional(),
  accelerometer: vector3DSchema.optional(),
  gyroscope: vector3DSchema.optional(),
});

export const crashEventMessageSchema = z.object({
  deviceId: z.string(),
  timestamp: z.string().datetime().or(z.date()),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    altitude: z.number().optional(),
  }),
  impactForce: z.number().min(0),
  impactDirection: z.string(),
  tiltAngle: z.number().min(0).max(180),
  preEventData: z.object({
    speedAvg: z.number().min(0),
    heading: z.number().min(0).max(360),
    accel: vector3DSchema,
    gyro: vector3DSchema,
  }),
  postEventData: z.object({
    accel: vector3DSchema,
    gyro: vector3DSchema,
    position: positionSchema,
  }),
});

export const panicEventMessageSchema = z.object({
  deviceId: z.string(),
  timestamp: z.string().datetime().or(z.date()),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  triggeredBy: z.enum(['manual', 'auto']),
});

// ============================================================
// PARAM VALIDATION SCHEMAS
// ============================================================

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export const deviceIdParamSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
});

export const eventIdParamSchema = z.object({
  eventId: z.string().uuid('Invalid event ID format'),
});
