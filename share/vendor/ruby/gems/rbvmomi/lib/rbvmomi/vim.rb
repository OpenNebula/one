# Copyright (c) 2011 VMware, Inc.  All Rights Reserved.
require 'rbvmomi'

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
  # @option opts [String]  :user (root) Username.
  # @option opts [String]  :password Password.
  # @option opts [String]  :path (/sdk) SDK endpoint path.
  # @option opts [Boolean] :debug (false) If true, print SOAP traffic to stderr.
  def self.connect opts
    fail unless opts.is_a? Hash
    fail "host option required" unless opts[:host]
    opts[:user] ||= 'root'
    opts[:password] ||= ''
    opts[:ssl] = true unless opts.member? :ssl or opts[:"no-ssl"]
    opts[:insecure] ||= false
    opts[:port] ||= (opts[:ssl] ? 443 : 80)
    opts[:path] ||= '/sdk'
    opts[:ns] ||= 'urn:vim25'
    rev_given = opts[:rev] != nil
    opts[:rev] = '4.0' unless rev_given
    opts[:debug] = (!ENV['RBVMOMI_DEBUG'].empty? rescue false) unless opts.member? :debug

    new(opts).tap do |vim|
      vim.serviceContent.sessionManager.Login :userName => opts[:user], :password => opts[:password]
      unless rev_given
        rev = vim.serviceContent.about.apiVersion
        vim.rev = [rev, '5.0'].min
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

  add_extension_dir File.join(File.dirname(__FILE__), "vim")
  (ENV['RBVMOMI_VIM_EXTENSION_PATH']||'').split(':').each { |dir| add_extension_dir dir }

  load_vmodl(ENV['VMODL'] || File.join(File.dirname(__FILE__), "../../vmodl.db"))
end

end
