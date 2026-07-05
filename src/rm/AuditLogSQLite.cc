#include "AuditLogSQLite.h"
#include <sqlite3.h>
#include <sstream>

AuditLogSQLite::AuditLogSQLite(const std::string& db_path) {
    sqlite3_open(db_path.c_str(), &db);
    // Create table if not exists
    const char* create_sql = 
        "CREATE TABLE IF NOT EXISTS audit_log ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  user_id INTEGER,"
        "  group_id INTEGER,"
        "  request_id INTEGER,"
        "  method TEXT,"
        "  arguments TEXT,"
        "  result TEXT,"
        "  remote_ip TEXT,"
        "  timestamp INTEGER,"
        "  resource_type TEXT,"
        "  resource_id INTEGER,"
        "  success INTEGER"
        ")";
    sqlite3_exec(db, create_sql, 0, 0, 0);
}

int AuditLogSQLite::insert(const AuditLogEntry& entry) {
    std::string sql = "INSERT INTO audit_log (user_id, group_id, request_id, method, arguments, result, remote_ip, timestamp, resource_type, resource_id, success) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
    sqlite3_stmt* stmt;
    sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, NULL);
    sqlite3_bind_int(stmt, 1, entry.user_id);
    sqlite3_bind_int(stmt, 2, entry.group_id);
    sqlite3_bind_int(stmt, 3, entry.request_id);
    sqlite3_bind_text(stmt, 4, entry.method.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 5, entry.arguments.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 6, entry.result.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 7, entry.remote_ip.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int64(stmt, 8, entry.timestamp);
    sqlite3_bind_text(stmt, 9, entry.resource_type.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 10, entry.resource_id);
    sqlite3_bind_int(stmt, 11, entry.success ? 1 : 0);
    sqlite3_step(stmt);
    int id = sqlite3_last_insert_rowid(db);
    sqlite3_finalize(stmt);
    return id;
}

// Query method implementation omitted for brevity
std::vector<AuditLogEntry> AuditLogSQLite::query(...) {
    // Build dynamic SQL with WHERE clauses based on filters
    // Return results
}

int AuditLogSQLite::count(...) {
    // Similar to query but SELECT COUNT(*)
}
