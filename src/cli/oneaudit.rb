#!/usr/bin/env ruby
# oneaudit CLI tool to query audit logs
require 'sqlite3'
require 'optparse'

options = {}
OptionParser.new do |opts|
  opts.on('--user UID', 'Filter by user ID') { |v| options[:user] = v.to_i }
  opts.on('--start DATE', 'Start date (YYYY-MM-DD HH:MM:SS)') { |v| options[:start] = v }
  opts.on('--end DATE', 'End date') { |v| options[:end] = v }
  opts.on('--method METHOD', 'Filter by request method') { |v| options[:method] = v }
  opts.on('--object OBJ', 'Filter by object (e.g., VM:123)') { |v| options[:object] = v }
end.parse!

db = SQLite3::Database.new(ARGV[0] || '/var/lib/one/one.db')
query = 'SELECT * FROM audit_log WHERE 1=1'
params = []

if options[:user]
  query << ' AND user_id = ?'
  params << options[:user]
end
if options[:start]
  query << ' AND timestamp >= ?'
  params << options[:start]
end
if options[:end]
  query << ' AND timestamp <= ?'
  params << options[:end]
end
if options[:method]
  query << ' AND request_method = ?'
  params << options[:method]
end
if options[:object]
  query << ' AND objects_involved LIKE ?'
  params << "%#{options[:object]}%"
end

query << ' ORDER BY timestamp DESC'

db.execute(query, params).each do |row|
  puts "ID: #{row[0]}, Timestamp: #{row[1]}, User: #{row[2]}, Method: #{row[3]}, Params: #{row[4]}, Result: #{row[5][0..50]}, Objects: #{row[6]}"
end