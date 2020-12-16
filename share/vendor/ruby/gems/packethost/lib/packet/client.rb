require 'faraday'
require 'faraday_middleware'

require 'packet/entity'

%w(device facility operating_system plan project ssh_key user ip ip_range).each do |f|
  require "packet/#{f}"
  require "packet/client/#{f.pluralize}"
end

module Packet
  class Client
    attr_accessor :auth_token, :consumer_token, :url

    def initialize(auth_token = nil, consumer_token = nil, url = nil)
      self.url = url || Packet.configuration.url
      self.auth_token = auth_token || Packet.configuration.auth_token
      self.consumer_token = consumer_token || Packet.configuration.consumer_token
    end

    [:get, :post, :patch, :head, :delete].each do |method|
      define_method(method) do |*args|
        response = client.send(method, *args)
        fail_on_error(response) || response
      end
    end

    def inspect
      %(#<#{self.class}:#{format('%014x', (object_id << 1))}>)
    end

    private

    def client
      @client ||= Faraday.new(url: url, headers: headers, ssl: { verify: true }) do |faraday|
        faraday.request :json
        faraday.response :json, content_type: /\bjson$/
        faraday.adapter Faraday.default_adapter
      end
    end

    def headers
      {
        'X-Consumer-Token' => consumer_token,
        'X-Auth-Token' => auth_token,
        # 'X-Packet-Staff' => '1',
        'Content-Type' => 'application/json',
        'Accept' => 'application/json'
      }.reject { |_, v| v.nil? }
    end

    def fail_on_error(response)
      return if response.success?

      klass = case response.status
              when 404 then NotFound
              else Error
              end
      raise klass, response.body
    end

    include Packet::Client::Devices
    include Packet::Client::Facilities
    include Packet::Client::OperatingSystems
    include Packet::Client::Plans
    include Packet::Client::Projects
    include Packet::Client::SshKeys
    include Packet::Client::Users
    include Packet::Client::Ips
    include Packet::Client::IpRanges
  end
end
