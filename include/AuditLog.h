#ifndef AUDIT_LOG_H_
#define AUDIT_LOG_H_

#include <string>
#include <vector>
#include <time.h>

/**
 * Represents a single audit log entry.
 */
class AuditLogEntry {
public:
    int     id;
    int     user_id;
    int     group_id;
    int     request_id;  // Unique request ID from the XML-RPC server
    std::string method;
    std::string arguments;  // JSON-encoded arguments
    std::string result;     // JSON-encoded result
    std::string remote_ip;
    time_t  timestamp;
    std::string resource_type; // e.g., "VM", "HOST", "IMAGE"
    int     resource_id;
    bool    success;

    AuditLogEntry() : id(0), user_id(0), group_id(0), request_id(0),
                      timestamp(0), resource_id(0), success(false) {}
};

/**
 * Interface for audit log storage and retrieval.
 */
class AuditLog {
public:
    virtual ~AuditLog() {}

    // Insert a new entry
    virtual int insert(const AuditLogEntry& entry) = 0;

    // Query with filters. Returns list of matching entries.
    virtual std::vector<AuditLogEntry> query(
        int user_id = -1,
        const std::string& method = "",
        const std::string& resource_type = "",
        int resource_id = -1,
        time_t start_time = 0,
        time_t end_time = 0,
        const std::string& remote_ip = "",
        int limit = 100,
        int offset = 0) = 0;

    // Get total count for a given query
    virtual int count(
        int user_id = -1,
        const std::string& method = "",
        const std::string& resource_type = "",
        int resource_id = -1,
        time_t start_time = 0,
        time_t end_time = 0,
        const std::string& remote_ip = "") = 0;
};

#endif /* AUDIT_LOG_H_ */
