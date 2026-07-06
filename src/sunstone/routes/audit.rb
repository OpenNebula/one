# Sinatra route for audit API (Sunstone backend)

require 'sinatra/base'
require 'json'
require_relative '../../../include/audit_log'

module Sunstone
  class AuditRoutes < Sinatra::Base
    post '/audit/query' do
      content_type :json
      begin
        filters = JSON.parse(request.body.read, symbolize_names: true)
        config = { audit_db: ENV['OPENNEBULA_AUDIT_DB'] || 'sqlite:///var/lib/one/audit.db' }
        AuditLog.init(config)
        entries = AuditLog.query(filters)
        entries.to_json
      rescue => e
        status 500
        { error: e.message }.to_json
      end
    end
  end
end
