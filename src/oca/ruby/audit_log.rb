module AuditLog
  require 'sqlite3' if defined?(SQLite3)
  
  def self.log(request)
    db = get_db
    db.execute("INSERT INTO audit_log (user_id, request, arguments, timestamp, result, objects, acl_rule, session_cached) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      request[:user_id],
      request[:request],
      request[:arguments].to_json,
      Time.now.to_i,
      request[:result],
      request[:objects].to_json,
      request[:acl_rule],
      request[:session_cached] ? 1 : 0
    )
  rescue => e
    # Log error but don't break the main flow
    $log.error("AuditLog error: #{e.message}")
  end

  def self.query(filters = {})
    db = get_db
    conditions = []
    params = []
    if filters[:user_id]
      conditions << "user_id = ?"
      params << filters[:user_id]
    end
    if filters[:from_time]
      conditions << "timestamp >= ?"
      params << filters[:from_time]
    end
    if filters[:to_time]
      conditions << "timestamp <= ?"
      params << filters[:to_time]
    end
    if filters[:object_type]
      conditions << "objects LIKE ?"
      params << "%#{filters[:object_type]}%"
    end
    where_clause = conditions.empty? ? "" : "WHERE #{conditions.join(' AND ')}"
    db.execute("SELECT * FROM audit_log #{where_clause} ORDER BY timestamp DESC LIMIT 1000", *params)
  end

  private

  def self.get_db
    db_path = "/var/lib/one/one_audit.db"
    db = SQLite3::Database.new(db_path)
    db.results_as_hash = true
    db
  end
end