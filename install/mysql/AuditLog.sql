-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid INTEGER NOT NULL,
    gid INTEGER NOT NULL,
    request VARCHAR(255) NOT NULL,
    arguments TEXT,
    timestamp INTEGER NOT NULL,
    result_code INTEGER NOT NULL,
    result_message TEXT,
    objects_json TEXT,
    acl_rule_id INTEGER DEFAULT -1
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_uid ON audit_log(uid);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_request ON audit_log(request);
