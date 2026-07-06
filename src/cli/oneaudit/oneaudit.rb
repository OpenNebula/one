require 'opennebula'

class OneAuditCommand < OpenNebula::CLI
  def self.description
    'Query audit log'
  end

  def self.usage
    'oneaudit [options]'
  end

  def self.args
    [
      ['-u', '--user USER_ID', 'Filter by user ID'],
      ['-r', '--resource TYPE:ID', 'Filter by resource (e.g., VM:42)'],
      ['-s', '--since TIMESTAMP', 'Filter from timestamp'],
      ['-e', '--until TIMESTAMP', 'Filter until timestamp'],
      ['-a', '--action ACTION', 'Filter by action'],
      ['-l', '--limit N', 'Limit results (default 50)']
    ]
  end

  def take_action(args, options)
    filters = {}
    filters[:user_id] = options[:user] if options[:user]
    if options[:resource]
      type, id = options[:resource].split(':')
      filters[:resource_type] = type.upcase
      filters[:resource_id] = id.to_i
    end
    filters[:start_time] = Time.parse(options[:since]) if options[:since]
    filters[:end_time] = Time.parse(options[:until]) if options[:until]
    filters[:action] = options[:action] if options[:action]
    limit = (options[:limit] || 50).to_i

    results = Audit.search(filters).limit(limit).all

    if results.empty?
      puts 'No audit entries found.'
    else
      puts 'Timestamp\tUser\tResource\tAction\tResult'
      results.each do |entry|
        puts "#{entry.timestamp}\t#{entry.user_id}\t#{entry.resource_type}:#{entry.resource_id}\t#{entry.action}\t#{entry.result ? 'Success' : 'Failure'}"
      end
    end
  end
end

OpenNebula::CLI.register(OneAuditCommand)
