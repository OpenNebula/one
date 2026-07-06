require 'sqlite3'

module AuditLog
  DB_PATH = '/var/lib/one/one.db'

  def self.log(request)
    db = SQLite3::Database.new(DB_PATH)
    db.execute(
      "INSERT INTO audit_log (user_id, session, action, arguments, result, objects, acl_rule, success) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        request.user_id,
        request.session,
        request.action,
        request.arguments.to_json,
        request.result.to_json,
        request.objects.to_json,
        request.acl_rule,
        request.success?
      ]
    )
  rescue => e
    # silently fail to avoid breaking main flow
    OpenNebula.log_error("AuditLog failed: #{e.message}")
  ensure
    db.close if db
  end
end