/**
 * TypeScript type definitions for IoT Black Box database entities
 * Provides type safety for all database operations
 */

// ============================================================
// ENUMS
// ============================================================

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERROR = 'error',
}

export enum EventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum PanicTriggerType {
  MANUAL_BUTTON = 'manual_button',
  AUTO_DETECT = 'auto_detect',
}

export enum ConsentType {
  DATA_COLLECTION = 'data_collection',
  LOCATION_TRACKING = 'location_tracking',
  EMERGENCY_SHARING = 'emergency_sharing',
  TELEMETRY_STORAGE = 'telemetry_storage',
}

export enum RiderStatus {
  SAFE = 'safe',
  INJURED = 'injured',
  HOSPITALIZED = 'hospitalized',
  UNKNOWN = 'unknown',
}

// ============================================================
// USER TYPES
// ============================================================

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone_number?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreateInput {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
}

export interface UserUpdateInput {
  full_name?: string;
  phone_number?: string;
  is_active?: boolean;
}

// ============================================================
// DEVICE TYPES
// ============================================================

export interface Device {
  id: string;
  device_id: string;
  user_id: string;
  device_name?: string;
  firmware_version?: string;
  last_seen?: Date;
  battery_level?: number;
  status: DeviceStatus;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DeviceCreateInput {
  device_id: string;
  user_id: string;
  device_name?: string;
  firmware_version?: string;
}

export interface DeviceUpdateInput {
  device_name?: string;
  firmware_version?: string;
  last_seen?: Date;
  battery_level?: number;
  status?: DeviceStatus;
  is_active?: boolean;
}

// ============================================================
// CRASH EVENT TYPES
// ============================================================

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Position {
  lat: number;
  lon: number;
  altitude?: number;
}

export interface CrashEvent {
  id: string;
  device_id: string;
  user_id: string;
  event_timestamp: Date;
  
  // Location
  location_lat: number;
  location_lon: number;
  altitude?: number;
  
  // Impact data
  impact_force?: number;
  impact_direction?: string;
  tilt_angle?: number;
  
  // Pre-event telemetry
  pre_event_speed_avg?: number;
  pre_event_heading?: number;
  pre_event_accel?: Vector3D;
  pre_event_gyro?: Vector3D;
  
  // Post-event telemetry
  post_event_accel?: Vector3D;
  post_event_gyro?: Vector3D;
  post_event_position?: Position;
  
  // Classification
  severity: EventSeverity;
  injury_probability?: number;
  
  // Emergency response
  emergency_contacts_notified: boolean;
  notification_attempts: number;
  first_responder_contacted: boolean;
  
  // Review
  is_reviewed: boolean;
  review_notes?: string;
  
  created_at: Date;
  updated_at: Date;
}

export interface CrashEventCreateInput {
  device_id: string;
  user_id: string;
  event_timestamp: Date;
  location_lat: number;
  location_lon: number;
  altitude?: number;
  impact_force?: number;
  impact_direction?: string;
  tilt_angle?: number;
  pre_event_speed_avg?: number;
  pre_event_heading?: number;
  pre_event_accel?: Vector3D;
  pre_event_gyro?: Vector3D;
  post_event_accel?: Vector3D;
  post_event_gyro?: Vector3D;
  post_event_position?: Position;
  severity?: EventSeverity;
  injury_probability?: number;
}

export interface CrashEventUpdateInput {
  severity?: EventSeverity;
  injury_probability?: number;
  emergency_contacts_notified?: boolean;
  notification_attempts?: number;
  first_responder_contacted?: boolean;
  is_reviewed?: boolean;
  review_notes?: string;
}

// ============================================================
// PANIC EVENT TYPES
// ============================================================

export interface PanicEvent {
  id: string;
  device_id: string;
  user_id: string;
  event_timestamp: Date;
  location_lat: number;
  location_lon: number;
  device_speed?: number;
  device_heading?: number;
  triggered_by: PanicTriggerType;
  emergency_contacts_notified: boolean;
  notification_attempts: number;
  ambulance_requested: boolean;
  police_requested: boolean;
  is_false_alarm: boolean;
  resolved_at?: Date;
  rider_status?: string;
  notes?: string;
  created_at: Date;
}

export interface PanicEventCreateInput {
  device_id: string;
  user_id: string;
  event_timestamp: Date;
  location_lat: number;
  location_lon: number;
  device_speed?: number;
  device_heading?: number;
  triggered_by: PanicTriggerType;
}

export interface PanicEventUpdateInput {
  emergency_contacts_notified?: boolean;
  notification_attempts?: number;
  ambulance_requested?: boolean;
  police_requested?: boolean;
  is_false_alarm?: boolean;
  resolved_at?: Date;
  rider_status?: string;
  notes?: string;
}

// ============================================================
// EMERGENCY CONTACT TYPES
// ============================================================

export interface EmergencyContact {
  id: string;
  user_id: string;
  contact_name: string;
  phone_number: string;
  email?: string;
  whatsapp_number?: string;
  relationship?: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: Date;
}

export interface EmergencyContactCreateInput {
  user_id: string;
  contact_name: string;
  phone_number: string;
  email?: string;
  whatsapp_number?: string;
  relationship?: string;
  is_primary?: boolean;
}

export interface EmergencyContactUpdateInput {
  contact_name?: string;
  phone_number?: string;
  email?: string;
  whatsapp_number?: string;
  relationship?: string;
  is_primary?: boolean;
  is_active?: boolean;
}

// ============================================================
// CONSENT TYPES
// ============================================================

export interface UserConsent {
  id: string;
  user_id: string;
  consent_type: string;
  consent_given: boolean;
  consent_timestamp: Date;
  expires_at?: Date;
  ip_address?: string;
  device_fingerprint?: string;
  consent_text?: string;
  acknowledged: boolean;
  created_at: Date;
}

export interface UserConsentCreateInput {
  user_id: string;
  consent_type: string;
  consent_given: boolean;
  expires_at?: Date;
  ip_address?: string;
  device_fingerprint?: string;
  consent_text?: string;
}

// ============================================================
// DATA RETENTION POLICY TYPES
// ============================================================

export interface DataRetentionPolicy {
  id: string;
  user_id: string;
  telemetry_retention_days: number;
  crash_event_retention_days: number;
  panic_event_retention_days: number;
  diagnostics_retention_days: number;
  auto_delete_enabled: boolean;
  last_cleanup_at?: Date;
  next_cleanup_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DataRetentionPolicyCreateInput {
  user_id: string;
  telemetry_retention_days?: number;
  crash_event_retention_days?: number;
  panic_event_retention_days?: number;
  diagnostics_retention_days?: number;
  auto_delete_enabled?: boolean;
}

export interface DataRetentionPolicyUpdateInput {
  telemetry_retention_days?: number;
  crash_event_retention_days?: number;
  panic_event_retention_days?: number;
  diagnostics_retention_days?: number;
  auto_delete_enabled?: boolean;
}

// ============================================================
// QUERY FILTER TYPES
// ============================================================

export interface CrashEventFilters {
  device_id?: string;
  user_id?: string;
  severity?: EventSeverity;
  start_date?: Date;
  end_date?: Date;
  is_reviewed?: boolean;
  limit?: number;
  offset?: number;
}

export interface PanicEventFilters {
  device_id?: string;
  user_id?: string;
  triggered_by?: PanicTriggerType;
  start_date?: Date;
  end_date?: Date;
  is_false_alarm?: boolean;
  resolved?: boolean;
  limit?: number;
  offset?: number;
}

export interface DeviceFilters {
  user_id?: string;
  status?: DeviceStatus;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// ============================================================
// MQTT MESSAGE TYPES
// ============================================================

export interface TelemetryMessage {
  deviceId: string;
  timestamp: Date;
  location: {
    lat: number;
    lon: number;
    altitude?: number;
  };
  speed: number;
  heading: number;
  battery_level?: number;
  accelerometer?: Vector3D;
  gyroscope?: Vector3D;
}

export interface CrashEventMessage {
  deviceId: string;
  timestamp: Date;
  location: {
    lat: number;
    lon: number;
    altitude?: number;
  };
  impactForce: number;
  impactDirection: string;
  tiltAngle: number;
  preEventData: {
    speedAvg: number;
    heading: number;
    accel: Vector3D;
    gyro: Vector3D;
  };
  postEventData: {
    accel: Vector3D;
    gyro: Vector3D;
    position: Position;
  };
}

export interface PanicEventMessage {
  deviceId: string;
  timestamp: Date;
  location: {
    lat: number;
    lon: number;
  };
  speed?: number;
  heading?: number;
  triggeredBy: 'manual' | 'auto';
}
