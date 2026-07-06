#ifndef AUDIT_LOG_H_
#define AUDIT_LOG_H_

#include <string>
#include <vector>
#include <ctime>

class AuditLog {
public:
    static int insert(const std::string &method, const std::string &params,
                      int uid, int gid, int request_oid, const std::string &object_type,
                      const std::string &result, int acl_rule_id, bool cached_session);

    static std::vector<std::string> query(int uid, int oid, const std::string &object_type,
                                          time_t start, time_t end, int limit, int offset);
};

#endif /* AUDIT_LOG_H_ */
