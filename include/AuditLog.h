#ifndef AUDIT_LOG_H_
#define AUDIT_LOG_H_

#include <string>
#include <ctime>
#include "NebulaLog.h"

class AuditLog {
public:
    static void log_request(
        int uid,
        int gid,
        const std::string& request,
        const std::string& arguments,
        time_t timestamp,
        int result_code,
        const std::string& result_message,
        const std::string& objects_json,
        int acl_rule_id);

private:
    static std::string escape(const std::string& s);
};

#endif /* AUDIT_LOG_H_ */