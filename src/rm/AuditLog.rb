require 'sequel'
require 'opennebula'

module OpenNebula
  class AuditLog
    DB = Sequel.connect('sqlite:///var/lib/one/one.db') # example, adjust

    def self.log(request)
      DB[:audit_log].insert(
        timestamp: Time.now.to_i,
        user_id:   request[:user_id],
        action:    request[:action],
        arguments: request[:arguments].to_json,
        result:    request[:result].to_json,
        objects:   request[:objects].to_json,
        acl_rule:  request[:acl_rule],
        session_cached: request[:session_cached] || false
      )
    rescue => e
      # log error but do not break request
      OpenNebula.log_error("AuditLog error: #{e.message}")
    end
  end
end
