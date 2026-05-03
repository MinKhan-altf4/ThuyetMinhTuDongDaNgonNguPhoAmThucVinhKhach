CREATE TABLE IF NOT EXISTS app_online_sessions (
  session_id VARCHAR(64) NOT NULL PRIMARY KEY,
  device_id VARCHAR(128) NOT NULL,
  device_type VARCHAR(255) NULL,
  app_version VARCHAR(50) NULL,
  language_code VARCHAR(20) NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  INDEX idx_online_active_last_seen (is_active, last_seen),
  INDEX idx_online_device (device_id)
);
