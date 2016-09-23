# @note +deployOVF+ and requires +curl+. If +curl+ is not in your +PATH+
#       then set the +CURL+ environment variable to point to it.
# @todo Use an HTTP library instead of executing +curl+.
class RbVmomi::VIM::OvfManager
  CURLBIN = ENV['CURL'] || "curl" #@private

  # Deploy an OVF.
  #
  # @param [Hash] opts The options hash.
  # @option opts [String]             :uri Location of the OVF.
  # @option opts [String]             :vmName Name of the new VM.
  # @option opts [VIM::Folder]        :vmFolder Folder to place the VM in.
  # @option opts [VIM::HostSystem]    :host Host to use.
  # @option opts [VIM::ResourcePool]  :resourcePool Resource pool to use.
  # @option opts [VIM::Datastore]     :datastore Datastore to use.
  # @option opts [String]             :diskProvisioning (thin) Disk provisioning mode.
  # @option opts [Hash]               :networkMappings Network mappings.
  # @option opts [Hash]               :propertyMappings Property mappings.
  # @option opts [String]             :deploymentOption Deployment option key.
  def deployOVF opts
    opts = { :networkMappings => {},
             :propertyMappings => {},
             :diskProvisioning => :thin }.merge opts

    %w(uri vmName vmFolder host resourcePool datastore).each do |k|
      fail "parameter #{k} required" unless opts[k.to_sym]
    end

    ovfImportSpec = RbVmomi::VIM::OvfCreateImportSpecParams(
      :hostSystem => opts[:host],
      :locale => "US",
      :entityName => opts[:vmName],
      :deploymentOption => opts[:deploymentOption] || "",
      :networkMapping => opts[:networkMappings].map{|from, to| RbVmomi::VIM::OvfNetworkMapping(:name => from, :network => to)},
      :propertyMapping => opts[:propertyMappings].to_a,
      :diskProvisioning => opts[:diskProvisioning]
    )

    result = CreateImportSpec(
      :ovfDescriptor => open(opts[:uri]).read,
      :resourcePool => opts[:resourcePool],
      :datastore => opts[:datastore],
      :cisp => ovfImportSpec
    )

    raise result.error[0].localizedMessage if result.error && !result.error.empty?

    if result.warning
      result.warning.each{|x| puts "OVF Warning: #{x.localizedMessage.chomp}" }
    end

    importSpec = result.importSpec
    if importSpec && importSpec.instantiationOst && importSpec.instantiationOst.child
      importSpec.instantiationOst.child.each do |child|
        child.section.map do |section|
          section.xml = _handle_ost(section.xml, opts)
        end
      end
    end
    
    nfcLease = opts[:resourcePool].ImportVApp(:spec => importSpec,
                                              :folder => opts[:vmFolder],
                                              :host => opts[:host])

    nfcLease.wait_until(:state) { nfcLease.state != "initializing" }
    raise nfcLease.error if nfcLease.state == "error"
    begin
      nfcLease.HttpNfcLeaseProgress(:percent => 5)
      timeout, = nfcLease.collect 'info.leaseTimeout'
      puts "DEBUG: Timeout: #{timeout}"
      if timeout < 4 * 60
        puts "WARNING: OVF upload NFC lease timeout less than 4 minutes"
      end
      progress = 5.0
      result.fileItem.each do |fileItem|
        leaseInfo, leaseState, leaseError = nfcLease.collect 'info', 'state', 'error'
        # Retry nfcLease.collect because of PR 969599:
        # If retrying property collector works, this means there is a network
        # or VC overloading problem.
        retrynum = 5
        i = 1
        while i <= retrynum && !leaseState
          puts "Retrying at iteration #{i}"
          sleep 1
          leaseInfo, leaseState, leaseError = nfcLease.collect 'info', 'state', 'error'
          i += 1
        end
        if leaseState != "ready"
          raise "NFC lease is no longer ready: #{leaseState}: #{leaseError}"
        end
        if leaseInfo == nil
          raise "NFC lease disappeared?"
        end
        deviceUrl = leaseInfo.deviceUrl.find{|x| x.importKey == fileItem.deviceId}
        if !deviceUrl
          raise "Couldn't find deviceURL for device '#{fileItem.deviceId}'"
        end

        ovfFilename = opts[:uri].to_s
        tmp = ovfFilename.split(/\//)
        tmp.pop
        tmp << fileItem.path
        filename = tmp.join("/")

        # If filename doesn't have a URI scheme, we're considering it a local file
        if URI(filename).scheme.nil?
          filename = "file://" + filename
        end

        method = fileItem.create ? "PUT" : "POST"

        keepAliveThread = Thread.new do
          while true
            nfcLease.HttpNfcLeaseProgress(:percent => progress.to_i)
            sleep 1 * 60
          end
        end

        i = 1
        ip = nil
        begin
          begin
            puts "Iteration #{i}: Trying to get host's IP address ..."
            ip = opts[:host].config.network.vnic[0].spec.ip.ipAddress
          rescue Exception=>e
            puts "Iteration #{i}: Couldn't get host's IP address: #{e}"
          end
          sleep 1
          i += 1
        end while i <= 5 && !ip
        raise "Couldn't get host's IP address" unless ip
        href = deviceUrl.url.gsub("*", ip)
        downloadCmd = "#{CURLBIN} -L '#{URI::escape(filename)}'"
        uploadCmd = "#{CURLBIN} -Ss -X #{method} --insecure -T - -H 'Content-Type: application/x-vnd.vmware-streamVmdk' '#{URI::escape(href)}'"
        # Previously we used to append "-H 'Content-Length: #{fileItem.size}'"
        # to the uploadCmd. It is not clear to me why, but that leads to 
        # trucation of the uploaded disk. Without this option curl can't tell
        # the progress, but who cares
        system("#{downloadCmd} | #{uploadCmd}", STDOUT => "/dev/null")
        
        keepAliveThread.kill
        keepAliveThread.join
        
        progress += (90.0 / result.fileItem.length)
        nfcLease.HttpNfcLeaseProgress(:percent => progress.to_i)
      end

      nfcLease.HttpNfcLeaseProgress(:percent => 100)
      raise nfcLease.error if nfcLease.state == "error"
      i = 1
      vm = nil
      begin
        begin
          puts "Iteration #{i}: Trying to access nfcLease.info.entity ..."
          vm = nfcLease.info.entity
        rescue Exception=>e
          puts "Iteration #{i}: Couldn't access nfcLease.info.entity: #{e}"
        end
        sleep 1
        i += 1
      end while i <= 5 && !vm
      raise "Couldn't access nfcLease.info.entity" unless vm

      # Ignore sporadic connection errors caused by PR 1019166..
      # Three attempts are made to execute HttpNfcLeaseComplete.
      # Not critical if none goes through, as long as vm is obtained
      #
      # TODO: find the reason why HttpNfcLeaseComplete gets a wrong
      # response (RetrievePropertiesResponse)
      i = 0
      begin
        nfcLease.HttpNfcLeaseComplete
        puts "HttpNfcLeaseComplete succeeded"
      rescue RbVmomi::VIM::InvalidState
        puts "HttpNfcLeaseComplete already finished.."
      rescue Exception => e
        puts "HttpNfcLeaseComplete failed at iteration #{i} with exception: #{e}"
        i += 1
        retry if i < 3
        puts "Giving up HttpNfcLeaseComplete.."
      end
      vm
    end
  rescue Exception
    (nfcLease.HttpNfcLeaseAbort rescue nil) if nfcLease
    raise
  end
  
  def _handle_ost ost, opts = {}
    ost = Nokogiri::XML(ost)
    if opts[:vservice] == ['com.vmware.vim.vsm:extension_vservice']
      ost.xpath('//vmw:Annotations/vmw:Providers/vmw:Provider').each do |x|
        x['vmw:selected'] = 'selected'
      end
      ost.xpath('//vmw:Annotations/vmw:Providers').each do |x|
        x['vmw:selected'] = 'com.vmware.vim.vsm:extension_vservice'
      end
    end
    ost.to_s
  end
end
