#!/usr/bin/ruby
ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    LIB_LOCATION      ||= '/usr/lib/one'
    RUBY_LIB_LOCATION ||= '/usr/lib/one/ruby'
    GEMS_LOCATION     ||= '/usr/share/one/gems'
else
    LIB_LOCATION      ||= ONE_LOCATION + '/lib'
    RUBY_LIB_LOCATION ||= ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     ||= ONE_LOCATION + '/share/gems'
end

# %%RUBYGEMS_SETUP_BEGIN%%
require 'load_opennebula_paths'
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION

require 'opennebula'
require 'base64'

_host   = ARGV[-1]
host_id = ARGV[-2]

client = OpenNebula::Client.new

vmpool = OpenNebula::VirtualMachinePool.new(
    client,
    OpenNebula::VirtualMachinePool::INFO_ALL_VM
)

rc = vmpool.info

return if OpenNebula.is_error?(rc)

result = ''
vmpool.each do |vm|
    begin
        vm.info

        next if vm['HISTORY_RECORDS/HISTORY/HID'].to_i != host_id.to_i

        next if vm['TEMPLATE/QEMU_GA_EXEC'].nil?

        vm_id  = vm['ID']
        pid    = vm_id.to_i

        stdout = Base64.strict_encode64("Execution finished for VM #{vm_id}")
        stderr = Base64.strict_encode64('')

        result << 'VM = [' \
                  " ID=\"#{vm_id}\"," \
                  " PID=\"#{pid}\"," \
                  ' STATUS="DONE",' \
                  ' RETURN_CODE="0",' \
                  " STDOUT=\"#{stdout}\"," \
                  " STDERR=\"#{stderr}\" ]\n"
    rescue StandardError
        next
    end
end

sleep 2

puts result
