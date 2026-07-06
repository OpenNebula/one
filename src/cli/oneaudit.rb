#!/usr/bin/env ruby

require 'opennebula'
include OpenNebula

class OneAudit
    def initialize
        @client = Client.new
    end

    def list(options)
        filter = {}
        filter[:uid] = options[:user] if options[:user]
        filter[:start_time] = options[:start] if options[:start]
        filter[:end_time] = options[:end] if options[:end]
        filter[:object_type] = options[:object_type] if options[:object_type]
        filter[:object_id] = options[:object_id] if options[:object_id]
        filter[:request] = options[:request] if options[:request]
        filter[:result] = options[:result] if options[:result]

        # This assumes a method audit_log_list in OpenNebula::Client
        # which calls the oned XML-RPC
        audit_logs = @client.audit_log_list(filter)

        puts format_audit_logs(audit_logs)
    end

    private

    def format_audit_logs(logs)
        header = "%-8s %-10s %-20s %-15s %-10s %-8s %-12s %-10s %-8s" % ["ID", "UID", "Timestamp", "Request", "Result", "ObjType", "ObjID", "ACL", "Session"]
        separator = "-" * 100
        rows = logs.map do |log|
            "%-8d %-10d %-20s %-15s %-10s %-8s %-12d %-10s %-8s" % [
                log[:id], log[:uid], Time.at(log[:timestamp]).to_s,
                log[:request], log[:result], log[:object_type],
                log[:object_id], log[:acl_rule], log[:session]
            ]
        end
        [header, separator, rows].join("\n")
    end
end

if __FILE__ == $0
    require 'optparse'

    options = {}
    OptionParser.new do |opts|
        opts.banner = "Usage: oneaudit [options]"

        opts.on("-u", "--user UID", "Filter by user ID") do |u|
            options[:user] = u.to_i
        end
        opts.on("-s", "--start TIME", "Start timestamp (Unix)") do |s|
            options[:start] = s.to_i
        end
        opts.on("-e", "--end TIME", "End timestamp (Unix)") do |e|
            options[:end] = e.to_i
        end
        opts.on("-o", "--object-type TYPE", "Object type (VM, HOST, ...)") do |o|
            options[:object_type] = o
        end
        opts.on("-i", "--object-id ID", "Object ID") do |i|
            options[:object_id] = i.to_i
        end
        opts.on("-r", "--request METHOD", "Request method name") do |r|
            options[:request] = r
        end
        opts.on("-t", "--result RESULT", "Result (SUCCESS/FAILURE)") do |t|
            options[:result] = t
        end
        opts.on("-h", "--help", "Prints this help") do
            puts opts
            exit
        end
    end.parse!

    audit = OneAudit.new
    audit.list(options)
end
