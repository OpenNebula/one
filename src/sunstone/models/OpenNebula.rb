class OpenNebula
  def self.get_config
    # Fetch from sunstone config
    Sunstone::Config.new.to_frontend
  end
end