# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

require 'base64'
require 'one_helper/onehost_helper'

class OneProvisionHostHelper < OpenNebulaHelper::OneHelper

    def self.rname
        "HOST"
    end

    def self.conf_file
        "oneprovision_host.yaml"
    end

    def self.state_to_str(id)
        id        = id.to_i
        state_str = Host::HOST_STATES[id]

        Host::SHORT_HOST_STATES[state_str]
    end

    def factory(id=nil)
        if id
            OpenNebula::Host.new_with_id(id, @client)
        else
            xml=OpenNebula::Host.build_xml
            OpenNebula::Host.new(xml, @client)
        end
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do

            column :ID, "ONE identifier for Host", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Host", :left, :size=>15 do |d|
                d["NAME"]
            end

            column :CLUSTER, "Name of the Cluster", :left, :size=>9 do |d|
                OpenNebulaHelper.cluster_str(d["CLUSTER"])
            end

            column :RVM, "Number of Virtual Machines running", :size=>3 do |d|
                d["HOST_SHARE"]["RUNNING_VMS"]
            end

            column :ZVM, "Number of Virtual Machine zombies", :size=>3 do |d|
                d["TEMPLATE"]["TOTAL_ZOMBIES"] || 0
            end

            column :STAT, "Host status", :left, :size=>6 do |d|
                OneHostHelper.state_to_str(d["STATE"])
            end

            column :PROVIDER, "Provision driver", :size=>8 do |d|
                d['TEMPLATE']['PM_MAD'].nil? ? '-' : d['TEMPLATE']['PM_MAD']
            end

            column :VM_MAD, "Virtual Machine driver", :size=>8 do |d|
                d["VM_MAD"]
            end

            default :ID, :NAME, :CLUSTER, :RVM, :PROVIDER, :VM_MAD, :STAT
        end

        table
    end

    def factory(id=nil)
        if id
            OpenNebula::Host.new_with_id(id, @client)
        else
            xml=OpenNebula::Host.build_xml
            OpenNebula::Host.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        OpenNebula::HostPool.new(@client)
    end

    def check_host(pm_mad)
        if pm_mad.nil? || pm_mad.empty?
            fail('Not a valid bare metal host')
        end
    end

    def running_vms?(host)
        host["HOST_SHARE/RUNNING_VMS"].to_i > 0


#        if host["HOST_SHARE/RUNNING_VMS"].to_i > 0
#            raise OneProvisionLoopException.new('There are running VMS on the host, terminate them and then delete the host.')
#        end
    end

    def poll(host)
        poll = monitoring(host)

        if poll.has_key? 'GUEST_IP_ADDRESSES'
            name = poll['GUEST_IP_ADDRESSES'].split(',')[0][1..-1] #TODO
        elsif poll.has_key? 'AWS_PUBLIC_IP_ADDRESS'
            name = poll['AWS_PUBLIC_IP_ADDRESS'][2..-3]
        else
            fail('Failed to get provision name')
        end

        name
    end

    def monitoring(host)
        host.info

        pm_mad = host['TEMPLATE/PM_MAD']
        deploy_id = host['TEMPLATE/PROVISION/DEPLOY_ID']
        name = host.name
        id = host.id

        check_host(pm_mad)

        $logger.debug("Monitoring host: #{id.to_s}")

        $common_helper.retry_loop 'Monitoring metrics failed to parse' do
            pm_ret = $common_helper.pm_driver_action(pm_mad, 'poll', [deploy_id, name], host)

            begin
                poll = {}

                pm_ret.split(' ').map{|x| x.split('=', 2)}.each do |key, value|
                    poll[ key.upcase ] = value
                end

                poll
            rescue
                raise $common_helper.OneProvisionLoopException
            end
        end
    end

    def create_host(dfile, cluster, playbook)
        xhost = OpenNebula::XMLElement.new
        xhost.initialize_xml(dfile, 'HOST')

        $logger.debug("Creating OpenNebula host: #{xhost['NAME']}")

        one = OpenNebula::Client.new()
        host = OpenNebula::Host.new(OpenNebula::Host.build_xml, one)
        host.allocate(xhost['NAME'], xhost['TEMPLATE/IM_MAD'], xhost['TEMPLATE/VM_MAD'], cluster)
        host.update(xhost.template_str, true)
        host.update("ANSIBLE_PLAYBOOK=#{playbook}", true) if !playbook.nil?
        host.offline
        host.info

        $logger.debug("host created with ID: #{host['ID']}")

        host
    end

    def resume_host(host)
        host.info

        pm_mad = host['TEMPLATE/PM_MAD']

        check_host(pm_mad)

        begin
            # create resume deployment file
            resumeFile = Tempfile.new("xmlResume")
            resumeFile.close()
            $common_helper.write_file_log(resumeFile.path, host.to_xml)

            $logger.info("Resuming host: #{host.id.to_s}")
            $common_helper.pm_driver_action(pm_mad, 'deploy', [resumeFile.path, host.name], host)

            $logger.debug("Enabling OpenNebula host: #{host.id.to_s}")

            name = poll(host)
            host.rename(name)
            host.enable
        ensure
            resumeFile.unlink()
        end
    end

    def poweroff_host(host)
        host.info

        pm_mad = host['TEMPLATE/PM_MAD']

        deploy_id = host['TEMPLATE/PROVISION/DEPLOY_ID']
        name = host.name

        check_host(pm_mad)

        $logger.info("Powering off host: #{host.id.to_s}")
        $common_helper.pm_driver_action(pm_mad, 'shutdown', [deploy_id, name, 'SHUTDOWN_POWEROFF'], host)

        $logger.debug("Offlining OpenNebula host: #{host.id.to_s}")

        #Fix broken pipe exception on ubuntu 14.04
        host.info

        host.offline
    end

    def reboot_host(host, options)
        begin
            reset_host(host, (options.has_key? :hard))
        rescue => e
            $common_helper.fail("#{(options.has_key? :hard) ? "Reset" : "Reboot"} failed on exception: #{e.to_s}")
        end
    end

    def reset_host(host, hard)
        if hard
            reset_reboot(host, 'reset', 'Resetting')
            name = poll(host)
            host.rename(name)
        else
            reset_reboot(host, 'reboot', 'Rebooting')
        end
    end

    def reset_reboot(host, action, message)
        host.info

        pm_mad = host['TEMPLATE/PM_MAD']
        deploy_id = host['TEMPLATE/PROVISION/DEPLOY_ID']
        name = host.name

        check_host(pm_mad)

        $logger.debug("Offlining OpenNebula host: #{host.id.to_s}")
        host.offline

        $logger.info("#{message} host: #{host.id.to_s}")
        $common_helper.pm_driver_action(pm_mad, action, [deploy_id, name], host)

        $logger.debug("Enabling OpenNebula host: #{host.id.to_s}")

        host.info
        host.enable
    end

    def delete_host(host)
        pm_mad = host['TEMPLATE/PM_MAD']
        deploy_id = host['TEMPLATE/PROVISION/DEPLOY_ID']
        name = host.name

        check_host(pm_mad)

        # offline ONE host
        if host.state != 8
            $logger.debug("Offlining OpenNebula host: #{host.id.to_s}")

            $mutex.synchronize do
                rc = host.offline
                if OpenNebula.is_error?(rc)
                    raise OneProvisionLoopException.new(rc.message)
                end
            end
        end

        # unprovision host
        $logger.debug("Undeploying host: #{host.id}")

        $common_helper.pm_driver_action(pm_mad, 'cancel', [deploy_id, name], host)

        # delete ONE host
        $logger.debug("Deleting OpenNebula host: #{host.id}")

        $mutex.synchronize do
            # Fix ubuntu 14.04 borken pipe
            host.info

            rc = host.delete
            if OpenNebula.is_error?(rc)
                raise OneProvisionLoopException.new(rc.message)
            end
        end
    end

    def configure_host(hosts, options)
        configured = ""

        hosts.each do |host|
            host.info

            pm_mad = host['TEMPLATE/PM_MAD']
            status = host['TEMPLATE/PROVISION_CONFIGURATION_STATUS']

            check_host(pm_mad)

            if (status == 'configured' && (!options.has_key? :force))
                configured = configured && true
            else
                configured = configured && false
            end
        end

        if (configured && (!options.has_key? :force))
            $common_helper.fail('Hosts are already configured')
        end

        $ansible_helper.configure(hosts)
    end

    def ssh_host(host, args)
        host.info

        ip = host["NAME"]
        private_key = host["TEMPLATE/PROVISION_CONNECTION/PRIVATE_KEY"]
        remote_user = host["TEMPLATE/PROVISION_CONNECTION/REMOTE_USER"]

        exec("ssh -i #{private_key} #{remote_user}@#{ip} '#{args[1]}'")
    end
end
