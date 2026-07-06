-- Add audit_log table
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    action TEXT,
    args TEXT,
    result TEXT,
    timestamp INTEGER,
    acl_rule TEXT
);
CREATE INDEX idx_audit_user ON audit_log(user);
CREATE INDEX idx_audit_time ON audit_log(timestamp);
