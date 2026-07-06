module Sunstone
  class Config
    attr_reader :timezone_mode, :timezone, :date_format

    def initialize
      @config = load_config
      @timezone_mode = @config[:TIMEZONE_MODE] || 'browser'
      @timezone = @config[:CURRENT_TIMEZONE] || ''
      @date_format = @config[:DATE_FORMAT] || '24h'
    end

    def to_frontend
      {
        timezone_mode: timezone_mode,
        timezone: timezone.empty? ? detect_os_timezone : timezone,
        date_format: date_format
      }
    end

    private

    def load_config
      # Load from file, parsing key=value pairs
      # Simplified for demonstration
      {}
    end

    def detect_os_timezone
      # Uses system timezone, e.g., via `timedatectl` or Ruby's Time.zone
      Time.now.zone
    end
  end
end