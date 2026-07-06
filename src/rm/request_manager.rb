# Extend RequestManager to log audit
require_relative 'audit_log'

module OpenNebula
  class RequestManager
    alias_method :original_process, :process

    def process(request)
      result = original_process(request)
      request.result = result
      request.success = !result.is_a?(Error)
      AuditLog.log(request)
      result
    end
  end
end

# Add necessary attributes to Request class
class Request
  attr_accessor :result, :objects, :acl_rule, :success?
end