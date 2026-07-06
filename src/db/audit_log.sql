CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    request_method TEXT,
    request_params TEXT,
    result TEXT,
    objects_involved TEXT,
    session_cached BOOLEAN DEFAULT FALSE,
    acl_rule_id INTEGER DEFAULT NULL
);