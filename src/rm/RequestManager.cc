// ... existing includes ...
#include "AuditLog.h"
#include "AuditLogSQLite.h" // or "AuditLogMySQL"

// Global audit log instance (set during initialization)
static AuditLog* audit_log = nullptr;

void RequestManager::setAuditLog(AuditLog* log) {
    audit_log = log;
}

// Example modification to dispatch method (simplified)
void RequestManager::dispatch(const std::string& method, 
                              std::vector<xmlrpc_c::value>& params,
                              xmlrpc_c::value& result) {
    if (!audit_log) {
        // fallback: no audit
        do_dispatch(...);
        return;
    }

    AuditLogEntry entry;
    entry.method = method;
    entry.arguments = serializeParamsToJSON(params);
    entry.timestamp = time(nullptr);
    // Extract user_id, group_id from session token
    // Extract remote_ip from connection context
    // (details omitted for brevity)

    // Dispatch and capture result
    try {
        do_dispatch(method, params, result);
        entry.success = true;
        entry.result = serializeResultToJSON(result);
    } catch (std::exception& e) {
        entry.success = false;
        entry.result = e.what();
        throw; // re-throw after logging
    }

    // Determine resource type and ID from params/result
    extractResourceInfo(method, params, result, entry.resource_type, entry.resource_id);

    audit_log->insert(entry);
}
