$LOAD_PATH.unshift File.dirname(__FILE__)

require 'packet/client'
require 'packet/configuration'
require 'packet/errors'
require 'packet/version'

module Packet
  def self.configuration
    @configuration ||= Configuration.new
  end

  def self.configure
    yield(configuration)
    reset_client!
    true
  end

  def self.reset!
    @configuration = Configuration.new
    reset_client!
  end

  def self.client
    @client ||= Packet::Client.new
  end

  def self.reset_client!
    @client = nil
  end
  private_class_method :reset_client!

  if RUBY_VERSION >= '1.9'
    def self.respond_to_missing?(method_name, include_private = false)
      client.respond_to?(method_name, include_private)
    end
  else
    def self.respond_to?(method_name, include_private = false)
      client.respond_to?(method_name, include_private) || super
    end
  end

  def self.method_missing(method_name, *args, &block)
    if client.respond_to?(method_name)
      client.send(method_name, *args, &block)
    else
      super
    end
  end
  private_class_method :method_missing
end
