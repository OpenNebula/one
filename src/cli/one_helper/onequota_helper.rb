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

require 'cli_helper'

class OneQuotaHelper

    LIMIT_DEFAULT   = "-1"
    LIMIT_UNLIMITED = "-2"

    EDITOR_PATH='/usr/bin/vi'

    HELP_QUOTA = <<-EOT.unindent
        #-----------------------------------------------------------------------
        # Supported quota limits:
        #
        #  DATASTORE = [
        #    ID     = <ID of the datastore>
        #    IMAGES = <Max. number of images in the datastore>
        #    SIZE   = <Max. storage capacity (Mb) used in the datastore>
        #  ]
        #
        #  VM = [
        #    VMS              = <Max. number of VMs>
        #    RUNNING_VMS      = <Max. number of running VMs>
        #    MEMORY           = <Max. allocated memory (MB)>
        #    RUNNING_MEMORY   = <Max. running memory (MB)>
        #    CPU              = <Max. allocated CPU>
        #    RUNNING_CPU      = <Max. running CPU>
        #    SYSTEM_DISK_SIZE = <Max. allocated system disk (MB)>
        #  ]
        #
        #  NETWORK = [
        #    ID     = <ID of the network>
        #    LEASES = <Max. number of IP leases from the network>
        #  ]
        #
        #  IMAGE = [
        #    ID     = <ID of the image>
        #    RVMS   = <Max. number of VMs using the image>
        #  ]
    EOT

    HELP_QUOTA_FOOTER = <<-EOT.unindent
        #
        #  In any quota:
        #    -1 means use the default limit (set with the 'defaultquota' command)
        #    -2 means unlimited.
        #
        #  The usage counters "*_USED" are shown for information
        #  purposes and will NOT be modified.
        #-----------------------------------------------------------------------
    EOT

    HELP_DEFAULT_QUOTA_FOOTER = <<-EOT.unindent
        #
        #  In any quota:
        #    -2 means unlimited.
        #
        #  The usage counters "*_USED" will always be 0 for the default
        #  quotas, and can be ignored.
        #-----------------------------------------------------------------------
    EOT

    def initialize(client = nil)
        @client=client
    end

    #  Edits the quota template of a resource
    #  @param [XMLElement] resource to get the current info from
    #  @param [String] path to the new contents. If nil a editor will be
    #         used
    #  @param [True|False] is_default To change the help text
    #  @return [String] contents of the new quotas
    def self.set_quota(resource, path, is_default=false)
        str = ""

        if path.nil?
            require 'tempfile'

            tmp  = Tempfile.new('one-cli')
            path = tmp.path

            tmp << HELP_QUOTA

            if (is_default)
                tmp << HELP_DEFAULT_QUOTA_FOOTER
            else
                tmp << HELP_QUOTA_FOOTER
            end

            tmp << resource.template_like_str("DATASTORE_QUOTA") << "\n"
            tmp << resource.template_like_str("VM_QUOTA") << "\n"
            tmp << resource.template_like_str("NETWORK_QUOTA") << "\n"
            tmp << resource.template_like_str("IMAGE_QUOTA") << "\n"

            tmp.close

            editor_path = ENV["EDITOR"] ? ENV["EDITOR"] : EDITOR_PATH
            system("#{editor_path} #{path}")

            unless $?.exitstatus == 0
                puts "Editor not defined"
                exit -1
            end

            str = File.read(path)

            File.unlink(path)
        else
            str = File.read(path)
        end

        str
    end

    #  Retrieves a clean quota template, without any existing resource
    #  information
    #  @param path [String] path to the new contents. If nil a editor will be
    #         used
    #  @return [String] contents of the new quotas
    def self.get_batch_quota(path)
        str = ""

        if path.nil?
            require 'tempfile'

            tmp  = Tempfile.new('one-cli')
            path = tmp.path

            tmp << HELP_QUOTA << "\n"

            tmp.close

            editor_path = ENV["EDITOR"] ? ENV["EDITOR"] : EDITOR_PATH
            system("#{editor_path} #{path}")

            unless $?.exitstatus == 0
                puts "Editor not defined"
                exit -1
            end

            str = File.read(path)

            File.unlink(path)
        else
            str = File.read(path)
        end

        str
    end

    #  Edits the quota template of a resource, adding the quotas set in str
    #  @param resource [PoolElement] to get the current info from
    #  @param str [String] quota template, created by get_batch_quota()
    #  @return [String, OpenNebula::Error] merged contents of the new quotas on
    #    success, Error if the user info could not be retrieved
    def self.merge_quota(resource, str)
        rc = resource.info

        if OpenNebula.is_error?(rc)
            return rc
        end

        # Instead of parsing the existing quotas, and deleting the ones that
        # conflict with the batch quota string, the new quotas are placed at
        # the end of the template sent to opennebula. This relies on the core
        # reading them in order and replacing the quotas with each new
        # appearance

        tmp_str = ""

        tmp_str << resource.template_like_str("DATASTORE_QUOTA") << "\n"
        tmp_str << resource.template_like_str("VM_QUOTA") << "\n"
        tmp_str << resource.template_like_str("NETWORK_QUOTA") << "\n"
        tmp_str << resource.template_like_str("IMAGE_QUOTA") << "\n"

        tmp_str << str

        return tmp_str
    end

    #  Outputs formated quota information to stdout
    #  @param qh [Hash] with the quotas for a given resource
    #  @param default_quotas_hash [XMLElement] with the default quota limits
    #  @param resource_id [Integer] user/group ID
    #
    def format_quota(qh, default_quotas, resource_id)
        str_h1="%-80s"

        puts

        CLIHelper.print_header(str_h1 % "VMS USAGE & QUOTAS",false)

        puts

        @default_quotas = default_quotas

        vm_quotas = [qh['VM_QUOTA']['VM']].flatten

        generic_quotas = get_generic_quotas

        # This initializes the VM quotas for users/groups that don't have any
        # resource usage yet. It not applied to oneamdin
        if vm_quotas[0].nil? && resource_id.to_i != 0
            limit = LIMIT_DEFAULT

            vm_quotas = [{
                "VMS"                   => limit,
                "VMS_USED"              => "0",
                "CPU"                   => limit,
                "CPU_USED"              => "0",
                "MEMORY"                => limit,
                "MEMORY_USED"           => "0",
                "RUNNING_VMS"           => limit,
                "RUNNING_VMS_USED"      => "0",
                "RUNNING_CPU"           => limit,
                "RUNNING_CPU_USED"      => "0",
                "RUNNING_MEMORY"        => limit,
                "RUNNING_MEMORY_USED"   => "0",
                "SYSTEM_DISK_SIZE"      => limit,
                "SYSTEM_DISK_SIZE_USED" => "0"
            }]

            generic_quotas.each do |q|
                vm_quotas[0][q] = limit
                vm_quotas[0]["#{q}_USED"] = "0"
                vm_quotas[0]["RUNNING_#{q}"] = limit
                vm_quotas[0]["RUNNING_#{q}_USED"] = "0"
            end
        end

        if !vm_quotas[0].nil?
            CLIHelper::ShowTable.new(nil, self) do
                column :"VMS", "", :right, :size=>17 do |d|
                    if !d.nil?
                        elem = 'VMS'
                        limit = d[elem]
                        limit = helper.get_default_limit(
                            limit, "VM_QUOTA/VM/#{elem}")

                        if limit == LIMIT_UNLIMITED
                            "%7d /       -" % [d["VMS_USED"]]
                        else
                            "%7d / %7d" % [d["VMS_USED"], limit]
                        end
                    end
                end

                column :"MEMORY", "", :right, :size=>20 do |d|
                    if !d.nil?
                        elem = 'MEMORY'
                        limit = d[elem]
                        limit = helper.get_default_limit(
                            limit, "VM_QUOTA/VM/#{elem}")

                        if limit == LIMIT_UNLIMITED
                            "%8s /        -" % [
                                OpenNebulaHelper.unit_to_str(d["MEMORY_USED"].to_i,{},"M")
                            ]
                        else
                            "%8s / %8s" % [
                                OpenNebulaHelper.unit_to_str(d["MEMORY_USED"].to_i,{},"M"),
                                OpenNebulaHelper.unit_to_str(limit.to_i,{},"M")
                            ]
                        end
                    end
                end

                column :"CPU", "", :right, :size=>20 do |d|
                    if !d.nil?
                        elem = 'CPU'
                        limit = d[elem]
                        limit = helper.get_default_limit(
                            limit, "VM_QUOTA/VM/#{elem}")

                        if limit == LIMIT_UNLIMITED
                            "%8.2f /        -" % [d["CPU_USED"]]
                        else
                            "%8.2f / %8.2f" % [d["CPU_USED"], limit]
                        end
                    end
                end

                column :"SYSTEM_DISK_SIZE", "", :right, :size=>20 do |d|
                    if !d.nil?
                        elem = 'SYSTEM_DISK_SIZE'
                        limit = d[elem]
                        limit = helper.get_default_limit(
                            limit, "VM_QUOTA/VM/#{elem}")

                        if limit == LIMIT_UNLIMITED
                            "%8s /        -" % [
                                OpenNebulaHelper.unit_to_str(d["SYSTEM_DISK_SIZE_USED"].to_i,{},"M")
                            ]
                        else
                            "%8s / %8s" % [
                                OpenNebulaHelper.unit_to_str(d["SYSTEM_DISK_SIZE_USED"].to_i,{},"M"),
                                OpenNebulaHelper.unit_to_str(limit.to_i,{},"M")
                            ]
                        end
                    end
                end
            end.show(vm_quotas, {})

            puts
        end

        CLIHelper.print_header(str_h1 % "VMS USAGE & QUOTAS - RUNNING",false)

        puts

        if !vm_quotas[0].nil?
            CLIHelper::ShowTable.new(nil, self) do
                column :"RUNNING VMS", "", :right, :size=>17 do |d|
                    if !d.nil?
                        elem = 'RUNNING_VMS'
                        limit = d[elem] || LIMIT_UNLIMITED
                        limit = helper.get_default_limit(
                            limit, "VM_QUOTA/VM/#{elem}")

                        if d["RUNNING_VMS_USED"].nil?
                            d["RUNNING_VMS_USED"] = 0
                        end

                        if limit == LIMIT_UNLIMITED
                            "%7d /       -" % [d["RUNNING_VMS_USED"]]
                        else
                            "%7d / %7d" % [d["RUNNING_VMS_USED"], limit]
                        end
                    end
                end

                column :"RUNNING MEMORY", "", :right, :size=>20 do |d|
                    if !d.nil?
                        elem = 'RUNNING_MEMORY'
                        limit = d[elem] || LIMIT_UNLIMITED
                        limit = helper.get_default_limit(
                            limit, "VM_QUOTA/VM/#{elem}")

                        if d["RUNNING_MEMORY_USED"].nil?
                            d["RUNNING_MEMORY_USED"] = 0
                        end

                        if limit == LIMIT_UNLIMITED
                            "%8s /        -" % [
                                OpenNebulaHelper.unit_to_str(d["RUNNING_MEMORY_USED"].to_i,{},"M")
                            ]
                        else
                            "%8s / %8s" % [
                                OpenNebulaHelper.unit_to_str(d["RUNNING_MEMORY_USED"].to_i,{},"M"),
                                OpenNebulaHelper.unit_to_str(limit.to_i,{},"M")
                            ]
                        end
                    end
                end

                column :"RUNNING CPU", "", :right, :size=>20 do |d|
                    if !d.nil?
                        elem = 'RUNNING_CPU'
                        limit = d[elem] || LIMIT_UNLIMITED
                        limit = helper.get_default_limit(
                            limit, "VM_QUOTA/VM/#{elem}")

                        if d["RUNNING_CPU_USED"].nil?
                            d["RUNNING_CPU_USED"] = 0
                        end

                        if limit == LIMIT_UNLIMITED
                            "%8.2f /        -" % [d["RUNNING_CPU_USED"]]
                        else
                            "%8.2f / %8.2f" % [d["RUNNING_CPU_USED"], limit]
                        end
                    end
                end
            end.show(vm_quotas, {})

            puts
        end

        if !generic_quotas.empty? && !vm_quotas[0].nil?
            CLIHelper.print_header(str_h1 % "VMS GENERIC QUOTAS",false)
            size = [80 / generic_quotas.length - 1, 18].min

            CLIHelper::ShowTable.new(nil, self) do
                generic_quotas.each do |elem|
                    column elem.to_sym, "", :right, :size=>size do |d|
                        if !d.nil?
                            limit = d[elem]
                            limit = helper.get_default_limit(
                                limit, "VM_QUOTA/VM/#{elem}")

                            if limit == LIMIT_UNLIMITED
                                "%6s /      -" % [d["#{elem}_USED"]]
                            else
                                "%6s / %6s" % [d["#{elem}_USED"], limit]
                            end
                        end
                    end
                end
            end.show(vm_quotas, {})

            puts

            CLIHelper.print_header(str_h1 % "VMS GENERIC RUNNING QUOTAS",false)
            size = [80 / generic_quotas.length - 1, 18].min

            CLIHelper::ShowTable.new(nil, self) do
                generic_quotas.each do |q|
                    elem = "RUNNING_#{q}"
                    column elem.to_sym, "", :right, :size=>size do |d|
                        if !d.nil?
                            limit = d[elem]
                            limit = helper.get_default_limit(
                                limit, "VM_QUOTA/VM/#{elem}")

                            if limit == LIMIT_UNLIMITED
                                "%6s /      -" % [d["#{elem}_USED"]]
                            else
                                "%6s / %6s" % [d["#{elem}_USED"], limit]
                            end
                        end
                    end
                end
            end.show(vm_quotas, {})

            puts
        end

        CLIHelper.print_header(str_h1 % "DATASTORE USAGE & QUOTAS",false)

        puts

        ds_quotas = [qh['DATASTORE_QUOTA']['DATASTORE']].flatten

        if !ds_quotas[0].nil?
            CLIHelper::ShowTable.new(nil, self) do
                column :"ID", "", :size=>12 do |d|
                    d["ID"] if !d.nil?
                end

                column :"IMAGES", "", :right, :size=>20 do |d|
                    if !d.nil?
                        elem = 'IMAGES'
                        limit = d[elem]
                        limit = helper.get_default_limit(
                            limit, "DATASTORE_QUOTA/DATASTORE[ID=#{d['ID']}]/#{elem}")

                        if limit == LIMIT_UNLIMITED
                            "%8d /        -" % [d["IMAGES_USED"]]
                        else
                            "%8d / %8d" % [d["IMAGES_USED"], limit]
                        end
                    end
                end

                column :"SIZE", "", :right, :size=>19 do |d|
                    if !d.nil?
                        elem = 'SIZE'
                        limit = d[elem]
                        limit = helper.get_default_limit(
                            limit, "DATASTORE_QUOTA/DATASTORE[ID=#{d['ID']}]/#{elem}")

                        if limit == LIMIT_UNLIMITED
                            "%8s /        -" % [
                                OpenNebulaHelper.unit_to_str(d["SIZE_USED"].to_i,{},"M")
                            ]
                        else
                            "%8s / %8s" % [
                                OpenNebulaHelper.unit_to_str(d["SIZE_USED"].to_i,{},"M"),
                                OpenNebulaHelper.unit_to_str(limit.to_i,{},"M")
                            ]
                        end
                    end
                end
            end.show(ds_quotas, {})

            puts
        end

        CLIHelper.print_header(str_h1 % "NETWORK USAGE & QUOTAS",false)

        puts

        net_quotas = [qh['NETWORK_QUOTA']['NETWORK']].flatten

        if !net_quotas[0].nil?
            CLIHelper::ShowTable.new(nil, self) do
                column :"ID", "", :size=>12 do |d|
                    d["ID"] if !d.nil?
                end

                column :"LEASES", "", :right, :size=>20 do |d|
                    if !d.nil?
                        elem = 'LEASES'
                        limit = d[elem]
                        limit = helper.get_default_limit(
                            limit, "NETWORK_QUOTA/NETWORK[ID=#{d['ID']}]/#{elem}")

                        if limit == LIMIT_UNLIMITED
                            "%8d /        -" % [d["LEASES_USED"]]
                        else
                            "%8d / %8d" % [d["LEASES_USED"], limit]
                        end
                    end
                end
            end.show(net_quotas, {})

            puts
        end

        CLIHelper.print_header(str_h1 % "IMAGE USAGE & QUOTAS",false)

        puts

        image_quotas = [qh['IMAGE_QUOTA']['IMAGE']].flatten

        if !image_quotas[0].nil?
            CLIHelper::ShowTable.new(nil, self) do
                column :"ID", "", :size=>12 do |d|
                    d["ID"] if !d.nil?
                end

                column :"RUNNING VMS", "", :right, :size=>20 do |d|
                    if !d.nil?
                        elem = 'RVMS'
                        limit = d[elem]
                        limit = helper.get_default_limit(
                            limit, "IMAGE_QUOTA/IMAGE[ID=#{d['ID']}]/RVMS")

                        if limit == LIMIT_UNLIMITED
                            "%8d /        -" % [d["RVMS_USED"]]
                        else
                            "%8d / %8d" % [d["RVMS_USED"], limit]
                        end
                    end
                end
            end.show(image_quotas, {})
        end
    end

    def get_default_limit(limit, xpath)
        if limit == LIMIT_DEFAULT
            if !@default_quotas.nil?
                limit = @default_quotas[xpath]

                limit = LIMIT_UNLIMITED if limit.nil? || limit == ""
            else
                limit = LIMIT_UNLIMITED
            end
        end

        return limit
    end

    private

    def get_generic_quotas
        conf = OpenNebula::System.new(@client).get_configuration

        return [] if OpenNebula.is_error?(conf)

        conf.retrieve_elements('/OPENNEBULA_CONFIGURATION/QUOTA_VM_ATTRIBUTE') || []
    rescue StandardError
        []
    end

end
