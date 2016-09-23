# Copyright (c) 2011 VMware, Inc.  All Rights Reserved.
require 'rbvmomi'

# Win32::SSPI is part of core on Windows
begin
  require 'win32/sspi'
rescue LoadError
end
WIN32 = (defined? Win32::SSPI)

module RbVmomi

# A connection to one vSphere SDK endpoint.
# @see #serviceInstance
class VIM < Connection
  # Connect to a vSphere SDK endpoint
  #
  # @param [Hash] opts The options hash.
  # @option opts [String]  :host Host to connect to.
  # @option opts [Numeric] :port (443) Port to connect to.
  # @option opts [Boolean] :ssl (true) Whether to use SSL.
  # @option opts [Boolean] :insecure (false) If true, ignore SSL certificate errors.
  # @option opts [String]  :cookie If set, use cookie to connect instead of user/password
  # @option opts [String]  :user (root) Username.
  # @option opts [String]  :password Password.
  # @option opts [String]  :path (/sdk) SDK endpoint path.
  # @option opts [Boolean] :debug (false) If true, print SOAP traffic to stderr.
  def self.connect opts
    fail unless opts.is_a? Hash
    fail "host option required" unless opts[:host]
    opts[:cookie] ||= nil
    opts[:user] ||= (WIN32 ? ENV['USERNAME'].dup : 'root')
    opts[:password] ||= ''
    opts[:ssl] = true unless opts.member? :ssl or opts[:"no-ssl"]
    opts[:insecure] ||= false
    opts[:port] ||= (opts[:ssl] ? 443 : 80)
    opts[:path] ||= '/sdk'
    opts[:ns] ||= 'urn:vim25'
    rev_given = opts[:rev] != nil
    opts[:rev] = '6.0' unless rev_given
    opts[:debug] = (!ENV['RBVMOMI_DEBUG'].empty? rescue false) unless opts.member? :debug

    new(opts).tap do |vim|
      unless opts[:cookie]
        if WIN32 && opts[:password] == ''
            # Attempt login by SSPI if no password specified on Windows
            negotiation = Win32::SSPI::NegotiateAuth.new opts[:user], ENV['USERDOMAIN'].dup
            begin
              vim.serviceContent.sessionManager.LoginBySSPI :base64Token => negotiation.get_initial_token
            rescue RbVmomi::Fault => fault
              if !fault.fault.is_a?(RbVmomi::VIM::SSPIChallenge)
                raise
              else
                vim.serviceContent.sessionManager.LoginBySSPI :base64Token => negotiation.complete_authentication(fault.base64Token)
              end
            end
        else
            vim.serviceContent.sessionManager.Login :userName => opts[:user], :password => opts[:password]
        end
      end
      unless rev_given
        rev = vim.serviceContent.about.apiVersion
        vim.rev = [rev, '6.0'].min
      end
    end
  end

  def close
    VIM::SessionManager(self, 'SessionManager').Logout rescue RbVmomi::Fault
    self.cookie = nil
    super
  end

  def rev= x
    super
    @serviceContent = nil
  end

  # Return the ServiceInstance
  #
  # The ServiceInstance is the root of the vSphere inventory.
  # @see http://www.vmware.com/support/developer/vc-sdk/visdk41pubs/ApiReference/vim.ServiceInstance.html
  def serviceInstance
    VIM::ServiceInstance self, 'ServiceInstance'
  end

  # Alias to serviceInstance.RetrieveServiceContent
  def serviceContent
    @serviceContent ||= serviceInstance.RetrieveServiceContent
  end

  # Alias to serviceContent.rootFolder
  def rootFolder
    serviceContent.rootFolder
  end

  alias root rootFolder

  # Alias to serviceContent.propertyCollector
  def propertyCollector
    serviceContent.propertyCollector
  end

  # Alias to serviceContent.searchIndex
  def searchIndex
    serviceContent.searchIndex
  end

  # @private
  def pretty_print pp
    pp.text "VIM(#{@opts[:host]})"
  end

  def instanceUuid
    serviceContent.about.instanceUuid
  end

  def get_log_lines logKey, lines=5, start=nil, host=nil
    diagMgr = self.serviceContent.diagnosticManager
    if !start
      log = diagMgr.BrowseDiagnosticLog(:host => host, :key => logKey, :start => 999999999)
      lineEnd = log.lineEnd
      start = lineEnd - lines
    end
    start = start < 0 ? 0 : start
    log = diagMgr.BrowseDiagnosticLog(:host => host, :key => logKey, :start => start)
    if log.lineText.size > 0
      [log.lineText.slice(-lines, log.lineText.size), log.lineEnd]
    else
      [log.lineText, log.lineEnd]
    end
  end

  def get_log_keys host=nil
    diagMgr = self.serviceContent.diagnosticManager
    keys = []
    diagMgr.QueryDescriptions(:host => host).each do |desc|
      keys << "#{desc.key}"
    end
    keys
  end

  add_extension_dir File.join(File.dirname(__FILE__), "vim")
  (ENV['RBVMOMI_VIM_EXTENSION_PATH']||'').split(':').each { |dir| add_extension_dir dir }

  load_vmodl(ENV['VMODL'] || File.join(File.dirname(__FILE__), "../../vmodl.db"))
end

end
