#!/usr/bin/ruby

require 'net/http'
require 'socket'
require 'json'

# Base requests to interact with LXD
module LXDRequests
  attr_reader :api

  def initialize
    @sock = Net::BufferedIO.new(UNIXSocket.new('/var/lib/lxd/unix.socket'))
    @api = '/1.0/'
    @header = { 'Host' => 'localhost' }
  end

  # Returns the HTTPResponse body as a hash
  def get_response(request, data)
    request.body = JSON.dump(data) unless data.nil?
    request.exec(@sock, '1.1', request.path)
    begin
      response = Net::HTTPResponse.read_new(@sock)
    end while response.is_a?(Net::HTTPContinue)
    response.reading_body(@sock, request.response_body_permitted?) {}
    JSON.parse(response.body)
  end

  def get(uri)
    get_response(Net::HTTP::Get.new("#{@api}#{uri}", @header), data = nil)
  end

  def delete(uri)
    get_response(Net::HTTP::Delete.new("#{@api}#{uri}", @header), data = nil)
  end

  def put(uri, data)
    get_response(Net::HTTP::Put.new("#{@api}#{uri}", @header), data)
  end

  def post(uri, data)
    get_response(Net::HTTP::Post.new("#{@api}#{uri}", @header), data)
  end

  def patch(uri, data)
    get_response(Net::HTTP::Patch.new("#{@api}#{uri}", @header), data)
  end
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
  # module Containers
  #   # Retrieve all containers.
  #   def all; end

  #   # Returns boolean indicating if the container exists.
  #   def exist(name); end

  #   # Get a specific container, by its name
  #   def get(name); end9

  #   # Create a new containerputs. This method requires the container config as the first parameter.
  #   def create(sock, uri)
  #     request = Net::HTTP::Post.new("/1.0/#{uri}", initheader = { 'Host' => 'localhost' })

  #     request.body = JSON.dump(
  #       'name' => 'ruby',
  #       'source' => {
  #         'type' => 'none'
  #       }
  #     )

  #     request.exec(sock, '1.1', "/1.0/#{uri}")
  #     request
  #   end

  # end

  # # Operations
  # module Operations
  #   # Get a specific operation, by its id.
  #   def get(operation); end

  #   # get an operation, but wait until it is complete before returning the operation object.
  #   def wait_for(operation); end
  # end
end
