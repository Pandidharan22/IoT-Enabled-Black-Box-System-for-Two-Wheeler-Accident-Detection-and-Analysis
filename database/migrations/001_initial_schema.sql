-- ============================================================
-- IoT Black Box Database Schema
-- Initial Migration: Core Tables with Relationships
-- Created: 2025-11-17
-- Description: Complete database schema for two-wheeler black box system
-- ============================================================

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- Stores user account information
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups during authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- ============================================================
-- DEVICES TABLE
-- Device registry with ownership and status tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(255),
    firmware_version VARCHAR(50),
    last_seen TIMESTAMP WITH TIME ZONE,
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for faster queries
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(last_seen);

-- ============================================================
-- CRASH_EVENTS TABLE
-- Forensic analysis data for accident detection
-- ============================================================
CREATE TABLE IF NOT EXISTS crash_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Location data
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lon DECIMAL(11, 8) NOT NULL,
    altitude DECIMAL(10, 2),
    
    -- Impact analysis
    impact_force DECIMAL(10, 2), -- in G-force
    impact_direction VARCHAR(50), -- N, NE, E, SE, S, SW, W, NW
    tilt_angle DECIMAL(5, 2), -- in degrees
    
    -- Pre-event telemetry (averaged over 5 seconds before crash)
    pre_event_speed_avg DECIMAL(6, 2), -- km/h
    pre_event_heading DECIMAL(5, 2), -- degrees
    pre_event_accel JSONB, -- {x, y, z} in m/s²
    pre_event_gyro JSONB, -- {x, y, z} in rad/s
    
    -- Post-event telemetry (immediate after crash)
    post_event_accel JSONB, -- {x, y, z} in m/s²
    post_event_gyro JSONB, -- {x, y, z} in rad/s
    post_event_position JSONB, -- {lat, lon, altitude}
    
    -- Severity classification
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    injury_probability DECIMAL(5, 2), -- 0-100 percentage
    
    -- Emergency response tracking
    emergency_contacts_notified BOOLEAN DEFAULT false,
    notification_attempts INTEGER DEFAULT 0,
    first_responder_contacted BOOLEAN DEFAULT false,
    
    -- Review and audit
    is_reviewed BOOLEAN DEFAULT false,
    review_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for faster queries and time-series analysis
CREATE INDEX IF NOT EXISTS idx_crash_events_device_id ON crash_events(device_id);
CREATE INDEX IF NOT EXISTS idx_crash_events_user_id ON crash_events(user_id);
CREATE INDEX IF NOT EXISTS idx_crash_events_timestamp ON crash_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_crash_events_severity ON crash_events(severity);
CREATE INDEX IF NOT EXISTS idx_crash_events_location ON crash_events(location_lat, location_lon);

-- ============================================================
-- PANIC_EVENTS TABLE
-- Manual and automatic panic button triggers
-- ============================================================
CREATE TABLE IF NOT EXISTS panic_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Location data
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lon DECIMAL(11, 8) NOT NULL,
    
    -- Device state
    device_speed DECIMAL(6, 2), -- km/h
    device_heading DECIMAL(5, 2), -- degrees
    
    -- Trigger information
    triggered_by VARCHAR(20) DEFAULT 'manual_button' CHECK (triggered_by IN ('manual_button', 'auto_detect')),
    
    -- Emergency response tracking
    emergency_contacts_notified BOOLEAN DEFAULT false,
    notification_attempts INTEGER DEFAULT 0,
    ambulance_requested BOOLEAN DEFAULT false,
    police_requested BOOLEAN DEFAULT false,
    
    -- Resolution tracking
    is_false_alarm BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    rider_status VARCHAR(50), -- 'safe', 'injured', 'hospitalized', etc.
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for faster queries
CREATE INDEX IF NOT EXISTS idx_panic_events_device_id ON panic_events(device_id);
CREATE INDEX IF NOT EXISTS idx_panic_events_user_id ON panic_events(user_id);
CREATE INDEX IF NOT EXISTS idx_panic_events_timestamp ON panic_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_panic_events_resolved ON panic_events(resolved_at);

-- ============================================================
-- EMERGENCY_CONTACTS TABLE
-- Contact information for emergency notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    whatsapp_number VARCHAR(20),
    relationship VARCHAR(100), -- 'spouse', 'parent', 'sibling', 'friend', etc.
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_primary ON emergency_contacts(is_primary, is_active);

-- ============================================================
-- USER_CONSENTS TABLE
-- DPDP Act 2023 compliance - Track user consent
-- ============================================================
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL, -- 'data_collection', 'location_tracking', 'emergency_sharing', etc.
    consent_given BOOLEAN NOT NULL,
    consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45), -- IPv6 compatible
    device_fingerprint VARCHAR(255),
    consent_text TEXT, -- Full consent text shown to user
    acknowledged BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for compliance audits
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_timestamp ON user_consents(consent_timestamp DESC);

-- ============================================================
-- DATA_RETENTION_POLICIES TABLE
-- DPDP Act 2023 compliance - Data retention management
-- ============================================================
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    telemetry_retention_days INTEGER DEFAULT 90,
    crash_event_retention_days INTEGER DEFAULT 365,
    panic_event_retention_days INTEGER DEFAULT 365,
    diagnostics_retention_days INTEGER DEFAULT 30,
    auto_delete_enabled BOOLEAN DEFAULT true,
    last_cleanup_at TIMESTAMP WITH TIME ZONE,
    next_cleanup_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for cleanup jobs
CREATE INDEX IF NOT EXISTS idx_data_retention_user_id ON data_retention_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_data_retention_next_cleanup ON data_retention_policies(next_cleanup_at);

-- ============================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- Automatically update updated_at column on row modification
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at column
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crash_events_updated_at ON crash_events;
CREATE TRIGGER update_crash_events_updated_at BEFORE UPDATE ON crash_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_retention_policies_updated_at ON data_retention_policies;
CREATE TRIGGER update_data_retention_policies_updated_at BEFORE UPDATE ON data_retention_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SAMPLE DATA FOR DEVELOPMENT
-- Uncomment below for local testing
-- ============================================================

-- Insert a test user
-- INSERT INTO users (email, password_hash, full_name, phone_number) 
-- VALUES ('test@example.com', '$2b$10$dummyhashfordevpurposes', 'Test User', '+919876543210');

-- Insert a test device
-- INSERT INTO devices (device_id, user_id, device_name, firmware_version, status)
-- SELECT 'TEST-DEVICE-001', id, 'Test Two-Wheeler', '1.0.0', 'offline'
-- FROM users WHERE email = 'test@example.com';

-- Insert emergency contact
-- INSERT INTO emergency_contacts (user_id, contact_name, phone_number, email, relationship, is_primary)
-- SELECT id, 'Emergency Contact', '+919876543211', 'emergency@example.com', 'spouse', true
-- FROM users WHERE email = 'test@example.com';

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
