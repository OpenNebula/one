require 'opennebula'

module OpenNebula
  class RequestManager
    include RequestManagerAudit

    def log_audit(request, result)
      audit = AuditLog.new(
        user_id:       request.user_id,
        session_id:    request.session_id,
        resource_type: request.resource_type,
        resource_id:   request.resource_id,
        action:        request.action,
        parameters:    request.parameters.to_json,
        result:        result.success?,
        result_info:   result.to_json,
        timestamp:     Time.now.utc
      )
      audit.save
    rescue => e
      Logger.log_error("Failed to log audit: #{e.message}")
    end
  end

  class AuditLog < Sequel::Model(:audit_log)
    # DB schema defined in migration
  end
end