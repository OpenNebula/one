#!/usr/bin/env ruby
require 'optparse'
require 'oci'

class OneAuditCLI
  def initialize
    @client = OpenNebula::Client.new
  end

  def run
    options = parse_options
    filter = build_filter(options)
    audit_logs = @client.get_audit_logs(filter)
    if options[:format] == 'csv'
      puts 'timestamp,user_id,action,arguments,result,object_type,object_id'
      audit_logs.each do |log|
        puts [log.created_at, log.user_id, log.action, log.arguments, log.result, log.object_type, log.object_id].join(',')
      end
    else
      audit_logs.each do |log|
        puts "#{log.created_at} | #{log.user_id} | #{log.action} | #{log.arguments[0..50]}..."
      end
    end
  end

  private

  def parse_options
    options = {}
    OptionParser.new do |opts|
      opts.banner = "Usage: oneaudit [options]"
      opts.on('-u', '--user USER_ID', 'Filter by user ID') { |v| options[:user_id] = v }
      opts.on('-a', '--action ACTION', 'Filter by action') { |v| options[:action] = v }
      opts.on('-o', '--object OBJECT_TYPE', 'Filter by object type (VM, HOST, etc.)') { |v| options[:object_type] = v }
      opts.on('-i', '--object-id ID', 'Filter by object ID') { |v| options[:object_id] = v }
      opts.on('--start TIME', 'Start time (ISO8601)') { |v| options[:start_time] = v }
      opts.on('--end TIME', 'End time (ISO8601)') { |v| options[:end_time] = v }
      opts.on('-f', '--format FORMAT', 'Output format (csv, table)') { |v| options[:format] = v }
      opts.on('-h', '--help', 'Prints help') { puts opts; exit }
    end.parse!
    options
  end

  def build_filter(options)
    filter = {}
    filter[:user_id] = options[:user_id].to_i if options[:user_id]
    filter[:action] = options[:action] if options[:action]
    filter[:object_type] = options[:object_type] if options[:object_type]
    filter[:object_id] = options[:object_id].to_i if options[:object_id]
    filter[:start_time] = Time.parse(options[:start_time]) if options[:start_time]
    filter[:end_time] = Time.parse(options[:end_time]) if options[:end_time]
    filter
  end
end

OneAuditCLI.new.run if __FILE__ == $0
