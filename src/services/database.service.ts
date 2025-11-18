import { PoolClient } from 'pg';
import { query, withTransaction } from '../config/database';
import { createLogger } from '../utils/logger';
import {
  User, UserCreateInput, UserUpdateInput,
  Device, DeviceCreateInput, DeviceUpdateInput, DeviceFilters,
  CrashEvent, CrashEventCreateInput, CrashEventUpdateInput, CrashEventFilters,
  PanicEvent, PanicEventCreateInput, PanicEventUpdateInput, PanicEventFilters,
  EmergencyContact, EmergencyContactCreateInput, EmergencyContactUpdateInput,
  UserConsent, UserConsentCreateInput,
  DataRetentionPolicy, DataRetentionPolicyCreateInput, DataRetentionPolicyUpdateInput,
} from '../types/database';

const logger = createLogger('DatabaseService');

/**
 * Database Service
 * Provides CRUD operations for all database entities
 * with transaction support and error handling
 */

// ============================================================
// USER OPERATIONS
// ============================================================

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<User | null> {
  try {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error fetching user:', error);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error fetching user by email:', error);
    throw error;
  }
}

/**
 * Create a new user
 */
export async function createUser(userData: UserCreateInput & { password_hash: string }): Promise<User> {
  try {
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, phone_number)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userData.email, userData.password_hash, userData.full_name, userData.phone_number]
    );
    logger.info(`User created: ${result.rows[0].id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Update user
 */
export async function updateUser(userId: string, updates: UserUpdateInput): Promise<User> {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.full_name !== undefined) {
      fields.push(`full_name = $${paramCount++}`);
      values.push(updates.full_name);
    }
    if (updates.phone_number !== undefined) {
      fields.push(`phone_number = $${paramCount++}`);
      values.push(updates.phone_number);
    }
    if (updates.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(updates.is_active);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(userId);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    logger.info(`User updated: ${userId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating user:', error);
    throw error;
  }
}

// ============================================================
// DEVICE OPERATIONS
// ============================================================

/**
 * Get device by device_id
 */
export async function getDevice(deviceId: string): Promise<Device | null> {
  try {
    const result = await query(
      'SELECT * FROM devices WHERE device_id = $1',
      [deviceId]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error fetching device:', error);
    throw error;
  }
}

/**
 * Get device by ID
 */
export async function getDeviceById(id: string): Promise<Device | null> {
  try {
    const result = await query(
      'SELECT * FROM devices WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error fetching device by ID:', error);
    throw error;
  }
}

/**
 * Get all devices for a user
 */
export async function getDevicesByUser(userId: string, filters?: DeviceFilters): Promise<Device[]> {
  try {
    const conditions: string[] = ['user_id = $1'];
    const values: any[] = [userId];
    let paramCount = 2;

    if (filters?.status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(filters.status);
    }

    if (filters?.is_active !== undefined) {
      conditions.push(`is_active = $${paramCount++}`);
      values.push(filters.is_active);
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const sql = `
      SELECT * FROM devices 
      WHERE ${conditions.join(' AND ')}
      ORDER BY last_seen DESC NULLS LAST
      LIMIT $${paramCount++} OFFSET $${paramCount}
    `;

    values.push(limit, offset);
    const result = await query(sql, values);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching devices by user:', error);
    throw error;
  }
}

/**
 * Create a new device
 */
export async function createDevice(deviceData: DeviceCreateInput): Promise<Device> {
  try {
    const result = await query(
      `INSERT INTO devices (device_id, user_id, device_name, firmware_version)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [deviceData.device_id, deviceData.user_id, deviceData.device_name, deviceData.firmware_version]
    );
    logger.info(`Device created: ${result.rows[0].device_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating device:', error);
    throw error;
  }
}

/**
 * Update device status and last_seen timestamp
 */
export async function updateDeviceStatus(
  deviceId: string,
  status: string,
  lastSeen: Date = new Date()
): Promise<void> {
  try {
    await query(
      'UPDATE devices SET status = $1, last_seen = $2 WHERE device_id = $3',
      [status, lastSeen, deviceId]
    );
    logger.debug(`Device status updated: ${deviceId} -> ${status}`);
  } catch (error) {
    logger.error('Error updating device status:', error);
    throw error;
  }
}

/**
 * Update device battery level
 */
export async function updateDeviceBattery(deviceId: string, batteryLevel: number): Promise<void> {
  try {
    await query(
      'UPDATE devices SET battery_level = $1 WHERE device_id = $2',
      [batteryLevel, deviceId]
    );
    logger.debug(`Device battery updated: ${deviceId} -> ${batteryLevel}%`);
  } catch (error) {
    logger.error('Error updating device battery:', error);
    throw error;
  }
}

/**
 * Update device
 */
export async function updateDevice(deviceId: string, updates: DeviceUpdateInput): Promise<Device> {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.device_name !== undefined) {
      fields.push(`device_name = $${paramCount++}`);
      values.push(updates.device_name);
    }
    if (updates.firmware_version !== undefined) {
      fields.push(`firmware_version = $${paramCount++}`);
      values.push(updates.firmware_version);
    }
    if (updates.last_seen !== undefined) {
      fields.push(`last_seen = $${paramCount++}`);
      values.push(updates.last_seen);
    }
    if (updates.battery_level !== undefined) {
      fields.push(`battery_level = $${paramCount++}`);
      values.push(updates.battery_level);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(updates.is_active);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(deviceId);
    const result = await query(
      `UPDATE devices SET ${fields.join(', ')} WHERE device_id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Device not found');
    }

    logger.info(`Device updated: ${deviceId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating device:', error);
    throw error;
  }
}

// ============================================================
// CRASH EVENT OPERATIONS
// ============================================================

/**
 * Save crash event with transaction
 */
export async function saveCrashEvent(eventData: CrashEventCreateInput): Promise<CrashEvent> {
  return await withTransaction(async (client: PoolClient) => {
    try {
      // Insert crash event
      const eventResult = await client.query(
        `INSERT INTO crash_events (
          device_id, user_id, event_timestamp,
          location_lat, location_lon, altitude,
          impact_force, impact_direction, tilt_angle,
          pre_event_speed_avg, pre_event_heading, pre_event_accel, pre_event_gyro,
          post_event_accel, post_event_gyro, post_event_position,
          severity, injury_probability
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *`,
        [
          eventData.device_id,
          eventData.user_id,
          eventData.event_timestamp,
          eventData.location_lat,
          eventData.location_lon,
          eventData.altitude,
          eventData.impact_force,
          eventData.impact_direction,
          eventData.tilt_angle,
          eventData.pre_event_speed_avg,
          eventData.pre_event_heading,
          JSON.stringify(eventData.pre_event_accel),
          JSON.stringify(eventData.pre_event_gyro),
          JSON.stringify(eventData.post_event_accel),
          JSON.stringify(eventData.post_event_gyro),
          JSON.stringify(eventData.post_event_position),
          eventData.severity || 'medium',
          eventData.injury_probability,
        ]
      );

      // Update device status to 'error'
      await client.query(
        'UPDATE devices SET status = $1, last_seen = $2 WHERE device_id = $3',
        ['error', new Date(), eventData.device_id]
      );

      logger.info(`Crash event saved: ${eventResult.rows[0].id}`);
      return eventResult.rows[0];
    } catch (error) {
      logger.error('Error saving crash event:', error);
      throw error;
    }
  });
}

/**
 * Get crash event by ID
 */
export async function getCrashEvent(eventId: string): Promise<CrashEvent | null> {
  try {
    const result = await query(
      'SELECT * FROM crash_events WHERE id = $1',
      [eventId]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error fetching crash event:', error);
    throw error;
  }
}

/**
 * Get crash events with filters
 */
export async function getCrashEvents(filters: CrashEventFilters): Promise<CrashEvent[]> {
  try {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (filters.device_id) {
      conditions.push(`device_id = $${paramCount++}`);
      values.push(filters.device_id);
    }

    if (filters.user_id) {
      conditions.push(`user_id = $${paramCount++}`);
      values.push(filters.user_id);
    }

    if (filters.severity) {
      conditions.push(`severity = $${paramCount++}`);
      values.push(filters.severity);
    }

    if (filters.start_date) {
      conditions.push(`event_timestamp >= $${paramCount++}`);
      values.push(filters.start_date);
    }

    if (filters.end_date) {
      conditions.push(`event_timestamp <= $${paramCount++}`);
      values.push(filters.end_date);
    }

    if (filters.is_reviewed !== undefined) {
      conditions.push(`is_reviewed = $${paramCount++}`);
      values.push(filters.is_reviewed);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const sql = `
      SELECT * FROM crash_events 
      ${whereClause}
      ORDER BY event_timestamp DESC
      LIMIT $${paramCount++} OFFSET $${paramCount}
    `;

    values.push(limit, offset);
    const result = await query(sql, values);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching crash events:', error);
    throw error;
  }
}

/**
 * Update crash event
 */
export async function updateCrashEvent(eventId: string, updates: CrashEventUpdateInput): Promise<CrashEvent> {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.severity !== undefined) {
      fields.push(`severity = $${paramCount++}`);
      values.push(updates.severity);
    }
    if (updates.injury_probability !== undefined) {
      fields.push(`injury_probability = $${paramCount++}`);
      values.push(updates.injury_probability);
    }
    if (updates.emergency_contacts_notified !== undefined) {
      fields.push(`emergency_contacts_notified = $${paramCount++}`);
      values.push(updates.emergency_contacts_notified);
    }
    if (updates.notification_attempts !== undefined) {
      fields.push(`notification_attempts = $${paramCount++}`);
      values.push(updates.notification_attempts);
    }
    if (updates.first_responder_contacted !== undefined) {
      fields.push(`first_responder_contacted = $${paramCount++}`);
      values.push(updates.first_responder_contacted);
    }
    if (updates.is_reviewed !== undefined) {
      fields.push(`is_reviewed = $${paramCount++}`);
      values.push(updates.is_reviewed);
    }
    if (updates.review_notes !== undefined) {
      fields.push(`review_notes = $${paramCount++}`);
      values.push(updates.review_notes);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(eventId);
    const result = await query(
      `UPDATE crash_events SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Crash event not found');
    }

    logger.info(`Crash event updated: ${eventId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating crash event:', error);
    throw error;
  }
}

// ============================================================
// PANIC EVENT OPERATIONS
// ============================================================

/**
 * Save panic event with transaction
 */
export async function savePanicEvent(eventData: PanicEventCreateInput): Promise<PanicEvent> {
  return await withTransaction(async (client: PoolClient) => {
    try {
      // Insert panic event
      const eventResult = await client.query(
        `INSERT INTO panic_events (
          device_id, user_id, event_timestamp,
          location_lat, location_lon,
          device_speed, device_heading, triggered_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          eventData.device_id,
          eventData.user_id,
          eventData.event_timestamp,
          eventData.location_lat,
          eventData.location_lon,
          eventData.device_speed,
          eventData.device_heading,
          eventData.triggered_by,
        ]
      );

      // Update device last_seen
      await client.query(
        'UPDATE devices SET last_seen = $1 WHERE device_id = $2',
        [new Date(), eventData.device_id]
      );

      logger.info(`Panic event saved: ${eventResult.rows[0].id}`);
      return eventResult.rows[0];
    } catch (error) {
      logger.error('Error saving panic event:', error);
      throw error;
    }
  });
}

/**
 * Get panic event by ID
 */
export async function getPanicEvent(eventId: string): Promise<PanicEvent | null> {
  try {
    const result = await query(
      'SELECT * FROM panic_events WHERE id = $1',
      [eventId]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error fetching panic event:', error);
    throw error;
  }
}

/**
 * Get panic events with filters
 */
export async function getPanicEvents(filters: PanicEventFilters): Promise<PanicEvent[]> {
  try {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (filters.device_id) {
      conditions.push(`device_id = $${paramCount++}`);
      values.push(filters.device_id);
    }

    if (filters.user_id) {
      conditions.push(`user_id = $${paramCount++}`);
      values.push(filters.user_id);
    }

    if (filters.triggered_by) {
      conditions.push(`triggered_by = $${paramCount++}`);
      values.push(filters.triggered_by);
    }

    if (filters.start_date) {
      conditions.push(`event_timestamp >= $${paramCount++}`);
      values.push(filters.start_date);
    }

    if (filters.end_date) {
      conditions.push(`event_timestamp <= $${paramCount++}`);
      values.push(filters.end_date);
    }

    if (filters.is_false_alarm !== undefined) {
      conditions.push(`is_false_alarm = $${paramCount++}`);
      values.push(filters.is_false_alarm);
    }

    if (filters.resolved !== undefined) {
      if (filters.resolved) {
        conditions.push(`resolved_at IS NOT NULL`);
      } else {
        conditions.push(`resolved_at IS NULL`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const sql = `
      SELECT * FROM panic_events 
      ${whereClause}
      ORDER BY event_timestamp DESC
      LIMIT $${paramCount++} OFFSET $${paramCount}
    `;

    values.push(limit, offset);
    const result = await query(sql, values);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching panic events:', error);
    throw error;
  }
}

/**
 * Update panic event
 */
export async function updatePanicEvent(eventId: string, updates: PanicEventUpdateInput): Promise<PanicEvent> {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.emergency_contacts_notified !== undefined) {
      fields.push(`emergency_contacts_notified = $${paramCount++}`);
      values.push(updates.emergency_contacts_notified);
    }
    if (updates.notification_attempts !== undefined) {
      fields.push(`notification_attempts = $${paramCount++}`);
      values.push(updates.notification_attempts);
    }
    if (updates.ambulance_requested !== undefined) {
      fields.push(`ambulance_requested = $${paramCount++}`);
      values.push(updates.ambulance_requested);
    }
    if (updates.police_requested !== undefined) {
      fields.push(`police_requested = $${paramCount++}`);
      values.push(updates.police_requested);
    }
    if (updates.is_false_alarm !== undefined) {
      fields.push(`is_false_alarm = $${paramCount++}`);
      values.push(updates.is_false_alarm);
    }
    if (updates.resolved_at !== undefined) {
      fields.push(`resolved_at = $${paramCount++}`);
      values.push(updates.resolved_at);
    }
    if (updates.rider_status !== undefined) {
      fields.push(`rider_status = $${paramCount++}`);
      values.push(updates.rider_status);
    }
    if (updates.notes !== undefined) {
      fields.push(`notes = $${paramCount++}`);
      values.push(updates.notes);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(eventId);
    const result = await query(
      `UPDATE panic_events SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Panic event not found');
    }

    logger.info(`Panic event updated: ${eventId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating panic event:', error);
    throw error;
  }
}

// ============================================================
// EMERGENCY CONTACT OPERATIONS
// ============================================================

/**
 * Get emergency contacts for a user
 */
export async function getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
  try {
    const result = await query(
      `SELECT * FROM emergency_contacts 
       WHERE user_id = $1 AND is_active = true 
       ORDER BY is_primary DESC, created_at ASC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error fetching emergency contacts:', error);
    throw error;
  }
}

/**
 * Create emergency contact
 */
export async function createEmergencyContact(contactData: EmergencyContactCreateInput): Promise<EmergencyContact> {
  try {
    const result = await query(
      `INSERT INTO emergency_contacts (
        user_id, contact_name, phone_number, email, whatsapp_number, relationship, is_primary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        contactData.user_id,
        contactData.contact_name,
        contactData.phone_number,
        contactData.email,
        contactData.whatsapp_number,
        contactData.relationship,
        contactData.is_primary || false,
      ]
    );
    logger.info(`Emergency contact created: ${result.rows[0].id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating emergency contact:', error);
    throw error;
  }
}

/**
 * Update emergency contact
 */
export async function updateEmergencyContact(
  contactId: string,
  updates: EmergencyContactUpdateInput
): Promise<EmergencyContact> {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.contact_name !== undefined) {
      fields.push(`contact_name = $${paramCount++}`);
      values.push(updates.contact_name);
    }
    if (updates.phone_number !== undefined) {
      fields.push(`phone_number = $${paramCount++}`);
      values.push(updates.phone_number);
    }
    if (updates.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }
    if (updates.whatsapp_number !== undefined) {
      fields.push(`whatsapp_number = $${paramCount++}`);
      values.push(updates.whatsapp_number);
    }
    if (updates.relationship !== undefined) {
      fields.push(`relationship = $${paramCount++}`);
      values.push(updates.relationship);
    }
    if (updates.is_primary !== undefined) {
      fields.push(`is_primary = $${paramCount++}`);
      values.push(updates.is_primary);
    }
    if (updates.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(updates.is_active);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(contactId);
    const result = await query(
      `UPDATE emergency_contacts SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Emergency contact not found');
    }

    logger.info(`Emergency contact updated: ${contactId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating emergency contact:', error);
    throw error;
  }
}

// ============================================================
// CONSENT OPERATIONS
// ============================================================

/**
 * Record user consent
 */
export async function recordConsent(consentData: UserConsentCreateInput): Promise<UserConsent> {
  try {
    const result = await query(
      `INSERT INTO user_consents (
        user_id, consent_type, consent_given, expires_at, ip_address, device_fingerprint, consent_text
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        consentData.user_id,
        consentData.consent_type,
        consentData.consent_given,
        consentData.expires_at,
        consentData.ip_address,
        consentData.device_fingerprint,
        consentData.consent_text,
      ]
    );
    logger.info(`Consent recorded: ${result.rows[0].id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error recording consent:', error);
    throw error;
  }
}

/**
 * Get user consents
 */
export async function getUserConsents(userId: string): Promise<UserConsent[]> {
  try {
    const result = await query(
      'SELECT * FROM user_consents WHERE user_id = $1 ORDER BY consent_timestamp DESC',
      [userId]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error fetching user consents:', error);
    throw error;
  }
}

// ============================================================
// DATA RETENTION POLICY OPERATIONS
// ============================================================

/**
 * Get data retention policy for a user
 */
export async function getDataRetentionPolicy(userId: string): Promise<DataRetentionPolicy | null> {
  try {
    const result = await query(
      'SELECT * FROM data_retention_policies WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error fetching data retention policy:', error);
    throw error;
  }
}

/**
 * Create data retention policy
 */
export async function createDataRetentionPolicy(
  policyData: DataRetentionPolicyCreateInput
): Promise<DataRetentionPolicy> {
  try {
    const result = await query(
      `INSERT INTO data_retention_policies (
        user_id, telemetry_retention_days, crash_event_retention_days,
        panic_event_retention_days, diagnostics_retention_days, auto_delete_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        policyData.user_id,
        policyData.telemetry_retention_days || 90,
        policyData.crash_event_retention_days || 365,
        policyData.panic_event_retention_days || 365,
        policyData.diagnostics_retention_days || 30,
        policyData.auto_delete_enabled !== false,
      ]
    );
    logger.info(`Data retention policy created: ${result.rows[0].id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating data retention policy:', error);
    throw error;
  }
}

/**
 * Update data retention policy
 */
export async function updateDataRetentionPolicy(
  userId: string,
  updates: DataRetentionPolicyUpdateInput
): Promise<DataRetentionPolicy> {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.telemetry_retention_days !== undefined) {
      fields.push(`telemetry_retention_days = $${paramCount++}`);
      values.push(updates.telemetry_retention_days);
    }
    if (updates.crash_event_retention_days !== undefined) {
      fields.push(`crash_event_retention_days = $${paramCount++}`);
      values.push(updates.crash_event_retention_days);
    }
    if (updates.panic_event_retention_days !== undefined) {
      fields.push(`panic_event_retention_days = $${paramCount++}`);
      values.push(updates.panic_event_retention_days);
    }
    if (updates.diagnostics_retention_days !== undefined) {
      fields.push(`diagnostics_retention_days = $${paramCount++}`);
      values.push(updates.diagnostics_retention_days);
    }
    if (updates.auto_delete_enabled !== undefined) {
      fields.push(`auto_delete_enabled = $${paramCount++}`);
      values.push(updates.auto_delete_enabled);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(userId);
    const result = await query(
      `UPDATE data_retention_policies SET ${fields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Data retention policy not found');
    }

    logger.info(`Data retention policy updated for user: ${userId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating data retention policy:', error);
    throw error;
  }
}

/**
 * Delete old data based on retention policy
 */
export async function deleteOldData(userId: string): Promise<void> {
  try {
    const policy = await getDataRetentionPolicy(userId);
    if (!policy || !policy.auto_delete_enabled) {
      logger.info(`Auto-delete disabled for user: ${userId}`);
      return;
    }

    const now = new Date();

    // Delete old crash events
    const crashCutoff = new Date(now.getTime() - policy.crash_event_retention_days * 24 * 60 * 60 * 1000);
    await query(
      'DELETE FROM crash_events WHERE user_id = $1 AND event_timestamp < $2',
      [userId, crashCutoff]
    );

    // Delete old panic events
    const panicCutoff = new Date(now.getTime() - policy.panic_event_retention_days * 24 * 60 * 60 * 1000);
    await query(
      'DELETE FROM panic_events WHERE user_id = $1 AND event_timestamp < $2',
      [userId, panicCutoff]
    );

    // Update cleanup timestamps
    const nextCleanup = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next cleanup in 7 days
    await query(
      'UPDATE data_retention_policies SET last_cleanup_at = $1, next_cleanup_at = $2 WHERE user_id = $3',
      [now, nextCleanup, userId]
    );

    logger.info(`Old data deleted for user: ${userId}`);
  } catch (error) {
    logger.error('Error deleting old data:', error);
    throw error;
  }
}

export default {
  // User operations
  getUser,
  getUserByEmail,
  createUser,
  updateUser,

  // Device operations
  getDevice,
  getDeviceById,
  getDevicesByUser,
  createDevice,
  updateDeviceStatus,
  updateDeviceBattery,
  updateDevice,

  // Crash event operations
  saveCrashEvent,
  getCrashEvent,
  getCrashEvents,
  updateCrashEvent,

  // Panic event operations
  savePanicEvent,
  getPanicEvent,
  getPanicEvents,
  updatePanicEvent,

  // Emergency contact operations
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,

  // Consent operations
  recordConsent,
  getUserConsents,

  // Data retention policy operations
  getDataRetentionPolicy,
  createDataRetentionPolicy,
  updateDataRetentionPolicy,
  deleteOldData,
};
