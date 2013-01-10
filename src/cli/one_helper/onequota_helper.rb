# -------------------------------------------------------------------------- #
# Copyright 2002-2013, OpenNebula Project Leads (OpenNebula.org)             #
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

    EDITOR_PATH='/usr/bin/vi'

    #---------------------------------------------------------------------------
    #  Tables to format user quotas
    #---------------------------------------------------------------------------
    TABLE_DS = CLIHelper::ShowTable.new(nil, self) do
        column :"DATASTORE ID", "", :size=>12 do |d|
            d["ID"] if !d.nil?
        end

        column :"IMAGES", "", :right, :size=>20 do |d|
            "%8d / %8d" % [d["IMAGES_USED"], d["IMAGES"]] if !d.nil?
        end

        column :"SIZE", "", :right, :size=>19 do |d|
            "%8s / %8s" % [OpenNebulaHelper.unit_to_str(d["SIZE_USED"].to_i,{},"M"),
                OpenNebulaHelper.unit_to_str(d["SIZE"].to_i,{},"M")] if !d.nil?
        end
    end

    TABLE_NET = CLIHelper::ShowTable.new(nil, self) do
        column :"NETWORK ID", "", :size=>12 do |d|
            d["ID"] if !d.nil?
        end

        column :"LEASES", "", :right, :size=>20 do |d|
            "%8d / %8d" % [d["LEASES_USED"], d["LEASES"]] if !d.nil?
        end
    end

    TABLE_VM = CLIHelper::ShowTable.new(nil, self) do

        column :"NUMBER OF VMS", "", :right, :size=>20 do |d|
            "%8d / %8d" % [d["VMS_USED"], d["VMS"]] if !d.nil?
        end

        column :"MEMORY", "", :right, :size=>20 do |d|
            "%8s / %8s" % [OpenNebulaHelper.unit_to_str(d["MEMORY_USED"].to_i,{},"M"),
                OpenNebulaHelper.unit_to_str(d["MEMORY"].to_i,{},"M")] if !d.nil?
        end

        column :"CPU", "", :right, :size=>20 do |d|
            "%8.2f / %8.2f" % [d["CPU_USED"], d["CPU"]] if !d.nil?
        end
    end

    TABLE_IMG = CLIHelper::ShowTable.new(nil, self) do
        column :"IMAGE ID", "", :size=>12 do |d|
            d["ID"] if !d.nil?
        end

        column :"RUNNING VMS", "", :right, :size=>20 do |d|
            "%8d / %8d" % [d["RVMS_USED"], d["RVMS"]] if !d.nil?
        end
    end

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
        #    VMS    = <Max. number of VMs>
        #    MEMORY = <Max. allocated memory (Mb)>
        #    CPU    = <Max. allocated CPU>
        #  ]
        #
        #  NETWORK = [
        #    ID     = <ID of the network>
        #    LEASES = <Max. number of IP leases from the network>
        #  ]
        #
        #  IMAGE = [
        #    ID        = <ID of the image>
        #    RVMS = <Max. number of VMs using the image>
        #  ]
        #
        #  In any quota 0 means unlimited. The usage counters "*_USED" are
        #  shown for information purposes and will NOT be modified.
        #-----------------------------------------------------------------------
    EOT

    #  Edits the quota template of a resource
    #  @param resource [PoolElement] to get the current info from
    #  @param path [String] path to the new contents. If nil a editor will be 
    #         used
    #  @return [String] contents of the new quotas
    def self.set_quota(resource, path)
        str = ""

        if path.nil?
            require 'tempfile'

            tmp  = Tempfile.new('one-cli')
            path = tmp.path

            rc = resource.info

            if OpenNebula.is_error?(rc)
                puts rc.message
                exit -1
            end

            tmp << HELP_QUOTA
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
    #
    def self.format_quota(qh)
        str_h1="%-80s"

        puts

        CLIHelper.print_header(str_h1 % "RESOURCE USAGE & QUOTAS",false)

        puts

        vm_quotas = [qh['VM_QUOTA']['VM']].flatten
        if !vm_quotas[0].nil?
            TABLE_VM.show(vm_quotas, {})
            puts
        end

        ds_quotas = [qh['DATASTORE_QUOTA']['DATASTORE']].flatten
        if !ds_quotas[0].nil?
            TABLE_DS.show(ds_quotas, {})
            puts
        end

        net_quotas = [qh['NETWORK_QUOTA']['NETWORK']].flatten
        if !net_quotas[0].nil?
            TABLE_NET.show(net_quotas, {})
            puts
        end

        image_quotas = [qh['IMAGE_QUOTA']['IMAGE']].flatten
        if !image_quotas[0].nil?
            TABLE_IMG.show(image_quotas, {})
        end
    end
end
