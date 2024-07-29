# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

if !ONE_LOCATION
    LOG_LOCATION = "/var/log/one"
else
    LOG_LOCATION = ONE_LOCATION + "/var"
end

LOG              = LOG_LOCATION + "/onedb-fsck.log"

require 'nokogiri'

module OneDBPatch
    VERSION = "4.11.80"
    LOCAL_VERSION = "4.13.85"

    def is_hot_patch(ops)
        return true
    end

    def check_db_version(ops)
        db_version = read_db_version()

        if ( db_version[:version] != VERSION ||
             db_version[:local_version] != LOCAL_VERSION )

            raise <<-EOT
Version mismatch: patch file is for version
Shared: #{VERSION}, Local: #{LOCAL_VERSION}

Current database is version
Shared: #{db_version[:version]}, Local: #{db_version[:local_version]}
EOT
        end
    end

    def patch(ops)

        init_log_time()

        # 3718

        @db.transaction do

            # Move monitoring attributes in VM pool table, only for VMs in DONE

            @db.fetch("SELECT * FROM vm_pool WHERE state=6") do |row|
                doc = nokogiri_doc(row[:body], 'vm_pool')

                update_monitoring(doc.root.at_xpath("/VM"))

                @db[:vm_pool].where(:oid => row[:oid]).update(
                    :body => doc.root.to_s)
            end
            end

            log_time()

            # Move monitoring attributes in the history table, only for closed
            # records

            @db.transaction do
            @db.fetch("SELECT * FROM history WHERE etime<>0") do |row|
                doc = nokogiri_doc(row[:body], 'history')

                elem = doc.root.at_xpath("/HISTORY/VM")
                if !elem.nil?
                    update_monitoring(elem)
                end

                @db[:history].where(:vid => row[:vid], :seq => row[:seq]).update(
                    :body => doc.root.to_s)
            end

            log_time()
        end

        log_time()

        return true
    end

    def mv_monitoring(vm_elem, prev_name, new_name)
        elem = vm_elem.at_xpath(prev_name)

        if (!elem.nil?)
            vm_elem.at_xpath("MONITORING").add_child(
                vm_elem.document.create_element(new_name)).content = elem.text

            elem.remove
        end
    end

    def update_monitoring(vm_elem)
        vm_elem.add_child(vm_elem.document.create_element("MONITORING"))

        mv_monitoring(vm_elem, "CPU",    "CPU")
        mv_monitoring(vm_elem, "MEMORY", "MEMORY")
        mv_monitoring(vm_elem, "NET_RX", "NETRX")
        mv_monitoring(vm_elem, "NET_TX", "NETTX")

        mv_monitoring(vm_elem, "AZ_AVAILABILITY_SET_NAME",    "AZ_AVAILABILITY_SET_NAME")
        mv_monitoring(vm_elem, "AZ_CLOUD_SERVICE_NAME",       "AZ_CLOUD_SERVICE_NAME")
        mv_monitoring(vm_elem, "AZ_DATA_DISKS",               "AZ_DATA_DISKS")
        mv_monitoring(vm_elem, "AZ_DEPLOYMENT_NAME",          "AZ_DEPLOYMENT_NAME")
        mv_monitoring(vm_elem, "AZ_DISK_NAME",                "AZ_DISK_NAME")
        mv_monitoring(vm_elem, "AZ_HOSTNAME",                 "AZ_HOSTNAME")
        mv_monitoring(vm_elem, "AZ_IMAGE",                    "AZ_IMAGE")
        mv_monitoring(vm_elem, "AZ_IPADDRESS",                "AZ_IPADDRESS")
        mv_monitoring(vm_elem, "AZ_MEDIA_LINK",               "AZ_MEDIA_LINK")
        mv_monitoring(vm_elem, "AZ_OS_TYPE",                  "AZ_OS_TYPE")
        mv_monitoring(vm_elem, "AZ_ROLE_SIZE",                "AZ_ROLE_SIZE")
        mv_monitoring(vm_elem, "AZ_TCP_ENDPOINTS",            "AZ_TCP_ENDPOINTS")
        mv_monitoring(vm_elem, "AZ_UDP_ENDPOINTS",            "AZ_UDP_ENDPOINTS")
        mv_monitoring(vm_elem, "AZ_VIRTUAL_NETWORK_NAME",     "AZ_VIRTUAL_NETWORK_NAME")

        mv_monitoring(vm_elem, "SL_CRED_PASSWORD",            "SL_CRED_PASSWORD")
        mv_monitoring(vm_elem, "SL_CRED_USER",                "SL_CRED_USER")
        mv_monitoring(vm_elem, "SL_DOMAIN",                   "SL_DOMAIN")
        mv_monitoring(vm_elem, "SL_FULLYQUALIFIEDDOMAINNAME", "SL_FULLYQUALIFIEDDOMAINNAME")
        mv_monitoring(vm_elem, "SL_GLOBALIDENTIFIER",         "SL_GLOBALIDENTIFIER")
        mv_monitoring(vm_elem, "SL_HOSTNAME",                 "SL_HOSTNAME")
        mv_monitoring(vm_elem, "SL_ID",                       "SL_ID")
        mv_monitoring(vm_elem, "SL_MAXCPU",                   "SL_MAXCPU")
        mv_monitoring(vm_elem, "SL_MAXMEMORY",                "SL_MAXMEMORY")
        mv_monitoring(vm_elem, "SL_PRIMARYBACKENDIPADDRESS",  "SL_PRIMARYBACKENDIPADDRESS")
        mv_monitoring(vm_elem, "SL_PRIMARYIPADDRESS",         "SL_PRIMARYIPADDRESS")
        mv_monitoring(vm_elem, "SL_STARTCPUS",                "SL_STARTCPUS")
        mv_monitoring(vm_elem, "SL_UUID",                     "SL_UUID")

        mv_monitoring(vm_elem, "AWS_DNS_NAME",                "AWS_DNS_NAME")
        mv_monitoring(vm_elem, "AWS_PRIVATE_DNS_NAME",        "AWS_PRIVATE_DNS_NAME")
        mv_monitoring(vm_elem, "AWS_KEY_NAME",                "AWS_KEY_NAME")
        mv_monitoring(vm_elem, "AWS_AVAILABILITY_ZONE",       "AWS_AVAILABILITY_ZONE")
        mv_monitoring(vm_elem, "AWS_PLATFORM",                "AWS_PLATFORM")
        mv_monitoring(vm_elem, "AWS_VPC_ID",                  "AWS_VPC_ID")
        mv_monitoring(vm_elem, "AWS_PRIVATE_IP_ADDRESS",      "AWS_PRIVATE_IP_ADDRESS")
        mv_monitoring(vm_elem, "AWS_IP_ADDRESS",              "AWS_IP_ADDRESS")
        mv_monitoring(vm_elem, "AWS_SUBNET_ID",               "AWS_SUBNET_ID")
        mv_monitoring(vm_elem, "AWS_SECURITY_GROUPS",         "AWS_SECURITY_GROUPS")
        mv_monitoring(vm_elem, "AWS_INSTANCE_TYPE",           "AWS_INSTANCE_TYPE")

        mv_monitoring(vm_elem, "ESX_HOST",                    "ESX_HOST")
        mv_monitoring(vm_elem, "GUEST_IP",                    "GUEST_IP")
        mv_monitoring(vm_elem, "GUEST_STATE",                 "GUEST_STATE")
        mv_monitoring(vm_elem, "VMWARETOOLS_RUNNING_STATUS",  "VMWARETOOLS_RUNNING_STATUS")
        mv_monitoring(vm_elem, "VMWARETOOLS_VERSION",         "VMWARETOOLS_VERSION")
        mv_monitoring(vm_elem, "VMWARETOOLS_VERSION_STATUS",  "VMWARETOOLS_VERSION_STATUS")
    end
end
