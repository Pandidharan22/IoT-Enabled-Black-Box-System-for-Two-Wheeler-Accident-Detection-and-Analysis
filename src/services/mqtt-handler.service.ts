import { createLogger } from '../utils/logger';
import { mqttClient, MessageType } from '../mqtt/client';
import {
  updateDeviceStatus,
  updateDeviceBattery,
  getDevice,
} from './database.service';
import {
  processCrashEvent,
  processPanicEvent,
} from './event.service';
import {
  telemetryMessageSchema,
  crashEventMessageSchema,
  panicEventMessageSchema,
} from '../models/schemas';
import { PanicTriggerType } from '../types/database';

const logger = createLogger('MQTTHandler');

/**
 * MQTT Message Handler
 * Processes incoming MQTT messages and integrates with PostgreSQL
 * Handles telemetry updates, crash events, and panic events
 */

// ============================================================
// TELEMETRY HANDLER
// ============================================================

/**
 * Handle regular telemetry messages (QoS 0)
 * Updates device status and battery level in PostgreSQL
 */
async function handleTelemetry(message: any): Promise<void> {
  try {
    // Validate message structure
    const validated = telemetryMessageSchema.parse(message);

    logger.debug(`Processing telemetry from device: ${validated.deviceId}`);

    // Check if device exists
    const device = await getDevice(validated.deviceId);
    if (!device) {
      logger.warn(`Device not found, skipping telemetry: ${validated.deviceId}`);
      return;
    }

    // Update device status to 'online'
    await updateDeviceStatus(validated.deviceId, 'online', new Date());

    // Update battery level if present
    if (validated.battery_level !== undefined) {
      await updateDeviceBattery(validated.deviceId, validated.battery_level);
    }

    logger.debug(`Telemetry processed for device: ${validated.deviceId}`);

    // TODO: Store telemetry in InfluxDB (existing code should handle this)
    // The telemetry service should be called here to store in InfluxDB
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      logger.error('Invalid telemetry message format:', error);
    } else {
      logger.error('Error processing telemetry:', error);
    }
  }
}

// ============================================================
// CRASH EVENT HANDLER
// ============================================================

/**
 * Handle crash event messages (QoS 2)
 * Saves event to PostgreSQL and prepares notifications
 */
async function handleCrashEvent(message: any): Promise<void> {
  try {
    // Validate message structure
    const validated = crashEventMessageSchema.parse(message);

    logger.info(`🚨 Processing CRASH EVENT from device: ${validated.deviceId}`);

    // Check if device exists
    const device = await getDevice(validated.deviceId);
    if (!device) {
      logger.error(`Device not found for crash event: ${validated.deviceId}`);
      return;
    }

    // Prepare crash event data
    const crashData = {
      device_id: validated.deviceId,
      user_id: device.user_id,
      event_timestamp: new Date(validated.timestamp),
      location_lat: validated.location.lat,
      location_lon: validated.location.lon,
      altitude: validated.location.altitude,
      impact_force: validated.impactForce,
      impact_direction: validated.impactDirection,
      tilt_angle: validated.tiltAngle,
      pre_event_speed_avg: validated.preEventData.speedAvg,
      pre_event_heading: validated.preEventData.heading,
      pre_event_accel: validated.preEventData.accel,
      pre_event_gyro: validated.preEventData.gyro,
      post_event_accel: validated.postEventData.accel,
      post_event_gyro: validated.postEventData.gyro,
      post_event_position: validated.postEventData.position,
    };

    // Process crash event (saves to DB, classifies severity, gets emergency contacts)
    const result = await processCrashEvent(crashData);

    logger.info(`Crash event saved: ${result.event.id}, Severity: ${result.event.severity}`);

    // TODO: Send notifications to emergency contacts
    // This is where you would integrate with SMS/Email/WhatsApp services
    if (result.notificationPayload) {
      logger.info('Notification payload ready:', {
        eventId: result.notificationPayload.eventId,
        contacts: result.notificationPayload.emergencyContacts.length,
        severity: result.notificationPayload.severity,
      });

      // Placeholder for notification service
      // await notificationService.sendEmergencyAlert(result.notificationPayload);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      logger.error('Invalid crash event message format:', error);
    } else {
      logger.error('Error processing crash event:', error);
    }
  }
}

// ============================================================
// PANIC EVENT HANDLER
// ============================================================

/**
 * Handle panic button messages (QoS 2)
 * Saves event to PostgreSQL and prepares notifications
 */
async function handlePanicEvent(message: any): Promise<void> {
  try {
    // Validate message structure
    const validated = panicEventMessageSchema.parse(message);

    logger.info(`🆘 Processing PANIC EVENT from device: ${validated.deviceId}`);

    // Check if device exists
    const device = await getDevice(validated.deviceId);
    if (!device) {
      logger.error(`Device not found for panic event: ${validated.deviceId}`);
      return;
    }

    // Prepare panic event data
    const panicData = {
      device_id: validated.deviceId,
      user_id: device.user_id,
      event_timestamp: new Date(validated.timestamp),
      location_lat: validated.location.lat,
      location_lon: validated.location.lon,
      device_speed: validated.speed,
      device_heading: validated.heading,
      triggered_by: validated.triggeredBy === 'manual' 
        ? PanicTriggerType.MANUAL_BUTTON 
        : PanicTriggerType.AUTO_DETECT,
    };

    // Process panic event (saves to DB, gets emergency contacts)
    const result = await processPanicEvent(panicData);

    logger.info(`Panic event saved: ${result.event.id}`);

    // TODO: Send notifications to emergency contacts
    // This is where you would integrate with SMS/Email/WhatsApp services
    if (result.notificationPayload) {
      logger.info('Notification payload ready:', {
        eventId: result.notificationPayload.eventId,
        contacts: result.notificationPayload.emergencyContacts.length,
        triggeredBy: result.notificationPayload.triggeredBy,
      });

      // Placeholder for notification service
      // await notificationService.sendEmergencyAlert(result.notificationPayload);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      logger.error('Invalid panic event message format:', error);
    } else {
      logger.error('Error processing panic event:', error);
    }
  }
}

// ============================================================
// HANDLER REGISTRATION
// ============================================================

/**
 * Register all MQTT message handlers
 * Should be called after database initialization
 */
export function registerMQTTHandlers(): void {
  logger.info('Registering MQTT message handlers...');

  // Register telemetry handler (QoS 0)
  mqttClient.on(MessageType.TELEMETRY, handleTelemetry);
  logger.info('✓ Telemetry handler registered');

  // Register crash event handler (QoS 2)
  mqttClient.on(MessageType.CRASH, handleCrashEvent);
  logger.info('✓ Crash event handler registered');

  // Register panic event handler (QoS 2)
  mqttClient.on(MessageType.PANIC, handlePanicEvent);
  logger.info('✓ Panic event handler registered');

  logger.info('All MQTT message handlers registered successfully');
}

/**
 * Unregister all MQTT message handlers
 * Should be called during graceful shutdown
 */
export function unregisterMQTTHandlers(): void {
  logger.info('Unregistering MQTT message handlers...');

  mqttClient.removeAllListeners(MessageType.TELEMETRY);
  mqttClient.removeAllListeners(MessageType.CRASH);
  mqttClient.removeAllListeners(MessageType.PANIC);

  logger.info('All MQTT message handlers unregistered');
}

export default {
  registerMQTTHandlers,
  unregisterMQTTHandlers,
  handleTelemetry,
  handleCrashEvent,
  handlePanicEvent,
};
