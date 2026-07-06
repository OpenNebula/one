#include "AuditLog.h"
#include "Nebula.h"
#include "SqliteDB.h"
#include <sstream>

using namespace std;

void AuditLog::log_request(
    int uid,
    int gid,
    const string& request,
    const string& arguments,
    time_t timestamp,
    int result_code,
    const string& result_message,
    const string& objects_json,
    int acl_rule_id)
{
    ostringstream oss;
    oss << "INSERT INTO audit_log (uid, gid, request, arguments, timestamp, result_code, result_message, objects_json, acl_rule_id) VALUES ("
        << uid << ", "
        << gid << ", '"
        << escape(request) << "', '"
        << escape(arguments) << "', "
        << timestamp << ", "
        << result_code << ", '"
        << escape(result_message) << "', '"
        << escape(objects_json) << "', "
        << acl_rule_id << ")";

    SqliteDB* db = Nebula::instance().get_db();
    if (db->exec(oss) != 0)
    {
        NebulaLog::log("AUD", Log::ERROR,
            "Failed to insert audit log: " + oss.str());
    }
}

string AuditLog::escape(const string& s)
{
    string res;
    for (size_t i = 0; i < s.size(); ++i)
    {
        if (s[i] == '\'')
            res += "''";
        else
            res += s[i];
    }
    return res;
}