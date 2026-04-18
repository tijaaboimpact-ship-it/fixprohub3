-- FixProHub PostgreSQL Schema (Supabase)

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- 'user', 'admin'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'suspended', 'banned'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Licenses Table
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_key VARCHAR(100) UNIQUE NOT NULL,
    plan_type VARCHAR(50) NOT NULL, -- 'monthly', 'yearly', 'lifetime'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'revoked'
    hwid VARCHAR(255) UNIQUE, -- Hardware ID binding
    hwid_resets_available INT DEFAULT 3,
    hwid_last_reset TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Devices Database (Firmware & Models)
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand VARCHAR(100) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    model_number VARCHAR(100) NOT NULL,
    chipset VARCHAR(100) NOT NULL,
    cpu_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Logs (Anti-Piracy & Auditing)
CREATE TABLE security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL, -- 'login_success', 'login_failed', 'hwid_mismatch', 'invalid_signature'
    ip_address VARCHAR(45),
    hwid_attempt VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Repair Cases
CREATE TABLE repair_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    device_id UUID REFERENCES devices(id),
    error_type VARCHAR(100),
    repair_method VARCHAR(100),
    is_success BOOLEAN,
    logs TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device Live Logs (for history & forensic auditing)
CREATE TABLE device_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(255), -- Serial number or HWID
    level VARCHAR(20), -- 'info', 'success', 'warning', 'error'
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
