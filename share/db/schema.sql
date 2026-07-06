-- Add audit trail table
CREATE TABLE IF NOT EXISTS audit_trail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    request TEXT NOT NULL,
    args TEXT,
    result TEXT,
    objects TEXT,
    acl_rule_id INTEGER,
    session_cached INTEGER DEFAULT 0
);
CREATE INDEX idx_audit_user ON audit_trail(user_id);
CREATE INDEX idx_audit_timestamp ON audit_trail(timestamp);
CREATE INDEX idx_audit_objects ON audit_trail(objects);