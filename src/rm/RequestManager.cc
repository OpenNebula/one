// Inside the method that dispatches XML-RPC calls
// After executing the request, log it

#include "AuditLog.h"
#include "Nebula.h"

void RequestManager::do_request(Request& request)
{
    // ... existing code ...

    // Execute the request
    int rc = request.execute();

    // Log to audit trail
    AuditLog log;
    log.uid = request.uid;
    log.gid = request.gid;
    log.request = request.method_name;
    log.arguments = request.args_to_xml();
    log.result = (rc == 0) ? "SUCCESS" : "FAILURE";
    log.result_msg = request.error_message();
    log.timestamp = time(0);
    // Extract object type and id from request if possible
    // This is simplified - actual parsing needed
    log.object_type = request.object_type;
    log.object_id = request.object_id;
    // ACL rule that granted permission (if available)
    log.acl_rule = request.acl_rule;
    // Session string (cached or not)
    log.session = request.session;

    log.insert();

    // ... existing code ...
}
