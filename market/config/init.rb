require 'rubygems'
require 'mongo'
require 'yaml'

begin
    CONF      = YAML.load_file(CONFIGURATION_FILE)
rescue Exception => e
    STDERR.puts "Error parsing config file #{CONFIGURATION_FILE}: #{e.message}"
    exit 1
end

db_name = 'market'
DB = Mongo::Connection.new(CONF['db_host'], CONF['db_port']).db(db_name)