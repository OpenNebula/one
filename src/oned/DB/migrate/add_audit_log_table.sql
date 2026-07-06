-- SQLite migration to add audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid INTEGER NOT NULL,
    gid INTEGER NOT NULL,
    request VARCHAR(255) NOT NULL,
    arguments TEXT,
    result VARCHAR(10) NOT NULL,
    result_msg TEXT,
    timestamp INTEGER NOT NULL,
    object_type VARCHAR(255),
    object_id INTEGER,
    acl_rule VARCHAR(255),
    session VARCHAR(255),
    FOREIGN KEY(uid) REFERENCES user_pool(oid),
    FOREIGN KEY(gid) REFERENCES group_pool(oid)
);
