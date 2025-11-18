import { createLogger } from '../utils/logger';
import {
  CrashEventCreateInput,
  PanicEventCreateInput,
  EventSeverity,
} from '../types/database';
import {
  saveCrashEvent,
  savePanicEvent,
  getDevice,
  getEmergencyContacts,
  updateCrashEvent,
  updatePanicEvent,
} from './database.service';

const logger = createLogger('EventService');

/**
 * Event Service
 * Business logic for crash and panic events
 * Includes severity classification and notification preparation
 */

// ============================================================
// SEVERITY CLASSIFICATION
// ============================================================

/**
 * Classify crash severity based on impact data
 * @param impactForce - G-force of impact
 * @param tiltAngle - Tilt angle in degrees
 * @returns EventSeverity classification
 */
export function classifyCrashSeverity(impactForce?: number, tiltAngle?: number): EventSeverity {
  // Critical: Very high impact or severe tilt
  if ((impactForce && impactForce > 8) || (tiltAngle && tiltAngle > 70)) {
    return EventSeverity.CRITICAL;
  }

  // High: High impact or significant tilt
  if ((impactForce && impactForce > 5) || (tiltAngle && tiltAngle > 45)) {
    return EventSeverity.HIGH;
  }

  // Medium: Moderate impact or tilt
  if ((impactForce && impactForce > 3) || (tiltAngle && tiltAngle > 30)) {
    return EventSeverity.MEDIUM;
  }

  // Low: Minor impact
  return EventSeverity.LOW;
}

/**
 * Calculate injury probability based on crash data
 * @param impactForce - G-force of impact
 * @param tiltAngle - Tilt angle in degrees
 * @param speed - Speed before crash in km/h
 * @returns Injury probability percentage (0-100)
 */
export function calculateInjuryProbability(
  impactForce?: number,
  tiltAngle?: number,
  speed?: number
): number {
  let probability = 0;

  // Impact force contribution (0-40 points)
  if (impactForce) {
    probability += Math.min((impactForce / 10) * 40, 40);
  }

  // Tilt angle contribution (0-30 points)
  if (tiltAngle) {
    probability += Math.min((tiltAngle / 90) * 30, 30);
  }

  // Speed contribution (0-30 points)
  if (speed) {
    probability += Math.min((speed / 100) * 30, 30);
  }

  return Math.min(Math.round(probability), 100);
}

// ============================================================
// CRASH EVENT PROCESSING
// ============================================================

/**
 * Process and save crash event
 * Includes severity classification and emergency contact notification
 */
export async function processCrashEvent(crashData: CrashEventCreateInput): Promise<any> {
  try {
    logger.info(`Processing crash event for device: ${crashData.device_id}`);

    // Classify severity
    const severity = classifyCrashSeverity(crashData.impact_force, crashData.tilt_angle);
    
    // Calculate injury probability
    const injuryProbability = calculateInjuryProbability(
      crashData.impact_force,
      crashData.tilt_angle,
      crashData.pre_event_speed_avg
    );

    // Create crash event with classification
    const eventData = {
      ...crashData,
      severity,
      injury_probability: injuryProbability,
    };

    // Save to database
    const savedEvent = await saveCrashEvent(eventData);

    // Get device info to find user
    const device = await getDevice(crashData.device_id);
    if (!device) {
      logger.error(`Device not found: ${crashData.device_id}`);
      return { event: savedEvent, notificationPayload: null };
    }

    // Get emergency contacts
    const emergencyContacts = await getEmergencyContacts(device.user_id);

    // Prepare notification payload
    const notificationPayload = {
      eventId: savedEvent.id,
      deviceId: crashData.device_id,
      deviceName: device.device_name || crashData.device_id,
      eventType: 'crash',
      severity,
      injuryProbability,
      location: {
        lat: crashData.location_lat,
        lon: crashData.location_lon,
      },
      timestamp: crashData.event_timestamp,
      emergencyContacts: emergencyContacts.map((contact) => ({
        name: contact.contact_name,
        phone: contact.phone_number,
        email: contact.email,
        whatsapp: contact.whatsapp_number,
        isPrimary: contact.is_primary,
      })),
      message: `🚨 CRASH DETECTED - ${severity.toUpperCase()} SEVERITY\n` +
        `Device: ${device.device_name || crashData.device_id}\n` +
        `Location: ${crashData.location_lat}, ${crashData.location_lon}\n` +
        `Impact Force: ${crashData.impact_force?.toFixed(2)}G\n` +
        `Injury Probability: ${injuryProbability}%\n` +
        `Time: ${new Date(crashData.event_timestamp).toLocaleString()}`,
    };

    logger.info(`Crash event processed: ${savedEvent.id}, Severity: ${severity}`);

    return {
      event: savedEvent,
      notificationPayload,
    };
  } catch (error) {
    logger.error('Error processing crash event:', error);
    throw error;
  }
}

// ============================================================
// PANIC EVENT PROCESSING
// ============================================================

/**
 * Process and save panic event
 * Includes emergency contact notification preparation
 */
export async function processPanicEvent(panicData: PanicEventCreateInput): Promise<any> {
  try {
    logger.info(`Processing panic event for device: ${panicData.device_id}`);

    // Save to database
    const savedEvent = await savePanicEvent(panicData);

    // Get device info to find user
    const device = await getDevice(panicData.device_id);
    if (!device) {
      logger.error(`Device not found: ${panicData.device_id}`);
      return { event: savedEvent, notificationPayload: null };
    }

    // Get emergency contacts
    const emergencyContacts = await getEmergencyContacts(device.user_id);

    // Prepare notification payload
    const notificationPayload = {
      eventId: savedEvent.id,
      deviceId: panicData.device_id,
      deviceName: device.device_name || panicData.device_id,
      eventType: 'panic',
      severity: 'high',
      location: {
        lat: panicData.location_lat,
        lon: panicData.location_lon,
      },
      timestamp: panicData.event_timestamp,
      triggeredBy: panicData.triggered_by,
      emergencyContacts: emergencyContacts.map((contact) => ({
        name: contact.contact_name,
        phone: contact.phone_number,
        email: contact.email,
        whatsapp: contact.whatsapp_number,
        isPrimary: contact.is_primary,
      })),
      message: `🆘 PANIC BUTTON ACTIVATED\n` +
        `Device: ${device.device_name || panicData.device_id}\n` +
        `Triggered: ${panicData.triggered_by === 'manual_button' ? 'Manual Button' : 'Auto-Detect'}\n` +
        `Location: ${panicData.location_lat}, ${panicData.location_lon}\n` +
        `Speed: ${panicData.device_speed?.toFixed(1)} km/h\n` +
        `Time: ${new Date(panicData.event_timestamp).toLocaleString()}`,
    };

    logger.info(`Panic event processed: ${savedEvent.id}`);

    return {
      event: savedEvent,
      notificationPayload,
    };
  } catch (error) {
    logger.error('Error processing panic event:', error);
    throw error;
  }
}

// ============================================================
// NOTIFICATION TRACKING
// ============================================================

/**
 * Mark crash event notifications as sent
 */
export async function markCrashNotificationsSent(eventId: string, attempts: number): Promise<void> {
  try {
    await updateCrashEvent(eventId, {
      emergency_contacts_notified: true,
      notification_attempts: attempts,
    });
    logger.info(`Crash event notifications marked as sent: ${eventId}`);
  } catch (error) {
    logger.error('Error marking crash notifications:', error);
    throw error;
  }
}

/**
 * Mark panic event notifications as sent
 */
export async function markPanicNotificationsSent(eventId: string, attempts: number): Promise<void> {
  try {
    await updatePanicEvent(eventId, {
      emergency_contacts_notified: true,
      notification_attempts: attempts,
    });
    logger.info(`Panic event notifications marked as sent: ${eventId}`);
  } catch (error) {
    logger.error('Error marking panic notifications:', error);
    throw error;
  }
}

export default {
  classifyCrashSeverity,
  calculateInjuryProbability,
  processCrashEvent,
  processPanicEvent,
  markCrashNotificationsSent,
  markPanicNotificationsSent,
};
