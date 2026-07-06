#ifndef AUDIT_LOG_H_
#define AUDIT_LOG_H_

#include "ObjectSQL.h"
#include "PoolSQL.h"
#include <time.h>

class AuditLog : public ObjectSQL
{
public:
    AuditLog() : ObjectSQL() {}

    enum Fields {
        ID          = 0,
        UID         = 1,
        GID         = 2,
        REQUEST     = 3,
        ARGUMENTS   = 4,
        RESULT      = 5,
        RESULT_MSG  = 6,
        TIMESTAMP   = 7,
        OBJECT_TYPE = 8,
        OBJECT_ID   = 9,
        ACL_RULE    = 10,
        SESSION     = 11
    };

    virtual ~AuditLog() = default;

    static string table_name() { return "audit_log"; }

    int64_t uid;
    int64_t gid;
    string request;
    string arguments;
    string result;   // "SUCCESS", "FAILURE"
    string result_msg;
    time_t timestamp;
    string object_type; // "VM", "HOST", "IMAGE", "USER", ...
    int64_t object_id;
    string acl_rule;    // ACL rule that granted permission
    string session;     // session string (cached or actual)

    static string db_table() { return "audit_log"; }

    static string xml_root() { return "AUDIT_LOG"; }

    // Override for DB binding
    static string& from_xml(const string& xml);
    string& to_xml(const string& xml);

    static void set_callback(void *data, char **values, char **names);
};

#endif /* AUDIT_LOG_H_ */