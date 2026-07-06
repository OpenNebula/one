#include "AuditLog.h"
#include "NebulaLog.h"
#include "SqliteDB.h"
#include <sstream>

using namespace std;

void AuditLog::log(const string& user, const string& action,
                   const string& args, const string& result,
                   time_t timestamp) {
    // Use existing DB connection (global or passed)
    SQLiteDB* db = NebulaLog::instance().get_db();
    if (!db) return;
    
    ostringstream sql;
    sql << "INSERT INTO audit_log (user, action, args, result, timestamp) VALUES ("
        << "'" << user << "', '" << action << "', '" << args << "', '" << result << "', "
        << timestamp << ")";
    db->exec(sql.str());
}

vector<AuditEntry> AuditLog::query(const string& user_filter,
                                    time_t from, time_t to,
                                    const string& object_filter) {
    vector<AuditEntry> entries;
    SQLiteDB* db = NebulaLog::instance().get_db();
    if (!db) return entries;
    
    ostringstream sql;
    sql << "SELECT id, user, action, args, result, timestamp FROM audit_log WHERE 1=1";
    if (!user_filter.empty()) {
        sql << " AND user = '" << user_filter << "'";
    }
    if (from > 0) {
        sql << " AND timestamp >= " << from;
    }
    if (to > 0) {
        sql << " AND timestamp <= " << to;
    }
    if (!object_filter.empty()) {
        sql << " AND (args LIKE '%" << object_filter << "%' OR result LIKE '%" << object_filter << "%')";
    }
    sql << " ORDER BY timestamp DESC LIMIT 1000";
    
    // Execute and parse
    // ... (simplified)
    return entries;
}
