# Backend panel for Sunstone audit tab
require 'sqlite3'
require 'json'

module Sunstone
  module Panels
    class AuditPanel < Sunstone::Panel
      def list(params)
        db = SQLite3::Database.new('/var/lib/one/one.db')
        db.results_as_hash = true
        conditions = []
        conditions << "user_id = #{params[:user_id]}" if params[:user_id]
        conditions << "action = '#{params[:action]}'" if params[:action]
        conditions << "timestamp >= '#{params[:start]}'" if params[:start]
        conditions << "timestamp <= '#{params[:end]}'" if params[:end]
        where = conditions.empty? ? '' : "WHERE #{conditions.join(' AND ')}"
        rows = db.execute("SELECT * FROM audit_log #{where} ORDER BY timestamp DESC")
        rows.to_json
      rescue => e
        { error: e.message }.to_json
      ensure
        db.close if db
      end
    end
  end
end