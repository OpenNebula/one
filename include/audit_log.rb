# OpenNebula audit trail module
# Logs all XML-RPC requests to a database table

require 'sequel'
require 'opennebula'

module AuditLog
  @db = nil
  @enabled = false

  def self.init(config = {})
    return unless config[:audit_db]

    @db = Sequel.connect(config[:audit_db])
    @enabled = true

    create_table unless @db.table_exists?(:audit_log)
  rescue => e
    OpenNebula::Log.error("AuditLog init failed: #{e.message}")
    @enabled = false
  end

  def self.log(request, user_id, params, result, objects = [])
    return unless @enabled

    timestamp = Time.now.utc
    acl_rule = Thread.current[:acl_rule] || 'unknown'
    session_cached = Thread.current[:session_cached] || false

    begin
      @db[:audit_log].insert(
        timestamp: timestamp,
        user_id: user_id,
        request: request,
        params: params.to_json,
        result: result.to_json,
        objects: objects.to_json,
        acl_rule: acl_rule,
        session_cached: session_cached
      )
    rescue => e
      OpenNebula::Log.error("AuditLog insert failed: #{e.message}")
    end
  end

  def self.query(filters = {})
    return [] unless @enabled

    ds = @db[:audit_log]
    ds = ds.where(timestamp: filters[:start]..filters[:end]) if filters[:start] && filters[:end]
    ds = ds.where(user_id: filters[:user_id]) if filters[:user_id]
    ds = ds.where(request: filters[:request]) if filters[:request]
    ds = ds.where(Sequel.lit("objects LIKE '%\"#{filters[:object_id]}\"%'")) if filters[:object_id]
    ds.order(Sequel.desc(:timestamp)).limit(filters[:limit] || 100).all
  end

  def self.create_table
    @db.create_table :audit_log do
      primary_key :id
      DateTime :timestamp, null: false
      Integer :user_id, null: false
      String :request, null: false
      Text :params
      Text :result
      Text :objects
      String :acl_rule
      TrueClass :session_cached, default: false
      index :timestamp
      index :user_id
      index :request
    end
  end

  private_class_method :create_table
end
