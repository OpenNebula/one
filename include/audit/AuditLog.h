#ifndef AUDIT_LOG_H
#define AUDIT_LOG_H

#include <string>
#include <vector>

struct AuditEntry {
    long long timestamp;
    int user_id;
    std::string request;
    std::string args;
    std::string result;
    std::string objects; // comma-separated IDs
    int acl_rule_id;
    bool session_cached;
};

class AuditLog {
public:
    AuditLog();
    ~AuditLog();
    
    bool init(const std::string& db_path);
    void insert(const AuditEntry& entry);
    std::vector<AuditEntry> query(const std::string& filter);
    
private:
    void* db_handle; // SQLite3 handle
    void execute(const std::string& sql);
};

#endif // AUDIT_LOG_H