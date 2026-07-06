-- Schema update for audit log table (version 4.16.0)
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    method VARCHAR(256) NOT NULL,
    params TEXT,
    uid INTEGER NOT NULL,
    gid INTEGER NOT NULL,
    request_oid INTEGER,
    object_type VARCHAR(64),
    result TEXT,
    acl_rule_id INTEGER DEFAULT 0,
    cached_session INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_audit_log_uid ON audit_log(uid);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_oid ON audit_log(request_oid);
