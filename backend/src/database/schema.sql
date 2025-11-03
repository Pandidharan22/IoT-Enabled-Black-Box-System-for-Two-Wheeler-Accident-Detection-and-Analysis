-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for location data (if needed in future)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Enumerated types for various statuses
CREATE TYPE device_status AS ENUM ('online', 'offline', 'error');
CREATE TYPE event_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE consent_type AS ENUM ('data_collection', 'location_tracking', 'emergency_contact', 'data_sharing');
CREATE TYPE panic_trigger AS ENUM ('manual_button', 'auto_detect');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Devices table with relationship to users
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(100) NOT NULL,
    firmware_version VARCHAR(50) NOT NULL,
    last_seen TIMESTAMPTZ,
    battery_level DECIMAL,
    status device_status DEFAULT 'offline',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Crash events table
CREATE TABLE IF NOT EXISTS crash_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_timestamp TIMESTAMPTZ NOT NULL,
    location_lat DECIMAL(10,8) NOT NULL,
    location_lon DECIMAL(11,8) NOT NULL,
    altitude DECIMAL,
    impact_force DECIMAL NOT NULL,
    impact_direction DECIMAL,
    tilt_angle DECIMAL,
    pre_event_speed_avg DECIMAL,
    pre_event_heading DECIMAL,
    pre_event_accel JSONB,
    pre_event_gyro JSONB,
    post_event_accel JSONB,
    post_event_gyro JSONB,
    post_event_position JSONB,
    severity event_severity NOT NULL,
    injury_probability DECIMAL,
    emergency_contacts_notified BOOLEAN DEFAULT false,
    notification_attempts INTEGER DEFAULT 0,
    first_responder_contacted BOOLEAN DEFAULT false,
    is_reviewed BOOLEAN DEFAULT false,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Panic events table
CREATE TABLE IF NOT EXISTS panic_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_timestamp TIMESTAMPTZ NOT NULL,
    location_lat DECIMAL(10,8) NOT NULL,
    location_lon DECIMAL(11,8) NOT NULL,
    device_speed DECIMAL,
    device_heading DECIMAL,
    triggered_by panic_trigger NOT NULL,
    emergency_contacts_notified BOOLEAN DEFAULT false,
    notification_attempts INTEGER DEFAULT 0,
    ambulance_requested BOOLEAN DEFAULT false,
    police_requested BOOLEAN DEFAULT false,
    is_false_alarm BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    rider_status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User consents table for DPDP compliance
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    consent_type consent_type NOT NULL,
    consent_given BOOLEAN NOT NULL,
    consent_timestamp TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    ip_address INET NOT NULL,
    device_fingerprint TEXT NOT NULL,
    consent_text TEXT NOT NULL,
    acknowledged BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, consent_type)
);

-- Data retention policies table
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    telemetry_retention_days INTEGER NOT NULL DEFAULT 90,
    crash_event_retention_days INTEGER NOT NULL DEFAULT 365,
    panic_event_retention_days INTEGER NOT NULL DEFAULT 365,
    diagnostics_retention_days INTEGER NOT NULL DEFAULT 30,
    auto_delete_enabled BOOLEAN DEFAULT true,
    last_cleanup_at TIMESTAMPTZ,
    next_cleanup_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Emergency contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    whatsapp_number VARCHAR(20),
    relationship VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_crash_events_device_id ON crash_events(device_id);
CREATE INDEX idx_crash_events_user_id ON crash_events(user_id);
CREATE INDEX idx_panic_events_device_id ON panic_events(device_id);
CREATE INDEX idx_panic_events_user_id ON panic_events(user_id);
CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts(user_id);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crash_events_updated_at
    BEFORE UPDATE ON crash_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_retention_policies_updated_at
    BEFORE UPDATE ON data_retention_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();