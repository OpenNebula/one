# Copyright (c) 2013 VMware, Inc.  All Rights Reserved.
require 'rbvmomi'
module RbVmomi

# A connection to one vSphere SMS endpoint.
# @see #serviceInstance
class SMS < Connection
  # Connect to a vSphere SMS endpoint
  #
  # @param [VIM] Connection to main vSphere API endpoint
  # @param [Hash] opts The options hash.
  # @option opts [String]  :host Host to connect to.
  # @option opts [Numeric] :port (443) Port to connect to.
  # @option opts [Boolean] :ssl (true) Whether to use SSL.
  # @option opts [Boolean] :insecure (false) If true, ignore SSL certificate errors.
  # @option opts [String]  :path (/sms/sdk) SDK endpoint path.
  # @option opts [Boolean] :debug (false) If true, print SOAP traffic to stderr.
  def self.connect vim, opts = {}
    fail unless opts.is_a? Hash
    opts[:host] = vim.host
    opts[:ssl] = true unless opts.member? :ssl or opts[:"no-ssl"]
    opts[:insecure] ||= true
    opts[:port] ||= (opts[:ssl] ? 443 : 80)
    opts[:path] ||= '/sms/sdk'
    opts[:ns] ||= 'urn:sms'
    rev_given = opts[:rev] != nil
    opts[:rev] = '4.0' unless rev_given
    opts[:debug] = (!ENV['RBVMOMI_DEBUG'].empty? rescue false) unless opts.member? :debug

    new(opts).tap do |sms|
      sms.vcSessionCookie = vim.cookie.split('"')[1]
    end
  end

  def vcSessionCookie= cookie
    @vcSessionCookie = cookie
  end

  def rev= x
    super
    @serviceContent = nil
  end

  # Return the ServiceInstance
  #
  # The ServiceInstance is the root of the vSphere inventory.
  def serviceInstance
    @serviceInstance ||= VIM::SmsServiceInstance self, 'ServiceInstance'
  end

  # @private
  def pretty_print pp
    pp.text "SMS(#{@opts[:host]})"
  end

  add_extension_dir File.join(File.dirname(__FILE__), "sms")
  load_vmodl(ENV['VMODL'] || File.join(File.dirname(__FILE__), "../../vmodl.db"))
end

end

