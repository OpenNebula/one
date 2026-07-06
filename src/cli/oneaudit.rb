#!/usr/bin/env ruby

require 'sequel'
require 'json'
require 'optparse'

DB = Sequel.connect('sqlite:///var/lib/one/one.db')

def filter_entries(options)
  ds = DB[:audit_log]
  ds = ds.where(user_id: options[:user]) if options[:user]
  ds = ds.where { timestamp >= options[:from].to_i } if options[:from]
  ds = ds.where { timestamp <= options[:to].to_i } if options[:to]
  ds = ds.where(action: options[:action]) if options[:action]
  ds = ds.where(Sequel.lit('objects LIKE ?', "%#{options[:object]}%")) if options[:object]
  ds.order(:timestamp).each do |row|
    puts JSON.pretty_generate(row)
  end
end

options = {}
OptionParser.new do |opts|
  opts.banner = "Usage: oneaudit [options]"
  opts.on('-u', '--user USER', 'Filter by user ID') { |v| options[:user] = v.to_i }
  opts.on('-a', '--action ACTION', 'Filter by action') { |v| options[:action] = v }
  opts.on('-o', '--object OBJECT', 'Filter by object (e.g., VM ID)') { |v| options[:object] = v }
  opts.on('-f', '--from FROM', 'Start timestamp (epoch)') { |v| options[:from] = v }
  opts.on('-t', '--to TO', 'End timestamp (epoch)') { |v| options[:to] = v }
  opts.on('-h', '--help', 'Prints help') { puts opts; exit }
end.parse!

filter_entries(options)
