# Copyright (c) 2010 VMware, Inc.  All Rights Reserved.
require 'rubygems'
require 'builder'
require 'nokogiri'
require 'net/http'
require 'pp'

class RbVmomi::TrivialSoap
  attr_accessor :debug, :cookie
  attr_reader :http

  def initialize opts
    fail unless opts.is_a? Hash
    @opts = opts
    return unless @opts[:host] # for testcases
    @debug = @opts[:debug]
    @cookie = @opts[:cookie]
    @lock = Mutex.new
    @http = nil
    restart_http
  end

  def host
    @opts[:host]
  end

  def close
    @http.finish rescue IOError
  end

  def restart_http
    begin 
      @http.finish if @http
    rescue Exception => ex
      puts "WARNING: Ignoring exception: #{ex.message}"
      puts ex.backtrace.join("\n")
    end
    @http = Net::HTTP.new(@opts[:host], @opts[:port], @opts[:proxyHost], @opts[:proxyPort])
    if @opts[:ssl]
      require 'net/https'
      @http.use_ssl = true
      if @opts[:insecure]
        @http.verify_mode = OpenSSL::SSL::VERIFY_NONE
      else
        @http.verify_mode = OpenSSL::SSL::VERIFY_PEER
      end
      @http.cert = OpenSSL::X509::Certificate.new(@opts[:cert]) if @opts[:cert]
      @http.key = OpenSSL::PKey::RSA.new(@opts[:key]) if @opts[:key]
    end
    @http.set_debug_output(STDERR) if $DEBUG
    @http.read_timeout = 1000000
    @http.open_timeout = 60
    def @http.on_connect
      @socket.io.setsockopt(Socket::IPPROTO_TCP, Socket::TCP_NODELAY, 1)
    end
    @http.start
  end

  def soap_envelope
    xsd = 'http://www.w3.org/2001/XMLSchema'
    env = 'http://schemas.xmlsoap.org/soap/envelope/'
    xsi = 'http://www.w3.org/2001/XMLSchema-instance'
    xml = Builder::XmlMarkup.new :indent => 0
    xml.tag!('env:Envelope', 'xmlns:xsd' => xsd, 'xmlns:env' => env, 'xmlns:xsi' => xsi) do
      if @vcSessionCookie
        xml.tag!('env:Header') do
          xml.tag!('vcSessionCookie', @vcSessionCookie)
        end
      end
      xml.tag!('env:Body') do
        yield xml if block_given?
      end
    end
    xml
  end

  def request action, body
    headers = { 'content-type' => 'text/xml; charset=utf-8', 'SOAPAction' => action }
    headers['cookie'] = @cookie if @cookie

    if @debug
      $stderr.puts "Request:"
      $stderr.puts body
      $stderr.puts
    end

    start_time = Time.now
    response = @lock.synchronize do
      begin
        @http.request_post(@opts[:path], body, headers)
      rescue Exception
        restart_http
        raise
      end
    end
    end_time = Time.now
    
    if response.is_a? Net::HTTPServiceUnavailable
      raise "Got HTTP 503: Service unavailable"
    end

    self.cookie = response['set-cookie'] if response.key? 'set-cookie'

    nk = Nokogiri(response.body)

    if @debug
      $stderr.puts "Response (in #{'%.3f' % (end_time - start_time)} s)"
      $stderr.puts nk
      $stderr.puts
    end

    [nk.xpath('//soapenv:Body/*').select(&:element?).first, response.body.size]
  end
end
