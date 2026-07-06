#include "AuditLog.h"
#include "NebulaLog.h"
#include <sstream>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AuditLog::insert()
{
    ostringstream oss;
    oss << "INSERT INTO " << db_table() << " ("
        << "uid, gid, request, arguments, result, result_msg, "
        << "timestamp, object_type, object_id, acl_rule, session"
        << ") VALUES ("
        << uid << "," << gid << ",'" << request << "','" << arguments << "','"
        << result << "','" << result_msg << "',"
        << timestamp << ",'" << object_type << "'," << object_id
        << ",'" << acl_rule << "','" << session << "')";
    return insert_wrapper(oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& AuditLog::to_xml(const string& xml)
{
    // Not implemented for simplicity
    return xml;
}

string& AuditLog::from_xml(const string& xml)
{
    // Not implemented for simplicity
    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AuditLog::set_callback(void *data, char **values, char **names)
{
    AuditLog* log = static_cast<AuditLog*>(data);

    log->uid = atoi(values[Fields::UID]);
    log->gid = atoi(values[Fields::GID]);
    log->request = values[Fields::REQUEST] ? values[Fields::REQUEST] : "";
    log->arguments = values[Fields::ARGUMENTS] ? values[Fields::ARGUMENTS] : "";
    log->result = values[Fields::RESULT] ? values[Fields::RESULT] : "";
    log->result_msg = values[Fields::RESULT_MSG] ? values[Fields::RESULT_MSG] : "";
    log->timestamp = atol(values[Fields::TIMESTAMP]);
    log->object_type = values[Fields::OBJECT_TYPE] ? values[Fields::OBJECT_TYPE] : "";
    log->object_id = atoi(values[Fields::OBJECT_ID]);
    log->acl_rule = values[Fields::ACL_RULE] ? values[Fields::ACL_RULE] : "";
    log->session = values[Fields::SESSION] ? values[Fields::SESSION] : "";
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string AuditLog::select(const string& where)
{
    ostringstream oss;
    oss << "SELECT * FROM " << db_table() << " WHERE " << where;
    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AuditLog::drop_table()
{
    ostringstream oss;
    oss << "DROP TABLE IF EXISTS " << db_table();
    return drop_wrapper(oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AuditLog::bootstrap()
{
    ostringstream oss;
    oss << "CREATE TABLE IF NOT EXISTS " << db_table() << " ("
        << "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        << "uid INTEGER NOT NULL,"
        << "gid INTEGER NOT NULL,"
        << "request VARCHAR(255) NOT NULL,"
        << "arguments TEXT,"
        << "result VARCHAR(10) NOT NULL,"
        << "result_msg TEXT,"
        << "timestamp INTEGER NOT NULL,"
        << "object_type VARCHAR(255),"
        << "object_id INTEGER,"
        << "acl_rule VARCHAR(255),"
        << "session VARCHAR(255),"
        << "FOREIGN KEY(uid) REFERENCES user_pool(oid),"
        << "FOREIGN KEY(gid) REFERENCES group_pool(oid)"
        << ")";
    return insert_wrapper(oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
