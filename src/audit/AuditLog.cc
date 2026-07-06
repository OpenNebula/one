#include "AuditLog.h"
#include "NebulaLog.h"
#include "SqliteDB.h"
#include <sstream>

int AuditLog::insert(const std::string &method, const std::string &params,
                     int uid, int gid, int request_oid, const std::string &object_type,
                     const std::string &result, int acl_rule_id, bool cached_session) {
    std::ostringstream oss;
    oss << "INSERT INTO audit_log (method, params, uid, gid, request_oid, object_type, result, acl_rule_id, cached_session, timestamp) VALUES ('"
        << SqliteDB::escape(method) << "','" << SqliteDB::escape(params) << "',"
        << uid << "," << gid << "," << request_oid << ",'" << SqliteDB::escape(object_type)
        << "','" << SqliteDB::escape(result) << "'," << acl_rule_id << "," << (cached_session?1:0)
        << ",datetime('now'));";

    SqliteDB *db = Nebula::instance().get_db();
    int rc = db->exec(oss);
    if (rc != 0) {
        NebulaLog::log("AUD", Log::ERROR, "Failed to insert audit log: " + oss.str());
    }
    return rc;
}

std::vector<std::string> AuditLog::query(int uid, int oid, const std::string &object_type,
                                         time_t start, time_t end, int limit, int offset) {
    std::ostringstream oss;
    oss << "SELECT * FROM audit_log WHERE 1=1";
    if (uid != -1) oss << " AND uid=" << uid;
    if (oid != -1) oss << " AND request_oid=" << oid;
    if (!object_type.empty()) oss << " AND object_type='" << SqliteDB::escape(object_type) << "'";
    if (start > 0) oss << " AND timestamp >= datetime(" << start << ", 'unixepoch')";
    if (end > 0) oss << " AND timestamp <= datetime(" << end << ", 'unixepoch')";
    oss << " ORDER BY timestamp DESC LIMIT " << limit << " OFFSET " << offset;

    SqliteDB *db = Nebula::instance().get_db();
    std::vector<std::string> results;
    db->exec(oss, [&results](char **col, int num) {
        for (int i=0; i<num; ++i) results.push_back(col[i]?col[i]:"");
        return 0;
    });
    return results;
}
