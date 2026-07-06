-- MySQL schema for audit log table
-- Assumes 'oneaudit' database exists

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    user_id INT NOT NULL,
    request VARCHAR(255) NOT NULL,
    params TEXT,
    result TEXT,
    objects TEXT,
    acl_rule VARCHAR(255),
    session_cached BOOLEAN DEFAULT FALSE,
    INDEX idx_timestamp (timestamp),
    INDEX idx_user_id (user_id),
    INDEX idx_request (request)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
