require 'sinatra/base'
require 'sqlite3'

module Sunstone
  class App < Sinatra::Base
    get '/audit_log' do
      db = SQLite3::Database.new('/var/lib/one/one.db')
      query = 'SELECT * FROM audit_log WHERE 1=1'
      params = []

      if params[:user_id] && !params[:user_id].empty?
        query << ' AND user_id = ?'
        params << params[:user_id].to_i
      end
      if params[:method] && !params[:method].empty?
        query << ' AND request_method = ?'
        params << params[:method]
      end
      if params[:object] && !params[:object].empty?
        query << ' AND objects_involved LIKE ?'
        params << "%#{params[:object]}%"
      end
      if params[:start] && !params[:start].empty?
        query << ' AND timestamp >= ?'
        params << params[:start]
      end
      if params[:end] && !params[:end].empty?
        query << ' AND timestamp <= ?'
        params << params[:end]
      end

      query << ' ORDER BY timestamp DESC'
      rows = db.execute(query, params)
      content_type :json
      rows.map do |row|
        { id: row[0], timestamp: row[1], user_id: row[2], request_method: row[3], request_params: row[4], result: row[5], objects_involved: row[6] }
      end.to_json
    end
  end
end