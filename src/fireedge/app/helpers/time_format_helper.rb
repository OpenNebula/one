module TimeFormatHelper
  def self.format_time(timestamp, config)
    mode = config[:timezone_mode] || 'browser'
    if mode == 'server'
      tz = config[:currentTimeZone]
      if tz && !tz.empty?
        timezone = ActiveSupport::TimeZone[tz]
      else
        timezone = Time.zone
      end
      timestamp.in_time_zone(timezone).strftime('%Y-%m-%d %H:%M:%S %Z')
    else
      # browser mode: send UTC; frontend handles conversion
      timestamp.utc.iso8601
    end
  end
end
