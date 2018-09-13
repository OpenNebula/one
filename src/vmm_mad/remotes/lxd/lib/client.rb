#!/usr/bin/ruby

require 'net/http'
require 'socket'
require 'json'

# Modified HTTPRequest class
class Net::HTTPRequest
  def initialize(path, initheader = { 'Host' => 'localhost' })
    # api = '/1.0/' # Fix monkeypatch not working
    # path = "#{api}#{path}"# Fix Monkeypatch not working

    super self.class::METHOD,
          self.class::REQUEST_HAS_BODY,
          self.class::RESPONSE_HAS_BODY,
          path, initheader
  end
end

# Base requests to interact with LXD
module LXDRequests
  attr_reader :api

  def initialize
    @sock = Net::BufferedIO.new(UNIXSocket.new('/var/lib/lxd/unix.socket'))
    @api = '/1.0/'
  end

  # Returns the HTTPResponse body as a hash
  def get_response(request, data = nil)
    request.body = JSON.dump(data) unless data.nil?
    request.exec(@sock, '1.1', request.path)
    begin
      response = Net::HTTPResponse.read_new(@sock)
    end while response.is_a?(Net::HTTPContinue)
    response.reading_body(@sock, request.response_body_permitted?) {}
    JSON.parse(response.body)
  end

  def fix_uri(uri)# Fix monkeypatch not working
    "#{@api}#{uri}"
  end

  def get(uri)
    uri = fix_uri(uri) # Fix monkeypatch not working
    get_response(Net::HTTP::Get.new(uri))
  end

  def put(uri, data)
    uri = fix_uri(uri) # Fix monkeypatch not working
    get_response(Net::HTTP::Put.new(uri), data)
  end

  def post(uri, data)
    uri = fix_uri(uri) # Fix monkeypatch not working
    get_response(Net::HTTP::Post.new(uri), data)
  end

  def patch(uri, data)
    uri = fix_uri(uri) # Fix monkeypatch not working
    get_response(Net::HTTP::Patch.new(uri), data)
end

# LXD API Client
class Client
  include LXDRequests

  def initialize
    super
    @containers = "#{@api}containers/"
    @operations = "#{@api}operations/"
  end

  # # Containers
  # # Retrieve all containers.
  # def all; end

  # # Returns boolean indicating if the container exists.
  # def exist(name); end

  # # Get a specific container, by its name
  # def get(name); end

  # # Create a new containerputs. This method requires the container config as the first parameter.
  # def create(sock, uri)
  #   request = Net::HTTP::Post.new("/1.0/#{uri}", initheader = { 'Host' => 'localhost' })

  #   request.body = JSON.dump(
  #     'name' => 'ruby',
  #     'source' => {
  #       'type' => 'none'
  #     }
  #   )

  #   request.exec(sock, '1.1', "/1.0/#{uri}")
  #   request
  # end

  # # Operations
  # # Get a specific operation, by its id.
  # def get(operation); end

  # # get an operation, but wait until it is complete before returning the operation object.
  # def wait_for(operation); end
end
