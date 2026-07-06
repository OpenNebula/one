# Sunstone plugin for Audit Log tab
# Register routes and provide data

require 'sequel'
require 'json'

module Sunstone
  module Plugins
    class AuditLog < Sunstone::Plugin
      def initialize
        super('audit_log', 'Audit Log', '/audit')
      end

      def routes(server)
        server.get '/audit' do
          content_type :json
          DB = Sequel.connect('sqlite:///var/lib/one/one.db') # adjust
          ds = DB[:audit_log]
          if params[:user]
            ds = ds.where(user_id: params[:user].to_i)
          end
          if params[:from]
            ds = ds.where { timestamp >= params[:from].to_i }
          end
          if params[:to]
            ds = ds.where { timestamp <= params[:to].to_i }
          end
          ds.order(:timestamp).limit(100).all.to_json
        end
      end
    end
  end
end
