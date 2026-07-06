require 'sinatra/base'
require 'time'
require 'tzinfo'

module Sunstone
  class Server < Sinatra::Base
    # Load configuration
    def self.load_config
      config_file = ENV['SUNSTONE_CONFIG'] || '/etc/fireedge/sunstone/sunstone-server.conf'
      if File.exist?(config_file)
        YAML.load_file(config_file)
      else
        {}
      end
    end

    configure do
      set :config, load_config
      set :timezone, resolve_timezone(settings.config['currentTimeZone'])
    end

    def self.resolve_timezone(tz_setting)
      return nil if tz_setting.nil? || tz_setting.empty?
      if tz_setting.upcase == 'OS'
        # Use system timezone from /etc/localtime or TZ environment
        if ENV['TZ']
          ENV['TZ']
        else
          Time.now.zone # Fallback to system zone abbreviation, not ideal
        end
      else
        tz_setting
      end
    end

    helpers do
      def server_timezone
        settings.timezone
      end
    end

    # Inject timezone configuration into JavaScript globally
    before do
      @timezone = server_timezone
    end

    get '/' do
      erb :index, locals: { timezone: @timezone }
    end
  end
end
