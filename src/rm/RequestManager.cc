// Modified section in do_request() or similar
#include "AuditLog.h"

extern AuditLog* audit_log;

void RequestManager::do_request(const string& method, ...) {
    // ... existing code ...
    
    // Log to audit trail
    if (audit_log) {
        AuditEntry entry;
        entry.timestamp = time(0);
        entry.user_id = auth->get_uid();
        entry.request = method;
        entry.args = serialize_arguments(request);
        entry.result = response_code; // or response string
        entry.objects = extract_object_ids(request); // parse VM/Host/Image IDs
        entry.acl_rule_id = auth->get_matched_rule_id();
        entry.session_cached = auth->is_session_cached();
        audit_log->insert(entry);
    }
    
    // ... rest of code ...
}