#ifndef AUDIT_LOG_H_
#define AUDIT_LOG_H_

#include <string>
#include <ctime>

class AuditLog {
public:
    static void log(const std::string& user, const std::string& action,
                    const std::string& args, const std::string& result,
                    time_t timestamp);
    static std::vector<AuditEntry> query(const std::string& user_filter,
                                          time_t from, time_t to,
                                          const std::string& object_filter);
};

struct AuditEntry {
    int id;
    std::string user;
    std::string action;
    std::string args;
    std::string result;
    time_t timestamp;
    std::string acl_rule; // optional
};

#endif
