module AuditLogger
  def self.log_request(user_id, session, action, arguments, result, object_id = nil, object_type = nil, acl_rule_id = nil)
    AuditLog.create!(
      user_id: user_id,
      session: session,
      action: action,
      arguments: arguments.to_json,
      result: result.to_json,
      object_id: object_id,
      object_type: object_type,
      acl_rule_id: acl_rule_id
    )
  rescue => e
    Rails.logger.error("Failed to log audit: #{e.message}")
  end
end
